import express from "express";
import {
  createNewBookings,
  getUserBookings,
  cancelBooking,
} from "../controllers/bookingController.js";
import {protect} from "../middlewares/authmiddleware.js";

const router = express.Router();
router.post("/",protect,createNewBookings);
router.get("/",protect,getUserBookings);
router.delete("/:id",protect,cancelBooking);

export default router;
