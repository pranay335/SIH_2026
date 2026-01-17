import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/button.jsx';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setIsSubmitted(true);
        }, 1000);
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    <div className="glass rounded-2xl p-8 text-center">
                        <div className="text-4xl mb-4">✅</div>
                        <h2 className="text-2xl font-bold text-white mb-4">Check Your Email</h2>
                        <p className="text-white/70 mb-6">
                            We've sent a password reset link to your email address.
                        </p>
                        <Link to="/login">
                            <Button label="Back to Login" variant="primary" className="w-full" />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2">
                        <span className="text-white">Forgot </span>
                        <span className="text-gradient">Password</span>
                    </h1>
                    <p className="text-white/70 mt-2">Enter your email to reset your password</p>
                </div>

                <div className="glass rounded-2xl p-8 space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-300"
                                placeholder="your.email@example.com"
                            />
                        </div>

                        <Button
                            type="submit"
                            label={isLoading ? "Sending..." : "Send Reset Link"}
                            variant="primary"
                            size="large"
                            disabled={isLoading}
                            className="w-full"
                        />

                        <div className="text-center pt-4">
                            <Link
                                to="/login"
                                className="text-[#60A5FA] hover:text-[#3B82F6] text-sm font-medium transition-colors duration-300"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
