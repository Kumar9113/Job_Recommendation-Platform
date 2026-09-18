import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topK, setTopK] = useState(5);

  const load = async (k) => {
    setLoading(true);
    const res = await api.get(`/recommendations?topK=${k}`);
    setRecommendations(res.data.recommendations);
    setLoading(false);
  };

  useEffect(() => { load(topK); }, [topK]); // eslint-disable-line

  return (
    <div className="container">
      <h2>Your Personalized Recommendations</h2>
      <p>
        Show top:
        <select value={topK} onChange={(e) => setTopK(Number(e.target.value))} style={{ width: 100, display: 'inline-block', marginLeft: 8 }}>
          <option value={3}>3</option>
          <option value={5}>5</option>
          <option value={10}>10</option>
        </select>
      </p>

      {loading && <p>Calculating recommendations...</p>}
      {!loading && recommendations.length === 0 && (
        <p>No recommendations yet — add some skills to your profile first.</p>
      )}

      {recommendations.map((job) => (
        <div className="card" key={job.id}>
          <h3><Link to={`/jobs/${job.id}`}>{job.title}</Link></h3>
          <p>{job.company} — {job.location}</p>
          <div className="score-bar"><div className="score-fill" style={{ width: `${job.similarityScore * 100}%` }} /></div>
          <small>Similarity score: {(job.similarityScore * 100).toFixed(1)}%</small>
          {job.matchedSkills?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {job.matchedSkills.map((s) => <span className="badge" key={s}>{s}</span>)}
            </div>
          )}
          <div className="reason-list">
            {job.reasons?.map((r, i) => <div key={i}>• {r}</div>)}
          </div>
        </div>
      ))}
    </div>
  );
}
