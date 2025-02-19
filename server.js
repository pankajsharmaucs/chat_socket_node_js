import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Set up Express server and HTTP
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);

// Serve static HTML file
app.use(express.static('public'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {})
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
        console.log('A user has been connected');
        
        // Fetch old messages when a new user connects
        Message.find().sort({ createdAt: 1 }).limit(50)  // Get the first 50 messages, sorted by creation date
            .then(messages => {
                // Emit old messages to the new user
                socket.emit('oldMessages', messages);
            })
            .catch(err => console.log(err));

        // Listen for messages from the client
        socket.on('sendMessage', async (data) => {
            // Save message to MongoDB
            const message = new Message(data);
            await message.save();

            // Emit the new message to all connected clients
            io.emit('newMessage', data);
        });

        socket.on('disconnect', () => {
            console.log('A user has been disconnected');
        });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`);
});
