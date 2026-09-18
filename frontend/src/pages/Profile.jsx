import React, { useEffect, useState } from 'react';
import api from '../api';

export default function Profile() {
  const [profile, setProfile] = useState({});
  const [newSkill, setNewSkill] = useState('');
  const [message, setMessage] = useState('');

  const loadProfile = async () => {
    const res = await api.get('/users/me');
    setProfile(res.data);
  };

  useEffect(() => { loadProfile(); }, []);

  const handleChange = (field) => (e) => setProfile({ ...profile, [field]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.put('/users/me', {
        fullName: profile.full_name,
        education: profile.education,
        experienceYears: profile.experience_years,
        preferredRole: profile.preferred_role,
        location: profile.location,
        bio: profile.bio,
      });
      setMessage('Profile updated.');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Update failed.');
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;
    await api.post('/users/skills', { skillName: newSkill.trim() });
    setNewSkill('');
    loadProfile();
  };

  const handleRemoveSkill = async (skillId) => {
    await api.delete(`/users/skills/${skillId}`);
    loadProfile();
  };

  return (
    <div className="container">
      <h2>My Profile</h2>
      <div className="card">
        <form onSubmit={handleSave}>
          <label>Full Name</label>
          <input value={profile.full_name || ''} onChange={handleChange('full_name')} />
          <label>Education</label>
          <input value={profile.education || ''} onChange={handleChange('education')} placeholder="e.g. B.Tech Computer Science" />
          <label>Experience (years)</label>
          <input type="number" step="0.5" value={profile.experience_years || 0} onChange={handleChange('experience_years')} />
          <label>Preferred Role</label>
          <input value={profile.preferred_role || ''} onChange={handleChange('preferred_role')} placeholder="e.g. Backend Developer" />
          <label>Location</label>
          <input value={profile.location || ''} onChange={handleChange('location')} placeholder="e.g. Hyderabad" />
          <label>Bio</label>
          <textarea rows={3} value={profile.bio || ''} onChange={handleChange('bio')} />
          {message && <p>{message}</p>}
          <button className="btn" type="submit">Save Profile</button>
        </form>
      </div>

      <div className="card">
        <h3>Skills</h3>
        <div>
          {(profile.skills || []).map((s) => (
            <span className="badge" key={s.id}>
              {s.name} <span style={{ cursor: 'pointer' }} onClick={() => handleRemoveSkill(s.id)}>✕</span>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Add a skill e.g. Python" style={{ margin: 0 }} />
          <button className="btn" type="button" onClick={handleAddSkill}>Add</button>
        </div>
      </div>
    </div>
  );
}
