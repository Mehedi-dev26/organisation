import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isMember: boolean;
  isCashier: boolean;
  loading: boolean;
  rolesLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any; isAdmin: boolean; isMember: boolean; isCashier: boolean }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isCashier, setIsCashier] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);

  const checkRoles = async (userId: string) => {
    setRolesLoading(true);
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      const roles = data?.map(r => r.role) || [];
      setIsAdmin(roles.includes('admin'));
      setIsMember(roles.includes('member'));
      setIsCashier(roles.includes('cashier'));
    } catch (err) {
      console.error('Error checking roles:', err);
      setIsAdmin(false);
      setIsMember(false);
      setIsCashier(false);
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          await checkRoles(newSession.user.id);
        } else {
          setIsAdmin(false);
          setIsMember(false);
          setIsCashier(false);
          setRolesLoading(false);
        }
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    // Initial check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (!isMounted) return;
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (existingSession?.user) {
        await checkRoles(existingSession.user.id);
      } else {
        setRolesLoading(false);
      }
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Check roles immediately after successful login
    if (data?.user) {
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id);
      
      const roles = rolesData?.map(r => r.role) || [];
      const userIsAdmin = roles.includes('admin');
      const userIsMember = roles.includes('member');
      const userIsCashier = roles.includes('cashier');
      
      setIsAdmin(userIsAdmin);
      setIsMember(userIsMember);
      setIsCashier(userIsCashier);
      
      return { error, isAdmin: userIsAdmin, isMember: userIsMember, isCashier: userIsCashier };
    }
    
    return { error, isAdmin: false, isMember: false, isCashier: false };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsMember(false);
    setIsCashier(false);
    setRolesLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isMember, isCashier, loading, rolesLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
