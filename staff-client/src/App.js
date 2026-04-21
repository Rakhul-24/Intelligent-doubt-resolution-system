import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

// Pages
import StaffLogin from './pages/StaffLogin';
import StaffRegister from './pages/StaffRegister';
import StaffDashboard from './pages/StaffDashboard';
import SlotManagementPage from './pages/SlotManagementPage';
import ChatPage from './pages/ChatPage';
import MaterialsUploadPage from './pages/MaterialsUploadPage';
import MeetingRoomPage from './pages/MeetingRoomPage';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<StaffLogin />} />
            <Route path="/register" element={<StaffRegister />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Navbar />
                  <StaffDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/slots"
              element={
                <PrivateRoute>
                  <Navbar />
                  <SlotManagementPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <PrivateRoute>
                  <Navbar />
                  <ChatPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/materials"
              element={
                <PrivateRoute>
                  <Navbar />
                  <MaterialsUploadPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/meeting/:linkId"
              element={
                <PrivateRoute>
                  <Navbar />
                  <MeetingRoomPage />
                </PrivateRoute>
              }
            />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
