import express from "express";
import { authenticate } from "../middleware/auth.js";
import { createCard, updateCard, moveCard, deleteCard} from "../controllers/cardsController.js";
const cardsRouter= express.Router();
cardsRouter.post("/:workspaceId/projects/:projectId/columns/:columnId/cards", authenticate, createCard);
cardsRouter.put("columns/:columnId/cards:cardId",authenticate, updateCard);
cardsRouter.put("columns/:columnId/cards:cardId/move",authenticate, moveCard);
cardsRouter.delete("columns/:columnId/cards:cardId",authenticate, deleteCard);

export default cardsRouter;