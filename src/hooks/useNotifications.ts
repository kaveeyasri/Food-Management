import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export const useNotifications = () => {
  const { user } = useAuth();

  const requestPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission;
    }
    return Notification.permission;
  };

  useEffect(() => {
    if (!user) return;

    // We still try curious check, but most browsers need a gesture for the prompt
    // to actually show up if it's the first time.
    if ('Notification' in window && Notification.permission === 'default') {
      console.log('Notifications permission remains default. User gesture may be needed.');
    }

    // Subscribe to new notifications for this user
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as any;
          
          // Trigger Native Browser Notification
          if (Notification.permission === 'granted') {
            new Notification(newNotif.title, {
              body: newNotif.message,
              icon: '/vite.svg', // Default vite icon, can be replaced with app logo
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { requestPermission, permission: typeof Notification !== 'undefined' ? Notification.permission : 'denied' };
};
