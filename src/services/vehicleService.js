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

    const result = await pool.query(query, values);
    return result.rows;
};