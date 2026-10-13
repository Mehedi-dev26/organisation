import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
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
  Award,
  Sparkles,
  CheckCircle2
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
        navigate('/admin');
      } else if (isCashier) {
        navigate('/cashier');
      } else if (isMember) {
        navigate('/member-dashboard');
      }
    }
  }, [user, isAdmin, isMember, isCashier, loading, rolesLoading, navigate]);

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
      const rawInput = identifier.trim();
      let loginEmail = rawInput;

      // Check if user entered phone number or member ID instead of email
      const isEmail = rawInput.includes('@');
      if (!isEmail) {
        const digitsOnly = rawInput.replace(/\D/g, '');
        const standardLocal = digitsOnly.length === 11 
          ? digitsOnly 
          : (digitsOnly.length === 13 && digitsOnly.startsWith('88')) 
            ? digitsOnly.slice(2) 
            : digitsOnly;
        
        const candidatePhones = Array.from(new Set([
          rawInput,
          digitsOnly,
          standardLocal,
          `+88${standardLocal}`,
          `88${standardLocal}`
        ])).filter(Boolean);

        // 1. Search in profiles table by phone
        let foundEmail: string | null = null;
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email, phone')
          .in('phone', candidatePhones)
          .limit(1);

        if (profileData && profileData.length > 0 && profileData[0].email) {
          foundEmail = profileData[0].email;
        } else {
          // 2. Search in members table by phone
          const { data: memberData } = await supabase
            .from('members')
            .select('email, phone')
            .in('phone', candidatePhones)
            .limit(1);

          if (memberData && memberData.length > 0 && memberData[0].email) {
            foundEmail = memberData[0].email;
          } else {
            // 3. Search in members table by member_id
            const { data: memberById } = await supabase
              .from('members')
              .select('email')
              .eq('member_id', rawInput)
              .limit(1);

            if (memberById && memberById.length > 0 && memberById[0].email) {
              foundEmail = memberById[0].email;
            }
          }
        }

        if (foundEmail) {
          loginEmail = foundEmail;
        } else if (digitsOnly.length >= 10) {
          // Fallback to synthetic email format if phone-based email was generated
          loginEmail = `${standardLocal}@batighor.org`;
        }
      }

      // Execute login
      const { error, isAdmin: userIsAdmin, isMember: userIsMember, isCashier: userIsCashier } = 
        await signIn(loginEmail, password);

      if (error) {
        toast({
          title: language === 'bn' ? 'লগইন ব্যর্থ হয়েছে' : 'Login Failed',
          description: !isEmail && error.message.includes('Invalid login credentials')
            ? (language === 'bn' 
                ? 'মোবাইল নম্বর বা পাসওয়ার্ড সঠিক নয়। আপনার একাউন্ট না থাকলে নিবন্ধন করুন।' 
                : 'Invalid mobile number or password.')
            : error.message,
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
      if (userIsAdmin) {
        navigate('/admin');
      } else if (userIsCashier) {
        navigate('/cashier');
      } else if (userIsMember) {
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
      {/* Top Banner & Breadcrumb */}
      <div className="bg-[#006a4e] text-white py-5 px-4 shadow-sm">
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
          <div className="text-xs text-emerald-200 flex items-center gap-1.5 self-start sm:self-auto">
            <Link to="/" className="hover:text-white transition-colors">
              {language === 'bn' ? 'হোম' : 'Home'}
            </Link>
            <span>/</span>
            <span className="text-white font-medium">
              {language === 'bn' ? 'লগইন' : 'Login'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-b from-slate-50 via-emerald-50/25 to-slate-100 dark:from-slate-950 dark:to-slate-900 min-h-[calc(100vh-280px)] flex items-center">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column (Desktop Showcase & Highlights) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-[#006a4e] dark:bg-emerald-950 dark:text-emerald-300 text-xs sm:text-sm font-semibold shadow-xs">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                {language === 'bn' ? 'একটিমাত্র কেন্দ্রীয় প্রবেশদ্বার' : 'Single Unified Access Portal'}
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-800 dark:text-slate-100 font-heading leading-tight">
                  {language === 'bn' ? (
                    <>
                      স্বাগতম <span className="text-[#006a4e] dark:text-emerald-400">সময়ের বাতিঘর</span> ডিজিটাল প্ল্যাটফর্মে
                    </>
                  ) : (
                    <>
                      Welcome to <span className="text-[#006a4e] dark:text-emerald-400">Samoyer Batighor</span> Portal
                    </>
                  )}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                  {language === 'bn'
                    ? 'আলাদা করে সদস্য, ক্যাশিয়ার বা অ্যাডমিন নির্বাচন করার কোনো প্রয়োজন নেই। আপনার সংরক্ষিত মোবাইল নম্বর অথবা ইমেইল দিয়ে লগইন করলেই সিস্টেম স্বয়ংক্রিয়ভাবে আপনাকে সঠিক ড্যাশবোর্ডে নিয়ে যাবে।'
                    : 'No need to manually select member, cashier, or admin role. Simply enter your registered phone number or email, and the system automatically opens your designated dashboard.'}
                </p>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-[#006a4e] dark:text-emerald-300 shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {language === 'bn' ? 'অটো রোল ডিটেকশন' : 'Auto Role Detection'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {language === 'bn' ? 'অ্যাডমিন, ক্যাশিয়ার ও সদস্য সরাসরি রিডাইরেক্ট' : 'Direct smart routing to your dashboard'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-[#006a4e] dark:text-emerald-300 shrink-0 mt-0.5">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {language === 'bn' ? 'মোবাইল বা ইমেইল সাপোর্ট' : 'Mobile / Email Support'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {language === 'bn' ? 'নম্বর বা ইমেইল যেকোনোটি দিয়ে সহজে প্রবেশ' : 'Sign in easily using phone or email'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-[#006a4e] dark:text-emerald-300 shrink-0 mt-0.5">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {language === 'bn' ? 'ডিজিটাল চাঁদা ও রসিদ' : 'Digital Dues & Receipts'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {language === 'bn' ? 'মাসিক চাঁদা পরিশোধ ও ইনস্ট্যান্ট রসিদ সংগ্রহ' : 'Pay dues and download instant receipts'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-[#006a4e] dark:text-emerald-300 shrink-0 mt-0.5">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {language === 'bn' ? 'রক্তদান ও জরুরি সেবা' : 'Blood & Emergency Aid'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {language === 'bn' ? 'জীবন রক্ষার্থে জরুরি রক্তদাতা ও চিকিৎসা সহায়তা' : 'Immediate blood donation & relief'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Assurance Note */}
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#006a4e] dark:text-emerald-400 shrink-0" />
                <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200">
                  {language === 'bn'
                    ? 'আপনার ব্যক্তিগত তথ্য ও আর্থিক লেনদেনের হিসেব আমাদের ডেটাবেজে সম্পূর্ণ সুরক্ষিত ও এনক্রিপ্টেড থাকে।'
                    : 'Your personal records and financial entries are fully secured and encrypted in our database.'}
                </p>
              </div>
            </div>

            {/* Right Column (Complete Login Card) */}
            <div className="lg:col-span-5 w-full">
              <Card className="shadow-2xl border-2 border-emerald-600/20 bg-white/95 dark:bg-card backdrop-blur-md rounded-2xl overflow-hidden">
                <CardHeader className="text-center pb-5 pt-7 px-6 sm:px-8 bg-gradient-to-b from-emerald-50/50 to-transparent dark:from-emerald-950/20">
                  <div className="w-14 h-14 bg-gradient-to-tr from-[#006a4e] to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md text-white">
                    <Lock className="w-7 h-7" />
                  </div>
                  <CardTitle className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 dark:text-slate-100">
                    {language === 'bn' ? 'লগইন করুন' : 'Sign In'}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {language === 'bn'
                      ? 'মোবাইল নম্বর বা ইমেইল এবং পাসওয়ার্ড দিয়ে প্রবেশ করুন'
                      : 'Enter your phone number or email and password'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-6 sm:px-8 pb-7">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    {/* Identifier: Mobile or Email */}
                    <div className="space-y-1.5">
                      <Label htmlFor="login-identifier" className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center justify-between">
                        <span>{language === 'bn' ? 'মোবাইল নম্বর বা ইমেইল' : 'Mobile Number or Email'}</span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-normal">
                          {language === 'bn' ? 'স্বয়ংক্রিয় সমর্থন' : 'Auto-detected'}
                        </span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="login-identifier"
                          type="text"
                          placeholder={language === 'bn' ? '০১৭১২-xxxxxx অথবা user@mail.com' : '01712xxxxxx or user@mail.com'}
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          className="pl-10 h-11 text-sm border-slate-300 dark:border-slate-700 focus:border-[#006a4e] focus:ring-[#006a4e]"
                          required
                          autoComplete="username"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          {identifier.includes('@') ? (
                            <Mail className="w-4 h-4 text-[#006a4e]" />
                          ) : (
                            <Phone className="w-4 h-4 text-[#006a4e]" />
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {language === 'bn' 
                          ? 'নিবন্ধিত ১১ ডিজিটের মোবাইল নম্বর অথবা ইমেইল অ্যাড্রেস লিখুন' 
                          : 'Enter your 11-digit mobile number or registered email'}
                      </p>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                        </Label>
                      </div>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 h-11 text-sm border-slate-300 dark:border-slate-700 focus:border-[#006a4e] focus:ring-[#006a4e]"
                          required
                          autoComplete="current-password"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Lock className="w-4 h-4 text-[#006a4e]" />
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

                    {/* Submit Button */}
                    <div className="pt-2">
                      <Button 
                        type="submit" 
                        className="w-full h-11 bg-[#006a4e] hover:bg-[#00523c] text-white font-medium text-sm rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2" 
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

                    {/* Registration Redirect */}
                    <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 text-center space-y-2.5">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {language === 'bn' ? 'সংগঠনের সদস্য হতে চান?' : 'Want to become a member?'}
                      </p>
                      <Link 
                        to="/member-registration" 
                        className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg border border-emerald-600/40 text-[#006a4e] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 dark:text-emerald-400 text-xs font-semibold transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" />
                        {language === 'bn' ? 'নতুন সদস্য হিসেবে আবেদন করুন' : 'Apply for New Membership'}
                      </Link>
                    </div>

                    {/* Support Help */}
                    <div className="text-center pt-1">
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
