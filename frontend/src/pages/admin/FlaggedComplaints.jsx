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

                const response = await fetch(`http://${window.location.hostname}:5000/api/complaints/flagged${municipalityParam}`, {
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
            const response = await fetch(`http://${window.location.hostname}:5000/api/complaints/${complaintId}`, {
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
                        <span className="text-gray-900">Flagged </span>
                        <span className="text-yellow-600">Complaints 🚩</span>
                    </h2>
                    <p className="text-gray-600">
                        Review complaints held back from auto-assignment due to high fraud scores.
                    </p>
                </div>

                {loading ? (
                    <div className="text-gray-500 text-center py-8">Loading flagged complaints...</div>
                ) : error ? (
                    <div className="text-red-600 text-center py-8">Error: {error}</div>
                ) : complaints.length === 0 ? (
                    <div className="text-gray-500 text-center py-8 glass rounded-xl p-6">No flagged complaints found.</div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {complaints.map(complaint => (
                            <div key={complaint._id} className="glass rounded-xl p-6 border-l-4 border-yellow-500">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{complaint.complaint_id}</h3>
                                        <p className="text-sm text-gray-500">{new Date(complaint.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-red-100 border border-red-200 px-3 py-1 rounded text-red-700 font-bold">
                                        Fraud Score: {complaint.fraudScore}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-gray-500 text-sm font-medium">Citizen Information</p>
                                        <p className="text-gray-900">{complaint.user_id?.name || 'Unknown'}</p>
                                        <p className="text-gray-500 text-sm">{complaint.user_id?.email || 'N/A'}</p>
                                        <p className="text-gray-500 text-sm">Trust Score: {complaint.user_id?.trustScore ?? 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-sm font-medium">Location Details</p>
                                        <p className="text-gray-900">{complaint.address?.city || complaint.address?.area || 'N/A'}</p>
                                        <p className="text-gray-500 text-sm">Sector: {complaint.sector}</p>
                                    </div>
                                </div>

                                <div className="mb-4 bg-yellow-50 border border-yellow-200 p-3 rounded">
                                    <p className="text-yellow-700 text-sm font-medium mb-1">Flag Reasons:</p>
                                    <p className="text-yellow-800">{complaint.flagReason || 'Unknown'}</p>
                                </div>

                                {complaint.duplicateOf && (
                                    <div className="mb-4 p-3 bg-gray-100 border border-gray-200 rounded overflow-hidden">
                                        <p className="text-gray-500 text-sm font-medium">Original Complaint Reference:</p>
                                        <p className="text-blue-600 hover:text-blue-500 transition cursor-pointer">
                                            #{complaint.duplicateOf?.complaint_id || complaint.duplicateOf} - {complaint.duplicateOf?.sector || ''}
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-4 border-t border-gray-200 pt-4 mt-4">
                                    <button
                                        onClick={() => handleAction(complaint._id, 'approve')}
                                        className="bg-green-100 border border-green-200 text-green-700 px-4 py-2 rounded font-medium hover:bg-green-200 transition-colors"
                                    >
                                        Mark Legitimate (Pass to Assign)
                                    </button>
                                    <button
                                        onClick={() => handleAction(complaint._id, 'reject')}
                                        className="bg-red-100 border border-red-200 text-red-700 px-4 py-2 rounded font-medium hover:bg-red-200 transition-colors"
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
