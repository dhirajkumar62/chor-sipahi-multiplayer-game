import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../services/api';
import { connectSocket } from '../socket/socket';
import Layout from '../components/Layout';
import ChatPanel from '../components/ChatPanel';

function mergeMessages(current, incoming) {
  const messages = new Map(current.map((item) => [item.id, item]));
  incoming.forEach((item) => messages.set(item.id, item));
  return [...messages.values()].sort((a, b) => a.sentAt.localeCompare(b.sentAt)).slice(-100);
}

export default function GamePage() {
  const { gameCode } = useParams();
  const [game, setGame] = useState();
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState();
  const [time, setTime] = useState(60);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [turnSubmitted, setTurnSubmitted] = useState(false);
  const navigate = useNavigate();
  const socket = connectSocket();

  useEffect(() => {
    let active = true;
    let joinedSocketId = null;
    let receivedSocketGame = false;
    API.get('/auth/me').then((response) => { if (active) setUserId(String(response.data.user._id)); });
    API.get('/game/' + gameCode).then((response) => {
      if (!active) return;
      if (!receivedSocketGame) setGame(response.data.game);
      setRole(response.data.myRole);
      if (response.data.game.status === 'ended') navigate('/result/' + gameCode);
    }).catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Could not load the game.'); });

    const onChatHistory = (history) => setMessages((current) => mergeMessages(current, history || []));
    const onChatMessage = (item) => setMessages((current) => mergeMessages(current, [item]));
    const onRoleAssigned = (item) => {
      setRole(item.role);
      setSelectedTarget('');
      setTurnSubmitted(false);
    };
    const onTimerUpdate = (item) => setTime(item.timeLeft);
    const onGameState = (item) => { receivedSocketGame = true; setGame(item.game); };
    const onGameResult = () => navigate('/result/' + gameCode);
    const joinRoom = () => {
      if (!active || !socket.connected || joinedSocketId === socket.id) return;
      joinedSocketId = socket.id;
      socket.emit('join_lobby', { gameCode }, (result) => {
        if (!active) return;
        if (result?.error) { joinedSocketId = null; setError(result.error); }
        else {
          receivedSocketGame = true;
          setError('');
          setRole((current) => current || result.myRole);
          setGame(result.game);
        }
      });
    };
    socket.on('chat:message', onChatMessage);
    socket.on('chat:history', onChatHistory);
    socket.on('role_assigned', onRoleAssigned);
    socket.on('timer_update', onTimerUpdate);
    socket.on('game_state', onGameState);
    socket.on('game_result', onGameResult);
    socket.on('connect', joinRoom);
    if (socket.connected) joinRoom();
    return () => {
      active = false;
      socket.off('chat:message', onChatMessage);
      socket.off('chat:history', onChatHistory);
      socket.off('role_assigned', onRoleAssigned);
      socket.off('timer_update', onTimerUpdate);
      socket.off('game_state', onGameState);
      socket.off('game_result', onGameResult);
      socket.off('connect', joinRoom);
    };
  }, [gameCode, navigate, socket]);

  const submitGuess = () => {
    if (!selectedTarget) {
      setError('Choose a player before submitting your guess.');
      return;
    }
    if (turnSubmitted) {
      setError('You already submitted this round.');
      return;
    }
    const eventName = role === 'MANTRI' ? 'mantri_guess' : 'make_guess';
    const payload = role === 'MANTRI' ? { gameCode, suspectId: selectedTarget } : { gameCode, accusedId: selectedTarget };
    socket.emit(eventName, payload, (result) => {
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError('');
      setTurnSubmitted(true);
    });
  };

  const canGuess = role === 'SIPAHI' || role === 'MANTRI';
  const actionTitle = role === 'MANTRI' ? 'Who is the CHOR?' : role === 'SIPAHI' ? 'Who is the CHOR?' : 'Stay in character.';
  const actionDescription = role === 'MANTRI'
    ? 'The Mantri may identify the suspected Chor. Choose one player and confirm before the timer ends.'
    : role === 'SIPAHI'
      ? 'The Sipahi makes the final accusation. Only a valid opponent can be selected.'
      : 'The round is in progress. Keep your role secret until the result is revealed.';

  return <Layout>
    {error && <p className="error" role="alert">{error}</p>}
    <section className="card center game-role-card">
      <p className="muted">YOUR SECRET ROLE</p>
      <div className="role">{role || 'REVEALING…'}</div>
      <div className="timer">00:{String(time).padStart(2, '0')}</div>
      <p className="muted">The server controls this timer and validates every major decision.</p>
    </section>
    <div className="spacer" />
    <div className="game-layout">
      <section className="card">
        <h2 className="title">{actionTitle}</h2>
        <p className="muted">{actionDescription}</p>
        {canGuess && !turnSubmitted && (
          <div className="guess-panel">
            <div className="guess-grid">
              {game?.players?.map((player) => {
                const isSelf = String(player.userId) === String(userId);
                const isSelected = String(selectedTarget) === String(player.userId);
                if (isSelf) return null;
                return <button
                  key={player.userId}
                  type="button"
                  className={`guess-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedTarget(player.userId)}
                >
                  <span className="guess-role-label">{player.name}</span>
                  <small>{isSelected ? 'Selected' : 'Choose'}</small>
                </button>;
              })}
            </div>
            <div className="guess-actions">
              <button className="secondary" type="button" onClick={() => setSelectedTarget('')} disabled={!selectedTarget}>Clear selection</button>
              <button type="button" disabled={!selectedTarget} onClick={submitGuess}>{role === 'MANTRI' ? 'Confirm suspect' : 'Accuse player'}</button>
            </div>
          </div>
        )}
        {canGuess && turnSubmitted && (
          <div className="success-state">
            <p className="muted">Your {role === 'MANTRI' ? 'suspect submission' : 'accusation'} has been locked in. Please wait for the round result.</p>
          </div>
        )}
        {!canGuess && <div className="info-note"><p className="muted">The table is active. The {role === 'RAJA' ? 'Raja' : 'Chor'} must stay hidden while the round resolves.</p></div>}
        {game?.players?.map((player) => (
          <div className="player" key={player.userId}>
            <span>👤 {player.name} <small className={player.connected ? 'connection-status connected' : 'connection-status'}>{player.connected ? '● Connected' : '○ Reconnecting'}</small></span>
          </div>
        ))}
      </section>
      <ChatPanel socket={socket} gameCode={gameCode} messages={messages} userId={userId} />
    </div>
  </Layout>;
}
