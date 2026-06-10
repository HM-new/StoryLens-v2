import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminList from './AdminList';
import AdminStory from './AdminStory';
import './admin.css';

function AdminApp() {
  return (
    <div className="admin-root">
      <Routes>
        <Route path="/" element={<AdminList />} />
        <Route path="/stories/:id" element={<AdminStory />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('admin-root')!).render(
  <React.StrictMode>
    <HashRouter>
      <AdminApp />
    </HashRouter>
  </React.StrictMode>
);
