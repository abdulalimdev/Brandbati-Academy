import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { QuestionManagement } from './pages/QuestionManagement';
import { ExamEngine } from './pages/ExamEngine';
import { PaymentSystem } from './pages/PaymentSystem';
import { Results } from './pages/Results';
import { Layout } from './components/Layout';

function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white p-12 card-rounded shadow-xl text-center max-w-md">
        <h1 className="text-4xl font-bold text-red-500 mb-4">403</h1>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Unauthorized Access</h2>
        <p className="text-slate-500 mb-8">You do not have permission to view this page.</p>
        <button 
          onClick={() => window.history.back()}
          className="bg-brand-teal text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-brand-teal/20"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/exams" element={
            <ProtectedRoute allowedRoles={['student', 'teacher']}>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/exam/:examId" element={
            <ProtectedRoute allowedRoles={['student']}>
              <ExamEngine />
            </ProtectedRoute>
          } />

          <Route path="/teacher/exam/:examId/questions" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <QuestionManagement />
            </ProtectedRoute>
          } />

          <Route path="/payments" element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <PaymentSystem />
            </ProtectedRoute>
          } />

          <Route path="/results" element={
            <ProtectedRoute allowedRoles={['student', 'teacher', 'parent']}>
              <Results />
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
