export const protect = (req,res,next)=>{
    if(!req.session.user){
        res.json({message:"Unauthorized User"});
    }
    req.user = req.session.user;
    next();
};

export default protect;