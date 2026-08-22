import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { showInfoToast } from '../utils/notifications';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export const useIdleTimer = () => {
  const { user, logout } = useAuth();
  const timerRef = useRef(null);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Only set timer if user is logged in
    if (user) {
      timerRef.current = setTimeout(() => {
        handleIdle();
      }, IDLE_TIMEOUT_MS);
    }
  };

  const handleIdle = async () => {
    if (user) {
      showInfoToast('You have been logged out due to inactivity.');
      await logout();
    }
  };

  useEffect(() => {
    // Events that reset the idle timer
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart'
    ];

    const handleUserActivity = () => {
      resetTimer();
    };

    // Initialize timer
    resetTimer();

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      // Cleanup
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [user]); // Re-bind if user state changes
};
