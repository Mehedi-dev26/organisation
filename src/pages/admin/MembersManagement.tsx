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
} from 'lucide-react';
import { compressImage, formatFileSize } from '@/lib/imageUtils';
import { useReactToPrint } from 'react-to-print';
import { bangladeshGeoData, professionsList, getUnionsForUpazila } from '@/data/bangladeshGeoData';
import { useSiteLogo } from '@/hooks/useSiteLogo';

export interface Member {
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
  user_id: string | null;
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

  // Generate Next Member ID
  const generateMemberId = () => {
    if (!members || members.length === 0) {
      return 'SB-0001';
    }
    const memberIds = members
      .map((m) => m.member_id)
      .filter((id) => id?.startsWith('SB-'))
      .map((id) => parseInt(id.replace('SB-', ''), 10))
      .filter((num) => !isNaN(num));

    const maxId = memberIds.length > 0 ? Math.max(...memberIds) : 0;
    const nextId = maxId + 1;
    return `SB-${nextId.toString().padStart(4, '0')}`;
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
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAllMemberQueries();
      refetch();
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description:
          language === 'bn'
            ? 'সদস্য তালিকা থেকে মুছে ফেলা হয়েছে।'
            : 'Member deleted from directory.',
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
      const { error } = await supabase.from('members').update({ status: 'approved' }).eq('id', id);
      if (error) throw error;
      return { id, name };
    },
    onSuccess: (data) => {
      invalidateAllMemberQueries();
      refetch();

      // Automatically switch from 'pending' filter to 'all' so the newly approved member remains visible
      setSelectedStatus((prev) => (prev === 'pending' ? 'all' : prev));

      toast({
        title: language === 'bn' ? 'সদস্য অনুমোদিত!' : 'Member Approved!',
        description:
          language === 'bn'
            ? `${data?.name ? `"${data.name}" - ` : ''}সদস্য আবেদন অনুমোদিত হয়েছে এবং মোট সক্রিয় সদস্য তালিকায় যুক্ত হয়েছে।`
            : `${data?.name ? `"${data.name}" - ` : ''}Member application approved and added to all active members.`,
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
      const { error } = await supabase.from('members').update({ status: 'rejected' }).eq('id', id);
      if (error) throw error;
      return { id, name };
    },
    onSuccess: (data) => {
      invalidateAllMemberQueries();
      refetch();
      toast({
        title: language === 'bn' ? 'স্থগিত / বাতিল' : 'Suspended / Rejected',
        description:
          language === 'bn'
            ? `${data?.name ? `"${data.name}" - ` : ''}সদস্য আবেদন স্থগিত বা প্রত্যাখ্যাত হয়েছে।`
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

  // Account creation
  const handleCreateMemberAccount = async (member: Member) => {
    if (!member.email) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'সদস্যের ইমেইল নেই' : 'Member has no email address',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingAccount(member.id);
    try {
      const response = await supabase.functions.invoke('create-member-user', {
        body: {
          email: member.email,
          password: 'member@123',
          memberId: member.id,
          fullName: member.full_name,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description:
          language === 'bn'
            ? 'সদস্যের লগইন অ্যাকাউন্ট তৈরি হয়েছে। ডিফল্ট পাসওয়ার্ড: member@123'
            : 'Member account created. Default password: member@123',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message || 'অ্যাকাউন্ট তৈরি করা যায়নি',
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
      address: member.address || '',
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
                            {member.address || (language === 'bn' ? 'নওগাঁ, বাংলাদেশ' : 'Naogaon, Bangladesh')}
                          </span>
                        </div>
                      </TableCell>

                      {/* Type */}
                      <TableCell className="text-center py-3">
                        {getMemberTypeBadge(member.member_type)}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center py-3">
                        {getStatusBadge(member.status)}
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
                            {member.status === 'approved' && !member.user_id && member.email && (
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
          Member Profile Details Modal
      ========================================================================= */}
      <Dialog open={!!viewingMember} onOpenChange={() => setViewingMember(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl">
          {viewingMember && (
            <div>
              {/* Profile Header Banner */}
              <div className="h-28 bg-gradient-to-r from-[#0B6B3A] to-[#14532d] relative p-4 flex items-end">
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white/80 hover:text-white hover:bg-white/20 h-8 px-2.5 rounded-lg text-xs gap-1.5"
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
                    className="text-white/80 hover:text-white hover:bg-white/20 h-8 w-8 rounded-lg"
                    onClick={() => setViewingMember(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Avatar & Badges */}
              <div className="px-6 pb-6 pt-0 relative space-y-4">
                <div className="flex justify-between items-end -mt-12">
                  <Avatar className="w-24 h-24 border-4 border-background shadow-lg rounded-2xl">
                    <AvatarImage src={viewingMember.photo_url || undefined} alt={viewingMember.full_name} />
                    <AvatarFallback className="bg-emerald-100 text-[#0B6B3A] text-2xl font-bold rounded-2xl">
                      {viewingMember.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col items-end gap-1.5">
                    {getStatusBadge(viewingMember.status)}
                    {getMemberTypeBadge(viewingMember.member_type)}
                  </div>
                </div>

                {/* Name & ID */}
                <div>
                  <h3 className="text-xl font-bold text-[#14231B] dark:text-foreground">
                    {viewingMember.full_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs font-bold text-[#0B6B3A] bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      ID: {viewingMember.member_id}
                    </span>
                    {viewingMember.blood_group && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200">
                        <Droplet className="w-3 h-3 fill-rose-600" />
                        {viewingMember.blood_group}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid with Enhanced Professional Typography & One-Click Phone Copy */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 bg-slate-50 dark:bg-card/70 rounded-2xl border border-slate-200/90 text-[13px]">
                  {/* Phone with Copy Action */}
                  <div className="space-y-1 bg-white dark:bg-background p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <p className="text-slate-500 font-semibold text-xs flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      {language === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}
                    </p>
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-bold text-slate-800 dark:text-foreground font-mono text-sm">
                        {viewingMember.phone || '-'}
                      </p>
                      {viewingMember.phone && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyPhone(viewingMember.phone!)}
                          className="h-7 px-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg gap-1 border border-emerald-200/60"
                          title={language === 'bn' ? 'নম্বর কপি করুন' : 'Copy phone number'}
                        >
                          {copiedPhone ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-[11px] font-bold text-emerald-700">{language === 'bn' ? 'কপি হয়েছে' : 'Copied'}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-emerald-600" />
                              <span className="text-[11px] font-bold">{language === 'bn' ? 'কপি' : 'Copy'}</span>
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1 bg-white dark:bg-background p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <p className="text-slate-500 font-semibold text-xs flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-emerald-600" />
                      {language === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
                    </p>
                    <p className="font-bold text-slate-800 dark:text-foreground text-[13px] truncate">
                      {viewingMember.email || '-'}
                    </p>
                  </div>

                  {/* Address (National Cascading View with Location Icon) */}
                  <div className="space-y-1 sm:col-span-2 bg-white dark:bg-background p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <p className="text-slate-500 font-semibold text-xs flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      {language === 'bn' ? 'স্থায়ী / বর্তমান ঠিকানা (লোকেশন)' : 'Location & Address'}
                    </p>
                    <p className="font-bold text-slate-800 dark:text-foreground text-sm leading-relaxed">
                      {viewingMember.address || (language === 'bn' ? 'নওগাঁ, রাজশাহী, বাংলাদেশ' : 'Naogaon, Rajshahi, Bangladesh')}
                    </p>
                  </div>

                  {/* Profession */}
                  <div className="space-y-1 bg-white dark:bg-background p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <p className="text-slate-500 font-semibold text-xs flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                      {language === 'bn' ? 'পেশা / কর্মক্ষেত্র' : 'Profession'}
                    </p>
                    <p className="font-bold text-slate-800 dark:text-foreground text-sm">
                      {viewingMember.occupation || '-'}
                    </p>
                  </div>

                  {/* Joining Date */}
                  <div className="space-y-1 bg-white dark:bg-background p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <p className="text-slate-500 font-semibold text-xs flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      {language === 'bn' ? 'সদস্য হওয়ার তারিখ' : 'Joining Date'}
                    </p>
                    <p className="font-bold text-slate-800 dark:text-foreground text-sm">
                      {viewingMember.joining_date
                        ? new Date(viewingMember.joining_date).toLocaleDateString('bn-BD')
                        : language === 'bn'
                        ? 'সংরক্ষিত'
                        : 'Enrolled'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons in Profile */}
                <div className="flex gap-2 pt-2">
                  {viewingMember.status === 'pending' && (
                    <>
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
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
                        className="flex-1 gap-1.5"
                        onClick={() => {
                          rejectMutation.mutate({ id: viewingMember.id, name: viewingMember.full_name });
                          setViewingMember(null);
                        }}
                      >
                        <XCircle className="w-4 h-4" />
                        {language === 'bn' ? 'প্রত্যাখ্যান' : 'Reject'}
                      </Button>
                    </>
                  )}

                  <Button
                    variant="outline"
                    className="flex-1 gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-50"
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
                    className="flex-1 gap-1.5"
                    onClick={() => {
                      handleEdit(viewingMember);
                      setViewingMember(null);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                    {language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                          {idCardMember.address || 'নওগাঁ, বাংলাদেশ'}
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
                      {member.address || 'নওগাঁ'}
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
