import { useState, useEffect } from 'react';

const PerformanceAnalytics = ({ workload, assignments, user }) => {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    if (workload && assignments) {
      calculateMetrics();
    }
  }, [workload, assignments]);

  const calculateMetrics = () => {
    const completed = assignments.filter(a => a.status === 'COMPLETED');
    const rejected = assignments.filter(a => a.status === 'REJECTED');
    const total = assignments.length;

    const avgTime = completed.length > 0
      ? completed.reduce((sum, a) => sum + (a.actualCompletionTime || 0), 0) / completed.length
      : 0;

    const successRate = total > 0 ? ((completed.length / total) * 100).toFixed(1) : 0;

    const overdue = assignments.filter(a => {
      const isCompleted = a.status === 'COMPLETED';
      const isPastDue = new Date(a.dueDate) < new Date();
      return !isCompleted && isPastDue;
    });

    setMetrics({
      totalAssignments: total,
      completed: completed.length,
      rejected: rejected.length,
      pending: assignments.filter(a => ['ASSIGNED', 'ACKNOWLEDGED'].includes(a.status)).length,
      inProgress: assignments.filter(a => a.status === 'IN_PROGRESS').length,
      avgCompletionTime: avgTime.toFixed(1),
      successRate,
      overdueCount: overdue.length,
      efficiency: (100 - ((rejected.length / total) * 100) || 0).toFixed(1)
    });
  };

  if (!metrics) return <div className="text-white">Loading metrics...</div>;

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <p className="text-white/60 text-sm mb-1">Success Rate</p>
          <p className="text-3xl font-bold text-green-400">{metrics.successRate}%</p>
          <div className="w-full h-2 bg-white/10 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-green-400 rounded-full" style={{ width: `${metrics.successRate}%` }}></div>
          </div>
        </div>

        <div className="glass rounded-xl p-4">
          <p className="text-white/60 text-sm mb-1">Avg. Time to Complete</p>
          <p className="text-3xl font-bold text-blue-400">{metrics.avgCompletionTime}h</p>
          <p className="text-white/40 text-xs mt-1">hours</p>
        </div>

        <div className="glass rounded-xl p-4">
          <p className="text-white/60 text-sm mb-1">Overdue Tasks</p>
          <p className="text-3xl font-bold text-red-400">{metrics.overdueCount}</p>
          <p className="text-white/40 text-xs mt-1">need attention</p>
        </div>

        <div className="glass rounded-xl p-4">
          <p className="text-white/60 text-sm mb-1">Efficiency Score</p>
          <p className="text-3xl font-bold text-purple-400">{metrics.efficiency}%</p>
          <p className="text-white/40 text-xs mt-1">performance</p>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-white font-bold mb-4">Assignment Status Distribution</h3>
        <div className="space-y-3">
          {[
            { label: 'Completed', value: metrics.completed, color: 'bg-green-500', total: metrics.totalAssignments },
            { label: 'In Progress', value: metrics.inProgress, color: 'bg-blue-500', total: metrics.totalAssignments },
            { label: 'Pending', value: metrics.pending, color: 'bg-yellow-500', total: metrics.totalAssignments },
            { label: 'Rejected', value: metrics.rejected, color: 'bg-red-500', total: metrics.totalAssignments }
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between mb-1">
                <span className="text-white text-sm">{item.label}</span>
                <span className="text-white font-bold">{item.value} ({item.total > 0 ? ((item.value / item.total) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${item.color} rounded-full`}
                  style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workload Details */}
      {workload && (
        <div className="glass rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Current Workload Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-white/60 text-sm mb-2">Capacity Utilization</p>
              <div className="text-4xl font-bold text-white mb-2">{workload.workloadPercentage}%</div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    workload.workloadPercentage >= 90 ? 'bg-red-500' :
                    workload.workloadPercentage >= 70 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${workload.workloadPercentage}%` }}
                ></div>
              </div>
              <p className="text-white/60 text-xs mt-2">
                {workload.activeAssignments} of {workload.maxCapacity} tasks assigned
              </p>
            </div>

            <div>
              <p className="text-white/60 text-sm mb-2">Availability Status</p>
              <div className={`inline-block px-4 py-2 rounded-full font-bold ${
                workload.availabilityStatus === 'AVAILABLE' ? 'bg-green-500/20 text-green-400' :
                workload.availabilityStatus === 'BUSY' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {workload.availabilityStatus}
              </div>
              <p className="text-white/60 text-sm mt-3">
                {workload.availabilityStatus === 'AVAILABLE' && '✅ Ready to accept new tasks'}
                {workload.availabilityStatus === 'BUSY' && '⚠️ High workload'}
                {workload.availabilityStatus === 'OFF_DUTY' && '❌ Capacity full'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceAnalytics;
