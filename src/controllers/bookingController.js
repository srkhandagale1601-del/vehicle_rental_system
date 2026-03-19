import { createBookings,getUserBookingsService,cancelBookingService } from "../services/bookingService.js";
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