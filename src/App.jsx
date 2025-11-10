import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import LandingPage from "./Components/LandingPage.jsx";
import Main from "./Components/Main.jsx";
import Dashboard from "./Components/Dashboard.jsx";

export default function AppRouter() {
    return (
        <BrowserRouter basename="/">
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<Main />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </BrowserRouter>
    );
}
