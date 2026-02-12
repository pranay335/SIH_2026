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
      const response = await fetch(`http://localhost:5000/api/complaints/groups`, {
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
    'Pending': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Assigned': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'In Progress': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'Under Review': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'Resolved': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Closed': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }[status] || 'bg-gray-500/20 text-gray-400');

  const getFeedbackBadge = (feedbackStatus) => {
    switch (feedbackStatus) {
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'SATISFIED':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'NOT_SATISFIED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return <div className="text-white text-center p-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-400 text-center p-8">{error}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-6">My Complaints</h2>

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
                : 'bg-white/5 text-white/60 hover:bg-white/10'
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
            <h3 className="text-white font-semibold">
              {complaint.complaint_id}
            </h3>
            <span className={`px-3 py-1 text-xs rounded-full border ${getStatusBadge(complaint.status)}`}>
              {complaint.status}
            </span>
          </div>

          <p className="text-white/70 mt-2">{complaint.description}</p>

          <p className="text-white/50 text-sm mt-2">
            📍 {formatLocation(complaint.location)}
          </p>

          {complaint.status === 'Assigned' && complaint.assigned_to && (
            <p className="text-green-400 text-xs mt-2 font-medium">
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
          <p className="text-white/40 text-lg">No complaints found</p>
        </div>
      )}

      {/* Details Modal with Feedback */}
      {showDetailsModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="glass p-6 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-2">
              {selectedComplaint.complaint_id}
            </h3>

            <span className={`inline-block px-3 py-1 text-xs rounded-full border mb-3 ${getStatusBadge(selectedComplaint.status)}`}>
              {selectedComplaint.status}
            </span>

            <p className="text-white/70 mb-2">
              {selectedComplaint.description}
            </p>

            <p className="text-white/60 text-sm">
              📍 {formatLocation(selectedComplaint.location)}
            </p>

            {selectedComplaint.address && (
              <p className="text-white/50 text-sm mt-1">
                🏠 {selectedComplaint.address.fullAddress || 'N/A'}
              </p>
            )}

            {selectedComplaint.status === 'Assigned' && selectedComplaint.assigned_to && (
              <div className="mb-4 p-3 rounded bg-green-500/10 border border-green-500/20 mt-3">
                <p className="text-xs uppercase tracking-wider text-green-300 font-semibold mb-1">Assigned Representative</p>
                <p className="text-white font-medium">{selectedComplaint.assigned_to.name}</p>
                <p className="text-white/60 text-sm">{selectedComplaint.assigned_to.email}</p>
              </div>
            )}

            {/* ===== FEEDBACK SECTION ===== */}
            {['Resolved', 'Closed'].includes(selectedComplaint.status) && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <h4 className="text-lg font-semibold text-white mb-3">📋 Resolution Feedback</h4>

                {feedbackLoading ? (
                  <div className="text-white/50 text-center py-4">Loading feedback info...</div>
                ) : feedbackData ? (
                  <div>
                    {/* Resolution Images */}
                    {feedbackData.resolutionImages && feedbackData.resolutionImages.length > 0 && (
                      <div className="mb-4">
                        <p className="text-white/60 text-sm font-medium mb-2">📸 Resolution Proof:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {feedbackData.resolutionImages.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Resolution proof ${idx + 1}`}
                              className="rounded-lg w-full h-32 object-cover border border-white/10"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reopened Badge */}
                    {feedbackData.reopened && (
                      <div className="mb-3 p-2 rounded bg-red-500/10 border border-red-500/30">
                        <p className="text-red-400 text-sm font-medium">
                          🔄 This complaint was reopened {feedbackData.reopenCount > 1 ? `${feedbackData.reopenCount} times` : ''}
                        </p>
                      </div>
                    )}

                    {/* Feedback Already Given */}
                    {feedbackData.feedbackStatus && feedbackData.feedbackStatus !== 'PENDING' ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-white/60 text-sm">Your Feedback:</span>
                          <span className={`px-3 py-1 text-xs rounded-full border ${getFeedbackBadge(feedbackData.feedbackStatus)}`}>
                            {feedbackData.feedbackStatus === 'SATISFIED' ? '✅ Satisfied' : '❌ Not Satisfied'}
                          </span>
                        </div>
                        {feedbackData.feedbackMessage && (
                          <p className="text-white/50 text-sm italic">
                            "{feedbackData.feedbackMessage}"
                          </p>
                        )}
                      </div>
                    ) : feedbackData.feedbackStatus === 'PENDING' ? (
                      /* Feedback Form */
                      <div className="space-y-3">
                        {feedbackSuccess ? (
                          <div className={`p-3 rounded text-sm ${feedbackSuccess.startsWith('Error')
                              ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                              : 'bg-green-500/10 text-green-400 border border-green-500/30'
                            }`}>
                            {feedbackSuccess}
                          </div>
                        ) : (
                          <>
                            <p className="text-white/60 text-sm">Was this issue resolved to your satisfaction?</p>

                            <textarea
                              value={feedbackMessage}
                              onChange={(e) => setFeedbackMessage(e.target.value)}
                              placeholder="Optional: Add a comment about the resolution..."
                              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500/50 resize-none"
                              rows={3}
                            />

                            <div className="flex gap-3">
                              <button
                                onClick={() => handleSubmitFeedback('SATISFIED')}
                                disabled={feedbackSubmitting}
                                className="flex-1 py-3 px-4 rounded-lg bg-green-600/20 border border-green-500/30 text-green-400 font-medium hover:bg-green-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {feedbackSubmitting ? '...' : '👍 Satisfied'}
                              </button>
                              <button
                                onClick={() => handleSubmitFeedback('NOT_SATISFIED')}
                                disabled={feedbackSubmitting}
                                className="flex-1 py-3 px-4 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 font-medium hover:bg-red-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <p className="text-white/40 text-sm">No feedback information available</p>
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
