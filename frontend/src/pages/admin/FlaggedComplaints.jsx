import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const FlaggedComplaints = () => {
    const { getToken, user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchFlaggedComplaints = async () => {
            try {
                const token = getToken();
                const municipalityParam = user?.municipalityCode ? `?municipalityCode=${user.municipalityCode}` : '';

                const response = await fetch(`http://localhost:5000/api/complaints/flagged${municipalityParam}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setComplaints(data.complaints || []);
                } else {
                    throw new Error('Failed to fetch flagged complaints');
                }
            } catch (err) {
                console.error('Failed to fetch flagged complaints:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchFlaggedComplaints();
        }
    }, [user, getToken]);

    const handleAction = async (complaintId, action) => {
        try {
            const token = getToken();
            const response = await fetch(`http://localhost:5000/api/complaints/${complaintId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: action === 'approve' ? 'Pending' : 'Closed' })
            });

            if (response.ok) {
                setComplaints(prev => prev.filter(c => c._id !== complaintId));
            } else {
                throw new Error('Failed to update complaint status');
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">
                        <span className="text-white">Flagged </span>
                        <span className="text-yellow-400">Complaints 🚩</span>
                    </h2>
                    <p className="text-white/70">
                        Review complaints held back from auto-assignment due to high fraud scores.
                    </p>
                </div>

                {loading ? (
                    <div className="text-white/60 text-center py-8">Loading flagged complaints...</div>
                ) : error ? (
                    <div className="text-red-400 text-center py-8">Error: {error}</div>
                ) : complaints.length === 0 ? (
                    <div className="text-white/60 text-center py-8 glass rounded-xl p-6">No flagged complaints found.</div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {complaints.map(complaint => (
                            <div key={complaint._id} className="glass rounded-xl p-6 border-l-4 border-yellow-500">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{complaint.complaint_id}</h3>
                                        <p className="text-sm text-white/50">{new Date(complaint.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-red-500/20 border border-red-500/30 px-3 py-1 rounded text-red-400 font-bold">
                                        Fraud Score: {complaint.fraudScore}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-white/60 text-sm font-medium">Citizen Information</p>
                                        <p className="text-white">{complaint.user_id?.name || 'Unknown'}</p>
                                        <p className="text-white/50 text-sm">{complaint.user_id?.email || 'N/A'}</p>
                                        <p className="text-white/50 text-sm">Trust Score: {complaint.user_id?.trustScore ?? 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/60 text-sm font-medium">Location Details</p>
                                        <p className="text-white">{complaint.address?.city || complaint.address?.area || 'N/A'}</p>
                                        <p className="text-white/50 text-sm">Sector: {complaint.sector}</p>
                                    </div>
                                </div>

                                <div className="mb-4 bg-yellow-500/10 border border-yellow-500/20 p-3 rounded">
                                    <p className="text-yellow-400 text-sm font-medium mb-1">Flag Reasons:</p>
                                    <p className="text-yellow-100">{complaint.flagReason || 'Unknown'}</p>
                                </div>

                                {complaint.duplicateOf && (
                                    <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded overflow-hidden">
                                        <p className="text-white/60 text-sm font-medium">Original Complaint Reference:</p>
                                        <p className="text-blue-400 hover:text-blue-300 transition cursor-pointer">
                                            #{complaint.duplicateOf?.complaint_id || complaint.duplicateOf} - {complaint.duplicateOf?.sector || ''}
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-4 border-t border-white/10 pt-4 mt-4">
                                    <button 
                                        onClick={() => handleAction(complaint._id, 'approve')}
                                        className="bg-green-600/20 border border-green-500/30 text-green-400 px-4 py-2 rounded font-medium hover:bg-green-600/30 transition-colors"
                                    >
                                        Mark Legitimate (Pass to Assign)
                                    </button>
                                    <button 
                                        onClick={() => handleAction(complaint._id, 'reject')}
                                        className="bg-red-600/20 border border-red-500/30 text-red-400 px-4 py-2 rounded font-medium hover:bg-red-600/30 transition-colors"
                                    >
                                        Dismiss as Fraud
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlaggedComplaints;
