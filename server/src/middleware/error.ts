import type { Request, Response, NextFunction } from 'express';
export interface CustomError extends Error {
    statusCode?: number;
    status?: number;
}
const errorMiddleware = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
    const statusCode= err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';
    if(err.name === 'ValidationError') {
        const errors = Object.values((err as any).errors).map((el: any) => el.message);
        const errorMessage = `Validation error: ${errors.join(', ')}`;
        console.error(errorMessage);
        return res.status(400).json({ message: errorMessage });
    }
    console.error(`Error: ${message}`);
    res.status(statusCode).json({
        message: err.message
    });
};
export default errorMiddleware;