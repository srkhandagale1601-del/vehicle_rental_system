import express from "express";
import { createNewBookings } from "../controllers/bookingController.js";
import {protect} from "../middlewares/authmiddleware.js";

const router = express.Router();
router.post("/",protect,createNewBookings);
export default router;