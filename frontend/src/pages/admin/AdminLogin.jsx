import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/button.jsx';

const AdminLogin = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
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
            const response = await fetch('http://localhost:5000/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    role: 'admin'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Store token and user data
            localStorage.setItem('civicmind_token', data.token);
            login(data.user, data.user.role);
            
            navigate('/admin-dashboard');
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2">
                        <span className="text-white">Admin </span>
                        <span className="text-gradient">Login</span>
                    </h1>
                    <p className="text-white/70 mt-2">CivicMind Municipal Portal</p>
                </div>

                <div className="glass rounded-2xl p-8 space-y-6">
                    {error && (
                        <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                                Admin Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-300"
                                placeholder="admin@civicmind.com"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                                Admin Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-300"
                                placeholder="Enter admin password"
                            />
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            label={isLoading ? "Signing in..." : "Sign In as Admin"}
                            variant="primary"
                            size="large"
                            disabled={isLoading}
                            className="w-full"
                        />

                        {/* User Login Link */}
                        <div className="text-center pt-4">
                            <p className="text-white/70 text-sm">
                                Are you a citizen?{' '}
                                <Link
                                    to="/login"
                                    className="text-[#60A5FA] hover:text-[#3B82F6] font-medium transition-colors duration-300"
                                >
                                    User Login
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>

                {/* Default Admin Info */}
                <div className="mt-6 text-center">
                    <div className="glass rounded-lg p-4 text-sm">
                        <p className="text-white/60 mb-2">Default Admin Credentials:</p>
                        <p className="text-white/80"><span className="text-[#60A5FA]">Email:</span> admin@civicmind.com</p>
                        <p className="text-white/80"><span className="text-[#60A5FA]">Password:</span> admin123</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
