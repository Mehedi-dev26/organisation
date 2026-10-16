import React, { useState, useRef, useMemo } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Upload,
  X,
  Users,
  ShieldCheck,
  Award,
  Clock,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  Eye,
  RefreshCw,
  RotateCcw,
  CheckCircle,
  Briefcase,
} from 'lucide-react';
import { compressImage } from '@/lib/imageUtils';

export interface CommitteeMember {
  id: string;
  name_bn: string;
  name_en: string | null;
  position_bn: string;
  position_en: string | null;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  term_start: string | null;
  term_end: string | null;
  member_id: string | null;
}

// Predefined Standard Bangladeshi Social Organization Roles / Portfolios
interface OrganizationRole {
  id: string;
  category: 'executive' | 'advisory' | 'subcommittee';
  category_bn: string;
  title_bn: string;
  title_en: string;
  default_sort: number;
}

const PREDEFINED_ROLES: OrganizationRole[] = [
  // ১. শীর্ষ নেতৃত্ব (Executive Leadership)
  { id: 'pres', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'সভাপতি', title_en: 'President', default_sort: 1 },
  { id: 'sr_vp', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'সিনিয়র সহ-সভাপতি', title_en: 'Senior Vice President', default_sort: 2 },
  { id: 'vp', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'সহ-সভাপতি', title_en: 'Vice President', default_sort: 3 },
  { id: 'gs', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'সাধারণ সম্পাদক', title_en: 'General Secretary', default_sort: 4 },
  { id: 'jgs', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'যুগ্ম সাধারণ সম্পাদক', title_en: 'Joint General Secretary', default_sort: 5 },
  { id: 'ags', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'সহ-সাধারণ সম্পাদক', title_en: 'Assistant General Secretary', default_sort: 6 },
  { id: 'org_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'সাংগঠনিক সম্পাদক', title_en: 'Organizing Secretary', default_sort: 7 },
  { id: 'asst_org_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'সহ-সাংগঠনিক সম্পাদক', title_en: 'Assistant Organizing Secretary', default_sort: 8 },

  // ২. বিভাগীয় সম্পাদকীয় দায়িত্ব (Secretarial Portfolios)
  { id: 'fin_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'অর্থ ও হিসাব সম্পাদক', title_en: 'Finance & Accounts Secretary', default_sort: 9 },
  { id: 'asst_fin_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'সহ-অর্থ সম্পাদক', title_en: 'Assistant Finance Secretary', default_sort: 10 },
  { id: 'office_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'দপ্তর সম্পাদক', title_en: 'Office Secretary', default_sort: 11 },
  { id: 'asst_office_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'সহ-দপ্তর সম্পাদক', title_en: 'Assistant Office Secretary', default_sort: 12 },
  { id: 'pub_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'প্রচার ও প্রকাশনা সম্পাদক', title_en: 'Publicity & Publication Secretary', default_sort: 13 },
  { id: 'ict_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'তথ্যপ্রযুক্তি ও আইসিটি (ICT) সম্পাদক', title_en: 'Information Technology & ICT Secretary', default_sort: 14 },
  { id: 'blood_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'রক্তদান ও স্বাস্থ্য বিষয়ক সম্পাদক', title_en: 'Blood Donation & Health Affairs Secretary', default_sort: 15 },
  { id: 'social_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'সমাজকল্যাণ ও ত্রাণ সম্পাদক', title_en: 'Social Welfare & Relief Secretary', default_sort: 16 },
  { id: 'edu_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'শিক্ষা ও পাঠাগার বিষয়ক সম্পাদক', title_en: 'Education & Library Affairs Secretary', default_sort: 17 },
  { id: 'cult_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'সাংস্কৃতিক ও ক্রীড়া সম্পাদক', title_en: 'Cultural & Sports Secretary', default_sort: 18 },
  { id: 'women_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'নারী ও শিশু বিষয়ক সম্পাদিকা', title_en: 'Women & Child Welfare Secretary', default_sort: 19 },
  { id: 'env_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'পরিবেশ ও বৃক্ষরোপণ সম্পাদক', title_en: 'Environment & Tree Plantation Secretary', default_sort: 20 },
  { id: 'law_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'আইন ও মানবাধিকার বিষয়ক সম্পাদক', title_en: 'Law & Human Rights Secretary', default_sort: 21 },
  { id: 'vol_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'দুর্যোগ ব্যবস্থাপনা ও স্বেচ্ছাসেবক সম্পাদক', title_en: 'Disaster Management & Volunteer Secretary', default_sort: 22 },
  { id: 'exec_mem', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'কার্যনির্বাহী সদস্য', title_en: 'Executive Member', default_sort: 30 },

  // ৩. উপদেষ্টা পরিষদ (Advisory Council)
  { id: 'chief_adv', category: 'advisory', category_bn: 'উপদেষ্টা পরিষদ', title_bn: 'প্রধান উপদেষ্টা', title_en: 'Chief Advisor', default_sort: 101 },
  { id: 'perm_adv', category: 'advisory', category_bn: 'উপদেষ্টা পরিষদ', title_bn: 'স্থায়ী উপদেষ্টা', title_en: 'Permanent Advisor', default_sort: 102 },
  { id: 'adv', category: 'advisory', category_bn: 'উপদেষ্টা পরিষদ', title_bn: 'উপদেষ্টা', title_en: 'Advisor', default_sort: 103 },
  { id: 'patron', category: 'advisory', category_bn: 'উপদেষ্টা পরিষদ', title_bn: 'সম্মানীয় পৃষ্ঠপোষক', title_en: 'Honorable Patron', default_sort: 104 },

  // ৪. উপ-কমিটি ও বিশেষ উইং (Sub-Committees & Special Wings)
  { id: 'ict_coord', category: 'subcommittee', category_bn: 'বিশেষ উইং / উপ-কমিটি', title_bn: 'আইসিটি ও ডিজিটাল মিডিয়া সমন্বয়ক', title_en: 'ICT & Digital Media Coordinator', default_sort: 201 },
  { id: 'blood_coord', category: 'subcommittee', category_bn: 'বিশেষ উইং / উপ-কমিটি', title_bn: 'রক্তদান কর্মসূচি সমন্বয়ক', title_en: 'Blood Donation Program Coordinator', default_sort: 202 },
  { id: 'event_coord', category: 'subcommittee', category_bn: 'বিশেষ উইং / উপ-কমিটি', title_bn: 'ইভেন্ট ও লজিস্টিক সমন্বয়ক', title_en: 'Event & Logistics Coordinator', default_sort: 203 },
  { id: 'youth_coord', category: 'subcommittee', category_bn: 'বিশেষ উইং / উপ-কমিটি', title_bn: 'ছাত্র ও যুব কল্যাণ সমন্বয়ক', title_en: 'Student & Youth Welfare Coordinator', default_sort: 204 },
];

const TENURE_PRESETS = [
  { label: '২০২৪ – ২০২৬ (বর্তমান কার্যনির্বাহী মেয়াদ)', start: '2024-01-01', end: '2026-12-31' },
  { label: '২০২২ – ২০২৪ (সাবেক কমিটি মেয়াদ)', start: '2022-01-01', end: '2024-12-31' },
  { label: '২০২৬ – ২০২৮ (আসন্ন কমিটি মেয়াদ)', start: '2026-01-01', end: '2028-12-31' },
  { label: 'আজীবন / স্থায়ী (উপদেষ্টা পরিষদ)', start: '2020-01-01', end: '2099-12-31' },
];

const CommitteeManagement: React.FC = () => {
  const { language } = useLanguage();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dialogs
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<CommitteeMember | null>(null);
  const [viewingMember, setViewingMember] = useState<CommitteeMember | null>(null);

  // Filters
  const [selectedFilterTab, setSelectedFilterTab] = useState<'all' | 'executive' | 'advisory' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenureFilter, setSelectedTenureFilter] = useState<string>('all');
  const [selectedRoleCategory, setSelectedRoleCategory] = useState<string>('all');

  // Form State
  const [formData, setFormData] = useState({
    name_bn: '',
    name_en: '',
    position_bn: '',
    position_en: '',
    photo_url: '',
    phone: '',
    email: '',
    sort_order: 1,
    is_active: true,
    term_start: '2024-01-01',
    term_end: '2026-12-31',
  });

  const [selectedRolePreset, setSelectedRolePreset] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enable Realtime Subscription
  useRealtimeSubscription({ table: 'committee_members', queryKey: ['admin-committee'] });

  // Query Committee Members
  const { data: committeeMembers, isLoading, refetch } = useQuery({
    queryKey: ['admin-committee'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('committee_members')
        .select('*')
        .order('sort_order', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return (data || []) as CommitteeMember[];
    },
  });

  // Dynamic Statistics for Top 4 Cards
  const stats = useMemo(() => {
    const total = committeeMembers?.length || 0;
    let executive = 0;
    let advisory = 0;
    let inactive = 0;

    committeeMembers?.forEach((m) => {
      if (!m.is_active) {
        inactive++;
      } else {
        const pos = (m.position_bn || '').toLowerCase();
        if (pos.includes('উপদেষ্টা') || pos.includes('পৃষ্ঠপোষক')) {
          advisory++;
        } else {
          executive++;
        }
      }
    });

    return { total, executive, advisory, inactive };
  }, [committeeMembers]);

  // Distinct Tenures for Filter Dropdown
  const distinctTenures = useMemo(() => {
    if (!committeeMembers) return [];
    const set = new Set<string>();
    committeeMembers.forEach((m) => {
      if (m.term_start || m.term_end) {
        const startYear = m.term_start ? new Date(m.term_start).getFullYear() : '';
        const endYear = m.term_end ? new Date(m.term_end).getFullYear() : '';
        if (startYear || endYear) {
          set.add(`${startYear} - ${endYear}`);
        }
      }
    });
    return Array.from(set);
  }, [committeeMembers]);

  // Filtered Committee Members
  const filteredMembers = useMemo(() => {
    if (!committeeMembers) return [];

    return committeeMembers.filter((member) => {
      // 1. Top 4 Button Category Filter
      if (selectedFilterTab === 'inactive') {
        if (member.is_active) return false;
      } else if (selectedFilterTab === 'advisory') {
        const pos = (member.position_bn || '').toLowerCase();
        if (!pos.includes('উপদেষ্টা') && !pos.includes('পৃষ্ঠপোষক')) return false;
      } else if (selectedFilterTab === 'executive') {
        const pos = (member.position_bn || '').toLowerCase();
        if (pos.includes('উপদেষ্টা') || pos.includes('পৃষ্ঠপোষক')) return false;
      }

      // 2. Role Category Dropdown Filter
      if (selectedRoleCategory !== 'all') {
        const pos = (member.position_bn || '').toLowerCase();
        if (selectedRoleCategory === 'executive') {
          if (pos.includes('উপদেষ্টা') || pos.includes('সমন্বয়ক')) return false;
        } else if (selectedRoleCategory === 'advisory') {
          if (!pos.includes('উপদেষ্টা') && !pos.includes('পৃষ্ঠপোষক')) return false;
        } else if (selectedRoleCategory === 'subcommittee') {
          if (!pos.includes('সমন্বয়ক') && !pos.includes('উইং') && !pos.includes('টিম')) return false;
        }
      }

      // 3. Tenure Dropdown Filter
      if (selectedTenureFilter !== 'all') {
        const startYear = member.term_start ? new Date(member.term_start).getFullYear() : '';
        const endYear = member.term_end ? new Date(member.term_end).getFullYear() : '';
        const tenureStr = `${startYear} - ${endYear}`;
        if (tenureStr !== selectedTenureFilter) return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNameBn = member.name_bn?.toLowerCase().includes(q);
        const matchesNameEn = member.name_en?.toLowerCase().includes(q);
        const matchesPosBn = member.position_bn?.toLowerCase().includes(q);
        const matchesPosEn = member.position_en?.toLowerCase().includes(q);
        const matchesPhone = member.phone?.toLowerCase().includes(q);
        const matchesEmail = member.email?.toLowerCase().includes(q);

        if (
          !matchesNameBn &&
          !matchesNameEn &&
          !matchesPosBn &&
          !matchesPosEn &&
          !matchesPhone &&
          !matchesEmail
        ) {
          return false;
        }
      }

      return true;
    });
  }, [committeeMembers, selectedFilterTab, selectedRoleCategory, selectedTenureFilter, searchQuery]);

  // Image Selection & High Quality Processing
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'ছবি ৫MB এর কম হতে হবে' : 'Photo must be under 5MB',
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

  const uploadHighQualityPhoto = async (): Promise<string | null> => {
    if (!selectedImage) return formData.photo_url || null;

    try {
      setIsUploading(true);
      // High Quality Portrait Compression (600x600 @ 0.92 quality)
      const compressedBlob = await compressImage(selectedImage, 600, 600, 0.92);
      const fileName = `committee/${Date.now()}-${selectedImage.name.replace(/\s+/g, '_')}`;

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
      console.error('Photo upload error:', error);
      toast({
        title: language === 'bn' ? 'ছবি আপলোড ব্যর্থ' : 'Photo upload failed',
        description: error.message || 'ত্রুটি ঘটেছে',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Role Selection Handler (Auto-populates Bengali & English Positions)
  const handleRoleSelection = (roleId: string) => {
    setSelectedRolePreset(roleId);
    const role = PREDEFINED_ROLES.find((r) => r.id === roleId);
    if (role) {
      setFormData((prev) => ({
        ...prev,
        position_bn: role.title_bn,
        position_en: role.title_en,
        sort_order: role.default_sort,
      }));
    }
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (dataToSubmit: typeof formData) => {
      const { error } = await supabase.from('committee_members').insert([
        {
          name_bn: dataToSubmit.name_bn.trim(),
          name_en: dataToSubmit.name_en?.trim() || null,
          position_bn: dataToSubmit.position_bn.trim(),
          position_en: dataToSubmit.position_en?.trim() || null,
          photo_url: dataToSubmit.photo_url || null,
          phone: dataToSubmit.phone?.trim() || null,
          email: dataToSubmit.email?.trim() || null,
          sort_order: dataToSubmit.sort_order || 0,
          is_active: dataToSubmit.is_active,
          term_start: dataToSubmit.term_start || null,
          term_end: dataToSubmit.term_end || null,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-committee'] });
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description:
          language === 'bn'
            ? 'নতুন কমিটি সদস্য সফলভাবে যুক্ত হয়েছেন।'
            : 'Committee member successfully added.',
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
    mutationFn: async ({ id, dataToSubmit }: { id: string; dataToSubmit: typeof formData }) => {
      const { error } = await supabase
        .from('committee_members')
        .update({
          name_bn: dataToSubmit.name_bn.trim(),
          name_en: dataToSubmit.name_en?.trim() || null,
          position_bn: dataToSubmit.position_bn.trim(),
          position_en: dataToSubmit.position_en?.trim() || null,
          photo_url: dataToSubmit.photo_url || null,
          phone: dataToSubmit.phone?.trim() || null,
          email: dataToSubmit.email?.trim() || null,
          sort_order: dataToSubmit.sort_order || 0,
          is_active: dataToSubmit.is_active,
          term_start: dataToSubmit.term_start || null,
          term_end: dataToSubmit.term_end || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-committee'] });
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description:
          language === 'bn'
            ? 'কমিটি সদস্যের তথ্য সফলভাবে আপডেট হয়েছে।'
            : 'Committee member updated successfully.',
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
      const { error } = await supabase.from('committee_members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-committee'] });
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description:
          language === 'bn'
            ? 'কমিটি সদস্য মুছে ফেলা হয়েছে।'
            : 'Committee member deleted.',
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

  // Reset Form
  const resetForm = () => {
    setFormData({
      name_bn: '',
      name_en: '',
      position_bn: '',
      position_en: '',
      photo_url: '',
      phone: '',
      email: '',
      sort_order: (committeeMembers?.length || 0) + 1,
      is_active: true,
      term_start: '2024-01-01',
      term_end: '2026-12-31',
    });
    setSelectedRolePreset('');
    setSelectedImage(null);
    setImagePreview(null);
    setEditingMember(null);
    setIsDialogOpen(false);
  };

  // Open Edit Form
  const handleEdit = (member: CommitteeMember) => {
    setEditingMember(member);
    setFormData({
      name_bn: member.name_bn,
      name_en: member.name_en || '',
      position_bn: member.position_bn,
      position_en: member.position_en || '',
      photo_url: member.photo_url || '',
      phone: member.phone || '',
      email: member.email || '',
      sort_order: member.sort_order || 1,
      is_active: member.is_active ?? true,
      term_start: member.term_start || '2024-01-01',
      term_end: member.term_end || '2026-12-31',
    });
    setImagePreview(member.photo_url || null);
    setIsDialogOpen(true);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const photoUrl = await uploadHighQualityPhoto();
    const dataToSubmit = {
      ...formData,
      photo_url: photoUrl || '',
    };

    if (editingMember) {
      updateMutation.mutate({ id: editingMember.id, dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  // Helper: Format Tenure String
  const formatTenure = (start: string | null, end: string | null) => {
    if (!start && !end) return language === 'bn' ? 'চলমান মেয়াদ' : 'Active Term';
    const s = start ? new Date(start).getFullYear() : '';
    const e = end ? new Date(end).getFullYear() : '';
    if (s && e) return `${s} – ${e}`;
    if (s) return `${s} থেকে`;
    return `${e} পর্যন্ত`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#14231B] dark:text-foreground flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-[#0B6B3A]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            {language === 'bn' ? 'কমিটি ব্যবস্থাপনা' : 'Committee Management'}
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {language === 'bn'
              ? 'সময়ের বাতিঘরের কার্যনির্বাহী পরিষদ, উপদেষ্টা পরিষদ ও উপ-কমিটির মেয়াদ ও দায়িত্ব নিয়ন্ত্রণ করুন'
              : 'Manage executive committee, advisory council, portfolio categories, tenures & photos.'}
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
            size="sm"
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
            disabled={!isAdmin}
            className="bg-[#0B6B3A] hover:bg-[#09542e] text-white gap-1.5 shadow-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {language === 'bn' ? 'নতুন কমিটি সদস্য যুক্ত করুন' : 'Add Committee Member'}
          </Button>
        </div>
      </div>

      {/* Top 4 Multi-Color Stat / Filter Buttons (Matching Blood Donors & Members Management) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. All Committee Members */}
        <button
          type="button"
          onClick={() => setSelectedFilterTab('all')}
          className={`text-left bg-card border rounded-2xl p-4 shadow-sm transition-all duration-200 flex items-center gap-3.5 hover:shadow-md cursor-pointer ${
            selectedFilterTab === 'all'
              ? 'ring-2 ring-[#0B6B3A] border-[#0B6B3A] bg-emerald-50/40 dark:bg-emerald-950/20'
              : 'hover:border-emerald-300'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[#0B6B3A] shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium truncate">
              {language === 'bn' ? 'মোট কমিটি সদস্য' : 'Total Committee'}
            </p>
            <h3 className="text-2xl font-bold text-[#14231B] dark:text-foreground">
              {stats.total}
            </h3>
          </div>
        </button>

        {/* 2. Executive Council Members */}
        <button
          type="button"
          onClick={() => setSelectedFilterTab('executive')}
          className={`text-left bg-card border rounded-2xl p-4 shadow-sm transition-all duration-200 flex items-center gap-3.5 hover:shadow-md cursor-pointer ${
            selectedFilterTab === 'executive'
              ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/40 dark:bg-blue-950/20'
              : 'hover:border-blue-300'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium truncate">
              {language === 'bn' ? 'কার্যনির্বাহী পরিষদ' : 'Executive Council'}
            </p>
            <h3 className="text-2xl font-bold text-blue-600">{stats.executive}</h3>
          </div>
        </button>

        {/* 3. Advisory Council & Patrons */}
        <button
          type="button"
          onClick={() => setSelectedFilterTab('advisory')}
          className={`text-left bg-card border rounded-2xl p-4 shadow-sm transition-all duration-200 flex items-center gap-3.5 hover:shadow-md cursor-pointer ${
            selectedFilterTab === 'advisory'
              ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/40 dark:bg-amber-950/20'
              : 'hover:border-amber-300'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium truncate">
              {language === 'bn' ? 'উপদেষ্টা পরিষদ' : 'Advisory Council'}
            </p>
            <h3 className="text-2xl font-bold text-amber-600">{stats.advisory}</h3>
          </div>
        </button>

        {/* 4. Past / Inactive Members */}
        <button
          type="button"
          onClick={() => setSelectedFilterTab('inactive')}
          className={`text-left bg-card border rounded-2xl p-4 shadow-sm transition-all duration-200 flex items-center gap-3.5 hover:shadow-md cursor-pointer ${
            selectedFilterTab === 'inactive'
              ? 'ring-2 ring-rose-500 border-rose-500 bg-rose-50/40 dark:bg-rose-950/20'
              : 'hover:border-rose-300'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium truncate">
              {language === 'bn' ? 'সাবেক / নিষ্ক্রিয়' : 'Past / Inactive'}
            </p>
            <h3 className="text-2xl font-bold text-rose-600">{stats.inactive}</h3>
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
                  ? 'কমিটি সদস্যের নাম, পদবি, মোবাইল বা ইমেইল খুঁজুন...'
                  : 'Search by committee member name, designation, phone or email...'
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

          {/* Committee Tenure Filter (কমিটির মেয়াদ ফিল্টার) */}
          <div className="w-full md:w-56">
            <Select value={selectedTenureFilter} onValueChange={setSelectedTenureFilter}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder={language === 'bn' ? 'কমিটির মেয়াদ' : 'Committee Tenure'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {language === 'bn' ? 'সকল কমিটির মেয়াদ' : 'All Tenures'}
                </SelectItem>
                {distinctTenures.map((tenure) => (
                  <SelectItem key={tenure} value={tenure}>
                    {tenure}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Committee Category / Wing Filter */}
          <div className="w-full md:w-48">
            <Select value={selectedRoleCategory} onValueChange={setSelectedRoleCategory}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder={language === 'bn' ? 'দায়িত্বের পরিষদ' : 'Portfolio Wing'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'bn' ? 'সকল পরিষদ' : 'All Portfolios'}</SelectItem>
                <SelectItem value="executive">{language === 'bn' ? 'কার্যনির্বাহী পরিষদ' : 'Executive'}</SelectItem>
                <SelectItem value="advisory">{language === 'bn' ? 'উপদেষ্টা পরিষদ' : 'Advisory'}</SelectItem>
                <SelectItem value="subcommittee">{language === 'bn' ? 'বিশেষ উইং / উপ-কমিটি' : 'Sub-Committee'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters */}
          {(selectedFilterTab !== 'all' ||
            selectedRoleCategory !== 'all' ||
            selectedTenureFilter !== 'all' ||
            searchQuery.trim()) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedFilterTab('all');
                setSelectedRoleCategory('all');
                setSelectedTenureFilter('all');
                setSearchQuery('');
              }}
              className="h-10 px-3 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {language === 'bn' ? 'রিসেট' : 'Reset'}
            </Button>
          )}
        </div>

        {/* Summary Counter */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
          <span>
            {language === 'bn'
              ? `প্রদর্শিত হচ্ছে ${filteredMembers.length} জন কমিটি সদস্য`
              : `Showing ${filteredMembers.length} committee members`}
          </span>
          <span className="font-medium text-[#0B6B3A]">
            {language === 'bn' ? 'সময়ের বাতিঘর নির্বাহী কাউন্সিল' : 'Somoyer Batighor Executive Council'}
          </span>
        </div>
      </div>

      {/* Committee Members Table */}
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#0B6B3A]" />
              <p className="text-sm font-medium">
                {language === 'bn' ? 'কমিটি সদস্যদের তথ্য লোড হচ্ছে...' : 'Loading committee directory...'}
              </p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#0B6B3A] mx-auto flex items-center justify-center mb-3">
                <ShieldCheck className="w-8 h-8 opacity-60" />
              </div>
              <h4 className="text-base font-semibold text-foreground">
                {language === 'bn' ? 'কোন কমিটি সদস্য পাওয়া যায়নি' : 'No committee members found'}
              </h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {language === 'bn'
                  ? 'আপনার দেওয়া সার্চ বা ফিল্টারের সাথে মিল রেখে কোনো সদস্য পাওয়া যায়নি।'
                  : 'No committee member matches the current query or filter.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-50/60">
                    <TableHead className="w-14 text-center font-semibold">
                      {language === 'bn' ? 'ক্রম' : 'Serial'}
                    </TableHead>
                    <TableHead className="w-16 text-center font-semibold">
                      {language === 'bn' ? 'ছবি' : 'Photo'}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {language === 'bn' ? 'নাম (বাংলা ও ইংরেজি)' : 'Name'}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {language === 'bn' ? 'দায়িত্ব ও পদবি' : 'Position / Portfolio'}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {language === 'bn' ? 'কমিটির মেয়াদ' : 'Tenure'}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {language === 'bn' ? 'যোগাযোগ (ফোন/ইমেইল)' : 'Contact'}
                    </TableHead>
                    <TableHead className="w-24 text-center font-semibold">
                      {language === 'bn' ? 'স্ট্যাটাস' : 'Status'}
                    </TableHead>
                    <TableHead className="w-32 text-right font-semibold pr-4">
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
                      {/* Sort Order Rank Badge */}
                      <TableCell className="text-center py-3">
                        <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 dark:bg-muted dark:text-gray-300 px-2 py-0.5 rounded">
                          #{String(member.sort_order || 1).padStart(2, '0')}
                        </span>
                      </TableCell>

                      {/* Photo Avatar */}
                      <TableCell className="text-center py-3">
                        <Avatar className="w-11 h-11 border-2 border-emerald-300 shadow-sm mx-auto">
                          <AvatarImage
                            src={member.photo_url || undefined}
                            alt={member.name_bn}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-emerald-100 text-[#0B6B3A] font-bold text-sm">
                            {member.name_bn?.charAt(0) || 'K'}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>

                      {/* Name in Bengali & English */}
                      <TableCell className="py-3">
                        <div className="font-bold text-[#14231B] dark:text-foreground">
                          {member.name_bn}
                        </div>
                        {member.name_en && (
                          <div className="text-xs text-muted-foreground font-medium">
                            {member.name_en}
                          </div>
                        )}
                      </TableCell>

                      {/* Designation */}
                      <TableCell className="py-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#0B6B3A] border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>{member.position_bn}</span>
                        </div>
                        {member.position_en && (
                          <div className="text-[11px] text-muted-foreground mt-0.5 pl-1">
                            {member.position_en}
                          </div>
                        )}
                      </TableCell>

                      {/* Committee Tenure (কমিটির মেয়াদ) */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{formatTenure(member.term_start, member.term_end)}</span>
                        </div>
                      </TableCell>

                      {/* Contact Info */}
                      <TableCell className="py-3">
                        <div className="text-xs space-y-0.5">
                          {member.phone ? (
                            <a
                              href={`tel:${member.phone}`}
                              className="flex items-center gap-1 font-mono text-foreground hover:text-[#0B6B3A]"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{member.phone}</span>
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                          {member.email && (
                            <a
                              href={`mailto:${member.email}`}
                              className="flex items-center gap-1 text-muted-foreground hover:text-foreground truncate max-w-[170px]"
                            >
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{member.email}</span>
                            </a>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center py-3">
                        <Badge
                          variant={member.is_active ? 'default' : 'secondary'}
                          className={
                            member.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-muted text-muted-foreground'
                          }
                        >
                          {member.is_active
                            ? language === 'bn'
                              ? 'সক্রিয়'
                              : 'Active'
                            : language === 'bn'
                            ? 'নিষ্ক্রিয়'
                            : 'Inactive'}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right py-3 pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 rounded-lg text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                            onClick={() => setViewingMember(member)}
                            title={language === 'bn' ? 'প্রোফাইল দেখুন' : 'View Details'}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                            onClick={() => handleEdit(member)}
                            disabled={!isAdmin}
                            title={language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 rounded-lg text-rose-500 hover:bg-rose-100 hover:text-rose-600"
                            onClick={() => {
                              if (
                                window.confirm(
                                  language === 'bn'
                                    ? `আপনি কি নিশ্চিতভাবে "${member.name_bn}" সদস্যের তথ্য মুছে ফেলতে চান?`
                                    : `Are you sure you want to delete "${member.name_bn}"?`
                                )
                              ) {
                                deleteMutation.mutate(member.id);
                              }
                            }}
                            disabled={!isAdmin}
                            title={language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
          Add / Edit Committee Member Dialog
      ========================================================================= */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#14231B] dark:text-foreground">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[#0B6B3A]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              {editingMember
                ? language === 'bn'
                  ? 'কমিটি সদস্য তথ্য সম্পাদনা'
                  : 'Edit Committee Member'
                : language === 'bn'
                ? 'নতুন কমিটি সদস্য যুক্ত করুন'
                : 'Add New Committee Member'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            {/* 1. Committee Tenure Section (কমিটির মেয়াদ সেকশন) */}
            <div className="bg-emerald-50/40 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B6B3A] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {language === 'bn' ? 'কমিটির মেয়াদ ও সাল' : 'Committee Tenure & Period'}
                </h4>
                <span className="text-[11px] text-muted-foreground">
                  {language === 'bn' ? 'মেয়াদ অনুযায়ী স্বয়ংক্রিয় ফিল্টার হবে' : 'Governs active period'}
                </span>
              </div>

              {/* Quick Preset Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {language === 'bn' ? 'দ্রুত মেয়াদ নির্বাচন (প্রিসেট)' : 'Quick Tenure Preset'}
                </Label>
                <Select
                  onValueChange={(val) => {
                    const preset = TENURE_PRESETS.find((p) => p.label === val);
                    if (preset) {
                      setFormData((prev) => ({
                        ...prev,
                        term_start: preset.start,
                        term_end: preset.end,
                      }));
                    }
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder={language === 'bn' ? 'মেয়াদ প্রিসেট বেছে নিন' : 'Select Tenure Preset'} />
                  </SelectTrigger>
                  <SelectContent>
                    {TENURE_PRESETS.map((preset) => (
                      <SelectItem key={preset.label} value={preset.label}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date and End Date Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    {language === 'bn' ? 'মেয়াদ শুরু (Term Start)' : 'Term Start Date'}
                  </Label>
                  <Input
                    type="date"
                    value={formData.term_start}
                    onChange={(e) => setFormData({ ...formData, term_start: e.target.value })}
                    className="h-9 text-sm font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    {language === 'bn' ? 'মেয়াদ শেষ (Term End)' : 'Term End Date'}
                  </Label>
                  <Input
                    type="date"
                    value={formData.term_end}
                    onChange={(e) => setFormData({ ...formData, term_end: e.target.value })}
                    className="h-9 text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 2. Portfolio Selection with Automatic Bangla & English Designation */}
            <div className="bg-emerald-50/40 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B6B3A] flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  {language === 'bn'
                    ? 'দায়িত্ব ও পদবি নির্বাচন (স্বয়ংক্রিয় বাংলা ও ইংরেজি)'
                    : 'Portfolio & Automatic Designation'}
                </h4>
                <span className="text-[11px] text-muted-foreground">
                  {language === 'bn' ? 'বাংলাদেশ সামাজিক সংগঠন নীতিমালা' : 'Standard BD NGO Roles'}
                </span>
              </div>

              {/* Predefined Role Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {language === 'bn' ? 'দায়িত্বের ক্যাটাগরি ও পদবি নির্বাচন করুন' : 'Select Standard Role'} *
                </Label>
                <Select value={selectedRolePreset} onValueChange={handleRoleSelection}>
                  <SelectTrigger className="h-10 text-sm border-emerald-200">
                    <SelectValue placeholder={language === 'bn' ? 'কমিটির দায়িত্ব / ক্যাটাগরি বেছে নিন...' : 'Choose portfolio role...'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <div className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground bg-muted">
                      কার্যনির্বাহী পরিষদ (Executive Council)
                    </div>
                    {PREDEFINED_ROLES.filter((r) => r.category === 'executive').map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.title_bn} ({r.title_en})
                      </SelectItem>
                    ))}

                    <div className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground bg-muted mt-2">
                      উপদেষ্টা পরিষদ (Advisory Council)
                    </div>
                    {PREDEFINED_ROLES.filter((r) => r.category === 'advisory').map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.title_bn} ({r.title_en})
                      </SelectItem>
                    ))}

                    <div className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground bg-muted mt-2">
                      বিশেষ উইং / উপ-কমিটি (Sub-Committees)
                    </div>
                    {PREDEFINED_ROLES.filter((r) => r.category === 'subcommittee').map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.title_bn} ({r.title_en})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  {language === 'bn'
                    ? 'ক্যাটাগরি নির্বাচন করলে পদবির বাংলা, ইংরেজি ও ক্রম সংখ্যা স্বয়ংক্রিয়ভাবে চলে আসবে।'
                    : 'Selecting a role automatically populates Bengali and English titles and priority rank.'}
                </p>
              </div>

              {/* Auto Populated Designation Fields (Editable for custom tweaks) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    {language === 'bn' ? 'পদবি (বাংলা)' : 'Position (Bengali)'} *
                  </Label>
                  <Input
                    value={formData.position_bn}
                    onChange={(e) => setFormData({ ...formData, position_bn: e.target.value })}
                    placeholder={language === 'bn' ? 'যেমন: সাধারণ সম্পাদক' : 'e.g. General Secretary'}
                    required
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    {language === 'bn' ? 'পদবি (ইংরেজি)' : 'Position (English)'}
                  </Label>
                  <Input
                    value={formData.position_en}
                    onChange={(e) => setFormData({ ...formData, position_en: e.target.value })}
                    placeholder="e.g. General Secretary"
                    className="h-9 text-sm font-sans"
                  />
                </div>
              </div>
            </div>

            {/* 3. Member Personal Details & Contact */}
            <div className="bg-emerald-50/40 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B6B3A] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {language === 'bn' ? 'সদস্যের নাম ও যোগাযোগের তথ্য' : 'Personal & Contact Information'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bengali Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    {language === 'bn' ? 'সদস্যের নাম (বাংলায়)' : 'Name (Bengali)'} *
                  </Label>
                  <Input
                    value={formData.name_bn}
                    onChange={(e) => setFormData({ ...formData, name_bn: e.target.value })}
                    placeholder={language === 'bn' ? 'যেমন: মো: মেহেদী হাসান' : 'Bengali Name'}
                    required
                    className="h-9 text-sm"
                  />
                </div>

                {/* English Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    {language === 'bn' ? 'সদস্যের নাম (ইংরেজিতে)' : 'Name (English)'}
                  </Label>
                  <Input
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    placeholder="e.g. Md. Mehedi Hasan"
                    className="h-9 text-sm font-sans"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    {language === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}
                  </Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="017XXXXXXXX"
                    className="h-9 text-sm font-mono"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    {language === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="leader@example.com"
                    className="h-9 text-sm"
                  />
                </div>

                {/* Sort Order Rank */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    {language === 'bn' ? 'ক্রম সংখ্যা (র‍্যাংক / সিরিয়াল)' : 'Sort Order Rank'}
                  </Label>
                  <Input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    placeholder="1"
                    className="h-9 text-sm font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {language === 'bn' ? '১ = সভাপতি, ৪ = সাধারণ সম্পাদক ইত্যাদি' : '1 = President, 4 = General Secretary'}
                  </p>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    id="member-active-toggle"
                  />
                  <Label htmlFor="member-active-toggle" className="text-sm font-semibold cursor-pointer">
                    {formData.is_active
                      ? language === 'bn'
                        ? 'সক্রিয় কমিটি সদস্য'
                        : 'Active Committee Member'
                      : language === 'bn'
                      ? 'নিষ্ক্রিয় / সাবেক সদস্য'
                      : 'Inactive / Past Member'}
                  </Label>
                </div>
              </div>
            </div>

            {/* 4. Direct High-Quality Photo Upload Section */}
            <div className="bg-emerald-50/40 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B6B3A] flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                {language === 'bn' ? 'হাই-কোয়ালিটি ছবি আপলোড' : 'High Quality Photo Upload'}
              </h4>

              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative">
                    <Avatar className="w-20 h-20 border-2 border-emerald-500 shadow-sm">
                      <AvatarImage src={imagePreview} alt="Preview" className="object-cover" />
                      <AvatarFallback>{formData.name_bn.charAt(0) || 'K'}</AvatarFallback>
                    </Avatar>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full shadow"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                        setFormData({ ...formData, photo_url: '' });
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
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
                    id="committee-photo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2 border-emerald-300 hover:bg-emerald-50 text-emerald-800 dark:text-emerald-300"
                  >
                    <Upload className="w-4 h-4" />
                    {language === 'bn' ? 'গ্যালারি / ডিভাইস থেকে ছবি দিন' : 'Upload From Device'}
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    {language === 'bn'
                      ? 'হাই রেজোলিউশন JPG/PNG ছবি। স্বয়ংক্রিয়ভাবে প্রফেশনাল পোর্ট্রেট কোয়ালিটিতে অপ্টিমাইজ হবে।'
                      : 'High-res JPG/PNG. Auto-optimized to crisp 600x600 portrait.'}
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
          Committee Member Profile Details Modal
      ========================================================================= */}
      <Dialog open={!!viewingMember} onOpenChange={() => setViewingMember(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
          {viewingMember && (
            <div>
              {/* Header Gradient */}
              <div className="h-28 bg-gradient-to-r from-[#0B6B3A] via-[#0e8045] to-[#14532d] relative p-4 flex items-end">
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-3 right-3 text-white/80 hover:text-white hover:bg-white/20 h-8 w-8 rounded-lg"
                  onClick={() => setViewingMember(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Avatar & Badges */}
              <div className="px-6 pb-6 pt-0 relative space-y-4">
                <div className="flex justify-between items-end -mt-12">
                  <Avatar className="w-24 h-24 border-4 border-background shadow-lg rounded-2xl">
                    <AvatarImage
                      src={viewingMember.photo_url || undefined}
                      alt={viewingMember.name_bn}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-emerald-100 text-[#0B6B3A] text-2xl font-bold rounded-2xl">
                      {viewingMember.name_bn.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col items-end gap-1.5">
                    <Badge
                      className={
                        viewingMember.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }
                    >
                      {viewingMember.is_active ? 'সক্রিয় পরিষদ' : 'নিষ্ক্রিয়'}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      র‍্যাংক #{String(viewingMember.sort_order || 1).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Name & Titles */}
                <div>
                  <h3 className="text-xl font-bold text-[#14231B] dark:text-foreground">
                    {viewingMember.name_bn}
                  </h3>
                  {viewingMember.name_en && (
                    <p className="text-xs text-muted-foreground font-medium">
                      {viewingMember.name_en}
                    </p>
                  )}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#0B6B3A] border border-emerald-200 mt-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{viewingMember.position_bn}</span>
                    {viewingMember.position_en && (
                      <span className="text-emerald-600/70 font-normal">
                        ({viewingMember.position_en})
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-muted/40 rounded-xl border text-xs">
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground font-medium flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-600" />
                      {language === 'bn' ? 'মোবাইল' : 'Phone'}
                    </p>
                    <p className="font-semibold text-foreground font-mono">
                      {viewingMember.phone || '-'}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-muted-foreground font-medium flex items-center gap-1">
                      <Mail className="w-3 h-3 text-emerald-600" />
                      {language === 'bn' ? 'ইমেইল' : 'Email'}
                    </p>
                    <p className="font-semibold text-foreground truncate">
                      {viewingMember.email || '-'}
                    </p>
                  </div>

                  <div className="space-y-0.5 sm:col-span-2">
                    <p className="text-muted-foreground font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-600" />
                      {language === 'bn' ? 'কমিটির মেয়াদ' : 'Tenure Period'}
                    </p>
                    <p className="font-semibold text-foreground">
                      {formatTenure(viewingMember.term_start, viewingMember.term_end)}
                    </p>
                  </div>
                </div>

                {/* Action Buttons in Modal */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-1.5"
                    onClick={() => {
                      handleEdit(viewingMember);
                      setViewingMember(null);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                    {language === 'bn' ? 'সম্পাদনা করুন' : 'Edit Member'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommitteeManagement;
