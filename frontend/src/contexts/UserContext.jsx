import { createContext, useContext } from 'react';

const UserContext = createContext(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return { user, isAdmin: user?.role === 'admin', isViewer: user?.role === 'viewer' };
  }
  return context;
};

export const UserProvider = ({ children, user }) => {
  const isAdmin = user?.role === 'admin';
  const isViewer = user?.role === 'viewer';

  return (
    <UserContext.Provider value={{ user, isAdmin, isViewer }}>
      {children}
    </UserContext.Provider>
  );
};
