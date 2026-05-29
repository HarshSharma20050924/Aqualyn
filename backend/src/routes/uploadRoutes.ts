import { Router } from 'express';
import multer from 'multer';
import { put } from '@vercel/blob';
import sharp from 'sharp';
import { verifyToken } from '../middleware/auth';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

router.post('/', verifyToken, upload.single('file'), async (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    let fileBuffer = req.file.buffer;
    let fileName = req.file.originalname;

    // Optimize if it's an image
    if (req.file.mimetype.startsWith('image/')) {
      try {
        const optimizedBuffer = await sharp(req.file.buffer)
          .rotate() // Auto-rotate based on EXIF
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }) // Limit size for feed
          .jpeg({ quality: 80, mozjpeg: true }) // High quality compression
          .toBuffer();
        
        fileBuffer = optimizedBuffer;
        // Rename to .jpg for consistency since we converted
        fileName = fileName.replace(/\.[^/.]+$/, "") + ".jpg";
      } catch (err) {
        console.error('[Upload] Sharp optimization failed, using original:', err);
      }
    }

    // Upload to Vercel Blob
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      console.error('[Upload] Missing BLOB_READ_WRITE_TOKEN environment variable');
      return res.status(500).json({ error: 'Server misconfiguration: missing blob token' });
    }

    const blob = await put(fileName, fileBuffer, {
      access: 'public',
      addRandomSuffix: true,
      token
    });

    res.json({
      success: true,
      url: blob.url,
      filename: blob.pathname,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({ error: 'Upload process failed' });
  }
});

export default router;
