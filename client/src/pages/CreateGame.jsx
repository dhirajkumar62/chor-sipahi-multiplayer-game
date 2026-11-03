import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Layout from '../components/Layout';

export default function CreateGame() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const create = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await API.post('/game/create');
      navigate('/lobby/' + response.data.game.gameCode);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not create a room. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return <Layout>
    <section className="card create-room-card">
      <div className="create-room-art" aria-hidden="true">♛</div>
      <p className="eyebrow">Host a private match</p>
      <h1 className="title">Bring your friends to the table.</h1>
      <p className="muted">Create a room and get a shareable code. Your friends can join from their own devices.</p>
      <div className="create-room-details">
        <span><b>4</b> players per room</span>
        <span><b>1</b> shared invite code</span>
        <span><b>0</b> setup required</span>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <button disabled={busy} onClick={create}>{busy ? 'Setting up your room…' : 'Create private room'}</button>
      <p className="create-room-footnote">You’ll be able to invite players from the lobby.</p>
    </section>
  </Layout>;
}
