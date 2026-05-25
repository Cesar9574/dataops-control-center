import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Connections from './pages/Connections';
import Metrics from './pages/Metrics';
import Queries from './pages/Queries';
import Backups from './pages/Backups';
import Alerts from './pages/Alerts';
import Replication from './pages/Replication';
import Cache from './pages/Cache';

const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/connections" element={<PrivateRoute><Connections /></PrivateRoute>} />
        <Route path="/metrics" element={<PrivateRoute><Metrics /></PrivateRoute>} />
        <Route path="/queries" element={<PrivateRoute><Queries /></PrivateRoute>} />
        <Route path="/backups" element={<PrivateRoute><Backups /></PrivateRoute>} />
        <Route path="/alerts" element={<PrivateRoute><Alerts /></PrivateRoute>} />
        <Route path="/replication" element={<PrivateRoute><Replication /></PrivateRoute>} />
        <Route path="/cache" element={<PrivateRoute><Cache /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;