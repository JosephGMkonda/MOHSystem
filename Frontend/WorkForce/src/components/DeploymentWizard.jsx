import React, { useState, useEffect } from "react";
import { authAxios } from "../utils/auth"

const DeploymentWizard = ({ isOpen, onClose, onDeploymentSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [district, setDistrict] = useState("");
  const [outbreak, setOutbreak] = useState("");
  const [skill, setSkill] = useState("");
  const [count, setCount] = useState("");
  const [deploymentName, setDeploymentName] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState(30);

  const [results, setResults] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dynamic data from backend
  const [districts, setDistricts] = useState([]);
  const [competencies, setCompetencies] = useState([]);
  const [positions, setPositions] = useState([]);

  const outbreaks = ["Cholera", "Malaria", "Ebola", "COVID-19", "Measles", "Polio"];

  // Fetch initial data from backend
  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError("");
      
      console.log('🔄 Starting to fetch initial data...');
      
      // Test the token first with a simple request
      try {
        const testResponse = await authAxios.get("districts/");
        console.log('✅ Districts API test successful:', testResponse.status);
      } catch (testError) {
        console.error('❌ Districts API test failed:', testError);
        throw testError;
      }

      // Fetch all data in parallel
      const [districtsRes, competenciesRes, workersRes] = await Promise.all([
        authAxios.get("districts/").catch(err => {
          console.error('❌ Failed to fetch districts:', err);
          throw new Error(`Districts: ${err.response?.data?.detail || err.message}`);
        }),
        authAxios.get("competencies/").catch(err => {
          console.error('❌ Failed to fetch competencies:', err);
          throw new Error(`Competencies: ${err.response?.data?.detail || err.message}`);
        }),
        authAxios.get("hcws/").catch(err => {
          console.error('❌ Failed to fetch healthcare workers:', err);
          throw new Error(`Healthcare Workers: ${err.response?.data?.detail || err.message}`);
        })
      ]);

      console.log('✅ All data fetched successfully');
      
      setDistricts(districtsRes.data);
      setCompetencies(competenciesRes.data);

      // Extract unique positions from healthcare workers
      const uniquePositions = [...new Set(workersRes.data.map(w => w.position).filter(Boolean))];
      setPositions(uniquePositions);

      console.log('📊 Data loaded:', {
        districts: districtsRes.data.length,
        competencies: competenciesRes.data.length,
        positions: uniquePositions.length
      });

    } catch (err) {
      console.error("❌ Failed to fetch initial data:", err);
      
      // More specific error handling
      if (err.response?.status === 401) {
        setError("Authentication failed. Please log in again.");
      } else if (err.response?.status === 400) {
        setError("Bad request. Please check your input or contact support.");
      } else if (err.response?.status === 403) {
        setError("You don't have permission to access this data.");
      } else if (err.response?.status === 404) {
        setError("API endpoint not found. Please check the URL.");
      } else if (err.message?.includes('Network Error')) {
        setError("Network error. Please check your connection and ensure the server is running.");
      } else {
        setError(`Failed to load data: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkforce = async () => {
    if (!district || !count) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log('🔄 Fetching workforce candidates...', {
        district_id: district,
        outbreak_type: outbreak,
        number_of_workers: count
      });

      const response = await authAxios.post(
        "deployments/wizard_candidates/",
        {
          district_id: parseInt(district),
          outbreak_type: outbreak,
          number_of_workers: parseInt(count),
          required_positions: skill ? [skill] : [],
          required_competencies: [],
          start_date: startDate || new Date().toISOString().split('T')[0],
          estimated_duration_days: parseInt(duration)
        }
      );

      console.log('✅ Workforce candidates received:', response.data.candidates.length);
      
      setResults(response.data.candidates);
      setCurrentStep(2);
    } catch (err) {
      console.error("❌ Deployment wizard error:", err);
      
      if (err.response?.status === 401) {
        setError("Authentication failed. Please log in again.");
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to fetch workforce data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerSelect = (worker) => {
    setSelectedWorkers(prev => {
      const isSelected = prev.find(w => w.id === worker.id);
      if (isSelected) {
        return prev.filter(w => w.id !== worker.id);
      } else if (prev.length < count) {
        return [...prev, worker];
      }
      return prev;
    });
  };

  const confirmDeployment = async () => {
    if (selectedWorkers.length === 0) {
      setError("Please select at least one worker");
      return;
    }

    setLoading(true);
    try {
      const deploymentData = {
        deployments: selectedWorkers.map(worker => ({
          hcw: worker.id,
          district: parseInt(district),
          outbreak_type: outbreak,
          start_date: startDate || new Date().toISOString().split('T')[0],
          end_date: calculateEndDate(),
          role: worker.position || "Healthcare Worker",
          status: "ongoing",
          notes: `Deployed for ${outbreak} outbreak in ${districts.find(d => d.id === parseInt(district))?.name}. Urgency: ${urgency}`
        }))
      };

      console.log('🔄 Creating deployments...', deploymentData);

      const response = await authAxios.post(
        "deployments/bulk_deploy/",
        deploymentData
      );

      console.log('✅ Deployments created successfully:', response.data);
      
      setSuccess(`Successfully deployed ${selectedWorkers.length} workers!`);
      setCurrentStep(4);
      
      // Notify parent component about successful deployment
      if (onDeploymentSuccess) {
        onDeploymentSuccess();
      }
    } catch (err) {
      console.error("❌ Deployment error:", err);
      
      if (err.response?.status === 401) {
        setError("Authentication failed. Please log in again.");
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to create deployment. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateEndDate = () => {
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + parseInt(duration));
    return end.toISOString().split('T')[0];
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setDistrict("");
    setOutbreak("");
    setSkill("");
    setCount("");
    setDeploymentName("");
    setUrgency("medium");
    setStartDate("");
    setDuration(30);
    setResults([]);
    setSelectedWorkers([]);
    setError("");
    setSuccess("");
  };

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  const getUrgencyColor = (level) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Debug localStorage on open
  useEffect(() => {
    if (isOpen) {
      console.log('🔐 Authentication Debug Info:');
      const tokenKeys = ['token', 'authToken', 'access', 'user'];
      tokenKeys.forEach(key => {
        const value = localStorage.getItem(key);
        console.log(`${key}:`, value ? `${value.substring(0, 20)}...` : 'Not found');
      });
      
      // Check if token is JWT format
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            console.log('✅ Token appears to be valid JWT format');
          } else {
            console.warn('⚠️ Token does not appear to be JWT format');
          }
        } catch (e) {
          console.error('❌ Error analyzing token format:', e);
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">
                🚀 Rapid Deployment Wizard
              </h2>
              <p className="text-blue-100 text-sm">
                Step {currentStep} of 4
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-blue-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          
          {/* Progress Indicators */}
          <div className="flex justify-center space-x-4 mt-4">
            {[1, 2, 3, 4].map(step => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                  step === currentStep
                    ? 'bg-white text-blue-600 border-white'
                    : step < currentStep
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-blue-400 text-white border-blue-400'
                }`}>
                  {step < currentStep ? '✓' : step}
                </div>
                {step < 4 && (
                  <div className={`w-6 h-1 mx-1 rounded-full ${
                    step < currentStep ? 'bg-green-400' : 'bg-blue-400'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <p className="text-green-800 font-medium">{success}</p>
            </div>
          )}

         {loading && currentStep === 1 && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading data...</span>
            </div>
          )}



        {currentStep === 1 && !loading && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Deployment Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">Deployment Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deployment Name *
                    </label>
                    <input
                      type="text"
                      value={deploymentName}
                      onChange={(e) => setDeploymentName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Lilongwe Cholera Response"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Urgency Level *
                    </label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="critical">Critical Emergency</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (days)
                      </label>
                      <input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                        max="365"
                      />
                    </div>
                  </div>
                </div>

                {/* Outbreak Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">Outbreak Details</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Outbreak Type
                    </label>
                    <select
                      value={outbreak}
                      onChange={(e) => setOutbreak(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Outbreak Type</option>
                      {outbreaks.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Affected District *
                    </label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={districts.length === 0}
                    >
                      <option value="">{districts.length === 0 ? "Loading districts..." : "Select District"}</option>
                      {districts.map(dist => (
                        <option key={dist.id} value={dist.id}>{dist.name}</option>
                      ))}
                    </select>
                    {districts.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">Loading districts...</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Required Position
                    </label>
                    <select
                      value={skill}
                      onChange={(e) => setSkill(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={positions.length === 0}
                    >
                      <option value="">{positions.length === 0 ? "Loading positions..." : "Any Position"}</option>
                      {positions.map(position => (
                        <option key={position} value={position}>{position}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Workers Needed *
                    </label>
                    <input
                      type="number"
                      value={count}
                      onChange={(e) => setCount(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 10"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={fetchWorkforce}
                  disabled={loading || !district || !count || districts.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      <span>Find Workers</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          {/* Step 2: Worker Selection */}
               {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">
                  Select Healthcare Workers ({results.length} found)
                </h3>
                <div className="text-sm text-gray-600">
                  Selected: {selectedWorkers.length}/{count} workers
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {results.map((worker) => (
                  <div
                    key={worker.id}
                    onClick={() => handleWorkerSelect(worker)}
                    className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                      selectedWorkers.find(w => w.id === worker.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{worker.full_name}</h4>
                        <p className="text-sm text-gray-600">{worker.position}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                        selectedWorkers.find(w => w.id === worker.id)
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-gray-300'
                      }`}>
                        {selectedWorkers.find(w => w.id === worker.id) && '✓'}
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>📍 {worker.facility_name}</p>
                      <p>📞 {worker.phone}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Match Score:</span>
                        <span className={`text-xs font-bold ${getMatchScoreColor(worker.match_score)}`}>
                          {worker.match_score}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {results.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  No healthcare workers found matching your criteria.
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={selectedWorkers.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-800 border-b pb-2">
                Confirm Deployment
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Deployment Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Deployment Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{deploymentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">District:</span>
                      <span className="font-medium">{districts.find(d => d.id === parseInt(district))?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Outbreak:</span>
                      <span className="font-medium">{outbreak}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Urgency:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getUrgencyColor(urgency)}`}>
                        {urgency.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Selected Workers */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    Selected Workers ({selectedWorkers.length})
                  </h4>
                  <div className="space-y-2 text-sm max-h-32 overflow-y-auto">
                    {selectedWorkers.map((worker) => (
                      <div key={worker.id} className="flex justify-between items-center py-1 border-b border-green-100 last:border-b-0">
                        <div>
                          <p className="font-medium">{worker.full_name}</p>
                          <p className="text-gray-600">{worker.position}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  ← Back
                </button>
                <button
                  onClick={confirmDeployment}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Deploying...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Confirm Deployment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {currentStep === 4 && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Deployment Successful!
              </h3>
              <p className="text-gray-600 mb-6">
                Your team of {selectedWorkers.length} healthcare workers has been deployed.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Close
                </button>
                <button
                  onClick={resetWizard}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  New Deployment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeploymentWizard;