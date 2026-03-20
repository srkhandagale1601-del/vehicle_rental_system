import pool from "../config/db.js";
import { v4  } from "uuid";

export const makePayment = async (req, res) => {
  try {
    const { booking_id, payment_method, amount } = req.body;
    const userId = req.user.id;

    if (!booking_id || !payment_method || !amount) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const validMethod = ["CARD", "UPI", "NETBANKING"];
    if (!validMethod.includes(payment_method)) {
      return res.status(400).json({ message: "Invalid Payment Method" });
    }

    const bookingResult = await pool.query(
      `SELECT * FROM bookings WHERE id = $1`,
      [booking_id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(400).json({ message: "Booking not found" });
    }

    const bookings = bookingResult.rows[0];

    if (bookings.user_id !== userId) {
      return res.status(403).json({ message: "Unauthorized User" });
    }

    if (bookings.status === "PAID") {
      return res.status(400).json({ message: "Already Paid" });
    }

    const transaction_id = "TXN_" + v4();

    await pool.query(
      `INSERT INTO payments 
      (booking_id, user_id, vehicle_id, amount, payment_method, transaction_id)
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        booking_id,
        userId,
        bookings.vehicle_id,
        amount,
        payment_method,
        transaction_id,
      ]
    );

    await pool.query(
      `UPDATE bookings SET status = 'PAID' WHERE id = $1`,
      [booking_id]
    );

    res.json({
      message: "Payment successful",
      transaction_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Payment failed" });
  }
};

export const getUserPayments = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT
        p.transaction_id,
        p.amount,
        p.payment_method,
        p.status,
        p.created_at,
        v.name AS vehicle_name,
        b.start_date,
        b.end_date
      FROM payments p
      JOIN vehicles v ON p.vehicle_id = v.id
      JOIN bookings b ON p.booking_id = b.id
      WHERE p.user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching User details." });
  }
};