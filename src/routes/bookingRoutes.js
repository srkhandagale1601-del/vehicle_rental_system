import express from "express";
import { createNewBookings } from "../controllers/bookingController.js";

const router = express.Router();
router.post("/",createNewBookings);
export default router;