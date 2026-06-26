import { Request, Response, NextFunction } from 'express';
import { AppError } from '../exceptions/AppError';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    let error = { ...err };
    error.message = err.message;

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
    const message = error.message || 'Internal Server Error';

    // Log the error using Pino
    if (statusCode === 500) {
        logger.error({ 
            err: err, 
            req: {
                method: req.method,
                url: req.originalUrl,
                ip: req.ip,
                body: req.body // CAUTION: filter sensitive data in prod!
            }
        }, 'Unhandled Exception Caught by Global Error Handler');
    } else {
        logger.warn({ message: err.message, statusCode, path: req.originalUrl }, 'App Warning/Error');
    }

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
