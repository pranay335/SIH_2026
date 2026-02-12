import { useAuth } from '../../context/AuthContext';

const UserProfile = () => {
    const { user } = useAuth();

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">
                        <span className="text-white">My </span>
                        <span className="text-gradient">Profile</span>
                    </h2>
                    <p className="text-white/70">
                        Manage your account information and preferences.
                    </p>
                </div>

                <div className="glass rounded-xl p-6 md:p-8 space-y-6">
                    <div className="flex items-center space-x-6 mb-8">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] flex items-center justify-center text-white text-3xl font-semibold">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">{user?.name || 'User'}</h3>
                            <p className="text-white/60">{user?.email || 'user@example.com'}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={user?.name || ''}
                                readOnly
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/70"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                readOnly
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/70"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-2">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={user?.phone || ''}
                                readOnly
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/70"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-2">
                                Assigned Municipality
                            </label>
                            <input
                                type="text"
                                value={user?.municipalityCode || 'Not Set'}
                                readOnly
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/70"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
