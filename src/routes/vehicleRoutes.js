import express from "express";
import { fetchVehicles } from "../controllers/vehicleController.js";
import { protect } from "../middlewares/authmiddleware.js";
const router = express.Router();

router.get("/", protect,fetchVehicles);

export default router;