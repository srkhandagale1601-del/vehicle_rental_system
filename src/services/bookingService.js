import pool from "../config/db.js";

export const createBookings = async (filters) => {
    const { user_id, vehicle_id, start_date, end_date, total_price } = filters;

    const existingBooking = await pool.query(
    `SELECT * FROM bookings
     WHERE vehicle_id = $1
     AND (
       start_date <= $3 AND end_date >= $2
     )`,
    [vehicle_id, start_date, end_date]
  );
  if(existingBooking.rows.length>0){
    const error = new Error("Vehicle has been already booked ");
    error.statusCode = 400;
    throw error;
};

    const result = await pool.query(
        `INSERT INTO bookings
        (user_id, vehicle_id, start_date, end_date, total_price)
        VALUES ($1,$2,$3,$4,$5)
        RETURNING *`,
        [user_id, vehicle_id, start_date, end_date, total_price]
    );

    return result.rows[0];
};