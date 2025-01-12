import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import {createServer} from 'http';
import {initSocket} from "./services/socket.js";
import clientsRoutes from "./routes/clients.js"
import authRoutes from './routes/auth.js';
import sharedRoutes from './routes/shared.js';
import utilityRoutes from './routes/utility.js';
import staffRoutes from './routes/staff.js'
import adminRoutes from './routes/admin.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.ORIGIN,
    credentials: true,
}));

const httpServer = createServer(app);
initSocket(httpServer); // Initialize socket.io with the server
app.use('/uploads', express.static('uploads')); // Serve static files

app.use(express.json());
app.use(cookieParser());
app.use('/auth', authRoutes);
app.use('/shared', sharedRoutes);
app.use('/utility', utilityRoutes);
app.use('/staff', staffRoutes);
app.use('/admin', adminRoutes);
app.use('/client', clientsRoutes);

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
