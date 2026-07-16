import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GlobalProvider, useGlobalContext } from './context/GlobalContext';
import MainLayout from './layouts/MainLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

// Protected Pages
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import ChatCompanion from './pages/ChatCompanion';
import DocumentUpload from './pages/DocumentUpload';
import HealthProfile from './pages/HealthProfile';
import MyMedications from './pages/MyMedications';
import RemindersHub from './pages/RemindersHub';
import LabReports from './pages/LabReports';
import PharmacyFinder from './pages/PharmacyFinder';
import Community from './pages/Community';
import CarePlan from './pages/CarePlan';

// Info/Legal Pages
import UserGuide from './pages/UserGuide';
import Updates from './pages/Updates';
import PrivacyDocs from './pages/PrivacyDocs';
import TermsOfService from './pages/TermsOfService';
import AboutUs from './pages/AboutUs';
import Careers from './pages/Careers';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useGlobalContext();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<div className="internal-theme"><LoginPage /></div>} />
      
      {/* Protected Dashboard Routes - Un-nested to avoid double layout */}
      <Route path="/dashboard" element={<div className="internal-theme"><ProtectedRoute><DashboardLayout /></ProtectedRoute></div>}>
        <Route index element={<Dashboard />} />
        <Route path="care-plan" element={<CarePlan />} />
        <Route path="medications" element={<MyMedications />} />
        <Route path="reports" element={<LabReports />} />
        <Route path="reminders" element={<RemindersHub />} />
        <Route path="pharmacies" element={<PharmacyFinder />} />
        <Route path="upload" element={<DocumentUpload />} />
        <Route path="chat" element={<ChatCompanion />} />
        <Route path="profile" element={<HealthProfile />} />
        <Route path="community" element={<Community />} />
      </Route>
      
      <Route element={<MainLayout />}>
        <Route path="/guide" element={<UserGuide />} />
        <Route path="/updates" element={<Updates />} />
        <Route path="/privacy" element={<PrivacyDocs />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/careers" element={<Careers />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <GlobalProvider>
      <Router>
        <AppRoutes />
      </Router>
    </GlobalProvider>
  );
}
