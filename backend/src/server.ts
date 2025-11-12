import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import eligibilityRoutes from './routes/eligibility';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/eligibility', eligibilityRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));

