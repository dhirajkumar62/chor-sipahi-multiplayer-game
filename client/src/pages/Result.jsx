import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import API from '../services/api';
import { connectSocket } from '../socket/socket';
import Layout from '../components/Layout';

export default function Result() {
  const { gameCode } = useParams();
  const [d, setD] = useState();
  const [readyCount, setReadyCount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const socket = connectSocket();

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await API.get('/game/' + gameCode);
        if (active) setD(response.data);
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || 'Could not load the round result.');
      }
    };

    const onGameState = ({ game }) => {
      if (!game) return;
      if (String(game.gameCode) === String(gameCode) && active) {
        setD((current) => ({ ...current, game: game }));
      }
    };

    const onRematchReady = ({ game, readyCount: nextReadyCount }) => {
      if (active) {
        setReadyCount(nextReadyCount || 0);
        if (game && String(game.gameCode) === String(gameCode)) {
          navigate('/game/' + gameCode);
        }
      }
    };

    socket.on('game_state', onGameState);
    socket.on('rematch_ready', onRematchReady);
    load();
    return () => {
      active = false;
      socket.off('game_state', onGameState);
      socket.off('rematch_ready', onRematchReady);
    };
  }, [gameCode, navigate, socket]);

  const winner = useMemo(() => d?.results?.find((item) => item.winner), [d]);
  const totalPlayers = d?.game?.players?.length || 4;
  const readyPlayers = d?.game?.rematchVotes?.length || readyCount || 0;

  const voteRematch = () => {
    setLoading(true);
    socket.emit('rematch_vote', { gameCode }, (result) => {
      setLoading(false);
      if (result?.error) setError(result.error);
      else {
        setError('');
        setReadyCount((current) => Math.max(current, result.readyCount || 0));
      }
    });
  };

  return <Layout>
    <div className="card center result-card">
      <p className="eyebrow">ROUND COMPLETE</p>
      <h1 className="title">{winner?.name || 'Round complete'} wins</h1>
      <p className="muted">All four roles are revealed. The round is over, but the room stays open for another match.</p>
    </div>
    <div className="spacer" />
    <div className="card table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Role</th>
            <th>Result</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {d?.results?.map((player) => (
            <tr key={player.userId}>
              <td data-label="Player">{player.name}{player.winner ? ' 🏆' : ''}</td>
              <td data-label="Role">{player.role}</td>
              <td data-label="Result">{(player.result || '').replaceAll('_', ' ')}</td>
              <td data-label="Points">{player.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="spacer" />
      <div className="card result-rematch-card">
        <p className="eyebrow">Ready for another round?</p>
        <h2 className="title">{readyPlayers}/{totalPlayers} players ready</h2>
        <div className="actions">
          <button className="button" type="button" onClick={voteRematch} disabled={loading}>{loading ? 'Updating…' : 'Play Again'}</button>
          <Link className="button secondary" to="/dashboard">Return to Dashboard</Link>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <p className="muted">Waiting for all players to confirm before the next round starts in this room.</p>
      </div>
    </div>
  </Layout>;
}
