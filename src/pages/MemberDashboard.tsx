import React, { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Bell, User, LogOut, Calendar, AlertCircle, CheckCircle, Key, Eye, EyeOff, Printer, TrendingUp, Wallet, Shield, Droplet, Heart, Camera, Upload, X, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import { compressImage } from '@/lib/imageUtils';
import { getDonationEligibility, formatBengaliDate } from '@/lib/bloodUtils';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useReactToPrint } from 'react-to-print';
import TransactionVoucher from '@/components/admin/TransactionVoucher';
import MemberMobileNav from '@/components/member/MemberMobileNav';
import { useMultiTableRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

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
  transaction_id: string | null;
}

interface TransactionData {
  id: string;
  type: string;
  amount: number;
  description_bn: string | null;
  description_en: string | null;
  donor_name: string | null;
  donor_phone: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  transaction_date: string;
  month_year: string | null;
  notes: string | null;
  members?: { full_name: string } | null;
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
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);
  
  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Blood donation update state
  const [isBloodDialogOpen, setIsBloodDialogOpen] = useState(false);
  const [lastDonatedDate, setLastDonatedDate] = useState('');
  const [donationPhoto, setDonationPhoto] = useState<File | null>(null);
  const [donationPhotoPreview, setDonationPhotoPreview] = useState<string | null>(null);
  const [donationNotes, setDonationNotes] = useState('');
  const [isSavingBloodInfo, setIsSavingBloodInfo] = useState(false);

  // Real-time subscriptions for live updates
  const subscriptionTables = React.useMemo(() => [
    { table: 'members' as const, queryKeys: [['member-profile']] },
    { table: 'member_dues' as const, queryKeys: [['member-dues']] },
    { table: 'news' as const, queryKeys: [['member-news']] },
    { table: 'transactions' as const, queryKeys: [['member-dues']] },
  ], []);

  useMultiTableRealtimeSubscription(subscriptionTables);

  // Fetch member data (with fallback lookup by email/phone and auto-link user_id)
  const { data: memberData, isLoading: memberLoading, refetch: refetchMember } = useQuery({
    queryKey: ['member-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // 1. Try matching by user_id
      const { data: memberByUserId } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberByUserId) {
        return memberByUserId as MemberData;
      }

      // 2. Fallback: match by email or phone digits
      const conditions: string[] = [];
      if (user.email) {
        conditions.push(`email.eq.${user.email}`);
        if (user.email.endsWith('@batighor.org')) {
          const rawPhone = user.email.replace('@batighor.org', '');
          if (rawPhone && rawPhone.length >= 10) {
            conditions.push(`phone.eq.${rawPhone}`);
          }
        }
      }
      if (user.phone) {
        conditions.push(`phone.eq.${user.phone}`);
      }

      if (conditions.length > 0) {
        const { data: fallbackMember } = await supabase
          .from('members')
          .select('*')
          .or(conditions.join(','))
          .maybeSingle();

        if (fallbackMember) {
          // Auto-link user_id for seamless future logins
          await supabase
            .from('members')
            .update({ user_id: user.id })
            .eq('id', fallbackMember.id);
          return fallbackMember as MemberData;
        }
      }

      return null;
    },
    enabled: !!user?.id,
    refetchInterval: 5000,
  });

  // Fetch member's blood donor info
  const { data: bloodDonorInfo, refetch: refetchBloodDonor } = useQuery({
    queryKey: ['member-blood-donor-info', memberData?.member_id, memberData?.phone],
    queryFn: async () => {
      if (!memberData) return null;
      const conditions: string[] = [];
      if (memberData.member_id) conditions.push(`member_id.eq.${memberData.member_id}`);
      if (memberData.phone) conditions.push(`phone.eq.${memberData.phone}`);
      if (conditions.length === 0) return null;

      const { data, error } = await supabase
        .from('blood_donors')
        .select('*')
        .or(conditions.join(','))
        .maybeSingle();

      if (error) {
        console.warn('Error fetching donor info:', error);
        return null;
      }
      return data;
    },
    enabled: !!memberData,
  });

  const handleOpenBloodDialog = () => {
    setLastDonatedDate(bloodDonorInfo?.last_donated || '');
    setDonationNotes(bloodDonorInfo?.notes || '');
    setDonationPhoto(null);
    setDonationPhotoPreview(null);
    setIsBloodDialogOpen(true);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDonationPhoto(file);
      setDonationPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveBloodDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberData) return;

    setIsSavingBloodInfo(true);
    try {
      let photoUrlToSave = '';
      if (donationPhoto) {
        const compressed = await compressImage(donationPhoto, 800, 800, 0.88);
        const fileName = `donations/${memberData.member_id || memberData.id}_${Date.now()}.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from('member-photos')
          .upload(fileName, compressed, { upsert: true, contentType: 'image/jpeg' });
        
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('member-photos').getPublicUrl(fileName);
          photoUrlToSave = urlData.publicUrl;
        }
      }

      const noteText = donationNotes.trim() + (photoUrlToSave ? ` [ছবি: ${photoUrlToSave}]` : '');

      if (bloodDonorInfo?.id) {
        // Update existing donor
        const { error } = await supabase
          .from('blood_donors')
          .update({
            last_donated: lastDonatedDate || null,
            notes: noteText || bloodDonorInfo.notes,
            blood_group: memberData.blood_group || bloodDonorInfo.blood_group || 'A+',
            status: 'approved',
            is_member: true,
          })
          .eq('id', bloodDonorInfo.id);

        if (error) throw error;
      } else {
        // Insert new donor
        const { error } = await supabase
          .from('blood_donors')
          .insert({
            member_id: memberData.member_id,
            full_name: memberData.full_name,
            phone: memberData.phone || '',
            blood_group: memberData.blood_group || 'A+',
            address: memberData.address || '',
            last_donated: lastDonatedDate || null,
            notes: noteText || 'সদস্য প্যানেল থেকে রক্তদানের তথ্য আপডেট',
            status: 'approved',
            is_public_details: true,
            is_member: true,
          });

        if (error) throw error;
      }

      await refetchBloodDonor();
      setIsBloodDialogOpen(false);
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'রক্তদানের তথ্য সফলভাবে সংরক্ষিত হয়েছে।' : 'Blood donation information updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message || 'সংরক্ষণ করা যায়নি',
        variant: 'destructive',
      });
    } finally {
      setIsSavingBloodInfo(false);
    }
  };

  // Voucher print state
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [printTransaction, setPrintTransaction] = useState<TransactionData | null>(null);
  const [isLoadingTransaction, setIsLoadingTransaction] = useState(false);
  const voucherRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: voucherRef,
    documentTitle: `Voucher-${printTransaction?.payment_reference || 'receipt'}`,
  });

  // Member data query declared at top

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

  // Handle voucher print for paid dues
  const handleViewVoucher = async (due: DuesData) => {
    if (!due.transaction_id) {
      toast({
        title: language === 'bn' ? 'তথ্য নেই' : 'No data',
        description: language === 'bn' ? 'এই পেমেন্টের জন্য ট্রানজেকশন তথ্য পাওয়া যায়নি' : 'No transaction data found for this payment',
        variant: 'destructive',
      });
      return;
    }

    setIsLoadingTransaction(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', due.transaction_id)
        .single();

      if (error) throw error;

      // Add member name to transaction
      const transactionWithMember: TransactionData = {
        ...data,
        members: memberData ? { full_name: memberData.full_name } : null,
      };

      setPrintTransaction(transactionWithMember);
      setIsPrintDialogOpen(true);
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingTransaction(false);
    }
  };

  // Calculate dues summary
  const totalDues = duesData?.reduce((acc, due) => acc + due.amount, 0) || 0;
  const paidDues = duesData?.filter(d => d.is_paid).reduce((acc, due) => acc + due.amount, 0) || 0;
  const unpaidDues = totalDues - paidDues;
  const unpaidMonths = duesData?.filter(d => !d.is_paid) || [];

  if (loading || memberLoading) {
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 pb-20 md:pb-0">
      {/* Header - Enhanced */}
      <header className="bg-gradient-to-r from-primary/90 to-primary sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12 ring-2 ring-white/30 ring-offset-2 ring-offset-primary/50">
                <AvatarImage src={memberData.photo_url || undefined} />
                <AvatarFallback className="bg-white/20 text-white font-bold text-lg">{memberData.full_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-bold text-lg text-white">{memberData.full_name}</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                    {memberData.member_id}
                  </Badge>
                  <Badge className="bg-white/20 text-white border-0 capitalize text-xs">
                    {memberData.member_type}
                  </Badge>
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="hidden md:flex text-white hover:bg-white/20 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {language === 'bn' ? 'লগআউট' : 'Logout'}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Welcome Section - Enhanced */}
        <div id="dashboard" className="text-center py-6 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full text-primary text-sm font-medium">
            <Shield className="w-4 h-4" />
            {language === 'bn' ? 'সদস্য প্যানেল' : 'Member Panel'}
          </div>
          <h2 className="text-2xl md:text-4xl font-heading font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {language === 'bn' ? 'স্বাগতম,' : 'Welcome,'} {memberData.full_name.split(' ')[0]}!
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {language === 'bn' ? 'সময়ের বাতিঘর সমাজ কল্যাণ সমিতি' : 'Samoyer Batighor Social Welfare Association'}
          </p>
        </div>

        {/* Stats Cards - Enhanced */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-500/20 rounded-xl">
                  <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {language === 'bn' ? 'পরিশোধিত' : 'Paid'}
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-green-600">৳{paidDues.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${unpaidDues > 0 ? 'from-red-500/10 to-red-600/5 border-red-500/20' : 'from-gray-500/10 to-gray-600/5 border-gray-500/20'}`}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${unpaidDues > 0 ? 'bg-red-500/20' : 'bg-gray-500/20'}`}>
                  <Wallet className={`w-5 h-5 md:w-6 md:h-6 ${unpaidDues > 0 ? 'text-red-600' : 'text-gray-600'}`} />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {language === 'bn' ? 'বকেয়া' : 'Pending'}
                  </p>
                  <p className={`text-xl md:text-2xl font-bold ${unpaidDues > 0 ? 'text-red-600' : 'text-gray-600'}`}>৳{unpaidDues.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] col-span-2 md:col-span-1">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/20 rounded-xl">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {language === 'bn' ? 'মোট চাঁদা' : 'Total Dues'}
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-primary">৳{totalDues.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Blood Donation Status & Update Card (Mobile Responsive) */}
        {(() => {
          const donorEligibility = getDonationEligibility(bloodDonorInfo?.last_donated || null);
          const donorBloodGroup = memberData.blood_group || bloodDonorInfo?.blood_group || 'অনির্ধারিত';
          
          return (
            <Card className="rounded-[24px] border border-rose-100 shadow-[0_8px_30px_rgba(225,29,72,0.06)] overflow-hidden bg-white relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-rose-100/40 via-rose-50/20 to-transparent pointer-events-none rounded-bl-full" />
              
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <Droplet className="w-6 h-6 stroke-[2.4] fill-rose-500/20 text-rose-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-heading font-black text-base sm:text-lg text-slate-800">
                          {language === 'bn' ? 'রক্তদানের তথ্য ও প্রস্তুতি' : 'Blood Donation Status'}
                        </h3>
                        <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-extrabold text-xs">
                          {donorBloodGroup}
                        </Badge>
                        <Badge 
                          className={`text-xs font-bold ${
                            donorEligibility.isReady 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {donorEligibility.isReady ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {language === 'bn' ? 'রক্তদানের জন্য প্রস্তুত' : 'Ready to Donate'}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              {language === 'bn' ? donorEligibility.labelBn : donorEligibility.labelEn}
                            </span>
                          )}
                        </Badge>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-500 font-medium">
                        {language === 'bn' ? 'সর্বশেষ রক্তদান: ' : 'Last Donated: '}
                        <span className="font-bold text-slate-800">
                          {bloodDonorInfo?.last_donated ? formatBengaliDate(bloodDonorInfo.last_donated) : (language === 'bn' ? 'এখনও তথ্য যুক্ত করা হয়নি' : 'Not recorded yet')}
                        </span>
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleOpenBloodDialog}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#0B6B3A] hover:bg-[#08522c] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Heart className="w-4 h-4 fill-white/30" />
                    <span>{language === 'bn' ? 'সর্বশেষ রক্তদান আপডেট করুন' : 'Update Last Donation'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Dialog to Update Last Blood Donation Date & Photo */}
        <Dialog open={isBloodDialogOpen} onOpenChange={setIsBloodDialogOpen}>
          <DialogContent className="max-w-md rounded-[24px] p-6 bg-white shadow-2xl">
            <DialogHeader className="pb-3 border-b border-slate-100">
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-800 font-heading">
                <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Droplet className="w-4 h-4" />
                </span>
                {language === 'bn' ? 'রক্তদানের তথ্য আপডেট' : 'Update Blood Donation Info'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveBloodDonation} className="space-y-4 pt-3">
              <div className="space-y-1.5">
                <Label htmlFor="last-donation-date" className="text-xs font-bold text-slate-700">
                  {language === 'bn' ? 'সর্বশেষ কত তারিখে রক্ত দিয়েছেন? *' : 'Last Donation Date *'}
                </Label>
                <Input
                  id="last-donation-date"
                  type="date"
                  value={lastDonatedDate}
                  onChange={(e) => setLastDonatedDate(e.target.value)}
                  className="rounded-xl border-slate-200 h-11 text-sm font-medium"
                  required
                />
                <p className="text-[11px] text-slate-500">
                  {language === 'bn' ? 'তারিখ দিলে স্বয়ংক্রিয়ভাবে পরবর্তী রক্তদানের হিসাব প্রস্তুত হবে।' : 'Calculates 90-day rest and next eligibility automatically.'}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  {language === 'bn' ? 'রক্তদানের ছবি বা প্রশংসাপত্র (ঐচ্ছিক)' : 'Donation Photo or Certificate (Optional)'}
                </Label>
                
                {donationPhotoPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-36 bg-slate-50 flex items-center justify-center">
                    <img src={donationPhotoPreview} alt="Donation preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setDonationPhoto(null);
                        setDonationPhotoPreview(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/20">
                    <Camera className="w-7 h-7 text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-slate-600">
                      {language === 'bn' ? 'ছবি আপলোড করতে ক্লিক করুন' : 'Click to upload photo'}
                    </span>
                    <span className="text-[10px] text-slate-400">JPG, PNG (Max 5MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="donation-notes" className="text-xs font-bold text-slate-700">
                  {language === 'bn' ? 'রক্তদানের স্থান / বিবরণ (ঐচ্ছিক)' : 'Location or Details (Optional)'}
                </Label>
                <Input
                  id="donation-notes"
                  type="text"
                  placeholder={language === 'bn' ? 'যেমন: নওগাঁ সদর হাসপাতাল' : 'e.g., Naogaon Sadar Hospital'}
                  value={donationNotes}
                  onChange={(e) => setDonationNotes(e.target.value)}
                  className="rounded-xl border-slate-200 h-10 text-sm"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBloodDialogOpen(false)}
                  className="rounded-xl text-xs font-bold"
                  disabled={isSavingBloodInfo}
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingBloodInfo}
                  className="rounded-xl bg-[#0B6B3A] hover:bg-[#08522c] text-white text-xs font-bold px-5"
                >
                  {isSavingBloodInfo ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      {language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}
                    </>
                  ) : (
                    language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Details'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <div id="dues" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
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
                      <div className="flex items-center gap-2">
                        <span className="font-bold">৳{due.amount}</span>
                        <Badge variant={due.is_paid ? 'default' : 'destructive'}>
                          {due.is_paid 
                            ? (language === 'bn' ? 'পরিশোধিত' : 'Paid') 
                            : (language === 'bn' ? 'বকেয়া' : 'Unpaid')}
                        </Badge>
                        {due.is_paid && due.transaction_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleViewVoucher(due)}
                            disabled={isLoadingTransaction}
                            title={language === 'bn' ? 'ভাউচার দেখুন' : 'View Voucher'}
                          >
                            {isLoadingTransaction ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Printer className="w-4 h-4 text-primary" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {unpaidMonths.length > 0 && (
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                    <Button 
                      onClick={() => navigate('/member-dashboard/pay-dues')}
                      className="bg-gradient-to-r from-primary to-primary/80 shrink-0"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {language === 'bn' ? 'এখনই পরিশোধ করুন' : 'Pay Now'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-amber-500/5 to-amber-500/10 border-b">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Bell className="w-5 h-5 text-amber-600" />
                </div>
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
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {newsData.map((news, index) => (
                    <div key={news.id} className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all duration-200 hover:shadow-sm group">
                      <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">
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

        <Card id="profile" className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-500/5 to-blue-500/10 border-b">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              {language === 'bn' ? 'আমার তথ্য' : 'My Profile'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                <p className="text-xs md:text-sm text-muted-foreground">{language === 'bn' ? 'সদস্য আইডি' : 'Member ID'}</p>
                <p className="font-mono font-semibold text-sm md:text-base">{memberData.member_id}</p>
              </div>
              <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                <p className="text-xs md:text-sm text-muted-foreground">{language === 'bn' ? 'ইমেইল' : 'Email'}</p>
                <p className="font-medium text-sm md:text-base truncate">{memberData.email || '-'}</p>
              </div>
              <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                <p className="text-xs md:text-sm text-muted-foreground">{language === 'bn' ? 'ফোন' : 'Phone'}</p>
                <p className="font-medium text-sm md:text-base">{memberData.phone || '-'}</p>
              </div>
              <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                <p className="text-xs md:text-sm text-muted-foreground">{language === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'}</p>
                <p className="font-bold text-lg text-red-600">{memberData.blood_group || '-'}</p>
              </div>
              <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                <p className="text-xs md:text-sm text-muted-foreground">{language === 'bn' ? 'পেশা' : 'Occupation'}</p>
                <p className="font-medium text-sm md:text-base">{memberData.occupation || '-'}</p>
              </div>
              <div className="space-y-1 p-3 bg-muted/30 rounded-lg col-span-2 lg:col-span-3">
                <p className="text-xs md:text-sm text-muted-foreground">{language === 'bn' ? 'ঠিকানা' : 'Address'}</p>
                <p className="font-medium text-sm md:text-base">{memberData.address || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card id="password" className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-500/5 to-purple-500/10 border-b">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Key className="w-5 h-5 text-purple-600" />
              </div>
              {language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
            </CardTitle>
            <CardDescription>
              {language === 'bn' ? 'আপনার লগইন পাসওয়ার্ড পরিবর্তন করুন' : 'Change your login password'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
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

      {/* Print Voucher Dialog */}
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{language === 'bn' ? 'পেমেন্ট রসিদ' : 'Payment Receipt'}</span>
              <Button onClick={() => handlePrint()} className="ml-4">
                <Printer className="h-4 w-4 mr-2" />
                {language === 'bn' ? 'প্রিন্ট করুন' : 'Print'}
              </Button>
            </DialogTitle>
          </DialogHeader>
          {printTransaction && (
            <TransactionVoucher
              ref={voucherRef}
              transaction={printTransaction}
              language={language as 'bn' | 'en'}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground border-t mt-8 mb-16 md:mb-0">
        <p>© {new Date().getFullYear()} {language === 'bn' ? 'সময়ের বাতিঘর সমাজ কল্যাণ সমিতি' : 'Samoyer Batighor Social Welfare Association'}</p>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MemberMobileNav />
    </div>
  );
};

export default MemberDashboard;
