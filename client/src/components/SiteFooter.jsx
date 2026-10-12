import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SiteFooter() {
  const { isAuthenticated } = useAuth();
  return <footer className="site-footer">
    <div className="site-footer-inner">
      <Link className="footer-brand" to={isAuthenticated ? '/dashboard' : '/'}>CHOR-SIPAHI</Link>
      <p>A digital multiplayer traditional game</p>
      <nav aria-label="Footer navigation">
        <Link to="/#how">How it works</Link>
        <Link to="/#features">Features</Link>
        <Link to={isAuthenticated ? '/dashboard' : '/login'}>{isAuthenticated ? 'Dashboard' : 'Login'}</Link>
      </nav>
      <small>© {new Date().getFullYear()} CHOR-SIPAHI. All rights reserved.</small>
    </div>
  </footer>;
}
