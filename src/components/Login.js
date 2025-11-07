import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { BASE_URL } from "../config";
const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}login.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      const data = await res.json();
      setMessage(data.message);

      if (data.status === "success") {
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/call-logs");
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
          {/* <p className="text-gray-300 mt-2 text-sm">Call Analytics Dashboard</p> */}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition"
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 pr-10 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition"
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>

          <p
            className="text-right text-sm text-blue-400 cursor-pointer hover:underline"
            onClick={() => navigate("/forgot-password")}
          >
            Forgot Password?
          </p>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
          >
            Login
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-green-400 animate-pulse">{message}</p>
        )}
      </div>
    </div>
  );
};

export default Login;
