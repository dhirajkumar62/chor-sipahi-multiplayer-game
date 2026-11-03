import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import Layout from '../components/Layout';

function formatResult(result = '') {
  return result.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function Dashboard() {
  const [user, setUser] = useState();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    API.get('/auth/me').then((response) => setUser(response.data.user));
    API.get('/game/history').then((response) => setHistory(response.data.histories || [])).catch(() => setHistory([]));
  }, []);

  const roleCounts = useMemo(() => history.reduce((counts, game) => {
    if (game.role) counts[game.role] = (counts[game.role] || 0) + 1;
    return counts;
  }, {}), [history]);

  if (!user) return <Layout><div className="card dashboard-loading">Loading your dashboard…</div></Layout>;

  const played = Number(user.gamesPlayed) || 0;
  const won = Number(user.gamesWon) || 0;
  const otherResults = Math.max(played - won, 0);
  const winRate = played ? Math.round((won / played) * 100) : 0;
  const joinedAt = user.createdAt ? new Date(user.createdAt) : null;
  const roles = ['RAJA', 'SIPAHI', 'CHOR', 'OTHER'];
  const maxRoleCount = Math.max(...roles.map((role) => roleCounts[role] || 0), 1);
  const topRole = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const recentGames = history.slice(0, 3);

  return <Layout>
    <div className="dashboard-page">
      <section className="hero dashboard-hero">
        <p className="muted">PLAYER COMMAND CENTER</p>
        <div className="dashboard-header">
          <div>
            <h1 className="title">Welcome back, {user.name}.</h1>
            <p className="muted">Your table is ready. Bring your friends and make your next move.</p>
          </div>
          <div className="status-pill"><i /> Ready to play</div>
        </div>
      </section>

      <section className="grid dashboard-grid" aria-label="Career statistics">
        <article className="stat dashboard-stat"><span>Total points</span><b>{Number(user.points) || 0}</b><small>All time score</small></article>
        <article className="stat dashboard-stat"><span>Games played</span><b>{played}</b><small>Completed rounds</small></article>
        <article className="stat dashboard-stat"><span>Games won</span><b>{won}</b><small>Victories earned</small></article>
        <article className="stat dashboard-stat"><span>Win rate</span><b>{winRate}%</b><small>{otherResults} other {otherResults === 1 ? 'result' : 'results'}</small></article>
      </section>

      <section className="dashboard-primary-grid">
        <article className="card dashboard-card dashboard-actions-card">
          <p className="eyebrow">Ready when you are</p>
          <h2 className="title">Get a game going</h2>
          <p className="muted">Host a private room or join a friend with their invite code.</p>
          <div className="actions dashboard-actions">
            <Link className="button" to="/create-game">Create private game</Link>
            <Link className="button green" to="/join-game">Join with code</Link>
          </div>
        </article>

        <article className="card dashboard-card dashboard-member-card">
          <div className="dashboard-member-icon" aria-hidden="true">{user.name?.trim()?.charAt(0)?.toUpperCase() || '?'}</div>
          <div><p className="eyebrow">Your account</p><h2>{user.name}</h2><p className="muted">{user.email}</p></div>
          <div className="dashboard-member-meta"><span>Member since</span><strong>{joinedAt ? joinedAt.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '—'}</strong></div>
          <Link className="profile-text-link" to="/profile">View profile <span aria-hidden="true">→</span></Link>
        </article>
      </section>

      <section className="dashboard-secondary-grid">
        <article className="card dashboard-card performance-card">
          <div className="profile-section-heading">
            <div><p className="eyebrow">Your record</p><h2 className="title">Performance snapshot</h2></div>
            <Link className="profile-text-link" to="/leaderboard">Rankings <span aria-hidden="true">→</span></Link>
          </div>
          <div className="dashboard-performance-metrics">
            <div className="dashboard-metric">
              <div className="metric-row"><span>Win rate</span><strong>{winRate}%</strong></div>
              <div className="progress" role="progressbar" aria-label="Win rate" aria-valuenow={winRate} aria-valuemin="0" aria-valuemax="100"><i style={{ width: `${winRate}%` }} /></div>
            </div>
            <div className="dashboard-metric">
              <div className="metric-row"><span>Games completed</span><strong>{played}</strong></div>
              <div className="progress" role="progressbar" aria-label="Games completed" aria-valuenow={Math.min(played, 20)} aria-valuemin="0" aria-valuemax="20"><i style={{ width: `${Math.min(played * 5, 100)}%` }} /></div>
              <small className="dashboard-hint">Activity progress</small>
            </div>
          </div>
          <div className="dashboard-facts">
            <span><i className="record-dot wins" />Wins <b>{won}</b></span>
            <span><i className="record-dot losses" />Other results <b>{otherResults}</b></span>
            <span>Most played role <b>{topRole || '—'}</b></span>
          </div>
        </article>

        <article className="card dashboard-card role-card">
          <div className="profile-section-heading"><div><p className="eyebrow">Your rounds</p><h2 className="title">Role breakdown</h2></div></div>
          {history.length ? <div className="role-breakdown">{roles.map((role) => {
            const count = roleCounts[role] || 0;
            return <div className="role-breakdown-row" key={role}><span>{role}</span><div><i style={{ width: `${(count / maxRoleCount) * 100}%` }} /></div><b>{count}</b></div>;
          })}</div> : <p className="muted dashboard-empty-note">Your role stats will appear after you complete a game.</p>}
        </article>
      </section>

      <section className="card dashboard-card dashboard-recent-card">
        <div className="profile-section-heading">
          <div><p className="eyebrow">Latest activity</p><h2 className="title">Recent games</h2></div>
          <Link className="profile-text-link" to="/history">View history <span aria-hidden="true">→</span></Link>
        </div>
        {recentGames.length ? <div className="dashboard-recent-list">{recentGames.map((game) => <div className="recent-game" key={game._id}>
          <span className="recent-game-mark" aria-hidden="true">♛</span>
          <span className="recent-game-info"><strong>{game.gameId?.gameCode || 'Completed game'}</strong><small>{game.createdAt ? new Date(game.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date unavailable'} · {game.role || 'Player'}</small></span>
          <span className={`recent-game-result ${String(game.result).toLowerCase().includes('win') ? 'is-win' : ''}`}>{formatResult(game.result) || 'Complete'}<small>{Number(game.points) > 0 ? `+${game.points}` : game.points ?? 0} pts</small></span>
        </div>)}</div> : <div className="dashboard-empty-activity"><p className="muted">No completed games yet. Your match activity will appear here.</p><Link className="button secondary" to="/create-game">Create your first game</Link></div>}
      </section>
    </div>
  </Layout>;
}
