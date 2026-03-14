import express from "express";
import { fetchVehicles } from "../controllers/vehicleController.js";
const router = express.Router();

router.get("/", fetchVehicles);

export default router;