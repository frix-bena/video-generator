import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createApiRouter } from './apiRouter.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Mount API router at /api
app.use('/api', createApiRouter());

// Root health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'online',
    service: 'Cinegen AI Video Generation Backend',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`[Cinegen Backend] Server running on http://localhost:${PORT}`);
  console.log(`[Cinegen Backend] API available at http://localhost:${PORT}/api/generate-video`);
  console.log(`[Cinegen Backend] Replicate Token Configured: ${Boolean(process.env.REPLICATE_API_TOKEN)}`);
  console.log(`[Cinegen Backend] Fal.ai Key Configured: ${Boolean(process.env.FAL_KEY)}`);
});
