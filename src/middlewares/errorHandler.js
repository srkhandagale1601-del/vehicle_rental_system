export const errorHandler = async(err,req,res,next) =>{
    console.log(err);
    res.status(500).json({
        message: err.message || "Server Error"
    });
};