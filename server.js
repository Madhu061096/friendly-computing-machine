const path = require('path');
const mongoose = require('mongoose');
const Msg = require('./models/message');
const mongoDB = 'mongodb+srv://BidRoom:9d5p6pZSL71mcV5g@cluster0.ms6xi.mongodb.net/test';

const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');

const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
  console.log('connected')
}).catch(err => console.log(err));
// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Bid-Room';

// Run when client connects
io.on('connection', (socket) => {

  Msg.find().then(result => {
        socket.emit('output-messages', result)
    })
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit('message', formatMessage(botName, 'Welcome to Room!'));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // Listen for chatMessage
  // socket.on('chatMessage', msg => {
  //   const user = getCurrentUser(socket.id);
  //   io.to(user.room).emit('message', formatMessage(user.username, msg));
  // });




  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);
    const message = new Msg({ username: user.username, text: msg });
    message.save().then(() => {
      io.emit('message', message)
    })
   
  });
  

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
