import express from 'express';
import {
  register,
  login,
  googleAuth,
  getProfile,
  updateProfile,
  getAllStaff,
  getAllStudents,
  getAllUsers,
} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.get('/staff', authMiddleware, getAllStaff);
router.get('/students', authMiddleware, getAllStudents);
router.get('/users', authMiddleware, getAllUsers);

export default router;
