import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/button.jsx';

const EmployeeDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('overview');
    const [selectedTask, setSelectedTask] = useState(null);
    const [taskStatus, setTaskStatus] = useState({});
    const [uploadedImages, setUploadedImages] = useState({});

    // Initialize task status when a task is selected
    const initializeTaskStatus = (taskId) => {
        if (!taskStatus[taskId]) {
            setTaskStatus(prev => ({
                ...prev,
                [taskId]: {
                    status: 'pending',
                    acknowledgedAt: null,
                    resolvedAt: null,
                    completedAt: null
                }
            }));
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        initializeTaskStatus(task.id);
    };

    const handleAcknowledge = (taskId) => {
        setTaskStatus(prev => ({
            ...prev,
            [taskId]: {
                ...prev[taskId],
                status: 'in-progress',
                acknowledgedAt: new Date().toISOString()
            }
        }));
    };

    const handleMarkResolved = (taskId) => {
        setTaskStatus(prev => ({
            ...prev,
            [taskId]: {
                ...prev[taskId],
                status: 'resolved',
                resolvedAt: new Date().toISOString()
            }
        }));
    };

    const handleCameraCapture = (taskId) => {
        // Create a video stream from camera
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        })
        .then(stream => {
            video.srcObject = stream;
            video.play();
            
            // Create capture button
            const captureButton = document.createElement('button');
            captureButton.textContent = '📸 Capture Photo';
            captureButton.className = 'w-full px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors mt-4';
            
            // Create preview container
            const previewContainer = document.createElement('div');
            previewContainer.className = 'space-y-4 mt-4';
            
            captureButton.onclick = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0);
                
                canvas.toBlob(blob => {
                    const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    const image = {
                        id: Date.now() + Math.random(),
                        file,
                        preview: URL.createObjectURL(file),
                        name: file.name,
                        capturedAt: new Date().toISOString()
                    };
                    
                    setUploadedImages(prev => ({
                        ...prev,
                        [taskId]: [...(prev[taskId] || []), image]
                    }));
                    
                    // Show captured image preview
                    const imgPreview = document.createElement('div');
                    imgPreview.className = 'relative group';
                    imgPreview.innerHTML = `
                        <img src="${image.preview}" alt="${image.name}" class="w-full h-32 object-cover rounded-lg" />
                        <div class="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs p-1 rounded text-center">
                            📸 Captured at ${new Date(image.capturedAt).toLocaleTimeString()}
                        </div>
                        <button class="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                    `;
                    
                    imgPreview.querySelector('button').onclick = () => {
                        setUploadedImages(prev => ({
                            ...prev,
                            [taskId]: prev[taskId].filter(img => img.id !== image.id)
                        }));
                        imgPreview.remove();
                    };
                    
                    previewContainer.appendChild(imgPreview);
                }, 'image/jpeg');
            };
            
            // Create modal-like interface
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4';
            modal.innerHTML = `
                <div class="glass rounded-xl p-6 max-w-2xl w-full">
                    <h4 class="text-white font-medium mb-4">📷 Capture Resolution Images</h4>
                    <video class="w-full rounded-lg mb-4" autoplay></video>
                    <div class="preview-container space-y-4"></div>
                </div>
            `;
            
            const modalVideo = modal.querySelector('video');
            const modalPreview = modal.querySelector('.preview-container');
            modalVideo.srcObject = stream;
            
            modal.querySelector('.glass').appendChild(captureButton);
            
            // Close modal on background click
            modal.onclick = (e) => {
                if (e.target === modal) {
                    stream.getTracks().forEach(track => track.stop());
                    modal.remove();
                }
            };
            
            document.body.appendChild(modal);
        })
        .catch(err => {
            console.error('Camera access denied:', err);
            alert('Camera access is required to capture images. Please allow camera permissions.');
        });
    };

    const handleFinalResolve = (taskId) => {
        setTaskStatus(prev => ({
            ...prev,
            [taskId]: {
                ...prev[taskId],
                status: 'completed',
                completedAt: new Date().toISOString(),
                images: uploadedImages[taskId] || []
            }
        }));
        setSelectedTask(null);
    };

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'tasks', label: 'My Tasks', icon: '📋' },
        { id: 'reports', label: 'Reports', icon: '📈' },
        { id: 'schedule', label: 'Schedule', icon: '📅' },
        { id: 'messages', label: 'Messages', icon: '💬' },
        { id: 'profile', label: 'Profile', icon: '👤' },
    ];

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
                                <p className="text-3xl font-bold text-[#60A5FA]">12</p>
                                <p className="text-white/60 text-sm mt-1">3 due today</p>
                            </div>
                            <div className="glass rounded-xl p-6">
                                <div className="text-3xl mb-2">✅</div>
                                <h3 className="text-lg font-semibold text-white mb-1">Completed</h3>
                                <p className="text-3xl font-bold text-green-400">28</p>
                                <p className="text-white/60 text-sm mt-1">This month</p>
                            </div>
                            <div className="glass rounded-xl p-6">
                                <div className="text-3xl mb-2">📈</div>
                                <h3 className="text-lg font-semibold text-white mb-1">Performance</h3>
                                <p className="text-3xl font-bold text-purple-400">94%</p>
                                <p className="text-white/60 text-sm mt-1">Excellent</p>
                            </div>
                        </div>
                        
                        <div className="glass rounded-xl p-6">
                            <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                        <div>
                                            <p className="text-white font-medium">Completed street lighting repair</p>
                                            <p className="text-white/60 text-sm">2 hours ago</p>
                                        </div>
                                    </div>
                                    <span className="text-green-400 text-sm">+10 pts</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                        <div>
                                            <p className="text-white font-medium">Updated waste collection schedule</p>
                                            <p className="text-white/60 text-sm">5 hours ago</p>
                                        </div>
                                    </div>
                                    <span className="text-blue-400 text-sm">+5 pts</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                        <div>
                                            <p className="text-white font-medium">Assigned new maintenance task</p>
                                            <p className="text-white/60 text-sm">1 day ago</p>
                                        </div>
                                    </div>
                                    <span className="text-yellow-400 text-sm">New</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'tasks':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-white">My Tasks</h2>
                        
                        {selectedTask ? (
                            // Task Detail View with Status Tracking
                            <div className="glass rounded-xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-semibold text-white">{selectedTask.title}</h3>
                                    <Button
                                        label="Back to Tasks"
                                        variant="outline"
                                        size="small"
                                        onClick={() => setSelectedTask(null)}
                                    />
                                </div>
                                
                                {/* Status Tracking Diagram - Show for all task statuses */}
                                {!taskStatus[selectedTask.id]?.status || taskStatus[selectedTask.id]?.status === 'pending' || taskStatus[selectedTask.id]?.status === 'in-progress' || taskStatus[selectedTask.id]?.status === 'resolved' ? (
                                    <div className="mb-6">
                                        <h4 className="text-lg font-medium text-white mb-4">Status Tracking</h4>
                                        <div className="relative">
                                            {/* Progress Bar Container */}
                                            <div className="relative h-8 bg-white/10 rounded-full overflow-hidden">
                                                {/* Background Progress Line */}
                                                <div className="absolute inset-0 h-full bg-white/10"></div>
                                                
                                                {/* Active Progress Line */}
                                                <div 
                                                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-yellow-400 via-blue-400 to-green-400 transition-all duration-500 rounded-full"
                                                    style={{
                                                        width: taskStatus[selectedTask.id]?.status === 'pending' ? '0%' :
                                                               taskStatus[selectedTask.id]?.status === 'in-progress' ? '50%' : '100%'
                                                    }}
                                                ></div>
                                                
                                                {/* Progress Indicators */}
                                                <div className="absolute inset-0 flex items-center justify-between px-2">
                                                    {/* Pending - 0% */}
                                                    <div className={`flex flex-col items-center ${taskStatus[selectedTask.id]?.status === 'pending' ? 'text-yellow-400' : 'text-white/40'}`}>
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                                                            taskStatus[selectedTask.id]?.status === 'pending' 
                                                                ? 'bg-yellow-400 text-white shadow-lg shadow-yellow-400/50' 
                                                                : 'bg-white/20 border-2 border-white/40'
                                                        }`}>
                                                            1
                                                        </div>
                                                        <span className="text-xs font-medium mt-1">0%</span>
                                                        <span className="text-xs">Pending</span>
                                                    </div>
                                                    
                                                    {/* In Progress - 50% */}
                                                    <div className={`flex flex-col items-center ${taskStatus[selectedTask.id]?.status === 'in-progress' ? 'text-blue-400' : 'text-white/40'}`}>
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                                                            taskStatus[selectedTask.id]?.status === 'in-progress' 
                                                                ? 'bg-blue-400 text-white shadow-lg shadow-blue-400/50' 
                                                                : 'bg-white/20 border-2 border-white/40'
                                                        }`}>
                                                            2
                                                        </div>
                                                        <span className="text-xs font-medium mt-1">50%</span>
                                                        <span className="text-xs">In Progress</span>
                                                    </div>
                                                    
                                                    {/* Resolved - 100% */}
                                                    <div className={`flex flex-col items-center ${taskStatus[selectedTask.id]?.status === 'resolved' ? 'text-green-400' : 'text-white/40'}`}>
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                                                            taskStatus[selectedTask.id]?.status === 'resolved' 
                                                                ? 'bg-green-400 text-white shadow-lg shadow-green-400/50' 
                                                                : 'bg-white/20 border-2 border-white/40'
                                                        }`}>
                                                            3
                                                        </div>
                                                        <span className="text-xs font-medium mt-1">100%</span>
                                                        <span className="text-xs">Resolved</span>
                                                    </div>
                                                </div>
                                            </div>
                                    
                                            <div className="mt-4 text-center">
                                                <span
                                                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                                                    taskStatus[selectedTask.id]?.status === 'pending'
                                                        ? 'bg-yellow-400/20 text-yellow-400'
                                                        : taskStatus[selectedTask.id]?.status === 'in-progress'
                                                        ? 'bg-blue-400/20 text-blue-400'
                                                        : taskStatus[selectedTask.id]?.status === 'resolved'
                                                        ? 'bg-green-400/20 text-green-400'
                                                        : 'bg-yellow-400/20 text-yellow-400'
                                                    }`}
                                                >
                                                    Current Status:{' '}
                                                    {taskStatus[selectedTask.id]?.status === 'pending'
                                                    ? 'Pending (0%)'
                                                    : taskStatus[selectedTask.id]?.status === 'in-progress'
                                                    ? 'In Progress (50%)'
                                                    : taskStatus[selectedTask.id]?.status === 'resolved'
                                                    ? 'Resolved (100%)'
                                                    : 'Pending (0%)'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                {/* Task Details - Stacked Layout */}
                                <div className="space-y-6 mb-6">
                                    <div className="glass rounded-xl p-6">
                                        <h4 className="text-white font-medium mb-3">Task Details</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-white/60">Priority:</span>
                                                <span className="text-white">{selectedTask.priority}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/60">Due Date:</span>
                                                <span className="text-white">{selectedTask.dueDate}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/60">Location:</span>
                                                <span className="text-white">{selectedTask.location}</span>
                                            </div>
                                            {taskStatus[selectedTask.id]?.completedAt && (
                                                <div className="flex justify-between">
                                                    <span className="text-white/60">Completed At:</span>
                                                    <span className="text-green-400">{new Date(taskStatus[selectedTask.id].completedAt).toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="glass rounded-xl p-6">
                                        <h4 className="text-white font-medium mb-3">Timeline</h4>
                                        <div className="space-y-2">
                                            {taskStatus[selectedTask.id]?.acknowledgedAt && (
                                                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                                    <p className="text-blue-400 text-sm">Acknowledged at {new Date(taskStatus[selectedTask.id].acknowledgedAt).toLocaleString()}</p>
                                                </div>
                                            )}
                                            {taskStatus[selectedTask.id]?.resolvedAt && (
                                                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                                    <p className="text-green-400 text-sm">Marked as resolved at {new Date(taskStatus[selectedTask.id].resolvedAt).toLocaleString()}</p>
                                                </div>
                                            )}
                                            {taskStatus[selectedTask.id]?.completedAt && (
                                                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                                    <p className="text-green-400 text-sm">Completed at {new Date(taskStatus[selectedTask.id].completedAt).toLocaleString()}</p>
                                                </div>
                                            )}
                                            {!taskStatus[selectedTask.id]?.acknowledgedAt && !taskStatus[selectedTask.id]?.resolvedAt && !taskStatus[selectedTask.id]?.completedAt && (
                                                <p className="text-white/40 text-sm">No timeline events yet</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Uploaded Images Section - Only show for completed tasks */}
                                    {taskStatus[selectedTask.id]?.status === 'completed' && (
                                        <div className="glass rounded-xl p-6">
                                            <h4 className="text-white font-medium mb-4">Uploaded Resolution Images</h4>
                                            {taskStatus[selectedTask.id]?.images && taskStatus[selectedTask.id].images.length > 0 ? (
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    {taskStatus[selectedTask.id].images.map(image => (
                                                        <div key={image.id} className="relative group">
                                                            <img 
                                                                src={image.preview} 
                                                                alt={image.name}
                                                                className="w-full h-32 object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform"
                                                                onClick={() => window.open(image.preview, '_blank')}
                                                            />
                                                            <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs p-1 rounded text-center">
                                                                {image.name}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-white/60">No images uploaded for this task.</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-4">
                                    {!taskStatus[selectedTask.id]?.status || taskStatus[selectedTask.id]?.status === 'pending' ? (
                                        <Button
                                            label="Acknowledge Task"
                                            variant="primary"
                                            size="large"
                                            className="w-full"
                                            onClick={() => handleAcknowledge(selectedTask.id)}
                                        />
                                    ) : taskStatus[selectedTask.id]?.status === 'in-progress' ? (
                                        <div>
                                            {/* Image Capture Section - Moved up */}
                                            <div className="glass rounded-xl p-6 mb-4">
                                                <h4 className="text-white font-medium mb-4">Capture Resolution Images</h4>
                                                <Button
                                                    label="📷 Open Camera"
                                                    variant="primary"
                                                    size="large"
                                                    className="w-full"
                                                    onClick={() => handleCameraCapture(selectedTask.id)}
                                                />
                                                
                                                {/* Captured Images Preview */}
                                                {uploadedImages[selectedTask.id]?.length > 0 && (
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                                                        {uploadedImages[selectedTask.id].map(image => (
                                                            <div key={image.id} className="relative group">
                                                                <img 
                                                                    src={image.preview} 
                                                                    alt={image.name}
                                                                    className="w-full h-32 object-cover rounded-lg"
                                                                />
                                                                <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs p-1 rounded text-center">
                                                                    📸 Captured at {new Date(image.capturedAt).toLocaleTimeString()}
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        setUploadedImages(prev => ({
                                                                            ...prev,
                                                                            [selectedTask.id]: prev[selectedTask.id].filter(img => img.id !== image.id)
                                                                        }));
                                                                    }}
                                                                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                {/* Capture Status Message */}
                                                {!uploadedImages[selectedTask.id]?.length && (
                                                    <p className="text-yellow-400 text-sm mt-2">📷 Please capture images to enable "Mark as Resolved" button</p>
                                                )}
                                            </div>
                                            
                                            {/* Mark as Resolved Button - Moved down */}
                                            <Button
                                                label="Mark as Resolved"
                                                variant="primary"
                                                size="large"
                                                className="w-full"
                                                disabled={!uploadedImages[selectedTask.id]?.length}
                                                onClick={() => handleMarkResolved(selectedTask.id)}
                                            />
                                        </div>
                                    ) : taskStatus[selectedTask.id]?.status === 'resolved' ? (
                                        /* Show captured images after Mark as Resolved */
                                        <div className="glass rounded-xl p-6">
                                            <h4 className="text-white font-medium mb-4">Captured Resolution Images</h4>
                                            {uploadedImages[selectedTask.id]?.length > 0 ? (
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    {uploadedImages[selectedTask.id].map(image => (
                                                        <div key={image.id} className="relative group">
                                                            <img 
                                                                src={image.preview} 
                                                                alt={image.name}
                                                                className="w-full h-32 object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform"
                                                                onClick={() => window.open(image.preview, '_blank')}
                                                            />
                                                            <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs p-1 rounded text-center">
                                                                📸 Captured at {new Date(image.capturedAt).toLocaleTimeString()}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-white/60">No images captured for this task.</p>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ) : (
                            // Task List View
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="glass rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-white mb-4">Pending Tasks</h3>
                                    <div className="space-y-3">
                                        {[
                                            { id: 1, title: 'Repair street light on Main St', priority: 'High', dueDate: 'Today', location: 'Main St & Oak Ave' },
                                            { id: 2, title: 'Inspect water pipeline', priority: 'Medium', dueDate: 'Tomorrow', location: 'Pine Street' }
                                        ].map(task => (
                                            <div 
                                                key={task.id}
                                                onClick={() => handleTaskClick(task)}
                                                className="p-4 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-all duration-200"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="text-white font-medium">{task.title}</h4>
                                                        <p className="text-white/60 text-sm mt-1">Priority: {task.priority} • Due: {task.dueDate}</p>
                                                        <p className="text-white/40 text-xs mt-1">📍 {task.location}</p>
                                                    </div>
                                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                                        task.priority === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                        {task.priority}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="glass rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-white mb-4">Completed Tasks</h3>
                                    <div className="space-y-3">
                                        {[
                                            { id: 3, title: 'Clean public park area', completedAt: '2:30 PM', images: ['image1.jpg', 'image2.jpg'] },
                                            { id: 4, title: 'Fix traffic signal', completedAt: '11:00 AM', images: ['signal1.jpg'] }
                                        ].map(task => (
                                            <div 
                                                key={task.id}
                                                onClick={() => handleTaskClick(task)}
                                                className="p-4 bg-green-500/10 rounded-lg border border-green-500/20 cursor-pointer hover:bg-green-500/20 transition-all duration-200"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="text-white font-medium">{task.title}</h4>
                                                        <p className="text-white/60 text-sm mt-1">Completed at {task.completedAt}</p>
                                                        <p className="text-green-400 text-xs mt-1">📸 {task.images?.length || 0} images uploaded</p>
                                                    </div>
                                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Done</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'reports':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-white">Reports</h2>
                        <div className="glass rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Monthly Performance</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-white mb-2">
                                        <span>Task Completion Rate</span>
                                        <span>85%</span>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-2">
                                        <div className="bg-[#60A5FA] h-2 rounded-full" style={{width: '85%'}}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-white mb-2">
                                        <span>Quality Score</span>
                                        <span>92%</span>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-2">
                                        <div className="bg-green-400 h-2 rounded-full" style={{width: '92%'}}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-white mb-2">
                                        <span>Timeliness</span>
                                        <span>78%</span>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-2">
                                        <div className="bg-yellow-400 h-2 rounded-full" style={{width: '78%'}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'schedule':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-white">Work Schedule</h2>
                        <div className="glass rounded-xl p-6">
                            <div className="grid grid-cols-7 gap-2 mb-4">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="text-center text-white/60 text-sm font-medium py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-2">
                                {Array.from({length: 35}, (_, i) => {
                                    const day = i - 2;
                                    const isToday = day === 15;
                                    const isWorkDay = day > 0 && day <= 30 && [1,2,3,4,5].includes(new Date(2024, 0, day).getDay());
                                    
                                    return (
                                        <div
                                            key={i}
                                            className={`
                                                aspect-square flex items-center justify-center rounded-lg text-sm
                                                ${day < 1 || day > 30 ? 'text-white/20' : 'text-white'}
                                                ${isToday ? 'bg-[#3B82F6] text-white' : ''}
                                                ${isWorkDay && !isToday ? 'bg-white/5' : ''}
                                                ${!isWorkDay && day > 0 && day <= 30 ? 'bg-white/10 text-white/40' : ''}
                                            `}
                                        >
                                            {day > 0 && day <= 30 ? day : ''}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );

            case 'messages':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-white">Messages</h2>
                        <div className="glass rounded-xl p-6">
                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-10 h-10 bg-[#3B82F6] rounded-full flex items-center justify-center text-white font-semibold">
                                            M
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-white font-medium">Manager</h4>
                                                <span className="text-white/60 text-sm">10:30 AM</span>
                                            </div>
                                            <p className="text-white/80 mt-1">Please prioritize the street lighting repair today. It's been reported by multiple citizens.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center text-white font-semibold">
                                            S
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-white font-medium">System</h4>
                                                <span className="text-white/60 text-sm">Yesterday</span>
                                            </div>
                                            <p className="text-white/80 mt-1">Your monthly performance report is now available for review.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'profile':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-white">Profile</h2>
                        <div className="glass rounded-xl p-6">
                            <div className="flex items-center space-x-6 mb-6">
                                <div className="w-20 h-20 bg-[#3B82F6] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                    {user?.name?.charAt(0) || 'E'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white">{user?.name || 'Employee User'}</h3>
                                    <p className="text-white/60">{user?.email || 'employee@civicmind.com'}</p>
                                    <span className="inline-block px-3 py-1 bg-[#3B82F6]/20 text-[#60A5FA] text-sm rounded-full mt-2">
                                        Employee
                                    </span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-white font-medium mb-3">Employee Information</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-white/60">Employee ID:</span>
                                            <span className="text-white">EMP001</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/60">Department:</span>
                                            <span className="text-white">Maintenance</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/60">Join Date:</span>
                                            <span className="text-white">Jan 15, 2024</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-white font-medium mb-3">Contact Information</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-white/60">Phone:</span>
                                            <span className="text-white">+1 234 567 8900</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/60">Location:</span>
                                            <span className="text-white">City Center</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/60">Status:</span>
                                            <span className="text-green-400">Active</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <Button
                                    label="Edit Profile"
                                    variant="secondary"
                                    size="medium"
                                    className="mr-3"
                                />
                                <Button
                                    label="Change Password"
                                    variant="outline"
                                    size="medium"
                                />
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0F1A]">
            {/* Header */}
            <header className="glass border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-white">CivicMind Employee</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-white/80">Welcome, {user?.name || 'Employee'}</span>
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
                <aside className="w-64 min-h-screen glass border-r border-white/10">
                    <nav className="p-4 space-y-2">
                        {menuItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className={`
                                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200
                                    ${activeSection === item.id 
                                        ? 'bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/30' 
                                        : 'text-white/70 hover:text-white hover:bg-white/5'
                                    }
                                `}
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span>{item.label}</span>
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
