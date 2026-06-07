import { Router } from 'express';
import multer from 'multer';
import { verifyToken } from '../../middleware/auth';
import { uploadFile } from './upload.controller';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

router.post('/', verifyToken, upload.single('file'), uploadFile);

export default router;
