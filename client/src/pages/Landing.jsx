import React from 'react';
import '../styles/landing.css';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SiteFooter from '../components/SiteFooter';
import { useAuth } from '../context/AuthContext';

const roles = [
  ['♛', 'RAJA', 'Highest-value role'],
  ['⚔', 'SIPAHI', 'Must identify the Chor'],
  ['◈', 'CHOR', 'Must avoid being identified'],
  ['◉', 'OTHER', 'Participates in the round'],
];

const features = [
  '⚡ Real-Time Multiplayer',
  '🔒 Private Game Rooms',
  '🛡 Secure Authentication',
  '🎭 Secret Role Assignment',
  '⏱ Live Game Timer',
  '✦ Automatic Scoring',
  '🏆 Leaderboard',
  '▣ Game History',
];

const highlights = [
  { title: 'Private rooms', text: 'Create a room and invite players instantly with secure access and fast lobby setup.' },
  { title: 'Fast gameplay', text: 'Every round is streamlined, responsive, and optimized for quick social sessions.' },
  { title: 'Fair competition', text: 'Live updates keep every player informed with transparent scoring and game state.' },
];

const playSteps = [
  ['01', 'Create or join', 'Set up a private room or join a game code in seconds.'],
  ['02', 'Wait for lobby', 'Invite friends and confirm everyone is ready before the round begins.'],
  ['03', 'Assign roles', 'Each player receives a hidden role and the mystery unfolds.'],
  ['04', 'Identify the Chor', 'The Sipahi must read the room and make a confident call.'],
  ['05', 'Track score', 'Live updates, rankings, and history keep the competition engaging.'],
];

const techStack = [
  ['React.js', 'Smooth, responsive player interface'],
  ['Node.js', 'Real-time game orchestration'],
  ['Express.js', 'Secure API services'],
  ['MongoDB', 'Persistent match and history data'],
  ['Socket.IO', 'Instant live events across clients'],
  ['JWT', 'Protected authentication'],
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const play = () => navigate(isAuthenticated ? '/dashboard' : '/login');

  return (
    <div className="landing">
      <Navbar />

      <section className="landing-hero">
        <div className="hero-copy-block">
          <p className="eyebrow">A digital multiplayer traditional game</p>
          <h1>
            CHOR-SIPAHI <em>classic strategy.</em> modern play.
          </h1>
          <p className="hero-copy">
            Bring friends together for fast, social, and strategic rounds of Chor-Sipahi.
            Create a private room, assign secret roles, and race to identify the hidden Chor before time runs out.
          </p>

          <div className="actions">
            <button onClick={play}>Play now <span>→</span></button>
            <a className="button secondary" href="#how">How it works</a>
          </div>

          <div className="hero-metrics">
            <div>
              <strong>Live</strong>
              <span>Fast multiplayer rounds</span>
            </div>
            <div>
              <strong>Secure</strong>
              <span>Private rooms & auth</span>
            </div>
            <div>
              <strong>Fun</strong>
              <span>Leaderboard competition</span>
            </div>
          </div>
        </div>

        <div className="hero-board">
          <div className="board-glow" />
          <span>♛</span>
          <span>⚔</span>
          <span>◈</span>
          <span>◉</span>
          <b>WHO IS THE CHOR?</b>
        </div>
      </section>

      <section className="feature-strip">
        <div>
          <span>100% browser-based</span>
        </div>
        <div>
          <span>Private lobbies</span>
        </div>
        <div>
          <span>Real-time play</span>
        </div>
        <div>
          <span>Instant leaderboard</span>
        </div>
      </section>

      <section id="how" className="landing-section">
        <p className="eyebrow">The round, explained</p>
        <h2>Built for smooth, social competition.</h2>
        <div className="process">
          {playSteps.map(([step, title, text]) => (
            <article key={step}>
              <b>{step}</b>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section role-section">
        <p className="eyebrow">Choose your fate</p>
        <h2>Four roles. One hidden truth.</h2>
        <div className="role-grid">
          {roles.map(([icon, label, detail]) => (
            <article key={label}>
              <i>{icon}</i>
              <h3>{label}</h3>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section story-section">
        <div className="story-copy">
          <p className="eyebrow">Why people love it</p>
          <h2>Strategy, tension, and quick social energy.</h2>
          <p>
            Every round is designed to create conversation, suspicion, and excitement. Players must read the room,
            trust their instincts, and make a winning call before the timer expires.
          </p>
        </div>

        <div className="highlight-grid">
          {highlights.map(({ title, text }) => (
            <div className="highlight-card" key={title}>
              <span className="card-bullet" />
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="landing-section">
        <p className="eyebrow">Everything a round needs</p>
        <h2>Professional features for a polished gaming experience.</h2>
        <div className="feature-grid">
          {features.map((feature) => (
            <div key={feature} className="feature-item">{feature}</div>
          ))}
        </div>
      </section>

      <section id="about" className="landing-section tech">
        <p className="eyebrow">Powered for play</p>
        <h2>Modern infrastructure. Timeless game dynamics.</h2>
        <div>
          {techStack.map(([name, detail]) => (
            <article key={name}>
              <b>{name}</b>
              <span>{detail}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="cta">
        <p className="eyebrow">The table is waiting</p>
        <h2>Ready to start your next match?</h2>
        <p>Create an account, gather your friends, and host your first multiplayer game in minutes.</p>
        <div className="actions">
          <Link className="button" to="/register">Create account</Link>
          <Link className="button secondary" to="/login">Login</Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
