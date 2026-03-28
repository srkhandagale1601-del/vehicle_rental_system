import pool from "../config/db.js";

export const createBookings = async ({
  user_id,
  vehicle_id,
  start_date,
  end_date
}) => {

  const existingBooking = await pool.query(
    `SELECT * FROM bookings 
     WHERE vehicle_id = $1
     AND (
       start_date <= $3 AND end_date >= $2
     )`,
    [vehicle_id, start_date, end_date]
  );

  if (existingBooking.rows.length > 0) {
    throw new Error("Vehicle already booked for selected dates");
  }

  const result = await pool.query(
    `INSERT INTO bookings (user_id, vehicle_id, start_date, end_date)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [user_id, vehicle_id, start_date, end_date]
  );

  return result.rows[0];
};

export const getUserBookingsService = async (userId) => {
  const result = await pool.query(
    `SELECT 
       b.id,
       b.vehicle_id,
       b.start_date,
       b.end_date,
       b.status,
       b.total_price,
       v.name AS vehicle_name,
       v.image_url,
       v.price_per_day
     FROM bookings b
     JOIN vehicles v ON b.vehicle_id = v.id
     WHERE b.user_id = $1
     ORDER BY b.start_date DESC`,
    [userId]
  );

  return result.rows;
};

export const cancelBookingService = async (bookingId, userId) => {
  const result = await pool.query(
    `DELETE FROM bookings 
     WHERE id = $1 AND user_id = $2 
     RETURNING *`,
    [bookingId, userId]
  );

  return result.rows[0];
};
