import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import mongoose from "mongoose";

import User, { IUser } from "../models/User";
import PendingUser, { IPendingUser } from "../models/PendingUser";
import { generateToken } from "../utils/jwt";
import { sendOTPEmail } from "../utils/email";
import Joi from "joi";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Validation schemas
const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const signup = async (req: Request, res: Response) => {
  try {
    const { error } = signupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    const existingPendingUser = await PendingUser.findOne({ email });
    if (existingPendingUser) {
      await PendingUser.findByIdAndDelete(existingPendingUser._id);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const pendingUser = new PendingUser({
      email,
      name,
      otp,
      otpExpires,
    });

    const savedPendingUser = await pendingUser.save();

    try {
      await sendOTPEmail(email, otp);
    } catch (emailError: any) {
      console.error("Email sending failed:", emailError);
      console.log(`Backup OTP for ${email}: ${otp}`);
    }

    return res.status(201).json({
      message:
        "OTP sent to your email. Please verify to complete registration.",
      pendingUserId: (
        savedPendingUser._id as mongoose.Types.ObjectId
      ).toString(),
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { pendingUserId, otp } = req.body;

    const pendingUser = (await PendingUser.findById(
      pendingUserId
    )) as IPendingUser | null;

    if (!pendingUser) {
      return res
        .status(400)
        .json({ message: "Invalid or expired signup session" });
    }

    if (
      !pendingUser.otp ||
      pendingUser.otp !== otp ||
      !pendingUser.otpExpires ||
      pendingUser.otpExpires < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const existingUser = await User.findOne({ email: pendingUser.email });

    if (existingUser) {
      await PendingUser.findByIdAndDelete(pendingUserId);
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    const user = new User({
      email: pendingUser.email,
      name: pendingUser.name,
      isVerified: true,
      // password is optional / not present in passwordless signup
    });

    const savedUser = await user.save();

    await PendingUser.findByIdAndDelete(pendingUserId);

    const token = generateToken(
      (savedUser._id as mongoose.Types.ObjectId).toString()
    );

    return res.json({
      message: "Account created and verified successfully",
      token,
      user: {
        id: (savedUser._id as mongoose.Types.ObjectId).toString(),
        email: savedUser.email,
        name: savedUser.name,
      },
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = req.body;

    const user = (await User.findOne({ email })) as IUser | null;
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const passwordMatch = user.password
      ? await user.comparePassword(password)
      : false;

    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: "Please verify your email first" });
    }

    const token = generateToken(
      (user._id as mongoose.Types.ObjectId).toString()
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: (user._id as mongoose.Types.ObjectId).toString(),
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const { sub: googleId, email, name } = payload;

    let user = (await User.findOne({
      $or: [{ googleId }, { email }],
    })) as IUser | null;

    if (!user) {
      user = new User({
        email,
        name,
        googleId,
        isVerified: true,
      });
      await user.save();
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.isVerified = true;
      await user.save();
    }

    const jwtToken = generateToken(
      (user._id as mongoose.Types.ObjectId).toString()
    );

    return res.json({
      message: "Google authentication successful",
      token: jwtToken,
      user: {
        id: (user._id as mongoose.Types.ObjectId).toString(),
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    console.error("Google auth error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const sendLoginOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = (await User.findOne({ email })) as IUser | null;

    if (!user) {
      return res
        .status(400)
        .json({ message: "No account found with this email" });
    }

    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: "Please verify your email first" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    try {
      await sendOTPEmail(email, otp);
    } catch (emailError: any) {
      console.error("Email sending failed:", emailError);
      console.log(`Backup OTP for ${email}: ${otp}`);
    }

    return res.json({
      message: "Login OTP sent to your email",
      loginSession: (user._id as mongoose.Types.ObjectId).toString(),
    });
  } catch (err) {
    console.error("Send login OTP error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyLoginOTP = async (req: Request, res: Response) => {
  try {
    const { loginSession, otp } = req.body;

    if (!loginSession || !otp) {
      return res
        .status(400)
        .json({ message: "Login session and OTP are required" });
    }

    const user = (await User.findById(loginSession)) as IUser | null;

    if (!user) {
      return res.status(400).json({ message: "Invalid login session" });
    }

    if (
      !user.otp ||
      user.otp !== otp ||
      !user.otpExpires ||
      user.otpExpires < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateToken(
      (user._id as mongoose.Types.ObjectId).toString()
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: (user._id as mongoose.Types.ObjectId).toString(),
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    console.error("Verify login OTP error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
