import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { Column } from "../models/Column.js";
import { Project } from "../models/Project.js";
import asyncHandler from "express-async-handler";

interface customError extends Error {
    status?: number;
}

export const createColumn = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user || !req.user._id) {
        const error = new Error("Unauthorized: User not authenticated") as customError;
        error.status = 401;
        throw error;
    }
    const { title, color } = req.body;
    const { projectId } = req.params;

    if (!title) {
        const error = new Error("Column title is required") as customError;
        error.status = 400;
        throw error;
    }

    const project = await Project.findById(projectId);
    if (!project) {
        const error = new Error("Project not found") as customError;
        error.status = 404;
        throw error;
    }

    // Determine the order for the new column (last)
    const existingColumn = await Column.findOne({ project: projectId as string }).sort({ order: -1 });
    const order = existingColumn ? existingColumn.order + 1 : 0;

    const newColumn = new Column({
        title,
        color,
        project: projectId as string,
        workspace: project.workspace,
        order
    });

    const savedColumn = await newColumn.save();
    if (!savedColumn) {
        throw new Error("Failed to save the column");
    }

    res.status(201).json(savedColumn);
});

export const getColumns = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user || !req.user._id) {
        const error = new Error("Unauthorized: User not authenticated") as customError;
        error.status = 401;
        throw error;
    }
    const { projectId } = req.params;

    const columns = await Column.find({ project: projectId as string }).sort({ order: 1 });
    res.status(200).json(columns);
});

export const updateColumn = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user || !req.user._id) {
        const error = new Error("Unauthorized: User not authenticated") as customError;
        error.status = 401;
        throw error;
    }
    const { columnId } = req.params;
    const { title, color, order } = req.body;

    const updateFields: { title?: string; color?: string; order?: number } = {};
    if (title) updateFields.title = title;
    if (color) updateFields.color = color;
    if (order !== undefined) updateFields.order = order;

    const updatedColumn = await Column.findByIdAndUpdate(
        columnId,
        { $set: updateFields },
        { new: true }
    );

    if (!updatedColumn) {
        const error = new Error("Column not found") as customError;
        error.status = 404;
        throw error;
    }

    res.status(200).json(updatedColumn);
});

export const deleteColumn = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user || !req.user._id) {
        const error = new Error("Unauthorized: User not authenticated") as customError;
        error.status = 401;
        throw error;
    }
    const { columnId } = req.params;

    const deletedColumn = await Column.findByIdAndDelete(columnId);
    if (!deletedColumn) {
        const error = new Error("Column not found") as customError;
        error.status = 404;
        throw error;
    }

    res.status(200).json({ message: "Column deleted successfully", column: deletedColumn });
});