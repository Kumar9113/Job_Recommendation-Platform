import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

export default function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      const jobRes = await api.get(`/jobs/${id}`);
      setJob(jobRes.data);
      try {
        const explainRes = await api.get(`/recommendations/${id}`);
        setExplanation(explainRes.data);
      } catch (err) {
        // explanation is optional; ignore failure
      }
    }
    load();
  }, [id]);

  const handleApply = async () => {
    try {
      await api.post(`/jobs/${id}/apply`);
      setMessage('Application submitted!');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Could not apply.');
    }
  };

  if (!job) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <div className="card">
        <h2>{job.title}</h2>
        <p><strong>{job.company}</strong> — {job.location} — {job.experience_required}+ yrs exp</p>
        <div>{(job.requiredSkills || []).map((s) => <span className="badge" key={s.id}>{s.name}</span>)}</div>
        <p style={{ marginTop: 14 }}>{job.description}</p>
        {message && <p>{message}</p>}
        <button className="btn" onClick={handleApply}>Apply Now</button>
      </div>

      {explanation && (
        <div className="card">
          <h3>Why this job might suit you</h3>
          <div className="score-bar"><div className="score-fill" style={{ width: `${explanation.similarityScore * 100}%` }} /></div>
          <small>Similarity score: {(explanation.similarityScore * 100).toFixed(1)}%</small>
          <div className="reason-list">
            {explanation.reasons?.map((r, i) => <div key={i}>• {r}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}
