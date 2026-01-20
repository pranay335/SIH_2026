import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/button.jsx';

const ComplaintDetail = () => {
    const { id } = useParams();
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchComplaintDetail();
    }, [id]);

    const fetchComplaintDetail = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/complaints/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setComplaint(data);
            } else {
                throw new Error('Failed to fetch complaint details');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            'Under Review': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'Resolved': 'bg-green-500/20 text-green-400 border-green-500/30',
            'Pending': 'bg-red-500/20 text-red-400 border-red-500/30',
            'Rejected': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        };
        return styles[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

    const getPriorityBadge = (priority) => {
        const styles = {
            'High': 'bg-red-500/20 text-red-400 border-red-500/30',
            'Medium': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'Low': 'bg-green-500/20 text-green-400 border-green-500/30'
        };
        return styles[priority] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center py-12">
                        <div className="text-white/70">Loading complaint details...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !complaint) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="glass rounded-xl p-8 text-center">
                        <div className="text-red-400 mb-4">Error: {error || 'Complaint not found'}</div>
                        <Link to="/user/my-complaints">
                            <Button label="Back to My Complaints" variant="secondary" />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <Link 
                            to="/user/my-complaints" 
                            className="text-[#60A5FA] hover:text-[#3B82F6] text-sm font-medium mb-4 inline-block transition-colors"
                        >
                            ← Back to My Complaints
                        </Link>
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                            Complaint Details
                        </h1>
                        <p className="text-white/70 font-mono text-sm">
                            {complaint.complaint_id}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityBadge(complaint.priority)}`}>
                            {complaint.priority} Priority
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(complaint.status)}`}>
                            {complaint.status}
                        </span>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Main Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Description */}
                        <div className="glass rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Description</h3>
                            <p className="text-white/80 leading-relaxed">
                                {complaint.description}
                            </p>
                        </div>

                        {/* Image */}
                        {complaint.image && (
                            <div className="glass rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Evidence Image</h3>
                                <div className="relative">
                                    <img
                                        src={complaint.image}
                                        alt="Complaint evidence"
                                        className="w-full rounded-lg border border-white/20"
                                        onClick={() => window.open(complaint.image, '_blank')}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <button
                                        onClick={() => window.open(complaint.image, '_blank')}
                                        className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors"
                                        title="View in full screen"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {complaint.notes && (
                            <div className="glass rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Admin Notes</h3>
                                <p className="text-white/80 leading-relaxed">
                                    {complaint.notes}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Metadata */}
                    <div className="space-y-6">
                        {/* Status Information */}
                        <div className="glass rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Status Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <span className="text-white/60 text-sm">Current Status</span>
                                    <div className={`mt-1 px-3 py-2 rounded-lg text-sm font-medium border ${getStatusBadge(complaint.status)}`}>
                                        {complaint.status}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-white/60 text-sm">Priority Level</span>
                                    <div className={`mt-1 px-3 py-2 rounded-lg text-sm font-medium border ${getPriorityBadge(complaint.priority)}`}>
                                        {complaint.priority}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="glass rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-white/60 text-sm">Filed on</span>
                                    <div className="text-white font-medium">
                                        {new Date(complaint.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                                {complaint.updatedAt && complaint.updatedAt !== complaint.createdAt && (
                                    <div>
                                        <span className="text-white/60 text-sm">Last updated</span>
                                        <div className="text-white font-medium">
                                            {new Date(complaint.updatedAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Location */}
                        {complaint.location && (
                            <div className="glass rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Location</h3>
                                <p className="text-white/80">
                                    {complaint.location}
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="glass rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
                            <div className="space-y-3">
                                <Link to="/user/my-complaints">
                                    <Button
                                        label="View All Complaints"
                                        variant="secondary"
                                        size="medium"
                                        className="w-full"
                                    />
                                </Link>
                                <Link to="/user/complaint">
                                    <Button
                                        label="File New Complaint"
                                        variant="primary"
                                        size="medium"
                                        className="w-full"
                                    />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplaintDetail;
