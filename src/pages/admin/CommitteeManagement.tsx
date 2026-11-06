import React, { useState, useRef, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Calendar,
  Phone,
  Mail,
  Sparkles,
  Eye,
  RefreshCw,
  Crop,
  Briefcase,
  ListChecks,
  FileText,
  UserCheck,
} from 'lucide-react';
import { compressImage } from '@/lib/imageUtils';
import LogoCropModal from '@/components/common/LogoCropModal';
import { getMemberRoleDetails, CommitteeCustomDetailsMap, CustomCommitteeDetail } from '@/lib/committeeUtils';

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
  category: 'directorate' | 'executive' | 'advisory' | 'subcommittee';
  category_bn: string;
  title_bn: string;
  title_en: string;
  default_sort: number;
}

const PREDEFINED_ROLES: OrganizationRole[] = [
  // ০. পরিচালনা পরিষদ ও শীর্ষ নেতৃত্ব (Directorate)
  { id: 'director', category: 'directorate', category_bn: 'পরিচালনা পরিষদ', title_bn: 'পরিচালক', title_en: 'Director', default_sort: 1 },
  { id: 'managing_dir', category: 'directorate', category_bn: 'পরিচালনা পরিষদ', title_bn: 'ব্যবস্থাপনা পরিচালক', title_en: 'Managing Director', default_sort: 2 },
  { id: 'exec_dir', category: 'directorate', category_bn: 'পরিচালনা পরিষদ', title_bn: 'নির্বাহী পরিচালক', title_en: 'Executive Director', default_sort: 3 },

  // ১. শীর্ষ নেতৃত্ব (Executive Leadership)
  { id: 'pres', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'সভাপতি', title_en: 'President', default_sort: 4 },
  { id: 'sr_vp', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'সিনিয়র সহ-সভাপতি', title_en: 'Senior Vice President', default_sort: 5 },
  { id: 'vp', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'সহ-সভাপতি', title_en: 'Vice President', default_sort: 6 },
  { id: 'gs', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'সাধারণ সম্পাদক', title_en: 'General Secretary', default_sort: 7 },
  { id: 'cashier', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'কোষাধ্যক্ষ', title_en: 'Treasurer / Cashier', default_sort: 8 },
  { id: 'ict_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'আইসিটি ও তথ্যপ্রযুক্তি সম্পাদক', title_en: 'ICT & IT Affairs Secretary', default_sort: 9 },
  { id: 'jgs', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'যুগ্ম সাধারণ সম্পাদক', title_en: 'Joint General Secretary', default_sort: 10 },
  { id: 'ags', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'সহ-সাধারণ সম্পাদক', title_en: 'Assistant General Secretary', default_sort: 11 },
  { id: 'org_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'সাংগঠনিক সম্পাদক', title_en: 'Organizing Secretary', default_sort: 12 },
  { id: 'asst_org_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'সহ-সাংগঠনিক সম্পাদক', title_en: 'Assistant Organizing Secretary', default_sort: 13 },

  // ২. বিভাগীয় সম্পাদকীয় দায়িত্ব (Secretarial Portfolios)
  { id: 'fin_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'অর্থ ও হিসাব সম্পাদক', title_en: 'Finance & Accounts Secretary', default_sort: 14 },
  { id: 'asst_fin_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'সহ-অর্থ সম্পাদক', title_en: 'Assistant Finance Secretary', default_sort: 15 },
  { id: 'office_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'দপ্তর সম্পাদক', title_en: 'Office Secretary', default_sort: 16 },
  { id: 'asst_office_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'সহ-দপ্তর সম্পাদক', title_en: 'Assistant Office Secretary', default_sort: 17 },
  { id: 'pub_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'প্রচার ও প্রকাশনা সম্পাদক', title_en: 'Publicity & Publication Secretary', default_sort: 18 },
  { id: 'blood_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'রক্তদান ও স্বাস্থ্য বিষয়ক সম্পাদক', title_en: 'Blood Donation & Health Affairs Secretary', default_sort: 19 },
  { id: 'social_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'সমাজকল্যাণ ও ত্রাণ সম্পাদক', title_en: 'Social Welfare & Relief Secretary', default_sort: 20 },
  { id: 'edu_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'শিক্ষা ও পাঠাগার বিষয়ক সম্পাদক', title_en: 'Education & Library Affairs Secretary', default_sort: 21 },
  { id: 'cult_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'সাংস্কৃতিক ও ক্রীড়া সম্পাদক', title_en: 'Cultural & Sports Secretary', default_sort: 22 },
  { id: 'women_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'নারী ও শিশু বিষয়ক সম্পাদিকা', title_en: 'Women & Child Welfare Secretary', default_sort: 23 },
  { id: 'env_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'পরিবেশ ও বৃক্ষরোপণ সম্পাদক', title_en: 'Environment & Tree Plantation Secretary', default_sort: 24 },
  { id: 'law_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'আইন ও মানবাধিকার বিষয়ক সম্পাদক', title_en: 'Law & Human Rights Secretary', default_sort: 25 },
  { id: 'vol_sec', category: 'executive', category_bn: 'কার্যনির্বাহী পরিষদ', title_bn: 'দুর্যোগ ব্যবস্থাপনা ও স্বেচ্ছাসেবক সম্পাদক', title_en: 'Disaster Management & Volunteer Secretary', default_sort: 26 },
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
  const [selectedTenurePreset, setSelectedTenurePreset] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photo Cropping States
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);

  // Custom Role, Responsibilities & Bio States
  const [customResponsibilitiesText, setCustomResponsibilitiesText] = useState<string>('');
  const [customAboutText, setCustomAboutText] = useState<string>('');
  const [customRoleCategory, setCustomRoleCategory] = useState<string>('');

  // Enable Realtime Subscription
  useRealtimeSubscription({ table: 'committee_members', queryKey: ['admin-committee'] });

  // Query Committee Members
  const { data: committeeMembers, isLoading, refetch } = useQuery({
    queryKey: ['admin-committee'],
    staleTime: 1000 * 60 * 3, // 3 minutes cache for instant navigation
    queryFn: async () => {
      const { data, error } = await supabase
        .from('committee_members')
        .select('*')
        .order('sort_order', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return (data || []) as CommitteeMember[];
    },
  });

  // Query Custom Role & Responsibilities from site_settings
  const { data: customDetailsMap = {} } = useQuery<CommitteeCustomDetailsMap>({
    queryKey: ['committee-custom-details'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'committee_custom_details')
        .maybeSingle();
      if (error || !data?.value) return {};
      return data.value as CommitteeCustomDetailsMap;
    },
    staleTime: 1000 * 60,
  });

  // Helper: Persist custom role details into site_settings
  const saveMemberCustomDetails = async (
    memberId: string,
    responsibilities: string,
    about: string,
    category: string
  ) => {
    try {
      const respArray = responsibilities
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const current = { ...(customDetailsMap || {}) };
      current[memberId] = {
        role_category: category.trim() || undefined,
        responsibilities: respArray.length > 0 ? respArray : undefined,
        about: about.trim() || undefined,
      };

      await supabase
        .from('site_settings')
        .upsert(
          {
            key: 'committee_custom_details',
            value: current as any,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );

      queryClient.invalidateQueries({ queryKey: ['committee-custom-details'] });
    } catch (err) {
      console.warn('Failed to persist custom details to site_settings:', err);
    }
  };

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

  // Safe Image Cropping Launcher with CORS SecurityError Protection
  const handleOpenCrop = async (srcUrl: string) => {
    if (!srcUrl) return;
    try {
      if (srcUrl.startsWith('data:') || srcUrl.startsWith('blob:')) {
        setCropImageSrc(srcUrl);
        setIsCropModalOpen(true);
        return;
      }
      // Convert remote URL to local Blob Object URL to avoid Canvas CORS SecurityError
      const res = await fetch(srcUrl);
      const blob = await res.blob();
      const localUrl = URL.createObjectURL(blob);
      setCropImageSrc(localUrl);
      setIsCropModalOpen(true);
    } catch (err) {
      console.warn('Direct image crop fallback:', err);
      setCropImageSrc(srcUrl);
      setIsCropModalOpen(true);
    }
  };

  // Image Selection & Launch Crop Modal
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'ছবি ১০MB এর কম হতে হবে' : 'Photo must be under 10MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setCropImageSrc(src);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // Handle Crop Modal Save (Round avatar blob with user-chosen framing)
  const handleCropSave = (blob: Blob, previewUrl: string) => {
    setCroppedBlob(blob);
    setImagePreview(previewUrl);
    setIsCropModalOpen(false);
    toast({
      title: language === 'bn' ? 'ছবি ফ্রেম সমন্বয় সম্পন্ন' : 'Photo framing saved',
      description: language === 'bn' ? 'মুখমণ্ডল বৃত্তের মাঝে সফলভাবে সমন্বয় করা হয়েছে। নিচে "সংরক্ষণ" বা "আপডেট" বাটনে ক্লিক করুন।' : 'Head & face positioned inside circular frame. Click Save / Update below.',
    });
  };

  const uploadHighQualityPhoto = async (): Promise<string | null> => {
    const blobToUpload = croppedBlob || (selectedImage ? await compressImage(selectedImage, 600, 600, 0.92) : null);
    if (!blobToUpload) return formData.photo_url || null;

    try {
      setIsUploading(true);
      const fileExt = blobToUpload.type === 'image/png' ? 'png' : 'jpg';
      const baseName = (selectedImage?.name || 'leader_photo').replace(/\s+/g, '_').replace(/\.[^/.]+$/, '');
      const fileName = `committee/${Date.now()}-${baseName}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('member-photos')
        .upload(fileName, blobToUpload, {
          contentType: blobToUpload.type || 'image/jpeg',
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

      // If user hasn't typed custom responsibilities, auto-fill default ones for this role!
      if (!customResponsibilitiesText.trim()) {
        const defaultRoleDetails = getMemberRoleDetails(role.title_bn, 'bn');
        setCustomResponsibilitiesText(defaultRoleDetails.responsibilities.join('\n'));
        setCustomRoleCategory(defaultRoleDetails.category || role.category_bn);
      }
    }
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (dataToSubmit: typeof formData) => {
      const { data, error } = await supabase
        .from('committee_members')
        .insert([
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
        ])
        .select('id')
        .single();

      if (error) throw error;

      // Persist custom role duties and about bio to site_settings
      if (data?.id) {
        await saveMemberCustomDetails(
          data.id,
          customResponsibilitiesText,
          customAboutText,
          customRoleCategory
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-committee'] });
      queryClient.invalidateQueries({ queryKey: ['home-committee-preview'] });
      queryClient.invalidateQueries({ queryKey: ['public-committee'] });
      queryClient.invalidateQueries({ queryKey: ['committee-custom-details'] });
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

      // Persist custom role duties and about bio to site_settings
      await saveMemberCustomDetails(
        id,
        customResponsibilitiesText,
        customAboutText,
        customRoleCategory
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-committee'] });
      queryClient.invalidateQueries({ queryKey: ['home-committee-preview'] });
      queryClient.invalidateQueries({ queryKey: ['public-committee'] });
      queryClient.invalidateQueries({ queryKey: ['committee-custom-details'] });
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description:
          language === 'bn'
            ? 'কমিটি সদস্যের তথ্য ও দায়িত্ব সফলভাবে আপডেট হয়েছে।'
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

      // Clean up from customDetailsMap
      if (customDetailsMap && customDetailsMap[id]) {
        const current = { ...customDetailsMap };
        delete current[id];
        await supabase
          .from('site_settings')
          .upsert(
            {
              key: 'committee_custom_details',
              value: current as any,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          );
        queryClient.invalidateQueries({ queryKey: ['committee-custom-details'] });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-committee'] });
      queryClient.invalidateQueries({ queryKey: ['home-committee-preview'] });
      queryClient.invalidateQueries({ queryKey: ['public-committee'] });
      queryClient.invalidateQueries({ queryKey: ['committee-custom-details'] });
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
    setSelectedTenurePreset('');
    setSelectedImage(null);
    setImagePreview(null);
    setCroppedBlob(null);
    setCropImageSrc(null);
    setCustomResponsibilitiesText('');
    setCustomAboutText('');
    setCustomRoleCategory('');
    setEditingMember(null);
    setIsDialogOpen(false);
  };

  // Open Edit Form - Pre-fill all fields including presets and custom responsibilities
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

    // 1. Pre-fill role preset if matched
    const matchedRole = PREDEFINED_ROLES.find(
      (r) =>
        r.title_bn.trim() === member.position_bn?.trim() ||
        (member.position_en && r.title_en.toLowerCase() === member.position_en.toLowerCase())
    );
    setSelectedRolePreset(matchedRole ? matchedRole.id : '');

    // 2. Pre-fill tenure preset if matched
    const matchedTenure = TENURE_PRESETS.find(
      (p) => p.start === member.term_start && p.end === member.term_end
    );
    setSelectedTenurePreset(matchedTenure ? matchedTenure.label : '');

    // 3. Pre-fill custom responsibilities & about from site_settings or fallback defaults
    const custom = customDetailsMap?.[member.id];
    if (custom) {
      setCustomResponsibilitiesText(custom.responsibilities ? custom.responsibilities.join('\n') : '');
      setCustomAboutText(custom.about || '');
      setCustomRoleCategory(custom.role_category || '');
    } else {
      // Fallback: Populate standard responsibilities from committeeUtils
      const defaultRoleDetails = getMemberRoleDetails(member.position_bn, 'bn');
      setCustomResponsibilitiesText(defaultRoleDetails.responsibilities.join('\n'));
      setCustomAboutText('');
      setCustomRoleCategory(defaultRoleDetails.category || '');
    }

    setImagePreview(member.photo_url || null);
    setSelectedImage(null);
    setCroppedBlob(null);
    setCropImageSrc(null);
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
              ? 'সময়ের বাতিঘরের শীর্ষ ৫ নেতৃত্ব, কার্যনির্বাহী পরিষদ, উপদেষ্টা পরিষদ, ছবি ক্রপ ও দায়িত্ব নিয়ন্ত্রণ করুন'
              : 'Manage committee members, 5-leader hierarchy, responsibilities, tenures & circular photo crops.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              queryClient.invalidateQueries({ queryKey: ['committee-custom-details'] });
            }}
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

      {/* Top 4 Metric Filter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Members */}
        <Card
          onClick={() => setSelectedFilterTab('all')}
          className={`cursor-pointer transition-all border ${
            selectedFilterTab === 'all'
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs'
              : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                {language === 'bn' ? 'মোট পরিষদ সদস্য' : 'Total Members'}
              </p>
              <h3 className="text-2xl font-black text-[#14231B] dark:text-foreground mt-0.5 font-mono">
                {stats.total}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-[#0B6B3A] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Executive Council */}
        <Card
          onClick={() => setSelectedFilterTab('executive')}
          className={`cursor-pointer transition-all border ${
            selectedFilterTab === 'executive'
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs'
              : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                {language === 'bn' ? 'কার্যনির্বাহী পরিষদ' : 'Executive Council'}
              </p>
              <h3 className="text-2xl font-black text-[#0B6B3A] mt-0.5 font-mono">
                {stats.executive}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-[#0B6B3A] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Advisory Council */}
        <Card
          onClick={() => setSelectedFilterTab('advisory')}
          className={`cursor-pointer transition-all border ${
            selectedFilterTab === 'advisory'
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs'
              : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                {language === 'bn' ? 'উপদেষ্টা পরিষদ' : 'Advisory Council'}
              </p>
              <h3 className="text-2xl font-black text-amber-600 mt-0.5 font-mono">
                {stats.advisory}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Inactive Members */}
        <Card
          onClick={() => setSelectedFilterTab('inactive')}
          className={`cursor-pointer transition-all border ${
            selectedFilterTab === 'inactive'
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs'
              : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                {language === 'bn' ? 'সাবেক / নিষ্ক্রিয়' : 'Past / Inactive'}
              </p>
              <h3 className="text-2xl font-black text-slate-600 mt-0.5 font-mono">
                {stats.inactive}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar: Search, Role Category & Tenure Filters */}
      <Card className="border-slate-200 shadow-2xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder={
                  language === 'bn'
                    ? 'নাম, পদবি, মোবাইল বা ইমেইল দিয়ে খুঁজুন...'
                    : 'Search by name, role, phone or email...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            {/* Category Dropdown */}
            <Select value={selectedRoleCategory} onValueChange={setSelectedRoleCategory}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder={language === 'bn' ? 'কমিটি ক্যাটাগরি' : 'Category'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'bn' ? 'সকল ক্যাটাগরি' : 'All Categories'}</SelectItem>
                <SelectItem value="executive">{language === 'bn' ? 'কার্যনির্বাহী পরিষদ' : 'Executive'}</SelectItem>
                <SelectItem value="advisory">{language === 'bn' ? 'উপদেষ্টা পরিষদ' : 'Advisory'}</SelectItem>
                <SelectItem value="subcommittee">{language === 'bn' ? 'বিশেষ উইং ও উপ-কমিটি' : 'Subcommittees'}</SelectItem>
              </SelectContent>
            </Select>

            {/* Tenure Dropdown */}
            <Select value={selectedTenureFilter} onValueChange={setSelectedTenureFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder={language === 'bn' ? 'মেয়াদ অনুযায়ী ফিল্টার' : 'Filter by Tenure'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'bn' ? 'সকল মেয়াদ' : 'All Tenures'}</SelectItem>
                {distinctTenures.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Committee Members Table */}
      <Card className="border-slate-200 shadow-2xs overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0B6B3A]" />
              <p className="text-sm text-muted-foreground mt-2">
                {language === 'bn' ? 'কমিটির তথ্য লোড হচ্ছে...' : 'Loading committee members...'}
              </p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <ShieldCheck className="w-12 h-12 mx-auto mb-2 opacity-40 text-[#0B6B3A]" />
              <p className="font-semibold text-base">
                {language === 'bn' ? 'কোন কমিটি সদস্য পাওয়া যায়নি' : 'No committee members found'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {language === 'bn'
                  ? 'ফিল্টার পরিবর্তন করুন অথবা নতুন কমিটি সদস্য যুক্ত করুন'
                  : 'Try changing filters or add a new member.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-muted/40">
                  <TableRow>
                    <TableHead className="w-16 text-center font-bold">
                      {language === 'bn' ? 'ক্রম' : 'Rank'}
                    </TableHead>
                    <TableHead className="w-16 text-center font-bold">
                      {language === 'bn' ? 'ছবি' : 'Photo'}
                    </TableHead>
                    <TableHead className="font-bold">
                      {language === 'bn' ? 'নাম' : 'Name'}
                    </TableHead>
                    <TableHead className="font-bold">
                      {language === 'bn' ? 'পদবি ও ক্যাটাগরি' : 'Designation'}
                    </TableHead>
                    <TableHead className="font-bold">
                      {language === 'bn' ? 'কার্যকাল / মেয়াদ' : 'Tenure Period'}
                    </TableHead>
                    <TableHead className="font-bold">
                      {language === 'bn' ? 'যোগাযোগ' : 'Contact'}
                    </TableHead>
                    <TableHead className="text-center font-bold">
                      {language === 'bn' ? 'অবস্থা' : 'Status'}
                    </TableHead>
                    <TableHead className="text-right font-bold pr-6">
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
                        <Avatar className="w-11 h-11 border-2 border-emerald-300 shadow-xs mx-auto">
                          <AvatarImage
                            src={member.photo_url || undefined}
                            alt={member.name_bn}
                            className="object-cover"
                            style={{ objectPosition: 'center 20%' }}
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
                  ? 'কমিটি সদস্য তথ্য ও দায়িত্ব সম্পাদনা'
                  : 'Edit Committee Member & Role'
                : language === 'bn'
                ? 'নতুন কমিটি সদস্য যুক্ত করুন'
                : 'Add New Committee Member'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            {/* 1. Committee Tenure Section (কমিটির মেয়াদ সেকশন) */}
            <div className="bg-slate-50 dark:bg-card/70 p-4 sm:p-5 rounded-2xl border border-slate-200/90 space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#0B6B3A] flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {language === 'bn' ? 'কমিটির মেয়াদ ও সাল' : 'Committee Tenure & Period'}
                </h4>
                <span className="text-xs text-muted-foreground font-semibold">
                  {language === 'bn' ? 'মেয়াদ অনুযায়ী স্বয়ংক্রিয় ফিল্টার হবে' : 'Governs active period'}
                </span>
              </div>

              {/* Quick Preset Selector */}
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-slate-800 dark:text-foreground">
                  {language === 'bn' ? 'দ্রুত মেয়াদ নির্বাচন (প্রিসেট)' : 'Quick Tenure Preset'}
                </Label>
                <Select
                  value={selectedTenurePreset}
                  onValueChange={(val) => {
                    setSelectedTenurePreset(val);
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
                  <SelectTrigger className="h-10 text-sm font-semibold">
                    <SelectValue placeholder={language === 'bn' ? 'মেয়াদ প্রিসেট বেছে নিন' : 'Select Tenure Preset'} />
                  </SelectTrigger>
                  <SelectContent>
                    {TENURE_PRESETS.map((preset) => (
                      <SelectItem key={preset.label} value={preset.label} className="text-sm font-medium">
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date and End Date Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-800 dark:text-foreground">
                    {language === 'bn' ? 'মেয়াদ শুরু (Term Start)' : 'Term Start Date'}
                  </Label>
                  <Input
                    type="date"
                    value={formData.term_start}
                    onChange={(e) => setFormData({ ...formData, term_start: e.target.value })}
                    className="h-10 text-sm font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-800 dark:text-foreground">
                    {language === 'bn' ? 'মেয়াদ শেষ (Term End)' : 'Term End Date'}
                  </Label>
                  <Input
                    type="date"
                    value={formData.term_end}
                    onChange={(e) => setFormData({ ...formData, term_end: e.target.value })}
                    className="h-10 text-sm font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* 2. Portfolio Selection with Automatic Bangla & English Designation */}
            <div className="bg-slate-50 dark:bg-card/70 p-4 sm:p-5 rounded-2xl border border-slate-200/90 space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#0B6B3A] flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {language === 'bn'
                    ? 'দায়িত্ব ও পদবি নির্বাচন (স্বয়ংক্রিয় বাংলা ও ইংরেজি)'
                    : 'Portfolio & Automatic Designation'}
                </h4>
                <span className="text-xs text-muted-foreground font-semibold">
                  {language === 'bn' ? 'বাংলাদেশ সামাজিক সংগঠন নীতিমালা' : 'Standard BD NGO Roles'}
                </span>
              </div>

              {/* Predefined Role Selector */}
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-slate-800 dark:text-foreground">
                  {language === 'bn' ? 'দায়িত্বের ক্যাটাগরি ও পদবি নির্বাচন করুন' : 'Select Standard Role'} *
                </Label>
                <Select value={selectedRolePreset} onValueChange={handleRoleSelection}>
                  <SelectTrigger className="h-10 text-sm border-emerald-300 font-semibold">
                    <SelectValue placeholder={language === 'bn' ? 'কমিটির দায়িত্ব / ক্যাটাগরি বেছে নিন...' : 'Choose portfolio role...'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <div className="px-2 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-between">
                      <span>পরিচালনা পরিষদ (Directorate)</span>
                      <span className="text-[10px] text-[#0B6B3A] font-extrabold uppercase">শীর্ষ পর্যায়</span>
                    </div>
                    {PREDEFINED_ROLES.filter((r) => r.category === 'directorate').map((r) => (
                      <SelectItem key={r.id} value={r.id} className="text-sm font-semibold text-[#0B6B3A]">
                        {r.title_bn} ({r.title_en})
                      </SelectItem>
                    ))}

                    <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground bg-muted mt-2">
                      কার্যনির্বাহী পরিষদ (Executive Council)
                    </div>
                    {PREDEFINED_ROLES.filter((r) => r.category === 'executive').map((r) => (
                      <SelectItem key={r.id} value={r.id} className="text-sm font-medium">
                        {r.title_bn} ({r.title_en})
                      </SelectItem>
                    ))}

                    <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground bg-muted mt-2">
                      উপদেষ্টা পরিষদ (Advisory Council)
                    </div>
                    {PREDEFINED_ROLES.filter((r) => r.category === 'advisory').map((r) => (
                      <SelectItem key={r.id} value={r.id} className="text-sm font-medium">
                        {r.title_bn} ({r.title_en})
                      </SelectItem>
                    ))}

                    <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground bg-muted mt-2">
                      বিশেষ উইং / উপ-কমিটি (Sub-Committees)
                    </div>
                    {PREDEFINED_ROLES.filter((r) => r.category === 'subcommittee').map((r) => (
                      <SelectItem key={r.id} value={r.id} className="text-sm font-medium">
                        {r.title_bn} ({r.title_en})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground font-medium">
                  {language === 'bn'
                    ? 'ক্যাটাগরি নির্বাচন করলে পদবির বাংলা, ইংরেজি ও ক্রম সংখ্যা স্বয়ংক্রিয়ভাবে চলে আসবে।'
                    : 'Selecting a role automatically populates Bengali and English titles and priority rank.'}
                </p>
              </div>

              {/* Auto Populated Designation Fields (Editable for custom tweaks) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-800 dark:text-foreground">
                    {language === 'bn' ? 'পদবি (বাংলা)' : 'Position (Bengali)'} *
                  </Label>
                  <Input
                    value={formData.position_bn}
                    onChange={(e) => setFormData({ ...formData, position_bn: e.target.value })}
                    placeholder={language === 'bn' ? 'যেমন: সাধারণ সম্পাদক' : 'e.g. General Secretary'}
                    required
                    className="h-10 text-sm font-bold text-[#0B6B3A]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-800 dark:text-foreground">
                    {language === 'bn' ? 'পদবি (ইংরেজি)' : 'Position (English)'}
                  </Label>
                  <Input
                    value={formData.position_en}
                    onChange={(e) => setFormData({ ...formData, position_en: e.target.value })}
                    placeholder="e.g. General Secretary"
                    className="h-10 text-sm font-sans font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* 3. Member Personal Details & Contact */}
            <div className="bg-slate-50 dark:bg-card/70 p-4 sm:p-5 rounded-2xl border border-slate-200/90 space-y-3.5">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#0B6B3A] flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {language === 'bn' ? 'সদস্যের নাম ও যোগাযোগের তথ্য' : 'Personal & Contact Information'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bengali Name */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-800 dark:text-foreground">
                    {language === 'bn' ? 'সদস্যের নাম (বাংলায়)' : 'Name (Bengali)'} *
                  </Label>
                  <Input
                    value={formData.name_bn}
                    onChange={(e) => setFormData({ ...formData, name_bn: e.target.value })}
                    placeholder={language === 'bn' ? 'যেমন: মো: মেহেদী হাসান' : 'Bengali Name'}
                    required
                    className="h-10 text-sm font-bold"
                  />
                </div>

                {/* English Name */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-800 dark:text-foreground">
                    {language === 'bn' ? 'সদস্যের নাম (ইংরেজিতে)' : 'Name (English)'}
                  </Label>
                  <Input
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    placeholder="e.g. Md. Mehedi Hasan"
                    className="h-10 text-sm font-sans font-semibold"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-800 dark:text-foreground">
                    {language === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}
                  </Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="017XXXXXXXX"
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
                    placeholder="leader@example.com"
                    className="h-10 text-sm font-medium"
                  />
                </div>

                {/* Sort Order Rank */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-800 dark:text-foreground">
                    {language === 'bn' ? 'ক্রম সংখ্যা (র‍্যাংক / সিরিয়াল)' : 'Sort Order Rank'}
                  </Label>
                  <Input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    placeholder="1"
                    className="h-10 text-sm font-mono font-bold"
                  />
                  <p className="text-xs text-muted-foreground font-medium">
                    {language === 'bn'
                      ? 'শীর্ষ ৫ নেতৃত্ব: ১ = সভাপতি, ২ = সিনিয়র সহ-সভাপতি, ৩ = সহ-সভাপতি, ৪ = সাধারণ সম্পাদক, ৫ = কোষাধ্যক্ষ'
                      : 'Top 5 leadership: 1 = President, 2 = Sr VP, 3 = VP, 4 = GS, 5 = Treasurer'}
                  </p>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    id="member-active-toggle"
                  />
                  <Label htmlFor="member-active-toggle" className="text-sm font-bold text-slate-800 dark:text-foreground cursor-pointer">
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

            {/* 4. Custom Role Responsibilities & Bio Description Section */}
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 sm:p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#0B6B3A] flex items-center gap-2">
                  <ListChecks className="w-4 h-4" />
                  {language === 'bn' ? 'সংগঠনের ভূমিকা ও দায়িত্বাবলি' : 'Role & Responsibilities'}
                </h4>
                <Badge variant="outline" className="text-emerald-700 bg-white border-emerald-300 text-xs">
                  {language === 'bn' ? '(i) বাটনে প্রদর্শিত হবে' : 'Shown in (i) modal'}
                </Badge>
              </div>

              {/* Custom Role Category Name */}
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-slate-800 dark:text-foreground">
                  {language === 'bn' ? 'ভূমিকার ধরণ বা ক্যাটাগরি ট্যাগ' : 'Role Category Tag'}
                </Label>
                <Input
                  value={customRoleCategory}
                  onChange={(e) => setCustomRoleCategory(e.target.value)}
                  placeholder={language === 'bn' ? 'যেমন: শীর্ষ নেতৃত্ব ও নীতিনির্ধারণ' : 'e.g. Supreme Executive Leadership'}
                  className="h-10 text-sm font-semibold text-[#0B6B3A]"
                />
              </div>

              {/* Responsibilities Bullet Points (one per line) */}
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-slate-800 dark:text-foreground flex items-center justify-between">
                  <span>{language === 'bn' ? 'সংগঠনের মূল দায়িত্বসমূহ (প্রতি লাইনে একটি করে বুলেট পয়েন্ট)' : 'Key Responsibilities (one per line)'}</span>
                  <span className="text-xs font-normal text-muted-foreground">{language === 'bn' ? 'Enter চাপুন নতুন লাইনের জন্য' : 'Press Enter for new point'}</span>
                </Label>
                <Textarea
                  value={customResponsibilitiesText}
                  onChange={(e) => setCustomResponsibilitiesText(e.target.value)}
                  rows={4}
                  placeholder={
                    language === 'bn'
                      ? 'সংগঠনের প্রধান অভিভাবক ও সকল কার্যনির্বাহী সিদ্ধান্তের চূড়ান্ত অনুমোদনকারী।\nপরিষদের সাধারণ ও জরুরি সভায় সভাপতিত্ব করা এবং দিকনির্দেশনা প্রদান।\nসংগঠনের গঠনতন্ত্র, আদর্শ এবং দীর্ঘমেয়াদী জনকল্যাণমূলক পরিকল্পনা তদারকি।'
                      : 'Presides over executive meetings.\nEnsures compliance with organizational constitution.\nDirects humanitarian initiatives.'
                  }
                  className="text-sm font-medium leading-relaxed"
                />
                <p className="text-xs text-muted-foreground">
                  {language === 'bn'
                    ? 'ওয়েবসাইটে দর্শনার্থীরা যখন এই সদস্যের নামের পাশের (i) বাটনে ক্লিক করবেন, তখন এই বুলেট পয়েন্টগুলো হুবহু প্রদর্শিত হবে।'
                    : 'These bullet points will appear verbatim when users click the (i) button next to this member.'}
                </p>
              </div>

              {/* Member Bio / About Text (Optional) */}
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-slate-800 dark:text-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{language === 'bn' ? 'সদস্যের সংক্ষিপ্ত পরিচিতি ও বার্তা (ঐচ্ছিক)' : 'Member Short Bio / Message (Optional)'}</span>
                </Label>
                <Textarea
                  value={customAboutText}
                  onChange={(e) => setCustomAboutText(e.target.value)}
                  rows={2}
                  placeholder={
                    language === 'bn'
                      ? 'সময়ের বাতিঘরের প্রতিষ্ঠাতা সদস্য ও একজন নিবেদিতপ্রাণ সমাজকর্মী...'
                      : 'Founding member and humanitarian volunteer...'
                  }
                  className="text-sm font-medium leading-relaxed"
                />
              </div>
            </div>

            {/* 5. Direct Photo Upload Section with Circular Crop Face-Adjustment Tool */}
            <div className="bg-emerald-50/40 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B6B3A] flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  {language === 'bn' ? 'পোর্ট্রেট ছবি আপলোড ও ক্রপ ফ্রেম' : 'Photo Upload & Circular Crop'}
                </h4>
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded-full">
                  {language === 'bn' ? 'গোলাকার ফ্রেমে মাথা কাটা বন্ধ' : 'Face-centering Protection'}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative group">
                    <Avatar className="w-20 h-20 border-2 border-emerald-500 shadow-sm">
                      <AvatarImage
                        src={imagePreview}
                        alt="Preview"
                        className="object-cover"
                        style={{ objectPosition: 'center 20%' }}
                      />
                      <AvatarFallback>{formData.name_bn.charAt(0) || 'K'}</AvatarFallback>
                    </Avatar>

                    {/* Re-Crop Button on Hover or Mobile */}
                    <button
                      type="button"
                      onClick={() => handleOpenCrop(imagePreview)}
                      title={language === 'bn' ? 'ছবি পুনরায় ক্রপ / মুখমণ্ডল কেন্দ্রিক করুন' : 'Recrop / Center Face'}
                      className="absolute inset-0 bg-black/45 rounded-full text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Crop className="w-5 h-5 text-amber-300" />
                      <span className="text-[9px] font-bold mt-0.5">{language === 'bn' ? 'ক্রপ' : 'Crop'}</span>
                    </button>

                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full shadow"
                      onClick={() => {
                        setSelectedImage(null);
                        setCroppedBlob(null);
                        setImagePreview(null);
                        setFormData({ ...formData, photo_url: '' });
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-muted border border-dashed border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-muted-foreground">
                    <Upload className="w-7 h-7 text-emerald-600/70" />
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="committee-photo-upload"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2 border-emerald-300 hover:bg-emerald-50 text-emerald-800 dark:text-emerald-300 font-semibold"
                    >
                      <Upload className="w-4 h-4" />
                      {language === 'bn' ? 'ডিভাইস থেকে ছবি বেছে নিন' : 'Choose Photo'}
                    </Button>

                    {imagePreview && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenCrop(imagePreview)}
                        className="gap-1.5 bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 font-semibold text-xs"
                      >
                        <Crop className="w-3.5 h-3.5 text-amber-700" />
                        {language === 'bn' ? 'ছবি ও মুখ ক্রপ সমন্বয়' : 'Crop / Center Face'}
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {language === 'bn'
                      ? 'ছবি নির্বাচন করার সাথে সাথে ক্রপ উইন্ডো খুলবে, যেখানে জুম ও ড্র্যাগ করে মুখমণ্ডল ঠিক মাঝে বসানো যায়।'
                      : 'Crop modal opens automatically to let you zoom and frame the face inside the circular area.'}
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
                    ? 'আপডেট সংরক্ষণ করুন'
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
          Logo / Photo Crop Modal for Face Centering & Cut-Off Prevention
      ========================================================================= */}
      <LogoCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageSrc={cropImageSrc}
        onCropSave={handleCropSave}
        title={language === 'bn' ? 'কমিটি সদস্যের ছবি ক্রপ ও মুখমণ্ডল সমন্বয়' : 'Crop Member Portrait Photo'}
        subtitle={
          language === 'bn'
            ? 'ছবিটি ড্র্যাগ এবং জুম করে বৃত্তের ভেতরে মুখমণ্ডল সুন্দরভাবে সাজান যাতে মাথা বা কপাল কেটে না যায়।'
            : 'Position and zoom the photo inside the circular frame so the head and forehead are never cut off.'
        }
        defaultCropShape="round"
        defaultAspect={1}
      />

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
                  <Avatar className="w-24 h-24 border-4 border-background shadow-lg rounded-full">
                    <AvatarImage
                      src={viewingMember.photo_url || undefined}
                      alt={viewingMember.name_bn}
                      className="object-cover"
                      style={{ objectPosition: 'center 20%' }}
                    />
                    <AvatarFallback className="bg-emerald-100 text-[#0B6B3A] text-2xl font-bold rounded-full">
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
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
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
