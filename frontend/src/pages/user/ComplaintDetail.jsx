import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/button.jsx';
import { complaintService } from '../../services/apiService.js';

/* 🔥 Helper */
const formatLocation = (location) => {
  if (!location) return 'N/A';

  if (typeof location === 'object' && location.coordinates) {
    const [lng, lat] = location.coordinates;
    return `Lat: ${lat}, Lng: ${lng}`;
  }

  if (typeof location === 'string') return location;

  return 'N/A';
};

const ComplaintDetail = () => {
  const { id } = useParams();
  const { getToken } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        const data = await complaintService.getComplaintById(id);
        setComplaint(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [id]);

  if (loading) return <div className="text-gray-900 p-8">Loading...</div>;
  if (error || !complaint)
    return <div className="text-red-600 p-8">{error}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link to="/user/my-complaints" className="text-blue-600">
        ← Back
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mt-4">
        {complaint.complaint_id}
      </h1>

      <p className="text-gray-600 mt-3">{complaint.description}</p>

      <div className="glass rounded-xl p-4 mt-6">
        <p className="text-gray-500 text-sm">Sector</p>
        <p className="text-gray-900">{complaint.sector}</p>

        <p className="text-gray-500 text-sm mt-4">Location</p>
        <p className="text-gray-900">
          {formatLocation(complaint.location)}
        </p>
      </div>

      {complaint.image && (
        <img
          src={complaint.image}
          alt="Complaint"
          className="rounded-xl mt-6"
        />
      )}

      <Button
        label="Back to My Complaints"
        variant="secondary"
        className="mt-6"
        onClick={() => window.history.back()}
      />
    </div>
  );
};

export default ComplaintDetail;
