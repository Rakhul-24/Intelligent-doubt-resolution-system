import express from 'express';
import {
  createSlotForDoubt,
  getStaffSlots,
  getStudentSlots,
  getSlotByLink,
  joinSlotViaLink,
  confirmSlot,
  deleteSlot,
} from '../controllers/slotController.js';
import { authMiddleware, staffOnly, studentOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Common: Link Preview
router.get('/link/:linkId', authMiddleware, getSlotByLink);

// Staff routes
router.post('/create-for-doubt', authMiddleware, staffOnly, createSlotForDoubt);
router.get('/staff', authMiddleware, staffOnly, getStaffSlots);
router.delete('/:slotId', authMiddleware, staffOnly, deleteSlot);

// Student routes
router.get('/my-slots', authMiddleware, studentOnly, getStudentSlots);
router.post('/join/:linkId', authMiddleware, studentOnly, joinSlotViaLink);
router.put('/:slotId/confirm', authMiddleware, studentOnly, confirmSlot);

export default router;
