import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Signup from "./components/Signup";
import Login from "./components/Login";
import OTPVerification from "./components/OTPVerification";
import Dashboard from "./components/Dashboard";
import "./index.css";
import bg_image from "./assets/bg_img.jpg";

const AuthPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<"login" | "signup" | "otp">(
    "login"
  );
  const [signupUserId, setSignupUserId] = useState<string>("");

  const handleSignupSuccess = (pendingUserId: string) => {
    setSignupUserId(pendingUserId);
    setCurrentView("otp");
  };

  const backgroundImage = bg_image;

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Your EXACT Original Structure */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
        {/* Your Original Forms - Zero Changes */}
        {currentView === "login" && (
          <Login onSwitchToSignup={() => setCurrentView("signup")} />
        )}
        {currentView === "signup" && (
          <Signup
            onSignupSuccess={handleSignupSuccess}
            onSwitchToLogin={() => setCurrentView("login")}
          />
        )}
        {currentView === "otp" && (
          <OTPVerification
            pendingUserId={signupUserId}
            onBack={() => setCurrentView("signup")}
          />
        )}
      </div>

      {/* Right Side - Background Image */}
      <div className="hidden lg:block flex-1 relative rounded-l-xl overflow-hidden">
        {/* Background content stays the same */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500"
          style={{ backgroundImage: `url("${backgroundImage}")` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent" />
          <svg
            className="absolute bottom-0 left-0 w-full h-full"
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 200C50 150 100 100 200 150C300 200 350 250 400 200V400H0V200Z"
              fill="url(#wave-gradient)"
            />
            <defs>
              <linearGradient
                id="wave-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="rgba(59, 130, 246, 0.8)" />
                <stop offset="50%" stopColor="rgba(37, 99, 235, 0.9)" />
                <stop offset="100%" stopColor="rgba(29, 78, 216, 1)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Title Overlays - Added OUTSIDE the form containers */}
      {/* Desktop Title - Top Left */}
      <div className="fixed top-8 left-8 hidden lg:block z-50">
        <h1 className="text-2xl font-bold text-primary-600 select-none">
          Notes
        </h1>
      </div>

      {/* Mobile Title - Center Top */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 lg:hidden z-50">
        <h1 className="text-2xl font-bold text-primary-600 select-none">
          Notes
        </h1>
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/auth" replace />;
};

const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/auth"
        element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={<Navigate to={user ? "/dashboard" : "/auth"} replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
