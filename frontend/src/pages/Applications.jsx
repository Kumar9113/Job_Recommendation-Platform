import React, { useEffect, useState } from 'react';
import api from '../api';

const statusColors = {
  applied: '#e0e7ff',
  shortlisted: '#dcfce7',
  rejected: '#fee2e2',
  hired: '#fef9c3',
};

export default function Applications() {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    api.get('/applications').then((res) => setApplications(res.data.applications));
  }, []);

  return (
    <div className="container">
      <h2>My Applications</h2>
      {applications.length === 0 && <p>You haven't applied to any jobs yet.</p>}
      {applications.map((app) => (
        <div className="card" key={app.id} style={{ borderLeft: `5px solid ${statusColors[app.status] || '#ccc'}` }}>
          <h3>{app.title}</h3>
          <p>{app.company} — {app.location}</p>
          <p>Status: <strong>{app.status}</strong></p>
          <small>Applied on {new Date(app.applied_at).toLocaleDateString()}</small>
        </div>
      ))}
    </div>
  );
}
