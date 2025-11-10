/*import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export default function SignIn() {
  const navigate = useNavigate();

  const [role, setRole] = useState("user"); // 'user' or 'admin'
  const [userInputData, setUserInputData] = useState({
    userName: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setUserInputData((p) => ({ ...p, [name]: value }));
  };

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const { userName, password } = userInputData;

    if (!userName || !password) {
      alert("Please fill in both username and password.");
      return;
    }

    setLoading(true);

    // important: backend routes are /api/user/signin and /api/admin/signin
    const endpoint = role === "admin" ? `${API_URL}/admin/signin` : `${API_URL}/user/signin`;

    try {
      const res = await axios.post(endpoint, { userName, password });

      if (res.status === 200 && res.data.success) {
        // save user and token for subsequent admin operations
        const user = res.data.user;
        const token = res.data.token;
        localStorage.setItem("currentUser", JSON.stringify(user));
        if (token) localStorage.setItem("token", token);

        alert(`Login successful for ${user.userName} (${user.role})! Redirecting...`);
        navigate("/dashboard");
      } else {
        // show server-provided message if any
        const msg = res.data?.message || "Login failed. Check server status or credentials.";
        alert(msg);
      }
    } catch (err) {
      // better error message: server -> client
      const serverMessage = err.response?.data?.message;
      console.error("Signin error:", err.response || err);
      alert(serverMessage || "Login failed. Check server status or credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="outerdiv">
      <form className="form" onSubmit={handleFormSubmit}>
        <span className="signup">Sign In</span>

        <div style={{ marginBottom: "15px", display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            onClick={() => handleRoleChange("user")}
            style={{
              padding: "10px 15px",
              marginRight: "5px",
              backgroundColor: role === "user" ? "#4CAF50" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            User
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange("admin")}
            style={{
              padding: "10px 15px",
              backgroundColor: role === "admin" ? "#007BFF" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Admin
          </button>
        </div>

        <input
          type="text"
          placeholder="User name"
          className="form--input"
          name="userName"
          value={userInputData.userName}
          onChange={handleInput}
        />
        <input
          type="password"
          placeholder="Password"
          className="form--input"
          name="password"
          value={userInputData.password}
          onChange={handleInput}
        />

        <div className="buttons-div">
          <button className="form--submit" disabled={loading}>
            {loading ? "Logging in..." : `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
          </button>
        </div>
      </form>
    </div>
  );
}*/

// src/Components/SignIn.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export default function SignIn() {
  const navigate = useNavigate();

  const [role, setRole] = useState("user"); // 'user' or 'admin'
  const [userInputData, setUserInputData] = useState({
    userName: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setUserInputData((p) => ({ ...p, [name]: value }));
  };

  const handleRoleChange = (selectedRole) => {
    if (loading) return;
    setRole(selectedRole);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const { userName, password } = userInputData;

    if (!userName || !password) {
      alert("Please fill in both username and password.");
      return;
    }

    setLoading(true);

    // backend routes are /api/user/signin and /api/admin/signin
    const endpoint = role === "admin" ? `${API_URL}/admin/signin` : `${API_URL}/user/signin`;

    try {
      const res = await axios.post(endpoint, { userName, password });

      if (res.status === 200 && res.data.success) {
        // save user and token for subsequent admin operations
        const user = res.data.user;
        const token = res.data.token;

        // persist user + token
        localStorage.setItem("currentUser", JSON.stringify(user));
        if (token) localStorage.setItem("token", token);

        // redirect
        navigate("/dashboard");
      } else {
        const msg = res.data?.message || "Login failed. Check server status or credentials.";
        alert(msg);
      }
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      console.error("Signin error:", err.response || err);
      alert(serverMessage || "Login failed. Check server status or credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="outerdiv">
      <form className="form" onSubmit={handleFormSubmit}>
        <span className="signup">Sign In</span>

        <div style={{ marginBottom: "15px", display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            onClick={() => handleRoleChange("user")}
            disabled={loading}
            style={{
              padding: "10px 15px",
              marginRight: "5px",
              backgroundColor: role === "user" ? "#4CAF50" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer"
            }}
            aria-pressed={role === "user"}
          >
            User
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange("admin")}
            disabled={loading}
            style={{
              padding: "10px 15px",
              backgroundColor: role === "admin" ? "#007BFF" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer"
            }}
            aria-pressed={role === "admin"}
          >
            Admin
          </button>
        </div>

        <input
          type="text"
          placeholder="User name"
          className="form--input"
          name="userName"
          value={userInputData.userName}
          onChange={handleInput}
          autoComplete="username"
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Password"
          className="form--input"
          name="password"
          value={userInputData.password}
          onChange={handleInput}
          autoComplete="current-password"
          disabled={loading}
        />

        <div className="buttons-div">
          <button
            type="submit"
            className="form--submit"
            disabled={loading}
            style={{ cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Logging in..." : `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
          </button>
        </div>
      </form>
    </div>
  );
}
