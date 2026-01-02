import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Bell, User, LogOut, Calendar, AlertCircle, CheckCircle, Key, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';

interface MemberData {
  id: string;
  member_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  occupation: string | null;
  blood_group: string | null;
  member_type: string | null;
  status: string | null;
  joining_date: string | null;
  photo_url: string | null;
}

interface DuesData {
  id: string;
  month_year: string;
  amount: number;
  is_paid: boolean;
  paid_date: string | null;
}

interface NewsData {
  id: string;
  title_bn: string;
  title_en: string | null;
  content_bn: string | null;
  content_en: string | null;
  published_at: string | null;
  image_url: string | null;
}

const MemberDashboard = () => {
  const { language } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch member data
  const { data: memberData, isLoading: memberLoading } = useQuery({
    queryKey: ['member-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as MemberData | null;
    },
    enabled: !!user?.id,
  });

  // Fetch member dues
  const { data: duesData, isLoading: duesLoading } = useQuery({
    queryKey: ['member-dues', memberData?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_dues')
        .select('*')
        .eq('member_id', memberData?.id)
        .order('month_year', { ascending: false });
      
      if (error) throw error;
      return data as DuesData[];
    },
    enabled: !!memberData?.id,
  });

  // Fetch published news
  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ['member-news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data as NewsData[];
    },
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handlePasswordChange = async () => {
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
        description: language === 'bn' ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন হয়েছে' : 'Password changed successfully',
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Calculate dues summary
  const totalDues = duesData?.reduce((acc, due) => acc + due.amount, 0) || 0;
  const paidDues = duesData?.filter(d => d.is_paid).reduce((acc, due) => acc + due.amount, 0) || 0;
  const unpaidDues = totalDues - paidDues;
  const unpaidMonths = duesData?.filter(d => !d.is_paid) || [];

  if (memberLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-destructive">
              {language === 'bn' ? 'সদস্য তথ্য পাওয়া যায়নি' : 'Member data not found'}
            </CardTitle>
            <CardDescription>
              {language === 'bn' 
                ? 'আপনার অ্যাকাউন্ট কোন সদস্যের সাথে সংযুক্ত নয়। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।' 
                : 'Your account is not linked to any member. Please contact the admin.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSignOut} variant="outline" className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              {language === 'bn' ? 'লগআউট' : 'Logout'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={memberData.photo_url || undefined} />
                <AvatarFallback>{memberData.full_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-bold text-lg">{memberData.full_name}</h1>
                <p className="text-sm text-muted-foreground font-mono">{memberData.member_id}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              {language === 'bn' ? 'লগআউট' : 'Logout'}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Welcome Section */}
        <div className="text-center py-4">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-primary">
            {language === 'bn' ? 'সদস্য প্যানেলে স্বাগতম' : 'Welcome to Member Panel'}
          </h2>
          <p className="text-muted-foreground mt-1">
            {language === 'bn' ? 'সময়ের বাতিঘর সমাজ কল্যাণ সমিতি' : 'Samoyer Batighor Social Welfare Association'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'bn' ? 'পরিশোধিত' : 'Paid'}
                  </p>
                  <p className="text-2xl font-bold text-green-600">৳{paidDues}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${unpaidDues > 0 ? 'from-red-500/10 to-red-600/5 border-red-500/20' : 'from-gray-500/10 to-gray-600/5 border-gray-500/20'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${unpaidDues > 0 ? 'bg-red-500/20' : 'bg-gray-500/20'}`}>
                  <CreditCard className={`w-6 h-6 ${unpaidDues > 0 ? 'text-red-600' : 'text-gray-600'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'bn' ? 'বকেয়া' : 'Pending'}
                  </p>
                  <p className={`text-2xl font-bold ${unpaidDues > 0 ? 'text-red-600' : 'text-gray-600'}`}>৳{unpaidDues}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-full">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'bn' ? 'সদস্য প্রকার' : 'Member Type'}
                  </p>
                  <p className="text-lg font-bold capitalize">{memberData.member_type}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dues Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                {language === 'bn' ? 'মাসিক চাঁদা' : 'Monthly Dues'}
              </CardTitle>
              <CardDescription>
                {language === 'bn' ? 'আপনার মাসিক চাঁদার বিবরণ' : 'Your monthly dues details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {duesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : !duesData || duesData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {language === 'bn' ? 'কোন চাঁদার রেকর্ড নেই' : 'No dues records found'}
                </p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {duesData.map((due) => (
                    <div 
                      key={due.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border ${due.is_paid ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'}`}
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{due.month_year}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">৳{due.amount}</span>
                        <Badge variant={due.is_paid ? 'default' : 'destructive'}>
                          {due.is_paid 
                            ? (language === 'bn' ? 'পরিশোধিত' : 'Paid') 
                            : (language === 'bn' ? 'বকেয়া' : 'Unpaid')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {unpaidMonths.length > 0 && (
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        {language === 'bn' 
                          ? `আপনার ${unpaidMonths.length}টি মাসের চাঁদা বকেয়া আছে` 
                          : `You have ${unpaidMonths.length} month(s) of unpaid dues`}
                      </p>
                      <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                        {language === 'bn' 
                          ? 'অনুগ্রহ করে যত তাড়াতাড়ি সম্ভব পরিশোধ করুন' 
                          : 'Please pay as soon as possible'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* News & Notices Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                {language === 'bn' ? 'সংবাদ ও নোটিশ' : 'News & Notices'}
              </CardTitle>
              <CardDescription>
                {language === 'bn' ? 'সর্বশেষ আপডেট' : 'Latest updates'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {newsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : !newsData || newsData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {language === 'bn' ? 'কোন সংবাদ নেই' : 'No news available'}
                </p>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {newsData.map((news) => (
                    <div key={news.id} className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <h4 className="font-semibold mb-1">
                        {language === 'bn' ? news.title_bn : (news.title_en || news.title_bn)}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {language === 'bn' ? news.content_bn : (news.content_en || news.content_bn)}
                      </p>
                      {news.published_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(news.published_at), 'PPP', { 
                            locale: language === 'bn' ? bn : enUS 
                          })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Member Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {language === 'bn' ? 'আমার তথ্য' : 'My Profile'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{language === 'bn' ? 'সদস্য আইডি' : 'Member ID'}</p>
                <p className="font-mono font-medium">{memberData.member_id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{language === 'bn' ? 'ইমেইল' : 'Email'}</p>
                <p className="font-medium">{memberData.email || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{language === 'bn' ? 'ফোন' : 'Phone'}</p>
                <p className="font-medium">{memberData.phone || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{language === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'}</p>
                <p className="font-medium">{memberData.blood_group || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{language === 'bn' ? 'পেশা' : 'Occupation'}</p>
                <p className="font-medium">{memberData.occupation || '-'}</p>
              </div>
              <div className="space-y-1 md:col-span-2 lg:col-span-3">
                <p className="text-sm text-muted-foreground">{language === 'bn' ? 'ঠিকানা' : 'Address'}</p>
                <p className="font-medium">{memberData.address || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Change Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              {language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
            </CardTitle>
            <CardDescription>
              {language === 'bn' ? 'আপনার লগইন পাসওয়ার্ড পরিবর্তন করুন' : 'Change your login password'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}</Label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword || !newPassword || !confirmPassword}
                  className="w-full md:w-auto"
                >
                  {isChangingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {language === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' : 'Password must be at least 6 characters'}
            </p>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground border-t mt-8">
        <p>© {new Date().getFullYear()} {language === 'bn' ? 'সময়ের বাতিঘর সমাজ কল্যাণ সমিতি' : 'Samoyer Batighor Social Welfare Association'}</p>
      </footer>
    </div>
  );
};

export default MemberDashboard;
