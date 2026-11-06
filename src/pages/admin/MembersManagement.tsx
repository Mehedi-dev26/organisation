import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Upload,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Printer,
  Key,
  Users,
  Ban,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  RefreshCw,
  Droplet,
  Briefcase,
  ShieldCheck,
  Calendar,
  Filter,
  Sparkles,
  QrCode,
  RotateCcw,
  MoreVertical,
  Copy,
  Check,
  Laptop,
  Smartphone,
  Globe,
  Coins,
  FileText,
  CheckCircle2,
  AlertCircle,
  Heart,
} from 'lucide-react';
import { compressImage, formatFileSize } from '@/lib/imageUtils';
import { useReactToPrint } from 'react-to-print';
import { bangladeshGeoData, professionsList, getUnionsForUpazila } from '@/data/bangladeshGeoData';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import { computeNextMemberId, generateNextMemberId } from '@/lib/memberIdUtils';
import { sendTemplatedSms } from '@/services/smsService';
import { extractDeviceAudit } from '@/lib/deviceAudit';

export interface Member {
  id: string;
  member_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  present_address?: string | null;
  permanent_address?: string | null;
  occupation: string | null;
  blood_group: string | null;
  member_type: string | null;
  status: string | null;
  joining_date: string | null;
  photo_url: string | null;
  user_id: string | null;
  willing_to_donate_blood?: boolean | null;
  willing_to_pay_subscription?: boolean | null;
  subscription_frequency?: string | null;
  subscription_amount?: number | null;
  created_at?: string | null;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const MembersManagement: React.FC = () => {
  const { language } = useLanguage();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const { logoUrl } = useSiteLogo();
  const queryClient = useQueryClient();

  // Dialogs & Modals
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [idCardMember, setIdCardMember] = useState<Member | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [idCardSide, setIdCardSide] = useState<'both' | 'front' | 'back'>('both');

  // Filtering & Search
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState(urlSearch);

  useEffect(() => {
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [urlSearch]);
  const [selectedMemberType, setSelectedMemberType] = useState<string>('all');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('all');

  // Image upload
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleCopyPhone = (phone: string) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    toast({
      title: language === 'bn' ? 'কপি হয়েছে' : 'Copied',
      description: language === 'bn' ? `মোবাইল নম্বর ${phone} কপি করা হয়েছে` : `Phone number ${phone} copied to clipboard`,
    });
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const idCardPrintRef = useRef<HTMLDivElement>(null);
  const applicationPrintRef = useRef<HTMLDivElement>(null);

  // Form Cascading Address State
  const [geoDivision, setGeoDivision] = useState<string>('রাজশাহী');
  const [geoDistrict, setGeoDistrict] = useState<string>('নওগাঁ');
  const [geoUpazila, setGeoUpazila] = useState<string>('নওগাঁ সদর');
  const [geoUnion, setGeoUnion] = useState<string>('নওগাঁ পৌরসভা');
  const [geoVillage, setGeoVillage] = useState<string>('');

  const [formData, setFormData] = useState({
    member_id: '',
    full_name: '',
    email: '',
    phone: '',
    address: '',
    occupation: '',
    blood_group: 'A+',
    member_type: 'general',
    status: 'approved',
    photo_url: '',
  });

  // Print Handlers
  const handlePrintList = useReactToPrint({
    contentRef: printRef,
    documentTitle: language === 'bn' ? 'সদস্য তালিকা - সময়ের বাতিঘর' : 'Members List - Somoyer Batighor',
  });

  const handlePrintIdCard = useReactToPrint({
    contentRef: idCardPrintRef,
    documentTitle: `${idCardMember?.member_id || 'member'}-id-card`,
  });

  const handlePrintApplication = useReactToPrint({
    contentRef: applicationPrintRef,
    documentTitle: `${viewingMember?.member_id || 'member'}-application-dossier`,
  });

  // Enable Realtime Subscription
  useRealtimeSubscription({ table: 'members', queryKey: ['admin-members'] });
  useRealtimeSubscription({ table: 'members', queryKey: ['admin-badge-pending-members'] });
  useRealtimeSubscription({ table: 'members', queryKey: ['notice-pending-members'] });

  // Query Members
  const { data: members, isLoading, refetch } = useQuery({
    queryKey: ['admin-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Member[];
    },
  refetchInterval: 5000,
  });

  // Cascading Address Options
  const availableDistricts = useMemo(() => {
    const div = bangladeshGeoData.find((d) => d.name === geoDivision);
    return div ? div.districts : [];
  }, [geoDivision]);

  const availableUpazilas = useMemo(() => {
    const dist = availableDistricts.find((d) => d.name === geoDistrict);
    return dist ? dist.upazilas : [];
  }, [availableDistricts, geoDistrict]);

  const availableUnions = useMemo(() => {
    return getUnionsForUpazila(geoDistrict, geoUpazila);
  }, [geoDistrict, geoUpazila]);

  // Statistics for Top 4 Cards
  const stats = useMemo(() => {
    const total = members?.length || 0;
    const approved = members?.filter((m) => m.status === 'approved').length || 0;
    const pending = members?.filter((m) => m.status === 'pending').length || 0;
    const rejected =
      members?.filter((m) => m.status === 'rejected' || m.status === 'suspended').length || 0;

    return { total, approved, pending, rejected };
  }, [members]);

  // Filtered Members
  const filteredMembers = useMemo(() => {
    if (!members) return [];

    return members.filter((member) => {
      // Status Filter
      if (selectedStatus === 'approved' && member.status !== 'approved') return false;
      if (selectedStatus === 'pending' && member.status !== 'pending') return false;
      if (
        selectedStatus === 'rejected' &&
        member.status !== 'rejected' &&
        member.status !== 'suspended'
      )
        return false;

      // Member Type Filter
      if (selectedMemberType !== 'all' && member.member_type !== selectedMemberType) return false;

      // Blood Group Filter
      if (selectedBloodGroup !== 'all' && member.blood_group !== selectedBloodGroup) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = member.full_name?.toLowerCase().includes(q);
        const matchesId = member.member_id?.toLowerCase().includes(q);
        const matchesPhone = member.phone?.toLowerCase().includes(q);
        const matchesEmail = member.email?.toLowerCase().includes(q);
        const matchesAddr = member.address?.toLowerCase().includes(q);
        const matchesOcc = member.occupation?.toLowerCase().includes(q);

        if (
          !matchesName &&
          !matchesId &&
          !matchesPhone &&
          !matchesEmail &&
          !matchesAddr &&
          !matchesOcc
        ) {
          return false;
        }
      }

      return true;
    });
  }, [members, selectedStatus, selectedMemberType, selectedBloodGroup, searchQuery]);

  // One-time auto-migration for legacy member ID format to sequential SB-2601
  const migrationAttempted = useRef(false);
  useEffect(() => {
    if (!members || members.length === 0 || migrationAttempted.current || !isAdmin) return;
    const legacyMember = members.find(
      (m) => m.member_id === 'SB-001' || m.member_id === 'SB-2026-2719' || m.member_id === 'SB-0001' || m.member_id === '001'
    );
    if (legacyMember) {
      migrationAttempted.current = true;
      const migrateLegacyId = async () => {
        try {
          const oldId = legacyMember.member_id;
          const { error: memberErr } = await supabase
            .from('members')
            .update({ member_id: 'SB-2601' })
            .eq('id', legacyMember.id);

          if (!memberErr) {
            // Also synchronize blood donors table
            await supabase
              .from('blood_donors')
              .update({ member_id: 'SB-2601' })
              .eq('member_id', oldId);

            refetch();
            console.log(`Successfully migrated legacy member ${oldId} to SB-2601`);
          }
        } catch (e) {
          console.warn('Auto-migration error:', e);
        }
      };
      migrateLegacyId();
    }
  }, [members, isAdmin, refetch]);

  // Generate Next Member ID with Year Serial (Sequential: SB-2601, SB-2602, ...)
  const generateMemberId = () => {
    const ids = members?.map((m) => m.member_id) || [];
    return computeNextMemberId(ids, { prefix: 'SB-', padLength: 2 });
  };

  // Mutations
  // Helper to sync all member and dashboard cache queries across the system
  const invalidateAllMemberQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-members'] });
    queryClient.invalidateQueries({ queryKey: ['public-members'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    queryClient.invalidateQueries({ queryKey: ['admin-badge-pending-members'] });
    queryClient.invalidateQueries({ queryKey: ['notice-pending-members'] });
    queryClient.invalidateQueries({ queryKey: ['home-live-stats'] });
    queryClient.invalidateQueries({ queryKey: ['members-list'] });
    queryClient.invalidateQueries({ queryKey: ['members-for-dues'] });
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: newMember, error } = await supabase
        .from('members')
        .insert([{ ...data }])
        .select()
        .single();

      if (error) throw error;

      if (data.email && newMember) {
        try {
          await supabase.functions.invoke('create-member-user', {
            body: {
              email: data.email,
              password: 'member@123',
              memberId: newMember.id,
              fullName: data.full_name,
            },
          });
        } catch (accountError) {
          console.error('Failed to create member account:', accountError);
        }
      }
    },
    onSuccess: () => {
      invalidateAllMemberQueries();
      refetch();
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description:
          language === 'bn'
            ? 'নতুন সদস্য সফলভাবে যুক্ত হয়েছে।'
            : 'New member successfully added.',
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('members').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAllMemberQueries();
      refetch();
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description:
          language === 'bn'
            ? 'সদস্যের তথ্য সফলভাবে আপডেট হয়েছে।'
            : 'Member details successfully updated.',
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // 1. Fetch member details before deleting for storage and relations cleanup
      const { data: memberToDelete } = await supabase
        .from('members')
        .select('id, member_id, phone, photo_url, user_id')
        .eq('id', id)
        .maybeSingle();

      if (memberToDelete) {
        // A. Free up Supabase storage: Delete member's uploaded photo from 'member-photos'
        if (memberToDelete.photo_url) {
          try {
            const marker = '/member-photos/';
            const markerIdx = memberToDelete.photo_url.indexOf(marker);
            if (markerIdx !== -1) {
              const rawPath = memberToDelete.photo_url.substring(markerIdx + marker.length).split('?')[0];
              const cleanPath = decodeURIComponent(rawPath);
              await supabase.storage.from('member-photos').remove([cleanPath]);
            }
          } catch (storageErr) {
            console.warn('Storage image cleanup error:', storageErr);
          }
        }

        // B. Delete associated blood donor record
        try {
          const conditions: string[] = [];
          if (memberToDelete.member_id) conditions.push(`member_id.eq.${memberToDelete.member_id}`);
          if (memberToDelete.phone) conditions.push(`phone.eq.${memberToDelete.phone}`);
          if (conditions.length > 0) {
            await supabase.from('blood_donors').delete().or(conditions.join(','));
          }
        } catch (bdErr) {
          console.warn('Blood donor deletion error:', bdErr);
        }

        // C. Delete associated dues
        try {
          await supabase.from('member_dues').delete().eq('member_id', id);
        } catch (duesErr) {
          console.warn('Member dues deletion error:', duesErr);
        }

        // D. Delete associated user_roles if linked
        if (memberToDelete.user_id) {
          try {
            await supabase.from('user_roles').delete().eq('user_id', memberToDelete.user_id);
          } catch (rolesErr) {
            console.warn('User roles deletion error:', rolesErr);
          }
        }
      }

      // E. Finally, delete member row
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAllMemberQueries();
      queryClient.invalidateQueries({ queryKey: ['admin-blood-donors'] });
      queryClient.invalidateQueries({ queryKey: ['blood-donors'] });
      queryClient.invalidateQueries({ queryKey: ['storage-usage'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      refetch();
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description:
          language === 'bn'
            ? 'সদস্য, সম্পর্কিত রক্তদাতা তথ্য ও ক্লাউড স্টোরেজের ছবি স্থায়ীভাবে মুছে ফেলা হয়েছে।'
            : 'Member, donor profile and cloud photo completely deleted.',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name?: string }) => {
      // 1. Fetch full member data
      const { data: memberData } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .single();

      if (!memberData) throw new Error('Member data not found');

      // Ensure valid sequential member_id with year exists (e.g. SB-2601)
      let finalMemberId = memberData.member_id;
      if (!finalMemberId || finalMemberId === 'SB-001' || finalMemberId === 'SB-2026-2719' || finalMemberId === '001') {
        finalMemberId = (finalMemberId === 'SB-001' || finalMemberId === '001') ? 'SB-2601' : generateMemberId();
      }

      // 2. Update member status to approved and member_id
      const { error: memberError } = await supabase
        .from('members')
        .update({ 
          status: 'approved',
          member_id: finalMemberId
        })
        .eq('id', id);
      if (memberError) throw memberError;

      // 3. Automatically synchronize blood_donors table to 'approved'
      if (memberData.blood_group) {
        try {
          const conditions: string[] = [];
          if (finalMemberId) conditions.push(`member_id.eq.${finalMemberId}`);
          if (memberData.member_id && memberData.member_id !== finalMemberId) {
            conditions.push(`member_id.eq.${memberData.member_id}`);
          }
          if (memberData.phone) conditions.push(`phone.eq.${memberData.phone}`);

          let existingDonor = null;
          if (conditions.length > 0) {
            const { data } = await supabase
              .from('blood_donors')
              .select('id')
              .or(conditions.join(','))
              .maybeSingle();
            existingDonor = data;
          }

          if (existingDonor) {
            await supabase
              .from('blood_donors')
              .update({
                status: 'approved',
                full_name: memberData.full_name,
                phone: memberData.phone || '',
                blood_group: memberData.blood_group,
                member_id: finalMemberId,
                is_member: true,
              })
              .eq('id', existingDonor.id);
          } else if (memberData.phone) {
            await supabase.from('blood_donors').insert({
              full_name: memberData.full_name,
              phone: memberData.phone,
              blood_group: memberData.blood_group,
              address: memberData.present_address || memberData.address || '',
              division: memberData.division || 'রাজশাহী',
              district: memberData.district || 'নওগাঁ',
              upazila: memberData.upazila || 'নওগাঁ সদর',
              is_public_details: true,
              is_member: true,
              member_id: finalMemberId,
              status: 'approved',
              notes: 'সদস্য আবেদন অনুমোদনের সাথে সাথে স্বয়ংক্রিয়ভাবে সক্রিয়',
            });
          }
        } catch (donorSyncErr) {
          console.warn('Blood donor auto-approval error:', donorSyncErr);
        }
      }

      // 4. Automatically create login account linked to both Phone & Member ID
      const phoneDigits = memberData.phone ? memberData.phone.replace(/\D/g, '') : '';
      const standardPhoneEmail = phoneDigits.length >= 10 ? `${phoneDigits}@batighor.org` : null;
      const loginEmail = standardPhoneEmail || memberData.email;

      if (loginEmail) {
        try {
          await supabase.functions.invoke('create-member-user', {
            body: {
              email: loginEmail,
              password: 'member@123',
              memberId: memberData.id,
              fullName: memberData.full_name,
            },
          });
        } catch (accountErr) {
          console.warn('Auto create member user account error:', accountErr);
        }
      }

      // 4.5. Automated Dues Generation based on subscription willingness
      let duesGenerated = false;
      const willPaySub = Boolean(memberData.willing_to_pay_subscription);
      const subAmount = Number(memberData.subscription_amount || 0);

      if (willPaySub && subAmount > 0) {
        try {
          const currentMonthYear = new Date().toISOString().slice(0, 7); // e.g. "2026-11"
          const { data: existingDue } = await supabase
            .from('member_dues')
            .select('id')
            .eq('member_id', id)
            .eq('month_year', currentMonthYear)
            .maybeSingle();

          if (!existingDue) {
            const { error: dueInsertError } = await supabase
              .from('member_dues')
              .insert({
                member_id: id,
                month_year: currentMonthYear,
                amount: subAmount,
                is_paid: false,
                payment_status: 'unpaid',
              });
            if (!dueInsertError) {
              duesGenerated = true;
            }
          }
        } catch (duesErr) {
          console.warn('Auto dues generation error:', duesErr);
        }
      }

      // 5. Automated Welcome SMS dispatch via configured SMS template
      if (memberData.phone) {
        try {
          const defaultPassword = 'member@123';
          sendTemplatedSms(
            'member_welcome',
            memberData.phone,
            memberData.full_name,
            {
              name: memberData.full_name,
              member_id: finalMemberId || '',
              password: defaultPassword,
              phone: memberData.phone,
              login_link: 'https://samoyerbatighor.pro.bd/login',
              org_name: 'সময়ের বাতিঘর',
            },
            'welcome',
            memberData.id
          ).catch((e) => console.warn('Welcome SMS background error:', e));
        } catch (smsErr) {
          console.warn('Welcome SMS trigger error:', smsErr);
        }
      }

      return {
        id,
        name: memberData.full_name,
        duesGenerated,
        subAmount,
        willPaySub,
      };
    },
    onSuccess: (data) => {
      invalidateAllMemberQueries();
      queryClient.invalidateQueries({ queryKey: ['admin-blood-donors'] });
      queryClient.invalidateQueries({ queryKey: ['blood-donors'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['member-dues'] });
      queryClient.invalidateQueries({ queryKey: ['members-for-dues'] });
      refetch();

      // Automatically switch from 'pending' filter to 'all' so the newly approved member remains visible
      setSelectedStatus((prev) => (prev === 'pending' ? 'all' : prev));

      let duesNote = '';
      if (data?.willPaySub && data?.duesGenerated) {
        duesNote = language === 'bn' ? ` এবং চলতি মাসের ৳${data.subAmount} চাঁদা স্বয়ংক্রিয়ভাবে তৈরি হয়েছে।` : ` and monthly dues of ৳${data.subAmount} generated.`;
      } else if (!data?.willPaySub) {
        duesNote = language === 'bn' ? ' (চাঁদা দিতে সম্মত না থাকায় কোনো চাঁদা ধার্য করা হয়নি)।' : ' (No dues generated as member declined).';
      }

      toast({
        title: language === 'bn' ? 'সদস্য অনুমোদিত ও সক্রিয়!' : 'Member Approved & Activated!',
        description:
          language === 'bn'
            ? `"${data?.name || ''}" - সদস্য অনুমোদন সম্পন্ন হয়েছে, রক্তদাতা তালিকা সক্রিয় হয়েছে${duesNote}`
            : `"${data?.name || ''}" application approved, blood donor activated${duesNote}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name?: string }) => {
      // 1. Fetch member to also suspend blood donor
      const { data: memberData } = await supabase
        .from('members')
        .select('member_id, phone, full_name')
        .eq('id', id)
        .maybeSingle();

      const { error } = await supabase.from('members').update({ status: 'rejected' }).eq('id', id);
      if (error) throw error;

      if (memberData) {
        try {
          const conditions: string[] = [];
          if (memberData.member_id) conditions.push(`member_id.eq.${memberData.member_id}`);
          if (memberData.phone) conditions.push(`phone.eq.${memberData.phone}`);
          if (conditions.length > 0) {
            await supabase.from('blood_donors').update({ status: 'rejected' }).or(conditions.join(','));
          }
        } catch (e) {
          console.warn('Blood donor rejection error:', e);
        }
      }

      return { id, name };
    },
    onSuccess: (data) => {
      invalidateAllMemberQueries();
      queryClient.invalidateQueries({ queryKey: ['admin-blood-donors'] });
      queryClient.invalidateQueries({ queryKey: ['blood-donors'] });
      refetch();
      toast({
        title: language === 'bn' ? 'স্থগিত / বাতিল' : 'Suspended / Rejected',
        description:
          language === 'bn'
            ? `${data?.name ? `"${data.name}" - ` : ''}সদস্য আবেদন স্থগিত বা প্রত্যাখ্যাত হয়েছে।`
            : `${data?.name ? `"${data.name}" - ` : ''}Member application rejected or suspended.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Account creation with automatic phone fallback
  const handleCreateMemberAccount = async (member: Member) => {
    const phoneDigits = member.phone ? member.phone.replace(/\D/g, '') : '';
    const loginEmail = member.email || (phoneDigits.length >= 10 ? `${phoneDigits}@batighor.org` : null);

    if (!loginEmail) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'সদস্যের ইমেইল অথবা মোবাইল নম্বর নেই' : 'Member has neither email nor phone number',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingAccount(member.id);
    try {
      const response = await supabase.functions.invoke('create-member-user', {
        body: {
          email: loginEmail,
          password: 'member@123',
          memberId: member.id,
          fullName: member.full_name,
        },
      });

      if (response?.error) {
        let msg = response.error.message;
        try {
          if (response.error.context && typeof response.error.context.json === 'function') {
            const body = await response.error.context.json();
            if (body?.error) {
              msg = body.error;
            }
          }
        } catch {
          // ignore
        }
        throw new Error(msg || (language === 'bn' ? 'অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে' : 'Failed to create account'));
      }
      if (response?.data && !response.data.success) {
        throw new Error(response.data.error || (language === 'bn' ? 'অ্যাকাউন্ট তৈরি ব্যর্থ হয়েছে' : 'Failed to create account'));
      }

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description:
          language === 'bn'
            ? `সদস্যের লগইন অ্যাকাউন্ট তৈরি হয়েছে। আইডি/মোবাইল: ${member.phone || member.email}, ডিফল্ট পাসওয়ার্ড: member@123`
            : 'Member account created. Default password: member@123',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message || 'অ্যাকাউন্ট তৈরি করা যায়নি',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingAccount(null);
    }
  };

    // Reset form
  const resetForm = () => {
    setFormData({
      member_id: '',
      full_name: '',
      email: '',
      phone: '',
      address: '',
      occupation: '',
      blood_group: 'A+',
      member_type: 'general',
      status: 'approved',
      photo_url: '',
    });
    setGeoDivision('রাজশাহী');
    setGeoDistrict('নওগাঁ');
    setGeoUpazila('নওগাঁ সদর');
    setGeoUnion('নওগাঁ পৌরসভা');
    setGeoVillage('');
    setSelectedImage(null);
    setImagePreview(null);
    setEditingMember(null);
    setIsDialogOpen(false);
  };

  // Open Edit Form
  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setFormData({
      member_id: member.member_id,
      full_name: member.full_name,
      email: member.email || '',
      phone: member.phone || '',
      address: extractDeviceAudit(member.address).cleanAddress || '',
      occupation: member.occupation || '',
      blood_group: member.blood_group || 'A+',
      member_type: member.member_type || 'general',
      status: member.status || 'approved',
      photo_url: member.photo_url || '',
    });
    setImagePreview(member.photo_url || null);
    setIsDialogOpen(true);
  };

  // Image Selection & Upload
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'ছবি ২MB এর বেশি হতে পারবে না' : 'Image must be less than 2MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (memberId: string): Promise<string | null> => {
    if (!selectedImage) return formData.photo_url || null;

    try {
      setIsUploading(true);
      const compressedBlob = await compressImage(selectedImage, 320, 320, 0.85);
      const fileName = `${memberId}-${Date.now()}.jpg`;

      const { data, error } = await supabase.storage
        .from('member-photos')
        .upload(fileName, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('member-photos').getPublicUrl(data.path);
      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: language === 'bn' ? 'ছবি আপলোড ব্যর্থ' : 'Image upload failed',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setFormData({ ...formData, photo_url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-generate address string from national cascading selectors if address is empty or customized
    let finalAddress = formData.address.trim();
    if (!finalAddress) {
      const parts = [
        geoVillage ? `গ্রাম: ${geoVillage}` : '',
        geoUnion,
        geoUpazila,
        geoDistrict,
      ].filter(Boolean);
      finalAddress = parts.join(', ');
    }

    const photoUrl = await uploadImage(formData.member_id);
    const dataToSubmit = {
      ...formData,
      address: finalAddress,
      photo_url: photoUrl || '',
    };

    if (editingMember) {
      updateMutation.mutate({ id: editingMember.id, data: dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            {language === 'bn' ? 'অনুমোদিত' : 'Approved'}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            <Clock className="w-3 h-3 mr-1" />
            {language === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}
          </Badge>
        );
      case 'rejected':
      case 'suspended':
        return (
          <Badge className="bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
            <Ban className="w-3 h-3 mr-1" />
            {language === 'bn' ? 'স্থগিত / বাতিল' : 'Suspended'}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status || 'unknown'}</Badge>;
    }
  };

  // Member Type Badge Helper
  const getMemberTypeBadge = (type: string | null) => {
    switch (type) {
      case 'lifetime':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300">
            {language === 'bn' ? 'আজীবন সদস্য' : 'Lifetime'}
          </span>
        );
      case 'honorary':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
            {language === 'bn' ? 'সম্মানসূচক' : 'Honorary'}
          </span>
        );
      case 'general':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
            {language === 'bn' ? 'সাধারণ সদস্য' : 'General'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#14231B] dark:text-foreground flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-[#0B6B3A]">
              <Users className="w-5 h-5" />
            </div>
            {language === 'bn' ? 'সদস্য ব্যবস্থাপনা' : 'Members Management'}
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {language === 'bn'
              ? 'সময়ের বাতিঘরের সম্মানিত সদস্যদের ডাটাবেজ, অনুমোদন ও পরিচয়পত্র (ID Card) নিয়ন্ত্রণ করুন'
              : 'Manage member directory, approval workflow, cascading addresses & generate official ID cards.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5 border-emerald-200 hover:bg-emerald-50 text-emerald-800 dark:text-emerald-300"
          >
            <RefreshCw className="w-4 h-4" />
            {language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPrintDialogOpen(true)}
            disabled={!members || members.length === 0}
            className="gap-1.5"
          >
            <Printer className="w-4 h-4" />
            {language === 'bn' ? 'সকল প্রিন্ট' : 'Print All'}
          </Button>

          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setFormData((prev) => ({
                ...prev,
                member_id: generateMemberId(),
                status: 'approved',
              }));
              setIsDialogOpen(true);
            }}
            disabled={!isAdmin}
            className="bg-[#0B6B3A] hover:bg-[#09542e] text-white gap-1.5 shadow-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {language === 'bn' ? 'নতুন সদস্য যুক্ত করুন' : 'Add Member'}
          </Button>
        </div>
      </div>

      {/* Top 4 Status Filter Buttons (Matching Blood Donors Design) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. All Members */}
        <button
          type="button"
          onClick={() => setSelectedStatus('all')}
          className={`text-left bg-card border rounded-2xl p-4 shadow-sm transition-all duration-200 flex items-center gap-3.5 hover:shadow-md cursor-pointer ${
            selectedStatus === 'all'
              ? 'ring-2 ring-[#0B6B3A] border-[#0B6B3A] bg-emerald-50/40 dark:bg-emerald-950/20'
              : 'hover:border-emerald-300'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[#0B6B3A] shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium truncate">
              {language === 'bn' ? 'মোট সকল সদস্য' : 'All Members'}
            </p>
            <h3 className="text-2xl font-bold text-[#14231B] dark:text-foreground">
              {stats.total}
            </h3>
          </div>
        </button>

        {/* 2. Approved Members */}
        <button
          type="button"
          onClick={() => setSelectedStatus('approved')}
          className={`text-left bg-card border rounded-2xl p-4 shadow-sm transition-all duration-200 flex items-center gap-3.5 hover:shadow-md cursor-pointer ${
            selectedStatus === 'approved'
              ? 'ring-2 ring-emerald-600 border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20'
              : 'hover:border-emerald-300'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium truncate">
              {language === 'bn' ? 'অনুমোদিত / সক্রিয়' : 'Approved Members'}
            </p>
            <h3 className="text-2xl font-bold text-emerald-600">{stats.approved}</h3>
          </div>
        </button>

        {/* 3. Pending Members */}
        <button
          type="button"
          onClick={() => setSelectedStatus('pending')}
          className={`text-left bg-card border rounded-2xl p-4 shadow-sm transition-all duration-200 flex items-center gap-3.5 hover:shadow-md cursor-pointer ${
            selectedStatus === 'pending'
              ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/40 dark:bg-amber-950/20'
              : 'hover:border-amber-300'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-muted-foreground font-medium truncate">
                {language === 'bn' ? 'অপেক্ষমাণ আবেদন' : 'Pending Requests'}
              </p>
              {stats.pending > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </div>
            <h3 className="text-2xl font-bold text-amber-600">{stats.pending}</h3>
          </div>
        </button>

        {/* 4. Suspended / Rejected Members */}
        <button
          type="button"
          onClick={() => setSelectedStatus('rejected')}
          className={`text-left bg-card border rounded-2xl p-4 shadow-sm transition-all duration-200 flex items-center gap-3.5 hover:shadow-md cursor-pointer ${
            selectedStatus === 'rejected'
              ? 'ring-2 ring-rose-500 border-rose-500 bg-rose-50/40 dark:bg-rose-950/20'
              : 'hover:border-rose-300'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 shrink-0">
            <Ban className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium truncate">
              {language === 'bn' ? 'স্থগিত / প্রত্যাখ্যাত' : 'Suspended / Rejected'}
            </p>
            <h3 className="text-2xl font-bold text-rose-600">{stats.rejected}</h3>
          </div>
        </button>
      </div>

      {/* Filter and Search Bar Directly Below the 4 Buttons */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'bn'
                  ? 'সদস্যের নাম, মোবাইল, সদস্য আইডি, ঠিকানা বা পেশা খুঁজুন...'
                  : 'Search by member name, phone, ID, address, or profession...'
              }
              className="pl-9 h-10 text-sm rounded-xl border-emerald-100 focus-visible:ring-[#0B6B3A]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Member Type Filter */}
          <div className="w-full md:w-48">
            <Select value={selectedMemberType} onValueChange={setSelectedMemberType}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder={language === 'bn' ? 'সদস্যের ধরন' : 'Member Type'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'bn' ? 'সকল ধরন' : 'All Types'}</SelectItem>
                <SelectItem value="general">{language === 'bn' ? 'সাধারণ সদস্য' : 'General'}</SelectItem>
                <SelectItem value="lifetime">{language === 'bn' ? 'আজীবন সদস্য' : 'Lifetime'}</SelectItem>
                <SelectItem value="honorary">{language === 'bn' ? 'সম্মানসূচক সদস্য' : 'Honorary'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Blood Group Filter */}
          <div className="w-full md:w-40">
            <Select value={selectedBloodGroup} onValueChange={setSelectedBloodGroup}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder={language === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'bn' ? 'সকল রক্ত' : 'All Blood'}</SelectItem>
                {BLOOD_GROUPS.map((bg) => (
                  <SelectItem key={bg} value={bg}>
                    {bg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters */}
          {(selectedStatus !== 'all' ||
            selectedMemberType !== 'all' ||
            selectedBloodGroup !== 'all' ||
            searchQuery.trim()) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedStatus('all');
                setSelectedMemberType('all');
                setSelectedBloodGroup('all');
                setSearchQuery('');
              }}
              className="h-10 px-3 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {language === 'bn' ? 'রিসেট' : 'Reset'}
            </Button>
          )}
        </div>

        {/* Status Count Summary */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
          <span>
            {language === 'bn'
              ? `প্রদর্শিত হচ্ছে ${filteredMembers.length} জন সদস্য (${
                  selectedStatus === 'all'
                    ? 'সকল'
                    : selectedStatus === 'approved'
                    ? 'অনুমোদিত'
                    : selectedStatus === 'pending'
                    ? 'অপেক্ষমাণ'
                    : 'স্থগিত'
                })`
              : `Showing ${filteredMembers.length} members (${selectedStatus})`}
          </span>
          <span className="font-medium text-[#0B6B3A]">
            {language === 'bn' ? 'সময়ের বাতিঘর সেন্ট্রাল ডাটাবেজ' : 'Somoyer Batighor Central DB'}
          </span>
        </div>
      </div>

      {/* Members Table (Address Included to avoid blank gap on side!) */}
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#0B6B3A]" />
              <p className="text-sm font-medium">
                {language === 'bn' ? 'সদস্য তালিকা লোড হচ্ছে...' : 'Loading members directory...'}
              </p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#0B6B3A] mx-auto flex items-center justify-center mb-3">
                <Users className="w-8 h-8 opacity-60" />
              </div>
              <h4 className="text-base font-semibold text-foreground">
                {language === 'bn' ? 'কোন সদস্য পাওয়া যায়নি' : 'No members found'}
              </h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {language === 'bn'
                  ? 'আপনার দেওয়া ফিল্টার বা সার্চ শব্দের সাথে মিল রেখে কোনো সদস্য পাওয়া যায়নি।'
                  : 'No member matches the current search query or filter selection.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-50/60">
                    <TableHead className="w-14 text-center font-semibold">
                      {language === 'bn' ? 'ছবি' : 'Photo'}
                    </TableHead>
                    <TableHead className="w-28 font-semibold">
                      {language === 'bn' ? 'সদস্য আইডি' : 'Member ID'}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {language === 'bn' ? 'নাম ও রক্ত' : 'Name & Blood'}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {language === 'bn' ? 'মোবাইল ও ইমেইল' : 'Contact'}
                    </TableHead>
                    <TableHead className="font-semibold min-w-[200px]">
                      {language === 'bn' ? 'ঠিকানা (জাতীয় ডেটা)' : 'Address'}
                    </TableHead>
                    <TableHead className="w-28 font-semibold text-center">
                      {language === 'bn' ? 'সদস্যের ধরন' : 'Type'}
                    </TableHead>
                    <TableHead className="w-28 font-semibold text-center">
                      {language === 'bn' ? 'স্ট্যাটাস' : 'Status'}
                    </TableHead>
                    <TableHead className="w-44 text-right font-semibold pr-4">
                      {language === 'bn' ? 'অ্যাকশন' : 'Actions'}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow
                      key={member.id}
                      className="hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 transition-colors"
                    >
                      {/* Photo */}
                      <TableCell className="text-center py-3">
                        <Avatar className="w-10 h-10 border border-emerald-200 shadow-sm mx-auto">
                          <AvatarImage src={member.photo_url || undefined} alt={member.full_name} />
                          <AvatarFallback className="bg-emerald-100 text-[#0B6B3A] font-bold text-sm">
                            {member.full_name?.charAt(0) || 'S'}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>

                      {/* Member ID */}
                      <TableCell className="py-3">
                        <span className="font-mono text-xs font-bold text-[#0B6B3A] bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                          {member.member_id}
                        </span>
                      </TableCell>

                      {/* Name & Blood Group */}
                      <TableCell className="py-3">
                        <div className="font-medium text-[#14231B] dark:text-foreground flex items-center gap-2">
                          <span>{member.full_name}</span>
                          {member.blood_group && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                              <Droplet className="w-2.5 h-2.5 fill-rose-600" />
                              {member.blood_group}
                            </span>
                          )}
                        </div>
                        {member.occupation && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Briefcase className="w-3 h-3 text-muted-foreground" />
                            {member.occupation}
                          </p>
                        )}
                      </TableCell>

                      {/* Contact Info */}
                      <TableCell className="py-3">
                        <div className="text-xs space-y-0.5">
                          {member.phone ? (
                            <div className="flex items-center gap-1 font-mono text-foreground">
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{member.phone}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                          {member.email && (
                            <div className="flex items-center gap-1 text-muted-foreground truncate max-w-[180px]">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{member.email}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Address (National Cascading View) */}
                      <TableCell className="py-3">
                        <div className="flex items-start gap-1.5 text-xs text-foreground/90 max-w-[240px]">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-relaxed">
                            {extractDeviceAudit(member.address).cleanAddress || (language === 'bn' ? 'নওগাঁ, বাংলাদেশ' : 'Naogaon, Bangladesh')}
                          </span>
                        </div>
                      </TableCell>

                      {/* Type */}
                      <TableCell className="text-center py-3">
                        {getMemberTypeBadge(member.member_type)}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center py-3">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          {getStatusBadge(member.status)}
                          {member.status === 'approved' && !member.user_id && (
                            <button
                              type="button"
                              onClick={() => handleCreateMemberAccount(member)}
                              disabled={isCreatingAccount === member.id}
                              className="w-6 h-6 rounded-full bg-amber-500/10 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/40 transition-all inline-flex items-center justify-center shadow-2xs active:scale-90"
                              title={language === 'bn' ? 'লগইন অ্যাকাউন্ট সক্রিয় করতে ক্লিক করুন (পাসওয়ার্ড: member@123)' : 'Click to activate member login'}
                            >
                              {isCreatingAccount === member.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                              ) : (
                                <Key className="w-3.5 h-3.5 text-amber-600" />
                              )}
                            </button>
                          )}
                        </div>
                      </TableCell>

                      {/* Actions Menu */}
                      <TableCell className="text-right py-3 pr-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 rounded-lg hover:bg-emerald-50 text-slate-600 hover:text-[#0B6B3A] border border-slate-200/80 shadow-2xs"
                              title={language === 'bn' ? 'অপশন দেখুন' : 'View options'}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border border-slate-200 p-1.5 space-y-1">
                            {/* 1. Preview Profile */}
                            <DropdownMenuItem
                              onClick={() => setViewingMember(member)}
                              className="cursor-pointer py-2 px-2.5 rounded-lg text-emerald-800 hover:bg-emerald-50 font-medium text-xs flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4 text-emerald-600" />
                              <span>{language === 'bn' ? 'প্রোফাইল প্রিভিউ দেখুন' : 'Preview Profile'}</span>
                            </DropdownMenuItem>

                            {/* 2. Official ID Card */}
                            <DropdownMenuItem
                              onClick={() => setIdCardMember(member)}
                              className="cursor-pointer py-2 px-2.5 rounded-lg text-amber-800 hover:bg-amber-50 font-medium text-xs flex items-center gap-2"
                            >
                              <CreditCard className="w-4 h-4 text-amber-600" />
                              <span>{language === 'bn' ? 'অফিসিয়াল আইডি কার্ড' : 'Generate ID Card'}</span>
                            </DropdownMenuItem>

                            {/* 3. Edit Member */}
                            <DropdownMenuItem
                              onClick={() => handleEdit(member)}
                              disabled={!isAdmin}
                              className="cursor-pointer py-2 px-2.5 rounded-lg text-slate-700 hover:bg-slate-100 font-medium text-xs flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4 text-slate-500" />
                              <span>{language === 'bn' ? 'তথ্য সম্পাদনা' : 'Edit Member'}</span>
                            </DropdownMenuItem>

                            {/* 4. Conditional: Pending Approve/Reject */}
                            {member.status === 'pending' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => approveMutation.mutate({ id: member.id, name: member.full_name })}
                                  disabled={!isAdmin || approveMutation.isPending}
                                  className="cursor-pointer py-2 px-2.5 rounded-lg text-emerald-700 hover:bg-emerald-50 font-medium text-xs flex items-center gap-2"
                                >
                                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                                  <span>{language === 'bn' ? 'অনুমোদন করুন' : 'Approve Member'}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => rejectMutation.mutate({ id: member.id, name: member.full_name })}
                                  disabled={!isAdmin || rejectMutation.isPending}
                                  className="cursor-pointer py-2 px-2.5 rounded-lg text-rose-700 hover:bg-rose-50 font-medium text-xs flex items-center gap-2"
                                >
                                  <XCircle className="w-4 h-4 text-rose-600" />
                                  <span>{language === 'bn' ? 'প্রত্যাখ্যান / স্থগিত' : 'Reject / Suspend'}</span>
                                </DropdownMenuItem>
                              </>
                            )}

                            {/* 5. Conditional: Login Account Generation */}
                            {member.status === 'approved' && !member.user_id && (
                              <DropdownMenuItem
                                onClick={() => handleCreateMemberAccount(member)}
                                disabled={!isAdmin || isCreatingAccount === member.id}
                                className="cursor-pointer py-2 px-2.5 rounded-lg text-blue-700 hover:bg-blue-50 font-medium text-xs flex items-center gap-2"
                              >
                                {isCreatingAccount === member.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                ) : (
                                  <Key className="w-4 h-4 text-blue-600" />
                                )}
                                <span>{language === 'bn' ? 'লগইন অ্যাকাউন্ট তৈরি' : 'Create Login'}</span>
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            {/* 6. Delete Action */}
                            <DropdownMenuItem
                              onClick={() => {
                                if (
                                  window.confirm(
                                    language === 'bn'
                                      ? `আপনি কি নিশ্চিতভাবে "${member.full_name}" সদস্যের তথ্য মুছে ফেলতে চান?`
                                      : `Are you sure you want to delete "${member.full_name}"?`
                                  )
                                ) {
                                  deleteMutation.mutate(member.id);
                                }
                              }}
                              disabled={!isAdmin}
                              className="cursor-pointer py-2 px-2.5 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold text-xs flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4 text-rose-500" />
                              <span>{language === 'bn' ? 'সদস্য মুছে ফেলুন' : 'Delete Member'}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* =========================================================================
          Add / Edit Member Dialog (With National Database Cascading Address)
      ========================================================================= */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#14231B] dark:text-foreground">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[#0B6B3A]">
                <Users className="w-5 h-5" />
              </div>
              {editingMember
                ? language === 'bn'
                  ? 'সদস্য তথ্য সম্পাদনা'
                  : 'Edit Member Details'
                : language === 'bn'
                ? 'নতুন সদস্য যুক্ত করুন'
                : 'Add New Member'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            {/* 1. Basic Information */}
            <div className="bg-slate-50 dark:bg-card/70 p-4 sm:p-5 rounded-2xl border border-slate-200/90 space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#0B6B3A] flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {language === 'bn' ? 'মৌলিক তথ্য ও পরিচিতি' : 'Basic Information'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Member ID */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-800 dark:text-foreground">
                    {language === 'bn' ? 'সদস্য আইডি' : 'Member ID'} *
                  </Label>
                  <Input
                    value={formData.member_id}
                    onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                    required
                    readOnly={!editingMember}
                    className={`font-mono h-10 text-sm font-bold ${!editingMember ? 'bg-muted/70' : ''}`}
                  />
                  {!editingMember && (
                    <p className="text-xs text-muted-foreground font-medium">
                      {language === 'bn'
                        ? 'আইডি স্বয়ংক্রিয়ভাবে তৈরি হয়েছে'
                        : 'Auto-generated ID'}
                    </p>
                  )}
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-800 dark:text-foreground">
                    {language === 'bn' ? 'পুরো নাম' : 'Full Name'} *
                  </Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder={language === 'bn' ? 'যেমন: মো: মেহেদী হাসান' : 'e.g. John Doe'}
                    required
                    className="h-10 text-sm font-semibold"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-800 dark:text-foreground">
                    {language === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'} *
                  </Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="017XXXXXXXX"
                    required
                    className="h-10 text-sm font-mono font-bold"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-800 dark:text-foreground">
                    {language === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="member@example.com"
                    className="h-10 text-sm font-medium"
                  />
                </div>

                {/* Profession / Occupation */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-800 dark:text-foreground">
                    {language === 'bn' ? 'পেশা' : 'Profession / Occupation'}
                  </Label>
                  <Select
                    value={formData.occupation}
                    onValueChange={(v) => setFormData({ ...formData, occupation: v })}
                  >
                    <SelectTrigger className="h-10 text-sm font-medium">
                      <SelectValue placeholder={language === 'bn' ? 'পেশা নির্বাচন করুন' : 'Select Profession'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {professionsList.map((occ) => (
                        <SelectItem key={occ} value={occ} className="text-sm font-medium">
                          {occ}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Blood Group */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-800 dark:text-foreground">
                    {language === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'}
                  </Label>
                  <Select
                    value={formData.blood_group}
                    onValueChange={(v) => setFormData({ ...formData, blood_group: v })}
                  >
                    <SelectTrigger className="h-10 text-sm font-bold">
                      <SelectValue placeholder={language === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'} />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOD_GROUPS.map((bg) => (
                        <SelectItem key={bg} value={bg} className="text-sm font-bold">
                          {bg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Member Type */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-800 dark:text-foreground">
                    {language === 'bn' ? 'সদস্যের ক্যাটাগরি' : 'Member Category'}
                  </Label>
                  <Select
                    value={formData.member_type}
                    onValueChange={(v) => setFormData({ ...formData, member_type: v })}
                  >
                    <SelectTrigger className="h-10 text-sm font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general" className="text-sm font-medium">{language === 'bn' ? 'সাধারণ সদস্য' : 'General'}</SelectItem>
                      <SelectItem value="lifetime" className="text-sm font-medium">{language === 'bn' ? 'আজীবন সদস্য' : 'Lifetime'}</SelectItem>
                      <SelectItem value="honorary" className="text-sm font-medium">{language === 'bn' ? 'সম্মানসূচক সদস্য' : 'Honorary'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-800 dark:text-foreground">
                    {language === 'bn' ? 'সদস্য স্ট্যাটাস' : 'Member Status'}
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger className="h-10 text-sm font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved" className="text-sm font-medium">{language === 'bn' ? 'অনুমোদিত / সক্রিয়' : 'Approved'}</SelectItem>
                      <SelectItem value="pending" className="text-sm font-medium">{language === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}</SelectItem>
                      <SelectItem value="rejected" className="text-sm font-medium">{language === 'bn' ? 'স্থগিত / প্রত্যাখ্যাত' : 'Suspended'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 2. National Geographic Address Cascading Selection */}
            <div className="bg-slate-50 dark:bg-card/70 p-4 sm:p-5 rounded-2xl border border-slate-200/90 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#0B6B3A] flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {language === 'bn'
                    ? 'ঠিকানা নির্বাচন (জাতীয় ডেটাবেজ অনুযায়ী)'
                    : 'Address Selection (National Geo Database)'}
                </h4>
                <span className="text-xs text-muted-foreground font-semibold">
                  {language === 'bn' ? 'বিভাগ → জেলা → উপজেলা → ইউনিয়ন' : 'Division → District → Upazila → Union'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                {/* Division */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-800 dark:text-foreground">
                    {language === 'bn' ? 'বিভাগ' : 'Division'}
                  </Label>
                  <Select
                    value={geoDivision}
                    onValueChange={(div) => {
                      setGeoDivision(div);
                      const divObj = bangladeshGeoData.find((d) => d.name === div);
                      const firstDist = divObj?.districts[0]?.name || 'নওগাঁ';
                      setGeoDistrict(firstDist);
                      const firstUpazila = divObj?.districts[0]?.upazilas[0] || 'নওগাঁ সদর';
                      setGeoUpazila(firstUpazila);
                      const unions = getUnionsForUpazila(firstDist, firstUpazila);
                      setGeoUnion(unions[0] || 'পৌরসভা');
                    }}
                  >
                    <SelectTrigger className="h-10 text-sm font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bangladeshGeoData.map((div) => (
                        <SelectItem key={div.name} value={div.name} className="text-sm font-medium">
                          {div.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* District */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-800 dark:text-foreground">
                    {language === 'bn' ? 'জেলা' : 'District'}
                  </Label>
                  <Select
                    value={geoDistrict}
                    onValueChange={(dist) => {
                      setGeoDistrict(dist);
                      const distObj = availableDistricts.find((d) => d.name === dist);
                      const firstUpazila = distObj?.upazilas[0] || 'নওগাঁ সদর';
                      setGeoUpazila(firstUpazila);
                      const unions = getUnionsForUpazila(dist, firstUpazila);
                      setGeoUnion(unions[0] || 'পৌরসভা');
                    }}
                  >
                    <SelectTrigger className="h-10 text-sm font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDistricts.map((dst) => (
                        <SelectItem key={dst.name} value={dst.name} className="text-sm font-medium">
                          {dst.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Upazila */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-800 dark:text-foreground">
                    {language === 'bn' ? 'উপজেলা' : 'Upazila'}
                  </Label>
                  <Select
                    value={geoUpazila}
                    onValueChange={(upz) => {
                      setGeoUpazila(upz);
                      const unions = getUnionsForUpazila(geoDistrict, upz);
                      setGeoUnion(unions[0] || 'পৌরসভা');
                    }}
                  >
                    <SelectTrigger className="h-10 text-sm font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUpazilas.map((upz) => (
                        <SelectItem key={upz} value={upz} className="text-sm font-medium">
                          {upz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Union / Municipality */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-800 dark:text-foreground">
                    {language === 'bn' ? 'ইউনিয়ন / পৌরসভা' : 'Union / Municipality'}
                  </Label>
                  <Select value={geoUnion} onValueChange={setGeoUnion}>
                    <SelectTrigger className="h-10 text-sm font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {availableUnions.map((un) => (
                        <SelectItem key={un} value={un} className="text-sm font-medium">
                          {un}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Village / Area & Direct Address Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-800 dark:text-foreground">
                    {language === 'bn' ? 'গ্রাম / পাড়া / মহল্লা / রোড' : 'Village / Area / Road'}
                  </Label>
                  <Input
                    value={geoVillage}
                    onChange={(e) => setGeoVillage(e.target.value)}
                    placeholder={language === 'bn' ? 'যেমন: পার-নওগাঁ, চকদেব' : 'e.g. Ward 3, Main road'}
                    className="h-10 text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-800 dark:text-foreground">
                    {language === 'bn' ? 'সম্পূর্ণ ঠিকানা (কাস্টমাইজ করুন)' : 'Full Address (Customizable)'}
                  </Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder={
                      language === 'bn'
                        ? 'খালি রাখলে ওপরের নির্বাচন অনুযায়ী সেভ হবে'
                        : 'Leave blank to use selected cascading address'
                    }
                    className="h-10 text-sm font-medium"
                  />
                </div>
              </div>
            </div>


            {/* 3. Photo Upload Section */}
            <div className="bg-emerald-50/40 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B6B3A] flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                {language === 'bn' ? 'সদস্যের ছবি' : 'Member Photo'}
              </h4>

              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative">
                    <Avatar className="w-20 h-20 border-2 border-emerald-500 shadow-sm">
                      <AvatarImage src={imagePreview} alt="Preview" />
                      <AvatarFallback>{formData.full_name.charAt(0) || 'S'}</AvatarFallback>
                    </Avatar>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full shadow"
                      onClick={removeImage}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-muted border border-dashed border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-muted-foreground">
                    <Upload className="w-7 h-7 text-emerald-600/70" />
                  </div>
                )}

                <div className="flex-1 space-y-1.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="photo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2 border-emerald-300 hover:bg-emerald-50 text-emerald-800 dark:text-emerald-300"
                  >
                    <Upload className="w-4 h-4" />
                    {language === 'bn' ? 'ছবি নির্বাচন করুন' : 'Select Photo'}
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    {language === 'bn'
                      ? 'JPG, PNG বা WebP ফরম্যাট। সর্বোচ্চ ২MB (স্বয়ংক্রিয়ভাবে অপ্টিমাইজড হবে)।'
                      : 'Max 2MB, JPG/PNG/WebP. Photo will be auto-optimized.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Dialog Footer Actions */}
            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" onClick={resetForm} className="rounded-xl">
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending || isUploading}
                className="bg-[#0B6B3A] hover:bg-[#09542e] text-white rounded-xl gap-2 shadow-sm font-medium"
              >
                {(createMutation.isPending || updateMutation.isPending || isUploading) && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {isUploading
                  ? language === 'bn'
                    ? 'ছবি আপলোড হচ্ছে...'
                    : 'Uploading photo...'
                  : editingMember
                  ? language === 'bn'
                    ? 'আপডেট করুন'
                    : 'Update Member'
                  : language === 'bn'
                  ? 'সংরক্ষণ করুন'
                  : 'Save Member'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          Member Profile Details & Application Dossier Modal
      ========================================================================= */}
      <Dialog open={!!viewingMember} onOpenChange={() => setViewingMember(null)}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl">
          {viewingMember && (() => {
            const { cleanAddress, audit: deviceAudit } = extractDeviceAudit(viewingMember.address);
            const willPaySub = Boolean(viewingMember.willing_to_pay_subscription);
            const subAmount = Number(viewingMember.subscription_amount || 0);
            const willDonateBlood = Boolean(viewingMember.willing_to_donate_blood);

            return (
              <div>
                {/* Profile Header Banner */}
                <div className="bg-gradient-to-r from-[#0B6B3A] via-emerald-800 to-[#14532d] text-white p-5 relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-xs">
                        <FileText className="w-4 h-4 text-emerald-200" />
                      </div>
                      <span className="text-xs uppercase font-bold tracking-wider text-emerald-200">
                        {language === 'bn' ? 'সদস্য আবেদন ও পূর্ণাঙ্গ বিবরণী' : 'Member Application Dossier'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/90 hover:bg-white text-emerald-950 font-bold h-8 px-3 rounded-lg text-xs gap-1.5 shadow-xs"
                        onClick={() => handlePrintApplication()}
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-700" />
                        {language === 'bn' ? 'প্রিন্ট করুন' : 'Print Dossier'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20 h-8 px-2.5 rounded-lg text-xs gap-1.5"
                        onClick={() => {
                          setIdCardMember(viewingMember);
                          setViewingMember(null);
                        }}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        {language === 'bn' ? 'আইডি কার্ড' : 'ID Card'}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-white hover:bg-white/20 h-8 w-8 rounded-lg"
                        onClick={() => setViewingMember(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
                    <Avatar className="w-20 h-20 border-3 border-white shadow-md rounded-2xl shrink-0">
                      <AvatarImage src={viewingMember.photo_url || undefined} alt={viewingMember.full_name} />
                      <AvatarFallback className="bg-emerald-100 text-[#0B6B3A] text-2xl font-bold rounded-2xl">
                        {viewingMember.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-white drop-shadow-xs">
                          {viewingMember.full_name}
                        </h3>
                        {getStatusBadge(viewingMember.status)}
                        {getMemberTypeBadge(viewingMember.member_type)}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-100 font-medium">
                        <span className="font-mono bg-white/15 px-2 py-0.5 rounded border border-white/20 text-white font-bold">
                          ID: {viewingMember.member_id}
                        </span>
                        {viewingMember.blood_group && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600/80 text-white font-bold">
                            <Droplet className="w-3 h-3 fill-white" />
                            {viewingMember.blood_group}
                          </span>
                        )}
                        <span>•</span>
                        <span>{viewingMember.occupation || (language === 'bn' ? 'পেশা উল্লেখ নেই' : 'No Occupation')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dossier Body Content */}
                <div className="p-5 space-y-5 bg-slate-50/60 dark:bg-card">
                  {/* Section 1: Contact & Personal Information */}
                  <div className="bg-white dark:bg-background rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B6B3A] dark:text-emerald-400 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                      <Phone className="w-3.5 h-3.5" />
                      {language === 'bn' ? '১. যোগাযোগ ও ব্যক্তিগত তথ্য' : '1. Contact & Personal Information'}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-card/50 border border-slate-200/70">
                        <span className="text-slate-500 font-medium block mb-1">
                          {language === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}
                        </span>
                        <div className="flex items-center justify-between gap-1">
                          <a
                            href={`tel:${viewingMember.phone}`}
                            className="font-bold text-slate-900 dark:text-foreground font-mono hover:text-emerald-600 hover:underline"
                          >
                            {viewingMember.phone || '-'}
                          </a>
                          {viewingMember.phone && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyPhone(viewingMember.phone!)}
                              className="h-6 px-1.5 text-[10px] text-emerald-700 hover:bg-emerald-50 rounded"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-card/50 border border-slate-200/70">
                        <span className="text-slate-500 font-medium block mb-1">
                          {language === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
                        </span>
                        <p className="font-bold text-slate-900 dark:text-foreground truncate" title={viewingMember.email || ''}>
                          {viewingMember.email || '-'}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-card/50 border border-slate-200/70">
                        <span className="text-slate-500 font-medium block mb-1">
                          {language === 'bn' ? 'আবেদনের তারিখ' : 'Application Date'}
                        </span>
                        <p className="font-bold text-slate-900 dark:text-foreground">
                          {viewingMember.created_at || viewingMember.joining_date
                            ? new Date(viewingMember.created_at || viewingMember.joining_date!).toLocaleDateString('bn-BD', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Address Breakdown */}
                  <div className="bg-white dark:bg-background rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B6B3A] dark:text-emerald-400 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                      <MapPin className="w-3.5 h-3.5" />
                      {language === 'bn' ? '২. ঠিকানা বিবরণী' : '2. Address Breakdown'}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                          {language === 'bn' ? '📍 বর্তমান ঠিকানা' : '📍 Present Address'}
                        </span>
                        <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                          {viewingMember.present_address || cleanAddress || '-'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-card/50 border border-slate-200/70">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          {language === 'bn' ? '🏠 স্থায়ী ঠিকানা' : '🏠 Permanent Address'}
                        </span>
                        <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                          {viewingMember.permanent_address || cleanAddress || '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Subscription & Dues Commitment */}
                  <div className="bg-white dark:bg-background rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B6B3A] dark:text-emerald-400 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                      <Coins className="w-3.5 h-3.5" />
                      {language === 'bn' ? '৩. চাঁদা প্রতিশ্রুতি ও চাঁদা ব্যবস্থাপনা' : '3. Dues & Subscription Commitment'}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-card/50 border border-slate-200/70">
                        <span className="text-slate-500 font-medium block mb-1">
                          {language === 'bn' ? 'চাঁদা প্রদানে আগ্রহ' : 'Willing to Pay Subscription'}
                        </span>
                        {willPaySub ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {language === 'bn' ? 'হ্যাঁ, আগ্রহী' : 'Yes, Willing'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            <X className="w-3.5 h-3.5 text-slate-500" />
                            {language === 'bn' ? 'না (আগ্রহী নন)' : 'No (Declined)'}
                          </span>
                        )}
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-card/50 border border-slate-200/70">
                        <span className="text-slate-500 font-medium block mb-1">
                          {language === 'bn' ? 'চাঁদা প্রদানের ধরণ' : 'Payment Frequency'}
                        </span>
                        <p className="font-bold text-slate-900 dark:text-foreground">
                          {viewingMember.subscription_frequency === 'yearly'
                            ? (language === 'bn' ? 'বাৎসরিক' : 'Yearly')
                            : (language === 'bn' ? 'মাসিক' : 'Monthly')}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                        <span className="text-emerald-800 dark:text-emerald-300 font-medium block mb-1">
                          {language === 'bn' ? 'চাঁদার পরিমাণ' : 'Subscription Amount'}
                        </span>
                        <p className="text-base font-extrabold text-[#0B6B3A] dark:text-emerald-400">
                          {willPaySub && subAmount > 0 ? `৳${subAmount}` : '৳০ (ধার্য নেই)'}
                        </p>
                      </div>
                    </div>

                    {/* Dues Automation Status Banner */}
                    <div className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                      willPaySub && subAmount > 0
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}>
                      {willPaySub && subAmount > 0 ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">
                              {language === 'bn' ? 'স্বয়ংক্রিয় চাঁদা সংযোজন সক্রিয়:' : 'Automatic Dues Automation Active:'}
                            </span>{' '}
                            {language === 'bn'
                              ? `এই সদস্যকে অনুমোদন করলে চাঁদা ব্যবস্থাপনায় চলতি মাসের ৳${subAmount} চাঁদা স্বয়ংক্রিয়ভাবে তৈরি হবে।`
                              : `Approving this member will automatically generate monthly dues of ৳${subAmount}.`}
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">
                              {language === 'bn' ? 'চাঁদা ধার্য করা হবে না:' : 'No Dues Will Be Generated:'}
                            </span>{' '}
                            {language === 'bn'
                              ? 'আবেদনকারী চাঁদা প্রদানে অপারগতা বা অস্বীকৃতি জানিয়েছেন। অনুমোদনের পরেও কোনো চাঁদা বকেয়া হবে না।'
                              : 'Member opted out of subscription. No dues will be generated upon approval.'}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Section 4: Blood Donation & Social Welfare */}
                  <div className="bg-white dark:bg-background rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B6B3A] dark:text-emerald-400 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                      <Droplet className="w-3.5 h-3.5 text-rose-500" />
                      {language === 'bn' ? '৪. রক্তদান ও সামাজিক অবদান' : '4. Blood Donation & Social Welfare'}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-card/50 border border-slate-200/70 flex items-center justify-between">
                        <div>
                          <span className="text-slate-500 font-medium block mb-1">
                            {language === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'}
                          </span>
                          <span className="font-extrabold text-base text-rose-600">
                            {viewingMember.blood_group || (language === 'bn' ? 'জানা নেই' : 'Unknown')}
                          </span>
                        </div>
                        {viewingMember.blood_group && (
                          <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold">
                            <Droplet className="w-5 h-5 fill-rose-600" />
                          </div>
                        )}
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-card/50 border border-slate-200/70">
                        <span className="text-slate-500 font-medium block mb-1">
                          {language === 'bn' ? 'রক্তদানে আগ্রহ' : 'Willing to Donate Blood'}
                        </span>
                        {willDonateBlood ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-100/80 px-2.5 py-0.5 rounded-full">
                            <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                            {language === 'bn' ? 'হ্যাঁ, রক্তদানে আগ্রহী' : 'Yes, Blood Donor'}
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-600">
                            {language === 'bn' ? 'না / আগ্রহী নন' : 'No / Not Available'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Device & Security Audit Footprint */}
                  <div className="bg-white dark:bg-background rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B6B3A] dark:text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {language === 'bn' ? '৫. ডিজিটাল নিরাপত্তা ও ডিভাইস অডিট ফুটপ্রিন্ট' : '5. Security & Device Footprint'}
                      </h4>
                      <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 px-2 py-0.5 rounded">
                        Audit Verified
                      </span>
                    </div>

                    {deviceAudit ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-card/50 border border-slate-200/70">
                          <span className="text-slate-500 font-medium flex items-center gap-1 mb-1">
                            {deviceAudit.deviceType === 'Mobile' ? (
                              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Laptop className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                            {language === 'bn' ? 'ডিভাইস ও মডেল' : 'Device & Model'}
                          </span>
                          <p className="font-bold text-slate-900 dark:text-foreground">
                            {deviceAudit.deviceModel} ({deviceAudit.deviceType})
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-card/50 border border-slate-200/70">
                          <span className="text-slate-500 font-medium flex items-center gap-1 mb-1">
                            <Globe className="w-3.5 h-3.5 text-emerald-600" />
                            {language === 'bn' ? 'অপারেটিং সিস্টেম ও ব্রাউজার' : 'OS & Browser'}
                          </span>
                          <p className="font-bold text-slate-900 dark:text-foreground">
                            {deviceAudit.os} • {deviceAudit.browser}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-card/50 border border-slate-200/70">
                          <span className="text-slate-500 font-medium flex items-center gap-1 mb-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            {language === 'bn' ? 'স্ক্রিন ও টাইমজোন' : 'Screen & Timezone'}
                          </span>
                          <p className="font-bold text-slate-900 dark:text-foreground font-mono">
                            {deviceAudit.screenResolution} ({deviceAudit.timezone})
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-card/50 border border-slate-200/70 sm:col-span-2">
                          <span className="text-slate-500 font-medium flex items-center gap-1 mb-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            {language === 'bn' ? 'নেটওয়ার্ক আইপি ও লোকেশন' : 'Network IP & Location'}
                          </span>
                          <p className="font-bold text-slate-900 dark:text-foreground font-mono text-[11px]">
                            {deviceAudit.ip} {deviceAudit.city ? `• ${deviceAudit.city}, ${deviceAudit.country}` : ''}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-card/50 border border-slate-200/70">
                          <span className="text-slate-500 font-medium block mb-1">
                            {language === 'bn' ? 'আবেদনের সময়' : 'Submission Time'}
                          </span>
                          <p className="font-bold text-slate-900 dark:text-foreground text-[11px]">
                            {new Date(deviceAudit.submittedAt).toLocaleTimeString('bn-BD', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-card/50 text-xs text-slate-600 border border-slate-200/60">
                        {language === 'bn'
                          ? 'স্ট্যান্ডার্ড ওয়েব পোর্টাল রেজিস্ট্রেশন — ডিভাইস অডিট ক্যাপচার সক্রিয়।'
                          : 'Standard web registration record.'}
                      </div>
                    )}
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    <Button
                      variant="outline"
                      className="border-emerald-600 text-emerald-800 hover:bg-emerald-50 font-bold gap-1.5 h-10 px-4"
                      onClick={() => handlePrintApplication()}
                    >
                      <Printer className="w-4 h-4 text-emerald-600" />
                      {language === 'bn' ? 'আবেদন ফরম প্রিন্ট করুন' : 'Print Application Form'}
                    </Button>

                    <Button
                      variant="outline"
                      className="border-amber-300 text-amber-800 hover:bg-amber-50 font-semibold gap-1.5 h-10 px-4"
                      onClick={() => {
                        setIdCardMember(viewingMember);
                        setViewingMember(null);
                      }}
                    >
                      <CreditCard className="w-4 h-4 text-amber-600" />
                      {language === 'bn' ? 'আইডি কার্ড তৈরি' : 'ID Card'}
                    </Button>

                    <Button
                      variant="outline"
                      className="gap-1.5 h-10 px-4"
                      onClick={() => {
                        handleEdit(viewingMember);
                        setViewingMember(null);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                      {language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                    </Button>

                    {viewingMember.status === 'pending' && (
                      <div className="flex-1 flex gap-2 min-w-[200px]">
                        <Button
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 h-10 shadow-sm"
                          onClick={() => {
                            approveMutation.mutate({ id: viewingMember.id, name: viewingMember.full_name });
                            setViewingMember(null);
                          }}
                        >
                          <CheckCircle className="w-4 h-4" />
                          {language === 'bn' ? 'অনুমোদন করুন' : 'Approve'}
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1 font-bold gap-1.5 h-10 shadow-sm"
                          onClick={() => {
                            rejectMutation.mutate({ id: viewingMember.id, name: viewingMember.full_name });
                            setViewingMember(null);
                          }}
                        >
                          <XCircle className="w-4 h-4" />
                          {language === 'bn' ? 'প্রত্যাখ্যান' : 'Reject'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          Hidden Printable Application Dossier Layout (A4 Official Form)
      ========================================================================= */}
      <div className="hidden">
        {viewingMember && (
          <div
            ref={applicationPrintRef}
            className="p-10 bg-white text-slate-900 font-sans max-w-[800px] mx-auto print:block"
            style={{ width: '210mm', minHeight: '297mm', color: '#111827' }}
          >
            {/* Header */}
            <div className="border-b-2 border-[#0B6B3A] pb-4 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-16 h-16 object-contain"
                  onError={(e) => {
                    // Fallback
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div>
                  <h1 className="text-2xl font-black text-[#0B6B3A] tracking-tight">
                    সময়ের বাতিঘর
                  </h1>
                  <p className="text-xs font-semibold text-slate-600">
                    একটি সামাজিক স্বেচ্ছাসেবী সংগঠন
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    কেন্দ্রীয় কার্যালয়: নওগাঁ, রাজশাহী, বাংলাদেশ | ওয়েব: https://samoyerbatighor.pro.bd
                  </p>
                </div>
              </div>

              {/* Passport Photo Box */}
              <div className="w-24 h-28 border-2 border-slate-300 rounded-lg overflow-hidden flex items-center justify-center bg-slate-50 shrink-0">
                {viewingMember.photo_url ? (
                  <img
                    src={viewingMember.photo_url}
                    alt={viewingMember.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400 font-semibold text-center p-1">
                    পাসপোর্ট সাইজ ছবি
                  </span>
                )}
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="text-center mb-5 bg-[#E6F4EA] border border-[#C8E6C9] py-1.5 rounded-lg">
              <h2 className="text-base font-black text-[#0B6B3A] uppercase tracking-wide">
                সদস্য আবেদন ফরম ও প্রাতিষ্ঠানিক জীবনবৃত্তান্ত
              </h2>
              <p className="text-[11px] font-bold text-slate-600">
                Member Application & Official Profile Dossier
              </p>
            </div>

            {/* Key Meta Badges */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
              <div className="border border-slate-200 p-2 rounded bg-slate-50">
                <span className="text-[10px] text-slate-500 block">সদস্য পরিচিতি (ID)</span>
                <span className="font-black text-sm font-mono text-[#0B6B3A]">
                  {viewingMember.member_id}
                </span>
              </div>
              <div className="border border-slate-200 p-2 rounded bg-slate-50">
                <span className="text-[10px] text-slate-500 block">আবেদনের ধরন</span>
                <span className="font-bold text-slate-800">
                  {viewingMember.member_type === 'renewal' ? 'নবায়নকৃত সদস্য' : 'নতুন সাধারণ সদস্য'}
                </span>
              </div>
              <div className="border border-slate-200 p-2 rounded bg-slate-50">
                <span className="text-[10px] text-slate-500 block">আবেদনের বর্তমান স্থিতি</span>
                <span className="font-bold text-slate-800">
                  {viewingMember.status === 'approved' ? 'অনুমোদিত ও সক্রিয়' : 'অপেক্ষমান (Pending)'}
                </span>
              </div>
            </div>

            {/* Section 1: Personal & Contact */}
            <div className="mb-4">
              <h3 className="text-xs font-black uppercase text-[#0B6B3A] border-b border-emerald-200 pb-1 mb-2">
                ১. ব্যক্তিগত ও যোগাযোগ সংক্রান্ত তথ্য
              </h3>
              <table className="w-full text-xs border border-slate-200 rounded">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 font-bold w-1/4 text-slate-600">পূর্ণ নাম:</td>
                    <td className="p-2 font-black text-slate-900 w-1/4">{viewingMember.full_name}</td>
                    <td className="p-2 bg-slate-50 font-bold w-1/4 text-slate-600">পেশা / কর্মক্ষেত্র:</td>
                    <td className="p-2 font-bold text-slate-900 w-1/4">{viewingMember.occupation || '-'}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 font-bold text-slate-600">মোবাইল নম্বর:</td>
                    <td className="p-2 font-mono font-bold text-slate-900">{viewingMember.phone || '-'}</td>
                    <td className="p-2 bg-slate-50 font-bold text-slate-600">ইমেইল:</td>
                    <td className="p-2 font-bold text-slate-900">{viewingMember.email || '-'}</td>
                  </tr>
                  <tr>
                    <td className="p-2 bg-slate-50 font-bold text-slate-600">রক্তের গ্রুপ:</td>
                    <td className="p-2 font-black text-rose-600">{viewingMember.blood_group || 'অজানা'}</td>
                    <td className="p-2 bg-slate-50 font-bold text-slate-600">আবেদনের তারিখ:</td>
                    <td className="p-2 font-bold text-slate-900">
                      {viewingMember.created_at || viewingMember.joining_date
                        ? new Date(viewingMember.created_at || viewingMember.joining_date!).toLocaleDateString('bn-BD')
                        : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 2: Address Information */}
            <div className="mb-4">
              <h3 className="text-xs font-black uppercase text-[#0B6B3A] border-b border-emerald-200 pb-1 mb-2">
                ২. ঠিকানা বিবরণী
              </h3>
              <table className="w-full text-xs border border-slate-200 rounded">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 font-bold w-1/4 text-slate-600">বর্তমান ঠিকানা:</td>
                    <td className="p-2 font-medium text-slate-900">
                      {viewingMember.present_address || extractDeviceAudit(viewingMember.address).cleanAddress || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 bg-slate-50 font-bold text-slate-600">স্থায়ী ঠিকানা:</td>
                    <td className="p-2 font-medium text-slate-900">
                      {viewingMember.permanent_address || extractDeviceAudit(viewingMember.address).cleanAddress || '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 3: Social & Subscription Commitments */}
            <div className="mb-4">
              <h3 className="text-xs font-black uppercase text-[#0B6B3A] border-b border-emerald-200 pb-1 mb-2">
                ৩. সামাজিক ও আর্থিক অঙ্গীকার (চাঁদা ও রক্তদান)
              </h3>
              <table className="w-full text-xs border border-slate-200 rounded">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 font-bold w-1/3 text-slate-600">রক্তদানে আগ্রহ:</td>
                    <td className="p-2 font-bold text-slate-900" colSpan={2}>
                      {viewingMember.willing_to_donate_blood ? 'হ্যাঁ, প্রয়োজনে স্বেচ্ছায় রক্তদান করবেন' : 'না'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 font-bold text-slate-600">নিয়মিত চাঁদা প্রদানে আগ্রহ:</td>
                    <td className="p-2 font-bold text-slate-900" colSpan={2}>
                      {viewingMember.willing_to_pay_subscription ? 'হ্যাঁ, সংগঠনের কল্যাণে চাঁদা প্রদান করবেন' : 'না (চাঁদা ধার্য নেই)'}
                    </td>
                  </tr>
                  {viewingMember.willing_to_pay_subscription && (
                    <tr>
                      <td className="p-2 bg-slate-50 font-bold text-slate-600">চাঁদার ধরণ ও পরিমাণ:</td>
                      <td className="p-2 font-black text-emerald-800" colSpan={2}>
                        {viewingMember.subscription_frequency === 'yearly' ? 'বাৎসরিক' : 'মাসিক'} — ৳
                        {viewingMember.subscription_amount || 0}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Section 4: Security & Device Verification Footprint */}
            {(() => {
              const audit = extractDeviceAudit(viewingMember.address).audit;
              return (
                <div className="mb-6">
                  <h3 className="text-xs font-black uppercase text-[#0B6B3A] border-b border-emerald-200 pb-1 mb-2">
                    ৪. ডিজিটাল নিরাপত্তা ও ডিভাইস অডিট ফুটপ্রিন্ট
                  </h3>
                  <table className="w-full text-[11px] border border-slate-200 rounded">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="p-2 bg-slate-50 font-bold w-1/4 text-slate-600">ডিভাইস ও ওএস:</td>
                        <td className="p-2 text-slate-900 w-1/4">
                          {audit ? `${audit.deviceModel} (${audit.os})` : 'Web Registration'}
                        </td>
                        <td className="p-2 bg-slate-50 font-bold w-1/4 text-slate-600">ব্রাউজার ও রেজোলিউশন:</td>
                        <td className="p-2 text-slate-900 w-1/4">
                          {audit ? `${audit.browser} • ${audit.screenResolution}` : '-'}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 bg-slate-50 font-bold text-slate-600">নেটওয়ার্ক আইপি ও লোকেশন:</td>
                        <td className="p-2 font-mono text-slate-900">
                          {audit ? `${audit.ip} ${audit.city ? `(${audit.city})` : ''}` : '-'}
                        </td>
                        <td className="p-2 bg-slate-50 font-bold text-slate-600">আবেদনের সঠিক সময়:</td>
                        <td className="p-2 text-slate-900">
                          {audit ? new Date(audit.submittedAt).toLocaleString('bn-BD') : '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {/* Declaration & Oath */}
            <div className="border border-slate-300 p-3 rounded-lg text-xs text-slate-700 bg-slate-50/50 mb-8 leading-relaxed">
              <span className="font-bold text-slate-900 block mb-1">অঙ্গীকারনামা:</span>
              আমি শপথ করছি যে, উপরে প্রদত্ত সকল তথ্য সত্য ও সঠিক। আমি 'সময়ের বাতিঘর' সংগঠনের গঠনতন্ত্র, নীতি ও মানবিক লক্ষ্য-উদ্দেশ্য মেনে চলার অঙ্গীকার করছি। সংগঠনের যেকোনো সিদ্ধান্তে আমি সহমত পোষণ করব।
            </div>

            {/* Signatures */}
            <div className="flex justify-between items-end pt-6 mt-6 border-t border-dashed border-slate-300 text-xs">
              <div className="text-center w-48">
                <div className="border-b border-slate-400 mb-1 h-10"></div>
                <p className="font-bold text-slate-800">আবেদনকারীর স্বাক্ষর ও তারিখ</p>
              </div>

              <div className="text-center w-56">
                <div className="border-b border-slate-400 mb-1 h-10"></div>
                <p className="font-bold text-slate-800">সভাপতি / সাধারণ সম্পাদক</p>
                <p className="text-[10px] text-slate-500">অনুমোদন স্বাক্ষর ও প্রাতিষ্ঠানিক সিল</p>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="text-center text-[9px] text-slate-400 mt-6 pt-2 border-t border-slate-100">
              কম্পিউটার জেনারেটেড অফিশিয়াল রেকর্ড — সময়ের বাতিঘর কেন্দ্রীয় ডাটাবেজ সিস্টেম (https://samoyerbatighor.pro.bd)
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          Official Member ID Card Generator Modal (Professional Level)
      ========================================================================= */}
      <Dialog open={!!idCardMember} onOpenChange={() => setIdCardMember(null)}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#14231B] dark:text-foreground">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-700">
                  <CreditCard className="w-5 h-5" />
                </div>
                {language === 'bn' ? 'অফিসিয়াল সদস্য পরিচয়পত্র (ID Card)' : 'Official Member ID Card'}
              </DialogTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'bn'
                ? 'সময়ের বাতিঘরের অনুমোদিত পরিচয়পত্র প্রিন্ট বা ডাউনলোড করুন'
                : 'High-resolution printable membership ID card with QR code verification.'}
            </p>
          </DialogHeader>

          {idCardMember && (
            <div className="space-y-6 pt-2">
              {/* Controls */}
              <div className="flex items-center justify-between gap-2 bg-muted/50 p-2.5 rounded-xl border">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground mr-1">
                    {language === 'bn' ? 'প্রদর্শন:' : 'View:'}
                  </span>
                  <Button
                    size="sm"
                    variant={idCardSide === 'both' ? 'default' : 'outline'}
                    onClick={() => setIdCardSide('both')}
                    className={`h-8 text-xs ${
                      idCardSide === 'both' ? 'bg-[#0B6B3A] hover:bg-[#09542e]' : ''
                    }`}
                  >
                    {language === 'bn' ? 'উভয় পাশ' : 'Both Sides'}
                  </Button>
                  <Button
                    size="sm"
                    variant={idCardSide === 'front' ? 'default' : 'outline'}
                    onClick={() => setIdCardSide('front')}
                    className={`h-8 text-xs ${
                      idCardSide === 'front' ? 'bg-[#0B6B3A] hover:bg-[#09542e]' : ''
                    }`}
                  >
                    {language === 'bn' ? 'সম্মুখভাগ' : 'Front'}
                  </Button>
                  <Button
                    size="sm"
                    variant={idCardSide === 'back' ? 'default' : 'outline'}
                    onClick={() => setIdCardSide('back')}
                    className={`h-8 text-xs ${
                      idCardSide === 'back' ? 'bg-[#0B6B3A] hover:bg-[#09542e]' : ''
                    }`}
                  >
                    {language === 'bn' ? 'বিপরীতভাগ' : 'Back'}
                  </Button>
                </div>

                <Button
                  onClick={() => handlePrintIdCard()}
                  className="bg-[#0B6B3A] hover:bg-[#09542e] text-white h-8 text-xs gap-1.5 font-medium shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  {language === 'bn' ? 'আইডি কার্ড প্রিন্ট করুন' : 'Print ID Card'}
                </Button>
              </div>

              {/* Printable ID Card Container */}
              <div
                ref={idCardPrintRef}
                className="flex flex-col md:flex-row items-center justify-center gap-6 p-4 bg-muted/20 rounded-2xl"
              >
                <style type="text/css" media="print">{`
                  @page {
                    size: A4 portrait;
                    margin: 15mm;
                  }
                  body {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  .id-card-print-container {
                    display: flex !important;
                    flex-direction: row !important;
                    flex-wrap: wrap !important;
                    gap: 20px !important;
                    justify-content: center !important;
                    background: transparent !important;
                    padding: 0 !important;
                  }
                `}</style>

                {/* FRONT SIDE OF ID CARD */}
                {(idCardSide === 'both' || idCardSide === 'front') && (
                  <div
                    className="w-[280px] h-[440px] rounded-2xl bg-white shadow-xl overflow-hidden border border-emerald-200 relative flex flex-col justify-between select-none"
                    style={{
                      fontFamily: "'Hind Siliguri', 'Poppins', sans-serif",
                    }}
                  >
                    {/* Top Header with Dark Green Gradient */}
                    <div className="bg-gradient-to-br from-[#0B6B3A] via-[#09542e] to-[#04331a] p-3 text-center text-white relative shadow-sm">
                      <div className="absolute top-2 left-2.5 w-8 h-8 rounded-full bg-white/10 p-1 flex items-center justify-center border border-white/20">
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                      <div className="pl-6">
                        <h4 className="text-sm font-bold tracking-wide text-amber-300">
                          সময়ের বাতিঘর
                        </h4>
                        <p className="text-[9px] text-emerald-100 font-medium">
                          আলোর দিশারী মানবিক সমাজ বিনির্মাণে
                        </p>
                      </div>
                      <div className="mt-1 pt-1 border-t border-emerald-500/30 flex items-center justify-between text-[8px] text-emerald-200 px-1 font-mono">
                        <span>সদস্য পরিচয়পত্র</span>
                        <span>MEMBER ID CARD</span>
                      </div>
                    </div>

                    {/* Member Photo in Circular Gold Frame */}
                    <div className="flex flex-col items-center pt-2 px-3">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-amber-400 p-0.5 shadow-md bg-white">
                          <Avatar className="w-full h-full rounded-full">
                            <AvatarImage
                              src={idCardMember.photo_url || undefined}
                              alt={idCardMember.full_name}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-emerald-100 text-[#0B6B3A] font-bold text-2xl">
                              {idCardMember.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        {idCardMember.blood_group && (
                          <div className="absolute -bottom-1 -right-1 bg-rose-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow border-2 border-white flex items-center gap-0.5">
                            <Droplet className="w-2.5 h-2.5 fill-white" />
                            {idCardMember.blood_group}
                          </div>
                        )}
                      </div>

                      {/* Name & Title */}
                      <h3 className="text-base font-bold text-gray-900 mt-2 text-center leading-tight">
                        {idCardMember.full_name}
                      </h3>
                      <p className="text-[11px] font-semibold text-[#0B6B3A] mt-0.5">
                        {idCardMember.member_type === 'lifetime'
                          ? 'আজীবন সদস্য'
                          : idCardMember.member_type === 'honorary'
                          ? 'সম্মানসূচক সদস্য'
                          : 'সাধারণ সদস্য'}
                      </p>
                    </div>

                    {/* Member Details */}
                    <div className="px-4 py-2 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between py-1 border-b border-gray-100">
                        <span className="text-[10px] text-gray-500">আইডি নম্বর / ID:</span>
                        <span className="font-mono font-bold text-[#0B6B3A] text-xs">
                          {idCardMember.member_id}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-gray-100">
                        <span className="text-[10px] text-gray-500">মোবাইল / Phone:</span>
                        <span className="font-mono text-gray-800 text-[11px]">
                          {idCardMember.phone || '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-gray-100">
                        <span className="text-[10px] text-gray-500">পেশা / Occupation:</span>
                        <span className="text-gray-800 text-[11px] truncate max-w-[140px]">
                          {idCardMember.occupation || '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-[10px] text-gray-500">ঠিকানা / Location:</span>
                        <span className="text-gray-800 text-[10px] truncate max-w-[140px]">
                          {extractDeviceAudit(idCardMember.address).cleanAddress || 'নওগাঁ, বাংলাদেশ'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Wave Footer with Barcode Simulation */}
                    <div className="bg-emerald-50 border-t border-emerald-100 p-2.5 text-center">
                      {/* Barcode Lines Visual */}
                      <div className="flex items-center justify-center gap-0.5 h-6 px-4 mb-1">
                        {[4, 2, 6, 3, 5, 2, 7, 3, 2, 5, 3, 6, 2, 4, 6, 3, 2, 5, 4, 2, 6].map(
                          (w, i) => (
                            <span
                              key={i}
                              className="bg-gray-800 inline-block h-full"
                              style={{ width: `${w}px` }}
                            />
                          )
                        )}
                      </div>
                      <p className="text-[8px] font-mono text-gray-500 tracking-widest">
                        {idCardMember.member_id} • SOMOYER BATIGHOR
                      </p>
                    </div>
                  </div>
                )}

                {/* BACK SIDE OF ID CARD */}
                {(idCardSide === 'both' || idCardSide === 'back') && (
                  <div
                    className="w-[280px] h-[440px] rounded-2xl bg-white shadow-xl overflow-hidden border border-emerald-200 relative flex flex-col justify-between select-none"
                    style={{
                      fontFamily: "'Hind Siliguri', 'Poppins', sans-serif",
                    }}
                  >
                    {/* Top Green Accent Bar */}
                    <div className="bg-[#0B6B3A] h-2.5 w-full" />

                    <div className="p-4 space-y-3">
                      {/* Organization Rules & Instructions */}
                      <div className="text-center space-y-1 pb-2 border-b border-emerald-100">
                        <h5 className="text-[11px] font-bold text-[#0B6B3A]">জরুরি নির্দেশনাবলী</h5>
                        <p className="text-[8.5px] text-gray-600 leading-relaxed">
                          ১. এই পরিচয়পত্রটি ‘সময়ের বাতিঘর’ সংগঠনের সম্পদ।
                        </p>
                        <p className="text-[8.5px] text-gray-600 leading-relaxed">
                          ২. এটি অহস্তান্তরযোগ্য এবং কেবল সদস্যের নিজস্ব ব্যবহারের জন্য প্রযোজ্য।
                        </p>
                        <p className="text-[8.5px] text-gray-600 leading-relaxed">
                          ৩. কার্ড হারিয়ে গেলে অবিলম্বে অফিসে যোগাযোগ করার অনুরোধ করা হলো।
                        </p>
                      </div>

                      {/* Official Contact Details */}
                      <div className="space-y-1.5 text-[9.5px] text-gray-700 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-[#0B6B3A] shrink-0" />
                          <span>কেন্দ্রীয় কার্যালয়: নওগাঁ সদর, নওগাঁ</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-[#0B6B3A] shrink-0" />
                          <span>হটলাইন: +880 1700-000000</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-[#0B6B3A] shrink-0" />
                          <span>ইমেইল: info@somoyerbatighor.org</span>
                        </div>
                      </div>

                      {/* QR Code / Digital Verification Graphic */}
                      <div className="flex items-center justify-center p-2">
                        <div className="p-2 border-2 border-dashed border-emerald-300 rounded-xl bg-white text-center">
                          <QrCode className="w-16 h-16 text-[#0B6B3A] mx-auto" />
                          <span className="text-[8px] font-mono text-gray-500 mt-1 block">
                            ডিজিটাল ভেরিফিকেশন কোড
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Signatures & Seal */}
                    <div className="p-3 border-t border-emerald-100 bg-gray-50/80">
                      <div className="flex items-center justify-between text-center px-2">
                        <div>
                          <div className="h-6 border-b border-gray-400 w-20 mx-auto" />
                          <span className="text-[8px] text-gray-600 block mt-0.5">
                            সাধারণ সম্পাদক
                          </span>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-emerald-400 bg-emerald-100/50 flex items-center justify-center text-[7px] font-bold text-[#0B6B3A]">
                          সিলমোহর
                        </div>
                        <div>
                          <div className="h-6 border-b border-gray-400 w-20 mx-auto" />
                          <span className="text-[8px] text-gray-600 block mt-0.5">
                            অনুমোদিত সভাপতি
                          </span>
                        </div>
                      </div>
                      <p className="text-[7.5px] text-center text-gray-400 mt-2">
                        Somoyer Batighor Official Identity Document
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          Print All Members Dialog
      ========================================================================= */}
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{language === 'bn' ? 'সদস্য তালিকা প্রিন্ট' : 'Print Members List'}</span>
              <Button
                onClick={() => handlePrintList()}
                className="gap-2 bg-[#0B6B3A] hover:bg-[#09542e] text-white"
              >
                <Printer className="w-4 h-4" />
                {language === 'bn' ? 'প্রিন্ট করুন' : 'Print'}
              </Button>
            </DialogTitle>
          </DialogHeader>

          {/* Printable Content */}
          <div ref={printRef} className="p-4 bg-white text-gray-900">
            <style type="text/css" media="print">{`
              @page { 
                size: landscape; 
                margin: 10mm; 
              }
              body { 
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-header {
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 2px solid #333;
                padding-bottom: 10px;
              }
              .print-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 11px;
              }
              .print-table th, .print-table td {
                border: 1px solid #333;
                padding: 6px 8px;
                text-align: left;
              }
              .print-table th {
                background-color: #f0f0f0 !important;
                font-weight: bold;
              }
              .print-table tr:nth-child(even) {
                background-color: #f9f9f9 !important;
              }
            `}</style>

            <div className="print-header text-center pb-4 mb-4 border-b-2 border-gray-800">
              <h1 className="text-2xl font-bold text-gray-900">
                {language === 'bn' ? 'সময়ের বাতিঘর' : 'Somoyer Batighor'}
              </h1>
              <h2 className="text-lg text-gray-700 mt-1">
                {language === 'bn' ? 'সদস্য তালিকা ও পরিচিতি' : 'Members Directory'}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'bn'
                  ? `মোট সদস্য সংখ্যা: ${members?.length || 0} জন | অনুমোদিত: ${stats.approved} জন | অপেক্ষমাণ: ${stats.pending} জন`
                  : `Total Members: ${members?.length || 0} | Approved: ${stats.approved} | Pending: ${stats.pending}`}
                {' | '}
                {language === 'bn' ? 'প্রিন্টের তারিখ: ' : 'Date: '}
                {new Date().toLocaleDateString('bn-BD')}
              </p>
            </div>

            <table className="print-table w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-2 text-center w-10">ক্রম</th>
                  <th className="border border-gray-300 px-2 py-2 text-left">সদস্য আইডি</th>
                  <th className="border border-gray-300 px-2 py-2 text-left">নাম</th>
                  <th className="border border-gray-300 px-2 py-2 text-left">মোবাইল</th>
                  <th className="border border-gray-300 px-2 py-2 text-left">ইমেইল</th>
                  <th className="border border-gray-300 px-2 py-2 text-left">ঠিকানা</th>
                  <th className="border border-gray-300 px-2 py-2 text-left">পেশা</th>
                  <th className="border border-gray-300 px-2 py-2 text-center">রক্ত</th>
                  <th className="border border-gray-300 px-2 py-2 text-center">ক্যাটাগরি</th>
                  <th className="border border-gray-300 px-2 py-2 text-center">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member, index) => (
                  <tr key={member.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-2 py-1.5 text-center">{index + 1}</td>
                    <td className="border border-gray-300 px-2 py-1.5 font-mono font-bold text-xs">
                      {member.member_id}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 font-medium">
                      {member.full_name}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 font-mono">
                      {member.phone || '-'}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 text-[11px]">
                      {member.email || '-'}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 text-[11px]">
                      {extractDeviceAudit(member.address).cleanAddress || 'নওগাঁ'}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5">{member.occupation || '-'}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center font-bold">
                      {member.blood_group || '-'}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center text-[11px]">
                      {member.member_type === 'lifetime'
                        ? 'আজীবন'
                        : member.member_type === 'honorary'
                        ? 'সম্মানসূচক'
                        : 'সাধারণ'}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center text-[11px]">
                      {member.status === 'approved'
                        ? 'অনুমোদিত'
                        : member.status === 'pending'
                        ? 'অপেক্ষমাণ'
                        : 'স্থগিত'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
              <p>
                {language === 'bn'
                  ? 'এই তালিকা স্বয়ংক্রিয়ভাবে সময়ের বাতিঘর কেন্দ্রীয় ডেটাবেজ থেকে প্রস্তুতকৃত।'
                  : 'This document is auto-generated by Somoyer Batighor Central Management System.'}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MembersManagement;
