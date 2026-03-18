import bcrypt, { hash } from "bcrypt";

const hashedPassword = async(password)=>{
    return await bcrypt.hash(password,10);
};

const comparePassword = async(password,hashedPassword)=>{
    return  await bcrypt.compare(password,hashedPassword);
};

export  {hashedPassword,comparePassword};
