import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Pages
import RoadRescue from './RoadRescue'; 
import Login from './Login';
import Signup from './Signup';
import Emergency from './Emergency'; 
import Services from './Services';
import ServiceDetail from './ServiceDetail'; 
import About from './About';
import Contact from './Contact';
import Privacy from './Privacy';
import Terms from './Terms';
import CookiePolicy from './Cookie';
import ProviderRegister from './ProviderRegister';
import GarageRegister from './GarageRegister';
import AddVehicle from './AddVehicle';
import AddPayment from './AddPayment';
import CancelFeedback from './CancelFeedback';

// Profiles
import UserProfile from './UserProfile';
import ProviderProfile from './ProviderProfile';

// AI Chatbot
import AIChatbot from './AIChatbot'; 

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('currentUser');
  
  // Check if both token and user data exist
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Validate token format (basic check)
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      // Invalid JWT format
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentUserName');
      return <Navigate to="/login" replace />;
    }
  } catch (error) {
    console.error('Token validation error:', error);
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserName');
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <div className="relative">
      <Routes>
        {/* Main Landing Page */}
        <Route path="/" element={<RoadRescue />} />

        {/* Service Pages */}
        <Route path="/services" element={<Services />} />
        <Route path="/services/:id" element={<ServiceDetail />} />

        {/* Info Pages */}
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/cookie" element={<CookiePolicy />} />

        {/* Auth Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/provider-register" element={<ProviderRegister />} />
        <Route path="/garage-register" element={<GarageRegister />} />

        {/* Profile Pages */}
        <Route path="/profile/user" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/profile/provider" element={<ProtectedRoute><ProviderProfile /></ProtectedRoute>} />
        
        {/* Add Data Routes */}
        <Route path="/add-vehicle" element={<AddVehicle />} />
        <Route path="/add-payment" element={<AddPayment />} /> {/* <--- NEW ROUTE */}

        {/* Emergency */}
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/dashboard" element={<ProtectedRoute><Emergency /></ProtectedRoute>} />
        <Route path="/provider-dashboard" element={<ProtectedRoute><ProviderProfile /></ProtectedRoute>} />

        {/* Cancel Feedback */}
        <Route path="/cancel-feedback/:requestId" element={<CancelFeedback />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <AIChatbot />
    </div>
  );
}

export default App;