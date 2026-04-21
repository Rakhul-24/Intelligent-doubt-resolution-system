const userSockets = {}; // Map to store user socket connections

export const handleSocketConnection = (socket, io) => {
  console.log(`✓ User connected: ${socket.id}`);

  // Handle user join
  socket.on('user_join', (userId) => {
    userSockets[userId] = socket.id;
    socket.join(userId);
    io.emit('user_online', { userId, status: 'online' });
  });

  // Handle sending message
  socket.on('send_message', async (data) => {
    try {
      const { senderId, receiverId, message, attachment, timestamp, _id } = data;
      const messagePayload = {
        _id,
        senderId,
        receiverId,
        message,
        attachment: attachment || null,
        timestamp: timestamp || new Date().toISOString(),
      };

      // Emit to receiver
      io.to(receiverId).emit('receive_message', messagePayload);

      // Emit confirmation to sender without re-persisting the message.
      socket.emit('message_sent', messagePayload);
    } catch (error) {
      console.error('Socket error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log(`✗ User disconnected: ${socket.id}`);
    for (let userId in userSockets) {
      if (userSockets[userId] === socket.id) {
        delete userSockets[userId];
        io.emit('user_offline', { userId, status: 'offline' });
        break;
      }
    }
  });

  // Handle typing indicator
  socket.on('user_typing', (data) => {
    const { senderId, receiverId } = data;
    const receiverSocketId = userSockets[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing_status', { senderId });
    }
  });

  // Handle stop typing
  socket.on('user_stop_typing', (data) => {
    const { senderId, receiverId } = data;
    const receiverSocketId = userSockets[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_stop_typing_status', { senderId });
    }
  });
};
