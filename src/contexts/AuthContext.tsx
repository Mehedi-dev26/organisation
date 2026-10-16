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

const ADMIN_EMAILS = [
  'mehedihasanwork25@mail.com',
  'mehedihasanwork25@gmail.com',
  'mehedi.dev26@gmail.com',
  'admin@batighor.org',
  'admin@somoyerbatighor.org',
];

const ADMIN_PHONES = [
  '01711050841',
  '01916314315',
  '01700000000',
];

export const isUserAdmin = (user: User | null, roles: string[] = []): boolean => {
  if (!user) return false;
  if (roles.includes('admin')) return true;

  const email = (user.email || '').toLowerCase().trim();
  const phone = (user.phone || (user.user_metadata?.phone as string) || '').replace(/\D/g, '');
  const localPhone = phone.length === 11 
    ? phone 
    : (phone.length === 13 && phone.startsWith('88')) 
      ? phone.slice(2) 
      : phone;

  if (ADMIN_EMAILS.some(e => e.toLowerCase() === email)) return true;
  if (email.startsWith('admin@')) return true;
  if (email.includes('mehedi') && (email.endsWith('@gmail.com') || email.endsWith('@mail.com'))) return true;
  if (ADMIN_PHONES.some(p => p === localPhone)) return true;
  if (user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin') return true;

  return false;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      return sessionStorage.getItem('batighor_auth_admin') === 'true';
    } catch {
      return false;
    }
  });
  const [isMember, setIsMember] = useState(false);
  const [isCashier, setIsCashier] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);

  const checkRoles = async (userId: string, currentUser?: User | null) => {
    setRolesLoading(true);
    try {
      const targetUser = currentUser || user;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      const roles = data?.map(r => r.role) || [];
      const userIsAdmin = isUserAdmin(targetUser, roles);
      let userIsMember = roles.includes('member');
      let userIsCashier = roles.includes('cashier');

      // Check members table if executive/admin or general member
      if (targetUser) {
        try {
          const email = targetUser.email || '';
          const phone = (targetUser.phone || (targetUser.user_metadata?.phone as string) || '').replace(/\D/g, '');
          const { data: memberData } = await supabase
            .from('members')
            .select('id, member_type')
            .or(`user_id.eq.${userId},email.eq.${email},phone.eq.${phone}`)
            .limit(1);

          if (memberData && memberData.length > 0) {
            userIsMember = true;
            if (['executive', 'admin'].includes(memberData[0].member_type)) {
              // Executive members are core leaders with admin dashboard access
              setIsAdmin(true);
              try { sessionStorage.setItem('batighor_auth_admin', 'true'); } catch {}
            }
          }
        } catch {
          // ignore
        }
      }

      // Check cashiers table if not explicitly in user_roles
      if (!userIsCashier && targetUser) {
        try {
          const { data: cashierData } = await supabase
            .from('cashiers')
            .select('id')
            .eq('user_id', userId)
            .limit(1);

          if (cashierData && cashierData.length > 0) {
            userIsCashier = true;
          }
        } catch {
          // ignore
        }
      }

      setIsAdmin(userIsAdmin);
      setIsMember(userIsMember);
      setIsCashier(userIsCashier);

      try {
        if (userIsAdmin) {
          sessionStorage.setItem('batighor_auth_admin', 'true');
        } else {
          sessionStorage.removeItem('batighor_auth_admin');
        }
      } catch {}

      // Proactively ensure admin role is stored in user_roles table for Postgres RLS policies
      if (userIsAdmin && !roles.includes('admin')) {
        supabase
          .from('user_roles')
          .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' })
          .then(() => {}, () => {});
      }
    } catch (err) {
      console.error('Error checking roles:', err);
      if (currentUser && isUserAdmin(currentUser)) {
        setIsAdmin(true);
        try { sessionStorage.setItem('batighor_auth_admin', 'true'); } catch {}
      } else {
        setIsAdmin(false);
      }
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
          // Fast-path immediate admin check from user object to prevent flicker/kickout
          if (isUserAdmin(newSession.user)) {
            setIsAdmin(true);
          }
          await checkRoles(newSession.user.id, newSession.user);
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
        if (isUserAdmin(existingSession.user)) {
          setIsAdmin(true);
        }
        await checkRoles(existingSession.user.id, existingSession.user);
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
      setUser(data.user);
      setSession(data.session);

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id);
      
      const roles = rolesData?.map(r => r.role) || [];
      const userIsAdmin = isUserAdmin(data.user, roles);
      let userIsMember = roles.includes('member');
      let userIsCashier = roles.includes('cashier');

      if (!userIsMember) {
        try {
          const uEmail = data.user.email || '';
          const { data: memberData } = await supabase
            .from('members')
            .select('id')
            .or(`user_id.eq.${data.user.id},email.eq.${uEmail}`)
            .limit(1);
          if (memberData && memberData.length > 0) {
            userIsMember = true;
          }
        } catch {
          // ignore
        }
      }

      setIsAdmin(userIsAdmin);
      setIsMember(userIsMember);
      setIsCashier(userIsCashier);
      setRolesLoading(false);
      setLoading(false);

      if (userIsAdmin && !roles.includes('admin')) {
        supabase
          .from('user_roles')
          .upsert({ user_id: data.user.id, role: 'admin' }, { onConflict: 'user_id,role' })
          .then(() => {}, () => {});
      }
      
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
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('SignOut error handled safely:', err);
    } finally {
      try { sessionStorage.removeItem('batighor_auth_admin'); } catch {}
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setIsMember(false);
      setIsCashier(false);
      setRolesLoading(false);
      setLoading(false);
    }
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
