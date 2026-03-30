import pool from "../config/db.js";

export const createBookings = async ({
  user_id,
  vehicle_id,
  start_date,
  end_date,
  total_price
}) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock the vehicle row to serialize concurrent bookings for the same vehicle.
    const vehicleLock = await client.query(
      `SELECT id FROM vehicles WHERE id = $1 FOR UPDATE`,
      [vehicle_id]
    );
    if (vehicleLock.rows.length === 0) {
      throw new Error("Vehicle not found");
    }

    // Lock the user row to serialize concurrent requests from same user across tabs/devices.
    const userLock = await client.query(
      `SELECT id FROM users WHERE id = $1 FOR UPDATE`,
      [user_id]
    );
    if (userLock.rows.length === 0) {
      throw new Error("User not found");
    }

    const vehicleOverlap = await client.query(
      `SELECT id FROM bookings
       WHERE vehicle_id = $1
       AND (start_date <= $3 AND end_date >= $2)
       LIMIT 1`,
      [vehicle_id, start_date, end_date]
    );

    if (vehicleOverlap.rows.length > 0) {
      throw new Error("Vehicle already booked for selected dates");
    }

    // Prevent same user from holding overlapping bookings in same period.
    const userOverlap = await client.query(
      `SELECT id FROM bookings
       WHERE user_id = $1
       AND (start_date <= $3 AND end_date >= $2)
       LIMIT 1`,
      [user_id, start_date, end_date]
    );

    if (userOverlap.rows.length > 0) {
      throw new Error("You already have a booking in this date range");
    }

    const result = await client.query(
      `INSERT INTO bookings (user_id, vehicle_id, start_date, end_date, total_price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, vehicle_id, start_date, end_date, total_price ?? null]
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
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
  const bookingResult = await pool.query(
    `SELECT status
     FROM bookings
     WHERE id = $1 AND user_id = $2`,
    [bookingId, userId]
  );

  if (bookingResult.rows.length === 0) {
    return null;
  }

  const status = bookingResult.rows[0].status;
  if (status === "PAID") {
    throw new Error("Cannot cancel a paid booking");
  }
  if (status !== "PENDING") {
    return null;
  }

  const result = await pool.query(
    `DELETE FROM bookings 
     WHERE id = $1 AND user_id = $2 AND status = 'PENDING'
     RETURNING *`,
    [bookingId, userId]
  );

  return result.rows[0];
};
