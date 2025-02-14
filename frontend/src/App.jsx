import React, { useContext, useEffect, useState } from 'react';
import { NavLink, RouterProvider, createBrowserRouter } from 'react-router-dom';
import './output.css';
import Home from './Home.jsx';
import { AuthContext } from './AuthContext';
import Login from './Login';
import Game from './Game.jsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <div>
        <Nav />
        <Home />
      </div>,
    errorElement: <div>404</div>,
  },
  {
    path: "/about",
    element: <div>
      <Nav />
      <div>A propos</div>
    </div>,
  },
  {
    path: "/game/:gameId",
    element: <div>
      <Nav />
      <Game />
    </div>,
  },
]);

function Nav() {
  const { user, logout } = useContext(AuthContext);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  const toggleTheme = () => {
    const htmlElement = document.documentElement;
    const newTheme = isDarkTheme ? 'light' : 'dark';
    htmlElement.setAttribute('data-theme', newTheme);
    setIsDarkTheme(!isDarkTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <nav className="navbar bg-base-300 rounded-box">
      <div className="flex-1 px-2 lg:flex-none">
        <NavLink to="/" className="btn btn-ghost rounded-btn text-lg font-bold">1000 Bornes</NavLink>
      </div>
      <div className="flex flex-1 justify-end px-2">
        <div className="flex items-stretch">
          <NavLink className="btn btn-ghost rounded-btn" to="/about">A propos</NavLink>
          {user && (
            <div className="dropdown dropdown-end">
              <div tabIndex="0" role="button" className="btn btn-ghost rounded-btn">{user.username}</div>
              <ul
                tabIndex="0"
                className="menu dropdown-content bg-base-100 rounded-box z-[1] mt-4 w-52 p-2 shadow">
                <li onClick={toggleTheme}>
                  <div>
                    <div>Switch mode</div>
                    <div>
                      <label className="grid cursor-pointer place-items-center">
                        <input
                          checked={isDarkTheme}
                          onChange={toggleTheme}
                          id="theme-toggle"
                          type="checkbox"
                          className="toggle bg-base-content col-span-2 col-start-1 row-start-1" />
                        <svg
                          className="stroke-base-100 fill-base-100 col-start-1 row-start-1"
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round">
                          <circle cx="12" cy="12" r="5" />
                          <path
                            d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
                        </svg>
                        <svg
                          className="stroke-base-100 fill-base-100 col-start-2 row-start-1"
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round">
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                        </svg>
                      </label>
                    </div>
                  </div>
                </li>
                <li>
                  <button onClick={logout}>Logout</button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

const App = () => {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  return (
    <div>
      {user ? <RouterProvider router={router} /> : <Login />}
    </div>
  );
};

export default App;
