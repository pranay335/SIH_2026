import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/button.jsx';

const API_BASE_URL = 'http://localhost:5000/api';

const EmployeeDashboard = () => {
  const { user, logout, getToken } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedTask, setSelectedTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state for resolution
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    if (user && user._id) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/complaints/assigned/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setTasks(data.groups);
      } else {
        setError(data.message || 'Failed to fetch tasks');
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    // Reset resolution state for new task
    setUploadedImages([]);
  };

  const handleAcknowledge = async (groupId) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/complaints/groups/${groupId}/acknowledge`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        // Update local state
        setTasks(prev => prev.map(t => t.group_id === groupId ? data.group : t));
        setSelectedTask(data.group);
      }
    } catch (err) {
      console.error('Acknowledgement failed:', err);
      alert('Failed to acknowledge task');
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      setIsCapturing(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      alert('Camera access is required to capture images.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg');
    const image = {
      id: Date.now() + Math.random(),
      preview: imageData,
      capturedAt: new Date().toISOString()
    };

    setUploadedImages(prev => [...prev, image]);
  };

  const handleMarkResolved = async (groupId) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/complaints/groups/${groupId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'Resolved',
          resolution_images: uploadedImages.map(img => img.preview),
          notes: 'Task resolved by employee'
        })
      });
      const data = await response.json();
      if (data.success) {
        // Update local tasks
        setTasks(prev => prev.map(t => t.group_id === groupId ? data.group : t));
        setSelectedTask(null);
        setUploadedImages([]);
        alert('Task marked as resolved!');
      }
    } catch (err) {
      console.error('Resolution failed:', err);
      alert('Failed to resolve task');
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'tasks', label: 'My Tasks', icon: '📋' },
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'schedule', label: 'Schedule', icon: '📅' },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  const stats = {
    active: tasks.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length,
    completed: tasks.filter(t => t.status === 'Resolved' || t.status === 'Closed').length,
    performance: '94%' // Mocked for now
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Employee Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="glass rounded-xl p-6">
                <div className="text-3xl mb-2">📋</div>
                <h3 className="text-lg font-semibold text-white mb-1">Active Tasks</h3>
                <p className="text-3xl font-bold text-[#60A5FA]">{stats.active}</p>
                <p className="text-white/60 text-sm mt-1">High priority focus</p>
              </div>
              <div className="glass rounded-xl p-6">
                <div className="text-3xl mb-2">✅</div>
                <h3 className="text-lg font-semibold text-white mb-1">Completed</h3>
                <p className="text-3xl font-bold text-green-400">{stats.completed}</p>
                <p className="text-white/60 text-sm mt-1">Total resolved</p>
              </div>
              <div className="glass rounded-xl p-6">
                <div className="text-3xl mb-2">📈</div>
                <h3 className="text-lg font-semibold text-white mb-1">Performance</h3>
                <p className="text-3xl font-bold text-purple-400">{stats.performance}</p>
                <p className="text-white/60 text-sm mt-1">Excellent standing</p>
              </div>
            </div>

            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {tasks.slice(0, 3).map((task, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${task.status === 'Resolved' ? 'bg-green-400' : 'bg-blue-400'}`}></div>
                      <div>
                        <p className="text-white font-medium">{task.issue_title}</p>
                        <p className="text-white/60 text-sm">{new Date(task.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`text-sm ${task.status === 'Resolved' ? 'text-green-400' : 'text-blue-400'}`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'tasks':
        const pendingTasks = tasks.filter(t => t.status !== 'Resolved' && t.status !== 'Closed');
        const resolvedTasks = tasks.filter(t => t.status === 'Resolved' || t.status === 'Closed');

        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">My Tasks</h2>

            {selectedTask ? (
              <div className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">{selectedTask.issue_title}</h3>
                  <Button
                    label="Back to Tasks"
                    variant="outline"
                    size="small"
                    onClick={() => setSelectedTask(null)}
                  />
                </div>

                {selectedTask.status !== 'Closed' && (
                  <div className="mb-6">
                    <h4 className="text-lg font-medium text-white mb-4">Status Tracking</h4>
                    <div className="relative">
                      <div className="relative h-8 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full bg-gradient-to-r from-yellow-400 via-blue-400 to-green-400 transition-all duration-500 rounded-full"
                          style={{
                            width: selectedTask.status === 'Pending' ? '10%' :
                              selectedTask.status === 'Assigned' ? '30%' :
                                selectedTask.status === 'In Progress' ? '60%' : '100%'
                          }}
                        ></div>

                        <div className="absolute inset-0 flex items-center justify-between px-6">
                          {['Pending', 'Assigned', 'In Progress', 'Resolved'].map((s, i) => (
                            <div key={s} className="flex flex-col items-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${(selectedTask.status === s || (i === 3 && selectedTask.status === 'Resolved'))
                                  ? 'bg-white text-black shadow-lg'
                                  : 'bg-white/20 border border-white/40 text-white'
                                }`}>
                                {i + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <span className="px-4 py-2 rounded-full text-sm font-medium bg-white/10 text-white">
                          Current Status: {selectedTask.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="glass rounded-xl p-6">
                    <h4 className="text-white font-medium mb-3">Task Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/60">Priority:</span>
                        <span className={`${selectedTask.priority === 'High' ? 'text-red-400' : 'text-white'}`}>{selectedTask.priority}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Sector:</span>
                        <span className="text-white">{selectedTask.sector}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Location:</span>
                        <span className="text-white">{selectedTask.address?.fullAddress}</span>
                      </div>
                    </div>
                  </div>

                  <div className="glass rounded-xl p-6">
                    <h4 className="text-white font-medium mb-3">Description</h4>
                    <p className="text-white/70 text-sm italic">"{selectedTask.issue_description}"</p>
                  </div>
                </div>

                {selectedTask.status === 'In Progress' && (
                  <div className="space-y-6">
                    <div className="glass rounded-xl p-6">
                      <h4 className="text-white font-medium mb-4">📷 Capture Resolution Images</h4>
                      {!isCapturing ? (
                        <Button
                          label="Open Camera"
                          variant="primary"
                          size="large"
                          className="w-full"
                          onClick={startCamera}
                        />
                      ) : (
                        <div className="space-y-4">
                          <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex space-x-3">
                            <Button
                              label="📸 Capture"
                              variant="primary"
                              className="flex-1"
                              onClick={capturePhoto}
                            />
                            <Button
                              label="Close"
                              variant="outline"
                              onClick={stopCamera}
                            />
                          </div>
                        </div>
                      )}

                      {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                          {uploadedImages.map(image => (
                            <div key={image.id} className="relative group">
                              <img src={image.preview} className="w-full h-24 object-cover rounded-lg border border-white/20" />
                              <button
                                onClick={() => setUploadedImages(prev => prev.filter(i => i.id !== image.id))}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button
                      label="Mark as Resolved"
                      variant="primary"
                      size="large"
                      className="w-full h-14 text-lg"
                      disabled={uploadedImages.length === 0}
                      onClick={() => handleMarkResolved(selectedTask.group_id)}
                    />
                  </div>
                )}

                {(selectedTask.status === 'Assigned' || selectedTask.status === 'Pending') && (
                  <Button
                    label="Acknowledge & Start Task"
                    variant="primary"
                    size="large"
                    className="w-full h-14 text-lg"
                    onClick={() => handleAcknowledge(selectedTask.group_id)}
                  />
                )}

                {selectedTask.status === 'Resolved' && (
                  <div className="glass rounded-xl p-6">
                    <h4 className="text-white font-medium mb-4">Resolution Evidence</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedTask.resolution_images?.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          className="w-full h-32 object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => window.open(img, '_blank')}
                        />
                      ))}
                    </div>
                    <div className="mt-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20 text-green-400 text-sm">
                      ✅ This task has been resolved and is awaiting admin review for final closure.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Active Tasks ({pendingTasks.length})</h3>
                  <div className="space-y-3">
                    {pendingTasks.map(task => (
                      <div
                        key={task.group_id}
                        onClick={() => handleTaskClick(task)}
                        className="p-4 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-white font-medium">{task.issue_title}</h4>
                            <p className="text-white/60 text-xs mt-1">Status: {task.status}</p>
                            <p className="text-white/40 text-[10px] mt-1">📍 {task.address?.area}</p>
                          </div>
                          <span className={`px-2 py-1 text-[10px] rounded-full uppercase font-bold ${task.priority === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                    {pendingTasks.length === 0 && <p className="text-center text-white/40 py-8">No active tasks</p>}
                  </div>
                </div>
                <div className="glass rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Completed ({resolvedTasks.length})</h3>
                  <div className="space-y-3">
                    {resolvedTasks.map(task => (
                      <div
                        key={task.group_id}
                        onClick={() => handleTaskClick(task)}
                        className="p-4 bg-green-500/10 rounded-lg border border-green-500/20 cursor-pointer hover:bg-green-500/20 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-white font-medium">{task.issue_title}</h4>
                            <p className="text-white/60 text-xs mt-1">Resolved on {new Date(task.resolvedDate || task.updatedAt).toLocaleDateString()}</p>
                          </div>
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] rounded-full uppercase font-bold">Done</span>
                        </div>
                      </div>
                    ))}
                    {resolvedTasks.length === 0 && <p className="text-center text-white/40 py-8">No completed tasks yet</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Profile</h2>
            <div className="glass rounded-xl p-6">
              <div className="flex items-center space-x-6 mb-6">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20">
                  {user?.name?.charAt(0) || 'E'}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{user?.name}</h3>
                  <p className="text-white/60">{user?.email}</p>
                  <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full mt-2 font-bold uppercase tracking-wider">
                    {user?.role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/10">
                <div>
                  <h4 className="text-white/40 text-xs font-bold uppercase mb-3">Service Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Department:</span>
                      <span className="text-white">{user?.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Municipality:</span>
                      <span className="text-white">{user?.municipalityCode}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-white/40 text-xs font-bold uppercase mb-3">Workload</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Max Concurrent:</span>
                      <span className="text-white">{user?.maxConcurrentComplaints}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Status:</span>
                      <span className="text-green-400">{user?.availabilityStatus}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-white/40">
            <span className="text-6xl mb-4">🚧</span>
            <h2 className="text-xl font-medium">Under Construction</h2>
            <p>This section is currently being developed.</p>
          </div>
        );
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
      <div className="text-blue-400 animate-pulse text-xl font-bold">Loading CivcMind Dashboard...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Header */}
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-black italic tracking-tighter text-blue-500">CIVICMIND <span className="text-white not-italic font-light">EMPLOYEE</span></h1>
            </div>
            <div className="flex items-center space-x-6">
              <div className="hidden md:block text-right">
                <div className="text-xs text-white/40 font-bold uppercase">Assigned To</div>
                <div className="text-sm font-medium">{user?.name}</div>
              </div>
              <Button
                label="Logout"
                variant="outline"
                size="small"
                onClick={handleLogout}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 hidden lg:block h-[calc(100vh-64px)] sticky top-16 glass border-r border-white/10">
          <nav className="p-4 space-y-2">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`
                                    w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200
                                    ${activeSection === item.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }
                                `}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
