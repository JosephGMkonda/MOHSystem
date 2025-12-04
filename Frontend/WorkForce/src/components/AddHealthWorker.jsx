import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddHealthWorker = ({ isOpen, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedCompetency, setSelectedCompetency] = useState('');
  const [formData, setFormData] = useState({
    national_id: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    gender: '',
    disability: false,
    language: 'Chichewa/English',
    position: '',
    facility: '',
    organization: '',
    competencies: [],
    trainings: [],
    status: 'available',
    note: '',
    location: ''
  });

  const [dropdownData, setDropdownData] = useState({
    districts: [],
    facilities: [],
    organizations: [],
    competencies: []
  });


  const getAuthConfig = () => {
    
    let token = localStorage.getItem('token'); 
    

    if (!token) {
      token = localStorage.getItem('authToken');
    }
    if (!token) {
      token = localStorage.getItem('access');
    }


    if (!token) {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          token = user.token || user.access;
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
    }

   

    if (!token) {
      console.warn('No authentication token found in localStorage');
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

  
  useEffect(() => {
    if (isOpen) {
      
      console.log('📋 localStorage contents:', Object.keys(localStorage).map(key => ({
        key,
        value: key === 'token' ? localStorage.getItem(key)?.substring(0, 20) + '...' : localStorage.getItem(key)
      })));
      
      fetchDropdownData();
    }
  }, [isOpen]);

  const fetchDropdownData = async () => {
    try {
      const endpoints = {
        districts: 'https://mohsystem.onrender.com/api/districts/',
        organizations: 'https://mohsystem.onrender.com/api/organizations/',
        facilities: 'https://mohsystem.onrender.com/api/facilities/',
        competencies: 'https://mohsystem.onrender.com/api/competencies/'
      };

      const config = getAuthConfig();
      
      

      
      if (!config.headers?.Authorization) {
    
        setDropdownData(getFallbackData());
        return;
      }

    
      const [districtsResponse, organizationsResponse, facilitiesResponse, competenciesResponse] = await Promise.all([
        axios.get(endpoints.districts, config).catch(error => {
          console.error('Districts fetch error:', error.response?.status);
          return { data: [] };
        }),
        axios.get(endpoints.organizations, config).catch(error => {
          console.error('Organizations fetch error:', error.response?.status);
          return { data: [] };
        }),
        axios.get(endpoints.facilities, config).catch(error => {
          console.error('Facilities fetch error:', error.response?.status);
          return { data: [] };
        }),
        axios.get(endpoints.competencies, config).catch(error => {
          console.error('Competencies fetch error:', error.response?.status);
          return { data: [] };
        })
      ]);

      const dropdownDataResult = {
        districts: extractData(districtsResponse.data),
        organizations: extractData(organizationsResponse.data),
        facilities: extractData(facilitiesResponse.data),
        competencies: extractData(competenciesResponse.data)
      };

    

      setDropdownData(dropdownDataResult);

    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      
      
      setDropdownData(getFallbackData());
    }
  };


  const extractData = (responseData) => {
    if (Array.isArray(responseData)) {
      return responseData;
    } else if (responseData && Array.isArray(responseData.results)) {
      return responseData.results;
    } else if (responseData && Array.isArray(responseData.data)) {
      return responseData.data;
    }
    return [];
  };

 

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCompetencyChange = (competencyId, dateCompleted, validUntil) => {
    setFormData(prev => ({
      ...prev,
      trainings: prev.trainings.map(training =>
        training.competency === competencyId
          ? { ...training, date_completed: dateCompleted, valid_until: validUntil }
          : training
      ).filter(training => training.date_completed)
    }));
  };

  const addCompetency = (competencyId) => {
    if (!formData.trainings.find(t => t.competency === competencyId)) {
      setFormData(prev => ({
        ...prev,
        trainings: [...prev.trainings, { competency: competencyId, date_completed: '', valid_until: '' }]
      }));
    }
  };

  const removeCompetency = (competencyId) => {
    setFormData(prev => ({
      ...prev,
      trainings: prev.trainings.filter(t => t.competency !== competencyId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const config = getAuthConfig();
      
     

       console.log('Form data being submitted:', {
      facility: formData.facility,
      facilityType: typeof formData.facility,
      allFormData: formData
    });


        const hcwPayload = {
      national_id: formData.national_id,
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone,
      email: formData.email,
      gender: formData.gender,
      disability: formData.disability,
      language: formData.language,
      position: formData.position,
      facility: Number(formData.facility), 
      organization: formData.organization ? Number(formData.organization): null,
      is_active: true
    };

    


      
      if (!config.headers?.Authorization) {
        alert('Authentication required. Please log in again.');
        
        
        
        setLoading(false);
        return;
      }

      
      const hcwResponse = await axios.post(
        'https://mohsystem.onrender.com/api/hcws/', hcwPayload, config
      );

    

      const hcwId = hcwResponse.data.id;
      

      
      if (formData.trainings.length > 0) {
        const trainingPromises = formData.trainings
          .filter(training => training.date_completed)
          .map(training =>
            axios.post(
              'https://mohsystem.onrender.com/api/trainings/', 
              {
                hcw: hcwId,
                competency: training.competency,
                date_completed: training.date_completed,
                valid_until: training.valid_until || null
              },
              config
            )
          );

        await Promise.all(trainingPromises);
        
      }

      
      await axios.post(
        'https://mohsystem.onrender.com/api/availability/', 
        {
          hcw: hcwId,
          status: formData.status,
          note: formData.note,
          location: formData.location
        },
        config
      );

      

      onSuccess();
      onClose();
      resetForm();

      alert('Healthcare worker registered successfully!');

    } catch (error) {
      console.error('Error creating healthcare worker:', error);

      if (error.response?.status === 401) {
        alert('Authentication failed. Please log in again.');
      } else if (error.response?.status === 400) {
        const errors = error.response.data;
        let errorMessage = 'Please check the form for errors:\n';
        
        Object.keys(errors).forEach(key => {
          errorMessage += `• ${key}: ${errors[key]}\n`;
        });
        
        alert(errorMessage);
      } else {
        alert('Error creating healthcare worker. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      national_id: '',
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      gender: '',
      disability: false,
      language: 'Chichewa/English',
      position: '',
      facility: '',
      organization: '',
      competencies: [],
      trainings: [],
      status: 'available',
      note: '',
      location: ''
    });
    setCurrentStep(1);
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.first_name && formData.last_name && formData.phone;
      case 2:
        return formData.position && formData.facility;
      default:
        return true;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      
      <div className="fixed inset-0 bg-gradient-to-br from-blue-400/20 via-purple-500/20 to-pink-400/20 backdrop-blur-2xl backdrop-saturate-150 z-40"></div>
      
      
      <div className="fixed inset-0 z-40 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-300/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-purple-300/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-300/5 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '4s'}}></div>
      </div>

      
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden">
          
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl shadow-blue-500/10">
        
            <div className="bg-gradient-to-br from-white/25 to-white/20 backdrop-blur-xl">
              
              
              <div className="bg-gradient-to-r from-blue-600/90 to-blue-700/90 backdrop-blur-sm px-6 py-4 border-b border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white drop-shadow-sm">Register Healthcare Worker</h2>
                    <p className="text-blue-100/90 text-sm drop-shadow">Ministry of Health - Malawi</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-white/90 hover:text-white text-2xl font-bold transition-all duration-200 hover:scale-110 backdrop-blur-sm bg-white/10 rounded-full w-8 h-8 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
                
        
                <div className="flex justify-center mt-4">
                  {[1, 2, 3, 4].map(step => (
                    <div key={step} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold backdrop-blur-sm border-2 transition-all duration-300 ${
                        step === currentStep
                          ? 'bg-white/95 text-blue-600 border-white/80 shadow-lg scale-110'
                          : step < currentStep
                          ? 'bg-green-500/90 text-white border-green-400/80 shadow-md'
                          : 'bg-blue-500/80 text-white border-blue-400/60 shadow-sm'
                      }`}>
                        {step < currentStep ? '✓' : step}
                      </div>
                      {step < 4 && (
                        <div className={`w-12 h-1 mx-2 backdrop-blur-sm rounded-full ${
                          step < currentStep 
                            ? 'bg-green-400/80 shadow-sm' 
                            : 'bg-blue-400/60'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              
              <form onSubmit={handleSubmit} className="p-6 max-h-[60vh] overflow-y-auto">
                {/* Step 1: Personal Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200/60 pb-2">
                      Personal Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          National ID
                        </label>
                        <input
                          type="text"
                          name="national_id"
                          value={formData.national_id}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300/80 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/80 backdrop-blur-sm transition-all duration-200 shadow-sm"
                          placeholder="Enter national ID"
                        />
                      </div>

                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name *
                          </label>
                          <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300/80 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/80 backdrop-blur-sm transition-all duration-200 shadow-sm"
                            placeholder="Enter first name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300/80 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/80 backdrop-blur-sm transition-all duration-200 shadow-sm"
                            placeholder="Enter last name"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300/80 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/80 backdrop-blur-sm transition-all duration-200 shadow-sm"
                          placeholder="+265 XXX XXX XXX"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300/80 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/80 backdrop-blur-sm transition-all duration-200 shadow-sm"
                          placeholder="email@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Gender
                        </label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300/80 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/80 backdrop-blur-sm transition-all duration-200 shadow-sm"
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primary Language
                        </label>
                        <select
                          name="language"
                          value={formData.language}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300/80 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/80 backdrop-blur-sm transition-all duration-200 shadow-sm"
                        >
                          <option value="Chichewa/English">Language</option>
                          <option value="Chichewa">Chichewa</option>
                          <option value="English">English</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="flex items-center bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-gray-300/50">
                        <input
                          type="checkbox"
                          name="disability"
                          checked={formData.disability}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          Person with disability
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                
              {currentStep === 2 && (
              <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200/60 pb-2">
      Professional Information
    </h3>
    
    <div className="grid grid-cols-1 gap-6">
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Position/Title *
        </label>
        <input
          type="text"
          name="position"
          value={formData.position}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-3 border border-gray-300/80 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/80 backdrop-blur-sm transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg"
          placeholder="e.g., Nurse, Clinical Officer, Medical Doctor"
        />
      </div>

    
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Health Facility *
        </label>
        <div className="relative">
          <select
            name="facility"
            value={formData.facility}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border border-gray-300/80 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/80 backdrop-blur-sm transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg appearance-none cursor-pointer"
          >
            <option value="" className="text-gray-400">-- Select Health Facility --</option>
            {dropdownData.facilities.map((facility) => {
            
              let districtName = 'Unknown District';
              
              if (typeof facility.district === 'string') {
                districtName = facility.district;
              } else if (facility.district && typeof facility.district === 'object') {
                districtName = facility.district.name || facility.district.code || `District ${facility.district.id}`;
              } else if (facility.district_name) {
                districtName = facility.district_name;
              }
              
              return (
                <option 
                  key={facility.id} 
                  value={facility.id}
                  className="text-gray-900 py-2"
                >
                  {facility.name} - {districtName}
                </option>
              );
            })}
          </select>
          
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {formData.facility && (
          <p className="text-xs text-green-600 mt-2 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Facility selected
          </p>
        )}
      </div>

      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Organization
        </label>
        <div className="relative">
          <select
            name="organization"
            value={formData.organization}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300/80 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/80 backdrop-blur-sm transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg appearance-none cursor-pointer"
          >
            <option value="" className="text-gray-400">-- Select Organization --</option>
            {dropdownData.organizations.map((org) => (
              <option 
                key={org.id} 
                value={org.id}
                className="text-gray-900 py-2"
              >
                {org.name}
              </option>
            ))}
          </select>
          
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {formData.organization && (
          <p className="text-xs text-blue-600 mt-2 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Organization selected
          </p>
        )}
      </div>

      
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200/60 rounded-xl p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${formData.position ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-sm font-medium text-gray-700">Position</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${formData.facility ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-sm font-medium text-gray-700">Facility</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${formData.organization ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className="text-sm font-medium text-gray-700">Organization</span>
          </div>
        </div>
      </div>
    </div>
             </div>
               )}
                
                {/* Step 3: Competencies & Training */}
{currentStep === 3 && (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200/60 pb-2">
      Competencies & Training
    </h3>
    
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Add Competencies
        </label>
        <div className="relative">
          <select
            name="competency"
            value={selectedCompetency}
            onChange={(e) => {
              const competencyId = Number(e.target.value);
              if (competencyId) {
                addCompetency(competencyId);
                setSelectedCompetency(''); // Reset after selection
              }
            }}
            className="w-full px-4 py-3 border border-gray-300/80 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/80 backdrop-blur-sm transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg appearance-none cursor-pointer"
          >
            <option value="" className="text-gray-400">-- Select Competency to Add --</option>
            {dropdownData.competencies
              .filter(comp => !formData.trainings.find(t => t.competency === comp.id))
              .map(competency => (
                <option key={competency.id} value={competency.id} className="text-gray-900 py-2">
                  {competency.code} - {competency.name}
                </option>
              ))
            }
          </select>
          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 flex items-center">
          <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Select a competency to add training details
        </p>
      </div>

      
      <div className="space-y-3">
        {formData.trainings.map(training => {
          const competency = dropdownData.competencies.find(c => c.id == training.competency);
          return (
            <div key={training.competency} className="bg-white/60 backdrop-blur-sm border border-gray-300/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{competency?.name}</h4>
                  <p className="text-sm text-gray-600">{competency?.code}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeCompetency(training.competency)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium bg-red-50/80 px-3 py-1 rounded-lg transition-all duration-200 hover:bg-red-100 hover:scale-105"
                >
                  Remove
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Date Completed *
                  </label>
                  <input
                    type="date"
                    value={training.date_completed}
                    onChange={(e) => handleCompetencyChange(
                      training.competency, 
                      e.target.value, 
                      training.valid_until
                    )}
                    className="w-full px-3 py-2 border border-gray-300/80 rounded-lg focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/80 backdrop-blur-sm text-sm shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Valid Until (Optional)
                  </label>
                  <input
                    type="date"
                    value={training.valid_until}
                    onChange={(e) => handleCompetencyChange(
                      training.competency, 
                      training.date_completed,
                      e.target.value
                    )}
                    className="w-full px-3 py-2 border border-gray-300/80 rounded-lg focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/80 backdrop-blur-sm text-sm shadow-sm"
                  />
                </div>
              </div>
            </div>
          );
        })}

        {formData.trainings.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white/30 backdrop-blur-sm rounded-xl border border-gray-300/50 hover:border-gray-400/50 transition-all duration-200">
            <div className="text-5xl mb-3">🎓</div>
            <p className="text-lg font-medium mb-2">No competencies added yet</p>
            <p className="text-sm">Select a competency above to add training records</p>
          </div>
        )}
      </div>
    </div>
  </div>
)}

                {/* Step 4: Availability */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200/60 pb-2">
                      Availability & Deployment Status
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Status *
                        </label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300/80 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/80 backdrop-blur-sm transition-all duration-200 shadow-sm"
                        >
                          <option value="available">Available</option>
                          <option value="unavailable">Unavailable</option>
                          <option value="deployed">Deployed</option>
                          <option value="on_leave">On Leave</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Location
                        </label>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300/80 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/80 backdrop-blur-sm transition-all duration-200 shadow-sm"
                          placeholder="Current location or deployment area"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Additional Notes
                        </label>
                        <textarea
                          name="note"
                          value={formData.note}
                          onChange={handleInputChange}
                          rows="3"
                          className="w-full px-4 py-3 border border-gray-300/80 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/80 backdrop-blur-sm transition-all duration-200 shadow-sm"
                          placeholder="Any additional information about availability..."
                        />
                      </div>
                    </div>

                    
                    <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200/60 rounded-xl p-4 shadow-sm">
                      <h4 className="font-semibold text-blue-900 mb-2">Registration Summary</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p><strong>Name:</strong> {formData.first_name} {formData.last_name}</p>
                        <p><strong>Position:</strong> {formData.position}</p>
                        <p><strong>Phone:</strong> {formData.phone}</p>
                        <p><strong>Competencies:</strong> {formData.trainings.length} added</p>
                        <p><strong>Status:</strong> {formData.status}</p>
                      </div>
                    </div>
                  </div>
                )}
              </form>

            
              <div className="border-t border-gray-200/60 bg-white/80 backdrop-blur-sm px-6 py-4">
                <div className="flex justify-between">
                  <div>
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="px-6 py-2 border border-gray-300/80 rounded-xl text-gray-700 hover:bg-white/60 backdrop-blur-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        ← Previous
                      </button>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2 border border-gray-300/80 rounded-xl text-gray-700 hover:bg-white/60 backdrop-blur-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Cancel
                    </button>
                    
                    {currentStep < 4 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        disabled={!validateStep(currentStep)}
                        className="px-6 py-2 bg-blue-600/90 text-white rounded-xl hover:bg-blue-700/90 backdrop-blur-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next Step →
                      </button>
                    ) : (
                      <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-green-600/90 text-white rounded-xl hover:bg-green-700/90 backdrop-blur-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Registering...</span>
                          </>
                        ) : (
                          <>
                            <span>✓</span>
                            <span>Complete Registration</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddHealthWorker;