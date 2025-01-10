import { NavLink, RouterProvider, createBrowserRouter } from 'react-router-dom';
import './output.css';
import Home from './Home.jsx';

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
]);

function Nav() {
  return (
    <nav className="navbar bg-base-100">
      <div className="flex-1">
        <NavLink to="/" className="btn btn-ghost text-xl">1000 Bornes</NavLink>
      </div>
      <div className="flex-none">
        <ul className="menu menu-horizontal px-1">
          <li><NavLink to="/about">A propos</NavLink></li>
          {/* <li>
            <details>
              <summary>Parent</summary>
              <ul className="bg-base-100 rounded-t-none p-2">
                <li><a>Link 1</a></li>
                <li><a>Link 2</a></li>
              </ul>
            </details>
          </li> */}
        </ul>
      </div>
    </nav>
  );
}

function App() {  
  return <RouterProvider router={router} />;
}

export default App;
