import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../config";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const logoutUser = async () => {
      try {
        // Optional: tell backend to destroy session
        await fetch(`${BASE_URL}logout.php`, {
          method: "POST",
          credentials: "include",
        });
      } catch (err) {
        console.error("Logout failed:", err);
      }

      // Remove user from localStorage
      localStorage.removeItem("user");

      // Redirect to login
      navigate("/login");
    };

    logoutUser();
  }, [navigate]);

  return null; // nothing to render
};

export default Logout;
