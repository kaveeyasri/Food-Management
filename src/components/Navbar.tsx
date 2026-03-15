import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Leaf, Menu, X, LogOut, User, LayoutDashboard, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import toast from 'react-hot-toast';

const Navbar: React.FC = () => {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const navLinks = session
    ? [
        { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
        { to: '/donate', label: 'Donate Food', icon: <PlusCircle size={16} /> },
        { to: '/nexus', label: 'My Nexus', icon: <User size={16} /> },
      ]
    : [];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <Leaf size={24} className="brand-icon" />
          <span>FoodBridge</span>
        </Link>

        <div className="navbar-links desktop-only">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>

        <div className="navbar-actions desktop-only">
          {session ? (
            <div className="nav-user">
              <NotificationBell />
              <span className="nav-role-badge">{profile?.role || 'User'}</span>
              <span className="nav-username">{profile?.full_name?.split(' ')[0] || 'User'}</span>
              <button className="btn-ghost" onClick={handleSignOut} title="Sign out">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="nav-auth-btns">
              <Link to="/auth" className="btn-outline">Sign In</Link>
              <Link to="/auth?mode=signup" className="btn-primary">Get Started</Link>
            </div>
          )}
        </div>

        <button className="hamburger mobile-only" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="mobile-nav-link"
              onClick={() => setMenuOpen(false)}
            >
              {link.icon} {link.label}
            </Link>
          ))}
          {session ? (
            <>
              <div className="mobile-notif-row">
                <NotificationBell />
              </div>
              <button className="mobile-nav-link signout-btn" onClick={handleSignOut}>
                <LogOut size={16} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link to="/auth?mode=signup" className="mobile-nav-link highlight" onClick={() => setMenuOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
