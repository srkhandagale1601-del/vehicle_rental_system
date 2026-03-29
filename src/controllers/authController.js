import { findUserbyEmail, createUser } from "../services/authService.js";
import { hashedPassword, comparePassword } from "../utils/hash.js";

export const signup = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await findUserbyEmail(email);
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashed = await hashedPassword(password);
    const user = await createUser(name, email, phone, hashed);

    req.session.user = {
      id: user.id,
      email: user.email
    };

    res.json({ message: "Signup successful", user });
  } catch (error) {
    // PostgreSQL unique violation
    if (error?.code === "23505") {
      if (String(error?.constraint || "").includes("phone")) {
        return res.status(400).json({ message: "Phone number already registered" });
      }
      if (String(error?.constraint || "").includes("email")) {
        return res.status(400).json({ message: "Email already registered" });
      }
      return res.status(400).json({ message: "User already exists" });
    }
    return res.status(500).json({ message: error?.message || "Signup failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

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
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Login failed" });
  }
};

export const logout = (req, res) => {
  req.session = null;  
  res.json({ message: "User logged out" });
};
