import { put } from '@vercel/blob';
import sharp from 'sharp';

export class UploadService {
    static async uploadFile(file: any) {
        let fileBuffer = file.buffer;
        let fileName = file.originalname;

        // Optimize if it's an image
        if (file.mimetype.startsWith('image/')) {
            try {
                const optimizedBuffer = await sharp(file.buffer)
                    .rotate() // Auto-rotate based on EXIF
                    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }) // Limit size for feed
                    .jpeg({ quality: 80, mozjpeg: true }) // High quality compression
                    .toBuffer();
                
                fileBuffer = optimizedBuffer;
                // Rename to .jpg for consistency since we converted
                fileName = fileName.replace(/\.[^/.]+$/, "") + ".jpg";
            } catch (err) {
                console.error('[UploadService] Sharp optimization failed, using original:', err);
            }
        }

        const token = process.env.BLOB_READ_WRITE_TOKEN;
        if (!token) {
            throw new Error('Server misconfiguration: missing blob token');
        }

        const blob = await put(fileName, fileBuffer, {
            access: 'public',
            addRandomSuffix: true,
            token
        });

        return {
            url: blob.url,
            filename: blob.pathname,
            mimetype: file.mimetype
        };
    }
}
