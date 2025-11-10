import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export default function Signup() {
  const navigate = useNavigate();

  const [role, setRole] = useState("user"); // 'user' or 'admin'
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: ""
  });

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setFormData({
      userName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { userName, email, password, confirmPassword, phoneNumber } = formData;

    if (!userName || !email || !password) {
      return alert("Please fill in all common fields (Username, Email, Password).");
    }

    if (password !== confirmPassword) {
      return alert("Password and Confirm Password do not match.");
    }

    let endpoint = role === "admin" ? `${API_URL}/admin/signup` : `${API_URL}/user/signup`;
    const payload = { userName, email, password };

    if (role === "user") {
      if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
        return alert("User sign-up requires a valid 10-digit contact number.");
      }
      payload.phoneNumber = phoneNumber;
    }

    try {
      const res = await axios.post(endpoint, payload);
      if (res.status === 201 && res.data.success) {
        alert(`Successfully registered as ${role}! Please sign in.`);
        navigate("/auth");
      } else {
        alert(res.data?.message || "Registration failed.");
      }
    } catch (err) {
      console.error("Signup error:", err.response || err);
      alert(err.response?.data?.message || "Registration failed due to server error.");
    }
  };

  return (
    <div className="outerdiv">
      <form className="form" onSubmit={handleSubmit}>
        <span className="signup">Sign Up</span>

        <select name="roleSelector" className="form--input" onChange={handleRoleChange} value={role} style={{ marginBottom: "20px", cursor: "pointer" }}>
          <option value="user">Register as User</option>
          <option value="admin">Register as Admin</option>
        </select>

        <input type="text" placeholder="User name" className="form--input" name="userName" value={formData.userName} onChange={handleInput} />
        <input type="email" placeholder="Email address" className="form--input" name="email" value={formData.email} onChange={handleInput} />

        {role === "user" && (
          <input type="tel" placeholder="Contact Number (10 digits)" className="form--input" maxLength="10" name="phoneNumber" value={formData.phoneNumber} onChange={handleInput} />
        )}

        <input type="password" placeholder="Password" className="form--input" name="password" value={formData.password} onChange={handleInput} />
        <input type="password" placeholder="Confirm password" className="form--input" name="confirmPassword" value={formData.confirmPassword} onChange={handleInput} />

        <div className="buttons-div">
          <button type="submit" className="form--submit">
            Register as {role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        </div>
      </form>
    </div>
  );
}
