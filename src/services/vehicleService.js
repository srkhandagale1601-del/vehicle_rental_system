import pool from "../config/db.js";

export const getVehicles = async (filters) => {
    let query = "SELECT * FROM vehicles WHERE 1=1";
    let values = [];

    if (filters.type) {
        values.push(filters.type);
        query += ` AND type = $${values.length}`;
    }

    if (filters.seats) {
        values.push(Number(filters.seats)); // convert to number
        query += ` AND seats >= $${values.length}`;
    }

    if (filters.rating) {
        values.push(Number(filters.rating)); // convert to number
        query += ` AND rating >= $${values.length}`;
    }

    if (filters.min_price !== undefined && filters.min_price !== "") {
        values.push(Number(filters.min_price));
        query += ` AND price_per_day >= $${values.length}`;
    }

    if (filters.max_price !== undefined && filters.max_price !== "") {
        values.push(Number(filters.max_price));
        query += ` AND price_per_day <= $${values.length}`;
    }

    const result = await pool.query(query, values);
    return result.rows;
};
export const getAvailableVehiclesService = async (start_date, end_date) => {
  const result = await pool.query(
    `SELECT * FROM vehicles v
     WHERE NOT EXISTS (
       SELECT 1 FROM bookings b
       WHERE b.vehicle_id = v.id
       AND b.status != 'CANCELLED'
       AND (b.start_date <= $2 AND b.end_date >= $1)
     )`,
    [start_date, end_date]
  );

  return result.rows;
};
