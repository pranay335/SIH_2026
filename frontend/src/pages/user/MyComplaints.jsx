import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/button.jsx';
import { complaintService, feedbackService } from '../../services/apiService.js';

/* 🔥 Helper to format GeoJSON location */
const formatLocation = (location) => {
  if (!location) return 'N/A';

  // GeoJSON
  if (typeof location === 'object' && location.coordinates) {
    const [lng, lat] = location.coordinates;
    return `Lat: ${lat}, Lng: ${lng}`;
  }

  // Old string support
  if (typeof location === 'string') {
    return location;
  }

  return 'N/A';
};

const MyComplaints = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get('status') || 'all'
  );
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Feedback state
  const [feedbackData, setFeedbackData] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  useEffect(() => {
    const fetchComplaints = async () => {
      if (!user) {
        setError('Please login to view your complaints');
        setLoading(false);
        return;
      }

      try {
        const data = await complaintService.getComplaintsByUser(user._id);
        setComplaints(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [user]);

  // Fetch feedback status when a resolved complaint is selected
  const fetchFeedbackForComplaint = async (complaint) => {
    if (!complaint.group_id) return;

    setFeedbackLoading(true);
    setFeedbackData(null);
    setFeedbackSuccess('');
    setFeedbackMessage('');

    try {
      // group_id could be an ObjectId, we need the group_id string
      // Try fetching by the group's _id
      const groupId = typeof complaint.group_id === 'object'
        ? complaint.group_id.group_id || complaint.group_id._id
        : complaint.group_id;

      // Use complaint group endpoint to get group details first
      const token = localStorage.getItem('civicmind_token');
      const response = await fetch(`http://${window.location.hostname}:5000/api/complaints/groups`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (data.success && data.groups) {
        // Find the group that contains this complaint
        const group = data.groups.find(g =>
          g.complaints.some(c => {
            const cId = typeof c === 'object' ? (c._id || c) : c;
            return cId.toString() === complaint._id.toString();
          })
        );

        if (group) {
          setFeedbackData({
            groupId: group.group_id,
            feedbackStatus: group.feedbackStatus,
            feedbackMessage: group.feedbackMessage,
            resolutionImages: group.resolution_images || [],
            reopened: group.reopened,
            reopenCount: group.reopenCount || 0,
            status: group.status
          });
        }
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleSubmitFeedback = async (status) => {
    if (!feedbackData?.groupId) return;

    setFeedbackSubmitting(true);
    try {
      const result = await feedbackService.submitFeedback(feedbackData.groupId, {
        status,
        message: feedbackMessage
      });

      setFeedbackSuccess(result.message);
      setFeedbackData(prev => ({
        ...prev,
        feedbackStatus: status,
        feedbackMessage: feedbackMessage
      }));

      // Refresh complaints list
      const data = await complaintService.getComplaintsByUser(user._id);
      setComplaints(data);
    } catch (err) {
      setFeedbackSuccess('Error: ' + err.message);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const filteredComplaints =
    statusFilter === 'all'
      ? complaints
      : complaints.filter((c) => c.status === statusFilter);

  const getStatusBadge = (status) => ({
    'Pending': 'bg-red-100 text-red-700 border-red-200',
    'Assigned': 'bg-blue-100 text-blue-700 border-blue-200',
    'In Progress': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Flagged': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Rejected': 'bg-red-200 text-red-800 border-red-300',
    'Under Review': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Resolved': 'bg-green-100 text-green-700 border-green-200',
    'Closed': 'bg-gray-200 text-gray-700 border-gray-300'
  }[status] || 'bg-gray-100 text-gray-600 border-gray-200');

  const getFeedbackBadge = (feedbackStatus) => {
    switch (feedbackStatus) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'SATISFIED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'NOT_SATISFIED':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  if (loading) {
    return <div className="text-gray-900 text-center p-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center p-8">{error}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">My Complaints</h2>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed'].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setSearchParams(s === 'all' ? {} : { status: s });
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {filteredComplaints.map((complaint) => (
        <div
          key={complaint._id}
          className="glass rounded-xl p-6 mb-4"
        >
          <div className="flex justify-between">
            <h3 className="text-gray-900 font-semibold">
              {complaint.complaint_id}
            </h3>
            <span className={`px-3 py-1 text-xs rounded-full border ${getStatusBadge(complaint.status)}`}>
              {complaint.status === 'Flagged' ? '⚠️ Under Review' : complaint.status === 'Rejected' ? '❌ Discarded' : complaint.status}
            </span>
          </div>

          <p className="text-gray-600 mt-2">{complaint.description}</p>

          {(complaint.status === 'Flagged' || complaint.status === 'Rejected') && (
              <div className={`mt-3 border p-3 rounded-lg text-sm ${complaint.status === 'Rejected' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                  <b>{complaint.status === 'Rejected' ? 'Suspicious Rejection:' : 'Review Reason:'}</b> {complaint.flagReason || 'Pending manual verification'}
              </div>
          )}

          <p className="text-gray-500 text-sm mt-2">
            📍 {formatLocation(complaint.location)}
          </p>

          {complaint.status === 'Assigned' && complaint.assigned_to && (
            <p className="text-green-600 text-xs mt-2 font-medium">
              👔 Assigned to: {complaint.assigned_to.name}
            </p>
          )}

          <Button
            label="View Details"
            variant="secondary"
            size="small"
            className="mt-3"
            onClick={() => {
              setSelectedComplaint(complaint);
              setShowDetailsModal(true);
              setFeedbackData(null);
              setFeedbackSuccess('');
              setFeedbackMessage('');
              // Fetch feedback if complaint is resolved or closed
              if (['Resolved', 'Closed'].includes(complaint.status)) {
                fetchFeedbackForComplaint(complaint);
              }
            }}
          />
        </div>
      ))}

      {filteredComplaints.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No complaints found</p>
        </div>
      )}

      {/* Details Modal with Feedback */}
      {showDetailsModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="glass p-6 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {selectedComplaint.complaint_id}
            </h3>

            <span className={`inline-block px-3 py-1 text-xs rounded-full border mb-3 ${getStatusBadge(selectedComplaint.status)}`}>
              {selectedComplaint.status === 'Flagged' ? '⚠️ Under Review' : selectedComplaint.status === 'Rejected' ? '❌ Discarded' : selectedComplaint.status}
            </span>

            <p className="text-gray-600 mb-2">
              {selectedComplaint.description}
            </p>

            {(selectedComplaint.status === 'Flagged' || selectedComplaint.status === 'Rejected') && (
              <div className={`mb-3 border p-3 rounded-lg text-sm ${selectedComplaint.status === 'Rejected' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                  <b>{selectedComplaint.status === 'Rejected' ? 'Suspicious Rejection:' : 'Review Reason:'}</b> {selectedComplaint.flagReason || 'Pending manual verification'}
              </div>
            )}

            <p className="text-gray-500 text-sm">
              📍 {formatLocation(selectedComplaint.location)}
            </p>

            {selectedComplaint.address && (
              <p className="text-gray-500 text-sm mt-1">
                🏠 {selectedComplaint.address.fullAddress || 'N/A'}
              </p>
            )}

            {selectedComplaint.status === 'Assigned' && selectedComplaint.assigned_to && (
              <div className="mb-4 p-3 rounded bg-green-50 border border-green-200 mt-3">
                <p className="text-xs uppercase tracking-wider text-green-700 font-semibold mb-1">Assigned Representative</p>
                <p className="text-gray-900 font-medium">{selectedComplaint.assigned_to.name}</p>
                <p className="text-gray-500 text-sm">{selectedComplaint.assigned_to.email}</p>
              </div>
            )}

            {/* ===== FEEDBACK SECTION ===== */}
            {['Resolved', 'Closed'].includes(selectedComplaint.status) && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">📋 Resolution Feedback</h4>

                {feedbackLoading ? (
                  <div className="text-gray-500 text-center py-4">Loading feedback info...</div>
                ) : feedbackData ? (
                  <div>
                    {/* Resolution Images */}
                    {feedbackData.resolutionImages && feedbackData.resolutionImages.length > 0 && (
                      <div className="mb-4">
                        <p className="text-gray-500 text-sm font-medium mb-2">📸 Resolution Proof:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {feedbackData.resolutionImages.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Resolution proof ${idx + 1}`}
                              className="rounded-lg w-full h-32 object-cover border border-gray-200"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reopened Badge */}
                    {feedbackData.reopened && (
                      <div className="mb-3 p-2 rounded bg-red-50 border border-red-200">
                        <p className="text-red-600 text-sm font-medium">
                          🔄 This complaint was reopened {feedbackData.reopenCount > 1 ? `${feedbackData.reopenCount} times` : ''}
                        </p>
                      </div>
                    )}

                    {/* Feedback Already Given */}
                    {feedbackData.feedbackStatus && feedbackData.feedbackStatus !== 'PENDING' ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-sm">Your Feedback:</span>
                          <span className={`px-3 py-1 text-xs rounded-full border ${getFeedbackBadge(feedbackData.feedbackStatus)}`}>
                            {feedbackData.feedbackStatus === 'SATISFIED' ? '✅ Satisfied' : '❌ Not Satisfied'}
                          </span>
                        </div>
                        {feedbackData.feedbackMessage && (
                          <p className="text-gray-500 text-sm italic">
                            "{feedbackData.feedbackMessage}"
                          </p>
                        )}
                      </div>
                    ) : feedbackData.feedbackStatus === 'PENDING' ? (
                      /* Feedback Form */
                      <div className="space-y-3">
                        {feedbackSuccess ? (
                          <div className={`p-3 rounded text-sm border ${feedbackSuccess.startsWith('Error')
                              ? 'bg-red-50 text-red-600 border-red-200'
                              : 'bg-green-50 text-green-600 border-green-200'
                            }`}>
                            {feedbackSuccess}
                          </div>
                        ) : (
                          <>
                            <p className="text-gray-500 text-sm">Was this issue resolved to your satisfaction?</p>

                            <textarea
                              value={feedbackMessage}
                              onChange={(e) => setFeedbackMessage(e.target.value)}
                              placeholder="Optional: Add a comment about the resolution..."
                              className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                              rows={3}
                            />

                            <div className="flex gap-3">
                              <button
                                onClick={() => handleSubmitFeedback('SATISFIED')}
                                disabled={feedbackSubmitting}
                                className="flex-1 py-3 px-4 rounded-lg bg-green-100 border border-green-300 text-green-700 font-medium hover:bg-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {feedbackSubmitting ? '...' : '👍 Satisfied'}
                              </button>
                              <button
                                onClick={() => handleSubmitFeedback('NOT_SATISFIED')}
                                disabled={feedbackSubmitting}
                                className="flex-1 py-3 px-4 rounded-lg bg-red-100 border border-red-300 text-red-700 font-medium hover:bg-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {feedbackSubmitting ? '...' : '👎 Not Satisfied'}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No feedback information available</p>
                )}
              </div>
            )}

            <Button
              label="Close"
              variant="secondary"
              className="mt-4 w-full"
              onClick={() => {
                setShowDetailsModal(false);
                setFeedbackData(null);
                setFeedbackSuccess('');
                setFeedbackMessage('');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MyComplaints;
