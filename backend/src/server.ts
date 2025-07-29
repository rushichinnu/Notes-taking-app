// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";
// import helmet from "helmet";
// import rateLimit from "express-rate-limit";
// import dotenv from "dotenv";

// import authRoutes from "./routes/auth";
// import notesRoutes from "./routes/notes";

// dotenv.config();

// const app = express();

// // Security middleware
// app.use(helmet());
// // app.use(
// //   cors({
// //     origin: process.env.FRONTEND_URL || "http://localhost:3000",
// //     credentials: true,
// //   })
// // );
// app.use(
//   cors({
//     origin: [
//       "http://localhost:3000", // ← Add this for local development
//       "http://localhost:5173", // ← Add this for Vite dev server
//       "https://notes-taking-app-jet.vercel.app", // ← Keep this for production
//       "https://your-custom-domain.com", // ← Add if you have custom domain
//     ],
//     credentials: true,
//   })
// );

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100,
//   // limit each IP to 100 requests per windowMs
// });

// app.use(limiter);

// // Body parsing middleware
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true }));

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/notes", notesRoutes);

// // Health check
// app.get("/health", (req, res) => {
//   res.json({ status: "OK", timestamp: new Date().toISOString() });
// });

// // Error handling middleware
// app.use(
//   (
//     err: any,
//     req: express.Request,
//     res: express.Response,
//     next: express.NextFunction
//   ) => {
//     console.error(err.stack);
//     res.status(500).json({ message: "Something went wrong!" });
//   }
// );

// // 404 handler
// app.use("/*splat", (req, res) => {
//   res.status(404).json({ message: "Route not found" });
// });

// const PORT = process.env.PORT || 5000;

// // Database connection
// mongoose
//   .connect(process.env.MONGODB_URI!)
//   .then(() => {
//     console.log("Connected to MongoDB");
//     app.listen(PORT, () => {
//       console.log(`Server running on port ${PORT}`);
//     });
//   })
//   .catch((error) => {
//     console.error("Database connection error:", error);
//     process.exit(1);
//   });

// export default app;

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import notesRoutes from "./routes/notes";

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://notes-taking-app-jet.vercel.app",
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err.message);
    res.status(500).json({
      message: "Something went wrong!",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Internal server error",
    });
  }
);

// 404 handler - FIXED
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Database connection error:", error);
    process.exit(1);
  });

export default app;
