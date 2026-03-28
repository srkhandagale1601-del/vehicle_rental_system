import {
  createBookings,
  getUserBookingsService,
  cancelBookingService,
  getBookingForCancellationOtpService,
  saveCancellationOtpService,
  verifyCancellationOtpService,
} from "../services/bookingService.js";
import { sendCancellationOtpEmail } from "../utils/mailer.js";
export const createNewBookings = async (req, res, next) => {
  try {
    const { vehicle_id, start_date, end_date } = req.body;
    const user_id = req.user.id;

    if (!user_id || !vehicle_id || !start_date || !end_date) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "Invalid date range"
      });
    }

    const booking = await createBookings({
      user_id,
      vehicle_id,
      start_date,
      end_date
    });

    res.status(201).json({
      message: "Booking created successfully",
      booking
    });

  } catch (error) {
    next(error);
  }
};

export const getUserBookings = async(req,res,next)=>{
  try {
    const userId = req.user.id;
    const bookings = await getUserBookingsService(userId);
    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    const deleted = await cancelBookingService(bookingId, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    res.json({
      success: true,
      message: "Booking cancelled"
    });

  } catch (error) {
    next(error);
  }
};

export const requestBookingCancellationOtp = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    const booking = await getBookingForCancellationOtpService(bookingId, userId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await saveCancellationOtpService(bookingId, userId, otp);

    const mailResult = await sendCancellationOtpEmail({
      to: booking.user_email,
      otp,
      bookingId: booking.id,
      vehicleName: booking.vehicle_name,
      startDate: new Date(booking.start_date).toISOString().slice(0, 10),
      endDate: new Date(booking.end_date).toISOString().slice(0, 10),
    });

    const response = {
      success: true,
      message: mailResult.delivered
        ? `OTP sent to ${booking.user_email}`
        : "OTP generated. SMTP not configured, so email could not be sent.",
      expires_in_minutes: 10,
    };

    if (!mailResult.delivered && process.env.NODE_ENV !== "production") {
      response.dev_otp = otp;
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const verifyBookingCancellationOtp = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }

    const verifyResult = await verifyCancellationOtpService(bookingId, userId, otp);
    if (!verifyResult.ok) {
      return res.status(400).json({
        success: false,
        message: verifyResult.message,
      });
    }

    const deleted = await cancelBookingService(bookingId, userId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.json({
      success: true,
      message: "Booking cancelled after OTP verification",
    });
  } catch (error) {
    next(error);
  }
};
