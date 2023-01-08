import { authenticateUser, verifySession } from '../middlewares/verifyAuthorizationMiddleware.js';

import { Router } from 'express';
import { search } from '../controllers/searchControllers.js';

const router = Router();

router.use('/search', authenticateUser, verifySession, search);

export default router;
