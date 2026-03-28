import express from "express";
import { fetchVehicles,getAvailableVehicles } from "../controllers/vehicleController.js";
import { protect } from "../middlewares/authmiddleware.js";
const router = express.Router();

router.get("/", protect,fetchVehicles);
router.post("/available",protect,getAvailableVehicles);

export default router;
