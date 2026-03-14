import { createBookings } from "../services/bookingService.js";
export const createNewBookings = async (req, res, next) => {
  try {
    const { user_id, vehicle_id, start_time, end_time, total_price } = req.body;

    if (!user_id || !vehicle_id || !start_time || !end_time) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const booking = await createBookings(req.body);
    res.json(booking);
    console.log(req.body);
  } catch (error) {
    next(error);
  }
};