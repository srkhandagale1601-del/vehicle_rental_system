import express from "express";
import { fetchVehicles,getAvailableVehicles } from "../controllers/vehicleController.js";
import { protect } from "../middlewares/authmiddleware.js";
const router = express.Router();

router.get("/", protect,fetchVehicles);
router.get("/",protect,getAvailableVehicles);

export default router;