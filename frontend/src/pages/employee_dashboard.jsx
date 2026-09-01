import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/button.jsx';
import StatusProgressBar from '../components/StatusProgressBar.jsx';

const API_BASE_URL = `http://${window.location.hostname}:5000/api`;

const MessagesSection = ({ getToken }) => {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSelectMessage = async (msg) => {
    setSelectedMessage(msg);
    if (!msg.read) {
      try {
        await fetch(`${API_BASE_URL}/messages/${msg._id}/read`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, read: true } : m));
      } catch (err) {
        console.error('Failed to mark message as read', err);
      }
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-[calc(100vh-140px)] lg:h-[calc(100vh-120px)] flex bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm relative">
      {/* Inbox List (Left Pane) */}
      <div className={`w-full lg:w-1/3 border-r border-gray-200 flex flex-col bg-gray-50/50 absolute lg:relative inset-0 transition-transform duration-300 ${selectedMessage ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}`}>
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Inbox</h2>
        </div>
        <div className="flex-1 overflow-y-auto pb-safe">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <span className="text-4xl block mb-2">📭</span>
              No messages found
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {messages.map(msg => (
                <div
                  key={msg._id}
                  onClick={() => handleSelectMessage(msg)}
                  className={`p-4 cursor-pointer transition-colors ${selectedMessage?._id === msg._id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-100 border-l-4 border-l-transparent'} ${!msg.read ? 'bg-white' : 'opacity-75'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${msg.sender === 'admin' ? 'bg-red-100 text-red-700' : msg.sender === 'system' ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
                        {msg.sender}
                      </span>
                      {msg.isBroadcast && <span className="text-xs" title="Broadcast Message">📢</span>}
                    </div>
                    <span className={`text-xs ${!msg.read ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                      {formatDate(msg.createdAt)}
                    </span>
                  </div>
                  <h4 className={`text-sm truncate pr-4 ${!msg.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {msg.title}
                  </h4>
                  <p className="text-xs text-gray-500 truncate mt-1">{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reading Pane (Right Pane) */}
      <div className={`w-full lg:w-2/3 flex flex-col bg-white absolute lg:relative inset-0 transition-transform duration-300 ${selectedMessage ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        {selectedMessage ? (
          <div className="h-full flex flex-col">
            <div className="p-4 lg:p-6 border-b border-gray-100 bg-white">
              <button 
                onClick={() => setSelectedMessage(null)} 
                className="lg:hidden mb-4 flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                <span className="text-lg">←</span> Back to Inbox
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  {selectedMessage.sender.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 capitalize">{selectedMessage.sender}</h3>
                  <p className="text-xs text-gray-500">
                    {new Date(selectedMessage.createdAt).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                  </p>
                </div>
                {selectedMessage.isBroadcast && (
                  <span className="ml-auto px-3 py-1 bg-yellow-100 text-yellow-700 text-[10px] sm:text-xs font-bold rounded-full border border-yellow-200 flex items-center gap-1">
                    <span>📢</span> <span className="hidden sm:inline">Broadcast</span>
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">{selectedMessage.title}</h2>
            </div>
            <div className="p-4 lg:p-6 flex-1 overflow-y-auto pb-safe">
              <div className="prose prose-blue max-w-none text-gray-700 whitespace-pre-wrap text-sm sm:text-base">
                {selectedMessage.message}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/30 hidden lg:flex">
            <span className="text-6xl mb-4">✉️</span>
            <p className="text-lg font-medium text-gray-500">Select a message to read</p>
          </div>
        )}
      </div>
    </div>
  );
};

const EmployeeDashboard = () => {
  const { user, logout, getToken } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedTask, setSelectedTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [uploadedImages, setUploadedImages] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Callback ref: fires immediately when the <video> DOM node mounts
  const setVideoRef = useCallback((node) => {
    videoRef.current = node;
    if (node && stream) {
      node.srcObject = stream;
      node.play().catch(err => console.warn('Video play failed:', err));
    }
  }, [stream]);

  // Live user data (refreshes dynamically)
  const [liveUser, setLiveUser] = useState(null);

  const fetchLiveUser = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLiveUser(data);
      }
    } catch (err) {
      console.error('Error fetching live user data:', err);
    }
  };

  useEffect(() => {
    if (user && user._id) {
      fetchTasks();
      fetchLiveUser();
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
        fetchLiveUser(); // Refresh workload data
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
      // srcObject is now assigned by the useEffect above
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
    if (!video || !video.videoWidth) {
      alert('Camera is not ready yet. Please wait a moment.');
      return;
    }
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

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const image = {
          id: Date.now() + Math.random(),
          preview: reader.result,
          capturedAt: new Date().toISOString()
        };
        setUploadedImages(prev => [...prev, image]);
      };
      reader.readAsDataURL(file);
    });
    // Reset file input so same file can be re-selected
    e.target.value = '';
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
        fetchLiveUser(); // Refresh workload data
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
    { id: 'schedule', label: 'Schedule', icon: '📅' },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];


  const renderContent = () => {
    switch (activeSection) {
      case 'overview': {
        const ovTotal = tasks.length;
        const ovResolved = tasks.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
        const ovActive = tasks.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length;
        const ovInProgress = tasks.filter(t => t.status === 'In Progress').length;
        const ovPending = tasks.filter(t => t.status === 'Assigned' || t.status === 'Pending').length;
        const ovPerf = ovTotal > 0 ? Math.round((ovResolved / ovTotal) * 100) : 0;
        const ovSatisfied = tasks.filter(t => t.feedbackStatus === 'SATISFIED').length;
        const ovNotSat = tasks.filter(t => t.feedbackStatus === 'NOT_SATISFIED').length;
        const ovNoFb = tasks.filter(t => t.status === 'Resolved' && !t.feedbackStatus).length;
        const ovHighP = tasks.filter(t => t.priority === 'High').length;
        const ovMedP = tasks.filter(t => t.priority === 'Medium').length;
        const ovLowP = tasks.filter(t => t.priority === 'Low').length;
        const now = new Date();
        const weeklyData = [0,0,0,0];
        tasks.filter(t => t.status === 'Resolved' || t.status === 'Closed').forEach(t => {
          const diff = Math.floor((now - new Date(t.resolvedDate || t.updatedAt)) / 86400000);
          if (diff < 7) weeklyData[3]++;
          else if (diff < 14) weeklyData[2]++;
          else if (diff < 21) weeklyData[1]++;
          else if (diff < 28) weeklyData[0]++;
        });
        const wMax = Math.max(...weeklyData, 1);
        const sectorMap = {};
        tasks.forEach(t => { const s = t.sector || 'Unknown'; sectorMap[s] = (sectorMap[s]||0)+1; });
        const sectors = Object.entries(sectorMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
        const sColors = ['#3b82f6','#8b5cf6','#22c55e','#f59e0b','#ef4444'];
        return (
          <div className="space-y-6" id="overview-report">
            <style>{`@media print{body *{visibility:hidden}#overview-report,#overview-report *{visibility:visible}#overview-report{position:absolute;left:0;top:0;width:100%}.no-print{display:none!important}}`}</style>

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Employee Overview</h2>
                <p className="text-gray-400 text-sm mt-0.5">{now.toLocaleDateString('en-IN',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}</p>
              </div>
              <button
                onClick={() => window.print()}
                className="no-print flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25"
              >
                🖨️ Print Report
              </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {label:'Total Tasks',value:ovTotal,icon:'📋',color:'text-blue-600',bg:'bg-blue-50 border-blue-200'},
                {label:'Resolved',value:ovResolved,icon:'✅',color:'text-green-600',bg:'bg-green-50 border-green-200'},
                {label:'In Progress',value:ovInProgress,icon:'⚙️',color:'text-yellow-600',bg:'bg-yellow-50 border-yellow-200'},
                {label:'Pending',value:ovPending,icon:'⏳',color:'text-orange-600',bg:'bg-orange-50 border-orange-200'},
              ].map((c,i)=>(
                <div key={i} className={`rounded-xl p-5 border ${c.bg}`}>
                  <div className="text-2xl mb-1">{c.icon}</div>
                  <p className={`text-3xl font-black ${c.color}`}>{c.value}</p>
                  <p className="text-gray-500 text-sm mt-1">{c.label}</p>
                </div>
              ))}
            </div>

            {/* Performance Ring + Weekly Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Performance</h3>
                <div className="flex items-center gap-6">
                  <div className="relative w-28 h-28 flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3"/>
                      <circle cx="18" cy="18" r="15.9" fill="none"
                        stroke={ovPerf>=80?'#22c55e':ovPerf>=50?'#f59e0b':'#ef4444'}
                        strokeWidth="3"
                        strokeDasharray={`${ovPerf} ${100-ovPerf}`}
                        strokeLinecap="round"/>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-xl font-black ${ovPerf>=80?'text-green-600':ovPerf>=50?'text-yellow-600':'text-red-600'}`}>{ovPerf}%</span>
                    </div>
                  </div>
                  <div className="space-y-3 flex-1">
                    {[
                      {label:'Resolution Rate',val:`${ovPerf}%`,color:'text-green-600'},
                      {label:'Citizen Satisfaction',val:ovSatisfied+ovNotSat>0?`${Math.round((ovSatisfied/Math.max(ovSatisfied+ovNotSat,1))*100)}%`:'N/A',color:'text-blue-600'},
                      {label:'Active Load',val:`${ovActive} tasks`,color:'text-orange-600'},
                    ].map((r,i)=>(
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-500">{r.label}</span>
                        <span className={`font-bold ${r.color}`}>{r.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resolved — Last 4 Weeks</h3>
                <div className="flex items-end gap-3 h-28">
                  {weeklyData.map((val,i)=>{
                    const h = Math.round((val/wMax)*100);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-700">{val}</span>
                        <div className="w-full rounded-t-lg bg-blue-500 hover:bg-blue-600 transition-colors" style={{height:`${Math.max(h,4)}%`}}/>
                        <span className="text-[10px] text-gray-400 text-center">{['4w','3w','2w','Now'][i]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Priority + Sector */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Priority</h3>
                <div className="space-y-3">
                  {[
                    {label:'High',count:ovHighP,bar:'bg-red-500',text:'text-red-600',badge:'bg-red-100'},
                    {label:'Medium',count:ovMedP,bar:'bg-yellow-400',text:'text-yellow-600',badge:'bg-yellow-100'},
                    {label:'Low',count:ovLowP,bar:'bg-green-400',text:'text-green-600',badge:'bg-green-100'},
                  ].map((p,i)=>(
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1 text-sm">
                        <span className={`font-medium ${p.text}`}>{p.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.badge} ${p.text}`}>{p.count}</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full">
                        <div className={`h-full ${p.bar} rounded-full transition-all duration-700`} style={{width:ovTotal>0?`${(p.count/ovTotal)*100}%`:'0%'}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Sector</h3>
                {sectors.length===0?(
                  <p className="text-center text-gray-400 py-6">No sector data yet</p>
                ):(
                  <div className="space-y-3">
                    {sectors.map(([sector,count],i)=>(
                      <div key={sector}>
                        <div className="flex justify-between items-center mb-1 text-sm">
                          <span className="text-gray-700 font-medium truncate">{sector}</span>
                          <span className="text-gray-400 ml-2 flex-shrink-0">{count}</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full">
                          <div className="h-full rounded-full transition-all duration-700" style={{width:`${(count/ovTotal)*100}%`,backgroundColor:sColors[i%sColors.length]}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Feedback + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Citizen Feedback</h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-2xl font-black text-green-600">{ovSatisfied}</p>
                    <p className="text-xs text-gray-500 mt-1">✅ Satisfied</p>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-2xl font-black text-red-600">{ovNotSat}</p>
                    <p className="text-xs text-gray-500 mt-1">❌ Not Satisfied</p>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="text-2xl font-black text-gray-600">{ovNoFb}</p>
                    <p className="text-xs text-gray-500 mt-1">⏳ Awaiting</p>
                  </div>
                </div>
              </div>
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-2">
                  {tasks.slice(0,4).map((task,i)=>(
                    <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.status==='Resolved'?'bg-green-400':'bg-blue-400'}`}/>
                        <div>
                          <p className="text-gray-900 font-medium text-sm truncate max-w-[160px]">{task.issue_title}</p>
                          <p className="text-gray-400 text-xs">{new Date(task.updatedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold ${task.status==='Resolved'?'text-green-600':'text-blue-600'}`}>{task.status}</span>
                    </div>
                  ))}
                  {tasks.length===0 && <p className="text-center text-gray-400 py-4 text-sm">No recent activity</p>}
                </div>
              </div>
            </div>

            {/* Task Log Table */}
            <div className="glass rounded-xl p-6 overflow-x-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">All Tasks — Detailed Log</h3>
              {tasks.length===0?(
                <p className="text-center text-gray-400 py-6">No tasks assigned yet</p>
              ):(
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase border-b border-gray-100">
                      <th className="pb-3 pr-4">Title</th>
                      <th className="pb-3 pr-4">Sector</th>
                      <th className="pb-3 pr-4">Priority</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tasks.map(task=>(
                      <tr key={task.group_id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 pr-4 font-medium text-gray-900 max-w-[180px] truncate">{task.issue_title}</td>
                        <td className="py-2.5 pr-4 text-gray-500">{task.sector||'—'}</td>
                        <td className="py-2.5 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${task.priority==='High'?'bg-red-100 text-red-700':task.priority==='Medium'?'bg-yellow-100 text-yellow-700':'bg-green-100 text-green-700'}`}>{task.priority}</span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${task.status==='Resolved'?'bg-green-100 text-green-700':task.status==='In Progress'?'bg-blue-100 text-blue-700':'bg-orange-100 text-orange-700'}`}>{task.status}</span>
                        </td>
                        <td className="py-2.5 text-gray-400">{new Date(task.updatedAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );
      }

      case 'tasks':
        const pendingTasks = tasks.filter(t => t.status !== 'Resolved' && t.status !== 'Closed');
        const resolvedTasks = tasks.filter(t => t.status === 'Resolved' || t.status === 'Closed');

        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">My Tasks</h2>

            {selectedTask ? (
              <div className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">{selectedTask.issue_title}</h3>
                  <Button
                    label="Back to Tasks"
                    variant="outline"
                    size="small"
                    onClick={() => setSelectedTask(null)}
                  />
                </div>

                {selectedTask.status !== 'Closed' && (
                  <StatusProgressBar status={selectedTask.status} />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="glass rounded-xl p-6">
                    <h4 className="text-gray-900 font-medium mb-3">Task Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Priority:</span>
                        <span className={`${selectedTask.priority === 'High' ? 'text-red-600' : 'text-gray-900'}`}>{selectedTask.priority}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Sector:</span>
                        <span className="text-gray-900">{selectedTask.sector}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Location:</span>
                        <span className="text-gray-900">{selectedTask.address?.fullAddress}</span>
                      </div>
                    </div>
                  </div>

                  <div className="glass rounded-xl p-6">
                    <h4 className="text-gray-900 font-medium mb-3">Description</h4>
                    <p className="text-gray-600 text-sm italic">"{selectedTask.issue_description}"</p>
                  </div>
                </div>

                {selectedTask.status === 'In Progress' && (
                  <div className="space-y-6">
                    <div className="glass rounded-xl p-6">
                      <h4 className="text-gray-900 font-medium mb-4">📷 Add Resolution Images</h4>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      {!isCapturing ? (
                        <div className="flex gap-3">
                          <Button
                            label="📸 Open Camera"
                            variant="primary"
                            size="large"
                            className="flex-1"
                            onClick={startCamera}
                          />
                          <Button
                            label="📁 Upload Image"
                            variant="outline"
                            size="large"
                            className="flex-1"
                            onClick={() => fileInputRef.current?.click()}
                          />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                            <video
                              ref={setVideoRef}
                              autoPlay
                              playsInline
                              muted
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
                              <img src={image.preview} className="w-full h-24 object-cover rounded-lg border border-gray-200" />
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

                {(selectedTask.status === 'Resolved' || selectedTask.status === 'Closed') && (
                  <div className="glass rounded-xl p-6">
                    <h4 className="text-gray-900 font-medium mb-4">Resolution Evidence</h4>
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
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200 text-green-700 text-sm">
                      ✅ This task has been resolved and is awaiting citizen feedback.
                    </div>
                  </div>
                )}

                {/* Citizen Feedback Section */}
                {selectedTask.feedbackStatus && (
                  <div className="glass rounded-xl p-6 mt-4">
                    <h4 className="text-gray-900 font-medium mb-4">📋 Citizen Feedback</h4>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-gray-500 text-sm">Status:</span>
                      <span className={`px-3 py-1 text-xs rounded-full border font-medium ${selectedTask.feedbackStatus === 'SATISFIED'
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : selectedTask.feedbackStatus === 'NOT_SATISFIED'
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                        }`}>
                        {selectedTask.feedbackStatus === 'SATISFIED' ? '✅ Satisfied'
                          : selectedTask.feedbackStatus === 'NOT_SATISFIED' ? '❌ Not Satisfied'
                            : '⏳ Awaiting Feedback'}
                      </span>
                    </div>
                    {selectedTask.feedbackMessage && (
                      <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
                        <p className="text-gray-400 text-xs font-medium mb-1">Citizen's Comment:</p>
                        <p className="text-gray-600 text-sm italic">"{selectedTask.feedbackMessage}"</p>
                      </div>
                    )}
                    {selectedTask.feedbackStatus === 'NOT_SATISFIED' && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-red-700 text-sm font-medium">⚠️ The citizen was not satisfied. Please review and address their concerns.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Reopened Badge */}
                {selectedTask.reopened && (
                  <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200 flex items-center gap-3">
                    <span className="text-2xl">🔄</span>
                    <div>
                      <p className="text-red-700 font-semibold">Reopened by Citizen</p>
                      <p className="text-gray-500 text-sm">This task was reopened because the citizen was not satisfied with the resolution. {selectedTask.reopenCount > 1 ? `(Reopened ${selectedTask.reopenCount} times)` : ''}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Tasks ({pendingTasks.length})</h3>
                  <div className="space-y-3">
                    {pendingTasks.map(task => (
                      <div
                        key={task.group_id}
                        onClick={() => handleTaskClick(task)}
                        className="p-4 bg-gray-100 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-gray-900 font-medium">{task.issue_title}</h4>
                              {task.reopened && (
                                <span className="px-2 py-0.5 text-[9px] rounded-full bg-red-100 text-red-700 border border-red-200 font-bold">🔄 REOPENED</span>
                              )}
                            </div>
                            <p className="text-gray-500 text-xs mt-1">Status: {task.status}</p>
                            <p className="text-gray-400 text-[10px] mt-1">📍 {task.address?.area}</p>
                          </div>
                          <span className={`px-2 py-1 text-[10px] rounded-full uppercase font-bold ${task.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                    {pendingTasks.length === 0 && <p className="text-center text-gray-400 py-8">No active tasks</p>}
                  </div>
                </div>
                <div className="glass rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Completed ({resolvedTasks.length})</h3>
                  <div className="space-y-3">
                    {resolvedTasks.map(task => (
                      <div
                        key={task.group_id}
                        onClick={() => handleTaskClick(task)}
                        className="p-4 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-gray-900 font-medium">{task.issue_title}</h4>
                            <p className="text-gray-500 text-xs mt-1">Resolved on {new Date(task.resolvedDate || task.updatedAt).toLocaleDateString()}</p>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] rounded-full uppercase font-bold">Done</span>
                        </div>
                      </div>
                    ))}
                    {resolvedTasks.length === 0 && <p className="text-center text-gray-400 py-8">No completed tasks yet</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
            <div className="glass rounded-xl p-6">
              <div className="flex items-center space-x-6 mb-6">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20">
                  {user?.name?.charAt(0) || 'E'}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{user?.name}</h3>
                  <p className="text-gray-500">{user?.email}</p>
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full mt-2 font-bold uppercase tracking-wider">
                    {user?.role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                <div>
                  <h4 className="text-gray-400 text-xs font-bold uppercase mb-3">Service Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Department:</span>
                      <span className="text-gray-900">{user?.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Municipality:</span>
                      <span className="text-gray-900">{user?.municipalityCode}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-gray-400 text-xs font-bold uppercase mb-3">Workload</h4>
                  {(() => {
                    const profileUser = liveUser || user;
                    const current = profileUser?.currentWorkload || 0;
                    const max = profileUser?.maxConcurrentComplaints || 5;
                    const remaining = Math.max(0, max - current);
                    const pct = max > 0 ? (current / max) * 100 : 0;
                    const barColor = pct >= 100 ? 'bg-red-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-green-400';
                    const textColor = pct >= 100 ? 'text-red-600' : pct >= 50 ? 'text-yellow-600' : 'text-green-600';
                    return (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Current Load:</span>
                          <span className={`font-bold ${textColor}`}>{current}/{max} complaints</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Remaining Slots:</span>
                          <span className={`font-bold ${textColor}`}>{remaining} available</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Status:</span>
                          <span className={`font-bold ${textColor}`}>{profileUser?.availabilityStatus || 'AVAILABLE'}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        );

      // reports case removed — analytics merged into overview
      case '__removed_reports__': {
        const total = tasks.length;
        const resolved = tasks.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
        const active = tasks.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length;
        const inProgress = tasks.filter(t => t.status === 'In Progress').length;
        const assigned = tasks.filter(t => t.status === 'Assigned' || t.status === 'Pending').length;
        const performance = total > 0 ? Math.round((resolved / total) * 100) : 0;

        // Sector breakdown
        const sectorMap = {};
        tasks.forEach(t => {
          const s = t.sector || 'Unknown';
          sectorMap[s] = (sectorMap[s] || 0) + 1;
        });
        const sectors = Object.entries(sectorMap).sort((a, b) => b[1] - a[1]);

        // Priority breakdown
        const highP = tasks.filter(t => t.priority === 'High').length;
        const medP = tasks.filter(t => t.priority === 'Medium').length;
        const lowP = tasks.filter(t => t.priority === 'Low').length;

        // Resolved per week (last 4 weeks)
        const now = new Date();
        const weeklyData = [0, 0, 0, 0];
        tasks.filter(t => t.status === 'Resolved' || t.status === 'Closed').forEach(t => {
          const d = new Date(t.resolvedDate || t.updatedAt);
          const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
          if (diffDays < 7) weeklyData[3]++;
          else if (diffDays < 14) weeklyData[2]++;
          else if (diffDays < 21) weeklyData[1]++;
          else if (diffDays < 28) weeklyData[0]++;
        });
        const weeklyMax = Math.max(...weeklyData, 1);

        // Satisfaction
        const satisfied = tasks.filter(t => t.feedbackStatus === 'SATISFIED').length;
        const notSatisfied = tasks.filter(t => t.feedbackStatus === 'NOT_SATISFIED').length;
        const noFeedback = tasks.filter(t => t.status === 'Resolved' && !t.feedbackStatus).length;

        const sectorColors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-indigo-500'];

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">📈 Performance Reports</h2>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
              >
                🖨️ Print Report
              </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Tasks', value: total, icon: '📋', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
                { label: 'Resolved', value: resolved, icon: '✅', color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
                { label: 'In Progress', value: inProgress, icon: '⚙️', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
                { label: 'Pending', value: assigned, icon: '⏳', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
              ].map((card, i) => (
                <div key={i} className={`rounded-xl p-5 border ${card.bg}`}>
                  <div className="text-2xl mb-1">{card.icon}</div>
                  <p className={`text-3xl font-black ${card.color}`}>{card.value}</p>
                  <p className="text-gray-500 text-sm mt-1">{card.label}</p>
                </div>
              ))}
            </div>

            {/* Performance Score + Weekly Bar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Ring */}
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Performance</h3>
                <div className="flex items-center gap-6">
                  <div className="relative w-28 h-28 flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.9" fill="none"
                        stroke={performance >= 80 ? '#22c55e' : performance >= 50 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="3"
                        strokeDasharray={`${performance} ${100 - performance}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-xl font-black ${performance >= 80 ? 'text-green-600' : performance >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {performance}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3 flex-1">
                    {[
                      { label: 'Resolution Rate', val: `${performance}%`, color: 'text-green-600' },
                      { label: 'Citizen Satisfaction', val: satisfied + noFeedback > 0 ? `${Math.round((satisfied / Math.max(satisfied + notSatisfied, 1)) * 100)}%` : 'N/A', color: 'text-blue-600' },
                      { label: 'Active Load', val: `${active} tasks`, color: 'text-orange-600' },
                    ].map((r, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-500">{r.label}</span>
                        <span className={`font-bold ${r.color}`}>{r.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Weekly Bar Chart */}
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks Resolved — Last 4 Weeks</h3>
                <div className="flex items-end gap-4 h-32">
                  {weeklyData.map((val, i) => {
                    const height = weeklyMax > 0 ? Math.round((val / weeklyMax) * 100) : 0;
                    const labels = ['4w ago', '3w ago', '2w ago', 'This week'];
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-xs font-bold text-gray-700">{val}</span>
                        <div className="w-full rounded-t-lg bg-blue-500 transition-all duration-700 hover:bg-blue-600"
                          style={{ height: `${Math.max(height, 4)}%` }} />
                        <span className="text-[10px] text-gray-400 text-center">{labels[i]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Priority + Sector Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Priority */}
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Priority</h3>
                <div className="space-y-3">
                  {[
                    { label: 'High', count: highP, color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-100' },
                    { label: 'Medium', count: medP, color: 'bg-yellow-400', text: 'text-yellow-600', bg: 'bg-yellow-100' },
                    { label: 'Low', count: lowP, color: 'bg-green-400', text: 'text-green-600', bg: 'bg-green-100' },
                  ].map((p, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1 text-sm">
                        <span className={`font-medium ${p.text}`}>{p.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.bg} ${p.text}`}>{p.count}</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full">
                        <div
                          className={`h-full ${p.color} rounded-full transition-all duration-700`}
                          style={{ width: total > 0 ? `${(p.count / total) * 100}%` : '0%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sector */}
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Sector</h3>
                {sectors.length === 0 ? (
                  <p className="text-center text-gray-400 py-6">No sector data yet</p>
                ) : (
                  <div className="space-y-3">
                    {sectors.slice(0, 5).map(([sector, count], i) => (
                      <div key={sector}>
                        <div className="flex justify-between items-center mb-1 text-sm">
                          <span className="text-gray-700 font-medium truncate">{sector}</span>
                          <span className="text-gray-500 ml-2 flex-shrink-0">{count} tasks</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full">
                          <div
                            className={`h-full ${sectorColors[i % sectorColors.length]} rounded-full transition-all duration-700`}
                            style={{ width: `${(count / total) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Citizen Feedback Summary */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Citizen Feedback Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-2xl font-black text-green-600">{satisfied}</p>
                  <p className="text-sm text-gray-500 mt-1">✅ Satisfied</p>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-2xl font-black text-red-600">{notSatisfied}</p>
                  <p className="text-sm text-gray-500 mt-1">❌ Not Satisfied</p>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-2xl font-black text-gray-600">{noFeedback}</p>
                  <p className="text-sm text-gray-500 mt-1">⏳ Awaiting</p>
                </div>
              </div>
            </div>

            {/* Full Task Table */}
            <div className="glass rounded-xl p-6 overflow-x-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">All Tasks — Detailed Log</h3>
              {tasks.length === 0 ? (
                <p className="text-center text-gray-400 py-6">No tasks assigned yet</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase border-b border-gray-200">
                      <th className="pb-3 pr-4">Title</th>
                      <th className="pb-3 pr-4">Sector</th>
                      <th className="pb-3 pr-4">Priority</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tasks.map(task => (
                      <tr key={task.group_id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 pr-4 font-medium text-gray-900 max-w-[180px] truncate">{task.issue_title}</td>
                        <td className="py-3 pr-4 text-gray-500">{task.sector || '—'}</td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${task.priority === 'High' ? 'bg-red-100 text-red-700' : task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${task.status === 'Resolved' ? 'bg-green-100 text-green-700' : task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="py-3 text-gray-400">{new Date(task.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );
      }

      case 'schedule': {
        // Group tasks by their assigned/updated date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayTasks = tasks.filter(t => {
          const d = new Date(t.updatedAt);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime() && t.status !== 'Resolved' && t.status !== 'Closed';
        });

        const upcomingTasks = tasks.filter(t => t.status !== 'Resolved' && t.status !== 'Closed' && !todayTasks.includes(t));
        const completedRecent = tasks
          .filter(t => t.status === 'Resolved' || t.status === 'Closed')
          .sort((a, b) => new Date(b.resolvedDate || b.updatedAt) - new Date(a.resolvedDate || a.updatedAt))
          .slice(0, 5);

        // Build a simple 7-day grid
        const days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(today);
          d.setDate(today.getDate() - 3 + i); // show -3 to +3 days
          const dayStr = d.toDateString();
          const dayTasks = tasks.filter(t => new Date(t.updatedAt).toDateString() === dayStr);
          return { date: d, tasks: dayTasks };
        });

        const formatDate = (d) => d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
        const isToday = (d) => d.toDateString() === today.toDateString();

        const statusColor = (status) => {
          if (status === 'Resolved' || status === 'Closed') return 'bg-green-100 text-green-700 border-green-200';
          if (status === 'In Progress') return 'bg-blue-100 text-blue-700 border-blue-200';
          return 'bg-orange-100 text-orange-700 border-orange-200';
        };

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">📅 Schedule</h2>
              <div className="text-sm text-gray-400 font-medium">
                {today.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            </div>

            {/* 7-Day Mini Calendar Strip */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">7-Day Activity Strip</h3>
              <div className="grid grid-cols-7 gap-2">
                {days.map(({ date, tasks: dayTasks }, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-3 text-center border transition-all ${isToday(date)
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/25'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <p className={`text-[10px] font-bold uppercase mb-1 ${isToday(date) ? 'text-blue-200' : 'text-gray-400'}`}>
                      {date.toLocaleDateString('en-IN', { weekday: 'short' })}
                    </p>
                    <p className={`text-lg font-black`}>{date.getDate()}</p>
                    {dayTasks.length > 0 && (
                      <div className={`mt-1.5 w-2 h-2 rounded-full mx-auto ${isToday(date) ? 'bg-white' : 'bg-blue-500'}`} />
                    )}
                    <p className={`text-[10px] mt-1 ${isToday(date) ? 'text-blue-200' : 'text-gray-400'}`}>
                      {dayTasks.length > 0 ? `${dayTasks.length} task${dayTasks.length > 1 ? 's' : ''}` : '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Tasks */}
              <div className="glass rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                  <h3 className="text-lg font-semibold text-gray-900">Today's Active Tasks</h3>
                  <span className="ml-auto text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {todayTasks.length}
                  </span>
                </div>
                {todayTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-4xl">🎉</span>
                    <p className="text-gray-400 mt-2 text-sm">No active tasks today — great work!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayTasks.map(task => (
                      <div
                        key={task.group_id}
                        onClick={() => { setActiveSection('tasks'); handleTaskClick(task); }}
                        className="p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{task.issue_title}</p>
                            <p className="text-gray-400 text-xs mt-1">📍 {task.address?.area || 'N/A'}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${statusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming / Pending */}
              <div className="glass rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
                  <h3 className="text-lg font-semibold text-gray-900">Pending Queue</h3>
                  <span className="ml-auto text-sm font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                    {upcomingTasks.length}
                  </span>
                </div>
                {upcomingTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-4xl">✨</span>
                    <p className="text-gray-400 mt-2 text-sm">Queue is clear!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {upcomingTasks.map(task => (
                      <div
                        key={task.group_id}
                        onClick={() => { setActiveSection('tasks'); handleTaskClick(task); }}
                        className="p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 truncate">{task.issue_title}</p>
                              {task.reopened && <span className="px-1.5 py-0.5 text-[9px] bg-red-100 text-red-700 rounded-full border border-red-200 font-bold flex-shrink-0">🔄 REOPENED</span>}
                            </div>
                            <p className="text-gray-400 text-xs mt-1">
                              {new Date(task.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} · {task.sector || '—'}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${task.priority === 'High' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recently Completed Timeline */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                <h3 className="text-lg font-semibold text-gray-900">Recently Completed</h3>
              </div>
              {completedRecent.length === 0 ? (
                <p className="text-center text-gray-400 py-6">No completed tasks yet</p>
              ) : (
                <div className="relative pl-6">
                  {/* Vertical line */}
                  <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-gray-200 rounded-full"></div>
                  <div className="space-y-6">
                    {completedRecent.map((task, i) => (
                      <div key={task.group_id} className="relative">
                        {/* Dot */}
                        <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ${i === 0 ? 'bg-green-500' : 'bg-gray-300'} shadow-sm`}></div>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-gray-900">{task.issue_title}</p>
                              <p className="text-gray-400 text-xs mt-1">{task.sector || '—'} · {task.address?.area || 'N/A'}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs text-green-600 font-bold">✅ Resolved</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {new Date(task.resolvedDate || task.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          {task.feedbackStatus && (
                            <div className={`mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${task.feedbackStatus === 'SATISFIED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {task.feedbackStatus === 'SATISFIED' ? '👍 Citizen Satisfied' : '👎 Citizen Not Satisfied'}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'messages':
        return <MessagesSection getToken={getToken} />;

      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
            <span className="text-6xl mb-4">🚧</span>
            <h2 className="text-xl font-medium">Under Construction</h2>
            <p>This section is currently being developed.</p>
          </div>
        );
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-blue-600 animate-pulse text-xl font-bold">Loading CivcMind Dashboard...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="glass border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-black italic tracking-tighter text-blue-500">CIVICMIND <span className="text-gray-900 not-italic font-light">EMPLOYEE</span></h1>
            </div>
            <div className="flex items-center space-x-6">
              <div className="hidden md:block text-right">
                <div className="text-xs text-gray-400 font-bold uppercase">Assigned To</div>
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
        <aside className="w-64 hidden lg:block h-[calc(100vh-64px)] sticky top-16 glass border-r border-gray-200">
          <nav className="p-4 space-y-2">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`
                                    w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200
                                    ${activeSection === item.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
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
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around h-16">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                activeSection === item.id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className={`text-xl transition-transform ${activeSection === item.id ? 'scale-110' : 'scale-100'}`}>{item.icon}</span>
              <span className={`text-[10px] font-bold ${activeSection === item.id ? 'opacity-100' : 'opacity-70'}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default EmployeeDashboard;
