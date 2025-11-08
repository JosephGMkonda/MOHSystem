

const Home = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Dashboard Overview
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">Total Healthcare Workers</h3>
          <p className="text-3xl font-bold text-blue-600">1,247</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">Active Deployments</h3>
          <p className="text-3xl font-bold text-green-600">23</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">COVID-19 Cases</h3>
          <p className="text-3xl font-bold text-orange-600">886</p>
        </div>
      </div>
      
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Welcome to Malawi Outbreak Workforce System
        </h2>
        <p className="text-gray-600">
          This system helps coordinate healthcare workers during disease outbreaks across Malawi.
        </p>
      </div>
    </div>
  );
};

export default Home;