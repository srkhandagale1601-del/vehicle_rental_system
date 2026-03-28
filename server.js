import app from "./src/app.js";
import dotenv from "dotenv";

dotenv.config();
const PORT = process.env.PORT || 5000;
app.use("/images",express.static("./public/images"));
app.listen(PORT,()=>{
    console.log(`Listening to ${PORT}`);
});
