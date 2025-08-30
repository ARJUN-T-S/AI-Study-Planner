import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const StudySchedule = () => {
  const [progressData, setProgressData] = useState(null);
  const [planData, setPlanData] = useState(null);
  const [studyTimeData, setStudyTimeData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [modelPapers, setModelPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showModelPaperForm, setShowModelPaperForm] = useState(false);
  const [newSubject, setNewSubject] = useState({
    subjectName: '',
    startDate: '',
    endDate: '',
    syllabusText: '',
    image: null
  });
  const [modelPaper, setModelPaper] = useState({
    subjectId: '',
    pdfFile: null
  });
  const [deletingItems, setDeletingItems] = useState({});
  
  // Get idToken from Redux store
  const idToken = useSelector(state => state.auth.idToken);

  // Fetch all data from APIs
  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch study time data
      try {
        const studyTimeResponse = await axios.get('http://localhost:5000/users/getStudyTime', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
        setStudyTimeData(studyTimeResponse.data);
      } catch (err) {
        console.error('Error fetching study time:', err);
      }
      
      // Fetch subjects data
      try {
        const subjectsResponse = await axios.get('http://localhost:5000/subject/', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
        setSubjects(subjectsResponse.data);
      } catch (err) {
        console.error('Error fetching subjects:', err);
      }
      
      // Fetch model papers data
      try {
        const modelPapersResponse = await axios.get('http://localhost:5000/modelQ/', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
        setModelPapers(modelPapersResponse.data);
      } catch (err) {
        console.error('Error fetching model papers:', err);
      }
      
      // Fetch progress data
      try {
        const progressResponse = await axios.get('http://localhost:5000/plans/getprogress', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
        
        setProgressData(progressResponse.data.progress);
        
        if (progressResponse.data.progress && progressResponse.data.progress.progress.length > 0) {
          setSelectedDate(progressResponse.data.progress.progress[0].date);
        }
      } catch (err) {
        console.error('Error fetching progress:', err);
        setProgressData(null);
      }
      
      // Fetch plan data with model questions
      try {
        const planResponse = await axios.get('http://localhost:5000/plans/getplan', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
        
        setPlanData(planResponse.data);
      } catch (err) {
        console.error('Error fetching plan:', err);
        setPlanData(null);
      }
      
      setLoading(false);
      
    } catch (err) {
      setError('Failed to fetch data. Please check your authentication.');
      setLoading(false);
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    if (idToken) {
      fetchAllData();
    } else {
      setError('Authentication required. Please log in again.');
      setLoading(false);
    }
  }, [idToken]);

  // Handle topic completion toggle
  const handleTopicToggle = async (date, time, topic, isCurrentlyCompleted) => {
    try {
      // If topic is currently completed, we're unchecking it
      // If topic is not completed, we're checking it
      const completedTopics = isCurrentlyCompleted 
        ? [] // If unchecking, send empty array
        : [topic]; // If checking, send the topic to be marked as completed

      const payload = {
        planId: progressData.planId,
        date,
        time,
        completedTopics
      };

      const response = await axios.put(
        'http://localhost:5000/plans/putprogress', 
        payload,
        {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        }
      );
      
      // Update local state with the response
      setProgressData(prev => {
        const updated = JSON.parse(JSON.stringify(prev));
        const day = updated.progress.find(d => d.date === date);
        const slot = day.slots.find(s => s.time === time);
        
        if (isCurrentlyCompleted) {
          // Move from completed to pending (unchecking)
          slot.completedTopics = slot.completedTopics.filter(t => t !== topic);
          slot.pendingTopics.push(topic);
        } else {
          // Move from pending to completed (checking)
          slot.pendingTopics = slot.pendingTopics.filter(t => t !== topic);
          slot.completedTopics.push(topic);
        }
        
        // Update status
        if (slot.pendingTopics.length === 0) {
          slot.status = "completed";
        } else if (slot.completedTopics.length > 0) {
          slot.status = "in-progress";
        } else {
          slot.status = "pending";
        }
        
        return updated;
      });
      
      setSuccessMessage('Progress updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to update progress. Please try again.');
      console.error('Error updating progress:', err);
    }
  };

  // Handle subject form input change
  const handleSubjectInputChange = (e) => {
    const { name, value } = e.target;
    setNewSubject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image upload
  const handleImageChange = (e) => {
    setNewSubject(prev => ({
      ...prev,
      image: e.target.files[0]
    }));
  };

  // Handle model paper form input change
  const handleModelPaperInputChange = (e) => {
    const { name, value } = e.target;
    setModelPaper(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle PDF file upload for model paper
  const handlePdfChange = (e) => {
    setModelPaper(prev => ({
      ...prev,
      pdfFile: e.target.files[0]
    }));
  };

  // Extract topics from syllabus text
  const extractTopicsFromSyllabus = (syllabusText) => {
    return syllabusText.split(',')
      .map(topic => topic.trim())
      .filter(topic => topic.length > 0);
  };

  // Handle subject form submission - CORRECTED VERSION
  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      
      if (newSubject.image) {
        // Upload with image
        const formData = new FormData();
        formData.append('subjectName', newSubject.subjectName);
        formData.append('startDate', newSubject.startDate);
        formData.append('endDate', newSubject.endDate);
        formData.append('syllabusText', newSubject.syllabusText);
        formData.append('image', newSubject.image);
        
        response = await axios.post('http://localhost:5000/subject/uploadWithImage', formData, {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Upload without image - use the correct body format
        response = await axios.post('http://localhost:5000/subject/uploadWithoutImage', {
          subjectName: newSubject.subjectName,
          startDate: newSubject.startDate,
          endDate: newSubject.endDate,
          syllabusText: newSubject.syllabusText
        }, {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
      }
      
      // After subject is successfully added, create/update plan and progress
      if (subjects.length === 0) {
        // No subjects existed before, create new plan and progress
        
        // First create the plan
        try {
          const planPayload = {
            sessionHours: studyTimeData.sessionHrs,
            leisureTimes: {
              breakfast: studyTimeData.breakfast,
              lunch: studyTimeData.lunch,
              dinner: studyTimeData.dinner,
              otherLeisure: studyTimeData.otherLeisure
            },
            syllabus: extractTopicsFromSyllabus(newSubject.syllabusText),
            startDate: newSubject.startDate,
            endDate: newSubject.endDate
          };
          
          const planResponse = await axios.post('http://localhost:5000/plans/postPlans', planPayload, {
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          });
          
        } catch (err) {
          console.error('Error creating plan:', err);
        }
      } else {
        // Subjects existed, update plan and progress
        
        // Update plan
        try {
          const planPayload = {
            sessionHours: studyTimeData.sessionHrs,
            leisureTimes: {
              breakfast: studyTimeData.breakfast,
              lunch: studyTimeData.lunch,
              dinner: studyTimeData.dinner,
              otherLeisure: studyTimeData.otherLeisure
            },
            syllabus: extractTopicsFromSyllabus(newSubject.syllabusText),
            startDate: newSubject.startDate,
            endDate: newSubject.endDate
          };
          
          await axios.post('http://localhost:5000/plans/updateplan', planPayload, {
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          });
        } catch (err) {
          console.error('Error updating plan:', err);
        }
        
        // Update progress - no payload needed, just the authorization header
        try {
          await axios.post('http://localhost:5000/plans/updateprogress', 
            {}, // Empty payload
            {
              headers: {
                'Authorization': `Bearer ${idToken}`
              }
            }
          );
        } catch (err) {
          console.error('Error updating progress:', err);
        }
      }
      
      setSuccessMessage('Subject added successfully!');
      setShowSubjectForm(false);
      setNewSubject({
        subjectName: '',
        startDate: '',
        endDate: '',
        syllabusText: '',
        image: null
      });
      
      // Refresh all data after a short delay to allow backend processing
      setTimeout(() => {
        fetchAllData();
      }, 1000);
      
    } catch (err) {
      setError('Failed to add subject. Please try again.');
      console.error('Error adding subject:', err);
    }
  };

  // Handle subject deletion
  const handleDeleteSubject = async (subject) => {
    try {
      setDeletingItems(prev => ({ ...prev, [`subject-${subject._id}`]: true }));
      
      // First delete the subject
      await axios.delete(`http://localhost:5000/subject/${subject._id}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      // Then update plans with the deleted subject details
      const updatePlanPayload = {
        deletedSub: {
          subjectName: subject.subjectName,
          startDate: subject.startDate,
          endDate: subject.endDate
        }
      };
      
      await axios.post('http://localhost:5000/plans/updateplans', updatePlanPayload, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Finally update progress
      try {
        await axios.post('http://localhost:5000/plans/updateprogress', {}, {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
      } catch (progressErr) {
        console.log('Progress update failed, trying with parameters');
        // If empty payload fails, try with specific parameters
        const updateProgressPayload = {
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('en-US', { hour12: false })
        };
        
        await axios.post('http://localhost:5000/plans/updateprogress', updateProgressPayload, {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      setSuccessMessage('Subject deleted successfully and plan updated!');
      setDeletingItems(prev => ({ ...prev, [`subject-${subject._id}`]: false }));
      
      // Refresh data
      setTimeout(() => {
        fetchAllData();
      }, 1000);
      
    } catch (err) {
      setError('Failed to delete subject. Please try again.');
      console.error('Error deleting subject:', err);
      console.error('Error details:', err.response?.data);
      setDeletingItems(prev => ({ ...prev, [`subject-${subject._id}`]: false }));
    }
  };

  // Handle model paper deletion
  const handleDeleteModelPaper = async (modelPaperId) => {
    try {
      setDeletingItems(prev => ({ ...prev, [`modelpaper-${modelPaperId}`]: true }));
      
      await axios.delete(`http://localhost:5000/modelQ/${modelPaperId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      setSuccessMessage('Model paper deleted successfully!');
      setDeletingItems(prev => ({ ...prev, [`modelpaper-${modelPaperId}`]: false }));
      
      // Refresh data
      setTimeout(() => {
        fetchAllData();
      }, 1000);
      
    } catch (err) {
      setError('Failed to delete model paper. Please try again.');
      console.error('Error deleting model paper:', err);
      setDeletingItems(prev => ({ ...prev, [`modelpaper-${modelPaperId}`]: false }));
    }
  };

  // Handle model paper form submission
  const handleModelPaperSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!modelPaper.subjectId || !modelPaper.pdfFile) {
        setError('Please select a subject and upload a PDF file');
        return;
      }

      const formData = new FormData();
      formData.append('subjectId', modelPaper.subjectId);
      formData.append('pdf', modelPaper.pdfFile);

      // Upload model paper PDF
      const modelQResponse = await axios.post('http://localhost:5000/modelQ/postModelQ', formData, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (modelQResponse.data && modelQResponse.data.data && modelQResponse.data.data.extractedQuestions) {
        // Update plans with extracted questions
        const updatePlanPayload = {
          modelq: modelQResponse.data.data.extractedQuestions
        };

        await axios.post('http://localhost:5000/plans/updateplans', updatePlanPayload, {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        });

        // Update progress - try with empty payload first, then with specific parameters if needed
        try {
          // First try with empty payload
          await axios.post('http://localhost:5000/plans/updateprogress', {}, {
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          });
        } catch (progressErr) {
          console.log('Empty payload failed, trying with specific parameters');
          
          // If empty payload fails, try with specific parameters
          const updateProgressPayload = {
            date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          };
          
          await axios.post('http://localhost:5000/plans/updateprogress', updateProgressPayload, {
            headers: {
              'Authorization': `Bearer ${idToken}`,
              'Content-Type': 'application/json'
            }
          });
        }

        setSuccessMessage('Model paper processed successfully and plan updated!');
        setShowModelPaperForm(false);
        setModelPaper({
          subjectId: '',
          pdfFile: null
        });

        // Refresh data
        setTimeout(() => {
          fetchAllData();
        }, 1000);
      }
    } catch (err) {
      setError('Failed to process model paper. Please try again.');
      console.error('Error processing model paper:', err);
      console.error('Error details:', err.response?.data);
    }
  };

  // Get model questions for a specific slot from plan data
  const getModelQuestions = (date, time) => {
    if (!planData || !planData.plan || !planData.plan.plan) {
      console.log('Plan data not available');
      return [];
    }
    
    const dayPlan = planData.plan.plan[date];
    if (!dayPlan || dayPlan.length === 0) {
      console.log('No day plan for date:', date);
      return [];
    }
    
    const slotPlan = dayPlan[0].slots.find(slot => slot.time === time);
    if (!slotPlan) {
      console.log('No slot plan for time:', time);
      return [];
    }
    
    console.log('Found model questions:', slotPlan.mostAskedQuestions);
    return slotPlan.mostAskedQuestions || [];
  };

  // Get all topics for a specific slot from plan data
  const getSlotTopics = (date, time) => {
    if (!planData || !planData.plan || !planData.plan.plan) {
      console.log('Plan data not available for topics');
      return [];
    }
    
    const dayPlan = planData.plan.plan[date];
    if (!dayPlan || dayPlan.length === 0) {
      console.log('No day plan for date:', date);
      return [];
    }
    
    const slotPlan = dayPlan[0].slots.find(slot => slot.time === time);
    if (!slotPlan) {
      console.log('No slot plan for time:', time);
      return [];
    }
    
    return slotPlan.topics || [];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded max-w-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      {/* Header */}
      <header className="bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-3xl font-bold text-white">Study Schedule Tracker</h1>
        <p className="text-gray-400 mt-2">Track your learning progress and stay organized</p>
        
        {successMessage && (
          <div className="mt-4 bg-green-900 border border-green-700 text-green-100 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content - 3/4 width on large screens */}
        <div className="w-full lg:w-3/4">
          {progressData && progressData.progress && progressData.progress.length > 0 ? (
            <>
              {/* Date Selector */}
              <div className="bg-gray-800 rounded-lg shadow-sm p-4 mb-6 overflow-x-auto">
                <div className="flex space-x-2">
                  {progressData.progress.map(day => (
                    <button
                      key={day.date}
                      onClick={() => setSelectedDate(day.date)}
                      className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                        selectedDate === day.date
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {new Date(day.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule for selected day */}
              {selectedDate && (
                <div className="bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Schedule for {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h2>
                  
                  <div className="space-y-6">
                    {progressData.progress
                      .find(day => day.date === selectedDate)
                      .slots.map((slot, index) => {
                        const modelQuestions = getModelQuestions(selectedDate, slot.time);
                        const slotTopics = getSlotTopics(selectedDate, slot.time);
                        
                        return (
                          <div key={index} className="border-l-4 border-blue-500 pl-4 py-4 bg-gray-750 rounded-lg p-4 transition-all duration-200 hover:bg-gray-700">
                            <div className="flex justify-between items-center">
                              <h3 className="text-lg font-medium text-white">{slot.time}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                slot.status === 'completed' 
                                  ? 'bg-green-900 text-green-100' 
                                  : slot.status === 'in-progress'
                                  ? 'bg-yellow-900 text-yellow-100'
                                  : 'bg-gray-700 text-gray-300'
                              }`}>
                                {slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
                              </span>
                            </div>
                            
                            {/* All Topics for this slot */}
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-300 mb-2">Topics:</h4>
                              <div className="flex flex-wrap gap-2 mb-4">
                                {slotTopics.map((topic, topicIndex) => {
                                  const isCompleted = slot.completedTopics.includes(topic);
                                  const isPending = slot.pendingTopics.includes(topic);
                                  
                                  return (
                                    <span
                                      key={topicIndex}
                                      className={`px-3 py-1 rounded-full text-xs transition-all duration-200 ${
                                        isCompleted
                                          ? 'bg-green-900 text-green-100'
                                          : isPending
                                          ? 'bg-blue-900 text-blue-100'
                                          : 'bg-gray-700 text-gray-300'
                                      }`}
                                    >
                                      {topic}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                            
                            {/* Pending Topics with checkboxes */}
                            {slot.pendingTopics.length > 0 && (
                              <div className="mt-4">
                                <h4 className="text-sm font-medium text-gray-300 mb-2">Mark as Complete:</h4>
                                <div className="space-y-3">
                                  {slot.pendingTopics.map((topic, topicIndex) => (
                                    <div key={topicIndex} className="flex items-center bg-gray-700 p-3 rounded-lg transition-all duration-200 hover:bg-gray-600">
                                      <label className="flex items-center cursor-pointer w-full">
                                        <input
                                          type="checkbox"
                                          className="hidden"
                                          onChange={() => handleTopicToggle(selectedDate, slot.time, topic, false)}
                                        />
                                        <div className="w-5 h-5 border border-gray-400 rounded mr-3 flex items-center justify-center transition-all duration-200">
                                          <svg className="w-4 h-4 text-blue-400 opacity-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M极客时间 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 极客时间 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                        </div>
                                        <span className="text-gray-100">{topic}</span>
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Completed Topics */}
                            {slot.completedTopics.length > 0 && (
                              <div className="mt-4">
                                <h4 className="text-sm font-medium text-gray-300 mb-2">Completed:</h4>
                                <div className="space-y-3">
                                  {slot.completedTopics.map((topic, topicIndex) => (
                                    <div key={topicIndex} className="flex items-center bg-gray-极客时间 p-3 rounded-lg transition-all duration-200 hover:bg-gray-600">
                                      <label className="flex items-center cursor-pointer w-full">
                                        <input
                                          type="checkbox"
                                          checked
                                          className="hidden"
                                          onChange={() => handleTopicToggle(selectedDate, slot.time, topic, true)}
                                        />
                                        <div className="w-5 h-5 border border-blue-500 bg-blue-500 rounded mr-3 flex items-center justify-center transition-all duration-200">
                                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 极客时间l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                        </div>
                                        <极客时间 className="text-gray-400 line-through">{topic}</span>
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Model Questions for this time slot */}
                            {modelQuestions.length > 0 && (
                              <div className="mt-4">
                                <h4 className="text-sm font-medium text-gray-300 mb极客时间">Most Asked Questions:</h4>
                                <div className="bg-gray-700 p-4 rounded-lg">
                                  <ul className="text-sm text-gray-300 space-y-2">
                                    {modelQuestions.map((question, qIndex) => (
                                      <li key={qIndex} className="flex items-start">
                                        <span className="mr-2 text-blue-400">•</span>
                                        <span>{question}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-800 rounded-lg shadow-sm p-6 text-center">
              <h2 className="text-xl font-semibold text-white mb-4">
                {subjects.length > 0 ? 'Study Plan is Being Generated' : 'No Study Plan Available'}
              </h2>
              <p className="text-gray-400 mb-4">
                {subjects.length > 0 
                  ? 'Please wait while we generate your study plan...' 
                  : 'Add a subject to create your study plan'
                }
              </p>
              {subjects.length > 0 && (
                <div className="animate-pulse mt-4">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar - Subjects and Study Time */}
        <div className="w-full lg:w-1/4">
          {/* Study Time Information */}
          {studyTimeData && (
            <div className="bg-gray-800 rounded-lg shadow-sm p-6 mb-6 transition-all duration-200 hover:bg-gray-750">
              <h2 className极客时间"text-xl font-semibold text-white mb-4">Study Time</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Study Session:</span>
                  <span className="text-white">{studyTimeData.sessionHrs} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Breakfast:</span>
                  <span className="text-white">{studyTimeData.breakfast}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Lunch:</span>
                  <span className="text-white">{studyTimeData.lunch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Dinner:</span>
                  <span className="text-white">{studyTimeData.dinner}</span>
                </极客时间>
                <div className="flex justify-between">
                  <span className="text-gray-400">Leisure Time:</span>
                  <span className="text-white">{studyTimeData.otherLeisure}</span>
                </div>
              </div>
            </div>
          )}

          {/* Subjects Section */}
          <div className="bg-gray-800 rounded-lg shadow-sm p-6 mb-6 transition-all duration-200 hover:bg-gray-750">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Subjects</h2>
              <button
                onClick={() => setShowSubjectForm(!showSubjectForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-all duration-200"
              >
                {showSubjectForm ? 'Cancel' : 'Add Subject'}
              </button>
            </div>

            {/* Subject Form */}
            {showSubjectForm && (
              <form onSubmit={handleSubjectSubmit} className="mb-4 bg-gray-750 p-4 rounded-lg transition-all duration-200">
                <div className="mb-3">
                  <label className="block text-gray-300 text-sm mb-1">Subject Name</label>
                  <input
                    type="text"
                    name="subjectName"
                    value={newSubject.subjectName}
                    onChange={handleSubjectInputChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-gray-300极客时间text-sm mb-1">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value = {newSubject.startDate}
                    onChange={handleSubjectInputChange}
                    className="w-full bg极客时间gray-700 border border-gray-600 rounded px-3 py-2 text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-gray-300 text-sm mb-1">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={newSubject.endDate}
                    onChange={handleSubjectInputChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-gray-300 text-sm mb-1">Syllabus (comma separated)</label>
                  <textarea
                    name="syllabusText"
                    value={newSubject.syllabusText}
                    onChange={handleSubjectInputChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded px极客时间3 py-2 text-white transition-all duration-200 focus:outline-none focus:ring-2 focus极客时间ring-blue-500"
                    rows="3"
                    placeholder="Enter topics separated by commas"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-gray-300 text-sm mb-1">Image (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full transition-all duration-200"
                >
                  Add Subject
                </button>
              </form>
            )}

            {/* Subjects List */}
            <div className="space-y-3">
              {subjects.length > 0 ? (
                subjects.map(subject => (
                  <div key={subject._id} className="bg-gray-750 p-3 rounded-lg transition-all duration-200 hover:bg-gray-700">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-white mb-1">{subject.subjectName}</h3>
                        <p className="text-sm text-gray-400 mb-2">
                          {new Date(subject.startDate).toLocaleDateString()} - {new Date(subject.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">{subject.syllabusText}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteSubject(subject)}
                        disabled={deletingItems[`subject-${subject._id}`]}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded ml-2 transition-all duration-200 disabled:opacity-50"
                      >
                        {deletingItems[`subject-${subject._id}`] ? (
                          <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-4极客时间h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6极客时间v6m1-10V4a1 1 0 00-1-1极客时间h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center">No subjects added yet</p>
              )}
            </div>
          </div>

          {/* Model Paper Form */}
          <div className="bg-gray-800 rounded-lg shadow-sm p-6 mb-6 transition-all duration-200 hover:bg-gray-750">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Model Papers</h2>
              <button
                onClick={() => setShowModelPaperForm(!showModelPaperForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-all duration-200"
              >
                {showModelPaperForm ? 'Cancel' : 'Upload PDF'}
              </button>
            </div>

            {/* Model Paper Upload Form */}
            {showModelPaperForm && (
              <form onSubmit={handleModelPaperSubmit} className="mb-4 bg-gray-750 p-4 rounded-lg transition-all duration-200">
                <div className="mb-3">
                  <label className="block text-gray-300 text-sm mb-1">Select Subject</label>
                  <select
                    name="subjectId"
                    value={modelPaper.subjectId}
                    onChange={handleModelPaperInputChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a subject</option>
                    {subjects.map(subject => (
                      <option key={subject._id} value={subject._id}>
                        {subject.subjectName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="block text-gray-300 text-sm mb-1">Upload Model Paper (PDF)</极客时间label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-极客时间 text-white px-4 py-2 rounded w-full transition-all duration-200"
                >
                  Process Model Paper
                </button>
              </form>
            )}

            {/* Model Papers List */}
            <div className="space-y-3">
              {modelPapers.length > 0 ? (
                modelPapers.map(paper => (
                  <div key={paper._id} className="bg-gray-750 p-3 rounded-lg transition-all duration-200 hover:bg-gray-700">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-md font-medium text-white mb-1">
                          {subjects.find(s => s._id === paper.subjectId)?.subjectName || 'Unknown Subject'}
                        </h3>
                        <p className="text-xs text-gray-400">
                          Uploaded: {new Date(paper.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteModelPaper(paper._id)}
                        disabled={deletingItems[`modelpaper-${paper._id}`]}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded ml-2 transition-all duration-200 disabled:opacity-50"
                      >
                        {deletingItems[`modelpaper-${paper._id}`] ? (
                          <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 极客时间m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center">
                  Upload model papers to extract important questions and update your study plan.
                </p>
              )}
            </div>
          </div>

          {/* Plan Overview */}
          {planData && planData.plan && (
            <div className="bg-gray-800 rounded-lg shadow-sm p-6 transition-all duration-200 hover:bg-gray-750">
              <h2 className="text-xl font-semibold text-white mb-4">Plan Overview</h2>
              
              <div className="极客时间mb-4">
                <h3 className="text-lg font-medium text-white mb-2">Plan Duration</极客时间>
                <div className="text-sm text-gray-400">
                  <p>Start: {new Date(planData.plan.startDate).toLocaleDateString()}</p>
                  <p>End: {new Date(planData.plan.endDate).极客时间toLocaleDateString()}</p>
                </div>
              </div>
              
              {progressData && (
                <div className="bg-gray-750 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-medium text-white mb-2">Quick Stats</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Days:</span>
                      <span className="text-white">{progressData.progress.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Last Updated:</span>
                      <span className="text-white">{new Date(progressData.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-700">
                <h3 className="text-lg font-medium text-white mb-2">Progress Info</h3>
                <p className="text-sm text-gray-400">Plan ID: {progressData?.planId || 'N/A'}</p>
                <p className="text-sm text-gray-400 mt-1">User ID: {progressData?.userId || 'N/A'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudySchedule;