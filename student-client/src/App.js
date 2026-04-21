import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

// Pages
import StudentLogin from './pages/StudentLogin';
import StudentRegister from './pages/StudentRegister';
import StudentDashboard from './pages/StudentDashboard';
import AskDoubtPage from './pages/AskDoubtPage';
import ChatPage from './pages/ChatPage';
import MaterialsPage from './pages/MaterialsPage';
import MeetingRoomPage from './pages/MeetingRoomPage';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<StudentLogin />} />
            <Route path="/register" element={<StudentRegister />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Navbar />
                  <StudentDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/doubts"
              element={
                <PrivateRoute>
                  <AskDoubtPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/doubts/staff"
              element={
                <PrivateRoute>
                  <Navbar />
                  <AskDoubtPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/doubts/ai"
              element={
                <PrivateRoute>
                  <Navbar />
                  <AskDoubtPage />
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
                  <MaterialsPage />
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
