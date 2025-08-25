import React, { useState, useEffect } from 'react';

const StudySchedule = () => {
  const [subjects, setSubjects] = useState([]);
  const [modelPapers, setModelPapers] = useState({});
  const [studyPlan, setStudyPlan] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newSubject, setNewSubject] = useState({
    subjectName: '',
    syllabusText: '',
    startDate: '',
    endDate: '',
    image: null
  });
  const [selectedSubject, setSelectedSubject] = useState('');
  const [pdfFile, setPdfFile] = useState(null);

  const API_URL = 'http://localhost:5000';

  // Fetch subjects from API
  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/subject`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }
      
      const data = await response.json();
      setSubjects(data);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to load subjects');
    }
  };

  // Handle subject upload without image
  const handleSubjectUploadWithoutImage = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/subject/uploadWithoutImage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subjectName: newSubject.subjectName,
          syllabusText: newSubject.syllabusText,
          startDate: newSubject.startDate,
          endDate: newSubject.endDate
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload subject');
      }
      
      setSuccess('Subject uploaded successfully!');
      setNewSubject({ subjectName: '', syllabusText: '', startDate: '', endDate: '', image: null });
      fetchSubjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle subject upload with image
  const handleSubjectUploadWithImage = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', newSubject.image);
      formData.append('subjectName', newSubject.subjectName);
      formData.append('startDate', newSubject.startDate);
      formData.append('endDate', newSubject.endDate);

      const response = await fetch(`${API_URL}/subject/uploadWithImage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload subject');
      }
      
      setSuccess('Subject uploaded successfully with image processing!');
      setNewSubject({ subjectName: '', syllabusText: '', startDate: '', endDate: '', image: null });
      fetchSubjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle model question paper upload
  const handleModelPaperUpload = async (e) => {
    e.preventDefault();
    if (!selectedSubject) {
      setError('Please select a subject first');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('subjectId', selectedSubject);

      const response = await fetch(`${API_URL}/modelQ/postModelQ`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload model question paper');
      }
      
      setSuccess('Model question paper uploaded successfully!');
      setModelPapers(prev => ({
        ...prev,
        [selectedSubject]: data
      }));
      setPdfFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle generate plan
  const handleGeneratePlan = async () => {
    if (subjects.length === 0) {
      setError('Please add at least one subject first');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      // Prepare syllabus data
      const syllabus = subjects.map(subject => ({
        subjectName: subject.subjectName,
        topics: subject.extractedTopics || subject.syllabusText.split(','),
        startDate: subject.startDate,
        endDate: subject.endDate
      }));

      // Prepare model question data (if available)
      const modelq = Object.entries(modelPapers).map(([subjectId, paper]) => ({
        subjectId,
        questions: paper.extractedQuestions || []
      }));

      // Generate plan
      const response = await fetch(`${API_URL}/plans/updateplans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          syllabus,
          modelq,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          presentPlan: studyPlan
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate study plan');
      }
      
      setStudyPlan(data.plan);
      setSuccess('Study plan generated successfully!');

      // Initialize progress for the new plan
      if (data.plan._id) {
        await fetch(`${API_URL}/plans/progresspost`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            planId: data.plan._id
          })
        });
        
        // Fetch progress
        const progressResponse = await fetch(`${API_URL}/plans/getprogress/${data.plan._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const progressData = await progressResponse.json();
        setProgress(progressData.progress);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchSubjects();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Study Schedule</h1>
        
        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">
            {error}
            <button onClick={() => setError(null)} className="float-right">×</button>
          </div>
        )}
        
        {success && (
          <div className="bg-green-500 text-white p-3 rounded mb-4">
            {success}
            <button onClick={() => setSuccess(null)} className="float-right">×</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Study Schedule (2/3 width) */}
          <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Study Plan</h2>
            
            {studyPlan ? (
              <div className="space-y-4">
                {Object.entries(studyPlan.plan).map(([date, dayPlans]) => (
                  <div key={date} className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-xl font-semibold mb-3">
                      {new Date(date).toLocaleDateString()}
                    </h3>
                    
                    {dayPlans.map((dayPlan, index) => (
                      <div key={index} className="space-y-3">
                        {dayPlan.slots.map((slot, slotIndex) => {
                          const progressData = progress?.progress?.find(d => d.date === date);
                          const slotProgress = progressData?.slots?.find(s => s.time === slot.time);
                          
                          return (
                            <div key={slotIndex} className="bg-gray-600 rounded p-3">
                              <h4 className="font-semibold mb-2">{slot.time}</h4>
                              <div className="space-y-2">
                                {slot.topics.map((topic, topicIndex) => {
                                  const isCompleted = slotProgress?.completedTopics?.includes(topic);
                                  
                                  return (
                                    <div key={topicIndex} className="flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={isCompleted}
                                        onChange={(e) => handleProgressUpdate(
                                          date, 
                                          slot.time, 
                                          topic, 
                                          e.target.checked
                                        )}
                                        className="mr-2 h-5 w-5 text-blue-600"
                                      />
                                      <span className={isCompleted ? 'line-through text-gray-400' : ''}>
                                        {topic}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                              
                              {slot.mostAskedQuestions && slot.mostAskedQuestions.length > 0 && (
                                <div className="mt-3 p-2 bg-gray-500 rounded">
                                  <h5 className="font-semibold mb-1">Important Questions:</h5>
                                  <ul className="list-disc list-inside text-sm">
                                    {slot.mostAskedQuestions.slice(0, 3).map((q, i) => (
                                      <li key={i}>{q}</li>
                                    ))}
                                    {slot.mostAskedQuestions.length > 3 && (
                                      <li>...and {slot.mostAskedQuestions.length - 3} more</li>
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No study plan generated yet.</p>
                <button
                  onClick={handleGeneratePlan}
                  disabled={loading || subjects.length === 0}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate Plan'}
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Subject Upload (1/3 width) */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Upload Subjects</h2>
            
            {/* Subject Upload Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Subject Name</label>
                <input
                  type="text"
                  value={newSubject.subjectName}
                  onChange={(e) => setNewSubject({...newSubject, subjectName: e.target.value})}
                  className="w-full bg-gray-700 text-white p-2 rounded"
                  placeholder="Enter subject name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={newSubject.startDate}
                    onChange={(e) => setNewSubject({...newSubject, startDate: e.target.value})}
                    className="w-full bg-gray-700 text-white p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">End Date</label>
                  <input
                    type="date"
                    value={newSubject.endDate}
                    onChange={(e) => setNewSubject({...newSubject, endDate: e.target.value})}
                    className="w-full bg-gray-700 text-white p-2 rounded"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Syllabus (comma-separated)</label>
                <textarea
                  value={newSubject.syllabusText}
                  onChange={(e) => setNewSubject({...newSubject, syllabusText: e.target.value})}
                  className="w-full bg-gray-700 text-white p-2 rounded"
                  rows="3"
                  placeholder="Topic 1, Topic 2, Topic 3"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Or Upload Syllabus Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewSubject({...newSubject, image: e.target.files[0]})}
                  className="w-full bg-gray-700 text-white p-2 rounded"
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleSubjectUploadWithoutImage}
                  disabled={loading || !newSubject.subjectName || !newSubject.startDate || !newSubject.endDate || (!newSubject.syllabusText && !newSubject.image)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  Upload Text
                </button>
                
                <button
                  onClick={handleSubjectUploadWithImage}
                  disabled={loading || !newSubject.subjectName || !newSubject.startDate || !newSubject.endDate || !newSubject.image}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  Upload Image
                </button>
              </div>
            </div>

            <hr className="my-6 border-gray-700" />

            {/* Model Question Paper Upload */}
            <h3 className="text-xl font-bold mb-4">Upload Model Question Paper</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Select Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-gray-700 text-white p-2 rounded"
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.subjectName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Upload PDF (Model Questions)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files[0])}
                  className="w-full bg-gray-700 text-white p-2 rounded"
                />
                <p className="text-sm text-gray-400 mt-1">
                  Upload a single PDF containing all model questions
                </p>
              </div>
              
              <button
                onClick={handleModelPaperUpload}
                disabled={loading || !selectedSubject || !pdfFile}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                Upload Model Questions
              </button>
            </div>

            <hr className="my-6 border-gray-700" />

            {/* Generate Plan Button */}
            <button
              onClick={handleGeneratePlan}
              disabled={loading || subjects.length === 0}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Generating Plan...' : 'Generate Study Plan'}
            </button>

            {/* Subjects List */}
            {subjects.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold mb-2">Your Subjects</h3>
                <div className="space-y-2">
                  {subjects.map((subject) => (
                    <div key={subject._id} className="bg-gray-700 p-2 rounded">
                      <p className="font-semibold">{subject.subjectName}</p>
                      <p className="text-sm text-gray-400">
                        {subject.extractedTopics?.length || subject.syllabusText.split(',').length} topics
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(subject.startDate).toLocaleDateString()} - {new Date(subject.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudySchedule;