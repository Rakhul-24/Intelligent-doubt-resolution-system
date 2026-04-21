import express from 'express';
import {
  createDoubt,
  getStudentDoubts,
  getStaffDoubts,
  updateDoubtStatus,
} from '../controllers/doubtController.js';
import {
  authMiddleware,
  studentOnly,
  staffOnly,
} from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, studentOnly, createDoubt);
router.get('/student', authMiddleware, studentOnly, getStudentDoubts);
router.get('/staff', authMiddleware, staffOnly, getStaffDoubts);
router.put('/:doubtId', authMiddleware, staffOnly, updateDoubtStatus);

export default router;
