import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import FindDoctors from './pages/patient/FindDoctors';
import DoctorDetails from './pages/patient/DoctorDetails';
import MyAppointments from './pages/patient/MyAppointments';
import LiveQueue from './pages/patient/LiveQueue';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import Profile from './pages/patient/Profile';
import Progress from './pages/Progress';
import DisplayBoard from './pages/admin/DisplayBoard';
import AdminDashboard from './pages/admin/AdminDashboard';
import Appointments from './pages/admin/Appointments';
import ManageDoctors from './pages/admin/ManageDoctors';
import ManageDepartments from './pages/admin/ManageDepartments';
import Schedules from './pages/admin/Schedules';
import Loader from './components/Loader';

// Charts library is large – load the analytics preview only when opened
const Analytics = lazy(() => import('./pages/admin/Analytics'));

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/doctors" element={<FindDoctors />} />
            <Route path="/doctors/:id" element={<DoctorDetails />} />
            <Route path="/appointments" element={<ProtectedRoute roles={['patient']}><MyAppointments /></ProtectedRoute>} />
            <Route path="/queue/:appointmentId" element={<ProtectedRoute roles={['patient']}><LiveQueue /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute roles={['patient']}><Profile /></ProtectedRoute>} />
            <Route path="/doctor" element={<ProtectedRoute roles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />

            <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="doctors" element={<ManageDoctors />} />
              <Route path="departments" element={<ManageDepartments />} />
              <Route path="schedules" element={<Schedules />} />
              <Route path="analytics" element={<Suspense fallback={<Loader />}><Analytics /></Suspense>} />
              <Route path="display-board" element={<DisplayBoard />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <Toaster position="top-right" containerStyle={{ top: 76 }} toastOptions={{ duration: 3500 }} />
      </SocketProvider>
    </AuthProvider>
  );
}
