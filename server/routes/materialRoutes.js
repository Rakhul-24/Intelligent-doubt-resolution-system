import express from 'express';
import {
  uploadMaterial,
  getAllMaterials,
  getStaffMaterials,
  updateMaterial,
  deleteMaterial,
} from '../controllers/materialController.js';
import { authMiddleware, staffOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/upload', authMiddleware, staffOnly, uploadMaterial);
router.get('/', authMiddleware, getAllMaterials);
router.get('/staff', authMiddleware, staffOnly, getStaffMaterials);
router.put('/:materialId', authMiddleware, staffOnly, updateMaterial);
router.delete('/:materialId', authMiddleware, staffOnly, deleteMaterial);

export default router;
