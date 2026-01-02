import React, { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search, Loader2, Upload, X, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { compressImage, formatFileSize } from '@/lib/imageUtils';

interface Member {
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

const MembersManagement = () => {
  const { language } = useLanguage();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    member_id: '',
    full_name: '',
    email: '',
    phone: '',
    address: '',
    occupation: '',
    blood_group: '',
    member_type: 'general',
    status: 'pending',
    photo_url: '',
  });

  // Enable realtime subscription
  useRealtimeSubscription({ table: 'members', queryKey: ['admin-members'] });

  const { data: members, isLoading } = useQuery({
    queryKey: ['admin-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Member[];
    },
  });

  // Generate next member ID automatically
  const generateMemberId = () => {
    if (!members || members.length === 0) {
      return 'SB-0001';
    }
    
    // Find the highest member ID number
    const memberIds = members
      .map(m => m.member_id)
      .filter(id => id.startsWith('SB-'))
      .map(id => parseInt(id.replace('SB-', ''), 10))
      .filter(num => !isNaN(num));
    
    const maxId = memberIds.length > 0 ? Math.max(...memberIds) : 0;
    const nextId = maxId + 1;
    
    return `SB-${nextId.toString().padStart(4, '0')}`;
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('members').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
      toast({ title: language === 'bn' ? 'সফল!' : 'Success!', description: language === 'bn' ? 'সদস্য যোগ হয়েছে' : 'Member added' });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: language === 'bn' ? 'ত্রুটি' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('members').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
      toast({ title: language === 'bn' ? 'সফল!' : 'Success!', description: language === 'bn' ? 'সদস্য আপডেট হয়েছে' : 'Member updated' });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: language === 'bn' ? 'ত্রুটি' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
      toast({ title: language === 'bn' ? 'সফল!' : 'Success!', description: language === 'bn' ? 'সদস্য মুছে ফেলা হয়েছে' : 'Member deleted' });
    },
    onError: (error: any) => {
      toast({ title: language === 'bn' ? 'ত্রুটি' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Approve member mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('members').update({ status: 'approved' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
      toast({ title: language === 'bn' ? 'সফল!' : 'Success!', description: language === 'bn' ? 'সদস্য অনুমোদিত হয়েছে' : 'Member approved' });
    },
    onError: (error: any) => {
      toast({ title: language === 'bn' ? 'ত্রুটি' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Reject member mutation
  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('members').update({ status: 'rejected' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
      toast({ title: language === 'bn' ? 'সফল!' : 'Success!', description: language === 'bn' ? 'সদস্য প্রত্যাখ্যান হয়েছে' : 'Member rejected' });
    },
    onError: (error: any) => {
      toast({ title: language === 'bn' ? 'ত্রুটি' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      member_id: '',
      full_name: '',
      email: '',
      phone: '',
      address: '',
      occupation: '',
      blood_group: '',
      member_type: 'general',
      status: 'pending',
      photo_url: '',
    });
    setSelectedImage(null);
    setImagePreview(null);
    setEditingMember(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setFormData({
      member_id: member.member_id,
      full_name: member.full_name,
      email: member.email || '',
      phone: member.phone || '',
      address: member.address || '',
      occupation: member.occupation || '',
      blood_group: member.blood_group || '',
      member_type: member.member_type || 'general',
      status: member.status || 'pending',
      photo_url: member.photo_url || '',
    });
    setImagePreview(member.photo_url || null);
    setIsDialogOpen(true);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB before compression)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'ছবি ২MB এর বেশি হতে পারবে না' : 'Image must be less than 2MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedImage(file);
    
    // Create preview
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
      
      // Compress image
      const compressedBlob = await compressImage(selectedImage, 300, 300, 0.8);
      
      const fileName = `${memberId}-${Date.now()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('member-photos')
        .upload(fileName, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('member-photos')
        .getPublicUrl(data.path);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Upload image first if selected
    const photoUrl = await uploadImage(formData.member_id);
    const dataToSubmit = { ...formData, photo_url: photoUrl || '' };
    
    if (editingMember) {
      updateMutation.mutate({ id: editingMember.id, data: dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const filteredMembers = members?.filter(member => {
    const matchesSearch = member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.member_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'pending') return matchesSearch && member.status === 'pending';
    if (activeTab === 'approved') return matchesSearch && member.status === 'approved';
    return matchesSearch;
  });

  const pendingCount = members?.filter(m => m.status === 'pending').length || 0;
  const approvedCount = members?.filter(m => m.status === 'approved').length || 0;

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      approved: 'default',
      pending: 'secondary',
      rejected: 'destructive',
    };
    return <Badge variant={variants[status || 'pending'] || 'secondary'}>{status || 'pending'}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold">
            {language === 'bn' ? 'সদস্য ব্যবস্থাপনা' : 'Members Management'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'bn' ? 'সকল সদস্য দেখুন ও পরিচালনা করুন' : 'View and manage all members'}
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!isAdmin} onClick={() => {
              resetForm();
              // Set auto-generated member ID for new members
              setFormData(prev => ({ ...prev, member_id: generateMemberId() }));
            }}>
              <Plus className="w-4 h-4 mr-2" />
              {language === 'bn' ? 'নতুন সদস্য' : 'Add Member'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMember 
                  ? (language === 'bn' ? 'সদস্য সম্পাদনা' : 'Edit Member')
                  : (language === 'bn' ? 'নতুন সদস্য যোগ করুন' : 'Add New Member')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'সদস্য আইডি' : 'Member ID'} *</Label>
                  <Input
                    value={formData.member_id}
                    onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                    required
                    readOnly={!editingMember}
                    className={!editingMember ? 'bg-muted' : ''}
                  />
                  {!editingMember && (
                    <p className="text-xs text-muted-foreground">
                      {language === 'bn' ? 'আইডি স্বয়ংক্রিয়ভাবে তৈরি হয়েছে' : 'ID is auto-generated'}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'পুরো নাম' : 'Full Name'} *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'ইমেইল' : 'Email'}</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'ফোন' : 'Phone'}</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>{language === 'bn' ? 'ঠিকানা' : 'Address'}</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'পেশা' : 'Occupation'}</Label>
                  <Input
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'}</Label>
                  <Select value={formData.blood_group} onValueChange={(v) => setFormData({ ...formData, blood_group: v })}>
                    <SelectTrigger><SelectValue placeholder={language === 'bn' ? 'নির্বাচন করুন' : 'Select'} /></SelectTrigger>
                    <SelectContent>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                        <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'সদস্য প্রকার' : 'Member Type'}</Label>
                  <Select value={formData.member_type} onValueChange={(v) => setFormData({ ...formData, member_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">{language === 'bn' ? 'সাধারণ' : 'General'}</SelectItem>
                      <SelectItem value="lifetime">{language === 'bn' ? 'আজীবন' : 'Lifetime'}</SelectItem>
                      <SelectItem value="honorary">{language === 'bn' ? 'সম্মানসূচক' : 'Honorary'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{language === 'bn' ? 'অপেক্ষমান' : 'Pending'}</SelectItem>
                      <SelectItem value="approved">{language === 'bn' ? 'অনুমোদিত' : 'Approved'}</SelectItem>
                      <SelectItem value="rejected">{language === 'bn' ? 'প্রত্যাখ্যাত' : 'Rejected'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Photo Upload Section */}
                <div className="space-y-2 md:col-span-2">
                  <Label>{language === 'bn' ? 'ছবি' : 'Photo'}</Label>
                  <div className="flex items-center gap-4">
                    {imagePreview ? (
                      <div className="relative">
                        <Avatar className="w-20 h-20">
                          <AvatarImage src={imagePreview} alt="Preview" />
                          <AvatarFallback>{formData.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                          onClick={removeImage}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
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
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {language === 'bn' ? 'ছবি নির্বাচন করুন' : 'Select Photo'}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        {language === 'bn' 
                          ? 'সর্বোচ্চ ২MB, JPG/PNG/WebP। ছবি স্বয়ংক্রিয়ভাবে কম্প্রেস হবে।'
                          : 'Max 2MB, JPG/PNG/WebP. Image will be auto-compressed.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || isUploading}>
                  {(createMutation.isPending || updateMutation.isPending || isUploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isUploading 
                    ? (language === 'bn' ? 'আপলোড হচ্ছে...' : 'Uploading...')
                    : editingMember 
                      ? (language === 'bn' ? 'আপডেট' : 'Update') 
                      : (language === 'bn' ? 'সংরক্ষণ' : 'Save')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Members Alert */}
      {pendingCount > 0 && (
        <Card className="border-2 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-full">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    {language === 'bn' 
                      ? `${pendingCount}টি নতুন সদস্য আবেদন অপেক্ষমাণ` 
                      : `${pendingCount} new member application(s) pending`}
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    {language === 'bn' ? 'অনুমোদন বা প্রত্যাখ্যান করুন' : 'Approve or reject applications'}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="border-amber-500 text-amber-700 hover:bg-amber-100"
                onClick={() => setActiveTab('pending')}
              >
                {language === 'bn' ? 'দেখুন' : 'View'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={activeTab === 'pending' ? 'default' : 'outline'}
          onClick={() => setActiveTab('pending')}
          className="gap-2"
        >
          <Clock className="w-4 h-4" />
          {language === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}
          {pendingCount > 0 && (
            <Badge variant="secondary" className="ml-1 bg-amber-500 text-white">
              {pendingCount}
            </Badge>
          )}
        </Button>
        <Button
          variant={activeTab === 'approved' ? 'default' : 'outline'}
          onClick={() => setActiveTab('approved')}
          className="gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          {language === 'bn' ? 'অনুমোদিত' : 'Approved'}
          <Badge variant="secondary" className="ml-1">{approvedCount}</Badge>
        </Button>
        <Button
          variant={activeTab === 'all' ? 'default' : 'outline'}
          onClick={() => setActiveTab('all')}
          className="gap-2"
        >
          {language === 'bn' ? 'সকল' : 'All'}
          <Badge variant="secondary" className="ml-1">{members?.length || 0}</Badge>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={language === 'bn' ? 'সদস্য খুঁজুন...' : 'Search members...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'bn' ? 'ছবি' : 'Photo'}</TableHead>
                  <TableHead>{language === 'bn' ? 'আইডি' : 'ID'}</TableHead>
                  <TableHead>{language === 'bn' ? 'নাম' : 'Name'}</TableHead>
                  <TableHead>{language === 'bn' ? 'ফোন' : 'Phone'}</TableHead>
                  <TableHead>{language === 'bn' ? 'প্রকার' : 'Type'}</TableHead>
                  <TableHead>{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</TableHead>
                  <TableHead>{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {language === 'bn' ? 'কোন সদস্য পাওয়া যায়নি' : 'No members found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers?.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={member.photo_url || undefined} alt={member.full_name} />
                          <AvatarFallback>{member.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{member.member_id}</TableCell>
                      <TableCell className="font-medium">{member.full_name}</TableCell>
                      <TableCell>{member.phone || '-'}</TableCell>
                      <TableCell>{member.member_type}</TableCell>
                      <TableCell>{getStatusBadge(member.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {member.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => approveMutation.mutate(member.id)} 
                                disabled={!isAdmin || approveMutation.isPending}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => rejectMutation.mutate(member.id)} 
                                disabled={!isAdmin || rejectMutation.isPending}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline" onClick={() => setViewingMember(member)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(member)} disabled={!isAdmin}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(member.id)} disabled={!isAdmin}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Member Details Dialog */}
      <Dialog open={!!viewingMember} onOpenChange={() => setViewingMember(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{language === 'bn' ? 'সদস্যের বিবরণ' : 'Member Details'}</DialogTitle>
          </DialogHeader>
          {viewingMember && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={viewingMember.photo_url || undefined} alt={viewingMember.full_name} />
                  <AvatarFallback className="text-2xl">{viewingMember.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">{language === 'bn' ? 'আইডি' : 'ID'}</p>
                  <p className="font-mono font-medium">{viewingMember.member_id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{language === 'bn' ? 'নাম' : 'Name'}</p>
                  <p className="font-medium">{viewingMember.full_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{language === 'bn' ? 'ফোন' : 'Phone'}</p>
                  <p className="font-medium">{viewingMember.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{language === 'bn' ? 'ইমেইল' : 'Email'}</p>
                  <p className="font-medium">{viewingMember.email || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">{language === 'bn' ? 'ঠিকানা' : 'Address'}</p>
                  <p className="font-medium">{viewingMember.address || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{language === 'bn' ? 'পেশা' : 'Occupation'}</p>
                  <p className="font-medium">{viewingMember.occupation || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{language === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'}</p>
                  <p className="font-medium">{viewingMember.blood_group || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</p>
                  {getStatusBadge(viewingMember.status)}
                </div>
              </div>
              
              {viewingMember.status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      approveMutation.mutate(viewingMember.id);
                      setViewingMember(null);
                    }}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {language === 'bn' ? 'অনুমোদন' : 'Approve'}
                  </Button>
                  <Button 
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      rejectMutation.mutate(viewingMember.id);
                      setViewingMember(null);
                    }}
                    disabled={rejectMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {language === 'bn' ? 'প্রত্যাখ্যান' : 'Reject'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MembersManagement;
