import pool from "../config/db.js";

export const createBookings = async (filters) => {
    const { user_id, vehicle_id, start_time, end_time, total_price } = filters;

    const result = await pool.query(
        `INSERT INTO bookings
        (user_id, vehicle_id, start_time, end_time, total_price)
        VALUES ($1,$2,$3,$4,$5)
        RETURNING *`,
        [user_id, vehicle_id, start_time, end_time, total_price]
    );

    return result.rows[0];
};