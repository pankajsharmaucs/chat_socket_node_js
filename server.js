import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';  // Named import
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Set up Express server and HTTP
dotenv.config();
// Create Express app
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);  // Initialize Socket.IO with the server
// Serve static HTML file
app.use(express.static('public'));


// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { })
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log(err));

// Mongoose Schema 
const MessageSchema = new mongoose.Schema({
  username: String,
  message: String,
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', MessageSchema);


// Handle Socket Connection
io.on('connection', (socket) => {
  console.log('A user connected');
  
  // Listen for messages from the client
  socket.on('sendMessage', async (data) => {
    // Save message to MongoDB
    const message = new Message(data);
    await message.save();

    // Emit the new message to all connected clients
    io.emit('newMessage', data);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start server
server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
