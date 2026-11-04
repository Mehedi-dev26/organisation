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
  Loader2,
  Maximize2,
  Wand2
} from 'lucide-react';

interface LogoCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onCropSave: (croppedBlob: Blob, previewUrl: string) => Promise<void> | void;
  isSaving?: boolean;
  title?: string;
  subtitle?: string;
  defaultCropShape?: 'round' | 'rect';
  defaultAspect?: number;
}

// Canvas helper to automatically remove white or near-solid background and make transparent PNG
const removeCanvasBackground = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tolerance = 38
) => {
  const imgData = ctx.getImageData(0, 0, width, height);
  const d = imgData.data;

  // Sample corner pixels to detect solid background color
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
    [Math.floor(width / 2), 0],
    [0, Math.floor(height / 2)],
    [width - 1, Math.floor(height / 2)],
    [Math.floor(width / 2), height - 1],
  ];

  let totalR = 0, totalG = 0, totalB = 0, count = 0;
  for (const [cx, cy] of corners) {
    const idx = (cy * width + cx) * 4;
    if (d[idx + 3] > 100) {
      totalR += d[idx];
      totalG += d[idx + 1];
      totalB += d[idx + 2];
      count++;
    }
  }

  const bgR = count > 0 ? totalR / count : 255;
  const bgG = count > 0 ? totalG / count : 255;
  const bgB = count > 0 ? totalB / count : 255;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const a = d[i + 3];

    if (a === 0) continue;

    // Euclidean distance to sampled background color
    const distToBg = Math.sqrt(
      Math.pow(r - bgR, 2) +
      Math.pow(g - bgG, 2) +
      Math.pow(b - bgB, 2)
    );

    // Also consider purely white/off-white pixels
    const isNearWhite = r >= 235 && g >= 235 && b >= 235;

    if (distToBg < tolerance || isNearWhite) {
      if (distToBg > tolerance * 0.75 && !isNearWhite) {
        const factor = (distToBg - tolerance * 0.75) / (tolerance * 0.25);
        d[i + 3] = Math.round(a * Math.max(0, Math.min(1, factor)));
      } else {
        d[i + 3] = 0; // Fully transparent
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
};

// Canvas helper to produce pixel-perfect cropped PNG blob preserving alpha transparency & zoom-out padding
const createCroppedImageBlob = async (
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  shouldRemoveBg = false
): Promise<{ blob: Blob; url: string }> => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (err) => reject(err));
    if (imageSrc.startsWith('http')) {
      img.setAttribute('crossOrigin', 'anonymous');
    }
    img.src = imageSrc;
  });

  const rotRad = (rotation * Math.PI) / 180;
  const { width: bBoxWidth, height: bBoxHeight } = calculateBoundingBox(
    image.width,
    image.height,
    rotation
  );

  // 1. Draw rotated source image on intermediate canvas
  const rotCanvas = document.createElement('canvas');
  rotCanvas.width = bBoxWidth;
  rotCanvas.height = bBoxHeight;
  const rotCtx = rotCanvas.getContext('2d');
  if (!rotCtx) throw new Error('Rotated canvas context not available');

  rotCtx.translate(bBoxWidth / 2, bBoxHeight / 2);
  rotCtx.rotate(rotRad);
  rotCtx.translate(-image.width / 2, -image.height / 2);
  rotCtx.drawImage(image, 0, 0);

  // 2. Target canvas with maximum dimension 512px maintaining aspect ratio
  const maxDim = 512;
  const rawW = Math.max(1, pixelCrop.width);
  const rawH = Math.max(1, pixelCrop.height);
  const scale = Math.min(1, maxDim / Math.max(rawW, rawH));
  const targetWidth = Math.max(96, Math.round(rawW * scale));
  const targetHeight = Math.max(96, Math.round(rawH * scale));

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = targetWidth;
  croppedCanvas.height = targetHeight;
  const croppedCtx = croppedCanvas.getContext('2d');
  if (!croppedCtx) throw new Error('Cropped canvas context not available');

  // Handle zoom-out where pixelCrop.x or y can be negative (padded/letterboxed inside canvas)
  const scaleRatio = targetWidth / pixelCrop.width;

  const sx = Math.max(0, pixelCrop.x);
  const sy = Math.max(0, pixelCrop.y);
  const sWidth = Math.min(bBoxWidth - sx, pixelCrop.width - (sx - pixelCrop.x));
  const sHeight = Math.min(bBoxHeight - sy, pixelCrop.height - (sy - pixelCrop.y));

  const dx = Math.max(0, -pixelCrop.x * scaleRatio);
  const dy = Math.max(0, -pixelCrop.y * scaleRatio);
  const dWidth = Math.max(0, sWidth * scaleRatio);
  const dHeight = Math.max(0, sHeight * scaleRatio);

  if (sWidth > 0 && sHeight > 0 && dWidth > 0 && dHeight > 0) {
    croppedCtx.drawImage(
      rotCanvas,
      sx,
      sy,
      sWidth,
      sHeight,
      dx,
      dy,
      dWidth,
      dHeight
    );
  }

  // 3. Remove solid / white background if enabled
  if (shouldRemoveBg) {
    removeCanvasBackground(croppedCtx, targetWidth, targetHeight);
  }

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
  title,
  subtitle,
  defaultCropShape = 'round',
  defaultAspect = 1,
}) => {
  const { language } = useLanguage();
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.85); // Default to comfortable fit
  const [rotation, setRotation] = useState(0);
  const [cropShape, setCropShape] = useState<'round' | 'rect'>(defaultCropShape);
  const [aspect, setAspect] = useState<number>(defaultAspect);
  const [removeBg, setRemoveBg] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync defaultCropShape and defaultAspect when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCropShape(defaultCropShape);
      setAspect(defaultAspect);
      setZoom(0.85);
      setRotation(0);
      setCrop({ x: 0, y: 0 });
      setRemoveBg(false);
    }
  }, [isOpen, defaultCropShape, defaultAspect]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      setIsProcessing(true);
      const { blob, url } = await createCroppedImageBlob(imageSrc, croppedAreaPixels, rotation, removeBg);
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

  // Quick helper to fit entire logo into canvas without cropping
  const handleFitEntireLogo = () => {
    setZoom(0.65);
    setCrop({ x: 0, y: 0 });
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
                  <span>{title || (language === 'bn' ? 'লোগো ক্রপ ও অ্যাডজাস্টমেন্ট' : 'Crop & Adjust Logo')}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-[#11DFC0]/20 text-teal-900 border border-[#11DFC0]/40">
                    {language === 'bn' ? 'জুম আউট ও ব্যাকগ্রাউন্ড রিমুভ' : 'Zoom Out & Transparent'}
                  </span>
                </DialogTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {subtitle || (language === 'bn'
                    ? 'জুম আউট করে সম্পূর্ণ লোগোটি ফ্রেমে আনুন অথবা সাদা ব্যাকগ্রাউন্ড মুছে স্বচ্ছ পিএনজি তৈরি করুন।'
                    : 'Zoom out to fit entire logo or remove white background for transparent PNG.')}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Interactive Cropper Area */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="relative w-full h-[280px] sm:h-[340px] bg-slate-950 rounded-2xl overflow-hidden shadow-inner border border-slate-800">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              cropShape={cropShape}
              showGrid={true}
              minZoom={0.2}
              maxZoom={4}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />

            {/* Floating Shape & Aspect Indicator Badge */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1.5 border border-white/20 shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-[#11DFC0]" />
              <span>
                {cropShape === 'round'
                  ? (language === 'bn' ? 'গোলাকার ক্রপ (1:1)' : 'Circular (1:1)')
                  : (aspect === 1
                    ? (language === 'bn' ? 'বর্গাকার ক্রপ (1:1)' : 'Square (1:1)')
                    : (aspect === 4 / 3
                      ? (language === 'bn' ? 'চওড়া ক্রপ (4:3)' : 'Landscape (4:3)')
                      : (language === 'bn' ? 'ওয়াইড ক্রপ (16:9)' : 'Wide (16:9)')))}
              </span>
            </div>

            {/* Active Background Removal Indicator */}
            {removeBg && (
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-purple-600/90 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1.5 border border-purple-400 shadow-md animate-pulse">
                <Wand2 className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? '✨ ব্যাকগ্রাউন্ড স্বচ্ছ হবে' : '✨ Transparent Output'}</span>
              </div>
            )}
          </div>

          {/* Smart Background Removal Toggle Box */}
          <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-slate-900 border border-purple-200 dark:border-purple-800/60 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-600/10 dark:bg-purple-500/20 border border-purple-300 dark:border-purple-700 flex items-center justify-center text-purple-700 dark:text-purple-300 shrink-0">
                <Wand2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{language === 'bn' ? 'স্বচ্ছ ব্যাকগ্রাউন্ড (Background Remove)' : 'Transparent Background'}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-extrabold bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 border border-purple-300">
                    Auto Clean
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'bn'
                    ? 'লোগোর চারপাশের সাদা বা হালকা ব্যাকগ্রাউন্ড মুছে স্বচ্ছ করবে, ফলে লোগোটি যেকোনো সাইটের ডিজাইনে মিশে যাবে।'
                    : 'Removes white/light background to produce a transparent PNG logo.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRemoveBg(!removeBg)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 ${
                removeBg
                  ? 'bg-purple-600 text-white shadow-purple-600/30'
                  : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
              }`}
            >
              <Wand2 className={`w-3.5 h-3.5 ${removeBg ? 'animate-pulse' : 'text-purple-600'}`} />
              <span>{removeBg ? (language === 'bn' ? 'সক্রিয় রয়েছে' : 'Active') : (language === 'bn' ? 'রিমুভ করুন' : 'Remove BG')}</span>
            </button>
          </div>

          {/* Controls Bar: Zoom In/Out, Fit, Rotate, Aspect Ratio */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {/* Zoom Controls */}
            <div className="sm:col-span-6 flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleFitEntireLogo}
                className="px-2 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1 shadow-2xs cursor-pointer shrink-0"
                title={language === 'bn' ? 'সম্পূর্ণ লোগো ফ্রেমে আনুন' : 'Fit to Frame'}
              >
                <Maximize2 className="w-3 h-3 text-emerald-600" />
                <span>{language === 'bn' ? 'ফিট' : 'Fit'}</span>
              </button>

              <ZoomOut className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="flex-1">
                <Slider
                  value={[zoom]}
                  min={0.2}
                  max={3}
                  step={0.02}
                  onValueChange={(val) => setZoom(val[0])}
                  className="cursor-pointer"
                />
              </div>
              <ZoomIn className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 w-12 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Rotate & Aspect Ratio Toggle */}
            <div className="sm:col-span-6 flex items-center justify-end gap-2 flex-wrap">
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

              {/* Shape & Aspect Switcher */}
              <div className="inline-flex p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setCropShape('round');
                    setAspect(1);
                  }}
                  className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    cropShape === 'round'
                      ? 'bg-[#11DFC0] text-slate-950 font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title={language === 'bn' ? 'গোলাকার (1:1)' : 'Circle (1:1)'}
                >
                  <Circle className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCropShape('rect');
                    setAspect(1);
                  }}
                  className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    cropShape === 'rect' && aspect === 1
                      ? 'bg-[#11DFC0] text-slate-950 font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title={language === 'bn' ? 'বর্গাকার (1:1)' : 'Square (1:1)'}
                >
                  <Square className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCropShape('rect');
                    setAspect(4 / 3);
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    cropShape === 'rect' && aspect === 4 / 3
                      ? 'bg-[#11DFC0] text-slate-950 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title={language === 'bn' ? 'চওড়া (4:3)' : 'Landscape (4:3)'}
                >
                  4:3
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCropShape('rect');
                    setAspect(16 / 9);
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    cropShape === 'rect' && aspect === 16 / 9
                      ? 'bg-[#11DFC0] text-slate-950 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title={language === 'bn' ? 'ওয়াইড (16:9)' : 'Wide (16:9)'}
                >
                  16:9
                </button>
              </div>
            </div>
          </div>

          {/* Quick Helper Tip */}
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 text-xs text-emerald-900 dark:text-emerald-300">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">💡 {language === 'bn' ? 'টিপস:' : 'Tip:'}</span>
            <span>
              {language === 'bn'
                ? 'লোগো কেটে যাওয়া ঠেকাতে "ফিট" বাটনে ক্লিক করুন অথবা জুম স্লাইডার বামে টেনে জুম আউট করুন। সাদা ব্যাকগ্রাউন্ড সরাতে "রিমুভ করুন" বাটনে চাপ দিন।'
                : 'Click "Fit" or zoom out to prevent parts of the logo from cutting off. Use "Remove BG" to make it transparent.'}
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
