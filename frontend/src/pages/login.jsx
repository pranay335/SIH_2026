import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/button.jsx';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'user'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`http://${window.location.hostname}:5000/api/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    role: formData.role
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Store token and user data
            localStorage.setItem('civicmind_token', data.token);
            login(data.user, data.user.role);
            
            // Redirect based on role
            if (data.user.role === 'user') {
                navigate('/user-dashboard');
            } else if (data.user.role === 'employee') {
                navigate('/employee-dashboard');
            } else {
                navigate('/admin-dashboard');
            }
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                        <Link
                            to="/"
                            className="flex items-center text-gray-500 hover:text-gray-900 transition-colors duration-200 group"
                        >
                            <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span className="text-sm">Back to Home</span>
                        </Link>
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                        CivicMind Portal
                    </h1>
                    <p className="text-gray-500 text-sm">Municipal Grievance Management System</p>
                </div>

                <div className="glass rounded-2xl p-8 space-y-6">
                    {error && (
                        <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                placeholder="name@example.com"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                placeholder="Enter your password"
                            />
                        </div>

                        {/* Role Selection */}
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                                User Type
                            </label>
                            <select
                                id="role"
                                name="role"
                                required
                                value={formData.role}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            >
                                <option value="user" className="bg-white">Citizen</option>
                                <option value="admin" className="bg-white">Administrator</option>
                                <option value="employee" className="bg-white">Employee</option>
                            </select>
                        </div>

                        {/* Forgot Password Link */}
                        <div className="flex justify-between items-center">
                            <label className="flex items-center">
                                <input type="checkbox" className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2" />
                                <span className="ml-2 text-sm text-gray-500">Remember me</span>
                            </label>
                            <Link
                                to="/forgot-password"
                                className="text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            label={isLoading ? "Signing in..." : "Sign In"}
                            variant="primary"
                            size="large"
                            disabled={isLoading}
                            className="w-full"
                        />

                        {/* Register Link */}
                        <div className="text-center pt-6 border-t border-gray-200">
                            <p className="text-gray-500 text-sm">
                                Don't have an account?{' '}
                                <Link
                                    to="/register"
                                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                                >
                                    Register here
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
