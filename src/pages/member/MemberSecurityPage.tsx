import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Key, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Loader2, 
  Lock, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

const MemberSecurityPage = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' : 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'উভয় পাসওয়ার্ড একই হতে হবে' : 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      // Synchronize new password to member synthetic identities (phone & email)
      if (user) {
        try {
          const { data: memberRow } = await supabase
            .from('members')
            .select('id, full_name, phone, email')
            .or(`user_id.eq.${user.id},email.eq.${user.email || ''}`)
            .maybeSingle();

          if (memberRow) {
            const mDigits = memberRow.phone ? memberRow.phone.replace(/\D/g, '') : '';
            const mStd = mDigits.length === 11 ? mDigits : (mDigits.length === 13 && mDigits.startsWith('88')) ? mDigits.slice(2) : mDigits;
            
            // Sync phone email identity
            if (mStd.length >= 10) {
              await supabase.functions.invoke('create-member-user', {
                body: {
                  email: `${mStd}@batighor.org`,
                  password: newPassword,
                  memberId: memberRow.id,
                  fullName: memberRow.full_name,
                },
              });
            }

            // Sync personal email identity if different
            if (memberRow.email && memberRow.email.toLowerCase() !== user.email?.toLowerCase()) {
              await supabase.functions.invoke('create-member-user', {
                body: {
                  email: memberRow.email.toLowerCase().trim(),
                  password: newPassword,
                  memberId: memberRow.id,
                  fullName: memberRow.full_name,
                },
              });
            }
          }
        } catch (syncErr) {
          console.warn('Member secondary credential sync non-fatal:', syncErr);
        }
      }

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে। এখন নতুন পাসওয়ার্ড দিয়ে ফোন বা আইডি দিয়ে লগইন করতে পারবেন।' : 'Password changed successfully',
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: err.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] text-[#0B6B3A] text-xs font-bold shadow-2xs">
          <Key className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{language === 'bn' ? 'নিরাপত্তা ও সেটিংস' : 'Security & Access'}</span>
        </div>
        <div className="mt-1.5">
          <h2 className="text-2xl sm:text-3xl font-black text-[#14231B] font-heading tracking-tight leading-tight">
            {language === 'bn' ? 'পাসওয়ার্ড ও অ্যাকাউন্ট নিরাপত্তা' : 'Password & Security'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            {language === 'bn' 
              ? 'আপনার সদস্য অ্যাকাউন্টের লগইন পাসওয়ার্ড পরিবর্তন করুন এবং নিরাপত্তা নিশ্চিত করুন' 
              : 'Change login password and secure your member account'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Password Form */}
        <div className="lg:col-span-2">
          <Card className="rounded-[24px] border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#E6F4EA] text-[#0B6B3A] flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 font-heading">
                {language === 'bn' ? 'নতুন পাসওয়ার্ড সেট করুন' : 'Set New Password'}
              </h3>
            </div>

            <CardContent className="p-5 sm:p-6">
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                <div className="space-y-1.5">
                  <Label htmlFor="new-pass" className="text-xs font-bold text-slate-700">
                    {language === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'} *
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-pass"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="rounded-xl text-sm pr-10"
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {language === 'bn' ? 'কমপক্ষে ৬ অক্ষর বা সংখ্যা প্রদান করুন।' : 'Minimum 6 characters or numbers.'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pass" className="text-xs font-bold text-slate-700">
                    {language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'} *
                  </Label>
                  <Input
                    id="confirm-pass"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="rounded-xl text-sm"
                    required
                    minLength={6}
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-xl bg-[#0B6B3A] hover:bg-[#09572E] text-white font-bold text-xs px-6 py-2.5"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                        {language === 'bn' ? 'পরিবর্তন হচ্ছে...' : 'Updating...'}
                      </>
                    ) : (
                      language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Update Password'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Security Tips */}
        <div>
          <Card className="rounded-[24px] border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden bg-white">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0B6B3A]" />
              <h4 className="font-bold text-sm text-slate-800">
                {language === 'bn' ? 'অ্যাকাউন্ট সুরক্ষা টিপস' : 'Security Best Practices'}
              </h4>
            </div>
            <CardContent className="p-5 text-xs text-slate-500 space-y-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#0B6B3A] shrink-0 mt-0.5" />
                <p>
                  {language === 'bn' 
                    ? 'সহজ পাসওয়ার্ড যেমন 123456 বা নিজের নাম পরিহার করুন।' 
                    : 'Avoid predictable passwords like 123456 or your name.'}
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#0B6B3A] shrink-0 mt-0.5" />
                <p>
                  {language === 'bn' 
                    ? 'আপনার লগইন পাসওয়ার্ড অন্য কারো সাথে শেয়ার করবেন না।' 
                    : 'Never share your account password with anyone.'}
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#0B6B3A] shrink-0 mt-0.5" />
                <p>
                  {language === 'bn' 
                    ? 'যেকোনো পাবলিক কম্পিউটার বা সাইবার ক্যাফেতে ব্যবহারের পর অবশ্যই লগআউট করুন।' 
                    : 'Always logout when accessing from public computers.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MemberSecurityPage;

