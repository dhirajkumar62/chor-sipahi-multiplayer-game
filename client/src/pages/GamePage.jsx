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
    const onRoleAssigned = (item) => setRole(item.role);
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

  const guess = (accusedId) => socket.emit('make_guess', { gameCode, accusedId }, (result) => {
    if (result?.error) setError(result.error);
  });

  return <Layout>
    {error && <p className="error" role="alert">{error}</p>}
    <section className="card center game-role-card">
      <p className="muted">YOUR SECRET ROLE</p>
      <div className="role">{role || 'REVEALING…'}</div>
      <div className="timer">00:{String(time).padStart(2, '0')}</div>
      <p className="muted">The server controls this timer.</p>
    </section>
    <div className="spacer" />
    <div className="game-layout">
      <section className="card">
        <h2 className="title">{role === 'SIPAHI' ? 'Who is the CHOR?' : 'Stay in character.'}</h2>
        <p className="muted">Only Sipahi can make an accusation. Roles stay secret until the result.</p>
        {game?.players.map((player) => <div className="player" key={player.userId}>
          <span>👤 {player.name} <small className={player.connected ? 'connection-status connected' : 'connection-status'}>{player.connected ? '● Connected' : '○ Reconnecting'}</small></span>
          {role === 'SIPAHI' && <button className="secondary" disabled={String(player.userId) === userId} onClick={() => guess(player.userId)}>Accuse</button>}
        </div>)}
      </section>
      <ChatPanel socket={socket} gameCode={gameCode} messages={messages} userId={userId} />
    </div>
  </Layout>;
}
