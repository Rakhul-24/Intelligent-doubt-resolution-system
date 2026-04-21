import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getFirebaseStatus } from './lib/firebase.js';
import authRoutes from './routes/authRoutes.js';
import slotRoutes from './routes/slotRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import doubtRoutes from './routes/doubtRoutes.js';
import { handleSocketConnection } from './socket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const firebaseStatus = getFirebaseStatus();
if (firebaseStatus.connected) {
  console.log('Firebase connected');
} else {
  console.error('Firebase initialization error:', firebaseStatus.error);
}

io.on('connection', (socket) => {
  handleSocketConnection(socket, io);
});

app.set('io', io);

app.use('/api/auth', authRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/doubts', doubtRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'Server is running',
    database: getFirebaseStatus(),
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
