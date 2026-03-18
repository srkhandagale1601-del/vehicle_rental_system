import db from "../config/db.js";

const findUserbyEmail = async(email)=>{
    const result = await db.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
    );
   return result.rows[0];
};

const createUser = async(name,email,phone,password)=>{
    const result = await db.query(
        "INSERT INTO users (name,email,phone,password) VALUES ($1,$2,$3,$4) RETURNING * ",
        [name,email,phone,password]
    );
    return result.rows[0] ;
};

export {findUserbyEmail,createUser};