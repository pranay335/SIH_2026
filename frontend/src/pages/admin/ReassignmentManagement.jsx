import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const API = 'http://localhost:5000/api';

const statusFilters = [
    { value: '', label: 'All' },
    { value: 'Assigned', label: 'Assigned' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Reopened', label: 'Reopened' },
];

const statusColors = {
    Pending: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    Assigned: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'In Progress': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
    Closed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const availabilityColors = {
    AVAILABLE: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', dot: 'bg-green-400' },
    BUSY: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', dot: 'bg-yellow-400' },
    OFF_DUTY: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-400' },
    ON_LEAVE: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-400' },
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
                                ? pct >= 80 ? 'bg-red-400' : pct >= 60 ? 'bg-yellow-400' : 'bg-green-400'
                                : 'bg-white/10'
                            }`}
                    />
                ))}
            </div>
            <span className="text-white/50 text-xs">{current}/{max}</span>
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
                        ? 'bg-red-500/90 text-white border border-red-400/30'
                        : 'bg-green-500/90 text-white border border-green-400/30'
                    }`}>
                    {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-bold">
                    <span className="text-white">Manage & </span>
                    <span className="text-gradient">Reassign Complaints</span>
                </h2>
                <p className="text-white/50 mt-1 text-sm">View, manage and reassign complaint groups to employees</p>
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {statusFilters.map(f => (
                    <button
                        key={f.value}
                        onClick={() => { setFilter(f.value); setSelected(null); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f.value
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
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
                        <div className="text-center py-16 text-white/40 animate-pulse">Loading complaints...</div>
                    ) : groups.length === 0 ? (
                        <div className="text-center py-16">
                            <span className="text-4xl block mb-3">📭</span>
                            <p className="text-white/40">No complaints found</p>
                        </div>
                    ) : (
                        groups.map(g => (
                            <div
                                key={g.group_id}
                                onClick={() => setSelected(g)}
                                className={`glass rounded-xl p-4 cursor-pointer transition-all hover:border-white/20 ${selected?.group_id === g.group_id ? 'border-blue-500/50 ring-1 ring-blue-500/30' : ''
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <h4 className="text-white font-medium text-sm truncate flex-1 mr-2">{g.issue_title}</h4>
                                    <span className={`px-2 py-0.5 text-[10px] rounded-full border font-medium whitespace-nowrap ${statusColors[g.status] || statusColors.Pending}`}>
                                        {g.status}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2 items-center">
                                    <span className="text-white/30 text-[10px] font-mono">{g.group_id}</span>
                                    {g.reopened && (
                                        <span className="px-1.5 py-0.5 text-[9px] rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold">🔄 REOPENED</span>
                                    )}
                                    {g.assigned_to && (
                                        <span className="text-white/40 text-[10px]">👔 {g.assigned_to.name || 'Employee'}</span>
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
                            <p className="text-white/40">Select a complaint to view details</p>
                        </div>
                    ) : (
                        <div className="glass rounded-xl p-6 space-y-5">
                            {/* Title + Status */}
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{selected.issue_title}</h3>
                                    <p className="text-white/30 text-xs font-mono mt-1">{selected.group_id}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selected.reopened && (
                                        <span className="px-2 py-1 text-[10px] rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
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
                                <div className="bg-white/5 rounded-lg p-3">
                                    <p className="text-white/40 text-xs mb-1">Sector</p>
                                    <p className="text-white text-sm font-medium">{selected.sector}</p>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3">
                                    <p className="text-white/40 text-xs mb-1">Location</p>
                                    <p className="text-white text-sm font-medium truncate">{selected.address?.area || selected.address?.fullAddress}</p>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3">
                                    <p className="text-white/40 text-xs mb-1">Affected Citizens</p>
                                    <p className="text-white text-sm font-medium">{selected.affected_users?.length || 0}</p>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3">
                                    <p className="text-white/40 text-xs mb-1">Priority</p>
                                    <p className={`text-sm font-medium ${selected.priority === 'High' ? 'text-red-400' : 'text-yellow-400'}`}>
                                        {selected.priority || 'Normal'}
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="bg-white/5 rounded-lg p-4">
                                <p className="text-white/40 text-xs mb-1">Description</p>
                                <p className="text-white/70 text-sm">{selected.issue_description}</p>
                            </div>

                            {/* Assigned Employee */}
                            {selected.assigned_to && (
                                <div className="bg-white/5 rounded-lg p-4">
                                    <p className="text-white/40 text-xs mb-2">Assigned Employee</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-sm font-bold">
                                                {selected.assigned_to.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium text-sm">{selected.assigned_to.name}</p>
                                                <p className="text-white/40 text-xs">{selected.assigned_to.email}</p>
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
                                        ? 'bg-green-500/5 border-green-500/20'
                                        : 'bg-red-500/5 border-red-500/20'
                                    }`}>
                                    <p className="text-white/40 text-xs mb-2">Citizen Feedback</p>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${selected.feedbackStatus === 'SATISFIED'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {selected.feedbackStatus === 'SATISFIED' ? '✅ Satisfied' : '❌ Not Satisfied'}
                                        </span>
                                    </div>
                                    {selected.feedbackMessage && (
                                        <p className="text-white/60 text-sm italic">"{selected.feedbackMessage}"</p>
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
                            <h3 className="text-xl font-bold text-white">Reassign Complaint</h3>
                            <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white text-xl">✕</button>
                        </div>

                        <p className="text-white/50 text-sm mb-4">
                            Reassigning: <span className="text-white font-medium">{selected.issue_title}</span>
                        </p>

                        {/* Notes */}
                        <textarea
                            value={reassignNote}
                            onChange={e => setReassignNote(e.target.value)}
                            placeholder="Add a note (optional)..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm mb-4 focus:outline-none focus:border-blue-500/50 resize-none h-16"
                        />

                        {/* Employee List */}
                        <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
                            {employees.length === 0 ? (
                                <div className="text-center py-8 text-white/40 animate-pulse">Loading employees...</div>
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
                                                    ? 'opacity-40 cursor-not-allowed bg-white/[0.02] border-white/5'
                                                    : chosenEmp === emp._id
                                                        ? 'border-blue-500/50 bg-blue-500/10 ring-1 ring-blue-500/20 cursor-pointer'
                                                        : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${disabled ? 'bg-white/10' : 'bg-gradient-to-br from-blue-400 to-cyan-400'
                                                        }`}>
                                                        {emp.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-white text-sm font-medium">{emp.name}</p>
                                                            {isSame && <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/40">CURRENT</span>}
                                                        </div>
                                                        <p className="text-white/40 text-xs">{emp.department}</p>
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
                        <div className="flex gap-3 pt-2 border-t border-white/10">
                            <button
                                onClick={handleReassign}
                                disabled={!chosenEmp || reassigning}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:from-blue-500 hover:to-cyan-500 transition-all active:scale-[0.98]"
                            >
                                {reassigning ? 'Reassigning...' : 'Confirm Reassignment'}
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-5 py-3 rounded-xl bg-white/5 text-white/60 font-medium hover:bg-white/10 transition-all"
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
