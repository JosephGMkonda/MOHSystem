import React, { useEffect, useState } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { Loader2 } from "lucide-react";

const Deployment = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCovidData = async () => {
      try {
        const response = await axios.get("https://disease.sh/v3/covid-19/historical/Malawi?lastdays=all");

        const timeline = response.data.timeline;
        const formatted = Object.keys(timeline.cases)
          .map((date) => {
            const [month, day, year] = date.split("/");
            const fullYear = parseInt(`20${year}`, 10);
            if (fullYear === 2020) {
              return {
                date: `${day.padStart(2, "0")}/${month.padStart(2, "0")}/2020`,
                cases: timeline.cases[date],
                deaths: timeline.deaths[date],
                recovered: timeline.recovered[date],
              };
            }
            return null;
          })
          .filter(Boolean);

        setData(formatted);
      } catch (err) {
        console.error("Error fetching COVID data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCovidData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-2 text-gray-600">Loading Malawi COVID-19 Data...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        COVID-19 Deployment Dashboard — Malawi (2020)
      </h1>

      <div className="bg-white shadow-md rounded-2xl border border-gray-100">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-700">
            Cases, Recoveries, and Deaths in 2020
          </h2>
        </div>

        <div className="p-4">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={30} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="cases" stroke="#3b82f6" name="Cases" dot={false} />
              <Line type="monotone" dataKey="recovered" stroke="#10b981" name="Recovered" dot={false} />
              <Line type="monotone" dataKey="deaths" stroke="#ef4444" name="Deaths" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Deployment;
