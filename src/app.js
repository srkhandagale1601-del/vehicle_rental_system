import express from "express";
import cors from "cors";

import vehicleRoutes from "./routes/vehicleRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import authRoutes from "./routes/authRoutes.js";

import {errorHandler} from "./middlewares/errorHandler.js";
const app = express();

app.use(cors());
app.use(express.json());
app.get("/",(req,res)=>{
    console.log("Vehicle API is running");
});

app.use(errorHandler);
app.use("/vehicles",vehicleRoutes);
app.use("/bookings",bookingRoutes);
app.use("/auth",authRoutes);

export default app;
