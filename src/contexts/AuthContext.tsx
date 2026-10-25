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

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
export const toEnDigits = (str: string = ''): string => {
  return str.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
};

export const isUserAdmin = (user: User | null, roles: string[] = []): boolean => {
  if (!user) return false;
  if (roles.includes('admin')) return true;

  const email = (user.email || '').toLowerCase().trim();
  const rawPhone = toEnDigits(user.phone || (user.user_metadata?.phone as string) || '').replace(/\D/g, '');
  const localPhone = rawPhone.length === 11 
    ? rawPhone 
    : (rawPhone.length === 13 && rawPhone.startsWith('88')) 
      ? rawPhone.slice(2) 
      : rawPhone;

  if (ADMIN_EMAILS.some(e => e.toLowerCase() === email)) return true;
  if (email.startsWith('admin@')) return true;
  if (email.includes('mehedi') && (email.endsWith('@gmail.com') || email.endsWith('@mail.com'))) return true;
  if (ADMIN_PHONES.some(p => p === localPhone)) return true;
  if (user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin') return true;

  return false;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = sessionStorage.getItem('batighor_auth_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      return sessionStorage.getItem('batighor_auth_admin') === 'true';
    } catch {
      return false;
    }
  });
  const [isMember, setIsMember] = useState(() => {
    try {
      return sessionStorage.getItem('batighor_auth_member') === 'true';
    } catch {
      return false;
    }
  });
  const [isCashier, setIsCashier] = useState(() => {
    try {
      return sessionStorage.getItem('batighor_auth_cashier') === 'true';
    } catch {
      return false;
    }
  });
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

      // Check members table safely with guarded conditions
      if (targetUser) {
        try {
          const email = (targetUser.email || '').trim();
          const phone = (targetUser.phone || (targetUser.user_metadata?.phone as string) || '').replace(/\D/g, '');
          
          const orConditions = [`user_id.eq.${userId}`];
          if (email) orConditions.push(`email.eq.${email}`);
          if (phone) orConditions.push(`phone.eq.${phone}`);

          const { data: memberData } = await supabase
            .from('members')
            .select('id, member_type')
            .or(orConditions.join(','))
            .limit(1);

          if (memberData && memberData.length > 0) {
            userIsMember = true;
            if (['executive', 'admin'].includes(memberData[0].member_type)) {
              setIsAdmin(true);
              try { 
                sessionStorage.setItem('batighor_auth_admin', 'true'); 
              } catch { 
                // ignore
              }
            }
          }
        } catch {
          // ignore PostgREST lookup issues safely
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
        if (userIsMember) {
          sessionStorage.setItem('batighor_auth_member', 'true');
        }
        if (userIsCashier) {
          sessionStorage.setItem('batighor_auth_cashier', 'true');
        }
      } catch {
        // ignore session storage error
      }

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
        try { 
          sessionStorage.setItem('batighor_auth_admin', 'true'); 
        } catch { 
          // ignore session storage error
        }
      }
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let isInitialized = false;

    const syncUserSession = async (currentSession: Session | null) => {
      if (!isMounted) return;
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        try {
          sessionStorage.setItem('batighor_auth_user', JSON.stringify({
            id: currentUser.id,
            email: currentUser.email,
            phone: currentUser.phone,
            user_metadata: currentUser.user_metadata,
            app_metadata: currentUser.app_metadata,
          }));
        } catch {}

        if (isUserAdmin(currentUser)) {
          setIsAdmin(true);
          try { 
            sessionStorage.setItem('batighor_auth_admin', 'true'); 
          } catch {}
        }
        await checkRoles(currentUser.id, currentUser);
      } else {
        if (isInitialized) {
          setIsAdmin(false);
          setIsMember(false);
          setIsCashier(false);
          try {
            sessionStorage.removeItem('batighor_auth_user');
            sessionStorage.removeItem('batighor_auth_admin');
            sessionStorage.removeItem('batighor_auth_member');
            sessionStorage.removeItem('batighor_auth_cashier');
          } catch {}
          setRolesLoading(false);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    // Hydrate session from localStorage first
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      isInitialized = true;
      syncUserSession(existingSession);
    }).catch(() => {
      isInitialized = true;
      if (isMounted) {
        setLoading(false);
        setRolesLoading(false);
      }
    });

    // Listen for auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (event === 'INITIAL_SESSION' && isInitialized) return;
        syncUserSession(newSession);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
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
      const userIsCashier = roles.includes('cashier');

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

      if (userIsAdmin) {
        try {
          sessionStorage.setItem('batighor_auth_admin', 'true');
          sessionStorage.setItem('batighor_auth_user', JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            phone: data.user.phone,
            user_metadata: data.user.user_metadata,
            app_metadata: data.user.app_metadata,
          }));
        } catch {}
      }

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
      try { 
        sessionStorage.removeItem('batighor_auth_user');
        sessionStorage.removeItem('batighor_auth_admin'); 
        sessionStorage.removeItem('batighor_auth_member');
        sessionStorage.removeItem('batighor_auth_cashier');
      } catch {
        // ignore session storage error
      }
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
