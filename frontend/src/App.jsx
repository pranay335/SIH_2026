import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth Pages
import Login from './pages/login';
import Register from './pages/register';
import ForgotPassword from './pages/ForgotPassword';

// User Pages
import UserDashboard from './pages/user/UserDashboard';
import FileComplaint from './pages/user/FileComplaint';
import MyComplaints from './pages/user/MyComplaints';
import UserNotices from './pages/user/UserNotices';
import UserProfile from './pages/user/UserProfile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AllComplaints from './pages/admin/AllComplaints';
import AssignedComplaints from './pages/admin/AssignedComplaints';
import AdminNotices from './pages/admin/AdminNotices';
import Employees from './pages/admin/Employees';

// Legacy Components (for home page if needed)
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import ComplaintForm from './components/ComplaintForm';
import CitizenDashboard from './components/CitizenDashboard';
import Notices from './components/Notices';
import Footer from './components/Footer';

// Home Component (Landing Page)
const Home = () => {
    return (
        <div className="min-h-screen bg-[#0B0F1A]">
            <Navbar />
            <Hero />
            <Features />
            <ComplaintForm />
            <CitizenDashboard />
            <Notices />
            <Footer />
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    {/* User Routes */}
                    <Route
                        path="/user-dashboard"
                        element={
                            <ProtectedRoute requiredRole="user">
                                <UserLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<UserDashboard />} />
                    </Route>
                    <Route
                        path="/user"
                        element={
                            <ProtectedRoute requiredRole="user">
                                <UserLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="complaint" element={<FileComplaint />} />
                        <Route path="my-complaints" element={<MyComplaints />} />
                        <Route path="notices" element={<UserNotices />} />
                        <Route path="profile" element={<UserProfile />} />
                    </Route>

                    {/* Admin Routes */}
                    <Route
                        path="/admin-dashboard"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <AdminLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<AdminDashboard />} />
                    </Route>
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <AdminLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="complaints" element={<AllComplaints />} />
                        <Route path="assigned" element={<AssignedComplaints />} />
                        <Route path="notices" element={<AdminNotices />} />
                        <Route path="employees" element={<Employees />} />
                    </Route>

                    {/* Catch all - redirect to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
