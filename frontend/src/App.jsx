import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import BlueprintUpload from './pages/BlueprintUpload';
import VisitorSelection from './pages/VisitorSelection';
import QrCodeGeneration from './pages/QrCodeGeneration';
import IndoorNavigation from './pages/IndoorNavigation';
import { ErrorPage } from './pages/ErrorPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/blueprint" element={<BlueprintUpload />} />
        <Route path="/admin/qr" element={<QrCodeGeneration />} />

        {/* Visitor Routes */}
        <Route path="/visitor/scan" element={<VisitorSelection />} />
        <Route path="/visitor/navigate/:buildingId" element={<IndoorNavigation />} />

        {/* Default Catch-all */}
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </Router>
  )
}

export default App
