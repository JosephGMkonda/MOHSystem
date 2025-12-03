

const Help = () => {
  
  const supportContacts = [
    {
      id: 1,
      name: 'Joseph Mkonda',
      position: 'Assistance Developer',
      department: 'IT Department',
      email: 'josephmkonda@gmail.com',
      phone: '+265 888945765',
      whatsapp: '+265 888945765',
      availability: '24/7 Emergency Support',
      photoColor: 'bg-blue-100', 
    },
    {
      id: 2,
      name: 'Chifundo Bita',
      position: 'Assistance Developer',
      department: 'IT Department',
      email: 'bitachifundo12@gmail.com',
      phone: '+265 998 345 999',
      whatsapp: '+265 998 345 999',
      availability: '24/7 Emergency Support',
      photoColor: 'bg-green-100',
    },
 
  ];




  const handleCall = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleEmail = (email) => {
    window.location.href = `mailto:${email}`;
  };

  const handleWhatsApp = (phoneNumber) => {
    const message = encodeURIComponent('Hello, I need assistance with the Malawi MOH Outbreak Response System.');
    window.open(`https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            Help & Support Center
          </h1>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Get assistance with the Malawi Ministry of Health Outbreak Response System. 
            Our support team is here to help you 24/7.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 md:gap-8">
          {/* Left Column - Contact Cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-blue-100 rounded-lg mr-4">
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Direct Support Contacts</h2>
                  <p className="text-gray-600">Reach out to our dedicated support team</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {supportContacts.map((contact) => (
                  <div 
                    key={contact.id} 
                    className="bg-gradient-to-br from-white to-blue-50 rounded-xl p-5 border border-blue-200 hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="flex items-start mb-4">
                      <div className={`${contact.photoColor} w-14 h-14 rounded-full flex items-center justify-center mr-4`}>
                        <span className="text-xl font-semibold text-gray-700">
                          {contact.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{contact.name}</h3>
                        <p className="text-blue-600 font-medium">{contact.position}</p>
                        <p className="text-sm text-gray-500">{contact.department}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          ⏰ {contact.availability}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => handleCall(contact.phone)}
                        className="w-full flex items-center justify-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-lg transition-colors duration-200 border border-blue-200"
                      >
                        <span>📞</span>
                        <span>Call: {contact.phone}</span>
                      </button>

                      <button
                        onClick={() => handleEmail(contact.email)}
                        className="w-full flex items-center justify-center space-x-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg transition-colors duration-200 border border-gray-200"
                      >
                        <span>✉️</span>
                        <span>Email: {contact.email}</span>
                      </button>

                      <button
                        onClick={() => handleWhatsApp(contact.whatsapp)}
                        className="w-full flex items-center justify-center space-x-2 bg-green-50 hover:bg-green-100 text-green-700 py-2 rounded-lg transition-colors duration-200 border border-green-200"
                      >
                        <span>💬</span>
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          
          </div>

          
         
        </div>

        
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Malawi Ministry of Health - Outbreak Response System Support</p>
          <p className="mt-1">Last updated: {new Date().toLocaleDateString()}</p>
          <p>Developed by Chifundo Bita and Joseph Mkonda</p>
        </div>
      </div>
    </div>
  );
};

export default Help;