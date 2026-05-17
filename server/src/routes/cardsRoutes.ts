import express from "express";
import { authenticate } from "../middleware/auth.js";
import { createCard } from "../controllers/cardsController.js";
const cardsRouter= express.Router();
cardsRouter.post("/:workspaceId/projects/:projectId/columns/:columnId/cards", authenticate, createCard);
export default cardsRouter;