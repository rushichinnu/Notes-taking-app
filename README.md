Notes App
A modern, full-stack notes application with passwordless authentication using OTP verification via email. Built with React, TypeScript, Node.js, Express, and MongoDB.

🌟 Features
Authentication
✅ Passwordless Signup - Only email and name required

✅ OTP-Based Login - No passwords needed

✅ Email Verification - Gmail SMTP integration

✅ JWT Authentication - Secure session management

✅ Google OAuth - Alternative login method

Notes Management
✅ Create Notes - Rich text content with titles

✅ View Notes - Click to view full note content

✅ Edit Notes - In-place editing with save/cancel

✅ Delete Notes - Confirmation-based deletion

✅ Responsive Design - Works on all devices

User Experience
✅ Modern UI - Clean, professional interface

✅ Real-time Feedback - Toast notifications

✅ Loading States - Smooth user interactions

✅ Error Handling - Comprehensive error management

🛠 Tech Stack
Frontend
React 18 with TypeScript

Vite for build tooling

Tailwind CSS for styling

React Router for navigation

React Hot Toast for notifications

Axios for API calls

Backend
Node.js with Express

TypeScript for type safety

MongoDB with Mongoose ODM

JWT for authentication

Nodemailer for email sending

Joi for validation

bcryptjs for password hashing

📋 Prerequisites
Node.js (v16 or higher)

MongoDB (local or MongoDB Atlas)

Gmail Account with App Password

Git

🚀 Installation & Setup

1. Clone the Repository
   bash
   git clone <your-repo-url>
   cd notes-app
2. Backend Setup
   bash
   cd backend
   npm install
3. Frontend Setup
   bash
   cd ../frontend
   npm install
4. Environment Variables
   Create .env file in the backend directory:

text

# Database

MONGODB_URI=mongodb://localhost:27017/notes-app

# Or for MongoDB Atlas:

# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/notes-app

# JWT Configuration

JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Email Configuration (Gmail SMTP)

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# Google OAuth (Optional)

GOOGLE_CLIENT_ID=your-google-client-id

# Server

PORT=5000 5. Gmail App Password Setup
Enable 2-Factor Authentication on your Gmail account

Go to Google Account Settings → Security → App Passwords

Generate an app password for "Mail"

Use this 16-character password in EMAIL_PASS

🏃♂️ Running the Application
Development Mode
Start Backend:

bash
cd backend
npm run dev
Start Frontend:

bash
cd frontend
npm run dev
The application will be available at:

Frontend: http://localhost:3000

Backend: http://localhost:5000

Production Build
Backend:

bash
cd backend
npm run build
npm start
Frontend:

bash
cd frontend
npm run build
npm run preview
📚 API Documentation
Authentication Endpoints
Passwordless Signup
text
POST /api/auth/signup
Content-Type: application/json

{
"email": "user@example.com",
"name": "John Doe"
}
Verify Signup OTP
text
POST /api/auth/verify-otp
Content-Type: application/json

{
"pendingUserId": "user-id",
"otp": "123456"
}
Send Login OTP
text
POST /api/auth/send-login-otp
Content-Type: application/json

{
"email": "user@example.com"
}
Verify Login OTP
text
POST /api/auth/verify-login-otp
Content-Type: application/json

{
"loginSession": "session-id",
"otp": "123456"
}
Notes Endpoints
All notes endpoints require authentication via Authorization: Bearer <token> header.

Get All Notes
text
GET /api/notes
Create Note
text
POST /api/notes
Content-Type: application/json

{
"title": "Note Title",
"content": "Note content here..."
}
Update Note
text
PUT /api/notes/:id
Content-Type: application/json

{
"title": "Updated Title",
"content": "Updated content..."
}
Delete Note
text
DELETE /api/notes/:id
🏗 Project Structure
text
notes-app/
├── backend/
│ ├── src/
│ │ ├── controllers/
│ │ │ ├── authController.ts
│ │ │ └── notesController.ts
│ │ ├── models/
│ │ │ ├── User.ts
│ │ │ ├── Note.ts
│ │ │ └── PendingUser.ts
│ │ ├── routes/
│ │ │ ├── auth.ts
│ │ │ └── notes.ts
│ │ ├── middleware/
│ │ │ └── auth.ts
│ │ ├── utils/
│ │ │ ├── jwt.ts
│ │ │ └── email.ts
│ │ └── app.ts
│ ├── package.json
│ └── .env
└── frontend/
├── src/
│ ├── components/
│ │ ├── Login.tsx
│ │ ├── Signup.tsx
│ │ ├── OTPVerification.tsx
│ │ └── Dashboard.tsx
│ ├── contexts/
│ │ └── AuthContext.tsx
│ ├── services/
│ │ └── api.ts
│ ├── types/
│ │ └── index.ts
│ └── App.tsx
└── package.json
🔐 Security Features
Passwordless Authentication - No passwords to steal or forget

JWT Tokens - Secure session management

Email Verification - Verified email addresses only

OTP Expiration - Time-limited verification codes

Input Validation - Joi schema validation

CORS Configuration - Secure cross-origin requests

Environment Variables - Sensitive data protection

🎨 UI/UX Features
Responsive Design - Mobile-first approach

Modern UI - Clean, professional interface

Loading States - Smooth user interactions

Error Handling - User-friendly error messages

Toast Notifications - Real-time feedback

Modal Dialogs - Intuitive note viewing/editing

🚧 Development Notes
Database Schema
User Model:

typescript
{
email: string;
name: string;
googleId?: string;
isVerified: boolean;
otp?: string;
otpExpires?: Date;
createdAt: Date;
}
Note Model:

typescript
{
title: string;
content: string;
userId: ObjectId;
createdAt: Date;
updatedAt: Date;
}
PendingUser Model:

typescript
{
email: string;
name: string;
otp: string;
otpExpires: Date;
createdAt: Date; // Auto-expires after 10 minutes
}
Authentication Flow
Signup: Email + Name → OTP sent → Verify OTP → Account created

Login: Email → OTP sent → Verify OTP → Logged in

Notes: All operations require valid JWT token

🤝 Contributing
Fork the repository

Create your feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add some AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request

🙏 Acknowledgments
React Team for the amazing frontend framework

Express.js for the robust backend framework

MongoDB for the flexible database

Tailwind CSS for the utility-first styling

Nodemailer for email functionality

Built with ❤️ using modern web technologies
