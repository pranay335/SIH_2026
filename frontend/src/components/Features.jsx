import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Features = () => {
    const { isAuthenticated, role } = useAuth();
    const navigate = useNavigate();

    const handleQuickReporting = () => {
        if (isAuthenticated && role === 'user') {
            navigate('/user/complaint');
        } else if (isAuthenticated && role === 'admin') {
            navigate('/admin-dashboard');
        } else {
            navigate('/login');
        }
    };

    const handleTrackProgress = () => {
        if (isAuthenticated && role === 'user') {
            navigate('/user/my-complaints');
        } else if (isAuthenticated && role === 'admin') {
            navigate('/admin/complaints');
        } else {
            navigate('/login');
        }
    };

    const features = [
        {
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            title: "Quick Reporting",
            description: "Report civic issues in minutes with photo upload, location tagging, and detailed descriptions.",
            onClick: handleQuickReporting
        },
        {
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            title: "Track Progress",
            description: "Monitor status of your complaints in real-time with detailed updates and notifications.",
            onClick: handleTrackProgress
        },
        {
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            title: "Community Impact",
            description: "Join thousands of citizens working together to improve neighborhoods and build stronger communities."
        }
    ];

    return (
        <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">
                        <span className="text-gray-900">Why Choose </span>
                        <span className="text-gradient">CivicMind?</span>
                    </h2>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        Powerful features designed to make civic engagement simple, transparent, and effective.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            onClick={feature.onClick}
                            className={`glass glass-hover rounded-2xl p-8 transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl hover:shadow-[#3B82F6]/20 ${
                                feature.onClick ? 'cursor-pointer' : ''
                            }`}
                        >
                            <div className="text-[#3B82F6] mb-6">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-900">
                                {feature.title}
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
