import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User";
import PendingUser from "../models/PendingUser";
import { generateToken } from "../utils/jwt";
import { sendOTPEmail } from "../utils/email";
import Joi from "joi";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Updated passwordless signup schema
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

    const { email, name } = req.body; // Removed password

    // Check if user already exists in main User collection
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // Check if there's already a pending user with this email
    const existingPendingUser = await PendingUser.findOne({ email });
    if (existingPendingUser) {
      // Delete the existing pending user to allow retry
      await PendingUser.findByIdAndDelete(existingPendingUser._id);
      console.log("🗑️ Removed existing pending user for retry");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create pending user (not in main User collection) - no password needed
    const pendingUser = new PendingUser({
      email,
      name,
      otp,
      otpExpires,
    });

    console.log("📝 Creating passwordless pending user:", { email, name });
    const savedPendingUser = await pendingUser.save();
    console.log("✅ Pending user saved successfully:", savedPendingUser._id);

    // Send OTP email
    try {
      console.log("🔄 Attempting to send OTP email...");
      console.log("📧 Sending to:", email);
      await sendOTPEmail(email, otp);
      console.log("📧 OTP email sent successfully to:", email);
    } catch (emailError: any) {
      console.error("❌ Email sending failed with error:", emailError.message);
      console.error("❌ Full error details:", emailError);
      // Show OTP in console as backup
      console.log(`⭐ Backup OTP for ${email}: ${otp}`);
    }

    res.status(201).json({
      message:
        "OTP sent to your email. Please verify to complete registration.",
      pendingUserId: savedPendingUser._id,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { pendingUserId, otp } = req.body;

    // Find pending user
    const pendingUser = await PendingUser.findById(pendingUserId);
    if (!pendingUser) {
      return res
        .status(400)
        .json({ message: "Invalid or expired signup session" });
    }

    console.log("✅ Found pending user:", pendingUser.email);

    // Verify OTP
    if (
      pendingUser.otp !== otp ||
      !pendingUser.otpExpires ||
      pendingUser.otpExpires < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Check if user was created by someone else while this verification was pending
    const existingUser = await User.findOne({ email: pendingUser.email });
    if (existingUser) {
      // Clean up pending user and return error
      await PendingUser.findByIdAndDelete(pendingUserId);
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // NOW create the actual verified user in main User collection (passwordless)
    const user = new User({
      email: pendingUser.email,
      name: pendingUser.name,
      isVerified: true, // User is verified upon creation
      // No password field - completely passwordless
    });

    const savedUser = await user.save();
    console.log("✅ Passwordless user created and verified:", savedUser._id);

    // Clean up pending user data
    await PendingUser.findByIdAndDelete(pendingUserId);
    console.log("🗑️ Cleaned up pending user data");

    // Generate JWT token
    const token = generateToken(savedUser._id.toString());

    res.json({
      message: "Account created and verified successfully",
      token,
      user: {
        id: savedUser._id,
        email: savedUser.email,
        name: savedUser.name,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = req.body;

    console.log("🔍 Looking for user:", email);
    const user = (await User.findOne({ email })) as typeof User.prototype & {
      _id: any;
    };

    if (!user) {
      console.log("❌ User not found in database");
      return res.status(400).json({ message: "Invalid email or password" });
    }

    console.log("✅ User found:", {
      id: user._id,
      email: user.email,
      isVerified: user.isVerified,
    });

    const passwordMatch = await user.comparePassword(password);
    console.log("🔐 Password match:", passwordMatch);

    if (!passwordMatch) {
      console.log("❌ Password does not match");
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Since we only create users after verification, this check is technically redundant
    // but keeping it for extra safety
    if (!user.isVerified) {
      console.log("❌ User not verified");
      return res
        .status(400)
        .json({ message: "Please verify your email first" });
    }

    const token = generateToken(user._id.toString());
    console.log("✅ Login successful for:", email);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
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
    })) as typeof User.prototype & { _id: any };

    if (!user) {
      // For Google OAuth, create user directly as verified
      user = new User({
        email,
        name,
        googleId,
        isVerified: true,
      }) as typeof User.prototype & { _id: any };
      await user.save();
      console.log("✅ New Google user created:", user._id);
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.isVerified = true;
      await user.save();
      console.log("✅ Linked Google account to existing user:", user._id);
    }

    const jwtToken = generateToken(user._id.toString());

    res.json({
      message: "Google authentication successful",
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// OTP-based login functions
export const sendLoginOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if user exists and is verified
    const user = await User.findOne({ email });
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

    // Generate OTP for login
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in user document (temporarily)
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    console.log("📝 Generated login OTP for:", email);

    // Send OTP email
    try {
      console.log("🔄 Attempting to send login OTP email...");
      await sendOTPEmail(email, otp);
      console.log("📧 Login OTP email sent successfully to:", email);
    } catch (emailError: any) {
      console.error("❌ Email sending failed:", emailError.message);
      // Show OTP in console as backup
      console.log(`⭐ Backup Login OTP for ${email}: ${otp}`);
    }

    res.json({
      message: "Login OTP sent to your email",
      loginSession: user._id, // Send user ID for verification
    });
  } catch (error) {
    console.error("Send login OTP error:", error);
    res.status(500).json({ message: "Internal server error" });
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

    // Find user by login session ID
    const user = await User.findById(loginSession);
    if (!user) {
      return res.status(400).json({ message: "Invalid login session" });
    }

    console.log("🔍 Verifying login OTP for:", user.email);

    // Verify OTP
    if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    console.log("✅ Login OTP verified successfully for:", user.email);

    // Generate JWT token
    const token = generateToken(user._id.toString());

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Verify login OTP error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
