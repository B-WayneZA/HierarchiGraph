import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/employees/EmployeeList';
import EmployeeForm from './components/employees/EmployeeForm';
import HierarchyGraph from './components/hierarchy/HierarchyGraph';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/auth/ProtectedRoute';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {isAuthenticated && <Navbar />}
        <main className={isAuthenticated ? 'pt-16' : ''}>
          <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/employees" element={
              <ProtectedRoute>
                <EmployeeList />
              </ProtectedRoute>
            } />
            
            <Route path="/employees/new" element={
              <ProtectedRoute adminOnly>
                <EmployeeForm />
              </ProtectedRoute>
            } />
            
            <Route path="/employees/:id/edit" element={
              <ProtectedRoute adminOnly>
                <EmployeeForm />
              </ProtectedRoute>
            } />
            
            <Route path="/hierarchy" element={
              <ProtectedRoute>
                <HierarchyGraph />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
