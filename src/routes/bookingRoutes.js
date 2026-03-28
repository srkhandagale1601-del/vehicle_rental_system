import express from "express";
import {
  createNewBookings,
  getUserBookings,
  cancelBooking,
  requestBookingCancellationOtp,
  verifyBookingCancellationOtp,
} from "../controllers/bookingController.js";
import {protect} from "../middlewares/authmiddleware.js";

const router = express.Router();
router.post("/",protect,createNewBookings);
router.get("/",protect,getUserBookings);
router.post("/:id/cancel/request-otp", protect, requestBookingCancellationOtp);
router.post("/:id/cancel/verify-otp", protect, verifyBookingCancellationOtp);
router.delete("/:id",protect,cancelBooking);

export default router;
