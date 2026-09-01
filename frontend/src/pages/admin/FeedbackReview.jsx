import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { feedbackService } from '../../services/apiService.js';

const FeedbackReview = () => {
    const { getToken } = useAuth();
    const [feedbackList, setFeedbackList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeFilter, setActiveFilter] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);

    // Reassign state
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [reassigning, setReassigning] = useState(false);

    useEffect(() => {
        fetchFeedback();
    }, [activeFilter]);

    const fetchFeedback = async () => {
        try {
            setLoading(true);
            const data = await feedbackService.getAllFeedback(activeFilter);
            if (data.success) {
                setFeedbackList(data.feedback);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const token = getToken();
            const response = await fetch(`http://${window.location.hostname}:5000/api/users/employees`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setEmployees(data);
            }
        } catch (err) {
            console.error('Error fetching employees:', err);
        }
    };

    const handleReassign = async (groupId) => {
        if (!selectedEmployee) return;

        setReassigning(true);
        try {
            const token = getToken();
            const response = await fetch(`http://${window.location.hostname}:5000/api/complaints/groups/${groupId}/assign`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    assigned_to: selectedEmployee,
                    notes: 'Reassigned after negative citizen feedback'
                })
            });
            const data = await response.json();
            if (data.success) {
                setShowReassignModal(false);
                setSelectedEmployee('');
                fetchFeedback(); // refresh
                alert('Complaint group reassigned successfully!');
            }
        } catch (err) {
            console.error('Reassignment failed:', err);
            alert('Failed to reassign complaint');
        } finally {
            setReassigning(false);
        }
    };

    const getStatusBadge = (feedbackStatus) => {
        switch (feedbackStatus) {
            case 'PENDING':
                return { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: '⏳ Pending' };
            case 'SATISFIED':
                return { color: 'bg-green-100 text-green-700 border-green-200', label: '✅ Satisfied' };
            case 'NOT_SATISFIED':
                return { color: 'bg-red-100 text-red-700 border-red-200', label: '❌ Not Satisfied' };
            default:
                return { color: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Unknown' };
        }
    };

    const filters = [
        { value: '', label: 'All' },
        { value: 'PENDING', label: '⏳ Pending' },
        { value: 'SATISFIED', label: '✅ Satisfied' },
        { value: 'NOT_SATISFIED', label: '❌ Not Satisfied' }
    ];

    if (loading) {
        return (
            <div className="p-6 text-gray-900 text-center">
                <div className="animate-pulse text-xl">Loading feedback...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-900">📋 Feedback Review</h2>
                <span className="text-gray-400 text-sm">{feedbackList.length} entries</span>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {filters.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setActiveFilter(f.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeFilter === f.value
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {/* Feedback Cards */}
            {feedbackList.length === 0 ? (
                <div className="text-center py-16">
                    <span className="text-5xl mb-4 block">📭</span>
                    <p className="text-gray-400 text-lg">No feedback entries found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {feedbackList.map((item) => {
                        const badge = getStatusBadge(item.feedbackStatus);
                        return (
                            <div
                                key={item.groupId}
                                className="glass rounded-xl p-6 hover:border-gray-300 transition-all cursor-pointer"
                                onClick={() => setSelectedItem(selectedItem?.groupId === item.groupId ? null : item)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-gray-900 font-semibold">{item.groupId}</h3>
                                            <span className={`px-3 py-1 text-xs rounded-full border ${badge.color}`}>
                                                {badge.label}
                                            </span>
                                            {item.reopened && (
                                                <span className="px-2 py-1 text-[10px] rounded-full bg-red-100 text-red-700 border border-red-200 font-bold">
                                                    🔄 REOPENED {item.reopenCount > 1 ? `(${item.reopenCount}x)` : ''}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-600 text-sm">{item.issueTitle}</p>
                                        <div className="flex flex-wrap gap-4 mt-2">
                                            <span className="text-gray-400 text-xs">🏢 {item.sector}</span>
                                            <span className="text-gray-400 text-xs">
                                                👔 {item.assignedTo?.name || 'Unassigned'}
                                            </span>
                                            <span className="text-gray-400 text-xs">
                                                👥 {item.complaintCount || 1} complaint(s)
                                            </span>
                                            {item.resolutionTimeHours && (
                                                <span className="text-gray-400 text-xs">
                                                    ⏱️ Resolved in {item.resolutionTimeHours}h
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Detail */}
                                {selectedItem?.groupId === item.groupId && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                                        {/* Feedback Message */}
                                        {item.feedbackMessage && (
                                            <div className="p-3 bg-gray-100 rounded-lg">
                                                <p className="text-gray-400 text-xs font-medium mb-1">Citizen's Comment:</p>
                                                <p className="text-gray-600 text-sm italic">"{item.feedbackMessage}"</p>
                                            </div>
                                        )}

                                        {/* Feedback Given By */}
                                        {item.feedbackGivenBy && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-gray-400">Feedback by:</span>
                                                <span className="text-gray-900">{item.feedbackGivenBy.name}</span>
                                                <span className="text-gray-400">({item.feedbackGivenBy.email})</span>
                                            </div>
                                        )}

                                        {/* Feedback Date */}
                                        {item.feedbackGivenAt && (
                                            <div className="text-sm text-gray-400">
                                                📅 {new Date(item.feedbackGivenAt).toLocaleString()}
                                            </div>
                                        )}

                                        {/* Resolution Images */}
                                        {item.resolutionImages && item.resolutionImages.length > 0 && (
                                            <div>
                                                <p className="text-gray-400 text-xs font-medium mb-2">Resolution Proof:</p>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {item.resolutionImages.map((img, idx) => (
                                                        <img
                                                            key={idx}
                                                            src={img}
                                                            alt={`Proof ${idx + 1}`}
                                                            className="rounded-lg h-24 w-full object-cover border border-gray-200 cursor-pointer hover:scale-105 transition-transform"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(img, '_blank');
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Affected Users */}
                                        {item.affectedUsers && item.affectedUsers.length > 0 && (
                                            <div>
                                                <p className="text-gray-400 text-xs font-medium mb-1">Affected Citizens:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {item.affectedUsers.map((u, idx) => (
                                                        <span key={idx} className="px-2 py-1 text-xs bg-gray-100 rounded text-gray-500">
                                                            {u.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Reassign Button for NOT_SATISFIED */}
                                        {item.feedbackStatus === 'NOT_SATISFIED' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedItem(item);
                                                    setShowReassignModal(true);
                                                    fetchEmployees();
                                                }}
                                                className="mt-2 px-4 py-2 bg-blue-100 border border-blue-200 rounded-lg text-blue-700 font-medium hover:bg-blue-200 transition-all text-sm"
                                            >
                                                🔄 Reassign to Another Employee
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Reassign Modal */}
            {showReassignModal && selectedItem && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="glass p-6 rounded-xl max-w-md w-full">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            Reassign: {selectedItem.groupId}
                        </h3>
                        <p className="text-gray-500 text-sm mb-4">
                            Select a new employee to handle this reopened complaint:
                        </p>

                        <select
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900 mb-4 focus:outline-none focus:border-blue-500"
                        >
                            <option value="" className="bg-white">Select Employee</option>
                            {employees
                                .filter(emp => emp._id !== selectedItem.assignedTo?._id)
                                .map(emp => (
                                    <option key={emp._id} value={emp._id} className="bg-white">
                                        {emp.name} — {emp.department} ({emp.currentWorkload || 0}/{emp.maxConcurrentComplaints || 5})
                                    </option>
                                ))
                            }
                        </select>

                        <div className="flex gap-3">
                            <button
                                onClick={() => handleReassign(selectedItem.groupId)}
                                disabled={!selectedEmployee || reassigning}
                                className="flex-1 py-3 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {reassigning ? 'Reassigning...' : 'Confirm Reassign'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowReassignModal(false);
                                    setSelectedEmployee('');
                                }}
                                className="px-4 py-3 rounded-lg bg-gray-100 text-gray-500 font-medium hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedbackReview;
