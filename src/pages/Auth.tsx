import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { getCandidateMemberIds } from '@/lib/memberIdUtils';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Users, 
  Lock, 
  Mail, 
  Phone, 
  ArrowRight, 
  HeartHandshake, 
  Receipt, 
  Sparkles,
  CheckCircle2,
  KeyRound,
  UserCheck,
  Zap,
  Shield
} from 'lucide-react';

const Auth = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { signIn, user, isAdmin, isMember, isCashier, loading, rolesLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Auto redirect if already logged in
    if (!loading && !rolesLoading && user) {
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else if (isCashier) {
        navigate('/cashier', { replace: true });
      } else if (isMember) {
        navigate('/member-dashboard', { replace: true });
      }
    }
  }, [user, isAdmin, isMember, isCashier, loading, rolesLoading, navigate]);

  const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const toEnDigits = (str: string = ''): string => {
    return str.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      toast({
        title: language === 'bn' ? 'তথ্য অসম্পূর্ণ' : 'Incomplete Information',
        description: language === 'bn' ? 'ইমেইল বা মোবাইল নম্বর এবং পাসওয়ার্ড প্রদান করুন' : 'Please provide email/phone and password',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const cleanInput = toEnDigits(identifier.trim());
      const isEmail = cleanInput.includes('@');
      const cleanPassword = password.trim();

      // Authorized core administrator accounts
      const ADMIN_ACCOUNTS = [
        'mehedi.dev26@gmail.com',
        'mehedihasanwork25@gmail.com',
        'mehedihasanwork25@mail.com',
        'admin@somoyerbatighor.org',
        'admin@batighor.org'
      ];

      let candidateEmails: string[] = [];

      // 1. Direct username shortcut for admin
      if (cleanInput.toLowerCase() === 'admin' || cleanInput.toLowerCase() === 'administrator') {
        candidateEmails = [...ADMIN_ACCOUNTS];
      } else if (isEmail) {
        // Direct email entered
        candidateEmails = [cleanInput.toLowerCase()];
        // If an authorized admin email is used, add other aliases as backup
        if (
          ADMIN_ACCOUNTS.includes(cleanInput.toLowerCase()) || 
          cleanInput.toLowerCase().includes('mehedi') || 
          cleanInput.toLowerCase().startsWith('admin@')
        ) {
          ADMIN_ACCOUNTS.forEach((ae) => {
            if (!candidateEmails.includes(ae)) {
              candidateEmails.push(ae);
            }
          });
        }
      } else {
        // Phone number or Member ID entered
        const digitsOnly = cleanInput.replace(/\D/g, '');
        const standardLocal = digitsOnly.length === 11 
          ? digitsOnly 
          : (digitsOnly.length === 13 && digitsOnly.startsWith('88')) 
            ? digitsOnly.slice(2) 
            : digitsOnly;
        
        // If it matches registered admin mobile numbers
        if (['01711050841', '01916314315', '01720565997', '01700000000'].includes(standardLocal)) {
          candidateEmails = [...ADMIN_ACCOUNTS];
        }

        const candidatePhones = Array.from(new Set([
          cleanInput,
          digitsOnly,
          standardLocal,
          `+88${standardLocal}`,
          `88${standardLocal}`,
          ...(standardLocal === '01916314315' ? ['01720565997', '+8801720565997'] : []),
          ...(standardLocal === '01720565997' ? ['01916314315', '+8801916314315'] : [])
        ])).filter(Boolean);

        const candidateIds = getCandidateMemberIds(cleanInput);

        let matchedMember: any = null;

        // A1. Direct query in members table by phone
        try {
          if (candidatePhones.length > 0) {
            const { data: memberByPhone } = await supabase
              .from('members')
              .select('id, member_id, full_name, phone, email, user_id, status')
              .in('phone', candidatePhones)
              .limit(1)
              .maybeSingle();

            if (memberByPhone) {
              matchedMember = memberByPhone;
            }
          }
        } catch (e) {
          console.debug('Member lookup by phone error:', e);
        }

        // A2. Direct query in members table by Member ID candidates (e.g. 2601, SB-2601, SB-001, 1)
        if (!matchedMember && candidateIds.length > 0) {
          try {
            const { data: memberById } = await supabase
              .from('members')
              .select('id, member_id, full_name, phone, email, user_id, status')
              .in('member_id', candidateIds)
              .limit(1)
              .maybeSingle();

            if (memberById) {
              matchedMember = memberById;
            }
          } catch (e) {
            console.debug('Member lookup by ID error:', e);
          }
        }

        // A3. Extract all unified candidate emails from matched member record
        if (matchedMember) {
          const mDigits = matchedMember.phone ? matchedMember.phone.replace(/\D/g, '') : '';
          const mStd = mDigits.length === 11 ? mDigits : (mDigits.length === 13 && mDigits.startsWith('88')) ? mDigits.slice(2) : mDigits;
          
          // 1. Member personal email (Primary - holds changed password)
          if (matchedMember.email && !candidateEmails.includes(matchedMember.email.toLowerCase().trim())) {
            candidateEmails.unshift(matchedMember.email.toLowerCase().trim());
          }

          // 2. Mobile-based synthetic auth identity
          if (mStd.length >= 10) {
            const phoneEmail = `${mStd}@batighor.org`;
            if (!candidateEmails.includes(phoneEmail)) {
              candidateEmails.push(phoneEmail);
            }
          }

          // 3. Member ID synthetic auth identity
          if (matchedMember.member_id) {
            const cleanMid = matchedMember.member_id.toLowerCase().replace(/[^a-z0-9]/g, '');
            const idEmail = `${cleanMid}@batighor.org`;
            if (!candidateEmails.includes(idEmail)) {
              candidateEmails.push(idEmail);
            }
            if (cleanMid.includes('2601')) {
              if (!candidateEmails.includes('sb001@batighor.org')) {
                candidateEmails.push('sb001@batighor.org');
              }
            }
          }

          // 4. If admin member, ensure all admin accounts are available
          if (
            matchedMember.email &&
            (ADMIN_ACCOUNTS.includes(matchedMember.email.toLowerCase()) || matchedMember.full_name?.toLowerCase().includes('mehedi'))
          ) {
            ADMIN_ACCOUNTS.forEach((ae) => {
              if (!candidateEmails.includes(ae)) {
                candidateEmails.push(ae);
              }
            });
          }
        }

        // A4. Direct query in cashiers / team table
        try {
          if (candidatePhones.length > 0) {
            const { data: cashierData } = await supabase
              .from('cashiers')
              .select('email, phone')
              .in('phone', candidatePhones)
              .limit(1)
              .maybeSingle();

            if (cashierData?.email && !candidateEmails.includes(cashierData.email.toLowerCase().trim())) {
              candidateEmails.push(cashierData.email.toLowerCase().trim());
            }
          }
        } catch (e) {
          console.debug('Cashier lookup error:', e);
        }

        // B. Fallback synthetic phone email if 10+ digits entered
        if (standardLocal.length >= 10) {
          const synth = `${standardLocal}@batighor.org`;
          if (!candidateEmails.includes(synth)) {
            candidateEmails.push(synth);
          }
        }
      }

      // If somehow no candidates were formed, fall back to cleanInput
      if (candidateEmails.length === 0) {
        candidateEmails = [cleanInput.toLowerCase()];
      }

      // Password candidate variants (handles both English and Bengali digits if entered)
      const passwordCandidates = Array.from(new Set([
        cleanPassword,
        toEnDigits(cleanPassword)
      ])).filter(Boolean);

      let lastAuthResult: any = null;
      let loginSuccessful = false;

      // Authenticate directly with Supabase across candidates
      for (const targetEmail of candidateEmails) {
        for (const pwd of passwordCandidates) {
          const res = await signIn(targetEmail, pwd);
          lastAuthResult = res;
          if (res && !res.error) {
            loginSuccessful = true;
            break;
          }
        }
        if (loginSuccessful) {
          break;
        }
      }

      // C. Safe initial-provision fallback:
      // ONLY for approved members who do NOT yet have an auth account in database (!matchedMember.user_id),
      // attempting first-time setup with the default initial password 'member@123'.
      // If matchedMember.user_id already exists, WE NEVER OVERWRITE OR RESET EXISTING PASSWORDS!
      if (!loginSuccessful && matchedMember && matchedMember.status === 'approved' && !matchedMember.user_id) {
        if (cleanPassword === 'member@123') {
          const mDigits = matchedMember.phone ? matchedMember.phone.replace(/\D/g, '') : '';
          const mStd = mDigits.length === 11 ? mDigits : (mDigits.length === 13 && mDigits.startsWith('88')) ? mDigits.slice(2) : mDigits;
          const autoTargetEmail = mStd.length >= 10 ? `${mStd}@batighor.org` : (matchedMember.email || null);

          if (autoTargetEmail) {
            try {
              const { data: provisionData } = await supabase.functions.invoke('create-member-user', {
                body: {
                  email: autoTargetEmail,
                  password: cleanPassword,
                  memberId: matchedMember.id,
                  fullName: matchedMember.full_name,
                },
              });

              if (provisionData?.success) {
                // Immediately retry sign in with newly provisioned credentials
                const retryRes = await signIn(autoTargetEmail, cleanPassword);
                if (retryRes && !retryRes.error) {
                  lastAuthResult = retryRes;
                  loginSuccessful = true;
                }
              }
            } catch (provisionErr) {
              console.warn('Initial member provision attempt failed:', provisionErr);
            }
          }
        }
      }

      if (!loginSuccessful || !lastAuthResult || lastAuthResult.error) {
        const errorMsg = lastAuthResult?.error?.message || 'Invalid login credentials';
        toast({
          title: language === 'bn' ? 'লগইন ব্যর্থ হয়েছে' : 'Login Failed',
          description: !isEmail && errorMsg.includes('Invalid login credentials')
            ? (language === 'bn' 
                ? 'মোবাইল নম্বর বা পাসওয়ার্ড সঠিক নয়। আপনার সঠিক পাসওয়ার্ড দিয়ে আবার চেষ্টা করুন।' 
                : 'Invalid mobile number or password.')
            : (language === 'bn'
                ? 'ইমেইল/মোবাইল বা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে সঠিক তথ্য প্রদান করুন।'
                : errorMsg),
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: language === 'bn' ? 'স্বাগতম!' : 'Welcome!',
        description: language === 'bn' ? 'সফলভাবে লগইন সম্পন্ন হয়েছে' : 'Successfully logged in',
      });

      // Automatically navigate to the correct dashboard based on role
      if (lastAuthResult.isAdmin) {
        navigate('/admin');
      } else if (lastAuthResult.isCashier) {
        navigate('/cashier');
      } else if (lastAuthResult.isMember) {
        navigate('/member-dashboard');
      } else {
        navigate('/member-dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: err.message || (language === 'bn' ? 'লগইন করতে সমস্যা হয়েছে' : 'Failed to login'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      {/* Top Banner & Breadcrumb with gradient styling */}
      <div className="bg-gradient-to-r from-emerald-800 via-[#006a4e] to-teal-900 text-white py-5 px-4 shadow-md border-b border-emerald-700/40">
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-heading flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
              {language === 'bn' ? 'সদস্য ও পরিচালনা পর্ষদ লগইন' : 'Member & Portal Login'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5">
              {language === 'bn' 
                ? 'সময়ের বাতিঘর কেন্দ্রীয় একাউন্ট পোর্টাল' 
                : 'Samoyer Batighor Central Account Portal'}
            </p>
          </div>
          <div className="text-xs text-emerald-200 flex items-center gap-1.5 self-start sm:self-auto font-medium">
            <Link to="/" className="hover:text-white transition-colors">
              {language === 'bn' ? 'হোম' : 'Home'}
            </Link>
            <span>/</span>
            <span className="text-white font-semibold">
              {language === 'bn' ? 'লগইন' : 'Login'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area with rich soft gradient and glassmorphism styling */}
      <section className="py-4 sm:py-12 lg:py-16 bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-slate-100 dark:from-slate-950 dark:via-emerald-950/20 dark:to-slate-900 min-h-[calc(100vh-280px)] flex items-center relative overflow-hidden">
        {/* Soft floating glowing ambient orbs matching registration page */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-2 sm:px-4 max-w-6xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
            
            {/* Left Column (Desktop Showcase & Highlights; on mobile only concise welcome header is shown) */}
            <div className="lg:col-span-7 space-y-4 lg:space-y-6">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-950 dark:to-teal-950 text-[#006a4e] dark:text-emerald-300 border border-emerald-300/40 text-xs sm:text-sm font-bold shadow-xs">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                {language === 'bn' ? 'একটিমাত্র কেন্দ্রীয় প্রবেশদ্বার' : 'Single Unified Access Portal'}
              </div>

              <div>
                <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-slate-800 dark:text-slate-100 font-heading leading-tight">
                  {language === 'bn' ? (
                    <>
                      স্বাগতম <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">সময়ের বাতিঘর</span> ডিজিটাল প্ল্যাটফর্মে
                    </>
                  ) : (
                    <>
                      Welcome to <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Samoyer Batighor</span> Digital Platform
                    </>
                  )}
                </h2>
                <p className="text-xs sm:text-base text-slate-600 dark:text-slate-300 mt-2 sm:mt-3 leading-relaxed">
                  {language === 'bn'
                    ? 'আপনার সংরক্ষিত মোবাইল নম্বর অথবা ইমেইল দিয়ে লগইন করলেই সিস্টেম স্বয়ংক্রিয়ভাবে আপনাকে নির্দিষ্ট ড্যাশবোর্ডে নিয়ে যাবে।'
                    : 'Simply enter your registered phone number or email, and the system automatically opens your designated dashboard.'}
                </p>
              </div>

              {/* Colorful Showcase Grid with rich glass badges (Hidden on mobile to bring Login Card upfront) */}
              <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                
                {/* 1. Auto Role Detection */}
                <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-emerald-500/20 shadow-md shadow-emerald-950/5 flex items-start gap-3.5 hover:border-emerald-400/50 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {language === 'bn' ? 'অটো রোল ডিটেকশন' : 'Auto Role Detection'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {language === 'bn' ? 'অ্যাডমিন, ক্যাশিয়ার ও সদস্য সরাসরি রিডাইরেক্ট' : 'Direct smart routing to your dashboard'}
                    </p>
                  </div>
                </div>

                {/* 2. Mobile / Email Support */}
                <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-blue-500/20 shadow-md shadow-blue-950/5 flex items-start gap-3.5 hover:border-blue-400/50 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {language === 'bn' ? 'মোবাইল বা ইমেইল সাপোর্ট' : 'Mobile / Email Support'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {language === 'bn' ? 'নম্বর বা ইমেইল যেকোনোটি দিয়ে সহজে প্রবেশ' : 'Sign in easily using phone or email'}
                    </p>
                  </div>
                </div>

                {/* 3. Digital Dues & Receipts */}
                <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-amber-500/20 shadow-md shadow-amber-950/5 flex items-start gap-3.5 hover:border-amber-400/50 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-amber-600/20 group-hover:scale-105 transition-transform">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {language === 'bn' ? 'ডিজিটাল চাঁদা ও রসিদ' : 'Digital Dues & Receipts'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {language === 'bn' ? 'মাসিক চাঁদা পরিশোধ ও ইনস্ট্যান্ট রসিদ সংগ্রহ' : 'Pay dues and download instant receipts'}
                    </p>
                  </div>
                </div>

                {/* 4. Blood & Emergency Aid */}
                <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-rose-500/20 shadow-md shadow-rose-950/5 flex items-start gap-3.5 hover:border-rose-400/50 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-rose-600/20 group-hover:scale-105 transition-transform">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {language === 'bn' ? 'রক্তদান ও জরুরি সেবা' : 'Blood & Emergency Aid'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {language === 'bn' ? 'জীবন রক্ষার্থে জরুরি রক্তদাতা ও চিকিৎসা সহায়তা' : 'Immediate blood donation & relief'}
                    </p>
                  </div>
                </div>

              </div>

              {/* Bottom Security Assurance Note (Hidden on mobile) */}
              <div className="hidden lg:flex p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/30 items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 font-medium">
                  {language === 'bn'
                    ? 'আপনার ব্যক্তিগত তথ্য ও আর্থিক লেনদেনের হিসেব আমাদের ডেটাবেজে সম্পূর্ণ সুরক্ষিত ও এনক্রিপ্টেড থাকে।'
                    : 'Your personal records and financial entries are fully secured and encrypted in our database.'}
                </p>
              </div>

            </div>

            {/* Right Column (Complete Login Card) */}
            <div className="lg:col-span-5 w-full">
              <Card className="shadow-2xl border border-emerald-500/30 sm:border-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl overflow-hidden relative">
                
                {/* Decorative glow inside card */}
                <div className="absolute -top-16 -right-16 w-44 h-44 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
                
                <CardHeader className="text-center pb-4 sm:pb-5 pt-5 sm:pt-8 px-4 sm:px-8 bg-gradient-to-r from-emerald-100/40 via-teal-50/30 to-emerald-100/40 dark:from-emerald-950/30 dark:to-slate-900 border-b border-emerald-100/70 dark:border-slate-800">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-tr from-emerald-600 via-teal-600 to-[#006a4e] rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-lg shadow-emerald-700/25 text-white">
                    <KeyRound className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl md:text-3xl font-heading font-extrabold text-slate-900 dark:text-slate-100">
                    {language === 'bn' ? 'লগইন করুন' : 'Sign In'}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
                    {language === 'bn'
                      ? 'মোবাইল নম্বর বা ইমেইল এবং পাসওয়ার্ড দিয়ে প্রবেশ করুন'
                      : 'Enter your phone number or email and password'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-4 sm:px-8 pb-6 sm:pb-8 pt-5 sm:pt-6">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    
                    {/* Identifier: Mobile, Member ID or Email */}
                    <div className="space-y-1.5">
                      <Label htmlFor="login-identifier" className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center justify-between">
                        <span>{language === 'bn' ? 'মোবাইল নম্বর, সদস্য আইডি বা ইমেইল' : 'Mobile Number, Member ID or Email'}</span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/50">
                          {language === 'bn' ? 'স্বয়ংক্রিয় সনাক্তকরণ' : 'Auto-detected'}
                        </span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="login-identifier"
                          type="text"
                          placeholder={language === 'bn' ? '০১৭১২xxxxxx / SB-2601 / 2601' : '01712xxxxxx / SB-2601 / 2601'}
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          className="pl-10 h-11 text-sm rounded-xl border-slate-300 dark:border-slate-700 focus:border-emerald-600 focus:ring-emerald-600 bg-white dark:bg-slate-900"
                          required
                          autoComplete="username"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          {identifier.includes('@') ? (
                            <Mail className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Phone className="w-4 h-4 text-emerald-600" />
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {language === 'bn' 
                          ? 'নিবন্ধিত মোবাইল নম্বর (যেমন: 017...) অথবা সদস্য আইডি (যেমন: 2601 / SB-2601) লিখুন' 
                          : 'Enter your registered mobile number or Member ID (e.g. 2601 / SB-2601)'}
                      </p>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                        </Label>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {language === 'bn' ? 'ডিফল্ট: member@123' : 'Default: member@123'}
                        </span>
                      </div>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 h-11 text-sm rounded-xl border-slate-300 dark:border-slate-700 focus:border-emerald-600 focus:ring-emerald-600 bg-white dark:bg-slate-900"
                          required
                          autoComplete="current-password"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Lock className="w-4 h-4 text-emerald-600" />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Submit Button with rich colorful gradient styling */}
                    <div className="pt-2">
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-gradient-to-r from-emerald-600 via-teal-600 to-[#006a4e] hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm sm:text-base rounded-2xl shadow-xl shadow-emerald-700/25 hover:shadow-emerald-700/40 transition-all hover:scale-[1.005] active:scale-[0.995] flex items-center justify-center gap-2" 
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{language === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying...'}</span>
                          </>
                        ) : (
                          <>
                            <span>{language === 'bn' ? 'লগইন করুন' : 'Sign In'}</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Registration Redirect with colorful glass button */}
                    <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 text-center space-y-2.5">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {language === 'bn' ? 'সংগঠনের সদস্য হতে চান?' : 'Want to become a member?'}
                      </p>
                      <Link 
                        to="/member-registration" 
                        className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 hover:from-emerald-100 hover:to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 border-2 border-emerald-400/60 text-[#006a4e] dark:text-emerald-300 text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-md"
                      >
                        <UserCheck className="w-4 h-4" />
                        {language === 'bn' ? 'নতুন সদস্য হিসেবে আবেদন করুন' : 'Apply for New Membership'}
                      </Link>
                    </div>

                    {/* Support Help */}
                    <div className="text-center pt-2">
                      <p className="text-[11px] text-slate-400">
                        {language === 'bn' 
                          ? 'পাসওয়ার্ড ভুলে গেলে বা প্রবেশ করতে সমস্যা হলে অ্যাডমিনের সাথে যোগাযোগ করুন' 
                          : 'Contact administrator if you forgot your password or need assistance'}
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Auth;
