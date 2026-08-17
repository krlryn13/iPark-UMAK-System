import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('ipark_user');
    const savedToken = localStorage.getItem('ipark_token');
    if (savedUser && savedToken) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch (e) {
        localStorage.removeItem('ipark_user');
        localStorage.removeItem('ipark_token');
      }
    }
    setLoading(false);
  }, []);

  const loginUser = (userData, userToken) => {
    localStorage.setItem('ipark_user', JSON.stringify(userData));
    localStorage.setItem('ipark_token', userToken);
    setCurrentUser(userData);
    setToken(userToken);
  };

  const logoutUser = () => {
    localStorage.removeItem('ipark_user');
    localStorage.removeItem('ipark_token');
    setCurrentUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, token, loading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
