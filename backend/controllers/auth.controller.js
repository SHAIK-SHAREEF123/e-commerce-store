import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import {redis} from "../lib/redis.js"
import dotenv from "dotenv";

dotenv.config();

const generateTokens = (userId) => {
  const accessToken = jwt.sign({userId}, process.env.ACCESS_TOKEN_SECRET,{expiresIn: "15m"});

  const refreshToken = jwt.sign({userId}, process.env.REFRESH_TOKEN_SECRET,{expiresIn: "7d"});

  return {accessToken, refreshToken}
}

const storeRefreshToken = async(userId, refreshToken) => {
  await redis.set(`refresh_token:${userId}`, refreshToken, "EX",7*24*60*60); // 7 days
}

const setCookies = (res,accessToken,refreshToken) => {
  res.cookie("accessToken",accessToken, {
    httpOnly:true, //prevents XSS attacks and cross site scripting attacks, allows only http requests
    secure:process.env.NODE_ENV === "production",
    sameSite:"strict", //prevents CSRF attacks, cross site request forgery attack
    maxAge: 15 * 60* 1000, //15 mins
  })

  res.cookie("refreshToken",refreshToken, {
    httpOnly:true, //prevents XSS attacks and cross site scripting attacks, allows only http requests
    secure:process.env.NODE_ENV === "production",
    sameSite:"strict", //prevents CSRF attacks, cross site request forgery attack
    maxAge: 7 * 24 * 60 * 60* 1000, // 7days
  })
}

export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({message: "User already exists!"});
    }
    const user = await User.create({ name, email, password });

    //authenticate 
    const {accessToken, refreshToken} = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);

    setCookies(res,accessToken,refreshToken);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.log("Error in signup controller",error.message);
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try{
    // console.log("login1");
    const {email,password} = req.body;
    const user = await User.findOne({email});

    // console.log("user",user);
    if(user && user.comparePassword(password)) {
      // console.log("login2");
      const {accessToken, refreshToken} = generateTokens(user._id);
      await storeRefreshToken(user._id, refreshToken);

      setCookies(res,accessToken,refreshToken);

      res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    }else {
      res.json({message : "Invalid email or password!"});
    }
  } catch(error) {
    console.log("Error in login controller",error.message);
    res.status(500).json({message : error.message});
  }
};

export const logout = async (req, res) => {
  try{
    const refreshToken = req.cookies.refreshToken;
    if(refreshToken) {
      const decoded = jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET);
      await redis.del(`refresh_token:${decoded.userId}`);
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.json({message : "Logged out sucessfully"});
  } catch(error) {
    console.log("Error in logout controller",error.message);
    res.status(500).json({message: "Server Error", error: error.message});
  }
};

//This will refresh the access token
export const refreshToken = async (req,res) => {
  try{
    const refreshToken = req.cookies.refreshToken;
    
    if(!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided!" });
    }

    const decoded = jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET);
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

    if(storedToken!==refreshToken) {
      return res.status(401).json({ message : "Invalid refresh token" });
    }

    const accessToken = jwt.sign({userId : decoded.userId}, process.env.ACCESS_TOKEN_SECRET, {expiresIn : "15m"});
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, //15mins
    })

    res.json({ message: "Token refreshed successfully" });
    
  } catch(error) {
    console.log("Error occured in refresh Token controller",error.message);
    res.status(500).json({ message: "Server Error", error: error.message})
  }
}

export const getProfile = async (req,res) => {
  try {
    const user = req.user;
    if(!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    );

  } catch (error) {
    console.error("Error in getProfile:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
}