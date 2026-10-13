import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { bangladeshGeoData } from '@/data/bangladeshGeoData';
import {
  Droplet,
  Heart,
  Search,
  MapPin,
  Phone,
  PhoneCall,
  Calendar,
  CheckCircle2,
  Clock,
  Hourglass,
  UserCheck,
  PlusCircle,
  Filter,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Building,
  HelpCircle,
  X,
  MessageCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

import { getDonationEligibility, formatBengaliDate } from '@/lib/bloodUtils';

// Hand holding blood droplet SVG icon (Exact design requested from reference site)
const HandHoldingDropletIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg
    viewBox="0 0 576 512"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M320.3 358.3c15.3-7.7 26.6-21.7 30.6-38.3l10.1-41.9c5.6-23.2-8.6-46.7-31.8-52.3s-46.7 8.6-52.3 31.8l-1.9 7.8c-12.7-7-27.2-11.4-42.8-12.4v-4.1c0-44.2-35.8-80-80-80s-80 35.8-80 80v4.1c-30.8 2-57.8 17.5-73.4 41.5-13.6 20.9-9.1 48.7 10.6 64.3 19.6 15.6 47.9 12.3 63.5-7.3 5.4-8.3 14.7-13.6 24.7-14.3v60.9c0 4.4 3.6 8 8 8h16c4.4 0 8-3.6 8-8v-60.9c10 .7 19.3 6 24.7 14.3 11 16.9 31.8 24.5 50.6 18.5zM232 208c0-30.9 25.1-56 56-56s56 25.1 56 56c0 14.8-5.8 28.3-15.3 38.2-10.4 10.8-24.8 17.8-40.7 17.8s-30.3-7-40.7-17.8c-9.5-9.9-15.3-23.4-15.3-38.2zM576 240c0-26.5-21.5-48-48-48h-41.6c-17 0-33.3 6.7-45.3 18.7l-47.5 47.5-62.1-15.5c-4.4-1.1-9-1.7-13.5-1.7h-72.3c27.1 14.7 46.7 41.2 52.3 72.8l3.1 17.2h81.4l58.9 44.2c6.2 4.7 13.8 7.2 21.6 7.2h67c26.5 0 48-21.5 48-48 0-7.3-1.6-14.2-4.6-20.4 15.5-7.8 26.6-23.7 26.6-42.3 0-6.1-1.2-11.9-3.3-17.3 12.8-7.9 21.3-22.1 21.3-38.3zM16 320c-8.8 0-16 7.2-16 16v96c0 8.8 7.2 16 16 16h64c8.8 0 16-7.2 16-16v-96c0-8.8-7.2-16-16-16H16z" />
  </svg>
);

