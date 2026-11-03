import React from 'react';
import { IdCardConfig } from './idCardTypes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Camera, 
  RotateCcw, 
  ZoomIn, 
  Move, 
  Type, 
  Sliders, 
  Download, 
  Printer, 
  Save, 
  Layers, 
  RefreshCw,
  Sparkles,
  FileDown
} from 'lucide-react';

interface IdCardCustomizerProps {
  config: IdCardConfig;
  onChange: (updater: (prev: IdCardConfig) => IdCardConfig) => void;
  onPhotoUpload: (file: File) => void;
  onResetPhoto: () => void;
  onResetAll: () => void;
  onSaveConfig: () => void;
  onDownloadPng: () => void;
  onDownloadJpg: () => void;
  onDownloadPdf: () => void;
  onPrint: () => void;
  isExporting?: boolean;
  defaultProfilePhoto?: string | null;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const IdCardCustomizer: React.FC<IdCardCustomizerProps> = ({
  config,
  onChange,
  onPhotoUpload,
  onResetPhoto,
  onResetAll,
  onSaveConfig,
  onDownloadPng,
  onDownloadJpg,
  onDownloadPdf,
  onPrint,
  isExporting = false,
  defaultProfilePhoto,
}) => {
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onPhotoUpload(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Front / Back Switcher */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 w-full">
          <Button
            type="button"
            variant={config.activeSide === 'front' ? 'default' : 'ghost'}
            className={`flex-1 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              config.activeSide === 'front'
                ? 'bg-[#0B6B3A] text-white hover:bg-[#09572F] shadow-sm'
                : 'text-slate-600 dark:text-slate-300'
            }`}
            onClick={() => onChange((prev) => ({ ...prev, activeSide: 'front' }))}
          >
            <Layers className="w-4 h-4 mr-1.5" />
            সামনের পাশ (Front)
          </Button>

          <Button
            type="button"
            variant={config.activeSide === 'back' ? 'default' : 'ghost'}
            className={`flex-1 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              config.activeSide === 'back'
                ? 'bg-[#0B6B3A] text-white hover:bg-[#09572F] shadow-sm'
                : 'text-slate-600 dark:text-slate-300'
            }`}
            onClick={() => onChange((prev) => ({ ...prev, activeSide: 'back' }))}
          >
            <Layers className="w-4 h-4 mr-1.5" />
            পিছনের পাশ (Back)
          </Button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="photo" className="w-full">
        <TabsList className="grid grid-cols-3 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
          <TabsTrigger value="photo" className="rounded-xl text-xs sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-[#0B6B3A] data-[state=active]:shadow-xs">
            <Camera className="w-3.5 h-3.5 mr-1.5" />
            ছবি এডিটর
          </TabsTrigger>
          <TabsTrigger value="info" className="rounded-xl text-xs sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-[#0B6B3A] data-[state=active]:shadow-xs">
            <Type className="w-3.5 h-3.5 mr-1.5" />
            তথ্য ও লেখা
          </TabsTrigger>
          <TabsTrigger value="export" className="rounded-xl text-xs sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-[#0B6B3A] data-[state=active]:shadow-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            ডাউনলোড
          </TabsTrigger>
        </TabsList>

        {/* ========================================================
         * TAB 1: PHOTO EDITOR CONTROLS
         * ======================================================== */}
        <TabsContent value="photo" className="space-y-4 pt-2">
          <Card className="rounded-[20px] border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardContent className="p-4 sm:p-5 space-y-4">
              {/* Photo Upload & Quick Actions */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                  সদস্যের ছবি আপলোড / পরিবর্তন
                </Label>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B6B3A] hover:bg-[#09572F] text-white text-xs font-bold shadow-xs transition-colors">
                    <Camera className="w-4 h-4" />
                    <span>নতুন ছবি আপলোড</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </label>

                  {defaultProfilePhoto && config.photoUrl !== defaultProfilePhoto && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onChange((prev) => ({
                          ...prev,
                          photoUrl: defaultProfilePhoto,
                          photoZoom: 1.0,
                          photoPanX: 0,
                          photoPanY: 0,
                        }))
                      }
                      className="rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      মূল প্রোফাইল ছবি
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onResetPhoto}
                    className="rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    পজিশন রিসেট
                  </Button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  💡 পরামর্শ: লাইভ প্রিভিউতে ছবির উপরে মাউস দিয়ে টেনে (Drag) সহজেই সঠিক পজিশনে বসাতে পারেন।
                </p>
              </div>

              {/* Zoom Slider */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <ZoomIn className="w-4 h-4 text-emerald-600" />
                    জুম (Zoom)
                  </span>
                  <span className="font-mono text-emerald-600">
                    {Math.round(config.photoZoom * 100)}%
                  </span>
                </div>
                <Slider
                  value={[config.photoZoom]}
                  min={0.5}
                  max={2.5}
                  step={0.05}
                  onValueChange={(val) =>
                    onChange((prev) => ({ ...prev, photoZoom: val[0] }))
                  }
                  className="py-1"
                />
              </div>

              {/* Horizontal Pan (X) Slider */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Move className="w-4 h-4 text-emerald-600" />
                    ডানে / বামে সরান (Horizontal)
                  </span>
                  <span className="font-mono text-slate-500">{config.photoPanX}px</span>
                </div>
                <Slider
                  value={[config.photoPanX]}
                  min={-150}
                  max={150}
                  step={2}
                  onValueChange={(val) =>
                    onChange((prev) => ({ ...prev, photoPanX: val[0] }))
                  }
                  className="py-1"
                />
              </div>

              {/* Vertical Pan (Y) Slider */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Move className="w-4 h-4 text-emerald-600 rotate-90" />
                    উপরে / নিচে সরান (Vertical)
                  </span>
                  <span className="font-mono text-slate-500">{config.photoPanY}px</span>
                </div>
                <Slider
                  value={[config.photoPanY]}
                  min={-150}
                  max={150}
                  step={2}
                  onValueChange={(val) =>
                    onChange((prev) => ({ ...prev, photoPanY: val[0] }))
                  }
                  className="py-1"
                />
              </div>

              {/* Rotation Slider */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <RotateCcw className="w-4 h-4 text-emerald-600" />
                    রোটেশন (Rotate)
                  </span>
                  <span className="font-mono text-slate-500">{config.photoRotate}°</span>
                </div>
                <Slider
                  value={[config.photoRotate]}
                  min={-45}
                  max={45}
                  step={1}
                  onValueChange={(val) =>
                    onChange((prev) => ({ ...prev, photoRotate: val[0] }))
                  }
                  className="py-1"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================
         * TAB 2: TEXT & DISPLAY CUSTOMIZATION
         * ======================================================== */}
        <TabsContent value="info" className="space-y-4 pt-2">
          <Card className="rounded-[20px] border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardContent className="p-4 sm:p-5 space-y-4">
              {/* Member Full Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  সদস্যের নাম (Name on Card)
                </Label>
                <Input
                  value={config.displayName}
                  onChange={(e) =>
                    onChange((prev) => ({ ...prev, displayName: e.target.value }))
                  }
                  placeholder="সদস্যের নাম লিখুন"
                  className="rounded-xl border-slate-200 text-sm font-semibold"
                />
              </div>

              {/* Name Font Size Picker */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  নামের ফন্ট সাইজ
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <Button
                      key={size}
                      type="button"
                      variant={config.nameFontSize === size ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        onChange((prev) => ({ ...prev, nameFontSize: size }))
                      }
                      className={`rounded-xl text-xs font-bold ${
                        config.nameFontSize === size
                          ? 'bg-[#0B6B3A] text-white hover:bg-[#09572F]'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {size === 'small' ? 'ছোট' : size === 'large' ? 'বড়' : 'সাধারণ'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* ID Number and Serial Number in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    ID NUMBER (বাম পাশে)
                  </Label>
                  <Input
                    value={config.displayIdNumber}
                    onChange={(e) =>
                      onChange((prev) => ({ ...prev, displayIdNumber: e.target.value }))
                    }
                    placeholder="01"
                    className="rounded-xl border-slate-200 text-sm font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    সদস্য নং (ডান পাশের ব্যাজ)
                  </Label>
                  <Input
                    value={config.displayMemberSerial}
                    onChange={(e) =>
                      onChange((prev) => ({ ...prev, displayMemberSerial: e.target.value }))
                    }
                    placeholder="01"
                    className="rounded-xl border-slate-200 text-sm font-bold"
                  />
                </div>
              </div>

              {/* Blood Group & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    রক্তের গ্রুপ
                  </Label>
                  <div className="flex gap-1.5 flex-wrap">
                    {BLOOD_GROUPS.map((bg) => (
                      <button
                        key={bg}
                        type="button"
                        onClick={() =>
                          onChange((prev) => ({ ...prev, displayBloodGroup: bg }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          config.displayBloodGroup === bg
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    মোবাইল নম্বর
                  </Label>
                  <Input
                    value={config.displayPhone}
                    onChange={(e) =>
                      onChange((prev) => ({ ...prev, displayPhone: e.target.value }))
                    }
                    placeholder="01712-345678"
                    className="rounded-xl border-slate-200 text-sm font-mono font-bold"
                  />
                </div>
              </div>

              {/* Footer Attribution Text */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  নিচের টেক্সট / ওয়াটারমার্ক
                </Label>
                <Input
                  value={config.footerText}
                  onChange={(e) =>
                    onChange((prev) => ({ ...prev, footerText: e.target.value }))
                  }
                  placeholder="Design by Mehedi"
                  className="rounded-xl border-slate-200 text-sm italic font-medium"
                />
              </div>

              {/* Visibility Toggles */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  তথ্য প্রদর্শন ও লুকানো
                </Label>

                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    রক্তের গ্রুপ প্রদর্শন
                  </span>
                  <Switch
                    checked={config.showBloodGroup}
                    onCheckedChange={(checked) =>
                      onChange((prev) => ({ ...prev, showBloodGroup: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    মোবাইল নম্বর প্রদর্শন
                  </span>
                  <Switch
                    checked={config.showPhone}
                    onCheckedChange={(checked) =>
                      onChange((prev) => ({ ...prev, showPhone: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    সদস্য নং ব্যাজ প্রদর্শন
                  </span>
                  <Switch
                    checked={config.showSerialBadge}
                    onCheckedChange={(checked) =>
                      onChange((prev) => ({ ...prev, showSerialBadge: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    নিচের ওয়াটারমার্ক টেক্সট প্রদর্শন
                  </span>
                  <Switch
                    checked={config.showFooterText}
                    onCheckedChange={(checked) =>
                      onChange((prev) => ({ ...prev, showFooterText: checked }))
                    }
                  />
                </div>
              </div>

              {/* Reset All */}
              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onResetAll}
                  className="rounded-xl text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  সকল কাস্টমাইজেশন রিসেট
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================
         * TAB 3: DOWNLOAD & EXPORT SYSTEM
         * ======================================================== */}
        <TabsContent value="export" className="space-y-4 pt-2">
          <Card className="rounded-[20px] border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 rounded-2xl p-3.5">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700 dark:text-slate-200 space-y-0.5">
                    <p className="font-bold text-[#0B6B3A] dark:text-emerald-400">
                      হাই-রেজোলিউশন আইডি কার্ড রেডি!
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      উচ্চ মানের প্রিন্ট উপযোগী ফরম্যাটে (১০২৪×১৫৩৬+ পিক্সেল) কার্ডটি ডাউনলোড করতে পারেন। বাংলা ফন্ট এবং ব্যাকগ্রাউন্ড অবিকল সংরক্ষিত থাকবে।
                    </p>
                  </div>
                </div>
              </div>

              {/* Download Buttons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Button
                  type="button"
                  onClick={onDownloadPng}
                  disabled={isExporting}
                  className="rounded-xl font-bold text-xs sm:text-sm bg-[#0B6B3A] hover:bg-[#09572F] text-white shadow-sm flex items-center justify-center gap-2 h-11"
                >
                  <Download className="w-4 h-4" />
                  <span>PNG ডাউনলোড (HD)</span>
                </Button>

                <Button
                  type="button"
                  onClick={onDownloadJpg}
                  disabled={isExporting}
                  variant="outline"
                  className="rounded-xl font-bold text-xs sm:text-sm border-slate-300 hover:bg-slate-100 text-slate-700 flex items-center justify-center gap-2 h-11"
                >
                  <FileDown className="w-4 h-4 text-emerald-600" />
                  <span>JPG ডাউনলোড</span>
                </Button>

                <Button
                  type="button"
                  onClick={onDownloadPdf}
                  disabled={isExporting}
                  className="rounded-xl font-bold text-xs sm:text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center justify-center gap-2 h-11"
                >
                  <FileDown className="w-4 h-4" />
                  <span>PDF ডাউনলোড</span>
                </Button>

                <Button
                  type="button"
                  onClick={onPrint}
                  disabled={isExporting}
                  variant="secondary"
                  className="rounded-xl font-bold text-xs sm:text-sm bg-slate-800 hover:bg-slate-900 text-white shadow-sm flex items-center justify-center gap-2 h-11"
                >
                  <Printer className="w-4 h-4" />
                  <span>কার্ড প্রিন্ট করুন</span>
                </Button>
              </div>

              {/* Save Preferences Button */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  onClick={onSaveConfig}
                  className="w-full rounded-xl font-bold text-xs sm:text-sm bg-[#9BD038] hover:bg-[#88bb2b] text-[#14231B] shadow-sm flex items-center justify-center gap-2 h-10"
                >
                  <Save className="w-4 h-4" />
                  <span>কাস্টমাইজেশন ব্রাউজারে সংরক্ষণ করুন</span>
                </Button>
                <p className="text-[11px] text-slate-400 text-center mt-1.5">
                  পরবর্তীতে আবার আসলে আপনার সংরক্ষিত পজিশন ও সেটিংস স্বয়ংক্রিয়ভাবে লোড হবে।
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
