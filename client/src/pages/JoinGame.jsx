import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import Layout from '../components/Layout';

export default function JoinGame() {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/auth/me').then((response) => setName(response.data.user.name)).catch(() => setError('Could not load your player profile. Please sign in again.'));
  }, []);

  const join = async (event) => {
    event.preventDefault();
    setJoining(true);
    setError('');
    try {
      await API.post('/game/join', { gameCode: code.trim().toUpperCase() });
      navigate('/lobby/' + code.trim().toUpperCase());
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not join this room. Check the code and try again.');
    } finally {
      setJoining(false);
    }
  };

  return <Layout><form className="card auth join-room-form" onSubmit={join}>
    <Link className="join-back" to="/dashboard" aria-label="Back to dashboard">← <span>Back</span></Link>
    <p className="eyebrow">JOIN YOUR FRIENDS</p>
    <h1 className="title">Enter a room</h1>
    <p className="muted">Use the six-character code shared by the host.</p>
    {error && <p className="error" role="alert">{error}</p>}
    <label htmlFor="room-code">Room code</label>
    <input id="room-code" autoComplete="off" autoCapitalize="characters" required minLength={6} maxLength={6} value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="ABC123" />
    <label htmlFor="player-name">Your name</label>
    <input id="player-name" value={name} readOnly aria-describedby="name-note" />
    <p className="muted join-name-note" id="name-note">Your account name is shown to the other players.</p>
    <button disabled={joining || !name}>{joining ? 'Joining…' : 'Join room'}</button>
  </form></Layout>;
}
