import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useNavigate } from 'react-router-dom';
import DeploymentWizard from "./DeploymentWizard";
import { authAxios } from "../utils/auth";

const DeploymentManagement = () => {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [archiving, setArchiving] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  // Fetch deployments and active count
  useEffect(() => {
    fetchDeployments();
    fetchActiveCount();
  }, []);

  const fetchDeployments = async () => {
    try {
      setLoading(true);
      const response = await authAxios.get("deployments/");
      setDeployments(response.data);
      setError("");
    } catch (err) {
      console.error("Failed to fetch deployments:", err);
      if (err.response?.status === 401) {
        setError("Authentication failed. Please log in again.");
      } else {
        setError("Failed to load deployments. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveCount = async () => {
    try {
      const response = await authAxios.get("deployments/active_count/");
      setActiveCount(response.data.active_count);
    } catch (err) {
      console.error("Failed to fetch active count:", err);
    }
  };

  const archiveDeployments = async () => {
    if (activeCount === 0) {
      setError("No active deployments to archive.");
      return;
    }

    setArchiving(true);
    try {
      const response = await authAxios.post("deployments/archive_all/", {
        completion_notes: completionNotes
      });

      setSuccess(response.data.message);
      setShowArchiveModal(false);
      setCompletionNotes("");
      
      // Refresh data
      fetchDeployments();
      fetchActiveCount();
      
    } catch (err) {
      console.error("Failed to archive deployments:", err);
      setError(err.response?.data?.error || "Failed to archive deployments.");
    } finally {
      setArchiving(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 53, 147);
    doc.text("ACTIVE DEPLOYMENTS REPORT - MINISTRY OF HEALTH", 105, 20, { align: 'center' });

    // Summary
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 35);
    doc.text(`Active Deployments: ${deployments.length}`, 14, 45);

    // Deployments Table
    const tableData = deployments.map(deployment => [
      deployment.hcw_name,
      deployment.outbreak_type,
      deployment.district_name,
      deployment.start_date,
      deployment.role
    ]);

    doc.autoTable({
      startY: 55,
      head: [['Healthcare Worker', 'Outbreak', 'District', 'Start Date', 'Role']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [40, 53, 147] },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: 14, right: 14 }
    });

    // Footer
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Ministry of Health - Malawi Outbreak Response System", 105, finalY, { align: 'center' });

    doc.save(`active-deployments-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getOutbreakColor = (outbreak) => {
    switch (outbreak?.toLowerCase()) {
      case 'cholera': return 'bg-orange-100 text-orange-800';
      case 'covid-19': return 'bg-red-100 text-red-800';
      case 'polio': return 'bg-purple-100 text-purple-800';
      case 'ebola': return 'bg-red-100 text-red-800';
      case 'malaria': return 'bg-green-100 text-green-800';
      case 'measles': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate stats for cards
  const stats = {
    total: deployments.length,
    districts: new Set(deployments.map(d => d.district_name)).size,
    outbreakTypes: new Set(deployments.map(d => d.outbreak_type)).size,
    activeWorkers: new Set(deployments.map(d => d.hcw_name)).size
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🚀 Active Deployment Management
          </h1>
          <p className="text-gray-600">
            Manage current outbreak response deployments across Malawi
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <div className="text-green-500 text-lg mr-3">✅</div>
              <p className="text-green-800 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-500 text-lg mr-3">⚠️</div>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {deployments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-blue-600 text-xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Deployments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-green-600 text-xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Workers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeWorkers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-purple-600 text-xl">🦠</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Outbreak Types</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.outbreakTypes}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <span className="text-orange-600 text-xl">📍</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Districts Covered</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.districts}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">
                Current Deployment Operations
              </h2>
              <p className="text-gray-600 text-sm">
                {deployments.length} active deployment records
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowArchiveModal(true)}
                disabled={deployments.length === 0}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 font-semibold flex items-center space-x-2 transition-colors"
              >
                <span>📚</span>
                <span>Archive & Clear</span>
              </button>
                <button
      onClick={() => navigate('/deployment-history')}
      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center space-x-2 transition-colors"
    >
      <span>📚</span>
      <span>View History</span>
    </button>
              <button
                onClick={generatePDF}
                disabled={deployments.length === 0}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold flex items-center space-x-2 transition-colors"
              >
                <span>📄</span>
                <span>Export PDF</span>
              </button>
              <button
                onClick={() => setShowWizard(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center space-x-2 transition-colors"
              >
                <span>🚀</span>
                <span>New Deployment</span>
              </button>
            </div>
          </div>
        </div>

        {/* Deployments Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading active deployments...</span>
            </div>
          ) : deployments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                No Active Deployments
              </h3>
              <p className="text-gray-600 mb-4">
                Start a new deployment operation or check deployment history
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowWizard(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Start New Deployment
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Healthcare Worker
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Outbreak
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      District
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deployments.map((deployment) => (
                    <tr key={deployment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {deployment.hcw_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {deployment.hcw?.position || deployment.role}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 space-y-1">
                          {deployment.hcw?.phone && (
                            <div className="flex items-center">
                              <span className="text-gray-400 mr-2">📞</span>
                              <a 
                                href={`tel:${deployment.hcw.phone}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {deployment.hcw.phone}
                              </a>
                            </div>
                          )}
                          
                          {deployment.hcw?.email && (
                            <div className="flex items-center">
                              <span className="text-gray-400 mr-2">✉️</span>
                              <a 
                                href={`mailto:${deployment.hcw.email}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline text-xs"
                              >
                                {deployment.hcw.email}
                              </a>
                            </div>
                          )}
                          
                          {deployment.hcw?.facility_details?.name && (
                            <div className="flex items-center text-xs text-gray-600">
                              <span className="text-gray-400 mr-2">🏥</span>
                              {deployment.hcw.facility_details.name}
                            </div>
                          )}
                          
                          {(!deployment.hcw?.phone && !deployment.hcw?.email) && (
                            <div className="text-xs text-gray-400 italic">
                              Contact details not available
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOutbreakColor(deployment.outbreak_type)}`}>
                          {deployment.outbreak_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {deployment.district_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {new Date(deployment.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {deployment.role}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Archive Confirmation Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                📚 Archive Current Deployments
              </h3>
              <p className="text-gray-600 mb-4">
                This will move all {activeCount} active deployments to history and clear the current deployment table. This action cannot be undone.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Completion Notes (Optional)
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Add notes about this deployment operation completion..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowArchiveModal(false);
                    setCompletionNotes("");
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={archiveDeployments}
                  disabled={archiving}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 font-semibold flex items-center space-x-2"
                >
                  {archiving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Archiving...</span>
                    </>
                  ) : (
                    <>
                      <span>📚</span>
                      <span>Archive & Clear</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deployment Wizard Popup */}
      <DeploymentWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onDeploymentSuccess={() => {
          fetchDeployments();
          fetchActiveCount();
        }}
      />
    </div>
  );
};

export default DeploymentManagement;