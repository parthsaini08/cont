import { useEffect, useState } from "react";
import { BASE_URL } from "../config";
export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}get_user.php`, {
      credentials: "include", // important to send session cookie
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          setUser(data.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  return { user, loading };
}
