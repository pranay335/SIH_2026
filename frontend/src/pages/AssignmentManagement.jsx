import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/button.jsx';

const AssignmentManagement = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);
  const [showManualAssignModal, setShowManualAssignModal] = useState(false);
  const [filterSector, setFilterSector] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  // Fetch all assignments
  const fetchAssignments = async () => {
    try {
      let url = `${API_BASE}/assignments`;
      const params = [];
      if (filterSector) params.push(`sector=${filterSector}`);
      if (filterStatus) params.push(`status=${filterStatus}`);
      if (params.length) url += '?' + params.join('&');

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch assignments');
      const data = await response.json();
      setAssignments(data.data || []);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError(err.message);
    }
  };

  // Fetch unassigned complaints
  const fetchUnassignedComplaints = async () => {
    try {
      const response = await fetch(`${API_BASE}/complaints?status=Pending`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch complaints');
      const data = await response.json();
      setComplaints(data || []);
    } catch (err) {
      console.error('Error fetching complaints:', err);
    }
  };

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_BASE}/users`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(data.filter(u => u.role === 'employee') || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  // Initialize data
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchAssignments(),
          fetchUnassignedComplaints(),
          fetchEmployees()
        ]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (user?.token) initData();
  }, [user?.token]);

  // Refresh when filters change
  useEffect(() => {
    if (!loading) fetchAssignments();
  }, [filterSector, filterStatus]);

  // Auto-assign complaints
  const handleAutoAssign = async (complaintIds) => {
    try {
      const response = await fetch(`${API_BASE}/assignments/auto-assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ complaintIds })
      });
      if (!response.ok) throw new Error('Auto-assignment failed');
      const data = await response.json();
      alert(`${data.data.assigned.length} assignments created!`);
      setShowAutoAssignModal(false);
      await Promise.all([fetchAssignments(), fetchUnassignedComplaints()]);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Manual assign complaint
  const handleManualAssign = async (complaintId, employeeId) => {
    try {
      const response = await fetch(`${API_BASE}/assignments/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ complaintId, employeeId })
      });
      if (!response.ok) throw new Error('Assignment failed');
      alert('Assignment created successfully!');
      setShowManualAssignModal(false);
      await Promise.all([fetchAssignments(), fetchUnassignedComplaints()]);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Reassign
  const handleReassign = async (assignmentId, newEmployeeId) => {
    try {
      const response = await fetch(`${API_BASE}/assignments/${assignmentId}/reassign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ newEmployeeId, reason: 'Reassigned by admin' })
      });
      if (!response.ok) throw new Error('Reassignment failed');
      alert('Reassignment successful!');
      setSelectedAssignment(null);
      await fetchAssignments();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'ASSIGNED': 'bg-yellow-500/20 text-yellow-400',
      'ACKNOWLEDGED': 'bg-blue-500/20 text-blue-400',
      'IN_PROGRESS': 'bg-purple-500/20 text-purple-400',
      'COMPLETED': 'bg-green-500/20 text-green-400',
      'REJECTED': 'bg-red-500/20 text-red-400',
      'REASSIGNED': 'bg-orange-500/20 text-orange-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const filterAssignments = () => {
    let filtered = assignments;
    if (activeTab === 'pending') {
      filtered = filtered.filter(a => ['ASSIGNED', 'ACKNOWLEDGED'].includes(a.status));
    } else if (activeTab === 'active') {
      filtered = filtered.filter(a => a.status === 'IN_PROGRESS');
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(a => a.status === 'COMPLETED');
    }
    return filtered;
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      {/* Header */}
      <header className="glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-white">Assignment Management</h1>
            <div className="flex items-center space-x-4">
              <span className="text-white/80">{user?.name || 'Admin'}</span>
              <Button label="Logout" variant="outline" size="small" onClick={() => { logout(); navigate('/login'); }} />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button label="📋 Auto-Assign All" variant="primary" onClick={() => setShowAutoAssignModal(true)} />
          <Button label="➕ Manual Assignment" variant="primary" onClick={() => setShowManualAssignModal(true)} />
          <Button label="🔄 Refresh" variant="outline" onClick={() => { fetchAssignments(); fetchUnassignedComplaints(); }} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="glass rounded-xl p-4">
            <p className="text-white/60 text-sm">Total Assignments</p>
            <p className="text-2xl font-bold text-white">{assignments.length}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-white/60 text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-400">{assignments.filter(a => ['ASSIGNED', 'ACKNOWLEDGED'].includes(a.status)).length}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-white/60 text-sm">In Progress</p>
            <p className="text-2xl font-bold text-purple-400">{assignments.filter(a => a.status === 'IN_PROGRESS').length}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-white/60 text-sm">Completed</p>
            <p className="text-2xl font-bold text-green-400">{assignments.filter(a => a.status === 'COMPLETED').length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="glass rounded-xl p-4 mb-6 flex flex-wrap gap-4">
          <select value={filterSector} onChange={(e) => setFilterSector(e.target.value)} className="px-3 py-2 bg-white/10 text-white rounded-lg">
            <option value="">All Sectors</option>
            <option value="Water">Water</option>
            <option value="Roads">Roads</option>
            <option value="Waste">Waste</option>
            <option value="Electricity">Electricity</option>
            <option value="Health">Health</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 bg-white/10 text-white rounded-lg">
            <option value="">All Statuses</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          {['all', 'pending', 'active', 'completed'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 ${activeTab === tab ? 'text-blue-400 border-b-2 border-blue-400' : 'text-white/60'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Assignments List */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-white">Loading assignments...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filterAssignments().map(assignment => (
              <div key={assignment._id} className="glass rounded-xl p-4 hover:bg-white/5 transition-all cursor-pointer" onClick={() => setSelectedAssignment(assignment)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-white font-medium">{assignment.complaintId?.description || 'Task'}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(assignment.status)}`}>{assignment.status}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 text-sm">
                      <div><span className="text-white/60">Sector:</span> <span className="text-white">{assignment.sector}</span></div>
                      <div><span className="text-white/60">Employee:</span> <span className="text-white">{assignment.assignedTo?.name || 'Unassigned'}</span></div>
                      <div><span className="text-white/60">Priority:</span> <span className="text-white">{assignment.priority}</span></div>
                      <div><span className="text-white/60">Due:</span> <span className="text-white">{new Date(assignment.dueDate).toLocaleDateString()}</span></div>
                      <div><span className="text-white/60">Auto:</span> <span className="text-white">{assignment.isAutoAssigned ? '✅' : '❌'}</span></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm px-2 py-1 rounded ${assignment.isOverdue ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      {assignment.isOverdue ? '⚠️ Overdue' : '✓ On Time'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filterAssignments().length === 0 && (
              <div className="text-center py-8">
                <p className="text-white/40">No assignments found</p>
              </div>
            )}
          </div>
        )}

        {/* Selected Assignment Details Modal */}
        {selectedAssignment && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="glass rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Assignment Details</h2>
                <button onClick={() => setSelectedAssignment(null)} className="text-white/60 hover:text-white">✕</button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/60 text-sm">Status</p>
                    <p className={`text-white font-bold px-2 py-1 rounded w-fit ${getStatusColor(selectedAssignment.status)}`}>{selectedAssignment.status}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Assigned To</p>
                    <p className="text-white font-bold">{selectedAssignment.assignedTo?.name}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Priority</p>
                    <p className="text-white font-bold">{selectedAssignment.priority}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Sector</p>
                    <p className="text-white font-bold">{selectedAssignment.sector}</p>
                  </div>
                </div>

                <div>
                  <p className="text-white/60 text-sm">Description</p>
                  <p className="text-white">{selectedAssignment.description}</p>
                </div>

                {selectedAssignment.complaintId?.image && (
                  <div>
                    <p className="text-white/60 text-sm mb-2">Image</p>
                    <img src={selectedAssignment.complaintId.image} alt="Complaint" className="w-full h-48 object-cover rounded-lg" />
                  </div>
                )}

                {selectedAssignment.resolutionNotes && (
                  <div>
                    <p className="text-white/60 text-sm">Resolution Notes</p>
                    <p className="text-white">{selectedAssignment.resolutionNotes}</p>
                  </div>
                )}

                {selectedAssignment.resolutionImages?.length > 0 && (
                  <div>
                    <p className="text-white/60 text-sm mb-2">Resolution Images</p>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedAssignment.resolutionImages.map((img, i) => (
                        <img key={i} src={img.url} alt="Resolution" className="w-full h-24 object-cover rounded-lg" />
                      ))}
                    </div>
                  </div>
                )}

                {selectedAssignment.status !== 'COMPLETED' && selectedAssignment.status !== 'REJECTED' && (
                  <div>
                    <p className="text-white/60 text-sm mb-2">Reassign To</p>
                    <select onChange={(e) => {
                      if (e.target.value) {
                        handleReassign(selectedAssignment._id, e.target.value);
                      }
                    }} className="w-full px-3 py-2 bg-white/10 text-white rounded-lg">
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp._id} value={emp._id}>{emp.name} ({emp.department})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Auto-Assign Modal */}
        {showAutoAssignModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="glass rounded-xl p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-white mb-4">Auto-Assign Complaints</h2>
              <p className="text-white/80 mb-4">This will automatically assign {complaints.length} unassigned complaints to the best available employees.</p>
              <div className="flex gap-3">
                <Button label="Cancel" variant="outline" onClick={() => setShowAutoAssignModal(false)} />
                <Button label="Auto-Assign All" onClick={() => handleAutoAssign(complaints.map(c => c._id))} />
              </div>
            </div>
          </div>
        )}

        {/* Manual Assign Modal */}
        {showManualAssignModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="glass rounded-xl p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-white mb-4">Manual Assignment</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm">Select Complaint</label>
                  <select id="complaint" className="w-full px-3 py-2 bg-white/10 text-white rounded-lg mt-1">
                    <option value="">Choose a complaint...</option>
                    {complaints.map(c => (
                      <option key={c._id} value={c._id}>{c.description} - {c.sector}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-white/60 text-sm">Select Employee</label>
                  <select id="employee" className="w-full px-3 py-2 bg-white/10 text-white rounded-lg mt-1">
                    <option value="">Choose an employee...</option>
                    {employees.map(e => (
                      <option key={e._id} value={e._id}>{e.name} ({e.department})</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <Button label="Cancel" variant="outline" onClick={() => setShowManualAssignModal(false)} />
                  <Button label="Assign" onClick={() => {
                    const complaintId = document.getElementById('complaint').value;
                    const employeeId = document.getElementById('employee').value;
                    if (complaintId && employeeId) {
                      handleManualAssign(complaintId, employeeId);
                    } else {
                      alert('Please select both complaint and employee');
                    }
                  }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentManagement;
