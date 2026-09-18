import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function JobSearch() {
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({ title: '', skill: '', location: '', page: 1 });
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [message, setMessage] = useState('');

  const search = async (e) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (filters.title) params.append('title', filters.title);
    if (filters.skill) params.append('skill', filters.skill);
    if (filters.location) params.append('location', filters.location);
    params.append('page', filters.page);
    params.append('limit', 10);

    const res = await api.get(`/jobs?${params.toString()}`);
    setJobs(res.data.jobs);
  };

  useEffect(() => { search(); }, [filters.page]); // eslint-disable-line

  const handleApply = async (jobId) => {
    try {
      await api.post(`/jobs/${jobId}/apply`);
      setAppliedIds(new Set([...appliedIds, jobId]));
      setMessage('Application submitted!');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Could not apply.');
    }
  };

  return (
    <div className="container">
      <h2>Browse Jobs</h2>
      <div className="card">
        <form onSubmit={search} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label>Title</label>
            <input value={filters.title} onChange={(e) => setFilters({ ...filters, title: e.target.value })} placeholder="e.g. Backend" style={{ margin: 0 }} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label>Skill</label>
            <input value={filters.skill} onChange={(e) => setFilters({ ...filters, skill: e.target.value })} placeholder="e.g. Python" style={{ margin: 0 }} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label>Location</label>
            <input value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} placeholder="e.g. Hyderabad" style={{ margin: 0 }} />
          </div>
          <button className="btn" type="submit" style={{ height: 38 }}>Search</button>
        </form>
      </div>

      {message && <p>{message}</p>}

      {jobs.map((job) => (
        <div className="card" key={job.id}>
          <h3><Link to={`/jobs/${job.id}`}>{job.title}</Link></h3>
          <p>{job.company} — {job.location} — {job.experience_required}+ yrs exp</p>
          <p>{job.description.slice(0, 140)}...</p>
          <button className="btn" disabled={appliedIds.has(job.id)} onClick={() => handleApply(job.id)}>
            {appliedIds.has(job.id) ? 'Applied' : 'Apply'}
          </button>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button className="btn btn-secondary" disabled={filters.page === 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Previous</button>
        <button className="btn btn-secondary" onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</button>
      </div>
    </div>
  );
}
