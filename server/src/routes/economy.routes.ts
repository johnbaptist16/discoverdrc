import { Router } from 'express';
import { getRates, getNews } from '../controllers/economy.controller';

const router = Router();

router.get('/rates', getRates);
router.get('/news', getNews);

export default router;
