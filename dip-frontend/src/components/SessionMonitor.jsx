import { useEffect, useRef } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../context/AuthContext';

const SessionMonitor = () => {
  const { security } = useSettings();
  const { logout, isAuthenticated } = useAuth();
  const lastActivityRef = useRef(Date.now());
  const intervalRef = useRef(null);

  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !security?.sessionTimeout) return;

    const timeoutMinutes = parseInt(security.sessionTimeout, 10);
    if (isNaN(timeoutMinutes) || timeoutMinutes <= 0) return;

    const checkInactivity = () => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;
      
      if (elapsed > timeoutMinutes * 60 * 1000) {
        console.warn(`Session timeout after ${timeoutMinutes} minutes of inactivity.`);
        logout();
      }
    };

    // Check every minute
    intervalRef.current = setInterval(checkInactivity, 60000); 

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, security, logout]);

  return null;
};

export default SessionMonitor;
