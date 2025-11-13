import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from'./routes/authRoutes.js';
import connectDB from "./config/db.js";
// import { initModels } from './models/index.js';

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 8000;
//initModels().then(() => {
  app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
//});
