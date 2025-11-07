import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { BASE_URL } from "../config";
const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}reset_password.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      setMessage(data.message);

      if (data.status === "success") {
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      setMessage("Error connecting to server");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-900 to-purple-900 p-4 relative overflow-hidden">
      {/* Animated background circles */}
      <div className="absolute top-[-50px] left-[-50px] w-72 h-72 bg-purple-700 rounded-full opacity-30 animate-pulse"></div>
      <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 bg-blue-700 rounded-full opacity-30 animate-pulse"></div>

      <div className="relative z-10 w-full max-w-md bg-gray-800/90 backdrop-blur-md shadow-2xl rounded-2xl p-10 border border-white/20">
        {/* Website Name */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white tracking-wide animate-pulse">
            CTrack
          </h1>
          <p className="text-gray-300 mt-2 text-sm">
            Reset your password securely
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition"
          />

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
          >
            Reset Password
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-green-400 animate-pulse">{message}</p>
        )}

        <p
          className="mt-4 text-center text-sm text-blue-400 cursor-pointer hover:underline"
          onClick={() => navigate("/login")}
        >
          Back to Login
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
