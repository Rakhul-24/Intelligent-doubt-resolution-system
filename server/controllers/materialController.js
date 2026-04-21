import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  createMaterialRecord,
  deleteMaterialRecord,
  getMaterialsByStaff,
  getUserById,
  listMaterials,
  publicMaterial,
  publicUser,
  updateMaterialRecord,
} from '../lib/firestoreStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/materials');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|ppt|pptx|jpg|jpeg|png|gif|mp4|webm|ogg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb(new Error('Invalid file type. Allowed: PDF, Docs, PPT, Images, Video (MP4/WebM).'));
  },
}).single('file');

export const uploadMaterial = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { title, description, subject, topic } = req.body;
      const fileUrl = req.file ? `/uploads/materials/${req.file.filename}` : null;

      if (!title || !subject || !fileUrl) {
        return res.status(400).json({
          error: 'Title, subject, and file are required. Please select a file to upload.',
        });
      }

      const fileType = path.extname(req.file.originalname).toLowerCase().replace('.', '');
      const material = await createMaterialRecord({
        description,
        fileType: fileType || 'pdf',
        fileUrl,
        staffId: req.userId,
        subject,
        title,
        topic,
      });
      const staff = await getUserById(req.userId);

      res.status(201).json({
        success: true,
        message: 'Material uploaded successfully',
        material: {
          ...publicMaterial(material),
          staffId: staff ? publicUser(staff, ['name', 'email', 'subject']) : null,
        },
      });
    } catch (error) {
      console.error('Upload material error:', error);
      res.status(500).json({ error: 'Failed to upload material' });
    }
  });
};

export const getAllMaterials = async (req, res) => {
  try {
    const materials = [...(await listMaterials())].sort(
      (left, right) =>
        new Date(right.uploadedAt || 0).getTime() - new Date(left.uploadedAt || 0).getTime()
    );
    const staffUsers = await Promise.all(
      [...new Set(materials.map((material) => material.staffId).filter(Boolean))].map((userId) =>
        getUserById(userId)
      )
    );
    const staffMap = new Map(
      staffUsers
        .filter(Boolean)
        .map((user) => [user._id, publicUser(user, ['name', 'email', 'subject'])])
    );

    res.json({
      success: true,
      materials: materials.map((material) => ({
        ...publicMaterial(material),
        staffId: material.staffId ? staffMap.get(material.staffId) || null : null,
      })),
    });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
};

export const getStaffMaterials = async (req, res) => {
  try {
    const materials = [...(await getMaterialsByStaff(req.userId))].sort(
      (left, right) =>
        new Date(right.uploadedAt || 0).getTime() - new Date(left.uploadedAt || 0).getTime()
    );
    const staff = await getUserById(req.userId);

    res.json({
      success: true,
      materials: materials.map((material) => ({
        ...publicMaterial(material),
        staffId: staff ? publicUser(staff, ['name', 'email', 'subject']) : null,
      })),
    });
  } catch (error) {
    console.error('Get staff materials error:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
};

export const updateMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const { title, description, subject, topic, fileUrl, fileType } = req.body;
    const material = await updateMaterialRecord(materialId, {
      description,
      fileType,
      fileUrl,
      subject,
      title,
      topic,
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    const staff = material.staffId ? await getUserById(material.staffId) : null;

    res.json({
      success: true,
      message: 'Material updated successfully',
      material: {
        ...publicMaterial(material),
        staffId: staff ? publicUser(staff, ['name', 'email', 'subject']) : null,
      },
    });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ error: 'Failed to update material' });
  }
};

export const deleteMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const material = await deleteMaterialRecord(materialId);

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: 'Failed to delete material' });
  }
};
