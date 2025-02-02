import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

axios.defaults.baseURL = 'http://localhost:3000'; // Set the base URL for Axios

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/api/users/me')
        .then(response => {
          setUser(response.data);
        })
        .catch((error) => {
          console.log("Error on Load:", error); // Log any errors on load
          setUser(null);
        });
    }
  }, []);

  const login = async (email, password) => {
    const response = await axios.post('/login', { email, password });
    const { token } = response.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const userResponse = await axios.get('/api/users/me');
    setUser(userResponse.data);
  };

  const register = async (firstname, lastname, username, email, password) => {
    const response = await axios.post('/register', { firstname, lastname, username, email, password });
    if (response.data.error) {
      throw new Error(response.data.error);
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      await axios.post('/logout', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    }
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};