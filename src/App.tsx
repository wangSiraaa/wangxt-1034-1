import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ClubDashboard } from './pages/club/Dashboard';
import { ClubCourses } from './pages/club/Courses';
import { NewCourse } from './pages/club/NewCourse';
import { AdminDashboard } from './pages/admin/Dashboard';
import { Approvals } from './pages/admin/Approvals';
import { Venues } from './pages/admin/Venues';
import { Scheduling } from './pages/admin/Scheduling';
import { BlacklistPage } from './pages/admin/Blacklist';
import { ResidentDashboard } from './pages/resident/Dashboard';
import { ResidentCourses } from './pages/resident/Courses';
import { MyRegistrations } from './pages/resident/MyRegistrations';
import { CheckInCenter } from './pages/resident/CheckInCenter';
import { NotificationsPage } from './pages/Notifications';
import { CourseDetail } from './pages/CourseDetail';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/resident/dashboard" replace />} />
        <Route path="club">
          <Route path="dashboard" element={<ClubDashboard />} />
          <Route path="courses" element={<ClubCourses />} />
          <Route path="courses/new" element={<NewCourse />} />
        </Route>
        <Route path="admin">
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="venues" element={<Venues />} />
          <Route path="scheduling" element={<Scheduling />} />
          <Route path="blacklist" element={<BlacklistPage />} />
        </Route>
        <Route path="resident">
          <Route path="dashboard" element={<ResidentDashboard />} />
          <Route path="courses" element={<ResidentCourses />} />
          <Route path="my" element={<MyRegistrations />} />
          <Route path="checkin" element={<CheckInCenter />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
        <Route path="course/:id" element={<CourseDetail />} />
        <Route path="*" element={<Navigate to="/resident/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
