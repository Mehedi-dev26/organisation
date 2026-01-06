import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, Shield, Users, Wallet, ArrowLeft, Home } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<'admin' | 'member' | 'cashier'>('member');
  
  const { signIn, user, isAdmin, isMember, isCashier, loading, rolesLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Only redirect after both loading and rolesLoading are complete
    if (!loading && !rolesLoading && user) {
      // Redirect based on role
      if (isAdmin) {
        navigate('/admin');
      } else if (isCashier) {
        navigate('/cashier');
      } else if (isMember) {
        navigate('/member-dashboard');
      }
      // If user exists but has no recognized role, don't redirect - stay on auth page
    }
  }, [user, isAdmin, isMember, isCashier, loading, rolesLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error, isAdmin: userIsAdmin, isMember: userIsMember, isCashier: userIsCashier } = await signIn(email, password);

    if (error) {
      toast({
        title: language === 'bn' ? 'লগইন ব্যর্থ' : 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      // Validate login type matches role
      if (loginType === 'admin' && !userIsAdmin) {
        toast({
          title: language === 'bn' ? 'অননুমোদিত' : 'Unauthorized',
          description: language === 'bn' ? 'আপনি অ্যাডমিন নন' : 'You are not an admin',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      if (loginType === 'cashier' && !userIsCashier) {
        toast({
          title: language === 'bn' ? 'অননুমোদিত' : 'Unauthorized',
          description: language === 'bn' ? 'আপনি ক্যাশিয়ার নন' : 'You are not a cashier',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      if (loginType === 'member' && !userIsMember && !userIsAdmin && !userIsCashier) {
        toast({
          title: language === 'bn' ? 'অননুমোদিত' : 'Unauthorized',
          description: language === 'bn' ? 'আপনি নিবন্ধিত সদস্য নন' : 'You are not a registered member',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'সফলভাবে লগইন হয়েছে' : 'Successfully logged in',
      });

      // Navigate based on role
      if (userIsAdmin) {
        navigate('/admin');
      } else if (userIsCashier) {
        navigate('/cashier');
      } else if (userIsMember) {
        navigate('/member-dashboard');
      } else {
        navigate('/');
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      {/* Back Button - Fixed Position */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/')}
          className="gap-2 bg-background/80 backdrop-blur-sm shadow-md hover:bg-background"
        >
          <ArrowLeft className="w-4 h-4" />
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">
            {language === 'bn' ? 'হোমপেজ' : 'Home'}
          </span>
        </Button>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-primary/20">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-heading text-primary">
            {language === 'bn' ? 'সময়ের বাতিঘর' : 'Samoyer Batighor'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {language === 'bn' ? 'লগইন করুন' : 'Login to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Login Type Selection */}
          <div className="mb-6">
            <Label className="text-sm text-muted-foreground mb-2 block">
              {language === 'bn' ? 'লগইন প্রকার নির্বাচন করুন' : 'Select Login Type'}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={loginType === 'member' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => setLoginType('member')}
                size="sm"
              >
                <Users className="w-4 h-4" />
                {language === 'bn' ? 'সদস্য' : 'Member'}
              </Button>
              <Button
                type="button"
                variant={loginType === 'cashier' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => setLoginType('cashier')}
                size="sm"
              >
                <Wallet className="w-4 h-4" />
                {language === 'bn' ? 'ক্যাশিয়ার' : 'Cashier'}
              </Button>
              <Button
                type="button"
                variant={loginType === 'admin' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => setLoginType('admin')}
                size="sm"
              >
                <Shield className="w-4 h-4" />
                {language === 'bn' ? 'অ্যাডমিন' : 'Admin'}
              </Button>
            </div>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">{language === 'bn' ? 'ইমেইল' : 'Email'}</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">{language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loginType === 'member' 
                ? (language === 'bn' ? 'সদস্য লগইন' : 'Member Login')
                : loginType === 'cashier'
                ? (language === 'bn' ? 'ক্যাশিয়ার লগইন' : 'Cashier Login')
                : (language === 'bn' ? 'অ্যাডমিন লগইন' : 'Admin Login')}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground mt-4">
              {loginType === 'member' && (language === 'bn' 
                ? 'সদস্য অ্যাকাউন্ট অ্যাডমিন দ্বারা তৈরি করা হয়। নতুন সদস্য হতে অ্যাডমিনের সাথে যোগাযোগ করুন।' 
                : 'Member accounts are created by admins. Contact admin to become a member.')}
              {loginType === 'cashier' && (language === 'bn' 
                ? 'ক্যাশিয়ার অ্যাকাউন্ট অ্যাডমিন দ্বারা তৈরি করা হয়।' 
                : 'Cashier accounts are created by admins.')}
              {loginType === 'admin' && (language === 'bn' 
                ? 'অ্যাডমিন অ্যাকাউন্ট সিস্টেম দ্বারা তৈরি করা হয়।' 
                : 'Admin accounts are created by the system.')}
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
