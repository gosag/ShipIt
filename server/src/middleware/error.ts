import type { Request, Response, NextFunction } from 'express';
export interface CustomError extends Error {
    statusCode?: number;
    status?: number;
}
const errorMiddleware = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
    const statusCode= err.statusCode || err.status || 500;
    res.status(statusCode).json({
        error: err.message
    });
};
export default errorMiddleware;