import pool from "../config/db.js";
import crypto from "crypto";

let otpTableReady = false;

const ensureCancellationOtpTable = async () => {
  if (otpTableReady) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cancellation_otps (
      booking_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      otp_hash TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      attempts INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (booking_id, user_id)
    )
  `);

  otpTableReady = true;
};

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

export const getBookingForCancellationOtpService = async (bookingId, userId) => {
  const result = await pool.query(
    `SELECT
      b.id,
      b.user_id,
      b.vehicle_id,
      b.start_date,
      b.end_date,
      b.status,
      v.name AS vehicle_name,
      v.price_per_day,
      u.email AS user_email
     FROM bookings b
     JOIN vehicles v ON b.vehicle_id = v.id
     JOIN users u ON b.user_id = u.id
     WHERE b.id = $1 AND b.user_id = $2`,
    [bookingId, userId]
  );

  return result.rows[0];
};

export const saveCancellationOtpService = async (bookingId, userId, otp) => {
  await ensureCancellationOtpTable();

  const otpHash = crypto.createHash("sha256").update(String(otp)).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await pool.query(
    `INSERT INTO cancellation_otps (booking_id, user_id, otp_hash, expires_at, attempts)
     VALUES ($1, $2, $3, $4, 0)
     ON CONFLICT (booking_id, user_id)
     DO UPDATE SET otp_hash = EXCLUDED.otp_hash, expires_at = EXCLUDED.expires_at, attempts = 0, created_at = NOW()`,
    [bookingId, userId, otpHash, expiresAt]
  );
};

export const verifyCancellationOtpService = async (bookingId, userId, otp) => {
  await ensureCancellationOtpTable();

  const result = await pool.query(
    `SELECT otp_hash, expires_at, attempts
     FROM cancellation_otps
     WHERE booking_id = $1 AND user_id = $2`,
    [bookingId, userId]
  );

  const row = result.rows[0];
  if (!row) {
    return { ok: false, message: "OTP not found. Request a new OTP." };
  }

  if (new Date(row.expires_at) < new Date()) {
    await pool.query(
      `DELETE FROM cancellation_otps WHERE booking_id = $1 AND user_id = $2`,
      [bookingId, userId]
    );
    return { ok: false, message: "OTP expired. Request a new OTP." };
  }

  if (row.attempts >= 5) {
    await pool.query(
      `DELETE FROM cancellation_otps WHERE booking_id = $1 AND user_id = $2`,
      [bookingId, userId]
    );
    return { ok: false, message: "Too many invalid attempts. Request a new OTP." };
  }

  const otpHash = crypto.createHash("sha256").update(String(otp)).digest("hex");
  if (otpHash !== row.otp_hash) {
    await pool.query(
      `UPDATE cancellation_otps SET attempts = attempts + 1 WHERE booking_id = $1 AND user_id = $2`,
      [bookingId, userId]
    );
    return { ok: false, message: "Invalid OTP." };
  }

  await pool.query(
    `DELETE FROM cancellation_otps WHERE booking_id = $1 AND user_id = $2`,
    [bookingId, userId]
  );

  return { ok: true };
};
