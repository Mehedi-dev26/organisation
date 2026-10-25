import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, Loader2, Calendar, Upload, Image as ImageIcon, X } from 'lucide-react';
import { compressImage } from '@/lib/imageUtils';

interface Event {
  id: string;
  title_bn: string;
  title_en: string | null;
  description_bn: string | null;
  description_en: string | null;
  event_date: string;
  location_bn: string | null;
  location_en: string | null;
  image_url: string | null;
  is_published: boolean | null;
  created_at: string | null;
  target_amount?: number | null;
  raised_amount?: number | null;
  category_bn?: string | null;
  status?: string | null;
}

const EventsManagement = () => {
  const { language } = useLanguage();
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title_bn: '',
    title_en: '',
    description_bn: '',
    description_en: '',
    event_date: '',
    location_bn: '',
    location_en: '',
    image_url: '',
    is_published: true,
    target_amount: '',
    raised_amount: '',
    category_bn: '',
    status: 'ongoing',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const uploadEventPhoto = async (): Promise<string | null> => {
    if (!selectedImage) return formData.image_url || null;

    try {
      setIsUploading(true);
      const compressedBlob = await compressImage(selectedImage, 1200, 800, 0.88);
      const fileName = `events/${Date.now()}-${selectedImage.name.replace(/\s+/g, '_')}`;

      const { data, error } = await supabase.storage
        .from('gallery-images')
        .upload(fileName, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('gallery-images').getPublicUrl(data.path);
      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Photo upload error:', error);
      toast({
        title: language === 'bn' ? 'ছবি আপলোড ব্যর্থ' : 'Photo upload failed',
        description: error.message || 'ত্রুটি ঘটেছে',
        variant: 'destructive',
      });
      return formData.image_url || null;
    } finally {
      setIsUploading(false);
    }
  };

  // Enable realtime subscription
  useRealtimeSubscription({ table: 'events', queryKey: ['admin-events'] });

  const { data: eventsList, isLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });
      
      if (error) throw error;
      return data as Event[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('events').insert([{
        ...data,
        created_by: user?.id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast({ title: language === 'bn' ? 'সফল!' : 'Success!', description: language === 'bn' ? 'ইভেন্ট যোগ হয়েছে' : 'Event added' });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: language === 'bn' ? 'ত্রুটি' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('events').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast({ title: language === 'bn' ? 'সফল!' : 'Success!', description: language === 'bn' ? 'ইভেন্ট আপডেট হয়েছে' : 'Event updated' });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: language === 'bn' ? 'ত্রুটি' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast({ title: language === 'bn' ? 'সফল!' : 'Success!', description: language === 'bn' ? 'ইভেন্ট মুছে ফেলা হয়েছে' : 'Event deleted' });
    },
    onError: (error: any) => {
      toast({ title: language === 'bn' ? 'ত্রুটি' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      title_bn: '',
      title_en: '',
      description_bn: '',
      description_en: '',
      event_date: '',
      location_bn: '',
      location_en: '',
      image_url: '',
      is_published: true,
      target_amount: '',
      raised_amount: '',
      category_bn: '',
      status: 'ongoing',
    });
    setSelectedImage(null);
    setImagePreview(null);
    setEditingEvent(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title_bn: event.title_bn,
      title_en: event.title_en || '',
      description_bn: event.description_bn || '',
      description_en: event.description_en || '',
      event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '',
      location_bn: event.location_bn || '',
      location_en: event.location_en || '',
      image_url: event.image_url || '',
      is_published: event.is_published ?? true,
      target_amount: event.target_amount ? String(event.target_amount) : '',
      raised_amount: event.raised_amount ? String(event.raised_amount) : '',
      category_bn: event.category_bn || '',
      status: event.status || 'ongoing',
    });
    setSelectedImage(null);
    setImagePreview(event.image_url || null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalImageUrl = formData.image_url;
    if (selectedImage) {
      const uploadedUrl = await uploadEventPhoto();
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      }
    }
    const payload = {
      ...formData,
      image_url: finalImageUrl,
      target_amount: formData.target_amount ? Number(formData.target_amount) : null,
      raised_amount: formData.raised_amount ? Number(formData.raised_amount) : null,
    };
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: payload as any });
    } else {
      createMutation.mutate(payload as any);
    }
  };

  const filteredEvents = eventsList?.filter(event =>
    event.title_bn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.title_en?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold">
            {language === 'bn' ? 'ইভেন্ট ব্যবস্থাপনা' : 'Events Management'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'bn' ? 'সকল ইভেন্ট দেখুন ও পরিচালনা করুন' : 'View and manage all events'}
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!isAdmin} onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              {language === 'bn' ? 'নতুন ইভেন্ট' : 'Add Event'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEvent 
                  ? (language === 'bn' ? 'ইভেন্ট সম্পাদনা' : 'Edit Event')
                  : (language === 'bn' ? 'নতুন ইভেন্ট যোগ করুন' : 'Add New Event')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'শিরোনাম (বাংলা)' : 'Title (Bengali)'} *</Label>
                  <Input
                    value={formData.title_bn}
                    onChange={(e) => setFormData({ ...formData, title_bn: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'শিরোনাম (ইংরেজি)' : 'Title (English)'}</Label>
                  <Input
                    value={formData.title_en}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'তারিখ ও সময়' : 'Date & Time'} *</Label>
                <Input
                  type="datetime-local"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'স্থান (বাংলা)' : 'Location (Bengali)'}</Label>
                  <Input
                    value={formData.location_bn}
                    onChange={(e) => setFormData({ ...formData, location_bn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'স্থান (ইংরেজি)' : 'Location (English)'}</Label>
                  <Input
                    value={formData.location_en}
                    onChange={(e) => setFormData({ ...formData, location_en: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'বিবরণ (বাংলা)' : 'Description (Bengali)'}</Label>
                <Textarea
                  value={formData.description_bn}
                  onChange={(e) => setFormData({ ...formData, description_bn: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'বিবরণ (ইংরেজি)' : 'Description (English)'}</Label>
                <Textarea
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'ক্যাটাগরি' : 'Category'}</Label>
                  <Input
                    value={formData.category_bn}
                    onChange={(e) => setFormData({ ...formData, category_bn: e.target.value })}
                    placeholder="যেমন: চিকিৎসা সহায়তা, শিক্ষা কর্মসূচি"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'কার্যক্রম অবস্থা' : 'Program Status'}</Label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="ongoing">{language === 'bn' ? 'চলমান (Ongoing)' : 'Ongoing'}</option>
                    <option value="completed">{language === 'bn' ? 'সম্পন্ন (Completed)' : 'Completed'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'লক্ষ্যমাত্রা (টাকা)' : 'Target Amount (BDT)'}</Label>
                  <Input
                    type="number"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                    placeholder="50000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'সংগৃহীত অনুদান (টাকা)' : 'Raised Amount (BDT)'}</Label>
                  <Input
                    type="number"
                    value={formData.raised_amount}
                    onChange={(e) => setFormData({ ...formData, raised_amount: e.target.value })}
                    placeholder="25000"
                  />
                </div>
              </div>

              {/* Photo Upload & Preview */}
              <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <Label className="text-sm font-bold flex items-center justify-between">
                  <span>{language === 'bn' ? 'কর্মসূচির ছবি আপলোড' : 'Event Image Upload'}</span>
                  {isUploading && (
                    <span className="text-xs text-primary flex items-center gap-1 font-normal">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {language === 'bn' ? 'আপলোড হচ্ছে...' : 'Uploading...'}
                    </span>
                  )}
                </Label>

                {imagePreview ? (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-200 bg-black/5 group">
                    <img 
                      src={imagePreview} 
                      alt="Event preview" 
                      className="w-full h-full object-cover" 
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                        setFormData({ ...formData, image_url: '' });
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 text-white shadow-md hover:bg-red-700 transition-colors"
                      title={language === 'bn' ? 'ছবি মুছে ফেলুন' : 'Remove photo'}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-primary transition-colors bg-white">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-xs text-slate-500 mb-2">
                      {language === 'bn' ? 'কম্পিউটার বা মোবাইল থেকে ছবি সিলেক্ট করুন (সর্বোচ্চ ৫MB)' : 'Select image from device (Max 5MB)'}
                    </p>
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'ছবি বাছাই করুন' : 'Choose Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                <div className="space-y-1 pt-1">
                  <span className="text-[11px] text-muted-foreground block">
                    {language === 'bn' ? 'অথবা সরাসরি ছবির লিঙ্ক প্রদান করতে পারেন:' : 'Or enter direct image URL:'}
                  </span>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => {
                      setFormData({ ...formData, image_url: e.target.value });
                      setImagePreview(e.target.value || null);
                    }}
                    placeholder="https://..."
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label>{language === 'bn' ? 'প্রকাশ করুন' : 'Publish'}</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingEvent ? (language === 'bn' ? 'আপডেট' : 'Update') : (language === 'bn' ? 'সংরক্ষণ' : 'Save')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={language === 'bn' ? 'ইভেন্ট খুঁজুন...' : 'Search events...'}
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
                  <TableHead>{language === 'bn' ? 'শিরোনাম' : 'Title'}</TableHead>
                  <TableHead>{language === 'bn' ? 'তারিখ' : 'Date'}</TableHead>
                  <TableHead>{language === 'bn' ? 'স্থান' : 'Location'}</TableHead>
                  <TableHead>{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</TableHead>
                  <TableHead>{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {language === 'bn' ? 'কোন ইভেন্ট পাওয়া যায়নি' : 'No events found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents?.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium max-w-xs">
                        <div className="font-bold text-sm text-foreground truncate">
                          {language === 'bn' ? event.title_bn : (event.title_en || event.title_bn)}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {event.category_bn && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold">
                              {event.category_bn}
                            </span>
                          )}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                            event.status === 'completed' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-600 text-white'
                          }`}>
                            {event.status === 'completed' ? 'সম্পন্ন' : 'চলমান'}
                          </span>
                          {event.target_amount ? (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              লক্ষ্য: ৳{event.target_amount} (সংগ্রহ: ৳{event.raised_amount || 0})
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {new Date(event.event_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {language === 'bn' ? event.location_bn : (event.location_en || event.location_bn) || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={event.is_published ? 'default' : 'secondary'}>
                          {event.is_published 
                            ? (language === 'bn' ? 'প্রকাশিত' : 'Published') 
                            : (language === 'bn' ? 'খসড়া' : 'Draft')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(event)} disabled={!isAdmin}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(event.id)} disabled={!isAdmin}>
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
    </div>
  );
};

export default EventsManagement;
