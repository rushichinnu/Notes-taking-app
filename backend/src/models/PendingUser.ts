import mongoose, { Document, Schema } from "mongoose";

export interface IPendingUser extends Document {
  email: string;
  name: string;
  otp: string;
  otpExpires: Date;
  createdAt: Date;
}

const pendingUserSchema = new Schema<IPendingUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  otpExpires: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // Auto-delete after 10 minutes
  },
});

// No password hashing needed since we removed password field

export default mongoose.model<IPendingUser>("PendingUser", pendingUserSchema);
