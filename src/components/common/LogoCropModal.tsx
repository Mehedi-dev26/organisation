import React, { useState, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Check, 
  X, 
  Crop, 
  Circle, 
  Square,
  Sparkles,
  Loader2
} from 'lucide-react';

interface LogoCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onCropSave: (croppedBlob: Blob, previewUrl: string) => Promise<void> | void;
  isSaving?: boolean;
}

// Canvas helper to produce pixel-perfect cropped PNG blob preserving alpha transparency
const createCroppedImageBlob = async (
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<{ blob: Blob; url: string }> => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (err) => reject(err));
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  const rotRad = (rotation * Math.PI) / 180;

  // Calculate bounding box for rotation
  const { width: bBoxWidth, height: bBoxHeight } = calculateBoundingBox(
    image.width,
    image.height,
    rotation
  );

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate canvas context to center point to rotate and draw image
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw rotated image
  ctx.drawImage(image, 0, 0);

  // Crop the requested rectangle from the rotated canvas
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('Cropped canvas context not available');
  }

  // Set export size - max 512x512 for ultra-crisp web and print display
  const targetSize = Math.min(512, Math.max(256, pixelCrop.width));
  croppedCanvas.width = targetSize;
  croppedCanvas.height = targetSize;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetSize,
    targetSize
  );

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'));
          return;
        }
        const url = URL.createObjectURL(blob);
        resolve({ blob, url });
      },
      'image/png',
      0.95
    );
  });
};

const calculateBoundingBox = (width: number, height: number, rotation: number) => {
  const rotRad = (rotation * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
};

export const LogoCropModal: React.FC<LogoCropModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  onCropSave,
  isSaving = false,
}) => {
  const { language } = useLanguage();
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [cropShape, setCropShape] = useState<'round' | 'rect'>('round');
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      setIsProcessing(true);
      const { blob, url } = await createCroppedImageBlob(imageSrc, croppedAreaPixels, rotation);
      await onCropSave(blob, url);
      onClose();
    } catch (error) {
      console.error('Error cropping logo:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  if (!imageSrc) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && !isProcessing && onClose()}>
      <DialogContent className="max-w-2xl sm:max-w-3xl p-0 overflow-hidden rounded-3xl border border-[#11DFC0]/40 shadow-[0_20px_60px_rgba(17,223,192,0.18)] bg-white dark:bg-slate-950">
        <DialogHeader className="p-5 sm:p-6 bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-white dark:from-emerald-950/40 dark:to-slate-900 border-b border-[#11DFC0]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#11DFC0]/20 border border-[#11DFC0]/50 flex items-center justify-center text-teal-800 dark:text-teal-300 shadow-2xs">
                <Crop className="w-5 h-5 stroke-[2.4]" />
              </div>
              <div>
                <DialogTitle className="font-heading text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{language === 'bn' ? 'লোগো ক্রপ ও অ্যাডজাস্টমেন্ট' : 'Crop & Adjust Logo'}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-[#11DFC0]/20 text-teal-900 border border-[#11DFC0]/40">
                    {language === 'bn' ? 'অটো সাইজিং' : 'Auto Sizing'}
                  </span>
                </DialogTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'bn'
                    ? 'লোগোর মূল অংশটি সেন্টারে এনে ক্রপ করুন। এটি ওয়েবসাইটের হেডার, ফুটার ও ভাউচারে অটোমেটিক পারফেক্ট দেখাবে।'
                    : 'Position the logo inside the crop area. It will automatically adjust everywhere across the site.'}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Interactive Cropper Area */}
        <div className="p-5 sm:p-6 space-y-5">
          <div className="relative w-full h-[280px] sm:h-[340px] bg-slate-950 rounded-2xl overflow-hidden shadow-inner border border-slate-800">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape={cropShape}
              showGrid={true}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />

            {/* Floating Shape Indicator Badge */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1.5 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-[#11DFC0]" />
              <span>
                {cropShape === 'round' 
                  ? (language === 'bn' ? 'গোলাকার ক্রপ (1:1)' : 'Circular Crop (1:1)') 
                  : (language === 'bn' ? 'বর্গাকার ক্রপ (1:1)' : 'Square Crop (1:1)')}
              </span>
            </div>
          </div>

          {/* Controls Bar: Zoom, Rotate, Shape Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {/* Zoom Slider */}
            <div className="sm:col-span-7 flex items-center gap-3">
              <ZoomOut className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="flex-1">
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.05}
                  onValueChange={(val) => setZoom(val[0])}
                  className="cursor-pointer"
                />
              </div>
              <ZoomIn className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 w-10 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Rotate & Shape Buttons */}
            <div className="sm:col-span-5 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRotate}
                className="gap-1.5 text-xs font-bold rounded-xl border-slate-300 dark:border-slate-700 hover:bg-[#11DFC0]/15"
              >
                <RotateCw className="w-3.5 h-3.5 text-teal-600" />
                <span>{language === 'bn' ? 'ঘোরান' : 'Rotate'}</span>
              </Button>

              {/* Shape Toggle */}
              <div className="inline-flex p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setCropShape('round')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    cropShape === 'round'
                      ? 'bg-[#11DFC0] text-slate-950 font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title={language === 'bn' ? 'গোলাকার' : 'Circle'}
                >
                  <Circle className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCropShape('rect')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    cropShape === 'rect'
                      ? 'bg-[#11DFC0] text-slate-950 font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title={language === 'bn' ? 'বর্গাকার' : 'Square'}
                >
                  <Square className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Helper Tips */}
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 text-xs text-emerald-900 dark:text-emerald-300">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">💡 {language === 'bn' ? 'টিপস:' : 'Tip:'}</span>
            <span>
              {language === 'bn'
                ? 'মাউস দিয়ে টেনে লোগোটি সেন্টারে রাখুন। জুম করে চারপাশের অপ্রয়োজনীয় বর্ডার বা খালি জায়গা বাদ দিতে পারেন।'
                : 'Drag the image to center the emblem, and use zoom to crop out extra padding or background.'}
            </span>
          </div>
        </div>

        <DialogFooter className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving || isProcessing}
            className="rounded-xl border-slate-300 dark:border-slate-700 font-bold text-xs sm:text-sm px-4"
          >
            <X className="w-4 h-4 mr-1.5" />
            {language === 'bn' ? 'বাতিল' : 'Cancel'}
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isProcessing}
            className="rounded-xl bg-[#11DFC0] hover:bg-[#0fcab0] text-slate-950 font-black text-xs sm:text-sm px-5 py-2 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] gap-2"
          >
            {isSaving || isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>{language === 'bn' ? 'ক্রপ ও সেভ হচ্ছে...' : 'Cropping & Saving...'}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{language === 'bn' ? 'ক্রপ নিশ্চিত করুন ও সেভ করুন' : 'Confirm Crop & Save'}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LogoCropModal;
