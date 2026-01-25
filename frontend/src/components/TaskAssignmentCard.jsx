const TaskAssignmentCard = ({ assignment, onViewDetails, onReassign, onComplete }) => {
  const getStatusColor = (status) => {
    const colors = {
      'ASSIGNED': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'ACKNOWLEDGED': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'IN_PROGRESS': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'COMPLETED': 'bg-green-500/20 text-green-400 border-green-500/30',
      'REJECTED': 'bg-red-500/20 text-red-400 border-red-500/30',
      'REASSIGNED': 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      'CRITICAL': '🔴',
      'HIGH': '🟠',
      'MEDIUM': '🟡',
      'LOW': '🟢'
    };
    return icons[priority] || '⚪';
  };

  const isOverdue = assignment.isOverdue;
  const daysLeft = assignment.dueDate 
    ? Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className={`glass rounded-xl p-4 border ${isOverdue ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'} hover:border-white/20 transition-all`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{getPriorityIcon(assignment.priority)}</span>
            <h3 className="text-white font-semibold flex-1">
              {assignment.description || assignment.complaintId?.description || 'Task'}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(assignment.status)}`}>
              {assignment.status}
            </span>
            {assignment.isAutoAssigned && (
              <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                🤖 Auto-Assigned
              </span>
            )}
            {isOverdue && (
              <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                ⚠️ Overdue
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Task Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
        <div>
          <p className="text-white/60 text-xs">Sector</p>
          <p className="text-white font-medium">{assignment.sector}</p>
        </div>
        <div>
          <p className="text-white/60 text-xs">Assigned To</p>
          <p className="text-white font-medium">{assignment.assignedTo?.name || 'Unassigned'}</p>
        </div>
        <div>
          <p className="text-white/60 text-xs">Due Date</p>
          <p className="text-white font-medium">
            {new Date(assignment.dueDate).toLocaleDateString()}
            {daysLeft <= 1 && <span className="text-red-400 text-xs block">({daysLeft <= 0 ? 'Overdue' : '1 day left'})</span>}
          </p>
        </div>
        <div>
          <p className="text-white/60 text-xs">Time Spent</p>
          <p className="text-white font-medium">{assignment.timeElapsed || 0}h</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <p className="text-white/60 text-xs">Progress</p>
          <span className="text-white text-xs font-bold">
            {assignment.status === 'COMPLETED' ? '100%' :
             assignment.status === 'IN_PROGRESS' ? '75%' :
             assignment.status === 'ACKNOWLEDGED' ? '50%' :
             '0%'}
          </span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              assignment.status === 'COMPLETED' ? 'bg-green-500' :
              assignment.status === 'IN_PROGRESS' ? 'bg-blue-500' :
              assignment.status === 'ACKNOWLEDGED' ? 'bg-yellow-500' :
              'bg-gray-500'
            }`}
            style={{
              width: assignment.status === 'COMPLETED' ? '100%' :
                     assignment.status === 'IN_PROGRESS' ? '75%' :
                     assignment.status === 'ACKNOWLEDGED' ? '50%' :
                     '0%'
            }}
          ></div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onViewDetails?.(assignment)}
          className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-colors"
        >
          View Details
        </button>
        {assignment.status !== 'COMPLETED' && assignment.status !== 'REJECTED' && (
          <>
            <button
              onClick={() => onReassign?.(assignment)}
              className="px-3 py-2 bg-orange-500/20 text-orange-400 rounded-lg text-sm font-medium hover:bg-orange-500/30 transition-colors"
              title="Reassign to another employee"
            >
              ↻
            </button>
            {assignment.status === 'IN_PROGRESS' && (
              <button
                onClick={() => onComplete?.(assignment)}
                className="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors"
                title="Mark as complete"
              >
                ✓
              </button>
            )}
          </>
        )}
      </div>

      {/* Assignment Notes */}
      {assignment.notes && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-white/60 text-xs mb-1">Notes</p>
          <p className="text-white text-sm">{assignment.notes}</p>
        </div>
      )}
    </div>
  );
};

export default TaskAssignmentCard;
