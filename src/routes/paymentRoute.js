import express from "express";
import { makePayment,getUserPayments } from "../controllers/paymentController.js";
import protect from "../middlewares/authmiddleware.js";
const router = express.Router();

router.post("/",protect,makePayment);
router.get("/",protect,getUserPayments);

export default router;

