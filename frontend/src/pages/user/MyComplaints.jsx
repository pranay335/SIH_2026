import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/button.jsx';

const MyComplaints = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    // Fetch complaints from database
    useEffect(() => {
        const fetchComplaints = async () => {
            if (!user) {
                setError('Please login to view your complaints');
                setLoading(false);
                return;
            }

            try {
                const token = localStorage.getItem('civicmind_token');
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
            } catch (err) {
                setError(err.message || 'Failed to load complaints');
            } finally {
                setLoading(false);
            }
        };

        fetchComplaints();
    }, [user]);

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
            'Pending': 'bg-red-500/20 text-red-400 border-red-500/30',
            'Rejected': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
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

    const handleViewDetails = (complaint) => {
        setSelectedComplaint(complaint);
        setShowDetailsModal(true);
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'High': 'text-red-400 bg-red-500/20 border-red-500/30',
            'Medium': 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
            'Low': 'text-green-400 bg-green-500/20 border-green-500/30'
        };
        return colors[priority] || 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    };

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="glass rounded-xl p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-white/70">Loading your complaints...</p>
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
                        <p className="text-red-400 text-lg mb-4">Error loading complaints</p>
                        <p className="text-white/60 text-sm">{error}</p>
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
                                        <button 
                                            onClick={() => handleViewDetails(complaint)}
                                            className="px-4 py-2 bg-[#3B82F6]/20 text-[#60A5FA] rounded-lg hover:bg-[#3B82F6]/30 transition-colors text-sm font-medium"
                                        >
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

                {/* Complaint Details Modal */}
                {showDetailsModal && selectedComplaint && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="glass rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 md:p-8">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-2">
                                            Complaint {selectedComplaint.complaint_id}
                                        </h3>
                                        <p className="text-white/60 text-sm font-mono">
                                            {selectedComplaint._id}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(selectedComplaint.status)}`}>
                                            {selectedComplaint.status}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedComplaint.priority)}`}>
                                            {selectedComplaint.priority?.toUpperCase() || 'MEDIUM'} PRIORITY
                                        </span>
                                        <button
                                            onClick={() => setShowDetailsModal(false)}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Complaint Image */}
                                {selectedComplaint.image && (
                                    <div className="mb-6">
                                        <img
                                            src={selectedComplaint.image.startsWith('data:') ? selectedComplaint.image : `data:image/jpeg;base64,${selectedComplaint.image}`}
                                            alt="Complaint evidence"
                                            className="w-full h-64 object-cover rounded-lg border border-white/10"
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Image+Not+Available';
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-white/80 text-sm font-medium mb-2">Complaint Details</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-white/60">Sector:</span>
                                                    <span className="text-white">{selectedComplaint.sector}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-white/60">Date Filed:</span>
                                                    <span className="text-white">{new Date(selectedComplaint.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-white/60">Location:</span>
                                                    <span className="text-white">{selectedComplaint.location}</span>
                                                </div>
                                                {selectedComplaint.estimatedResolution && (
                                                    <div className="flex justify-between">
                                                        <span className="text-white/60">Est. Resolution:</span>
                                                        <span className="text-white">{new Date(selectedComplaint.estimatedResolution).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                                {selectedComplaint.resolvedDate && (
                                                    <div className="flex justify-between">
                                                        <span className="text-white/60">Resolved Date:</span>
                                                        <span className="text-white">{new Date(selectedComplaint.resolvedDate).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-white/80 text-sm font-medium mb-2">Description</h4>
                                            <p className="text-white/70 text-sm leading-relaxed">
                                                {selectedComplaint.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Assigned Employee Details */}
                                        {selectedComplaint.assigned_to && (
                                            <div>
                                                <h4 className="text-white/80 text-sm font-medium mb-2">Assigned To</h4>
                                                <div className="glass rounded-lg p-4 space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] flex items-center justify-center text-white font-semibold">
                                                            {selectedComplaint.assigned_to.name?.charAt(0) || 'E'}
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium">{selectedComplaint.assigned_to.name}</p>
                                                            <p className="text-white/60 text-sm">Municipal Staff</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-2 pt-2">
                                                        <div className="flex items-center gap-2">
                                                            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                            </svg>
                                                            <span className="text-white/70 text-sm">{selectedComplaint.assigned_to.email}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Citizen Details */}
                                        {selectedComplaint.user_id && (
                                            <div>
                                                <h4 className="text-white/80 text-sm font-medium mb-2">Filed By</h4>
                                                <div className="glass rounded-lg p-4 space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10B981] to-[#60A5FA] flex items-center justify-center text-white font-semibold">
                                                            {selectedComplaint.user_id.name?.charAt(0) || 'C'}
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium">{selectedComplaint.user_id.name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-2 pt-2">
                                                        <div className="flex items-center gap-2">
                                                            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                            </svg>
                                                            <span className="text-white/70 text-sm">{selectedComplaint.user_id.email}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 pt-6 border-t border-white/10">
                                    <Button
                                        label="Close"
                                        variant="secondary"
                                        onClick={() => setShowDetailsModal(false)}
                                        className="flex-1"
                                    />
                                    {selectedComplaint.status === 'Under Review' && (
                                        <Button
                                            label="Follow Up"
                                            variant="primary"
                                            className="flex-1"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyComplaints;
