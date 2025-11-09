import React from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import malawiGeo from "../data/malawi.geo.json";

const MalawiMap = ({ districtData = [], selectedDistrict, onDistrictClick }) => {
  const getDistrictColor = (name) => {
    const district = districtData.find((d) => d.name === name);
    const count = district ? district.total_workers : 0;

    const max = Math.max(...districtData.map((d) => d.total_workers || 0), 1);
    const ratio = count / max;

    if (ratio > 0.7) return "#DC2626";
    if (ratio > 0.4) return "#F59E0B";
    if (ratio > 0.1) return "#10B981";
    return "#3B82F6";
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Malawi Healthcare Workforce</h3>

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 5000, center: [34, -13.5] }}
        width={400}
        height={500}
      >
        <Geographies geography={malawiGeo}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const name = geo.properties.name;
              const isSelected = selectedDistrict === name;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => onDistrictClick(name)}
                  style={{
                    default: {
                      fill: getDistrictColor(name),
                      stroke: isSelected ? "#7C3AED" : "#374151",
                      strokeWidth: isSelected ? 2 : 0.5,
                      outline: "none",
                    },
                    hover: {
                      fill: "#8B5CF6",
                      stroke: "#7C3AED",
                      strokeWidth: 2,
                      cursor: "pointer",
                    },
                    pressed: { fill: "#7C3AED" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-700">
        <div className="flex items-center"><div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div>High</div>
        <div className="flex items-center"><div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>Medium</div>
        <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>Low</div>
        <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>Very Low</div>
      </div>
    </div>
  );
};

export default MalawiMap;
