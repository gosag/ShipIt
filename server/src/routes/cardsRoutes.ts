import express from "express";
import { authenticate } from "../middleware/auth.js";
import { createCard, updateCard, moveCard, deleteCard, getCards, commentRead } from "../controllers/cardsController.js";
import { unreadcomments } from "../controllers/cardsController.js"; 
const cardsRouter = express.Router();

cardsRouter.post("/projects/:projectId/columns/:columnId/cards", authenticate, createCard);
cardsRouter.get("/projects/:projectId/columns/:columnId/cards", authenticate, getCards);
cardsRouter.put("/columns/:columnId/cards/:cardId", authenticate, updateCard);
cardsRouter.put("/columns/:columnId/cards/:cardId/move", authenticate, moveCard);
cardsRouter.delete("/columns/:columnId/cards/:cardId", authenticate, deleteCard);
cardsRouter.patch('/columns/:columnId/cards/:cardId/read', authenticate, commentRead);
cardsRouter.get('/columns/:columnId/cards/:cardId/unread', authenticate, unreadcomments);
export default cardsRouter;