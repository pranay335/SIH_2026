import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './button.jsx';

const Hero = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleReportIssue = () => {
        if (isAuthenticated) {
            navigate('/user/complaint');
        } else {
            navigate('/login');
        }
    };

    const handleViewDashboard = () => {
        if (isAuthenticated) {
            navigate('/user-dashboard');
        } else {
            navigate('/login');
        }
    };

    return (
        <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 md:pt-24">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#3B82F6]/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#60A5FA]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">
                    <span className="text-gray-900">Empowering Citizens,</span>
                    <br />
                    <span className="text-gradient">Transforming Communities</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto animate-slide-up">
                    Report issues, track progress, and make your voice heard. CivicMind connects citizens with local governance for a better tomorrow.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
                    <Button 
                        label="Report an Issue" 
                        variant="primary"
                        size="large"
                        onClick={handleReportIssue}
                    />
                    <Button 
                        label="View Dashboard" 
                        variant="outline"
                        size="large"
                        onClick={handleViewDashboard}
                    />
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            </div>
        </section>
    );
};

export default Hero;
