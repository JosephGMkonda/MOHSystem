import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { authAxios } from "../utils/auth";

const DeploymentHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await authAxios.get("deployment-history/");
      setHistory(response.data);
    } catch (err) {
      console.error("Failed to fetch deployment history:", err);
      setError("Failed to load deployment history.");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(40, 53, 147);
    doc.text("DEPLOYMENT HISTORY REPORT - MINISTRY OF HEALTH", 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 35);
    doc.text(`Total Historical Deployments: ${history.length}`, 14, 45);

    const tableData = history.map(record => [
      record.hcw_name,
      record.outbreak_type,
      record.district_name,
      record.start_date,
      record.archived_at.split('T')[0],
      record.role
    ]);

    doc.autoTable({
      startY: 55,
      head: [['Healthcare Worker', 'Outbreak', 'District', 'Start Date', 'Archived Date', 'Role']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [40, 53, 147] },
      styles: { fontSize: 8, cellPadding: 2 }
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Ministry of Health - Malawi Outbreak Response System", 105, finalY, { align: 'center' });

    doc.save(`deployment-history-${new Date().toISOString().split('T')[0]}.pdf`);
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📚 Deployment History
          </h1>
          <p className="text-gray-600">
            Historical record of all completed deployment operations
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-500 text-lg mr-3">⚠️</div>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">
                Historical Records
              </h2>
              <p className="text-gray-600 text-sm">
                {history.length} deployment records in history
              </p>
            </div>
            <button
              onClick={generatePDF}
              disabled={history.length === 0}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold flex items-center space-x-2"
            >
              <span>📄</span>
              <span>Export History PDF</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading deployment history...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                No Deployment History
              </h3>
              <p className="text-gray-600">
                Archived deployments will appear here
              </p>
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
                      Contact
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
                      Archived Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {record.hcw_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.hcw_position}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm space-y-1">
                          {record.hcw_phone && (
                            <div className="text-gray-600">📞 {record.hcw_phone}</div>
                          )}
                          {record.hcw_email && (
                            <div className="text-gray-600 text-xs">✉️ {record.hcw_email}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOutbreakColor(record.outbreak_type)}`}>
                          {record.outbreak_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {record.district_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {new Date(record.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {new Date(record.archived_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {record.role}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeploymentHistory;