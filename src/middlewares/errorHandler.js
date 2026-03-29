export const errorHandler = async(err,req,res,next) =>{
    console.log(err);

    if (err?.code === "23505") {
        if (String(err?.constraint || "").includes("email")) {
            return res.status(400).json({ message: "Email already registered" });
        }
        if (String(err?.constraint || "").includes("phone")) {
            return res.status(400).json({ message: "Phone number already registered" });
        }
        return res.status(400).json({ message: "Duplicate value already exists" });
    }

    if (err?.code === "23P01") {
        if (String(err?.constraint || "").includes("vehicle_range")) {
            return res.status(409).json({ message: "Vehicle already booked for selected dates" });
        }
        if (String(err?.constraint || "").includes("user_range")) {
            return res.status(409).json({ message: "You already have a booking in this date range" });
        }
        return res.status(409).json({ message: "Booking overlaps with existing reservation" });
    }

    res.status(500).json({
        message: err?.message || "Server Error"
    });
};
