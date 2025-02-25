//app.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Projects from './components/Projects';
import Tasks from './components/KanbanBoard';
import LoginPage from './components/LoginPage';
import Overview from './components/Overview';
import RegistrationPage from './components/RegistrationPage';

import AdminPanel from './components/AdminPanel';
import Organization from './components/Organization';
import ResetPassword from './components/ResetPassword';
import KanbanBoard from './components/KanbanBoard';

import SuccessPage from './components/SuccessPage';
import Calendar from './components/Calendar';
import AuditLog from './components/Auditlog';
import Teamsorg from './components/Teamsorg';
import TeamMembersPage from './components/TeamMembersPage';
import RulesButton from './components/RulePage';
import RenameCardPage from './Pages/RenameCardPage';
import CalendarDateDetails from './Pages/CalendarDateDetails'
import ForgotPasswordPage from './Pages/ForgotPasswordPage'
import ResetForgotPassword from './Pages/ResetForgotPassword'
import StatusSheet from './Pages/StatusSheet'
import Timesheet from './Pages/Timesheet';
import TimesheetDetails from './Pages/TimesheetDetails';





const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('token') !== null;
  });
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const handleLogin = () => {
    setIsLoggedIn(true);
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path='/login' element={<LoginPage onLogin={handleLogin} />} />
        <Route path='/register' element={<RegistrationPage />} />
        <Route path='/Organization' element={<Organization />} />
        <Route path='/reset-password' element={<ResetPassword />} />
        <Route path='/success' element={<SuccessPage />} />
        <Route path="/forgotPassword" element={<ForgotPasswordPage />} />
        <Route path="/forgot-password" element={<ResetForgotPassword />} />
        <Route
          path="/*"
          element={
            isLoggedIn ? (
              <Layout isLoggedIn={isLoggedIn} user={user} onLogout={handleLogout}>
                <Routes>
                  <Route path="projects" element={<Projects />} />
                  <Route path="/projects/:projectId/tasks" element={<KanbanBoard user={user} />} />
                  <Route path="/" element={<Overview />} />
                  {/* <Route path='/tasks' element={<TasksPage user={user} />} />  */}
                  <Route path='/members' element={<AdminPanel />} />
                  {/* <Route path="/projects/:projectId/teams" element={<Teams/>} /> */}
                  <Route path='/calendar' element={<Calendar />} />
                  <Route path="/projects/:projectId/view" element={<KanbanBoard user={user} />} />
                  <Route path="/Auditlog" element={<AuditLog />} />
                  <Route path="/Teamsorg" element={<Teamsorg />} />
                  <Route path="/teams/:teamId/members" element={<TeamMembersPage />} />
                  <Route path="/Rules" element={<RulesButton />} />
                  <Route path="/calendar/:organizationId/:date" element={<CalendarDateDetails />} />
                  <Route path="/rename-card/:columnId/cards/:cardId" element={<RenameCardPage />} />
                  <Route path="/statussheet" element={<StatusSheet />} />
                  <Route path='/timesheet' element={<Timesheet />} />

                  <Route path="/timesheetdetails/:timesheetId" element={<TimesheetDetails />} />

                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
