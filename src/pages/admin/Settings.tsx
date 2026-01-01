import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Eye, EyeOff, Key, User, Shield, Bell } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const Settings = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Profile state
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast.error(language === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' : 'Password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error(language === 'bn' ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match');
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast.success(language === 'bn' ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে' : 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || (language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে' : 'Failed to change password'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });
      
      if (error) throw error;
      
      // Also update the profiles table
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({ full_name: fullName })
          .eq('id', user.id);
      }
      
      toast.success(language === 'bn' ? 'প্রোফাইল আপডেট হয়েছে' : 'Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || (language === 'bn' ? 'প্রোফাইল আপডেট ব্যর্থ হয়েছে' : 'Failed to update profile'));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">
          {language === 'bn' ? 'সেটিংস' : 'Settings'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {language === 'bn' ? 'আপনার অ্যাকাউন্ট ও প্রোফাইল সেটিংস পরিচালনা করুন' : 'Manage your account and profile settings'}
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {language === 'bn' ? 'প্রোফাইল সেটিংস' : 'Profile Settings'}
            </CardTitle>
            <CardDescription>
              {language === 'bn' ? 'আপনার ব্যক্তিগত তথ্য আপডেট করুন' : 'Update your personal information'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{language === 'bn' ? 'ইমেইল' : 'Email'}</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  {language === 'bn' ? 'ইমেইল পরিবর্তন করা যাবে না' : 'Email cannot be changed'}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fullName">{language === 'bn' ? 'পূর্ণ নাম' : 'Full Name'}</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={language === 'bn' ? 'আপনার নাম লিখুন' : 'Enter your name'}
                />
              </div>
              
              <Button type="submit" disabled={isUpdatingProfile}>
                {isUpdatingProfile 
                  ? (language === 'bn' ? 'আপডেট হচ্ছে...' : 'Updating...') 
                  : (language === 'bn' ? 'প্রোফাইল আপডেট করুন' : 'Update Profile')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              {language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
            </CardTitle>
            <CardDescription>
              {language === 'bn' ? 'আপনার অ্যাকাউন্টের পাসওয়ার্ড আপডেট করুন' : 'Update your account password'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">{language === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={language === 'bn' ? 'নতুন পাসওয়ার্ড লিখুন' : 'Enter new password'}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={language === 'bn' ? 'পাসওয়ার্ড আবার লিখুন' : 'Confirm your password'}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword 
                  ? (language === 'bn' ? 'পরিবর্তন হচ্ছে...' : 'Changing...') 
                  : (language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Change Password')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {language === 'bn' ? 'নিরাপত্তা' : 'Security'}
            </CardTitle>
            <CardDescription>
              {language === 'bn' ? 'আপনার অ্যাকাউন্টের নিরাপত্তা সেটিংস' : 'Your account security settings'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{language === 'bn' ? 'অ্যাকাউন্ট স্ট্যাটাস' : 'Account Status'}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'আপনার অ্যাকাউন্ট সক্রিয় আছে' : 'Your account is active'}
                </p>
              </div>
              <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 rounded-full">
                {language === 'bn' ? 'সক্রিয়' : 'Active'}
              </span>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{language === 'bn' ? 'শেষ লগইন' : 'Last Login'}</p>
                <p className="text-sm text-muted-foreground">
                  {user?.last_sign_in_at 
                    ? new Date(user.last_sign_in_at).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')
                    : (language === 'bn' ? 'তথ্য নেই' : 'No data')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {language === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
            </CardTitle>
            <CardDescription>
              {language === 'bn' ? 'নোটিফিকেশন পছন্দসমূহ' : 'Notification preferences'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{language === 'bn' ? 'ইমেইল নোটিফিকেশন' : 'Email Notifications'}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'গুরুত্বপূর্ণ আপডেটের জন্য ইমেইল পান' : 'Receive emails for important updates'}
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
