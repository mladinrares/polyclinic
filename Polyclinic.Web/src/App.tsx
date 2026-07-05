import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProfileLayout from './components/ProfileLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import DoctorsPage from './pages/DoctorsPage';
import DoctorProfilePage from './pages/DoctorProfilePage';
import BookAppointmentPage from './pages/BookAppointmentPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import SpecialtiesPage from './pages/SpecialtiesPage';
import ProfilePage from './pages/ProfilePage';
import DoctorDashboardPage from './pages/DoctorDashboardPage';
import MedicalHistoryPage from './pages/MedicalHistoryPage';
import DocumentsPage from './pages/DocumentsPage';
import ReceptionPage from './pages/ReceptionPage';
import ReferralsPage from './pages/ReferralsPage';
import WaitingListPage from './pages/WaitingListPage';
import HomePage from './pages/HomePage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import NotFoundPage from './pages/NotFoundPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import TermsPage from './pages/TermsPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function UnauthorizedPage() {
  return <div className="text-2xl text-red-600">Nu ai acces la această pagină.</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Publice */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/doctors" element={<DoctorsPage />} />
          <Route path="/doctors/:id" element={<DoctorProfilePage />} />
          <Route path="/specialties" element={<SpecialtiesPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/doctors/:id/book" element={<ProtectedRoute><BookAppointmentPage /></ProtectedRoute>} />

          {/* Cu sidebar */}
          <Route element={<ProfileLayout />}>
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/medical-history" element={<ProtectedRoute><MedicalHistoryPage /></ProtectedRoute>} />
            <Route path="/referrals" element={<ProtectedRoute><ReferralsPage /></ProtectedRoute>} />
            <Route path="/waiting-list" element={<ProtectedRoute><WaitingListPage /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/doctor-dashboard" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboardPage /></ProtectedRoute>} />
            <Route path="/reception" element={<ProtectedRoute allowedRoles={['receptionist', 'admin']}><ReceptionPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPage /></ProtectedRoute>} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiePolicyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}