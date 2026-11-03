import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMember } from '@/components/member/MemberContext';
import { IdCardCanvas } from '@/components/idcard/IdCardCanvas';
import { IdCardCustomizer } from '@/components/idcard/IdCardCustomizer';
import { 
  IdCardConfig, 
  DEFAULT_ID_CARD_CONFIG, 
  extractMemberSerial 
} from '@/components/idcard/idCardTypes';
import { 
  downloadElementAsPng, 
  downloadElementAsJpg, 
  downloadElementAsPdf,
  urlToBase64
} from '@/components/idcard/exportUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Sparkles, 
  Download, 
  Printer, 
  RotateCcw, 
  Layers, 
  Loader2, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  FileDown,
  UserCheck
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

const MemberIdCardPage: React.FC = () => {
  const { language } = useLanguage();
  const { memberData, memberLoading } = useMember();
  const { toast } = useToast();

  const cardRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<IdCardConfig>(DEFAULT_ID_CARD_CONFIG);
  const [isExporting, setIsExporting] = useState(false);
  const [previewScale, setPreviewScale] = useState<number>(1);

  // Initialize and sync config with authenticated member's database data
  useEffect(() => {
    if (!memberData) return;

    const storageKey = `batighor_idcard_config_${memberData.id}`;
    const savedConfigStr = localStorage.getItem(storageKey);

    const serialNum = extractMemberSerial(memberData.member_id);

    if (savedConfigStr) {
      try {
        const parsed = JSON.parse(savedConfigStr);
        setConfig({
          ...DEFAULT_ID_CARD_CONFIG,
          ...parsed,
          // Always keep latest critical fields from database if not manually overridden
          displayName: parsed.displayName || memberData.full_name || '',
          displayIdNumber: parsed.displayIdNumber || memberData.member_id || serialNum,
          displayMemberSerial: parsed.displayMemberSerial || serialNum,
          displayBloodGroup: parsed.displayBloodGroup || memberData.blood_group || 'A+',
          displayPhone: parsed.displayPhone || memberData.phone || '',
          photoUrl: parsed.photoUrl || memberData.photo_url || null,
        });
        return;
      } catch (e) {
        console.warn('Failed to parse saved ID card config, falling back to defaults:', e);
      }
    }

    // Default initialization from database
    setConfig({
      ...DEFAULT_ID_CARD_CONFIG,
      displayName: memberData.full_name || '',
      displayIdNumber: memberData.member_id || serialNum,
      displayMemberSerial: serialNum,
      displayBloodGroup: memberData.blood_group || 'A+',
      displayPhone: memberData.phone || '01712-345678',
      photoUrl: memberData.photo_url || null,
      photoZoom: 1.0,
      photoPanX: 0,
      photoPanY: 0,
    });
  }, [memberData]);

  // Handle local photo upload
  const handlePhotoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setConfig((prev) => ({
        ...prev,
        photoUrl: base64,
        photoZoom: 1.0,
        photoPanX: 0,
        photoPanY: 0,
        photoRotate: 0,
      }));
      toast({
        title: language === 'bn' ? 'ছবি লোড হয়েছে' : 'Photo Loaded',
        description: language === 'bn' ? 'ছবিটি ইচ্ছামতো জুম ও ড্র্যাগ করে বসাতে পারেন।' : 'You can now zoom and drag the photo to position.',
      });
    };
    reader.readAsDataURL(file);
  };

  // Reset photo zoom & pan
  const handleResetPhoto = () => {
    setConfig((prev) => ({
      ...prev,
      photoZoom: 1.0,
      photoPanX: 0,
      photoPanY: 0,
      photoRotate: 0,
    }));
    toast({
      title: language === 'bn' ? 'ফটো রিসেট' : 'Photo Reset',
      description: language === 'bn' ? 'ছবির পজিশন ডিফল্ট অবস্থানে আনা হয়েছে।' : 'Photo position has been reset to default.',
    });
  };

  // Reset all to official template
  const handleResetAll = () => {
    if (!memberData) return;
    const serialNum = extractMemberSerial(memberData.member_id);
    setConfig({
      ...DEFAULT_ID_CARD_CONFIG,
      displayName: memberData.full_name || '',
      displayIdNumber: memberData.member_id || serialNum,
      displayMemberSerial: serialNum,
      displayBloodGroup: memberData.blood_group || 'A+',
      displayPhone: memberData.phone || '',
      photoUrl: memberData.photo_url || null,
    });
    localStorage.removeItem(`batighor_idcard_config_${memberData.id}`);
    toast({
      title: language === 'bn' ? 'রিসেট সম্পন্ন' : 'Reset Complete',
      description: language === 'bn' ? 'অফিসিয়াল ডিফল্ট টেমপ্লেটে ফিরিয়ে আনা হয়েছে।' : 'Restored to official default template.',
    });
  };

  // Save current preferences to browser storage
  const handleSaveConfig = () => {
    if (!memberData) return;
    try {
      localStorage.setItem(
        `batighor_idcard_config_${memberData.id}`,
        JSON.stringify(config)
      );
      toast({
        title: language === 'bn' ? 'সংরক্ষিত হয়েছে' : 'Settings Saved',
        description: language === 'bn' ? 'আপনার কাস্টমাইজেশন সফলভাবে ব্রাউজারে সংরক্ষিত হয়েছে।' : 'Your customizations have been saved successfully.',
      });
    } catch (e) {
      toast({
        title: language === 'bn' ? 'সংরক্ষণ ব্যর্থ' : 'Save Failed',
        description: language === 'bn' ? 'লোকাল স্টোরেজ পূর্ণ হতে পারে।' : 'Could not save to local storage.',
        variant: 'destructive',
      });
    }
  };

  // Printing support via react-to-print
  const handlePrint = useReactToPrint({
    contentRef: cardRef,
    documentTitle: `Member-ID-Card-${memberData?.member_id || 'ID'}-${config.activeSide}`,
    pageStyle: `
      @page {
        size: auto;
        margin: 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `,
  });

  // Download Handlers
  const getExportFilename = (ext: string) => {
    const cleanId = (memberData?.member_id || 'SB-01').replace(/[^a-zA-Z0-9_-]/g, '_');
    return `Batighor-ID-Card-${cleanId}-${config.activeSide}.${ext}`;
  };

  const handleDownloadPng = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      await downloadElementAsPng(cardRef.current, getExportFilename('png'), 2.5);
      toast({
        title: language === 'bn' ? 'ডাউনলোড সম্পন্ন' : 'Download Complete',
        description: language === 'bn' ? 'উচ্চ মানের পিএনজি ফাইল ডাউনলোড হয়েছে।' : 'High-resolution PNG downloaded.',
      });
    } catch (error) {
      console.error('PNG Export failed:', error);
      toast({
        title: language === 'bn' ? 'ডাউনলোড ব্যর্থ' : 'Export Failed',
        description: language === 'bn' ? 'কার্ডটি ডাউনলোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Failed to export image.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadJpg = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      await downloadElementAsJpg(cardRef.current, getExportFilename('jpg'), 2.5);
      toast({
        title: language === 'bn' ? 'ডাউনলোড সম্পন্ন' : 'Download Complete',
        description: language === 'bn' ? 'জেপিজি ফাইল ডাউনলোড হয়েছে।' : 'JPEG downloaded successfully.',
      });
    } catch (error) {
      console.error('JPG Export failed:', error);
      toast({
        title: language === 'bn' ? 'ডাউনলোড ব্যর্থ' : 'Export Failed',
        description: language === 'bn' ? 'কার্ডটি ডাউনলোড করতে সমস্যা হয়েছে।' : 'Failed to export image.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      await downloadElementAsPdf(cardRef.current, getExportFilename('pdf'));
      toast({
        title: language === 'bn' ? 'পিডিএফ প্রস্তুত' : 'PDF Ready',
        description: language === 'bn' ? 'প্রিন্ট উপযোগী পিডিএফ ডাউনলোড হয়েছে।' : 'Print-ready PDF downloaded.',
      });
    } catch (error) {
      console.error('PDF Export failed:', error);
      toast({
        title: language === 'bn' ? 'ডাউনলোড ব্যর্থ' : 'Export Failed',
        description: language === 'bn' ? 'পিডিএফ ডাউনলোড করতে সমস্যা হয়েছে।' : 'Failed to generate PDF.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (memberLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 text-[#0B6B3A] animate-spin" />
        <p className="text-sm font-bold text-slate-600">
          {language === 'bn' ? 'আইডি কার্ড ডেটা লোড হচ্ছে...' : 'Loading Member ID Card...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] text-[#0B6B3A] text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {language === 'bn' ? 'অফিসিয়াল ফটো আইডি কার্ড জেনারেটর' : 'Official Photo ID Card Generator'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#14231B] dark:text-white font-heading tracking-tight">
            {language === 'bn' ? 'সদস্য ফটো আইডি কার্ড' : 'Member Photo ID Card'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'bn'
              ? 'আপনার অফিসিয়াল প্রাতিষ্ঠানিক পরিচয়পত্র লাইভ কাস্টমাইজ করুন, প্রিভিউ দেখুন এবং এইচডি কোয়ালিটিতে ডাউনলোড ও প্রিন্ট করুন।'
              : 'Customize your official membership ID card with live preview, download HD print-ready files, or print directly.'}
          </p>
        </div>

        {/* Quick Header Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setConfig((prev) => ({
                ...prev,
                activeSide: prev.activeSide === 'front' ? 'back' : 'front',
              }))
            }
            className="rounded-xl font-bold text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Layers className="w-4 h-4 mr-1 text-[#0B6B3A]" />
            <span>
              {config.activeSide === 'front'
                ? language === 'bn'
                  ? 'পিছন পাশ দেখুন'
                  : 'View Back'
                : language === 'bn'
                ? 'সামনের পাশ দেখুন'
                : 'View Front'}
            </span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleDownloadPng}
            disabled={isExporting}
            className="rounded-xl font-bold text-xs bg-[#0B6B3A] hover:bg-[#09572F] text-white shadow-xs"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-1.5" />
            )}
            <span>{language === 'bn' ? 'PNG ডাউনলোড' : 'Download PNG'}</span>
          </Button>
        </div>
      </div>

      {/* 2. Main Two-Column Layout (Split Screen) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: ID Card Customization Panel (Order 2 on mobile, Order 1 on lg) */}
        <div className="lg:col-span-6 xl:col-span-5 order-2 lg:order-1">
          <div className="bg-white dark:bg-slate-900 rounded-[24px] p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#E6F4EA] flex items-center justify-center text-[#0B6B3A]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    {language === 'bn' ? 'কার্ড কাস্টমাইজেশন' : 'Card Customization'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {language === 'bn' ? 'ছবি ও তথ্যের নিয়ন্ত্রণ' : 'Control photo and card fields'}
                  </p>
                </div>
              </div>

              <Badge className="bg-[#E6F4EA] text-[#0B6B3A] border-[#C8E6C9] font-bold text-[10px]">
                {config.activeSide === 'front' ? 'সামনের পাশ' : 'পিছনের পাশ'}
              </Badge>
            </div>

            <IdCardCustomizer
              config={config}
              onChange={setConfig}
              onPhotoUpload={handlePhotoUpload}
              onResetPhoto={handleResetPhoto}
              onResetAll={handleResetAll}
              onSaveConfig={handleSaveConfig}
              onDownloadPng={handleDownloadPng}
              onDownloadJpg={handleDownloadJpg}
              onDownloadPdf={handleDownloadPdf}
              onPrint={handlePrint}
              isExporting={isExporting}
              defaultProfilePhoto={memberData?.photo_url}
            />
          </div>
        </div>

        {/* Right Column: Live Interactive Card Canvas & Preview (Order 1 on mobile, Order 2 on lg) */}
        <div className="lg:col-span-6 xl:col-span-7 order-1 lg:order-2 flex flex-col items-center">
          <div className="w-full bg-slate-900/5 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-[28px] p-4 sm:p-6 flex flex-col items-center">
            {/* Live Preview Controls Header */}
            <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-black text-slate-700 dark:text-slate-200 tracking-wide uppercase">
                  {language === 'bn' ? 'লাইভ প্রিভিউ (Live Preview)' : 'Live Interactive Preview'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setPreviewScale((prev) => Math.max(0.7, Number((prev - 0.1).toFixed(1))))
                  }
                  className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-800"
                  title="জুম আউট"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </Button>
                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 w-10 text-center">
                  {Math.round(previewScale * 100)}%
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setPreviewScale((prev) => Math.min(1.2, Number((prev + 0.1).toFixed(1))))
                  }
                  className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-800"
                  title="জুম ইন"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Canvas Container with Smooth Scale Transition */}
            <div className="w-full flex justify-center py-2 overflow-x-auto">
              <div
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="shrink-0"
              >
                <IdCardCanvas
                  ref={cardRef}
                  config={config}
                  onUpdateConfig={setConfig}
                  interactive={true}
                />
              </div>
            </div>

            {/* Live Preview Footer Instructions */}
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {language === 'bn'
                    ? 'ছবির ভেতরে মাউস দিয়ে সরাসরি ড্র্যাগ করে পজিশন নিখুঁতভাবে নির্ধারণ করতে পারেন।'
                    : 'Drag directly on the profile circle to adjust your photo positioning.'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberIdCardPage;
