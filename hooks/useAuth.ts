import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

const ONBOARDED_KEY = (uid: string) => `@gedi_onboarded_${uid}`;

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const markOnboarded = async (uid: string) => {
    await AsyncStorage.setItem(ONBOARDED_KEY(uid), '1');
  };

  const isOnboarded = async (uid: string): Promise<boolean> => {
    const val = await AsyncStorage.getItem(ONBOARDED_KEY(uid));
    return val === '1';
  };

  return { session, user, loading, signOut, markOnboarded, isOnboarded };
}
