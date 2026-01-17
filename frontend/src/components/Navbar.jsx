import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './button.jsx';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isAuthenticated, role, user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Don't show navbar on layout pages (they have their own sidebars)
    const isLayoutPage = location.pathname.startsWith('/user-dashboard') || 
                         location.pathname.startsWith('/user/') ||
                         location.pathname.startsWith('/admin-dashboard') ||
                         location.pathname.startsWith('/admin/');

    if (isLayoutPage) {
        return null; // Layout pages have their own navigation
    }

    const handleLogout = () => {
        logout();
        navigate('/');
        setIsMenuOpen(false);
    };

    const handleReportIssue = () => {
        if (isAuthenticated && role === 'user') {
            navigate('/user/complaint');
        } else {
            navigate('/login');
        }
        setIsMenuOpen(false);
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link to="/" className="text-2xl md:text-3xl font-bold text-gradient">
                            CivicMind
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                        {!isAuthenticated ? (
                            <>
                                {/* Public Navigation */}
                                <a 
                                    href="#dashboard" 
                                    className="text-white/80 hover:text-[#60A5FA] transition-colors duration-300"
                                >
                                    Dashboard
                                </a>
                                <a 
                                    href="#grievances" 
                                    className="text-white/80 hover:text-[#60A5FA] transition-colors duration-300"
                                >
                                    Grievances
                                </a>
                                <a 
                                    href="#notices" 
                                    className="text-white/80 hover:text-[#60A5FA] transition-colors duration-300"
                                >
                                    Notices
                                </a>
                                <Button 
                                    label="Report Issue" 
                                    variant="primary"
                                    onClick={handleReportIssue}
                                />
                                <Link to="/login">
                                    <Button 
                                        label="Login" 
                                        variant="secondary"
                                        size="small"
                                    />
                                </Link>
                            </>
                        ) : role === 'user' ? (
                            <>
                                {/* User Navigation */}
                                <Link 
                                    to="/user-dashboard" 
                                    className="text-white/80 hover:text-[#60A5FA] transition-colors duration-300"
                                >
                                    Dashboard
                                </Link>
                                <Link 
                                    to="/user/complaint" 
                                    className="text-white/80 hover:text-[#60A5FA] transition-colors duration-300"
                                >
                                    File Complaint
                                </Link>
                                <Link 
                                    to="/user/my-complaints" 
                                    className="text-white/80 hover:text-[#60A5FA] transition-colors duration-300"
                                >
                                    My Complaints
                                </Link>
                                <Link 
                                    to="/user/notices" 
                                    className="text-white/80 hover:text-[#60A5FA] transition-colors duration-300"
                                >
                                    Notices
                                </Link>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] flex items-center justify-center text-white text-sm font-semibold">
                                            {user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <span className="text-white/80 text-sm">{user?.name || 'User'}</span>
                                    </div>
                                    <Button 
                                        label="Logout" 
                                        variant="secondary"
                                        size="small"
                                        onClick={handleLogout}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Admin Navigation */}
                                <Link 
                                    to="/admin-dashboard" 
                                    className="text-white/80 hover:text-[#60A5FA] transition-colors duration-300"
                                >
                                    Dashboard
                                </Link>
                                <Link 
                                    to="/admin/complaints" 
                                    className="text-white/80 hover:text-[#60A5FA] transition-colors duration-300"
                                >
                                    All Complaints
                                </Link>
                                <Link 
                                    to="/admin/assigned" 
                                    className="text-white/80 hover:text-[#60A5FA] transition-colors duration-300"
                                >
                                    Assigned
                                </Link>
                                <Link 
                                    to="/admin/notices" 
                                    className="text-white/80 hover:text-[#60A5FA] transition-colors duration-300"
                                >
                                    Notices
                                </Link>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] flex items-center justify-center text-white text-sm font-semibold">
                                            {user?.name?.charAt(0) || 'A'}
                                        </div>
                                        <span className="text-white/80 text-sm">{user?.name || 'Admin'}</span>
                                    </div>
                                    <Button 
                                        label="Logout" 
                                        variant="secondary"
                                        size="small"
                                        onClick={handleLogout}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 space-y-4 animate-fade-in">
                        {!isAuthenticated ? (
                            <>
                                {/* Public Mobile Navigation */}
                                <a 
                                    href="#dashboard" 
                                    className="block text-white/80 hover:text-[#60A5FA] transition-colors duration-300"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Dashboard
                                </a>
                                <a 
                                    href="#grievances" 
                                    className="block text-white/80 hover:text-[#60A5FA] transition-colors duration-300"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Grievances
                                </a>
                                <a 
                                    href="#notices" 
                                    className="block text-white/80 hover:text-[#60A5FA] transition-colors duration-300"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Notices
                                </a>
                                <div className="pt-2 space-y-2">
                                    <Button 
                                        label="Report Issue" 
                                        variant="primary"
                                        onClick={handleReportIssue}
                                        className="w-full"
                                    />
                                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                                        <Button 
                                            label="Login" 
                                            variant="secondary"
                                            className="w-full"
                                        />
                                    </Link>
                                </div>
                            </>
                        ) : role === 'user' ? (
                            <>
                                {/* User Mobile Navigation */}
                                <Link 
                                    to="/user-dashboard" 
                                    className="block text-white/80 hover:text-[#60A5FA] transition-colors duration-300"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Dashboard
                                </Link>
                                <Link 
                                    to="/user/complaint" 
                                    className="block text-white/80 hover:text-[#60A5FA] transition-colors duration-300"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    File Complaint
                                </Link>
                                <Link 
                                    to="/user/my-complaints" 
                                    className="block text-white/80 hover:text-[#60A5FA] transition-colors duration-300"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    My Complaints
                                </Link>
                                <Link 
                                    to="/user/notices" 
                                    className="block text-white/80 hover:text-[#60A5FA] transition-colors duration-300"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Notices
                                </Link>
                                <Link 
                                    to="/user/profile" 
                                    className="block text-white/80 hover:text-[#60A5FA] transition-colors duration-300"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Profile
                                </Link>
                                <div className="pt-4 border-t border-white/10">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] flex items-center justify-center text-white font-semibold">
                                            {user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{user?.name || 'User'}</p>
                                            <p className="text-white/60 text-sm">{user?.email || 'user@example.com'}</p>
                                        </div>
                                    </div>
                                    <Button 
                                        label="Logout" 
                                        variant="secondary"
                                        onClick={handleLogout}
                                        className="w-full"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Admin Mobile Navigation */}
                                <Link 
                                    to="/admin-dashboard" 
                                    className="block text-white/80 hover:text-[#60A5FA] transition-colors duration-300"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Dashboard
                                </Link>
                                <Link 
                                    to="/admin/complaints" 
                                    className="block text-white/80 hover:text-[#60A5FA] transition-colors duration-300"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    All Complaints
                                </Link>
                                <Link 
                                    to="/admin/assigned" 
                                    className="block text-white/80 hover:text-[#60A5FA] transition-colors duration-300"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Assigned Complaints
                                </Link>
                                <Link 
                                    to="/admin/notices" 
                                    className="block text-white/80 hover:text-[#60A5FA] transition-colors duration-300"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Notices
                                </Link>
                                <Link 
                                    to="/admin/employees" 
                                    className="block text-white/80 hover:text-[#60A5FA] transition-colors duration-300"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Employees
                                </Link>
                                <div className="pt-4 border-t border-white/10">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] flex items-center justify-center text-white font-semibold">
                                            {user?.name?.charAt(0) || 'A'}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{user?.name || 'Admin'}</p>
                                            <p className="text-white/60 text-sm">Municipal Admin</p>
                                        </div>
                                    </div>
                                    <Button 
                                        label="Logout" 
                                        variant="secondary"
                                        onClick={handleLogout}
                                        className="w-full"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
