import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/button.jsx';
import { complaintService } from '../../services/apiService.js';

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

  const filteredComplaints =
    statusFilter === 'all'
      ? complaints
      : complaints.filter((c) => c.status === statusFilter);

  const getStatusBadge = (status) => ({
    'Pending': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Under Review': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'Resolved': 'bg-green-500/20 text-green-400 border-green-500/30'
  }[status] || 'bg-gray-500/20 text-gray-400');

  if (loading) {
    return <div className="text-white text-center p-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-400 text-center p-8">{error}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-6">My Complaints</h2>

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
            }}
          />
        </div>
      ))}

      {showDetailsModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="glass p-6 rounded-xl max-w-lg w-full">
            <h3 className="text-xl font-bold text-white mb-2">
              {selectedComplaint.complaint_id}
            </h3>

            <p className="text-white/70 mb-2">
              {selectedComplaint.description}
            </p>

            <p className="text-white/60 text-sm">
              📍 {formatLocation(selectedComplaint.location)}
            </p>

            {selectedComplaint.status === 'Assigned' && selectedComplaint.assigned_to && (
              <div className="mb-4 p-3 rounded bg-green-500/10 border border-green-500/20">
                <p className="text-xs uppercase tracking-wider text-green-300 font-semibold mb-1">Assigned Representative</p>
                <p className="text-white font-medium">{selectedComplaint.assigned_to.name}</p>
                <p className="text-white/60 text-sm">{selectedComplaint.assigned_to.email}</p>
              </div>
            )}

            <Button
              label="Close"
              variant="secondary"
              className="mt-4 w-full"
              onClick={() => setShowDetailsModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MyComplaints;
