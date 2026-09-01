import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const API = `http://${window.location.hostname}:5000/api`;

const statusFilters = [
    { value: '', label: 'All' },
    { value: 'Assigned', label: 'Assigned' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Reopened', label: 'Reopened' },
];

const statusColors = {
    Pending: 'bg-gray-100 text-gray-600 border-gray-200',
    Assigned: 'bg-blue-100 text-blue-700 border-blue-200',
    'In Progress': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Resolved: 'bg-green-100 text-green-700 border-green-200',
    Closed: 'bg-purple-100 text-purple-700 border-purple-200',
};

const availabilityColors = {
    AVAILABLE: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
    BUSY: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
    OFF_DUTY: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
    ON_LEAVE: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
};

const CapacityBar = ({ current, max }) => {
    const pct = Math.min((current / max) * 100, 100);
    const filled = Math.min(current, max);
    return (
        <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
                {Array.from({ length: max }, (_, i) => (
                    <div
                        key={i}
                        className={`w-3 h-3 rounded-sm transition-all ${i < filled
                                ? pct >= 80 ? 'bg-red-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                                : 'bg-gray-200'
                            }`}
                    />
                ))}
            </div>
            <span className="text-gray-500 text-xs">{current}/{max}</span>
        </div>
    );
};

const ReassignmentManagement = () => {
    const { getToken, user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [selected, setSelected] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [chosenEmp, setChosenEmp] = useState('');
    const [reassignNote, setReassignNote] = useState('');
    const [reassigning, setReassigning] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => { fetchGroups(); }, [filter]);

    const headers = () => ({
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
    });

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (user?.municipalityCode) params.append('municipalityCode', user.municipalityCode);
            const res = await fetch(`${API}/complaints/groups?${params}`, { headers: headers() });
            const data = await res.json();
            let list = data.groups || [];

            // Apply filter
            if (filter === 'Reopened') {
                list = list.filter(g => g.reopened);
            } else if (filter) {
                list = list.filter(g => g.status === filter);
            }

            setGroups(list);
        } catch (err) {
            console.error('Fetch groups error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await fetch(`${API}/users/employees`, { headers: headers() });
            const data = await res.json();
            setEmployees(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Fetch employees error:', err);
        }
    };

    const handleReassign = async () => {
        if (!chosenEmp || !selected) return;
        setReassigning(true);
        try {
            const res = await fetch(`${API}/complaints/groups/${selected.group_id}/assign`, {
                method: 'PUT',
                headers: headers(),
                body: JSON.stringify({
                    assigned_to: chosenEmp,
                    notes: reassignNote || 'Admin reassignment',
                }),
            });
            const data = await res.json();
            if (data.success) {
                showToast(`Reassigned to ${data.group.assigned_to?.name || 'employee'}`);
                setShowModal(false);
                setChosenEmp('');
                setReassignNote('');
                setSelected(data.group);
                fetchGroups();
            } else {
                showToast(data.message || 'Reassignment failed', 'error');
            }
        } catch (err) {
            showToast('Network error', 'error');
        } finally {
            setReassigning(false);
        }
    };

    const openReassignModal = () => {
        fetchEmployees();
        setChosenEmp('');
        setReassignNote('');
        setShowModal(true);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-xl text-sm font-medium shadow-2xl transition-all animate-[slideIn_0.3s_ease] ${toast.type === 'error'
                        ? 'bg-red-600 text-white border border-red-300'
                        : 'bg-green-600 text-white border border-green-300'
                    }`}>
                    {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-bold">
                    <span className="text-gray-900">Manage & </span>
                    <span className="text-gradient">Reassign Complaints</span>
                </h2>
                <p className="text-gray-500 mt-1 text-sm">View, manage and reassign complaint groups to employees</p>
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {statusFilters.map(f => (
                    <button
                        key={f.value}
                        onClick={() => { setFilter(f.value); setSelected(null); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f.value
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Split Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left — Complaint List */}
                <div className="lg:col-span-2 space-y-3 max-h-[75vh] overflow-y-auto pr-1">
                    {loading ? (
                        <div className="text-center py-16 text-gray-400 animate-pulse">Loading complaints...</div>
                    ) : groups.length === 0 ? (
                        <div className="text-center py-16">
                            <span className="text-4xl block mb-3">📭</span>
                            <p className="text-gray-400">No complaints found</p>
                        </div>
                    ) : (
                        groups.map(g => (
                            <div
                                key={g.group_id}
                                onClick={() => setSelected(g)}
                                className={`glass rounded-xl p-4 cursor-pointer transition-all hover:border-gray-300 ${selected?.group_id === g.group_id ? 'border-blue-500/50 ring-1 ring-blue-500/30' : ''
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <h4 className="text-gray-900 font-medium text-sm truncate flex-1 mr-2">{g.issue_title}</h4>
                                    <span className={`px-2 py-0.5 text-[10px] rounded-full border font-medium whitespace-nowrap ${statusColors[g.status] || statusColors.Pending}`}>
                                        {g.status}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2 items-center">
                                    <span className="text-gray-400 text-[10px] font-mono">{g.group_id}</span>
                                    {g.reopened && (
                                        <span className="px-1.5 py-0.5 text-[9px] rounded bg-red-100 text-red-700 border border-red-200 font-bold">🔄 REOPENED</span>
                                    )}
                                    {g.assigned_to && (
                                        <span className="text-gray-400 text-[10px]">👔 {g.assigned_to.name || 'Employee'}</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Right — Detail Panel */}
                <div className="lg:col-span-3">
                    {!selected ? (
                        <div className="glass rounded-xl p-12 text-center">
                            <span className="text-5xl block mb-4">📋</span>
                            <p className="text-gray-400">Select a complaint to view details</p>
                        </div>
                    ) : (
                        <div className="glass rounded-xl p-6 space-y-5">
                            {/* Title + Status */}
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{selected.issue_title}</h3>
                                    <p className="text-gray-400 text-xs font-mono mt-1">{selected.group_id}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selected.reopened && (
                                        <span className="px-2 py-1 text-[10px] rounded-full bg-red-100 text-red-700 border border-red-200 font-bold">
                                            🔄 REOPENED {selected.reopenCount > 1 ? `(${selected.reopenCount}x)` : ''}
                                        </span>
                                    )}
                                    <span className={`px-3 py-1 text-xs rounded-full border font-medium ${statusColors[selected.status] || statusColors.Pending}`}>
                                        {selected.status}
                                    </span>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-100 rounded-lg p-3">
                                    <p className="text-gray-400 text-xs mb-1">Sector</p>
                                    <p className="text-gray-900 text-sm font-medium">{selected.sector}</p>
                                </div>
                                <div className="bg-gray-100 rounded-lg p-3">
                                    <p className="text-gray-400 text-xs mb-1">Location</p>
                                    <p className="text-gray-900 text-sm font-medium truncate">{selected.address?.area || selected.address?.fullAddress}</p>
                                </div>
                                <div className="bg-gray-100 rounded-lg p-3">
                                    <p className="text-gray-400 text-xs mb-1">Affected Citizens</p>
                                    <p className="text-gray-900 text-sm font-medium">{selected.affected_users?.length || 0}</p>
                                </div>
                                <div className="bg-gray-100 rounded-lg p-3">
                                    <p className="text-gray-400 text-xs mb-1">Priority</p>
                                    <p className={`text-sm font-medium ${selected.priority === 'High' ? 'text-red-600' : 'text-yellow-600'}`}>
                                        {selected.priority || 'Normal'}
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="bg-gray-100 rounded-lg p-4">
                                <p className="text-gray-400 text-xs mb-1">Description</p>
                                <p className="text-gray-600 text-sm">{selected.issue_description}</p>
                            </div>

                            {/* Assigned Employee */}
                            {selected.assigned_to && (
                                <div className="bg-gray-100 rounded-lg p-4">
                                    <p className="text-gray-400 text-xs mb-2">Assigned Employee</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-sm font-bold">
                                                {selected.assigned_to.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="text-gray-900 font-medium text-sm">{selected.assigned_to.name}</p>
                                                <p className="text-gray-400 text-xs">{selected.assigned_to.email}</p>
                                            </div>
                                        </div>
                                        {selected.assigned_to.currentWorkload !== undefined && (
                                            <CapacityBar
                                                current={selected.assigned_to.currentWorkload}
                                                max={selected.assigned_to.maxConcurrentComplaints || 5}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Citizen Feedback */}
                            {selected.feedbackStatus && selected.feedbackStatus !== 'PENDING' && (
                                <div className={`rounded-lg p-4 border ${selected.feedbackStatus === 'SATISFIED'
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-red-50 border-red-200'
                                    }`}>
                                    <p className="text-gray-400 text-xs mb-2">Citizen Feedback</p>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${selected.feedbackStatus === 'SATISFIED'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                            }`}>
                                            {selected.feedbackStatus === 'SATISFIED' ? '✅ Satisfied' : '❌ Not Satisfied'}
                                        </span>
                                    </div>
                                    {selected.feedbackMessage && (
                                        <p className="text-gray-500 text-sm italic">"{selected.feedbackMessage}"</p>
                                    )}
                                </div>
                            )}

                            {/* Reassign Button */}
                            {selected.status !== 'Closed' && (
                                <button
                                    onClick={openReassignModal}
                                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                                >
                                    🔄 Reassign to Another Employee
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Reassign Modal */}
            {showModal && selected && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass rounded-2xl w-full max-w-lg p-6 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-xl font-bold text-gray-900">Reassign Complaint</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-900 text-xl">✕</button>
                        </div>

                        <p className="text-gray-500 text-sm mb-4">
                            Reassigning: <span className="text-gray-900 font-medium">{selected.issue_title}</span>
                        </p>

                        {/* Notes */}
                        <textarea
                            value={reassignNote}
                            onChange={e => setReassignNote(e.target.value)}
                            placeholder="Add a note (optional)..."
                            className="w-full bg-gray-100 border border-gray-200 rounded-lg p-3 text-gray-900 text-sm mb-4 focus:outline-none focus:border-blue-500 resize-none h-16"
                        />

                        {/* Employee List */}
                        <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
                            {employees.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 animate-pulse">Loading employees...</div>
                            ) : (
                                employees.map(emp => {
                                    const avail = availabilityColors[emp.availabilityStatus] || availabilityColors.AVAILABLE;
                                    const isSame = selected.assigned_to?._id === emp._id;
                                    const isOverloaded = (emp.currentWorkload || 0) >= (emp.maxConcurrentComplaints || 5);
                                    const isUnavailable = emp.availabilityStatus === 'OFF_DUTY' || emp.availabilityStatus === 'ON_LEAVE';
                                    const disabled = isSame || isOverloaded || isUnavailable;

                                    return (
                                        <div
                                            key={emp._id}
                                            onClick={() => !disabled && setChosenEmp(emp._id)}
                                            className={`rounded-xl p-3 border transition-all ${disabled
                                                    ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-100'
                                                    : chosenEmp === emp._id
                                                        ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-200 cursor-pointer'
                                                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${disabled ? 'bg-gray-300' : 'bg-gradient-to-br from-blue-400 to-cyan-400'
                                                        }`}>
                                                        {emp.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-gray-900 text-sm font-medium">{emp.name}</p>
                                                            {isSame && <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-500">CURRENT</span>}
                                                        </div>
                                                        <p className="text-gray-400 text-xs">{emp.department}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <CapacityBar current={emp.currentWorkload || 0} max={emp.maxConcurrentComplaints || 5} />
                                                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${avail.bg} ${avail.text} border ${avail.border}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${avail.dot}`} />
                                                        {emp.availabilityStatus}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2 border-t border-gray-200">
                            <button
                                onClick={handleReassign}
                                disabled={!chosenEmp || reassigning}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:from-blue-500 hover:to-cyan-500 transition-all active:scale-[0.98]"
                            >
                                {reassigning ? 'Reassigning...' : 'Confirm Reassignment'}
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-5 py-3 rounded-xl bg-gray-100 text-gray-500 font-medium hover:bg-gray-200 transition-all"
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

export default ReassignmentManagement;
