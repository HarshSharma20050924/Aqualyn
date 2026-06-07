import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../../core/utils/catchAsync';
import { AppError } from '../../core/exceptions/AppError';
import { UploadService } from './upload.service';

export const uploadFile = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    if (!req.file) {
        return next(new AppError('No file uploaded', 400));
    }

    const result = await UploadService.uploadFile(req.file);
    res.json({ success: true, ...result });
});
