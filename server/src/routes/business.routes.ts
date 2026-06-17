import { Router } from 'express';
import {
  listBusinesses,
  getBusiness,
  createBusiness,
  updateBusiness,
  createProduct,
  trackWhatsAppClick,
  listCategories,
  createReview,
  listReviews,
  listMyBusinesses,
} from '../controllers/business.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/categories', listCategories);
router.get('/my', requireAuth, listMyBusinesses);
router.get('/', listBusinesses);
router.get('/:id', getBusiness);
router.post('/', requireAuth, createBusiness);
router.patch('/:id', requireAuth, updateBusiness);
router.post('/:id/products', requireAuth, createProduct);
router.post('/:id/whatsapp-click', trackWhatsAppClick);
router.get('/:id/reviews', listReviews);
router.post('/:id/reviews', requireAuth, createReview);

export default router;
