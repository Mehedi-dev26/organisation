import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Users, Upload, CheckCircle, ImageIcon, UserPlus, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { compressImage, formatFileSize } from '@/lib/imageUtils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const registrationSchema = z.object({
  full_name: z.string().min(3, 'নাম কমপক্ষে ৩ অক্ষরের হতে হবে'),
  email: z.string().email('সঠিক ইমেইল দিন').optional().or(z.literal('')),
  phone: z.string().min(11, 'সঠিক ফোন নম্বর দিন'),
  address: z.string().min(10, 'সম্পূর্ণ ঠিকানা দিন'),
  occupation: z.string().min(2, 'পেশা লিখুন'),
  blood_group: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const MemberRegistration = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [memberType, setMemberType] = useState<'new' | 'existing'>('new');
  const [previousMemberId, setPreviousMemberId] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setOriginalSize(file.size);
      setIsCompressing(true);
      
      try {
        // Compress the image immediately
        const compressed = await compressImage(file, 300, 300, 0.8);
        setCompressedBlob(compressed);
        setCompressedSize(compressed.size);
        
        // Create preview from compressed blob
        const previewUrl = URL.createObjectURL(compressed);
        setPhotoPreview(previewUrl);
        
        toast.success(
          language === 'bn' 
            ? `ছবি কম্প্রেস হয়েছে: ${formatFileSize(file.size)} → ${formatFileSize(compressed.size)}`
            : `Image compressed: ${formatFileSize(file.size)} → ${formatFileSize(compressed.size)}`
        );
      } catch (error) {
        console.error('Compression error:', error);
        // Fallback to original if compression fails
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const generateMemberId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `SB-${year}-${random}`;
  };

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true);
    try {
      let photoUrl = null;

      // Upload photo if provided
      if (compressedBlob) {
        const fileName = `pending/${Date.now()}-${photoFile?.name || 'photo.jpg'}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('member-photos')
          .upload(fileName, compressedBlob, {
            contentType: 'image/jpeg',
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('member-photos')
          .getPublicUrl(fileName);
        
        photoUrl = publicUrlData.publicUrl;
      }

      // Insert member with pending status
      const { error } = await supabase.from('members').insert({
        member_id: memberType === 'existing' && previousMemberId ? previousMemberId : generateMemberId(),
        full_name: data.full_name,
        email: data.email || null,
        phone: data.phone,
        address: data.address,
        occupation: data.occupation,
        blood_group: data.blood_group || null,
        photo_url: photoUrl,
        status: 'pending',
        member_type: memberType === 'existing' ? 'renewal' : 'general',
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success(
        language === 'bn'
          ? 'আপনার আবেদন সফলভাবে জমা হয়েছে!'
          : 'Your application has been submitted successfully!'
      );
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(
        language === 'bn'
          ? 'আবেদন জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
          : 'Failed to submit application. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-16 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10">
          <Card className="max-w-md mx-4 text-center border-2 border-primary/20 shadow-xl bg-card/95 backdrop-blur-sm">
            <CardContent className="pt-10 pb-10">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4 font-heading">
                {language === 'bn' ? 'আবেদন জমা হয়েছে!' : 'Application Submitted!'}
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                {language === 'bn'
                  ? 'আপনার সদস্য আবেদন সফলভাবে জমা হয়েছে। অ্যাডমিন অনুমোদনের পর আপনি সদস্য হয়ে যাবেন। অনুগ্রহ করে অপেক্ষা করুন।'
                  : 'Your membership application has been submitted successfully. You will become a member after admin approval. Please wait.'}
              </p>
              <Button onClick={() => navigate('/')} className="w-full" size="lg">
                {language === 'bn' ? 'হোমপেজে ফিরে যান' : 'Go to Homepage'}
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-2xl border-2 border-primary/20 overflow-hidden bg-card/95 backdrop-blur-sm">
              <CardHeader className="text-center pb-8 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-primary/10">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Users className="w-10 h-10 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl md:text-3xl font-heading text-primary">
                  {language === 'bn' ? 'সদস্য রেজিস্ট্রেশন ফর্ম' : 'Member Registration Form'}
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  {language === 'bn'
                    ? 'সময়ের বাতিঘরের সদস্য হতে নিচের ফর্মটি পূরণ করুন'
                    : 'Fill out the form below to become a member of Samoyer Batighor'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8 px-6 md:px-10">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Member Type Selection */}
                  <div className="p-6 bg-muted/30 rounded-xl border border-border/50 mb-6">
                    <Label className="text-base font-medium mb-4 block">
                      {language === 'bn' ? 'সদস্যের ধরন নির্বাচন করুন' : 'Select Member Type'}
                    </Label>
                    <RadioGroup
                      value={memberType}
                      onValueChange={(value) => setMemberType(value as 'new' | 'existing')}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      <div className="relative">
                        <RadioGroupItem
                          value="new"
                          id="new-member"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="new-member"
                          className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            memberType === 'new'
                              ? 'border-primary bg-primary/10 shadow-md'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          <div className={`p-3 rounded-full ${memberType === 'new' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <UserPlus className="w-6 h-6" />
                          </div>
                          <div className="text-center">
                            <p className="font-medium">
                              {language === 'bn' ? 'নতুন সদস্য' : 'New Member'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {language === 'bn' ? 'প্রথমবার যোগ দিচ্ছি' : 'Joining for the first time'}
                            </p>
                          </div>
                        </Label>
                      </div>

                      <div className="relative">
                        <RadioGroupItem
                          value="existing"
                          id="existing-member"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="existing-member"
                          className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            memberType === 'existing'
                              ? 'border-primary bg-primary/10 shadow-md'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          <div className={`p-3 rounded-full ${memberType === 'existing' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <UserCheck className="w-6 h-6" />
                          </div>
                          <div className="text-center">
                            <p className="font-medium">
                              {language === 'bn' ? 'আগের সদস্য' : 'Existing Member'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {language === 'bn' ? 'আগে থেকে সদস্য ছিলাম' : 'Was a member before'}
                            </p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>

                    {/* Previous Member ID Input */}
                    {memberType === 'existing' && (
                      <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label htmlFor="previous_member_id">
                          {language === 'bn' ? 'আগের সদস্য আইডি (যদি জানা থাকে)' : 'Previous Member ID (if known)'}
                        </Label>
                        <Input
                          id="previous_member_id"
                          placeholder={language === 'bn' ? 'যেমন: SB-2023-1234' : 'e.g., SB-2023-1234'}
                          value={previousMemberId}
                          onChange={(e) => setPreviousMemberId(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          {language === 'bn' 
                            ? 'আইডি না জানা থাকলে খালি রাখুন, অ্যাডমিন পরে আপডেট করবেন' 
                            : 'Leave empty if unknown, admin will update later'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Photo Upload */}
                  <div className="flex flex-col items-center mb-8 p-6 bg-muted/30 rounded-xl border border-border/50">
                    <div className="relative w-32 h-32 mb-4">
                      {isCompressing ? (
                        <div className="w-full h-full rounded-full border-4 border-primary/30 flex items-center justify-center bg-muted animate-pulse">
                          <ImageIcon className="w-12 h-12 text-primary/40" />
                        </div>
                      ) : photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-full border-4 border-primary/30 shadow-lg"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full border-4 border-dashed border-primary/30 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                          <Users className="w-12 h-12 text-primary/40" />
                        </div>
                      )}
                    </div>
                    
                    {/* Show compression info */}
                    {compressedSize > 0 && originalSize > 0 && (
                      <div className="text-xs text-muted-foreground mb-3 bg-green-500/10 text-green-700 px-3 py-1 rounded-full">
                        {language === 'bn' ? 'কম্প্রেসড:' : 'Compressed:'} {formatFileSize(originalSize)} → {formatFileSize(compressedSize)}
                        {' '}({Math.round((1 - compressedSize / originalSize) * 100)}% {language === 'bn' ? 'কম' : 'smaller'})
                      </div>
                    )}
                    
                    <Label
                      htmlFor="photo"
                      className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors bg-primary/10 px-4 py-2 rounded-full"
                    >
                      <Upload className="w-4 h-4" />
                      {isCompressing 
                        ? (language === 'bn' ? 'কম্প্রেস হচ্ছে...' : 'Compressing...') 
                        : (language === 'bn' ? 'ছবি আপলোড করুন' : 'Upload Photo')}
                    </Label>
                    <input
                      type="file"
                      id="photo"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                      disabled={isCompressing}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {language === 'bn' ? '(ঐচ্ছিক - স্বয়ংক্রিয়ভাবে কম্প্রেস হবে)' : '(Optional - auto compressed)'}
                    </p>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="full_name">
                      {language === 'bn' ? 'পূর্ণ নাম' : 'Full Name'} *
                    </Label>
                    <Input
                      id="full_name"
                      placeholder={language === 'bn' ? 'আপনার পূর্ণ নাম লিখুন' : 'Enter your full name'}
                      {...register('full_name')}
                    />
                    {errors.full_name && (
                      <p className="text-sm text-destructive">{errors.full_name.message}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      {language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'} *
                    </Label>
                    <Input
                      id="phone"
                      placeholder="01XXXXXXXXX"
                      {...register('phone')}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      {language === 'bn' ? 'ইমেইল' : 'Email'}{' '}
                      <span className="text-muted-foreground text-xs">
                        ({language === 'bn' ? 'ঐচ্ছিক' : 'Optional'})
                      </span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address">
                      {language === 'bn' ? 'ঠিকানা' : 'Address'} *
                    </Label>
                    <Textarea
                      id="address"
                      placeholder={
                        language === 'bn'
                          ? 'গ্রাম/মহল্লা, পোস্ট, উপজেলা, জেলা'
                          : 'Village/Area, Post, Upazila, District'
                      }
                      {...register('address')}
                    />
                    {errors.address && (
                      <p className="text-sm text-destructive">{errors.address.message}</p>
                    )}
                  </div>

                  {/* Occupation */}
                  <div className="space-y-2">
                    <Label htmlFor="occupation">
                      {language === 'bn' ? 'পেশা' : 'Occupation'} *
                    </Label>
                    <Input
                      id="occupation"
                      placeholder={language === 'bn' ? 'আপনার পেশা' : 'Your occupation'}
                      {...register('occupation')}
                    />
                    {errors.occupation && (
                      <p className="text-sm text-destructive">{errors.occupation.message}</p>
                    )}
                  </div>

                  {/* Blood Group */}
                  <div className="space-y-2">
                    <Label>
                      {language === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'}{' '}
                      <span className="text-muted-foreground text-xs">
                        ({language === 'bn' ? 'ঐচ্ছিক' : 'Optional'})
                      </span>
                    </Label>
                    <Select onValueChange={(value) => setValue('blood_group', value)}>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={language === 'bn' ? 'রক্তের গ্রুপ নির্বাচন করুন' : 'Select blood group'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {bloodGroups.map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg" 
                      size="lg" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? language === 'bn'
                          ? 'জমা দেওয়া হচ্ছে...'
                          : 'Submitting...'
                        : language === 'bn'
                        ? 'আবেদন জমা দিন'
                        : 'Submit Application'}
                    </Button>
                  </div>

                  <p className="text-center text-sm text-muted-foreground pt-2">
                    {language === 'bn'
                      ? '* চিহ্নিত ঘরগুলো অবশ্যই পূরণ করতে হবে'
                      : '* Marked fields are required'}
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MemberRegistration;
