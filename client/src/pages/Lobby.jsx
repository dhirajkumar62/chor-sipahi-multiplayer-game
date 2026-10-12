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

export default function Lobby() {
  const { gameCode } = useParams();
  const [game, setGame] = useState();
  const [me, setMe] = useState();
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    let ready = false;
    let joinedSocketId = null;
    const socket = connectSocket();
    const joinRoom = () => {
      if (!active || !ready || !socket.connected || joinedSocketId === socket.id) return;
      joinedSocketId = socket.id;
      socket.emit('join_lobby', { gameCode }, (result) => {
        if (!active) return;
        if (result?.error) { joinedSocketId = null; setError(result.error); }
        else {
          setError('');
          setGame(result.game);
          setMessages((current) => mergeMessages(current, result.messages || []));
        }
      });
    };
    const onChatHistory = (history) => setMessages((current) => mergeMessages(current, history || []));
    const onChatMessage = (item) => setMessages((current) => mergeMessages(current, [item]));
    const onGameState = ({ game: nextGame }) => { setGame(nextGame); setError(''); };
    const onGameStarted = () => navigate('/game/' + gameCode);
    const onConnectError = () => setError('Live connection failed. Reconnecting…');
    socket.on('connect', joinRoom);
    socket.on('connect_error', onConnectError);
    socket.on('chat:history', onChatHistory);
    socket.on('chat:message', onChatMessage);
    socket.on('game_state', onGameState);
    socket.on('game_started', onGameStarted);

    Promise.all([API.get('/auth/me'), API.get('/game/' + gameCode)]).then(([userResponse, gameResponse]) => {
      if (!active) return;
      setMe(userResponse.data.user);
      setGame(gameResponse.data.game);
      ready = true;
      joinRoom();
    }).catch((requestError) => {
      if (active) setError(requestError.response?.data?.message || 'Could not load this room.');
    });

    return () => {
      active = false;
      socket.off('connect', joinRoom);
      socket.off('connect_error', onConnectError);
      socket.off('chat:history', onChatHistory);
      socket.off('chat:message', onChatMessage);
      socket.off('game_state', onGameState);
      socket.off('game_started', onGameStarted);
    };
  }, [gameCode, navigate]);

  const start = () => connectSocket().emit('start_game', { gameCode }, (result) => setError(result?.error || ''));
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(gameCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Copy the game code manually: ' + gameCode);
    }
  };

  if (!game) return <Layout>{error || 'Loading lobby…'}</Layout>;
  const host = String(game.hostId) === String(me?._id);
  const connectedCount = game.players.filter((player) => player.connected).length;
  const readyToStart = game.players.length === game.settings.maxPlayers && connectedCount === game.settings.maxPlayers;

  return <Layout>
    <div className="card center"><p className="muted">PRIVATE ROOM CODE</p><div className="code">{gameCode}</div><button className="secondary" onClick={copy}>{copied ? 'Copied!' : 'Copy game code'}</button><p className="muted">Share this code with your friends</p></div>
    <div className="spacer" />
    <div className="lobby-layout">
      <section className="card">
        <h1 className="title">Lobby · {game.players.length}/{game.settings.maxPlayers} players</h1>
        {error && <p className="error" role="alert">{error}</p>}
        {game.players.map((player) => <div className="player" key={player.userId}>
          <span>👤 {player.name} {String(player.userId) === String(game.hostId) ? ' · Host' : ''}</span>
          <span className={player.connected ? 'connection-status connected' : 'connection-status'}>{player.connected ? '● Connected' : '○ Reconnecting'}</span>
        </div>)}
        <div className="lobby-readiness" role="status">
          {game.players.length < game.settings.maxPlayers
            ? `Waiting for players (${game.players.length}/${game.settings.maxPlayers} joined).`
            : connectedCount < game.settings.maxPlayers
              ? `All players joined. Waiting for live connections (${connectedCount}/${game.settings.maxPlayers} connected).`
              : host ? 'Everyone is connected. You can start the game.' : `Everyone is connected. Waiting for ${game.players.find((player) => String(player.userId) === String(game.hostId))?.name || 'the host'} to start.`}
        </div>
        {host && <button disabled={!readyToStart} onClick={start}>Start game{!readyToStart && ' (waiting for everyone)'}</button>}
      </section>
      <ChatPanel socket={connectSocket()} gameCode={gameCode} messages={messages} userId={me?._id} />
    </div>
  </Layout>;
}
