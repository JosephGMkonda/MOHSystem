import React, { useState, useEffect } from "react";
import { authAxios } from "../utils/auth";

const DeploymentWizard = ({ isOpen, onClose, onDeploymentSuccess }) => {
  const [district, setDistrict] = useState("");
  const [competency, setCompetency] = useState("");
  const [profession, setProfession] = useState("");
  const [numberNeeded, setNumberNeeded] = useState(1);
  const [hcws, setHcws] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Example static options (replace with API fetch if needed)
  const districts = ["Mzimba", "Blantyre", "Lilongwe"];
  const competencies = ["ICU", "Emergency", "Community"];
  const professions = ["Nurse", "Doctor", "Lab Technician"];

  const fetchHCWs = async () => {
    if (!district || !competency || !profession || !numberNeeded) {
      setError("Please fill all fields.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await authAxios.get("/healthcare-workers/filter/", {
        params: {
          district,
          competency,
          profession,
          limit: numberNeeded,
        },
      });
      setHcws(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch healthcare workers. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = () => {
    // Here you can call backend to create deployment if needed
    // For now, just trigger parent refresh
    onDeploymentSuccess();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-semibold mb-4">🚀 New Deployment Wizard</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">District</label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select district</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Competency</label>
            <select
              value={competency}
              onChange={(e) => setCompetency(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select competency</option>
              {competencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Profession</label>
            <select
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select profession</option>
              {professions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Number Needed</label>
            <input
              type="number"
              min={1}
              value={numberNeeded}
              onChange={(e) => setNumberNeeded(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={fetchHCWs}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold"
          >
            {loading ? "Loading..." : "Search Healthcare Workers"}
          </button>
        </div>

        {/* Result list */}
        {hcws.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Matching Healthcare Workers</h3>
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {hcws.map((h) => (
                <li key={h.id} className="border p-2 rounded-lg bg-gray-50">
                  <p className="font-medium">{h.name}</p>
                  {h.phone && <p>📞 {h.phone}</p>}
                  {h.email && <p>✉️ {h.email}</p>}
                  {h.facility_details?.name && <p>🏥 {h.facility_details.name}</p>}
                </li>
              ))}
            </ul>
            <button
              onClick={handleAssign}
              className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold"
            >
              Assign Selected
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 font-bold"
        >
          ✖
        </button>
      </div>
    </div>
  );
};

export default DeploymentWizard;
