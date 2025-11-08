
const ViewDetail = ({ worker, isOpen, onClose }) => {
  if (!isOpen || !worker) return null;


  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };


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

  return (
    <>
      
      <div className="fixed inset-0 bg-gradient-to-br from-blue-400/20 via-purple-500/20 to-pink-400/20 backdrop-blur-2xl backdrop-saturate-150 z-40"></div>
      
    
      <div className="fixed inset-0 z-40 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-300/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-purple-300/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}}></div>
      </div>

      
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl shadow-blue-500/10">
            
            <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl">
              
              
              <div className="bg-gradient-to-r from-blue-600/90 to-blue-700/90 backdrop-blur-sm px-6 py-4 border-b border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white drop-shadow-sm">Healthcare Worker Details</h2>
                    <p className="text-blue-100/90 text-sm drop-shadow">Complete profile information</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-white/90 hover:text-white text-2xl font-bold transition-all duration-200 hover:scale-110 backdrop-blur-sm bg-white/10 rounded-full w-8 h-8 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              </div>

    
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                
                <div className="bg-white/60 backdrop-blur-sm border border-gray-300/50 rounded-xl p-6 mb-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <p className="text-lg font-semibold text-gray-900">{worker.name}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <p className="text-lg text-gray-900">{worker.phone}</p>
                    </div>

                    {worker.rawData?.email && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p className="text-lg text-gray-900">{worker.rawData.email}</p>
                      </div>
                    )}

                    {worker.rawData?.gender && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <p className="text-lg text-gray-900 capitalize">{worker.rawData.gender}</p>
                      </div>
                    )}

                    {worker.rawData?.national_id && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
                        <p className="text-lg text-gray-900">{worker.rawData.national_id}</p>
                      </div>
                    )}

                    {worker.rawData?.language && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                        <p className="text-lg text-gray-900">{worker.rawData.language}</p>
                      </div>
                    )}

                    {worker.rawData?.disability !== undefined && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Disability Status</label>
                        <p className="text-lg text-gray-900">
                          {worker.rawData.disability ? 'Person with disability' : 'No disability'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                
                <div className="bg-white/60 backdrop-blur-sm border border-gray-300/50 rounded-xl p-6 mb-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Professional Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Profession/Position</label>
                      <p className="text-lg font-semibold text-gray-900">{worker.profession}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(worker.status)}`}>
                        {formatStatus(worker.status)}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                      <p className="text-lg text-gray-900">{worker.district}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Health Facility</label>
                      <p className="text-lg text-gray-900">{worker.facility}</p>
                    </div>

                    {worker.rawData?.organization && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                        <p className="text-lg text-gray-900">{worker.rawData.organization}</p>
                      </div>
                    )}
                  </div>
                </div>

                
                <div className="bg-white/60 backdrop-blur-sm border border-gray-300/50 rounded-xl p-6 mb-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    Competencies & Training
                  </h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Skills & Competencies</label>
                    <div className="flex flex-wrap gap-2">
                      {worker.competencies && worker.competencies.length > 0 ? (
                        worker.competencies.map((comp, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200/50"
                          >
                            {comp}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No competencies recorded</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Training Date</label>
                    <p className="text-lg text-gray-900">
                      {worker.lastTraining ? formatDate(worker.lastTraining) : 'No training records'}
                    </p>
                  </div>
                </div>

                {/* Additional Information Card */}
                <div className="bg-white/60 backdrop-blur-sm border border-gray-300/50 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                    Additional Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Worker ID</label>
                      <p className="text-lg font-mono text-gray-900">#{worker.id}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Active Status</label>
                      <p className="text-lg text-gray-900">
                        {worker.rawData?.is_active !== false ? (
                          <span className="text-green-600 font-semibold">Active</span>
                        ) : (
                          <span className="text-red-600 font-semibold">Inactive</span>
                        )}
                      </p>
                    </div>

                    {worker.rawData?.created_at && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Registered Since</label>
                        <p className="text-lg text-gray-900">{formatDate(worker.rawData.created_at)}</p>
                      </div>
                    )}
                  </div>
                </div>

            
                {worker.rawData?.emergency_contact && (
                  <div className="bg-yellow-50/80 backdrop-blur-sm border border-yellow-200/60 rounded-xl p-6 mt-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      Emergency Contact
                    </h3>
                    <p className="text-lg text-yellow-800">{worker.rawData.emergency_contact}</p>
                  </div>
                )}
              </div>

             
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewDetail;