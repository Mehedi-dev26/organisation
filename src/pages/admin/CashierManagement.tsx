import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, Eye, EyeOff, UserCheck, UserX, Trash2 } from 'lucide-react';

interface Cashier {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

const CashierManagement = () => {
  const { language } = useLanguage();
  const { isAdmin, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });

  // Fetch cashiers
  const { data: cashiers, isLoading: cashiersLoading } = useQuery({
    queryKey: ['cashiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cashiers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Cashier[];
    },
    enabled: isAdmin,
  });

  // Create cashier mutation
  const createCashierMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await supabase.functions.invoke('create-cashier-user', {
        body: {
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          phone: data.phone,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create cashier');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashiers'] });
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'ক্যাশিয়ার তৈরি হয়েছে' : 'Cashier created successfully',
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('cashiers')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashiers'] });
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'স্ট্যাটাস আপডেট হয়েছে' : 'Status updated',
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      password: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password.length < 6) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' : 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    createCashierMutation.mutate(formData);
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {language === 'bn' ? 'অ্যাক্সেস অস্বীকৃত' : 'Access denied'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-primary">
            {language === 'bn' ? 'ক্যাশিয়ার ব্যবস্থাপনা' : 'Cashier Management'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'bn' ? 'ক্যাশিয়ার তৈরি এবং পরিচালনা করুন' : 'Create and manage cashiers'}
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {language === 'bn' ? 'নতুন ক্যাশিয়ার' : 'New Cashier'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {language === 'bn' ? 'নতুন ক্যাশিয়ার তৈরি করুন' : 'Create New Cashier'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{language === 'bn' ? 'পুরো নাম' : 'Full Name'} *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder={language === 'bn' ? 'ক্যাশিয়ারের নাম' : 'Cashier name'}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{language === 'bn' ? 'ইমেইল' : 'Email'} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cashier@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{language === 'bn' ? 'ফোন' : 'Phone'}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+880 1XXX-XXXXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{language === 'bn' ? 'পাসওয়ার্ড' : 'Password'} *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === 'bn' ? 'কমপক্ষে ৬ অক্ষর' : 'At least 6 characters'}
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={createCashierMutation.isPending}
              >
                {createCashierMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {language === 'bn' ? 'ক্যাশিয়ার তৈরি করুন' : 'Create Cashier'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{cashiers?.length || 0}</p>
            <p className="text-sm text-muted-foreground">
              {language === 'bn' ? 'মোট ক্যাশিয়ার' : 'Total Cashiers'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {cashiers?.filter(c => c.is_active).length || 0}
            </p>
            <p className="text-sm text-muted-foreground">
              {language === 'bn' ? 'সক্রিয়' : 'Active'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cashiers Table */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'bn' ? 'ক্যাশিয়ার তালিকা' : 'Cashier List'}</CardTitle>
        </CardHeader>
        <CardContent>
          {cashiersLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : cashiers && cashiers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'bn' ? 'নাম' : 'Name'}</TableHead>
                    <TableHead>{language === 'bn' ? 'ইমেইল' : 'Email'}</TableHead>
                    <TableHead>{language === 'bn' ? 'ফোন' : 'Phone'}</TableHead>
                    <TableHead>{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</TableHead>
                    <TableHead className="text-right">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashiers.map((cashier) => (
                    <TableRow key={cashier.id}>
                      <TableCell className="font-medium">{cashier.full_name}</TableCell>
                      <TableCell>{cashier.email}</TableCell>
                      <TableCell>{cashier.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={cashier.is_active ? 'default' : 'secondary'}>
                          {cashier.is_active 
                            ? (language === 'bn' ? 'সক্রিয়' : 'Active')
                            : (language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActiveMutation.mutate({ 
                            id: cashier.id, 
                            isActive: !cashier.is_active 
                          })}
                          title={cashier.is_active 
                            ? (language === 'bn' ? 'নিষ্ক্রিয় করুন' : 'Deactivate')
                            : (language === 'bn' ? 'সক্রিয় করুন' : 'Activate')}
                        >
                          {cashier.is_active 
                            ? <UserX className="h-4 w-4 text-destructive" />
                            : <UserCheck className="h-4 w-4 text-green-600" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'bn' ? 'কোনো ক্যাশিয়ার নেই' : 'No cashiers found'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CashierManagement;
