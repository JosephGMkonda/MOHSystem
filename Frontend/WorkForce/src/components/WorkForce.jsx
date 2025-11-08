import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddHealthWorker from './AddHealthWorker';
import ViewDetail from './ViewDetail';

const WorkForce = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showViewDetail, setShowViewDetail] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  const getAuthConfig = () => {
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('authToken') || 
                  localStorage.getItem('access');
    
    if (!token) {
      console.warn('No authentication token found');
      return {};
    }

    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };
  };

const handleViewDetails = (worker) => {
    console.log('View details:', worker);
    setSelectedWorker(worker);
    setShowViewDetail(true);
  };
 

  const handleCloseViewDetail = () => {
    setShowViewDetail(false);
    setSelectedWorker(null);
  };

  useEffect(() => {
    fetchWorkforceData();
  }, []);

  const fetchWorkforceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const config = getAuthConfig();
      
      if (!config.headers?.Authorization) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

    
      const [hcwsResponse, trainingsResponse, availabilityResponse] = await Promise.all([
        axios.get('http://127.0.0.1:8000/api/hcws/', config),
        axios.get('http://127.0.0.1:8000/api/trainings/', config),
        axios.get('http://127.0.0.1:8000/api/availability/', config)
      ]);

      

      
      const transformedWorkers = transformApiData(
        hcwsResponse.data,
        trainingsResponse.data,
        availabilityResponse.data
      );

      setWorkers(transformedWorkers);
      console.log('Transformed workers:', transformedWorkers);

    } catch (error) {
      console.error('Error fetching workforce data:', error);
      setError(`Failed to load data: ${error.response?.status || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  
  const transformApiData = (hcws, trainings, availability) => {
    return hcws.map(hcw => {
      
      const latestAvailability = availability
        .filter(avail => avail.hcw === hcw.id)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

      
      const workerTrainings = trainings.filter(training => training.hcw === hcw.id);
      const competencies = [...new Set(workerTrainings.map(t => t.competency_name || t.competency))];
      
      const latestTraining = workerTrainings.length > 0 
        ? workerTrainings.sort((a, b) => new Date(b.date_completed) - new Date(a.date_completed))[0].date_completed
        : null;

      return {
        id: hcw.id,
        name: `${hcw.first_name} ${hcw.last_name}`,
        profession: hcw.position || 'Unknown',
        district: hcw.facility?.district?.name || hcw.facility_district || 'Unknown',
        facility: hcw.facility?.name || 'Unknown Facility',
        phone: hcw.phone || 'No phone',
        status: latestAvailability?.status || 'Unknown',
        competencies: competencies,
        lastTraining: latestTraining,
        rawData: hcw 
      };
    });
  };

  const filteredWorkers = workers.filter(worker =>
    worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.profession.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.facility.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'deployed': return 'bg-blue-100 text-blue-800';
      case 'on_leave': 
      case 'on leave': return 'bg-yellow-100 text-yellow-800';
      case 'unavailable': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleRefresh = () => {
    fetchWorkforceData();
  };

  const handleDeleteWorker = async (workerId) => {
    if (!window.confirm('Are you sure you want to delete this healthcare worker?')) {
      return;
    }

    try {
      const config = getAuthConfig();
      await axios.delete(`http://127.0.0.1:8000/api/hcws/${workerId}/`, config);
      
      
      setWorkers(prev => prev.filter(w => w.id !== workerId));
      alert('Healthcare worker deleted successfully!');
    } catch (error) {
      console.error('Error deleting worker:', error);
      alert('Failed to delete healthcare worker.');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading workforce data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchWorkforceData}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Healthcare Workforce</h1>
          <p className="text-gray-600 mt-2">Manage and monitor healthcare workers across Malawi</p>
          <div className="flex items-center space-x-4 mt-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              workers.length > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {workers.length > 0 ? '✅ Live Data' : '⚠️ No Data'}
            </span>
            <button
              onClick={handleRefresh}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-4 lg:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          <span>+</span>
          <span>Add Healthcare Worker</span>
        </button>
      </div>

    
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Workers</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{workers.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <span className="text-blue-600 text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {workers.filter(w => w.status?.toLowerCase() === 'available').length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <span className="text-green-600 text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Deployed</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {workers.filter(w => w.status?.toLowerCase() === 'deployed').length}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <span className="text-blue-600 text-2xl">🚑</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">On Leave</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {workers.filter(w => w.status?.toLowerCase() === 'on_leave' || w.status?.toLowerCase() === 'on leave').length}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <span className="text-yellow-600 text-2xl">🏖️</span>
            </div>
          </div>
        </div>
      </div>

      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name, profession, district..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <select className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200">
              <option>All Districts</option>
              <option>Lilongwe</option>
              <option>Blantyre</option>
              <option>Mzuzu</option>
              <option>Zomba</option>
            </select>
            <select className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200">
              <option>All Professions</option>
              <option>Nurse</option>
              <option>Clinical Officer</option>
              <option>Medical Doctor</option>
              <option>Community Health Worker</option>
            </select>
          </div>
        </div>
      </div>

      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Healthcare Worker
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Profession
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Competencies
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Last Training
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWorkers.map((worker) => (
                <tr key={worker.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{worker.name}</div>
                      <div className="text-sm text-gray-500">{worker.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{worker.profession}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{worker.district}</div>
                    <div className="text-sm text-gray-500">{worker.facility}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(worker.status)}`}>
                      {formatStatus(worker.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {worker.competencies.map((comp, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {comp}
                        </span>
                      ))}
                      {worker.competencies.length === 0 && (
                        <span className="text-xs text-gray-500">No competencies</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {worker.lastTraining ? new Date(worker.lastTraining).toLocaleDateString() : 'No training'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(worker)}
                        className="text-blue-600 hover:text-blue-900 font-semibold transition-colors duration-200"
                      >
                        View
                      </button>
                      <button className="text-green-600 hover:text-green-900 font-semibold transition-colors duration-200">
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteWorker(worker.id)}
                        className="text-red-600 hover:text-red-900 font-semibold transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        
        {filteredWorkers.length === 0 && workers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No healthcare workers found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first healthcare worker</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add First Worker
            </button>
          </div>
        )}

        {filteredWorkers.length === 0 && workers.length > 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workers match your search</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search criteria</p>
            <button
              onClick={() => setSearchTerm('')}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Clear search
            </button>
          </div>
        )}

        
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-semibold">{filteredWorkers.length}</span> of{' '}
              <span className="font-semibold">{workers.length}</span> workers
            </div>
            <div className="flex space-x-2">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                Previous
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      
  

      <AddHealthWorker
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={() => {
          setShowAddForm(false);
          
          fetchWorkforceData();
          
        }}
      />
       <ViewDetail
        worker={selectedWorker}
        isOpen={showViewDetail}
        onClose={handleCloseViewDetail}
      />
    </div>
  );
};

export default WorkForce;