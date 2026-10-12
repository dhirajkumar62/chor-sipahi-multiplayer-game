import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SiteFooter from './SiteFooter';
export default function Layout({ children }) {
  const navigate = useNavigate(); const { logout } = useAuth(); const [open, setOpen] = useState(false);
  const close = () => setOpen(false); const leave = () => { logout(); close(); navigate('/'); };
  return <div className="shell"><nav className="nav"><Link onClick={close} className="brand" to="/dashboard">CHOR<span>·</span>SIPAHI</Link><button className="app-menu" aria-label={open?"Close navigation menu":"Open navigation menu"} aria-expanded={open} aria-controls="app-navigation" onClick={()=>setOpen(!open)}>☰</button><div id="app-navigation" className={'navlinks '+(open?'open':'')}><Link onClick={close} to="/dashboard">Dashboard</Link><Link onClick={close} to="/leaderboard">Ranks</Link><Link onClick={close} to="/history">History</Link><Link onClick={close} to="/profile">Profile</Link><button className="secondary" onClick={leave}>Logout</button></div></nav><main className="page">{children}</main><SiteFooter /></div>;
}
