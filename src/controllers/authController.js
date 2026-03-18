import { findUserbyEmail, createUser } from "../services/authService.js";
import { hashedPassword, comparePassword } from "../utils/hash.js";

export const signup = async (req, res) => {
  const { name, email, phone, password } = req.body;

  const existing = await findUserbyEmail(email);
  if (existing) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashed = await hashedPassword(password);

  const user = await createUser(name, email, phone, hashed); 

  req.session.user = {   
    id: user.id,
    email: user.email
  };

  res.json({ message: "Signup successful", user });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await findUserbyEmail(email);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const isMatched = await comparePassword(password, user.password); 
  if (!isMatched) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  req.session.user = {   
    id: user.id,
    email: user.email
  };

  res.json({ message: "Login successfully" });
};

export const logout = (req, res) => {
  req.session = null;  
  res.json({ message: "User logged out" });
};