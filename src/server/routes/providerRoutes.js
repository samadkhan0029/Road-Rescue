import express from 'express';
import { searchProviders } from '../controllers/providerController.js';

const router = express.Router();

router.get('/search', searchProviders);

export default router;
