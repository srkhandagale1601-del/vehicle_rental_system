import { getVehicles } from "../services/vehicleService.js";

export const fetchVehicles = async (req, res, next) => {
    try {
        const vehicles = await getVehicles(req.query);
        res.json(vehicles);
    } catch (error) {
        next(error);
    }
};