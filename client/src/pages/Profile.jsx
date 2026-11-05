import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import Layout from '../components/Layout';

function formatResult(result = '') {
  return result.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function Profile() {
  const [user, setUser] = useState();
  const [history, setHistory] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadProfile = () => {
    API.get('/auth/me').then((response) => {
      const currentUser = response.data.user;
      setUser(currentUser);
      setForm({ name: currentUser.name || '', email: currentUser.email || '' });
    }).catch(() => {
      setUser(null);
    });
    API.get('/game/history').then((response) => setHistory(response.data.histories || [])).catch(() => setHistory([]));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (!user) return <Layout><div className="card profile-loading">Loading your profile…</div></Layout>;

  const played = Number(user.gamesPlayed) || 0;
  const won = Number(user.gamesWon) || 0;
  const lost = Math.max(played - won, 0);
  const winRate = played ? Math.round((won / played) * 100) : 0;
  const memberSince = user.createdAt ? new Date(user.createdAt) : null;
  const recentGames = history.slice(0, 4);
  const initial = user.name?.trim()?.charAt(0)?.toUpperCase() || '?';

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleEditToggle = () => {
    setError('');
    if (isEditing) {
      setForm({ name: user.name || '', email: user.email || '' });
    }
    setIsEditing((current) => !current);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);

    try {
      const response = await API.put('/auth/profile', {
        name: form.name,
        email: form.email
      });

      const nextUser = response.data.user;
      setUser(nextUser);
      setForm({ name: nextUser.name || '', email: nextUser.email || '' });
      setIsEditing(false);
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to update profile.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return <Layout>
    <div className="profile-page">
      <section className="card profile-hero" aria-labelledby="profile-name">
        <div className="profile-avatar" aria-hidden="true">{initial}</div>
        <div className="profile-identity">
          <p className="eyebrow">Player profile</p>
          {!isEditing ? <h1 className="title" id="profile-name">{user.name}</h1> : <form onSubmit={handleSave} className="profile-edit-form">
            <label>
              <span className="sr-only">Player name</span>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Player name" maxLength="40" required />
            </label>
            <label>
              <span className="sr-only">Email</span>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email address" required />
            </label>
          </form>}
          {!isEditing && <p className="muted">{user.email}</p>}
        </div>
        <div className="profile-member">
          <span>Member since</span>
          <strong>{memberSince ? memberSince.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : '—'}</strong>
          <button type="button" className="button secondary profile-edit-button" onClick={handleEditToggle}>
            {isEditing ? 'Cancel' : 'Edit profile'}
          </button>
          {isEditing && <button type="button" className="button profile-save-button" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>}
        </div>
      </section>

      {error && <div className="error">{error}</div>}

      <section className="profile-stats" aria-label="Player statistics">
        <article className="stat profile-stat"><span>Total points</span><b>{Number(user.points) || 0}</b><small>Your all time score</small></article>
        <article className="stat profile-stat"><span>Games played</span><b>{played}</b><small>Rounds completed</small></article>
        <article className="stat profile-stat"><span>Games won</span><b>{won}</b><small>Victories earned</small></article>
        <article className="stat profile-stat"><span>Win rate</span><b>{winRate}%</b><small>{lost} {lost === 1 ? 'loss' : 'losses'}</small></article>
      </section>

      <section className="profile-lower-grid">
        <article className="card profile-performance">
          <div className="profile-section-heading">
            <div><p className="eyebrow">Your progress</p><h2 className="title">Match performance</h2></div>
            <span className="profile-win-rate">{winRate}%</span>
          </div>
          <p className="muted">Win rate across {played} {played === 1 ? 'completed game' : 'completed games'}.</p>
          <div className="profile-progress" role="progressbar" aria-label="Win rate" aria-valuenow={winRate} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${winRate}%` }} /></div>
          <div className="profile-record"><span><i className="record-dot wins" />Wins <b>{won}</b></span><span><i className="record-dot losses" />Other results <b>{lost}</b></span></div>
          <Link className="profile-text-link" to="/leaderboard">View leaderboard <span aria-hidden="true">→</span></Link>
        </article>

        <article className="card profile-recent">
          <div className="profile-section-heading">
            <div><p className="eyebrow">At the table</p><h2 className="title">Recent games</h2></div>
            <Link className="profile-text-link" to="/history">Full history <span aria-hidden="true">→</span></Link>
          </div>
          {recentGames.length ? <div className="recent-game-list">
            {recentGames.map((game) => <div className="recent-game" key={game._id}>
              <span className="recent-game-mark" aria-hidden="true">♛</span>
              <span className="recent-game-info"><strong>{game.gameId?.gameCode || 'Completed game'}</strong><small>{game.createdAt ? new Date(game.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date unavailable'} · {game.role || 'Player'}</small></span>
              <span className={`recent-game-result ${String(game.result).toLowerCase().includes('win') ? 'is-win' : ''}`}>{formatResult(game.result) || 'Complete'}<small>{Number(game.points) > 0 ? `+${game.points}` : game.points ?? 0} pts</small></span>
            </div>)}
          </div> : <div className="profile-empty-history"><span aria-hidden="true">♧</span><strong>Your story starts here</strong><p className="muted">Complete a match and your recent results will show up here.</p><Link className="button" to="/create-game">Start a game</Link></div>}
        </article>
      </section>
    </div>
  </Layout>;
}
