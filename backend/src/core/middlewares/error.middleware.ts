import { Request, Response, NextFunction } from 'express';
import { AppError } from '../exceptions/AppError';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for dev
    console.error(err);

    // Zod Validation Error
    if (err instanceof ZodError) {
        const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        error = new AppError(message, 400);
    }

    // Prisma Errors (Example handling)
    if (err.code === 'P2002') {
        const message = 'Duplicate field value entered';
        error = new AppError(message, 400);
    }
    
    if (err.code === 'P2025') {
        const message = 'Record not found';
        error = new AppError(message, 404);
    }

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server Error';

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
