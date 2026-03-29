import express from "express";
import { fetchVehicles,getAvailableVehicles } from "../controllers/vehicleController.js";
const router = express.Router();

router.get("/", fetchVehicles);
router.post("/available", getAvailableVehicles);

export default router;
