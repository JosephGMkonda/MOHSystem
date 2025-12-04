import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from "./components/Login";
import Home from "./components/Home";
import Sidebar from "./components/Sidebar"; 
import Topbar from "./components/Topbar";
import WorkForce from './components/WorkForce';
import Help from './components/Help';
import Configuration from './components/Configuration';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token =
  localStorage.getItem('token') ||
  localStorage.getItem('authToken') ||
  localStorage.getItem('access');

    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  localStorage.removeItem('user');

  setIsAuthenticated(false);
};


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
                <Navigate to="/home" replace /> : 
                <Login onLogin={handleLogin} />
            } 
          />
          
          
          <Route 
            path="/home" 
            element={
              isAuthenticated ? 
                <HomeLayout onLogout={handleLogout}><Home /></HomeLayout> : 
                <Navigate to="/login" replace />
            } 
          />

          <Route 
            path="/workforce" 
            element={
              isAuthenticated ? 
                <HomeLayout onLogout={handleLogout}><WorkForce /></HomeLayout> : 
                <Navigate to="/login" replace />
            } 
          />
           <Route 
            path="/Configuration" 
            element={
              isAuthenticated ? 
                <HomeLayout onLogout={handleLogout}><Configuration /></HomeLayout> : 
                <Navigate to="/login" replace />
            } 
          />

           <Route 
            path="/workforce" 
            element={
              isAuthenticated ? 
                <HomeLayout onLogout={handleLogout}><WorkForce /></HomeLayout> : 
                <Navigate to="/login" replace />
            } 
          />

          
           <Route 
            path="/help" 
            element={
              isAuthenticated ? 
                <HomeLayout onLogout={handleLogout}><Help/></HomeLayout> : 
                <Navigate to="/login" replace />
            } 
          />
       

        
          
          
          <Route 
            path="/" 
            element={
              <Navigate to={isAuthenticated ? "/home" : "/login"} replace />
            } 
          />
          
      
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}


const HomeLayout = ({ onLogout, children }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onLogout={onLogout} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default App;