const prisma = require('../config/prisma');

const chatSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`👤 User connected: ${socket.id}`);

    // Join user to their personal room
    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // Handle new message
    socket.on('sendMessage', async (data) => {
      try {
        const { senderId, receiverId, message } = data;

        // Save message to database
        const newMessage = await prisma.chat.create({
          data: {
            senderId: parseInt(senderId),
            receiverId: parseInt(receiverId),
            message
          }
        });

        // Emit to both sender and receiver
        io.to(`user_${senderId}`).emit('messageReceived', newMessage);
        io.to(`user_${receiverId}`).emit('messageReceived', newMessage);

        // Emit chat event
        const eventEmitter = require('../events/eventEmitter');
        eventEmitter.emit('chat:newMessage', {
          senderId,
          receiverId,
          message
        });

      } catch (error) {
        console.error('Chat error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      socket.to(`user_${data.receiverId}`).emit('userTyping', {
        senderId: data.senderId,
        isTyping: true
      });
    });

    socket.on('stopTyping', (data) => {
      socket.to(`user_${data.receiverId}`).emit('userTyping', {
        senderId: data.senderId,
        isTyping: false
      });
    });

    socket.on('disconnect', () => {
      console.log(`👤 User disconnected: ${socket.id}`);
    });
  });
};

module.exports = chatSocket;