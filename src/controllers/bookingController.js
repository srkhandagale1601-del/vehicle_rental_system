import {
  createBookings,
  getUserBookingsService,
  cancelBookingService,
} from "../services/bookingService.js";
import pool from "../config/db.js";
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

    const vehicleOverlap = await pool.query(
      `SELECT id FROM bookings
       WHERE vehicle_id = $1
       AND (start_date <= $3 AND end_date >= $2)
       LIMIT 1`,
      [vehicle_id, start_date, end_date]
    );
    if (vehicleOverlap.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Vehicle already booked for selected dates"
      });
    }

    const userOverlap = await pool.query(
      `SELECT id FROM bookings
       WHERE user_id = $1
       AND (start_date <= $3 AND end_date >= $2)
       LIMIT 1`,
      [user_id, start_date, end_date]
    );
    if (userOverlap.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "You already have a booking in this date range"
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
