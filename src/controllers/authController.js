export const signup = async(req,res)=>{
    const { name,email,phone } = req.body;
    res.json({
        message:"Signup API working",
        user: {name,email,phone}
    });
};