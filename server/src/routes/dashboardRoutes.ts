import express from "express";
import { authenticate } from "../middleware/auth.js";
import { getDashboard } from "../controllers/dashboardController.js";

const dashboardRouter = express.Router();

dashboardRouter.get("/", authenticate, getDashboard);

export default dashboardRouter;
