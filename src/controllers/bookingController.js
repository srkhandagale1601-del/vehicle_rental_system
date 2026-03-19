import { createBookings } from "../services/bookingService.js";
export const createNewBookings = async (req, res, next) => {
  try {
    const {  vehicle_id, start_date, end_date } = req.body;
    const user_id = req.user.id;
    if (!user_id || !vehicle_id || !start_date || !end_date) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const start = new Date(start_date);
    const end = new Date(end_date);

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "Start and end dates are required"
      });
    }

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

    res.status(201).json({message:"Booking created successfully",booking});
    await db.query(
      `UPDATE vehicles SET is_available = false WHERE id = $1`,
      [vehicle_id]
    );

  } catch (error) {
    next(error);
  }
};