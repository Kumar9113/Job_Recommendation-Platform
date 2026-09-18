import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, recRes, appRes] = await Promise.all([
          api.get('/users/me'),
          api.get('/recommendations?topK=3'),
          api.get('/applications'),
        ]);
        setProfile(profileRes.data);
        setRecommendations(recRes.data.recommendations);
        setApplications(appRes.data.applications.slice(0, 3));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="container">Loading dashboard...</div>;

  return (
    <div className="container">
      <h2>Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}</h2>

      <div className="card">
        <h3>Profile Summary</h3>
        <p><strong>Preferred Role:</strong> {profile?.preferred_role || 'Not set'}</p>
        <p><strong>Location:</strong> {profile?.location || 'Not set'}</p>
        <p><strong>Experience:</strong> {profile?.experience_years || 0} years</p>
        <div>
          {(profile?.skills || []).map((s) => (
            <span className="badge" key={s.id}>{s.name}</span>
          ))}
        </div>
        <Link to="/profile"><button className="btn" style={{ marginTop: 10 }}>Edit Profile</button></Link>
      </div>

      <div className="card">
        <h3>Top Recommended Jobs</h3>
        {recommendations.length === 0 && <p>No recommendations yet. Add skills to your profile first.</p>}
        {recommendations.map((job) => (
          <div key={job.id} style={{ marginBottom: 14, borderBottom: '1px solid #eee', paddingBottom: 10 }}>
            <strong>{job.title}</strong> at {job.company} ({job.location})
            <div className="score-bar"><div className="score-fill" style={{ width: `${job.similarityScore * 100}%` }} /></div>
            <small>Similarity: {(job.similarityScore * 100).toFixed(1)}%</small>
            <div className="reason-list">
              {job.reasons?.map((r, i) => <div key={i}>• {r}</div>)}
            </div>
          </div>
        ))}
        <Link to="/recommendations"><button className="btn">See All Recommendations</button></Link>
      </div>

      <div className="card">
        <h3>Recent Applications</h3>
        {applications.length === 0 && <p>You haven't applied to any jobs yet.</p>}
        {applications.map((app) => (
          <div key={app.id}>
            {app.title} at {app.company} — <em>{app.status}</em>
          </div>
        ))}
        <Link to="/applications"><button className="btn" style={{ marginTop: 10 }}>View All</button></Link>
      </div>
    </div>
  );
}
