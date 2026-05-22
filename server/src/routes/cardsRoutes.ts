import express from "express";
import { authenticate } from "../middleware/auth.js";
import { createCard, updateCard, moveCard, deleteCard, getCards} from "../controllers/cardsController.js";
const cardsRouter= express.Router();

// I'm also fixing some missing slashes in your route definitions ('/columns/')
cardsRouter.post("/:workspaceId/projects/:projectId/columns/:columnId/cards", authenticate, createCard);
cardsRouter.get("/:workspaceId/projects/:projectId/columns/:columnId/cards", authenticate, getCards);
cardsRouter.put("/columns/:columnId/cards/:cardId",authenticate, updateCard);
cardsRouter.put("/columns/:columnId/cards/:cardId/move",authenticate, moveCard);
cardsRouter.delete("/columns/:columnId/cards/:cardId",authenticate, deleteCard);

export default cardsRouter;