import React, { useState, useEffect, useCallback } from 'react';
import { Doughnut, Line } from 'react-chartjs-2';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [showBlockingTimeModal, setShowBlockingTimeModal] = useState(false);
  const [blockingTimes, setBlockingTimes] = useState({
    sessionHrs: 3,
    leisureHrs: {
      breakfast: { start_time: '', end_time: '' },
      lunch: { start_time: '', end_time: '' },
      dinner: { start_time: '', end_time: '' }
    },
    otherLeisure: { start_time: '', end_time: '' }
  });
  const [progressData, setProgressData] = useState(null);
  const [metrics, setMetrics] = useState({
    completionRate: 0,
    dailyStreak: 0,
    utilizationRate: 0,
    topicTrends: {
      dates: [],
      completed: [],
      pending: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasExistingStudyTime, setHasExistingStudyTime] = useState(false);
  const [syncingProgress, setSyncingProgress] = useState(false);

  // Get token from Redux store
  const idToken = useSelector(state => state.auth.idToken);
  const navigate = useNavigate();

  // Function to update plan and sync progress
  // Function to update plan and sync progress
const updatePlanAndSyncProgress = useCallback(async (startDate, endDate) => {
  try {
    setSyncingProgress(true);
    
    // First, update the plan with the required date fields and proper parameter names
    const updatePlanResponse = await fetch('http://localhost:5000/plans/updateplans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        startDate,
        endDate,
        sessionHours: blockingTimes.sessionHrs, // Changed from sessionHrs to sessionHours
        leisureTimes: { // Changed from leisureHrs to leisureTimes
          breakfast: blockingTimes.leisureHrs.breakfast,
          lunch: blockingTimes.leisureHrs.lunch,
          dinner: blockingTimes.leisureHrs.dinner,
          other: blockingTimes.otherLeisure // Added other leisure time
        },
        presentPlan: progressData?.progress?.plan // Include current plan for reference
      })
    });
    
    if (!updatePlanResponse.ok) {
      const errorData = await updatePlanResponse.json();
      throw new Error(errorData.message || 'Failed to update plan');
    }
    
    const updatePlanData = await updatePlanResponse.json();
    
    // Then, sync progress with the updated plan
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM format
    
    const syncProgressResponse = await fetch('http://localhost:5000/plans/updateprogress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        date: currentDate,
        time: currentTime
      })
    });
    
    if (!syncProgressResponse.ok) {
      const errorData = await syncProgressResponse.json();
      throw new Error(errorData.message || 'Failed to sync progress');
    }
    
    const syncProgressData = await syncProgressResponse.json();
    
    // Refresh the progress data
    const result = await getProgressData();
    if (result.success) {
      setProgressData(result.data);
      calculateMetrics(result.data);
    }
    
    setSyncingProgress(false);
    return { success: true, data: syncProgressData };
  } catch (err) {
    setSyncingProgress(false);
    return { 
      success: false, 
      error: err.message || 'Failed to update plan and sync progress' 
    };
  }
}, [idToken, blockingTimes, progressData]);

  // Function to set study time - wrapped in useCallback
  const setStudyTime = useCallback(async (studyTimeData) => {
    try {
      const url = hasExistingStudyTime 
        ? 'http://localhost:5000/users/patchStudyTime' 
        : 'http://localhost:5000/users/setStudyTime';
      
      const method = hasExistingStudyTime ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(studyTimeData)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Server responded with error:', responseData);
        throw new Error(responseData.message || `Server error: ${response.status}`);
      }
      
      return { success: true, data: responseData };
    } catch (err) {
      console.error('Error in setStudyTime:', err);
      return { 
        success: false, 
        error: err.message || 'Failed to save study time' 
      };
    }
  }, [idToken, hasExistingStudyTime]);

  // Function to get study time - wrapped in useCallback
  const getStudyTime = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/users/getStudyTime', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (!response.ok) {
        // If we get a 404, it means no study time exists for this user
        if (response.status === 404) {
          setHasExistingStudyTime(false);
          return { success: false, error: "No study time found for user" };
        }
        
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch study time');
      }
      
      const data = await response.json();
      setHasExistingStudyTime(true);
      return { success: true, data };
    } catch (err) {
      setHasExistingStudyTime(false);
      return { 
        success: false, 
        error: err.message || 'Failed to fetch study time' 
      };
    }
  }, [idToken]);

  // Function to get progress data - wrapped in useCallback
  const getProgressData = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/plans/getprogress', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle case where no progress is found
        if (response.status === 404 || errorData.error === "Progress not found") {
          return { 
            success: false, 
            error: "No study progress found. Let's create your first study plan!" 
          };
        }
        
        throw new Error(errorData.message || 'Failed to fetch progress data');
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (err) {
      return { 
        success: false, 
        error: err.message || 'Failed to fetch progress data' 
      };
    }
  }, [idToken]);

  // Calculate metrics function
  const calculateMetrics = useCallback((data) => {
    if (!data || !data.progress || !data.progress.progress) return;

    const progressArray = data.progress.progress;

    // Calculate completion rate
    let totalTopics = 0;
    let completedTopics = 0;
    
    progressArray.forEach(day => {
      day.slots.forEach(slot => {
        totalTopics += slot.completedTopics.length + slot.pendingTopics.length;
        completedTopics += slot.completedTopics.length;
      });
    });
    
    const completionRate = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    // Calculate daily streak
    let streak = 0;
    const today = new Date();
    const sortedDates = [...progressArray]
      .map(day => new Date(day.date))
      .sort((a, b) => b - a);
    
    for (let i = 0; i < sortedDates.length; i++) {
      const diffTime = Math.abs(today - sortedDates[i]);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === i + 1) {
        streak++;
      } else {
        break;
      }
    }

    // Calculate utilization rate
    let totalSlots = 0;
    let utilizedSlots = 0;
    
    progressArray.forEach(day => {
      day.slots.forEach(slot => {
        totalSlots++;
        if (slot.status === 'completed' || slot.completedTopics.length > 0) {
          utilizedSlots++;
        }
      });
    });
    
    const utilizationRate = totalSlots > 0 ? Math.round((utilizedSlots / totalSlots) * 100) : 0;

    // Prepare topic trends data
    const dates = [];
    const completed = [];
    const pending = [];
    
    progressArray.forEach(day => {
      let dayCompleted = 0;
      let dayPending = 0;
      
      day.slots.forEach(slot => {
        dayCompleted += slot.completedTopics.length;
        dayPending += slot.pendingTopics.length;
      });
      
      dates.push(new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      completed.push(dayCompleted);
      pending.push(dayPending);
    });

    setMetrics({
      completionRate,
      dailyStreak: streak,
      utilizationRate,
      topicTrends: {
        dates,
        completed,
        pending
      }
    });
  }, []);

  // Helper function to parse time strings from backend
  const parseTimeString = useCallback((timeString) => {
    if (!timeString) return { start_time: '', end_time: '' };
    
    // Handle the format from backend: "08:15 AM to 08:45 AM"
    try {
      const parts = timeString.split(' to ');
      if (parts.length === 2) {
        return {
          start_time: parts[0] || '',
          end_time: parts[1] || ''
        };
      }
      return { start_time: '', end_time: '' };
    } catch (err) {
      console.error('Error parsing time string:', err);
      return { start_time: '', end_time: '' };
    }
  }, []);

  // Fetch study time data on component mount or when idToken changes
  useEffect(() => {
    const fetchStudyTime = async () => {
      try {
        setLoading(true);
        
        if (!idToken) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        const result = await getStudyTime();
        
        if (!result.success) {
          // Show modal if no study time is found
          if (result.error.includes("No study time found")) {
            setShowBlockingTimeModal(true);
          } else {
            setError(result.error);
          }
        } else {
          const data = result.data;
          
          // Parse the time strings from backend into the expected object format
          const updatedBlockingTimes = {
            sessionHrs: data.sessionHrs || 3,
            leisureHrs: {
              breakfast: parseTimeString(data.breakfast),
              lunch: parseTimeString(data.lunch),
              dinner: parseTimeString(data.dinner)
            },
            otherLeisure: parseTimeString(data.otherLeisure)
          };
          
          setBlockingTimes(updatedBlockingTimes);
        }
      } catch (err) {
        setError(err.message);
        setShowBlockingTimeModal(true);
      }
    };

    if (idToken) {
      fetchStudyTime();
    } else {
      setError('No authentication token found');
      setLoading(false);
      setShowBlockingTimeModal(true);
    }
  }, [idToken, getStudyTime, parseTimeString]);

  // Fetch progress data when idToken changes or when modal is closed
  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        
        if (!idToken) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        const result = await getProgressData();
        
        if (!result.success) {
          setError(result.error);
        } else {
          const data = result.data;
          setProgressData(data);
          calculateMetrics(data);
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (idToken && !showBlockingTimeModal) {
      fetchProgressData();
    }
  }, [idToken, showBlockingTimeModal, getProgressData, calculateMetrics]);

  const handleBlockingTimeSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!idToken) {
        setError('No authentication token found');
        return;
      }

      // Format the data for backend (nested object format)
      const studyTimeData = {
        sessionHrs: parseInt(blockingTimes.sessionHrs) || 3,
        leisureHrs: {
          breakfast: {
            start_time: blockingTimes.leisureHrs.breakfast.start_time,
            end_time: blockingTimes.leisureHrs.breakfast.end_time
          },
          lunch: {
            start_time: blockingTimes.leisureHrs.lunch.start_time,
            end_time: blockingTimes.leisureHrs.lunch.end_time
          },
          dinner: {
            start_time: blockingTimes.leisureHrs.dinner.start_time,
            end_time: blockingTimes.leisureHrs.dinner.end_time
          }
        }
      };

      // Only include otherLeisure if values are provided
      if (blockingTimes.otherLeisure.start_time && blockingTimes.otherLeisure.end_time) {
        studyTimeData.otherLeisure = {
          start_time: blockingTimes.otherLeisure.start_time,
          end_time: blockingTimes.otherLeisure.end_time
        };
      }

      const result = await setStudyTime(studyTimeData);
      
      if (!result.success) {
        setError(result.error);
      } else {
        // After successfully setting study time, update the plan and sync progress
        const updateResult = await updatePlanAndSyncProgress();
        
        if (!updateResult.success) {
          setError(updateResult.error);
          return;
        }
        
        setShowBlockingTimeModal(false);
        setHasExistingStudyTime(true);
        
        // Refresh the study time data
        const studyTimeResult = await getStudyTime();
        if (studyTimeResult.success) {
          const data = studyTimeResult.data;
          // Parse the response data back to frontend format
          const updatedBlockingTimes = {
            sessionHrs: data.sessionHrs || 3,
            leisureHrs: {
              breakfast: parseTimeString(data.breakfast),
              lunch: parseTimeString(data.lunch),
              dinner: parseTimeString(data.dinner)
            },
            otherLeisure: parseTimeString(data.otherLeisure)
          };
          setBlockingTimes(updatedBlockingTimes);
        }
      }
    } catch (err) {
      console.error('Error in handleBlockingTimeSubmit:', err);
      setError(err.message);
    }
  };

  const handleInputChange = (category, field, value) => {
    if (category === 'sessionHrs') {
      setBlockingTimes(prev => ({
        ...prev,
        sessionHrs: parseInt(value) || 3
      }));
    } else if (category.includes('.')) {
      // Handle nested properties like leisureHrs.breakfast.start_time
      const [parent, child, subfield] = category.split('.');
      setBlockingTimes(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: {
            ...prev[parent][child],
            [subfield]: value
          }
        }
      }));
    } else {
      setBlockingTimes(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [field]: value
        }
      }));
    }
  };

  // Function to navigate to study schedule page
  const handleViewStudySchedule = () => {
    navigate('/studyschedule');
  };

  // Function to navigate to study plan creation
  const handleCreatePlan = () => {
    navigate('/create-plan');
  };

  // Data for the doughnut chart (slot utilization)
  const utilizationData = {
    labels: ['Completed', 'Pending'],
    datasets: [
      {
        data: [metrics.utilizationRate, 100 - metrics.utilizationRate],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Data for the line chart (topic trends)
  const topicTrendsData = {
    labels: metrics.topicTrends.dates,
    datasets: [
      {
        label: 'Completed Topics',
        data: metrics.topicTrends.completed,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Pending Topics',
        data: metrics.topicTrends.pending,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#e2e8f0'
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#e2e8f0'
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#e2e8f0'
        }
      }
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#e2e8f0'
        }
      },
    },
    cutout: '70%',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Blocking Time Modal */}
      {showBlockingTimeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Set Your Study Schedule</h2>
            <p className="text-gray-400 mb-6">Please set your daily study schedule and blocking times</p>
            
            <form onSubmit={handleBlockingTimeSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Study Session Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={blockingTimes.sessionHrs}
                    onChange={(e) => handleInputChange('sessionHrs', null, e.target.value)}
                    className="bg-gray-700 text-white p-2 rounded w-full"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2">Breakfast Time</label>
                  <div className="flex space-x-2">
                    <input
                      type="time"
                      value={blockingTimes.leisureHrs.breakfast.start_time}
                      onChange={(e) => handleInputChange('leisureHrs.breakfast.start_time', null, e.target.value)}
                      className="bg-gray-700 text-white p-2 rounded w-full"
                      required
                    />
                    <span className="self-center">to</span>
                    <input
                      type="time"
                      value={blockingTimes.leisureHrs.breakfast.end_time}
                      onChange={(e) => handleInputChange('leisureHrs.breakfast.end_time', null, e.target.value)}
                      className="bg-gray-700 text-white p-2 rounded w-full"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2">Lunch Time</label>
                  <div className="flex space-x-2">
                    <input
                      type="time"
                      value={blockingTimes.leisureHrs.lunch.start_time}
                      onChange={(e) => handleInputChange('leisureHrs.lunch.start_time', null, e.target.value)}
                      className="bg-gray-700 text-white p-2 rounded w-full"
                      required
                    />
                    <span className="self-center">to</span>
                    <input
                      type="time"
                      value={blockingTimes.leisureHrs.lunch.end_time}
                      onChange={(e) => handleInputChange('leisureHrs.lunch.end_time', null, e.target.value)}
                      className="bg-gray-700 text-white p-2 rounded w-full"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2">Dinner Time</label>
                  <div className="flex space-x-2">
                    <input
                      type="time"
                      value={blockingTimes.leisureHrs.dinner.start_time}
                      onChange={(e) => handleInputChange('leisureHrs.dinner.start_time', null, e.target.value)}
                      className="bg-gray-700 text-white p-2 rounded w-full"
                      required
                    />
                    <span className="self-center">to</span>
                    <input
                      type="time"
                      value={blockingTimes.leisureHrs.dinner.end_time}
                      onChange={(e) => handleInputChange('leisureHrs.dinner.end_time', null, e.target.value)}
                      className="bg-gray-700 text-white p-2 rounded w-full"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2">Other Leisure Time (Optional)</label>
                  <div className="flex space-x-2">
                    <input
                      type="time"
                      value={blockingTimes.otherLeisure.start_time}
                      onChange={(e) => handleInputChange('otherLeisure', 'start_time', e.target.value)}
                      className="bg-gray-700 text-white p-2 rounded w-full"
                    />
                    <span className="self-center">to</span>
                    <input
                      type="time"
                      value={blockingTimes.otherLeisure.end_time}
                      onChange={(e) => handleInputChange('otherLeisure', 'end_time', e.target.value)}
                      className="bg-gray-700 text-white p-2 rounded w-full"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  disabled={syncingProgress}
                >
                  {syncingProgress ? 'Syncing...' : hasExistingStudyTime ? 'Update Schedule' : 'Save & Continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Main Dashboard */}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">LearnPath Dashboard</h1>
          <div className="flex space-x-3">
            <button 
              onClick={handleViewStudySchedule}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              View Study Schedule
            </button>
            <button 
              onClick={() => setShowBlockingTimeModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Edit Schedule
            </button>
          </div>
        </header>
        
        {/* Error/No Progress Message */}
        {error && (
          <div className="bg-yellow-900 border border-yellow-700 text-yellow-200 px-6 py-4 rounded-lg mb-8">
            <div className="flex items-center">
              <i className="fas fa-exclamation-triangle text-xl mr-3"></i>
              <div>
                <h3 className="font-bold">No Study Progress Found</h3>
                <p>{error}</p>
              </div>
            </div>
            <button 
              onClick={handleCreatePlan}
              className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded"
            >
              Create Your First Study Plan
            </button>
          </div>
        )}
        
        {/* Current Schedule Display */}
        {blockingTimes && (
          <div className="bg-gray-800 rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Current Schedule</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400">Study Hours: <span className="text-white">{blockingTimes.sessionHrs} hours</span></p>
                <p className="text-gray-400">Breakfast: <span className="text-white">{blockingTimes.leisureHrs.breakfast.start_time} - {blockingTimes.leisureHrs.breakfast.end_time}</span></p>
                <p className="text-gray-400">Lunch: <span className="text-white">{blockingTimes.leisureHrs.lunch.start_time} - {blockingTimes.leisureHrs.lunch.end_time}</span></p>
              </div>
              <div>
                <p className="text-gray-400">Dinner: <span className="text-white">{blockingTimes.leisureHrs.dinner.start_time} - {blockingTimes.leisureHrs.dinner.end_time}</span></p>
                <p className="text-gray-400">Other Leisure: <span className="text-white">{blockingTimes.otherLeisure.start_time} - {blockingTimes.otherLeisure.end_time}</span></p>
              </div>
            </div>
          </div>
        )}
        
        {/* Only show metrics and charts if we have progress data */}
        {progressData && progressData.progress && (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Completion Rate Card */}
              <div className="bg-gray-800 rounded-xl shadow-md p-6 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-blue-900 flex items-center justify-center mb-4">
                  <i className="fas fa-tasks text-blue-400 text-xl"></i>
                </div>
                <h2 className="text-2xl font-bold text-white">{metrics.completionRate}%</h2>
                <p className="text-gray-400">Completion Rate</p>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-4">
                  <div 
                    className="bg-blue-500 h-2.5 rounded-full" 
                    style={{ width: `${metrics.completionRate}%` }}
                  ></div>
                </div>
              </div>

              {/* Daily Streak Card */}
              <div className="bg-gray-800 rounded-xl shadow-md p-6 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-orange-900 flex items-center justify-center mb-4">
                  <i className="fas fa-fire text-orange-400 text-xl"></i>
                </div>
                <h2 className="text-2xl font-bold text-white">{metrics.dailyStreak}</h2>
                <p className="text-gray-400">Day Streak</p>
                <p className="text-sm text-gray-500 mt-2">Keep going!</p>
              </div>

              {/* Utilization Rate Card */}
              <div className="bg-gray-800 rounded-xl shadow-md p-6 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-green-900 flex items-center justify-center mb-4">
                  <i className="fas fa-clock text-green-400 text-xl"></i>
                </div>
                <h2 className="text-2xl font-bold text-white">{metrics.utilizationRate}%</h2>
                <p className="text-gray-400">Time Utilization</p>
                <p className="text-sm text-gray-500 mt-2">Study slots used effectively</p>
              </div>

              {/* Next Session Card */}
              <div className="bg-gray-800 rounded-xl shadow-md p-6 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-purple-900 flex items-center justify-center mb-4">
                  <i className="fas fa-calendar-alt text-purple-400 text-xl"></i>
                </div>
                <h2 className="text-2xl font-bold text-white">Tomorrow</h2>
                <p className="text-gray-400">Next Study Session</p>
                <p className="text-sm text-gray-500 mt-2">9:00 - 10:30 AM</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Topic Trends Line Chart */}
              <div className="bg-gray-800 rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-white mb-4">Topic Progress Trend</h2>
                <div className="h-80">
                  {metrics.topicTrends.dates.length > 0 ? (
                    <Line data={topicTrendsData} options={chartOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No data available yet
                    </div>
                  )}
                </div>
              </div>

              {/* Slot Utilization Doughnut Chart */}
              <div className="bg-gray-800 rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-white mb-4">Slot Utilization</h2>
                <div className="h-80 flex items-center justify-center">
                  {metrics.utilizationRate > 0 ? (
                    <Doughnut data={utilizationData} options={doughnutOptions} />
                  ) : (
                    <div className="text-gray-400">No utilization data available</div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
              {progressData.progress.progress && progressData.progress.progress.length > 0 ? (
                <div className="space-y-4">
                  {progressData.progress.progress.slice(0, 3).map((day, index) => (
                    <div key={index} className="flex items-center p-4 border border-gray-700 rounded-lg">
                      <div className="bg-blue-900 p-3 rounded-full mr-4">
                        <i className="fas fa-book-open text-blue-400"></i>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          Study plan for {new Date(day.date).toLocaleDateString()}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {day.slots.length} study sessions scheduled
                        </p>
                        <p className="text-gray-400 text-sm">
                          {day.slots.reduce((acc, slot) => acc + slot.completedTopics.length, 0)} topics completed
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No recent activity found. Start studying to see your progress!</p>
              )}
            </div>

            {/* Upcoming Study Sessions */}
            <div className="bg-gray-800 rounded-xl shadow-md p-6 mt-8">
              <h2 className="text-xl font-bold text-white mb-4">Upcoming Study Sessions</h2>
              {progressData.progress.progress && progressData.progress.progress.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {progressData.progress.progress.slice(0, 2).map((day, index) => (
                    <div key={index} className="border border-gray-700 rounded-lg p-4">
                      <h3 className="font-semibold text-white mb-2">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </h3>
                      <div className="space-y-2">
                        {day.slots.slice(0, 3).map((slot, slotIndex) => (
                          <div key={slotIndex} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                            <span className="text-white">{slot.time}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              slot.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                            }`}>
                              {slot.status === 'completed' ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                        ))}
                        {day.slots.length > 3 && (
                          <p className="text-gray-400 text-sm mt-2">
                            +{day.slots.length - 3} more sessions
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No upcoming study sessions. Create a study plan to get started!</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;