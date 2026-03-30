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

    const vehicleResult = await pool.query(
      `SELECT price_per_day FROM vehicles WHERE id = $1`,
      [vehicle_id]
    );

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }

    const price_per_day = Number(vehicleResult.rows[0].price_per_day || 0);
    const msPerDay = 1000 * 60 * 60 * 24;
    const days = Math.ceil((end - start) / msPerDay);
    const total_price = Number((days * price_per_day * 1.08).toFixed(2));

    const booking = await createBookings({
      user_id,
      vehicle_id,
      start_date,
      end_date,
      total_price
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
    if (error.message === "Cannot cancel a paid booking") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};
