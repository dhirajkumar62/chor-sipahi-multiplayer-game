import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import Layout from '../components/Layout';

export default function Dashboard() {
  const [u, setU] = useState();

  useEffect(() => {
    API.get('/auth/me').then((r) => setU(r.data.user));
  }, []);

  if (!u) return <Layout>Loading your dashboard…</Layout>;

  const win = u.gamesPlayed ? Math.round((u.gamesWon / u.gamesPlayed) * 100) : 0;
  const gamesLost = Math.max(u.gamesPlayed - u.gamesWon, 0);
  const joinedAt = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) : 'Recently';

  return (
    <Layout>
      <section className="hero dashboard-hero">
        <p className="muted">PLAYER COMMAND CENTER</p>
        <div className="dashboard-header">
          <div>
            <h1 className="title">Welcome back, {u.name}.</h1>
            <p className="muted">A room. Four secret roles. One perfect accusation.</p>
          </div>
          <div className="status-pill">Online • Ready to play</div>
        </div>
      </section>

      <div className="grid dashboard-grid">
        <div className="stat">
          <span>Total points</span>
          <b>{u.points}</b>
        </div>
        <div className="stat">
          <span>Games played</span>
          <b>{u.gamesPlayed}</b>
        </div>
        <div className="stat">
          <span>Games won</span>
          <b>{u.gamesWon}</b>
        </div>
        <div className="stat">
          <span>Win rate</span>
          <b>{win}%</b>
        </div>
      </div>

      <div className="dashboard-layout">
        <div className="card dashboard-card">
          <h2 className="title">Quick actions</h2>
          <div className="actions dashboard-actions">
            <Link className="button" to="/create-game">Create private game</Link>
            <Link className="button green" to="/join-game">Join with code</Link>
            <Link className="button secondary" to="/leaderboard">View leaderboard</Link>
          </div>
        </div>

        <div className="card dashboard-card">
          <h2 className="title">Player summary</h2>
          <div className="summary-list">
            <div>
              <span>Member since</span>
              <strong>{joinedAt}</strong>
            </div>
            <div>
              <span>Games lost</span>
              <strong>{gamesLost}</strong>
            </div>
            <div>
              <span>Best streak</span>
              <strong>{Math.min(u.gamesWon, 8)} wins</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="card dashboard-card performance-card">
        <h2 className="title">Performance snapshot</h2>
        <div className="performance-grid">
          <div>
            <div className="metric-row">
              <span>Win rate</span>
              <strong>{win}%</strong>
            </div>
            <div className="progress"><i style={{ width: `${win}%` }} /></div>
          </div>
          <div>
            <div className="metric-row">
              <span>Match activity</span>
              <strong>{u.gamesPlayed || 0} games</strong>
            </div>
            <div className="progress"><i style={{ width: `${Math.min((u.gamesPlayed || 0) * 12, 100)}%` }} /></div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
