import express from "express";
import cors from "cors";
import cookieSession from "cookie-session";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import paymentRoutes from "./routes/paymentRoute.js";
import {errorHandler} from "./middlewares/errorHandler.js";
const app = express();

app.use(cors({
    // Dev-friendly: reflect caller origin to avoid frontend host mismatch issues.
    origin: true,
    credentials: true,
}));
app.use(express.json());
app.use(
    cookieSession({
        name: 'session',
        keys:['secretKeys123'],
        maxAge: 1000 * 60 * 60 * 24 ,
        sameSite: "lax",
        httpOnly: true,
    })
);

app.get("/",(req,res)=>{
    res.json({ message: "Vehicle API is running" });
});

app.use("/vehicles",vehicleRoutes);
app.use("/bookings",bookingRoutes);
app.use("/auth",authRoutes);
app.use("/payments",paymentRoutes);
app.use(errorHandler);
export default app;
