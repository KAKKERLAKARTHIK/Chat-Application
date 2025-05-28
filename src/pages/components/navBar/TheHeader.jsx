// src/components/NavBar.jsx
import React, { useRef } from 'react';
import SearchBar from './SearchBar.jsx';
import { Menu } from 'primereact/menu';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
// import { clearCredentials } from '../slice/Auth';

// don’t forget to import these once in your app root:
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { STORAGE_KEY } from '../../../App.jsx';

export default function NavBar() {
  const menuRef  = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSettings = () => {
    // menuRef.current.hide();
    navigate('/settings');
  };
  const user = useSelector(state => state.auth.user);
  const handleLogout = () => {
    debugger
    // menuRef.current.hide();
    // dispatch(clearCredentials());
    localStorage.removeItem('chat_app_session');
    navigate('/login');
  };
  let avatarSrc = '/default-avatar.png';

  if (user?.avatarUrl) {
    try {
      // new URL handles:
      //  • absolute URLs (http://, https://, blob:, data:)
      //  • relative paths ("/uploads/...")
      avatarSrc = new URL(user.avatarUrl, window.location.origin).href;
    } catch {
      // if it really is something weird, just fall back to the raw value
      avatarSrc = user.avatarUrl;
    }
  }

  const items = [
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      className: 'px-4 py-2 text-sm hover:bg-gray-100',
      command: handleSettings
    },
    { separator: true },
    {
      label: 'Logout',
      icon: 'pi pi-sign-out',
      className: 'px-4 py-2 text-sm text-red-600 hover:bg-red-100',
      command: handleLogout
    }
  ];

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
      <div className="container-fluid">
        {/* Brand */}
        <a className="navbar-brand d-flex align-items-center" href="/">
          <i className="bi bi-chat-dots-fill me-2" /> ChatApp
        </a>

        {/* Collapsible content */}
        <div className="collapse navbar-collapse" id="chatNavbar">
          <SearchBar />

         <ul className="navbar-nav ms-auto">
        <li className="nav-item position-relative">
          <img
            src={avatarSrc}
            alt="avatar"
            className="rounded-circle"
            width="32"
            height="32"
            onClick={e => menuRef.current.toggle(e)}
            style={{ cursor: 'pointer' }}
          />
          <Menu model={items} popup ref={menuRef} />
        </li>
      </ul>
        </div>
      </div>
    </nav>
  );
}
