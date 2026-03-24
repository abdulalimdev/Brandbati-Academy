import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { StudentDashboard } from './StudentDashboard';
import { TeacherDashboard } from './TeacherDashboard';
import { AdminDashboard } from './AdminDashboard';
import { ParentDashboard } from './ParentDashboard';
import { Layout } from '../components/Layout';

export function Dashboard() {
  const { profile } = useAuth();

  if (!profile) return null;

  const renderDashboard = () => {
    switch (profile.role) {
      case 'student':
        return <StudentDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'admin':
        return <AdminDashboard />;
      case 'parent':
        return <ParentDashboard />;
      default:
        return <div>Unauthorized</div>;
    }
  };

  return (
    <Layout>
      {renderDashboard()}
    </Layout>
  );
}
