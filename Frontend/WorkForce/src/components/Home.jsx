import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import MalawiMap from './MalawiMap';

const Home = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [allData, setAllData] = useState(null); // Store original data for filtering
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedOrganization, setSelectedOrganization] = useState('all');
  const [selectedFacilityType, setSelectedFacilityType] = useState('all');

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

  
  const data = [
    { name: "Lilongwe", total_workers: 120 },
    { name: "Blantyre", total_workers: 80 },
    { name: "Mzimba", total_workers: 30 },
  ];

  
const fetchDashboardData = async (filters = {}) => {
  try {
    setLoading(true);
    setError(null);
    
    const config = getAuthConfig();
    
    if (!config.headers?.Authorization) {
      setError('Authentication required. Please log in again.');
      setLoading(false);
      return;
    }

    
    const params = new URLSearchParams();
    if (filters.district && filters.district !== 'all') params.append('district', filters.district);
    if (filters.gender && filters.gender !== 'all') params.append('gender', filters.gender);
    if (filters.organization && filters.organization !== 'all') params.append('organization', filters.organization);
    if (filters.facility_type && filters.facility_type !== 'all') params.append('facility_type', filters.facility_type);


    const baseUrl = 'https://mohsystem.onrender.com/api/dashboard/summary/';
    const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    
    console.log('Fetching dashboard data from:', url);
    const response = await axios.get(url, config);
    
    // Store allData only when no filters are applied
    if (!filters.district && !filters.gender && !filters.organization && !filters.facility_type) {
      setAllData(response.data);
    }
    
    setDashboardData(response.data);
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    console.error('Error details:', error.response?.data);
    setError(`Failed to load dashboard data: ${error.response?.status || error.message}`);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchDashboardData();
  }, []);


  const hasChartData = (data) => {
  return data && Array.isArray(data) && data.length > 0;
};

  // Filter handlers - now they trigger API calls
  const handleDistrictChange = (district) => {
    setSelectedDistrict(district);
    const filters = {
      district,
      gender: selectedGender,
      organization: selectedOrganization,
      facility_type: selectedFacilityType
    };
    fetchDashboardData(filters);
  };

  const handleGenderChange = (gender) => {
    setSelectedGender(gender);
    const filters = {
      district: selectedDistrict,
      gender,
      organization: selectedOrganization,
      facility_type: selectedFacilityType
    };
    fetchDashboardData(filters);
  };

  const handleOrganizationChange = (org) => {
    setSelectedOrganization(org);
    const filters = {
      district: selectedDistrict,
      gender: selectedGender,
      organization: org,
      facility_type: selectedFacilityType
    };
    fetchDashboardData(filters);
  };

  const handleFacilityTypeChange = (type) => {
    setSelectedFacilityType(type);
    const filters = {
      district: selectedDistrict,
      gender: selectedGender,
      organization: selectedOrganization,
      facility_type: type
    };
    fetchDashboardData(filters);
  };

  // Handle map district click
  const handleMapDistrictClick = (district) => {
    handleDistrictChange(district);
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedDistrict('all');
    setSelectedGender('all');
    setSelectedOrganization('all');
    setSelectedFacilityType('all');
    fetchDashboardData(); // Fetch all data without filters
  };

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  const GENDER_COLORS = { male: '#0088FE', female: '#FF69B4' };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard data...</p>
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
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchDashboardData()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { 
    summary, 
    gender_distribution, 
    district_distribution, 
    facility_types, 
    organization_distribution, 
    competency_popularity, 
    training_timeline, 
    disability_stats 
  } = dashboardData;

  // Active filters count
  const activeFiltersCount = [
    selectedDistrict !== 'all',
    selectedGender !== 'all', 
    selectedOrganization !== 'all',
    selectedFacilityType !== 'all'
  ].filter(Boolean).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Healthcare Workforce Dashboard</h1>
          <p className="text-gray-600 mt-2">Real-time insights and analytics for Malawi healthcare workforce</p>
          
          {/* Active Filters Badge */}
          {activeFiltersCount > 0 && (
            <div className="mt-2 flex items-center space-x-2">
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {activeFiltersCount} active filter{activeFiltersCount > 1 ? 's' : ''}
              </span>
              <button
                onClick={resetFilters}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
        
        {/* Filters */}

<div className="flex flex-wrap gap-3 mt-4 lg:mt-0">
  <select 
    value={selectedDistrict}
    onChange={(e) => handleDistrictChange(e.target.value)}
    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
  >
    <option value="all">All Districts</option>
    {/* Use current dashboardData for options, fallback to allData */}
    {(dashboardData?.district_distribution || allData?.district_distribution || []).map(district => (
      <option key={district.code} value={district.name}>
        {district.name}
      </option>
    ))}
  </select>

  <select 
    value={selectedGender}
    onChange={(e) => handleGenderChange(e.target.value)}
    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
  >
    <option value="all">All Genders</option>
    <option value="male">Male</option>
    <option value="female">Female</option>
  </select>

  <select 
    value={selectedOrganization}
    onChange={(e) => handleOrganizationChange(e.target.value)}
    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
  >
    <option value="all">All Organizations</option>
    {/* Use current dashboardData for options, fallback to allData */}
    {(dashboardData?.organization_distribution || allData?.organization_distribution || []).map(org => (
      <option key={org.name} value={org.name}>
        {org.name}
      </option>
    ))}
  </select>

  <select 
    value={selectedFacilityType}
    onChange={(e) => handleFacilityTypeChange(e.target.value)}
    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
  >
    <option value="all">All Facility Types</option>
    {/* Use current dashboardData for options, fallback to allData */}
    {(dashboardData?.facility_types || allData?.facility_types || []).map(facility => (
      <option key={facility.facility_type} value={facility.facility_type}>
        {facility.facility_type.replace('_', ' ').toUpperCase()}
      </option>
    ))}
  </select>
</div>
      </div>

      {/* Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
  {/* Row 1 - Top 3 cards */}
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">Total Workers</p>
        <p className="text-3xl font-bold mt-1 text-gray-900">{summary?.total_workers || 0}</p>
        {selectedDistrict !== 'all' && (
          <p className="text-gray-500 text-xs mt-1">in {selectedDistrict}</p>
        )}
      </div>
      <div className="bg-gray-100 p-3 rounded-lg">
        <span className="text-2xl">👥</span>
      </div>
    </div>
  </div>

  <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">Active Workers</p>
        <p className="text-3xl font-bold mt-1 text-gray-900">{summary?.active_workers || 0}</p>
        <p className="text-gray-500 text-xs mt-1">
          {summary?.total_workers ? Math.round((summary.active_workers / summary.total_workers) * 100) : 0}% active
        </p>
      </div>
      <div className="bg-gray-100 p-3 rounded-lg">
        <span className="text-2xl">✅</span>
      </div>
    </div>
  </div>

  <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">Facilities</p>
        <p className="text-3xl font-bold mt-1 text-gray-900">{summary?.total_facilities || 0}</p>
      </div>
      <div className="bg-gray-100 p-3 rounded-lg">
        <span className="text-2xl">🏥</span>
      </div>
    </div>
  </div>

  {/* Row 2 - Bottom 3 cards */}
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">Organizations</p>
        <p className="text-3xl font-bold mt-1 text-gray-900">{summary?.total_organizations || 0}</p>
      </div>
      <div className="bg-gray-100 p-3 rounded-lg">
        <span className="text-2xl">🤝</span>
      </div>
    </div>
  </div>

  <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">Competencies</p>
        <p className="text-3xl font-bold mt-1 text-gray-900">{summary?.total_competencies || 0}</p>
      </div>
      <div className="bg-gray-100 p-3 rounded-lg">
        <span className="text-2xl">🎓</span>
      </div>
    </div>
  </div>

  <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">Trainings</p>
        <p className="text-3xl font-bold mt-1 text-gray-900">{summary?.total_trainings || 0}</p>
      </div>
      <div className="bg-gray-100 p-3 rounded-lg">
        <span className="text-2xl">📚</span>
      </div>
    </div>
  </div>
</div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Workers by District {selectedDistrict !== 'all' && `- ${selectedDistrict}`}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={district_distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_workers" fill="#0088FE" name="Workers" />
                <Bar dataKey="total_facilities" fill="#00C49F" name="Facilities" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

    
             <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Gender Distribution</h3>
        <div className="h-80">
          {hasChartData(gender_distribution) ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gender_distribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ gender, count, percent }) => 
                    `${gender}: ${count} (${(percent * 100).toFixed(1)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {gender_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={GENDER_COLORS[entry.gender] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No gender data available</p>
            </div>
          )}
        </div>
      </div>
      </div>
     

      {/* Additional Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={organization_distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_workers" fill="#82CA9D" name="Workers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Timeline</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={training_timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#FF8042" strokeWidth={2} name="Trainings" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>


    
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Competencies</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={competency_popularity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_trainings" fill="#8884D8" name="Trainings Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>


        {/* Facility Types */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Facility Types</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={facility_types}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ facility_type, count, percent }) => 
                    `${facility_type.replace('_', ' ')}: ${count}`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {facility_types?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      

        {/* Disability Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Disability Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-64 items-center">
            {disability_stats?.map(stat => (
              <div key={stat.disability} className="text-center">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${
                  stat.disability ? 'bg-orange-100' : 'bg-blue-100'
                }`}>
                  <span className={`text-2xl font-bold ${
                    stat.disability ? 'text-orange-600' : 'text-blue-600'
                  }`}>
                    {stat.count}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-gray-700">
                  {stat.disability ? 'With Disability' : 'Without Disability'}
                </p>
                <p className="text-xs text-gray-500">
                  {((stat.count / summary.total_workers) * 100).toFixed(1)}% of total
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;