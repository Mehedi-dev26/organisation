import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { bangladeshGeoData } from '@/data/bangladeshGeoData';
import { getDonationEligibility } from '@/lib/bloodUtils';
import {
  Droplet,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Phone,
  MapPin,
  Calendar,
  Users,
  Clock,
  ShieldCheck,
  RefreshCw,
  PhoneCall,
  Eye,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface BloodDonorAdmin {
  id: string;
  full_name: string;
  phone: string;
  blood_group: string;
  last_donated: string | null;
  division: string | null;
  district: string | null;
  upazila: string | null;
  address: string | null;
  is_public_details: boolean;
  is_member: boolean;
  member_id: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const BloodDonorsManagement: React.FC = () => {
  const { language } = useLanguage();

  const [donors, setDonors] = useState<BloodDonorAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [donorToEdit, setDonorToEdit] = useState<BloodDonorAdmin | null>(null);
  const [donorToDelete, setDonorToDelete] = useState<BloodDonorAdmin | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    blood_group: 'A+',
    last_donated: '',
    division: 'রাজশাহী',
    district: 'নওগাঁ',
    upazila: 'নওগাঁ সদর',
    address: '',
    is_public_details: true,
    is_member: false,
    member_id: '',
    status: 'approved',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);

  // Fetch donors
  const fetchDonors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blood_donors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching donors:', error);
        toast.error('রক্তদাতাদের তথ্য লোড করতে সমস্যা হয়েছে');
      } else if (data) {
        setDonors(data as BloodDonorAdmin[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  // Cascading options for Form
  const formDistricts = useMemo(() => {
    if (!formData.division) return [];
    const div = bangladeshGeoData.find((d) => d.name === formData.division);
    return div ? div.districts : [];
  }, [formData.division]);

  const formUpazilas = useMemo(() => {
    if (!formData.district) return [];
    const dist = formDistricts.find((d) => d.name === formData.district);
    return dist ? dist.upazilas : [];
  }, [formDistricts, formData.district]);

  // Filtered Donors
  const filteredDonors = useMemo(() => {
    return donors.filter((d) => {
      if (selectedGroup && d.blood_group !== selectedGroup) return false;
      if (selectedStatus !== 'all' && d.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = d.full_name?.toLowerCase().includes(q);
        const matchesPhone = d.phone?.toLowerCase().includes(q);
        const matchesId = d.member_id?.toLowerCase().includes(q);
        const matchesLoc = `${d.address || ''} ${d.upazila || ''} ${d.district || ''}`
          .toLowerCase()
          .includes(q);
        if (!matchesName && !matchesPhone && !matchesId && !matchesLoc) return false;
      }
      return true;
    });
  }, [donors, selectedGroup, selectedStatus, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = donors.length;
    let ready = 0;
    let resting = 0;
    let members = 0;

    donors.forEach((d) => {
      if (d.is_member) members++;
      const elig = getDonationEligibility(d.last_donated);
      if (elig.isReady) {
        ready++;
      } else {
        resting++;
      }
    });

    return { total, ready, resting, members };
  }, [donors]);

  // Open Edit Modal
  const handleEdit = (donor: BloodDonorAdmin) => {
    setDonorToEdit(donor);
    setFormData({
      full_name: donor.full_name,
      phone: donor.phone,
      blood_group: donor.blood_group,
      last_donated: donor.last_donated || '',
      division: donor.division || 'রাজশাহী',
      district: donor.district || 'নওগাঁ',
      upazila: donor.upazila || '',
      address: donor.address || '',
      is_public_details: donor.is_public_details,
      is_member: donor.is_member,
      member_id: donor.member_id || '',
      status: donor.status || 'approved',
      notes: donor.notes || '',
    });
    setIsEditOpen(true);
  };

  // Submit Add
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.phone.trim()) {
      toast.error('নাম এবং মোবাইল নম্বর বাধ্যতামূলক');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('blood_donors').insert({
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        blood_group: formData.blood_group,
        last_donated: formData.last_donated || null,
        division: formData.division || null,
        district: formData.district || null,
        upazila: formData.upazila || null,
        address: formData.address?.trim() || null,
        is_public_details: formData.is_public_details,
        is_member: formData.is_member,
        member_id: formData.member_id?.trim() || null,
        status: formData.status,
        notes: formData.notes?.trim() || null,
      });

      if (error) {
        toast.error('যোগ করতে সমস্যা হয়েছে: ' + error.message);
      } else {
        toast.success('রক্তদাতা সফলভাবে যুক্ত করা হয়েছে');
        setIsAddOpen(false);
        fetchDonors();
      }
    } catch (err: any) {
      toast.error('ত্রুটি: ' + err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorToEdit) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('blood_donors')
        .update({
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          blood_group: formData.blood_group,
          last_donated: formData.last_donated || null,
          division: formData.division || null,
          district: formData.district || null,
          upazila: formData.upazila || null,
          address: formData.address?.trim() || null,
          is_public_details: formData.is_public_details,
          is_member: formData.is_member,
          member_id: formData.member_id?.trim() || null,
          status: formData.status,
          notes: formData.notes?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', donorToEdit.id);

      if (error) {
        toast.error('আপডেট ব্যর্থ হয়েছে: ' + error.message);
      } else {
        toast.success('রক্তদাতার তথ্য সফলভাবে আপডেট হয়েছে');
        setIsEditOpen(false);
        fetchDonors();
      }
    } catch (err: any) {
      toast.error('ত্রুটি: ' + err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Status Toggle
  const toggleDonorStatus = async (donor: BloodDonorAdmin) => {
    const newStatus = donor.status === 'approved' ? 'inactive' : 'approved';
    try {
      const { error } = await supabase
        .from('blood_donors')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', donor.id);

      if (error) {
        toast.error('স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে');
      } else {
        toast.success(
          newStatus === 'approved'
            ? 'রক্তদাতা অনুমোদিত হয়েছে'
            : 'রক্তদাতা নিষ্ক্রিয় করা হয়েছে'
        );
        fetchDonors();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Donor
  const handleDelete = async () => {
    if (!donorToDelete) return;
    try {
      const { error } = await supabase
        .from('blood_donors')
        .delete()
        .eq('id', donorToDelete.id);

      if (error) {
        toast.error('মুছতে সমস্যা হয়েছে: ' + error.message);
      } else {
        toast.success('রক্তদাতা তালিকা থেকে মুছে ফেলা হয়েছে');
        setDonorToDelete(null);
        fetchDonors();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Droplet className="w-6 h-6 text-red-600 fill-red-600" />
            {language === 'bn' ? 'জরুরি রক্তদাতা ব্যবস্থাপনা' : 'Blood Donors Management'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {language === 'bn'
              ? 'স্বেচ্ছাসেবী রক্তদাতাদের ডাটাবেজ, স্ট্যাটাস ও ৩ মাসের রক্তদান চক্র নিয়ন্ত্রণ করুন'
              : 'Manage voluntary blood donor directory, 3-month eligibility cycle & contact info.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDonors}
            className="gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            {language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setFormData({
                full_name: '',
                phone: '',
                blood_group: 'A+',
                last_donated: '',
                division: 'রাজশাহী',
                district: 'নওগাঁ',
                upazila: 'নওগাঁ সদর',
                address: '',
                is_public_details: true,
                is_member: false,
                member_id: '',
                status: 'approved',
                notes: '',
              });
              setIsAddOpen(true);
            }}
            className="bg-red-600 hover:bg-red-700 text-white gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {language === 'bn' ? 'নতুন রক্তদাতা যুক্ত করুন' : 'Add Blood Donor'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600 shrink-0">
            <Droplet className="w-6 h-6 fill-red-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              {language === 'bn' ? 'মোট রক্তদাতা' : 'Total Donors'}
            </p>
            <h3 className="text-2xl font-bold text-foreground">{stats.total}</h3>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              {language === 'bn' ? 'রক্তদানে প্রস্তুত' : 'Ready to Donate'}
            </p>
            <h3 className="text-2xl font-bold text-emerald-600">{stats.ready}</h3>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              {language === 'bn' ? 'বিশ্রামে আছেন' : 'Resting (Cooldown)'}
            </p>
            <h3 className="text-2xl font-bold text-amber-600">{stats.resting}</h3>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              {language === 'bn' ? 'সদস্য রক্তদাতা' : 'Member Donors'}
            </p>
            <h3 className="text-2xl font-bold text-blue-600">{stats.members}</h3>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'bn'
                ? 'নাম, মোবাইল, এলাকা বা মেম্বার আইডি খুঁজুন...'
                : 'Search name, phone, area or ID...'
            }
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Group Filter */}
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="h-9 px-3 rounded-lg border bg-background text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-red-500"
        >
          <option value="">{language === 'bn' ? 'সকল রক্তের গ্রুপ' : 'All Blood Groups'}</option>
          {BLOOD_GROUPS.map((grp) => (
            <option key={grp} value={grp}>
              {grp}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="h-9 px-3 rounded-lg border bg-background text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-red-500"
        >
          <option value="all">{language === 'bn' ? 'সকল স্ট্যাটাস' : 'All Statuses'}</option>
          <option value="approved">{language === 'bn' ? 'অনুমোদিত' : 'Approved'}</option>
          <option value="pending">{language === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}</option>
          <option value="inactive">{language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'}</option>
        </select>

        {(searchQuery || selectedGroup || selectedStatus !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedGroup('');
              setSelectedStatus('all');
            }}
            className="text-xs text-muted-foreground h-9"
          >
            {language === 'bn' ? 'রিসেট' : 'Reset'}
          </Button>
        )}
      </div>

      {/* Table Card */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground font-semibold border-b">
              <tr>
                <th className="px-4 py-3 text-center w-12">#</th>
                <th className="px-4 py-3">{language === 'bn' ? 'রক্তদাতার নাম' : 'Name'}</th>
                <th className="px-4 py-3 text-center">{language === 'bn' ? 'গ্রুপ' : 'Group'}</th>
                <th className="px-4 py-3">{language === 'bn' ? 'মোবাইল নম্বর' : 'Phone'}</th>
                <th className="px-4 py-3">{language === 'bn' ? 'ঠিকানা' : 'Address'}</th>
                <th className="px-4 py-3">{language === 'bn' ? 'সর্বশেষ রক্তদান' : 'Last Donation'}</th>
                <th className="px-4 py-3 text-center">{language === 'bn' ? '৩ মাসের স্ট্যাটাস' : 'Eligibility'}</th>
                <th className="px-4 py-3 text-center">{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="px-4 py-3 text-right">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <Droplet className="w-8 h-8 text-red-500 animate-bounce mx-auto mb-2" />
                    <span>{language === 'bn' ? 'ডাটা লোড হচ্ছে...' : 'Loading donors...'}</span>
                  </td>
                </tr>
              ) : filteredDonors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <Droplet className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p>{language === 'bn' ? 'কোনো রক্তদাতা পাওয়া যায়নি' : 'No donors found'}</p>
                  </td>
                </tr>
              ) : (
                filteredDonors.map((donor, idx) => {
                  const elig = getDonationEligibility(donor.last_donated);
                  return (
                    <tr key={donor.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground font-mono">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-foreground">{donor.full_name}</div>
                        {donor.member_id && (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5">
                            ID: {donor.member_id}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center bg-red-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-md shadow-sm">
                          {donor.blood_group}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        <a
                          href={`tel:${donor.phone}`}
                          className="text-emerald-600 hover:underline font-semibold flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          {donor.phone}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                        <span title={`${donor.address || ''}, ${donor.upazila || ''}, ${donor.district || ''}`}>
                          {donor.upazila ? `${donor.upazila}, ` : ''}
                          {donor.district || 'নওগাঁ'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {donor.last_donated ? donor.last_donated : 'তথ্য নেই'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {elig.isReady ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-bold px-2.5 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            {elig.labelBn}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[11px] font-bold px-2.5 py-1 rounded-full">
                            <Clock className="w-3 h-3 text-amber-600" />
                            {elig.labelBn}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleDonorStatus(donor)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-md transition-colors ${
                            donor.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {donor.status === 'approved' ? 'অনুমোদিত' : 'নিষ্ক্রিয়'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(donor)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="সম্পাদনা"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDonorToDelete(donor)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="মুছুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Donor Dialog */}
      <Dialog
        open={isAddOpen || isEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setIsEditOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Droplet className="w-5 h-5 text-red-600 fill-red-600" />
              {isEditOpen
                ? language === 'bn'
                  ? 'রক্তদাতার তথ্য সম্পাদনা'
                  : 'Edit Blood Donor'
                : language === 'bn'
                ? 'নতুন রক্তদাতা যোগ করুন'
                : 'Add Blood Donor'}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={isEditOpen ? handleEditSubmit : handleAddSubmit}
            className="space-y-4 py-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">
                  {language === 'bn' ? 'পূর্ণ নাম' : 'Full Name'} *
                </Label>
                <Input
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="মো: সোহেল রানা"
                  className="mt-1 h-9 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-bold">
                  {language === 'bn' ? 'মোবাইল নম্বর' : 'Phone'} *
                </Label>
                <Input
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="017XXXXXXXX"
                  className="mt-1 h-9 text-xs font-mono"
                />
              </div>

              <div>
                <Label className="text-xs font-bold">
                  {language === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'} *
                </Label>
                <select
                  value={formData.blood_group}
                  onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                  className="mt-1 w-full h-9 px-2.5 rounded-md border bg-background text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  {BLOOD_GROUPS.map((grp) => (
                    <option key={grp} value={grp}>
                      {grp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-bold">
                  {language === 'bn' ? 'সর্বশেষ রক্তদানের তারিখ' : 'Last Donation Date'}
                </Label>
                <Input
                  type="date"
                  value={formData.last_donated}
                  onChange={(e) => setFormData({ ...formData, last_donated: e.target.value })}
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>

            {/* Address Cascading */}
            <div className="p-3 bg-muted/40 border rounded-lg space-y-2">
              <Label className="text-xs font-bold text-red-600 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {language === 'bn' ? 'ঠিকানা ও অবস্থান' : 'Address Details'}
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">বিভাগ</Label>
                  <select
                    value={formData.division}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        division: e.target.value,
                        district: '',
                        upazila: '',
                      })
                    }
                    className="mt-0.5 w-full h-8 px-2 rounded border bg-background text-xs"
                  >
                    {bangladeshGeoData.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">জেলা</Label>
                  <select
                    value={formData.district}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        district: e.target.value,
                        upazila: '',
                      })
                    }
                    className="mt-0.5 w-full h-8 px-2 rounded border bg-background text-xs"
                  >
                    {formDistricts.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">উপজেলা</Label>
                  <select
                    value={formData.upazila}
                    onChange={(e) => setFormData({ ...formData, upazila: e.target.value })}
                    className="mt-0.5 w-full h-8 px-2 rounded border bg-background text-xs"
                  >
                    <option value="">নির্বাচন করুন</option>
                    {formUpazilas.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="গ্রাম/মহল্লা, রোড, ইত্যাদি..."
                className="h-8 text-xs mt-1"
              />
            </div>

            {/* Member Link */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex items-center justify-between border p-2.5 rounded-lg">
                <Label htmlFor="admin-is-member" className="text-xs font-semibold cursor-pointer">
                  সংগঠনের সদস্য?
                </Label>
                <Switch
                  id="admin-is-member"
                  checked={formData.is_member}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_member: checked })}
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">সদস্য আইডি (ঐচ্ছিক)</Label>
                <Input
                  value={formData.member_id}
                  disabled={!formData.is_member}
                  onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                  placeholder="SB26101301"
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>

            {/* Public details & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between border p-2.5 rounded-lg">
                <Label htmlFor="admin-is-public" className="text-xs font-semibold cursor-pointer">
                  পাবলিক নম্বর উন্মুক্ত?
                </Label>
                <Switch
                  id="admin-is-public"
                  checked={formData.is_public_details}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_public_details: checked })
                  }
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">স্ট্যাটাস</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="mt-1 w-full h-9 px-2.5 rounded-md border bg-background text-xs font-semibold"
                >
                  <option value="approved">অনুমোদিত (Approved)</option>
                  <option value="pending">অপেক্ষমাণ (Pending)</option>
                  <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">মন্তব্য বা নোট (ঐচ্ছিক)</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="প্রয়োজনীয় কোনো তথ্য..."
                className="mt-1 h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAddOpen(false);
                  setIsEditOpen(false);
                }}
              >
                বাতিল
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {submitting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!donorToDelete}
        onOpenChange={(open) => !open && setDonorToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
            <AlertDialogDescription>
              রক্তদাতা <strong>{donorToDelete?.full_name}</strong>-কে তালিকা থেকে স্থায়ীভাবে মুছে
              ফেলা হবে। এই কাজটি পুনরায় ফিরিয়ে আনা সম্ভব নয়।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              মুছে ফেলুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BloodDonorsManagement;
