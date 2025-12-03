import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Search, 
  Filter, 
  Printer, 
  Download, 
  FileText, 
  Users, 
  MapPin, 
  Briefcase,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Phone,
  Building,
  Award
} from 'lucide-react';

const Configuration = () => {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedProfession, setSelectedProfession] = useState('all');
  const [selectedCompetency, setSelectedCompetency] = useState('all');
  const [workers, setWorkers] = useState([]);
  const [allWorkers, setAllWorkers] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printData, setPrintData] = useState([]);
  const [printTitle, setPrintTitle] = useState('Workforce Report');
  const itemsPerPage = 10;
  
  
  const printRef = useRef();

  
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

  
  const professionMapping = {
    'nurse': 'Nurse',
    'nursing': 'Nurse',
    'registered nurse': 'Nurse',
    'rn': 'Nurse',
    'clinician': 'Clinical Officer',
    'clinical officer': 'Clinical Officer',
    'clinical': 'Clinical Officer',
    'co': 'Clinical Officer',
    'doctor': 'Medical Doctor',
    'medical doctor': 'Medical Doctor',
    'physician': 'Medical Doctor',
    'md': 'Medical Doctor',
    'community health worker': 'Community Health Worker',
    'chw': 'Community Health Worker',
    'health surveillance assistant': 'Community Health Worker',
    'hsa': 'Community Health Worker',
    'midwife': 'Midwife',
    'midwifery': 'Midwife',
    'pharmacist': 'Pharmacist',
    'lab technician': 'Lab Technician',
    'laboratory technician': 'Lab Technician',
    'radiographer': 'Radiographer',
    'physiotherapist': 'Physiotherapist',
    'nutritionist': 'Nutritionist'
  };

  const normalizeProfession = (profession) => {
    if (!profession) return 'Other';
    
    const lowerProfession = profession.toLowerCase().trim();
    
    if (professionMapping[lowerProfession]) {
      return professionMapping[lowerProfession];
    }
    
    for (const [key, value] of Object.entries(professionMapping)) {
      if (lowerProfession.includes(key) || key.includes(lowerProfession)) {
        return value;
      }
    }
    
    return profession.charAt(0).toUpperCase() + profession.slice(1).toLowerCase();
  };


  const fetchAllPages = async (url, config) => {
    let results = [];
    let nextUrl = url;

    while (nextUrl) {
      const res = await axios.get(nextUrl, config);
      const pageResults = res.data.results || res.data;
      results = [...results, ...pageResults];
      nextUrl = res.data.next;
    }

    return results;
  };

  
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

      const [hcws, trainings, availability] = await Promise.all([
        fetchAllPages('https://mohsystem.onrender.com/api/hcws/', config),
        fetchAllPages('https://mohsystem.onrender.com/api/trainings/', config),
        fetchAllPages('https://mohsystem.onrender.com/api/availability/', config),
      ]);

      const transformedWorkers = transformApiData(hcws, trainings, availability);

      setAllWorkers(transformedWorkers);
      setWorkers(transformedWorkers);
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

      const normalizedProfession = normalizeProfession(hcw.position);

      return {
        id: hcw.id,
        name: `${hcw.first_name} ${hcw.last_name}`,
        firstName: hcw.first_name,
        lastName: hcw.last_name,
        profession: normalizedProfession,
        originalProfession: hcw.position,
        district: hcw.facility_details?.district?.name || hcw.facility?.district?.name || 'Unknown',
        facility: hcw.facility_details?.name || hcw.facility?.name || 'Unknown Facility',
        organization: hcw.organization_name || `Organization ID: ${hcw.organization}` || 'Unknown Organization',
        phone: hcw.phone || 'No phone',
        email: hcw.email || 'No email',
        status: latestAvailability?.status || 'Unknown',
        competencies: competencies,
        lastTraining: latestTraining,
        rawData: hcw
      };
    });
  };

  
  const fetchDistricts = async () => {
    try {
      const config = getAuthConfig();
      const response = await axios.get('https://mohsystem.onrender.com/api/districts/', config);
      setDistricts(response.data);
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  useEffect(() => {
    fetchWorkforceData();
    fetchDistricts();
  }, []);

  
  const applyFilters = () => {
    let filtered = allWorkers;

    if (selectedDistrict !== 'all') {
      filtered = filtered.filter(worker => 
        worker.district.toLowerCase() === selectedDistrict.toLowerCase()
      );
    }

    if (selectedProfession !== 'all') {
      filtered = filtered.filter(worker => 
        worker.profession.toLowerCase() === selectedProfession.toLowerCase()
      );
    }

    if (selectedCompetency !== 'all') {
      filtered = filtered.filter(worker =>
        worker.competencies.includes(selectedCompetency)
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(worker =>
        worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.profession.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.originalProfession.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.facility.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.organization.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const allFiltered = applyFilters();

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedWorkers = allFiltered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(allFiltered.length / itemsPerPage);

  
  const getUniqueProfessions = () => {
    const professions = [...new Set(allWorkers.map(worker => worker.profession))];
    return professions.sort();
  };

  const getUniqueCompetencies = () => {
    const allCompetencies = allWorkers.flatMap(worker => worker.competencies);
    const uniqueCompetencies = [...new Set(allCompetencies)];
    return uniqueCompetencies.sort();
  };

  



  
  const handlePrint = (type = 'current') => {
    let dataToPrint = [];
    let title = 'Workforce Report';
    
    if (type === 'current') {
      dataToPrint = paginatedWorkers;
      title = `Current Page View - Page ${currentPage}`;
    } else if (type === 'filtered') {
      dataToPrint = allFiltered;
      title = `Filtered Results (${allFiltered.length} workers)`;
    } else if (type === 'all') {
      dataToPrint = allWorkers;
      title = `Complete Workforce Database (${allWorkers.length} workers)`;
    }
    
    setPrintData(dataToPrint);
    setPrintTitle(title);
    setShowPrintPreview(true);
  };

  
  const handleBrowserPrint = () => {
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert('Please allow popups to print');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${printTitle}</title>
        <style>
          @media print {
            @page {
              margin: 0.5in;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              color: #1e40af;
            }
            .header h2 {
              margin: 5px 0;
              font-size: 18px;
              color: #374151;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 20px;
            }
            .summary-box {
              padding: 10px;
              text-align: center;
              border-radius: 5px;
            }
            .summary-box .number {
              font-size: 20px;
              font-weight: bold;
              display: block;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th {
              background-color: #f3f4f6;
              text-align: left;
              padding: 8px;
              border: 1px solid #d1d5db;
              font-weight: bold;
            }
            td {
              padding: 8px;
              border: 1px solid #d1d5db;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .status-available {
              background-color: #d1fae5;
              color: #065f46;
              padding: 2px 6px;
              border-radius: 10px;
              font-size: 11px;
              display: inline-block;
            }
            .status-deployed {
              background-color: #dbeafe;
              color: #1e40af;
              padding: 2px 6px;
              border-radius: 10px;
              font-size: 11px;
              display: inline-block;
            }
            .status-on_leave {
              background-color: #fef3c7;
              color: #92400e;
              padding: 2px 6px;
              border-radius: 10px;
              font-size: 11px;
              display: inline-block;
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #d1d5db;
              font-size: 11px;
              color: #6b7280;
            }
            .page-break {
              page-break-before: always;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Malawi Ministry of Health</h1>
          <h2>Outbreak Response System - Workforce</h2>
          
          <p>Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} | Total Records: ${printData.length}</p>
        </div>
        
        
        
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Name</th>
              <th>Profession</th>
              <th>District</th>
              <th>Facility</th>
              <th>Phone</th>
              <th>Competencies</th>
            </tr>
          </thead>
          <tbody>
            ${printData.map((worker, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${worker.name}</td>
                <td>${worker.profession}</td>
                <td>${worker.district}</td>
                <td>${worker.facility}</td>
                <td>${worker.phone}</td>
               
                <td>${worker.competencies.join(', ') || 'None'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <div style="float: left;">
            <strong>Malawi Ministry of Health</strong><br>
            Outbreak Response System<br>
            www.health.gov.mw
          </div>
          <div style="float: right; text-align: right;">
            Generated by: System Administrator<br>
            Confidential - For Official Use Only<br>
            Page 1 of 1
          </div>
          <div style="clear: both;"></div>
          <div style="text-align: center; margin-top: 10px;">
            This document is automatically generated from the Malawi MOH Outbreak Response System.
            Valid as of ${new Date().toLocaleString()}.
          </div>
        </div>
        
        <div class="no-print">
          <br><br>
          <button onclick="window.print()" style="padding: 10px 20px; background-color: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Print Now
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background-color: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
            Close
          </button>
        </div>
        
        <script>
          // Auto-print after a short delay
          setTimeout(() => {
            window.print();
          }, 500);
          
          // Close window after print
          window.onafterprint = function() {
            setTimeout(() => {
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleExportCSV = () => {
    const dataToExport = allFiltered;
    const headers = ['Name', 'Profession', 'District', 'Facility', 'Organization', 'Phone', 'Email', 'Status', 'Competencies'];
    
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(worker => [
        `"${worker.name}"`,
        `"${worker.profession}"`,
        `"${worker.district}"`,
        `"${worker.facility}"`,
        `"${worker.organization}"`,
        `"${worker.phone}"`,
        `"${worker.email}"`,
        `"${worker.status}"`,
        `"${worker.competencies.join('; ')}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `malawi-moh-workforce-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

 
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedDistrict('all');
    setSelectedProfession('all');
    setSelectedCompetency('all');
    setCurrentPage(1);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-md">
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Workforce Printing & Export</h1>
          <p className="text-gray-600 mt-2">
            Search, filter, and print healthcare workforce data from Malawi MOH Outbreak Response System
          </p>
        </div>

         <div className="grid  gap-6 mb-6">
        

    
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Print & Export Options</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => handlePrint('current')}
                className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Printer className="w-6 h-6 text-blue-600 mb-2" />
                <span className="text-sm font-medium">Print Current</span>
                <span className="text-xs text-gray-500">Page {currentPage}</span>
              </button>
              
              <button
                onClick={() => handlePrint('filtered')}
                className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <FileText className="w-6 h-6 text-green-600 mb-2" />
                <span className="text-sm font-medium">Print Filtered</span>
                <span className="text-xs text-gray-500">{allFiltered.length} workers</span>
              </button>
              
              <button
                onClick={() => handlePrint('all')}
                className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <Users className="w-6 h-6 text-purple-600 mb-2" />
                <span className="text-sm font-medium">Print All</span>
                <span className="text-xs text-gray-500">{allWorkers.length} workers</span>
              </button>
              
              <button
                onClick={handleExportCSV}
                className="flex flex-col items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
              >
                <Download className="w-6 h-6 text-orange-600 mb-2" />
                <span className="text-sm font-medium">Export CSV</span>
                <span className="text-xs text-gray-500">Excel format</span>
              </button>
            </div>
          </div>
        </div>

        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
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
            
            <div className="flex flex-wrap gap-3">
              <select 
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 min-w-[180px]"
              >
                <option value="all">All Districts</option>
                {districts.map(district => (
                  <option key={district.id} value={district.name}>
                    {district.name}
                  </option>
                ))}
              </select>
              
              <select 
                value={selectedCompetency}
                onChange={(e) => setSelectedCompetency(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 min-w-[180px]"
              >
                <option value="all">All Competencies</option>
                {getUniqueCompetencies().map(comp => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
              </select>

              <select 
                value={selectedProfession}
                onChange={(e) => setSelectedProfession(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 min-w-[180px]"
              >
                <option value="all">All Professions</option>
                {getUniqueProfessions().map(profession => (
                  <option key={profession} value={profession}>
                    {profession}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Active Filters Display */}
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedDistrict !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <MapPin className="w-3 h-3 mr-1" />
                District: {selectedDistrict}
                <button 
                  onClick={() => setSelectedDistrict('all')}
                  className="ml-2 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {selectedProfession !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <Briefcase className="w-3 h-3 mr-1" />
                Profession: {selectedProfession}
                <button 
                  onClick={() => setSelectedProfession('all')}
                  className="ml-2 hover:text-green-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCompetency !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <Award className="w-3 h-3 mr-1" />
                Competency: {selectedCompetency}
                <button 
                  onClick={() => setSelectedCompetency('all')}
                  className="ml-2 hover:text-purple-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {(selectedDistrict !== 'all' || selectedProfession !== 'all' || selectedCompetency !== 'all') && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>

        

        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
           
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profession</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facility</th>
                  
                  
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedWorkers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{worker.name}</div>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <Phone className="w-3 h-3 mr-1" />
                        {worker.phone}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        <Briefcase className="w-3 h-3 mr-1" />
                        {worker.profession}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-700">{worker.district}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <Building className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-700">{worker.facility}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{worker.organization}</div>
                    </td>
                  
                   
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(indexOfLastItem, allFiltered.length)}</span> of{' '}
                  <span className="font-medium">{allFiltered.length}</span> results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 border text-sm font-medium rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      
      {showPrintPreview && (
         <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Print Preview</h3>
                
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBrowserPrint}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Now
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Print Preview Content */}
              <div className="border border-gray-300 p-6 bg-white">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-blue-800">Malawi Ministry of Health</h1>
                  <h2 className="text-xl text-gray-700">Outbreak Response System</h2>
                  
                  <div className="text-sm text-gray-500 mt-2">
                    Generated: {new Date().toLocaleDateString()} | Time: {new Date().toLocaleTimeString()} | Records: {printData.length}
                  </div>
                </div>
                
                
                
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left text-sm font-semibold">No.</th>
                      <th className="border border-gray-300 p-2 text-left text-sm font-semibold">Name</th>
                      <th className="border border-gray-300 p-2 text-left text-sm font-semibold">Profession</th>
                      <th className="border border-gray-300 p-2 text-left text-sm font-semibold">District</th>
                      
                    </tr>
                  </thead>
                  <tbody>
                    {printData.slice(0, 10).map((worker, index) => (
                      <tr key={worker.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 p-2">{index + 1}</td>
                        <td className="border border-gray-300 p-2 font-medium">{worker.name}</td>
                        <td className="border border-gray-300 p-2">{worker.profession}</td>
                        <td className="border border-gray-300 p-2">{worker.district}</td>
                      
                      </tr>
                    ))}
                    {printData.length > 10 && (
                      <tr>
                        <td colSpan="5" className="border border-gray-300 p-2 text-center text-sm text-gray-500">
                          ... and {printData.length - 10} more records
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                
                <div className="mt-6 pt-4 border-t border-gray-300 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-semibold">Malawi Ministry of Health</div>
                      <div>Outbreak Response System</div>
                    </div>
                    <div className="text-right">
                      <div>Page 1 of 1</div>
                      <div>Confidential Document</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-center text-sm text-gray-600">
                <p>Click "Print Now" to open the print dialog with full formatting.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Configuration;