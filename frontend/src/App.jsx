import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

// Components
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddPatient from './pages/AddPatient';
import SearchPatient from './pages/SearchPatient';
import MedicineStock from './pages/MedicineStock';
import PendingDues from './pages/PendingDues';
import PrintPrescription from './pages/PrintPrescription';
import TodayPatients from './pages/TodayPatients';
import Settings from './pages/Settings';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

const AppLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <PrivateRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/add-patient" element={
          <PrivateRoute>
            <AppLayout>
              <AddPatient />
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/search-patient" element={
          <PrivateRoute>
            <AppLayout>
              <SearchPatient />
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/medicine-stock" element={
          <PrivateRoute>
            <AppLayout>
              <MedicineStock />
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/pending-dues" element={
          <PrivateRoute>
            <AppLayout>
              <PendingDues />
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/today-patients" element={
          <PrivateRoute>
            <AppLayout>
              <TodayPatients />
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/settings" element={
          <PrivateRoute>
            <AppLayout>
              <Settings />
            </AppLayout>
          </PrivateRoute>
        } />
        
        {/* Print Route without Sidebar */}
        <Route path="/print/:id" element={
          <PrivateRoute>
            <PrintPrescription />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
