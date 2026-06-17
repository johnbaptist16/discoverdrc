import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { addFavorite, removeFavorite, listFavorites } from '../controllers/favorites.controller';

const router = Router();
router.get('/', requireAuth, listFavorites);
router.post('/:id', requireAuth, addFavorite);
router.delete('/:id', requireAuth, removeFavorite);
export default router;