export interface BloodDonor {
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


const BloodDonors: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Donor list & loading state
  const [donors, setDonors] = useState<BloodDonor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedUpazila, setSelectedUpazila] = useState<string>('');

  // Modals state
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration Form State
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    blood_group: '',
    last_donated: '',
    division: 'রাজশাহী',
    district: 'নওগাঁ',
    upazila: '',
    address: '',
    is_public_details: true,
  });

  // Fetch donors from Supabase
  const fetchDonors = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('blood_donors')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching donors:', error);
        toast.error('রক্তদাতাদের তালিকা লোড করা যায়নি');
      } else if (data) {
        setDonors(data as BloodDonor[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  // Cascading options for Registration Form
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

  // Cascading options for Filter Bar
  const filterDistricts = useMemo(() => {
    if (!selectedDivision) return [];
    const div = bangladeshGeoData.find((d) => d.name === selectedDivision);
    return div ? div.districts : [];
  }, [selectedDivision]);

  const filterUpazilas = useMemo(() => {
    if (!selectedDistrict) return [];
    const dist = filterDistricts.find((d) => d.name === selectedDistrict);
    return dist ? dist.upazilas : [];
  }, [filterDistricts, selectedDistrict]);

  // Filtered Donors
  const filteredDonors = useMemo(() => {
    return donors.filter((d) => {
      // Group filter
      if (selectedGroup && d.blood_group !== selectedGroup) return false;

      // Division filter
      if (selectedDivision && d.division !== selectedDivision) return false;

      // District filter
      if (selectedDistrict && d.district !== selectedDistrict) return false;

      // Upazila filter
      if (selectedUpazila && d.upazila !== selectedUpazila) return false;

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = d.full_name?.toLowerCase().includes(q);
        const phoneMatch = d.phone?.toLowerCase().includes(q);
        const idMatch = d.member_id?.toLowerCase().includes(q);
        const addrMatch = (
          (d.address || '') +
          ' ' +
          (d.upazila || '') +
          ' ' +
          (d.district || '')
        )
          .toLowerCase()
          .includes(q);

        if (!nameMatch && !phoneMatch && !idMatch && !addrMatch) return false;
      }

      return true;
    });
  }, [
    donors,
    selectedGroup,
    selectedDivision,
    selectedDistrict,
    selectedUpazila,
    searchQuery,
  ]);

  // Handle Blood Donor Form Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      toast.error('দয়া করে আপনার পূর্ণ নাম লিখুন');
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 11) {
      toast.error('দয়া করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন');
      return;
    }
    if (!formData.blood_group) {
      toast.error('রক্তের গ্রুপ নির্বাচন করুন');
      return;
    }

    setIsSubmitting(true);
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
        is_member: false,
        member_id: null,
        status: 'approved',
      });

      if (error) {
        console.error('Registration error:', error);
        toast.error('সংরক্ষণ ব্যর্থ হয়েছে: ' + error.message);
      } else {
        toast.success(
          'ধন্যবাদ! আপনি সফলভাবে জরুরি রক্তদাতা হিসেবে তালিকাভুক্ত হয়েছেন।'
        );
        setIsRegisterOpen(false);
        // Reset form
        setFormData({
          full_name: '',
          phone: '',
          blood_group: '',
          last_donated: '',
          division: 'রাজশাহী',
          district: 'নওগাঁ',
          upazila: '',
          address: '',
          is_public_details: true,
        });
        // Re-fetch
        fetchDonors();
      }
    } catch (err: any) {
      console.error(err);
      toast.error('ত্রুটি ঘটেছে: ' + err?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedGroup('');
    setSelectedDivision('');
    setSelectedDistrict('');
    setSelectedUpazila('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      {/* Page Header Banner (Exact style & gradient from reference) */}
      <section
        className="text-white py-10 md:py-14 relative overflow-hidden shadow-md"
        style={{
          background: 'linear-gradient(135deg, #8a0303 0%, #c0392b 100%)',
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 max-w-4xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-md mb-3 shadow-inner border border-white/20">
            <HandHoldingDropletIcon className="w-9 h-9 text-amber-300" />
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-2">
            {language === 'bn' ? 'জরুরি রক্তদাতা ডাটাবেস' : 'Emergency Blood Donor Database'}
          </h1>
          <p className="text-white/90 text-sm md:text-base mb-6 max-w-2xl mx-auto leading-relaxed font-medium">
            {language === 'bn'
              ? 'মুমূর্ষু রোগীর প্রয়োজনে স্বেচ্ছাসেবী রক্তদাতাদের সরাসরি তালিকা ও সার্বক্ষণিক সহায়তা'
              : 'Direct verified directory of voluntary blood donors & 24/7 emergency support for patients.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => setIsPromptOpen(true)}
              className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-6 py-5 rounded-full shadow-lg transition-transform hover:scale-105"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              {language === 'bn' ? 'রক্তদাতা হিসেবে নাম লিখান' : 'Register as Blood Donor'}
            </Button>
            <a
              href="tel:01916314315"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold px-5 py-2.5 rounded-full backdrop-blur-sm border border-white/20 text-sm transition-all"
            >
              <PhoneCall className="w-4 h-4 text-amber-300" />
              <span>{language === 'bn' ? 'জরুরি হেল্পলাইন: 01916314315' : 'Helpline: 01916314315'}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 max-w-7xl">
        {/* Search & Filter Card (Top border red accent matching reference) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-red-600 p-4 md:p-6 mb-8 transition-all">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Search Input */}
            <div className="lg:col-span-5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                <Search className="w-3.5 h-3.5 inline mr-1 text-red-600" />
                {language === 'bn' ? 'অনুসন্ধান' : 'Search'}
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    language === 'bn'
                      ? 'নাম, মোবাইল নম্বর, গ্রাম/মহল্লা বা আইডি...'
                      : 'Name, phone, village or ID...'
                  }
                  className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-red-500 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Blood Groups Selector */}
            <div className="lg:col-span-7">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                <Droplet className="w-3.5 h-3.5 inline mr-1 text-red-600 fill-red-600" />
                {language === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'}
              </label>
              <div className="flex flex-wrap gap-1.5 items-center">
                <button
                  type="button"
                  onClick={() => setSelectedGroup('')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedGroup === ''
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {language === 'bn' ? 'সকল' : 'All'}
                </button>
                {BLOOD_GROUPS.map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setSelectedGroup(grp === selectedGroup ? '' : grp)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      selectedGroup === grp
                        ? 'bg-red-600 text-white border-red-600 shadow-sm'
                        : 'border-red-200 text-red-600 bg-red-50/50 hover:bg-red-100/70'
                    }`}
                  >
                    {grp}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location Cascading Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
            {/* Division */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                <MapPin className="w-3.5 h-3.5 inline mr-1 text-red-500" />
                {language === 'bn' ? 'বিভাগ ফিল্টার' : 'Division'}
              </label>
              <select
                value={selectedDivision}
                onChange={(e) => {
                  setSelectedDivision(e.target.value);
                  setSelectedDistrict('');
                  setSelectedUpazila('');
                }}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-red-500"
              >
                <option value="">{language === 'bn' ? 'সকল বিভাগ' : 'All Divisions'}</option>
                {bangladeshGeoData.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                <Building className="w-3.5 h-3.5 inline mr-1 text-red-500" />
                {language === 'bn' ? 'জেলা ফিল্টার' : 'District'}
              </label>
              <select
                value={selectedDistrict}
                disabled={!selectedDivision}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setSelectedUpazila('');
                }}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-red-500 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">{language === 'bn' ? 'সকল জেলা' : 'All Districts'}</option>
                {filterDistricts.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Upazila */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                <MapPin className="w-3.5 h-3.5 inline mr-1 text-red-500" />
                {language === 'bn' ? 'থানা / উপজেলা' : 'Thana / Upazila'}
              </label>
              <select
                value={selectedUpazila}
                disabled={!selectedDistrict}
                onChange={(e) => setSelectedUpazila(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-red-500 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">{language === 'bn' ? 'সকল উপজেলা' : 'All Upazilas'}</option>
                {filterUpazilas.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="w-full h-10 text-xs font-medium border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                {language === 'bn' ? 'ফিল্টার রিসেট' : 'Reset Filters'}
              </Button>
            </div>
          </div>
        </div>

        {/* Donors Card Header & Table Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Card Header (Dark matching reference) */}
          <div className="bg-slate-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-red-500 fill-red-500" />
              <h2 className="text-base md:text-lg font-bold">
                {language === 'bn' ? 'রক্তদাতাদের তালিকা' : 'Blood Donors Directory'}
              </h2>
              <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full ml-1">
                {filteredDonors.length} {language === 'bn' ? 'জন' : 'Donors'}
              </span>
            </div>

            <Button
              onClick={() => setIsPromptOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg px-4 py-2 shadow-sm"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              {language === 'bn' ? 'নতুন রক্তদাতা যুক্ত হন' : 'Join as Donor'}
            </Button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-800">
              <thead className="bg-slate-100 text-xs uppercase text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 w-12 text-center font-bold">#</th>
                  <th className="px-4 py-3.5 font-bold">
                    {language === 'bn' ? 'রক্তদাতার নাম ও পরিচিতি' : 'Donor Name & Info'}
                  </th>
                  <th className="px-4 py-3.5 text-center font-bold">
                    {language === 'bn' ? 'রক্তের গ্রুপ' : 'Group'}
                  </th>
                  <th className="px-4 py-3.5 font-bold">
                    {language === 'bn' ? 'মোবাইল নম্বর' : 'Phone'}
                  </th>
                  <th className="px-4 py-3.5 font-bold">
                    {language === 'bn' ? 'ঠিকানা' : 'Address'}
                  </th>
                  <th className="px-4 py-3.5 font-bold">
                    {language === 'bn' ? 'সর্বশেষ রক্তদান' : 'Last Donation'}
                  </th>
                  <th className="px-4 py-3.5 text-center font-bold">
                    {language === 'bn' ? 'স্ট্যাটাস (৩ মাস)' : 'Status (3 Months)'}
                  </th>
                  <th className="px-4 py-3.5 text-right font-bold">
                    {language === 'bn' ? 'যোগাযোগ' : 'Action'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Droplet className="w-8 h-8 text-red-500 animate-bounce" />
                        <span className="font-bold text-slate-600">{language === 'bn' ? 'ডাটা লোড হচ্ছে...' : 'Loading donors...'}</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredDonors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-600">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Droplet className="w-10 h-10 text-slate-300" />
                        <p className="font-bold text-slate-700">
                          {language === 'bn'
                            ? 'কোনো রক্তদাতা পাওয়া যায়নি'
                            : 'No blood donors found for this criteria'}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetFilters}
                          className="mt-2 text-xs font-bold"
                        >
                          {language === 'bn' ? 'সকল রক্তদাতা দেখুন' : 'View all donors'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDonors.map((donor, idx) => {
                    const eligibility = getDonationEligibility(donor.last_donated);
                    return (
                      <tr
                        key={donor.id}
                        className="hover:bg-red-50/20 transition-colors group"
                      >
                        <td className="px-4 py-4 text-center font-bold text-slate-500 text-xs">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-extrabold text-slate-900 group-hover:text-red-700 transition-colors text-sm">
                            {donor.full_name}
                          </div>
                          {donor.member_id ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-md mt-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              {language === 'bn' ? `সদস্য আইডি: ${donor.member_id}` : `Member ID: ${donor.member_id}`}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-0.5">
                              {language === 'bn' ? 'স্বেচ্ছাসেবী রক্তদাতা' : 'Volunteer Donor'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center justify-center bg-red-600 text-white font-black text-sm px-3 py-1.5 rounded-lg shadow-sm">
                            <Droplet className="w-3.5 h-3.5 mr-1 fill-white" />
                            {donor.blood_group}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-mono font-bold">
                          {donor.is_public_details ? (
                            <a
                              href={`tel:${donor.phone}`}
                              className="text-slate-900 hover:text-emerald-700 hover:underline inline-flex items-center gap-1 font-bold"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              {donor.phone}
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs italic font-medium">
                              {language === 'bn' ? 'গোপন রাখা হয়েছে' : 'Private'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-xs font-semibold text-slate-800 flex items-start gap-1 max-w-xs">
                            <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                            <span>
                              {donor.address ? `${donor.address}, ` : ''}
                              {donor.upazila ? `${donor.upazila}, ` : ''}
                              {donor.district || 'নওগাঁ'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs font-bold text-slate-800">
                          {formatBengaliDate(donor.last_donated)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {eligibility.isReady ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold px-3 py-1.5 rounded-full shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              {language === 'bn' ? eligibility.labelBn : eligibility.labelEn}
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-1.5 rounded-full shadow-2xs"
                              title={`৩ মাস পূর্ণ হতে আর ${eligibility.remainingDays} দিন বাকি`}
                            >
                              <Hourglass className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                              {language === 'bn' ? eligibility.labelBn : eligibility.labelEn}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <a
                            href={`tel:${donor.phone}`}
                            className="inline-flex items-center gap-1.5 bg-white hover:bg-emerald-600 text-emerald-700 hover:text-white border-2 border-emerald-600 font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all shadow-xs group/call"
                          >
                            <PhoneCall className="w-3.5 h-3.5 text-emerald-600 group-hover/call:text-white transition-colors" />
                            <span>{language === 'bn' ? 'কল করুন' : 'Call'}</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center text-slate-400">
                <Droplet className="w-8 h-8 text-red-500 mx-auto animate-bounce mb-2" />
                <p className="font-bold text-slate-600">{language === 'bn' ? 'ডাটা লোড হচ্ছে...' : 'Loading donors...'}</p>
              </div>
            ) : filteredDonors.length === 0 ? (
              <div className="p-8 text-center text-slate-600">
                <p className="font-bold text-slate-700 mb-2">
                  {language === 'bn' ? 'কোনো রক্তদাতা পাওয়া যায়নি' : 'No donors found'}
                </p>
                <Button variant="outline" size="sm" onClick={resetFilters} className="font-bold">
                  {language === 'bn' ? 'সকল রক্তদাতা দেখুন' : 'View all'}
                </Button>
              </div>
            ) : (
              filteredDonors.map((donor, idx) => {
                const eligibility = getDonationEligibility(donor.last_donated);
                return (
                  <div key={donor.id} className="p-4 bg-white hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="font-extrabold text-slate-900 text-base">
                          {donor.full_name}
                        </div>
                        {donor.member_id && (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-md mt-0.5">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            {language === 'bn' ? `আইডি: ${donor.member_id}` : `ID: ${donor.member_id}`}
                          </span>
                        )}
                      </div>
                      <span className="bg-red-600 text-white font-black text-sm px-3 py-1.5 rounded-lg shadow-sm shrink-0">
                        {donor.blood_group}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-800 mb-3 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>
                          {donor.address ? `${donor.address}, ` : ''}
                          {donor.upazila ? `${donor.upazila}, ` : ''}
                          {donor.district || 'নওগাঁ'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>
                          {language === 'bn' ? 'সর্বশেষ রক্তদান: ' : 'Last Donated: '}
                          <strong className="text-slate-900 font-bold">
                            {formatBengaliDate(donor.last_donated)}
                          </strong>
                        </span>
                      </div>
                      <div className="pt-1 flex items-center justify-between">
                        <div>
                          {eligibility.isReady ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              {language === 'bn' ? eligibility.labelBn : eligibility.labelEn}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-1 rounded-full">
                              <Hourglass className="w-3.5 h-3.5 text-amber-600" />
                              {language === 'bn' ? eligibility.labelBn : eligibility.labelEn}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <a
                        href={`tel:${donor.phone}`}
                        className="text-slate-900 font-mono font-bold text-sm inline-flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        {donor.phone}
                      </a>
                      <a
                        href={`tel:${donor.phone}`}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        {language === 'bn' ? 'কল করুন' : 'Call'}
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 1. DECISION PROMPT MODAL (Exact design & choices from reference site)     */}
      {/* ========================================================================= */}
      <Dialog open={isPromptOpen} onOpenChange={setIsPromptOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-0 rounded-2xl">
          <div className="bg-red-600 text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white">
                  {language === 'bn'
                    ? 'রক্তদাতা নিবন্ধন - আপনি কি সদস্য হতে চান?'
                    : 'Blood Donor Registration - Member or Donor?'}
                </DialogTitle>
                <DialogDescription className="text-white/80 text-xs">
                  {language === 'bn'
                    ? 'সংগঠনে যুক্ত হওয়ার পথ বেছে নিন'
                    : 'Choose how you would like to join'}
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 text-center">
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {language === 'bn'
                ? 'আপনি কি আমাদের সংগঠনের সাথে যুক্ত হতে চান?'
                : 'Do you want to join our organization?'}
            </h3>
            <p className="text-slate-500 text-xs md:text-sm mb-6 max-w-lg mx-auto">
              {language === 'bn'
                ? 'আমাদের সদস্য হিসেবে যুক্ত হয়ে নিয়মিত মানবসেবামূলক কার্যক্রমে অংশ নিতে পারেন অথবা শুধুমাত্র জরুরি প্রয়োজনে রক্তদাতা হিসেবে নাম অন্তর্ভুক্ত করতে পারেন।'
                : 'Join as a permanent member to take part in all welfare activities, or simply list yourself as a voluntary blood donor for emergency patient needs.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: Full Member / Volunteer (Green) */}
              <div className="border-2 border-emerald-500 bg-[#f6fff9] p-5 rounded-xl text-center flex flex-col justify-between shadow-sm">
                <div>
                  <div className="w-14 h-14 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center mb-3 shadow-md">
                    <UserCheck className="w-7 h-7" />
                  </div>
                  <h4 className="font-extrabold text-emerald-700 text-base mb-2">
                    {language === 'bn' ? 'হ্যাঁ, সদস্য হতে চাই' : 'Yes, Become a Member'}
                  </h4>
                  <ul className="text-left text-xs text-slate-600 space-y-2 mb-5">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{language === 'bn' ? 'ইউনিক মেম্বার আইডি (যেমন: SB26082301) পাবেন' : 'Unique Member ID will be generated'}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{language === 'bn' ? 'স্বেচ্ছাসেবক ডিরেক্টরিতে ছবিসহ পূর্ণ পরিচিতি' : 'Full profile with photo in Directory'}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{language === 'bn' ? 'রক্তদাতা ডাটাবেসে স্বয়ংক্রিয়ভাবে নাম ও ৩ মাসের স্ট্যাটাস যুক্ত হবে' : 'Auto-listed in blood donor database'}</span>
                    </li>
                  </ul>
                </div>
                <Button
                  onClick={() => {
                    setIsPromptOpen(false);
                    navigate('/member-registration');
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg shadow-sm text-xs"
                >
                  <UserCheck className="w-4 h-4 mr-1.5" />
                  {language === 'bn' ? 'সদস্য হিসেবে রেজিস্ট্রেশন করুন' : 'Register as Member'}
                </Button>
              </div>

              {/* Option B: Blood Donor Only (Red) */}
              <div className="border-2 border-red-500 bg-[#fff9f9] p-5 rounded-xl text-center flex flex-col justify-between shadow-sm">
                <div>
                  <div className="w-14 h-14 rounded-full bg-red-600 text-white mx-auto flex items-center justify-center mb-3 shadow-md">
                    <Droplet className="w-7 h-7 fill-white" />
                  </div>
                  <h4 className="font-extrabold text-red-700 text-base mb-2">
                    {language === 'bn' ? 'না, শুধুমাত্র রক্তদাতা হব' : 'No, Only Blood Donor'}
                  </h4>
                  <ul className="text-left text-xs text-slate-600 space-y-2 mb-5">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{language === 'bn' ? 'দ্রুত ও সংক্ষিপ্ত তথ্য প্রদান' : 'Quick and short registration'}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{language === 'bn' ? 'জরুরি রক্তদান ডিরেক্টরিতে তাৎক্ষণিক তালিকাভুক্তি' : 'Instant listing in donor directory'}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{language === 'bn' ? '৩ মাস পূর্ণ হলে স্বয়ংক্রিয়ভাবে রক্তদানের সুযোগ' : 'Auto 3-month cycle readiness calculation'}</span>
                    </li>
                  </ul>
                </div>
                <Button
                  onClick={() => {
                    setIsPromptOpen(false);
                    setIsRegisterOpen(true);
                  }}
                  variant="outline"
                  className="w-full border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-bold py-2.5 rounded-lg shadow-sm text-xs"
                >
                  <Droplet className="w-4 h-4 mr-1.5 fill-current" />
                  {language === 'bn' ? 'রক্তদাতা ফর্ম পূরণ করুন' : 'Fill Blood Donor Form'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 2. BLOOD DONOR REGISTRATION FORM MODAL (Exact design from reference site) */}
      {/* ========================================================================= */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-0 rounded-2xl">
          <div className="bg-red-600 text-white p-5 sticky top-0 z-20 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                <Heart className="w-5 h-5 text-amber-300 fill-amber-300" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white">
                  {language === 'bn'
                    ? 'জরুরি রক্তদাতা হিসেবে নিবন্ধন করুন'
                    : 'Register as Emergency Blood Donor'}
                </DialogTitle>
                <DialogDescription className="text-white/80 text-xs">
                  {language === 'bn'
                    ? 'আপনার এক ফোঁটা রক্ত বাঁচাতে পারে একটি মুমূর্ষু জীবন'
                    : 'Your blood donation can save an innocent life'}
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleRegisterSubmit} className="p-5 md:p-6 space-y-4">
            {/* Alert banner */}
            <div className="bg-red-50 border border-red-200 text-red-900 p-3.5 rounded-xl flex items-start gap-3 text-xs leading-relaxed">
              <Droplet className="w-5 h-5 text-red-600 fill-red-600 shrink-0 mt-0.5" />
              <div>
                <strong>{language === 'bn' ? 'রক্তদান জীবন বাঁচায়:' : 'Blood Saves Lives:'}</strong>{' '}
                {language === 'bn'
                  ? 'আপনার দেওয়া তথ্য স্থানীয় মুমূর্ষু রোগীর প্রয়োজনে স্বেচ্ছায় রক্তদানে ব্যবহৃত হবে।'
                  : 'Your information will be directly used to connect emergency patients in need with verified blood donors.'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <Label className="text-xs font-bold text-slate-700">
                  {language === 'bn' ? 'আপনার পূর্ণ নাম' : 'Full Name'} <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder={language === 'bn' ? 'যেমন: মো: আবদুর রহিম' : 'e.g. Md. Abdur Rahim'}
                  className="mt-1 h-10 text-sm"
                />
              </div>

              {/* Phone */}
              <div>
                <Label className="text-xs font-bold text-slate-700">
                  {language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'} <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="017XXXXXXXX"
                  className="mt-1 h-10 text-sm font-mono"
                />
              </div>

              {/* Blood Group */}
              <div>
                <Label className="text-xs font-bold text-slate-700">
                  {language === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'} <span className="text-red-500">*</span>
                </Label>
                <select
                  required
                  value={formData.blood_group}
                  onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 font-semibold focus:outline-none focus:border-red-500"
                >
                  <option value="">{language === 'bn' ? '-- রক্তের গ্রুপ নির্বাচন করুন --' : '-- Select Blood Group --'}</option>
                  {BLOOD_GROUPS.map((grp) => (
                    <option key={grp} value={grp}>
                      {grp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Last Donation Date */}
              <div>
                <Label className="text-xs font-bold text-slate-700">
                  {language === 'bn' ? 'সর্বশেষ রক্তদানের তারিখ' : 'Last Donation Date'}{' '}
                  <span className="text-slate-400 font-normal">({language === 'bn' ? 'ঐচ্ছিক' : 'Optional'})</span>
                </Label>
                <Input
                  type="date"
                  value={formData.last_donated}
                  onChange={(e) => setFormData({ ...formData, last_donated: e.target.value })}
                  className="mt-1 h-10 text-sm"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {language === 'bn' ? '৩ মাস পূর্ণ হলে রক্তদানে সক্রিয় বা প্রস্তুত হবে।' : 'Active after 3 months.'}
                </span>
              </div>
            </div>

            {/* Address Box (Structured) */}
            <div className="bg-red-50/50 border border-red-200 p-4 rounded-xl space-y-3">
              <h5 className="text-xs font-bold text-red-700 flex items-center gap-1.5 uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-red-600" />
                {language === 'bn' ? 'ঠিকানা (Address)' : 'Address Details'}
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Division */}
                <div>
                  <Label className="text-[11px] font-semibold text-slate-600">
                    {language === 'bn' ? 'বিভাগ' : 'Division'}
                  </Label>
                  <select
                    value={formData.division}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        division: e.target.value,
                        district: '',
                        upazila: '',
                      });
                    }}
                    className="mt-1 w-full h-9 px-2.5 rounded-md border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-red-500"
                  >
                    <option value="">{language === 'bn' ? 'বিভাগ নির্বাচন' : 'Select Division'}</option>
                    {bangladeshGeoData.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div>
                  <Label className="text-[11px] font-semibold text-slate-600">
                    {language === 'bn' ? 'জেলা' : 'District'}
                  </Label>
                  <select
                    value={formData.district}
                    disabled={!formData.division}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        district: e.target.value,
                        upazila: '',
                      });
                    }}
                    className="mt-1 w-full h-9 px-2.5 rounded-md border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-red-500 disabled:bg-slate-100"
                  >
                    <option value="">{language === 'bn' ? 'জেলা নির্বাচন' : 'Select District'}</option>
                    {formDistricts.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Upazila */}
                <div>
                  <Label className="text-[11px] font-semibold text-slate-600">
                    {language === 'bn' ? 'উপজেলা / থানা' : 'Upazila'}
                  </Label>
                  <select
                    value={formData.upazila}
                    disabled={!formData.district}
                    onChange={(e) => setFormData({ ...formData, upazila: e.target.value })}
                    className="mt-1 w-full h-9 px-2.5 rounded-md border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-red-500 disabled:bg-slate-100"
                  >
                    <option value="">{language === 'bn' ? 'উপজেলা নির্বাচন' : 'Select Upazila'}</option>
                    {formUpazilas.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Detailed / Local Address */}
              <div>
                <Label className="text-[11px] font-semibold text-slate-600">
                  {language === 'bn'
                    ? 'বিস্তারিত / স্থানীয় ঠিকানা (গ্রাম, মহল্লা, রোড, ইত্যাদি)'
                    : 'Village, road, area details'}
                </Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={
                    language === 'bn'
                      ? 'যেমন: চকদেব, হাসপাতাল রোড, ওয়ার্ড নং ৩'
                      : 'e.g. Hospital road, Ward 3'
                  }
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>

            {/* Privacy Switch */}
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between gap-3">
              <div>
                <Label htmlFor="privacy-switch" className="text-xs font-bold text-slate-800 cursor-pointer block">
                  <Phone className="w-3.5 h-3.5 inline mr-1 text-red-600" />
                  {language === 'bn'
                    ? 'জরুরি প্রয়োজনে রক্তের জন্য আপনার মোবাইল নম্বর সর্বসাধারণের জন্য উন্মুক্ত রাখতে চান?'
                    : 'Keep phone number visible to public for emergency blood requests?'}
                </Label>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {language === 'bn'
                    ? 'অনুমতি দেওয়া থাকলে রক্তের প্রয়োজনে রোগীর স্বজনরা সরাসরি আপনাকে ফোন দিতে পারবেন।'
                    : 'Allows relatives of patients to contact you directly in emergencies.'}
                </span>
              </div>
              <Switch
                id="privacy-switch"
                checked={formData.is_public_details}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_public_details: checked })
                }
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRegisterOpen(false)}
                className="text-xs"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 shadow-sm"
              >
                {isSubmitting ? (
                  <span>{language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}</span>
                ) : (
                  <>
                    <Heart className="w-3.5 h-3.5 mr-1.5 fill-white" />
                    {language === 'bn' ? 'রক্তদাতা হিসেবে সংরক্ষণ করুন' : 'Save as Blood Donor'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default BloodDonors;
