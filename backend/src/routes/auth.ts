import { Router } from "express";
import {
  signup,
  login,
  verifyOTP,
  googleAuth,
  sendLoginOTP,
  verifyLoginOTP,
} from "../controllers/authController";

const router = Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);
router.post("/google", googleAuth);

//added for modified login page
// Add these routes to your existing auth.ts routes file
router.post("/send-login-otp", sendLoginOTP);
router.post("/verify-login-otp", verifyLoginOTP);
//end of added routes

export default router;
