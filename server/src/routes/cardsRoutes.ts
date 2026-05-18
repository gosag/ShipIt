import express from "express";
import { authenticate } from "../middleware/auth.js";
import { createCard, updateCard} from "../controllers/cardsController.js";
const cardsRouter= express.Router();
cardsRouter.post("/:workspaceId/projects/:projectId/columns/:columnId/cards", authenticate, createCard);
cardsRouter.put("columns/:columnId/cards:cardId",authenticate, updateCard)
export default cardsRouter;