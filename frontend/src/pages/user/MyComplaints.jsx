import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const MyComplaints = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user, getToken } = useAuth();

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            const token = getToken();
            if (!token) {
                throw new Error('Authentication required');
            }

            const response = await fetch(`http://localhost:5000/api/complaints/user/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch complaints');
            }

            const data = await response.json();
            setComplaints(data);
            console.log(`✅ Fetched ${data.length} complaints for user ${user.email}`);
        } catch (err) {
            console.error('❌ Error fetching complaints:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const statusFilters = [
        { value: 'all', label: 'All' },
        { value: 'Pending', label: 'Pending' },
        { value: 'Under Review', label: 'In Progress' },
        { value: 'Resolved', label: 'Resolved' }
    ];

    const filteredComplaints = statusFilter === 'all'
        ? complaints
        : complaints.filter(complaint => complaint.status === statusFilter);

    const getStatusBadge = (status) => {
        const styles = {
            'Under Review': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'Resolved': 'bg-green-500/20 text-green-400 border-green-500/30',
            'Pending': 'bg-red-500/20 text-red-400 border-red-500/30'
        };
        return styles[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

    const handleFilterChange = (value) => {
        setStatusFilter(value);
        if (value === 'all') {
            setSearchParams({});
        } else {
            setSearchParams({ status: value });
        }
    };

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-12">
                        <p className="text-white/50">Loading complaints...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="glass rounded-xl p-12 text-center">
                        <p className="text-red-400 text-lg mb-4">Error: {error}</p>
                        <button 
                            onClick={fetchComplaints}
                            className="px-4 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">
                        <span className="text-white">My </span>
                        <span className="text-gradient">Complaints</span>
                    </h2>
                    <p className="text-white/70">
                        Track and manage all your submitted complaints.
                    </p>
                </div>

                {/* Filters */}
                <div className="glass rounded-xl p-6 mb-6">
                    <div className="flex flex-wrap gap-3">
                        {statusFilters.map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => handleFilterChange(filter.value)}
                                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                                    statusFilter === filter.value
                                        ? 'bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/20'
                                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Complaints List */}
                {filteredComplaints.length > 0 ? (
                    <div className="space-y-4">
                        {filteredComplaints.map((complaint) => (
                            <div
                                key={complaint._id}
                                className="glass glass-hover rounded-xl p-6 transform transition-all duration-300"
                            >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white mb-1">
                                                    {complaint.complaint_id}
                                                </h3>
                                                <p className="text-white/60 text-sm font-mono mb-2">
                                                    {complaint._id}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(complaint.status)}`}>
                                                {complaint.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-white/60">Priority: </span>
                                                <span className="text-white">{complaint.priority}</span>
                                            </div>
                                            <div>
                                                <span className="text-white/60">Date: </span>
                                                <span className="text-white">{new Date(complaint.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <p className="text-white/70 text-sm mt-3">
                                            {complaint.description}
                                        </p>
                                    </div>
                                    <div className="flex md:flex-col gap-2">
                                        <button className="px-4 py-2 bg-[#3B82F6]/20 text-[#60A5FA] rounded-lg hover:bg-[#3B82F6]/30 transition-colors text-sm font-medium">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="glass rounded-xl p-12 text-center">
                        <p className="text-white/50 text-lg mb-4">No complaints found for this filter.</p>
                        <p className="text-white/40 text-sm">Try selecting a different status filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyComplaints;
