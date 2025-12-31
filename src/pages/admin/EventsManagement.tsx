import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search, Loader2, Calendar } from 'lucide-react';

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
    is_published: false,
  });

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
      is_published: false,
    });
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
      is_published: event.is_published || false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: formData });
    } else {
      createMutation.mutate(formData);
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
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'ছবি URL' : 'Image URL'}</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
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
                      <TableCell className="font-medium max-w-xs truncate">
                        {language === 'bn' ? event.title_bn : (event.title_en || event.title_bn)}
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
