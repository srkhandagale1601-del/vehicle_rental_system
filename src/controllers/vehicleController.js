import { getVehicles,getAvailableVehiclesService } from "../services/vehicleService.js";

export const fetchVehicles = async (req, res, next) => {
    try {
        const vehicles = await getVehicles(req.query);
        res.json(vehicles);
    } catch (error) {
        next(error);
    }
};
export const getAvailableVehicles = async(req,res)=>{
    try{
        const {start_date,end_date} = req.body;
        if(!start_date || !end_date){
            return  res.status(400).json({
                message:"start_date and end_date is required"
            });
        }

        if(new Date(start_date) >= new Date(end_date)){
            return res.status(400).json({
                message:"Invalid date range"
            });
        }

        const vehicles = await getAvailableVehiclesService(start_date,end_date);
        res.json({
            success:true,
            count:vehicles.length,
            data:vehicles
        });

    } catch(err){
        console.error(err);
        res.status(500).json({
           message: "Server error" 
        });
    }
};