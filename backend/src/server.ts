import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import eligibilityRoutes from './routes/eligibility';
import claimsRoutes from './routes/claims';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/eligibility', eligibilityRoutes);
app.use('/api/claims', claimsRoutes);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));

