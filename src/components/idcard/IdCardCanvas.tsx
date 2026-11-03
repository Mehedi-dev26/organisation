import React, { forwardRef, useState, useRef, useCallback } from 'react';
import { IdCardConfig, toBengaliDigits } from './idCardTypes';
import { Phone, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';

interface IdCardCanvasProps {
  config: IdCardConfig;
  onUpdateConfig?: (updater: (prev: IdCardConfig) => IdCardConfig) => void;
  interactive?: boolean;
}

export const IdCardCanvas = forwardRef<HTMLDivElement, IdCardCanvasProps>(
  ({ config, onUpdateConfig, interactive = true }, ref) => {
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef<{ x: number; y: number; initialPanX: number; initialPanY: number }>({
      x: 0,
      y: 0,
      initialPanX: 0,
      initialPanY: 0,
    });

    // Handle mouse drag on the photo circle
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      if (!interactive || !onUpdateConfig) return;
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        initialPanX: config.photoPanX,
        initialPanY: config.photoPanY,
      };
    }, [interactive, onUpdateConfig, config.photoPanX, config.photoPanY]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
      if (!isDragging || !onUpdateConfig) return;
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      onUpdateConfig((prev) => ({
        ...prev,
        photoPanX: Math.round(dragStartRef.current.initialPanX + deltaX),
        photoPanY: Math.round(dragStartRef.current.initialPanY + deltaY),
      }));
    }, [isDragging, onUpdateConfig]);

    const handleMouseUpOrLeave = useCallback(() => {
      setIsDragging(false);
    }, []);

    // Handle touch drag on mobile
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
      if (!interactive || !onUpdateConfig || e.touches.length === 0) return;
      const touch = e.touches[0];
      setIsDragging(true);
      dragStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        initialPanX: config.photoPanX,
        initialPanY: config.photoPanY,
      };
    }, [interactive, onUpdateConfig, config.photoPanX, config.photoPanY]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
      if (!isDragging || !onUpdateConfig || e.touches.length === 0) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStartRef.current.x;
      const deltaY = touch.clientY - dragStartRef.current.y;
      onUpdateConfig((prev) => ({
        ...prev,
        photoPanX: Math.round(dragStartRef.current.initialPanX + deltaX),
        photoPanY: Math.round(dragStartRef.current.initialPanY + deltaY),
      }));
    }, [isDragging, onUpdateConfig]);

    // Name font size helper
    const getNameFontSizeClass = () => {
      switch (config.nameFontSize) {
        case 'small':
          return 'text-lg sm:text-xl';
        case 'large':
          return 'text-2xl sm:text-3xl';
        case 'medium':
        default:
          return 'text-xl sm:text-2xl';
      }
    };

    return (
      <div
        ref={ref}
        id="somoyer-batighor-id-card-canvas"
        className="relative w-[500px] h-[750px] max-w-full aspect-[2/3] overflow-hidden select-none bg-[#073D1E] shadow-2xl rounded-[18px] text-white"
        style={{
          fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif",
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.15)',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUpOrLeave}
      >
        {config.activeSide === 'front' ? (
          /* ========================================================
           * FRONT SIDE OF ID CARD (EXACT REPLICA OF REFERENCE IMAGE)
           * ======================================================== */
          <>
            {/* 1. Clean Green Rural Background Image */}
            <img
              src="/images/id-card-bg.jpg"
              alt="Rural Landscape Background"
              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
              crossOrigin="anonymous"
              draggable={false}
            />

            {/* Subtle soft gradient overlay on top for perfect logo & slogan contrast */}
            <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-black/25 via-black/10 to-transparent pointer-events-none" />

            {/* 2. Top Header Section: Logo (Left) + Slogan (Right) */}
            <div className="absolute top-5 inset-x-6 flex items-start justify-between z-20 pointer-events-none">
              {/* Official Logo with Soft White Glow */}
              <div className="relative pointer-events-auto">
                <div
                  className="w-36 sm:w-40 h-auto filter drop-shadow-[0_2px_10px_rgba(255,255,255,0.7)] drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)] transition-transform hover:scale-105"
                >
                  <img
                    src="/images/id-card-logo-transparent.png"
                    alt="সময়ের বাতিঘর লোগো"
                    className="w-full h-auto object-contain"
                    crossOrigin="anonymous"
                    draggable={false}
                  />
                </div>
              </div>

              {/* Organization Slogan with Golden Bengali Quotes */}
              <div className="flex flex-col items-end text-right select-none pt-1">
                <div className="flex items-start gap-1">
                  <span className="text-[#FFD700] font-serif text-3xl font-black leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    “
                  </span>
                  <div className="flex flex-col items-end leading-tight tracking-wide">
                    <span className="text-white font-extrabold text-sm sm:text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      স্বপ্নের সমাজ গড়তে
                    </span>
                    <span className="text-white font-extrabold text-sm sm:text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      আমরা ঐক্যবদ্ধ
                    </span>
                  </div>
                  <span className="text-[#FFD700] font-serif text-3xl font-black leading-none self-end drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    ”
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Vertical ID NUMBER on the Left Side */}
            <div
              className="absolute left-4 sm:left-5 top-[39%] -translate-y-1/2 flex items-center gap-2 select-none z-20"
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
              }}
            >
              <span className="text-white font-black text-xs sm:text-[13px] tracking-[0.25em] uppercase drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)]">
                ID NUMBER
              </span>
              <div className="w-[3px] h-6 bg-[#9BD038] shadow-[0_0_8px_#9BD038] rounded-full" />
              <span className="text-[#FFE21D] font-black text-base sm:text-lg tracking-wider drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                {config.displayIdNumber || '01'}
              </span>
            </div>

            {/* 4. Center Circular Member Profile Photo with Multi-Layered Rings */}
            <div className="absolute top-[23%] left-1/2 -translate-x-1/2 z-20">
              {/* Outer Glow & Lime Ring */}
              <div className="relative p-2.5 rounded-full bg-gradient-to-tr from-[#22C55E] via-[#4ADE80] to-[#86EFAC] shadow-[0_16px_40px_rgba(0,0,0,0.55)]">
                {/* Middle Crisp White Ring */}
                <div className="p-1.5 rounded-full bg-white shadow-inner">
                  {/* Inner Deep Green Border */}
                  <div className="p-1 rounded-full bg-[#15803D]">
                    {/* Photo Viewport Container */}
                    <div
                      className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden bg-slate-900 relative ${
                        interactive ? 'cursor-grab active:cursor-grabbing' : ''
                      }`}
                      onMouseDown={handleMouseDown}
                      onTouchStart={handleTouchStart}
                      title={interactive ? 'ছবিটি ড্র্যাগ করে পজিশন পরিবর্তন করুন' : undefined}
                    >
                      {config.photoUrl ? (
                        <img
                          src={config.photoUrl}
                          alt={config.displayName}
                          className="w-full h-full object-cover select-none pointer-events-none transition-none"
                          style={{
                            transform: `translate(${config.photoPanX}px, ${config.photoPanY}px) scale(${config.photoZoom}) rotate(${config.photoRotate}deg)`,
                            transformOrigin: 'center center',
                          }}
                          crossOrigin="anonymous"
                          draggable={false}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0B6B3A] to-[#04331B] text-white">
                          <span className="text-4xl sm:text-5xl font-black">
                            {config.displayName ? config.displayName.charAt(0) : 'স'}
                          </span>
                          <span className="text-[10px] text-emerald-200 mt-1">ছবি আপলোড করুন</span>
                        </div>
                      )}

                      {/* Interactive Drag Hint Overlay */}
                      {interactive && (
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors pointer-events-none flex items-center justify-center opacity-0 hover:opacity-100">
                          <span className="text-[10px] bg-black/60 text-white px-2 py-1 rounded-full backdrop-blur-xs font-medium">
                            পজিশন করতে টানুন
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Lower Content Group: Yellow Name Banner + Leaf Member Serial + Info Card */}
            <div className="absolute top-[57%] inset-x-5 z-20 flex flex-col items-center">
              {/* Relative Container for Yellow Name Banner and Overlapping Leaf Badge */}
              <div className="relative w-full max-w-[420px] flex items-center">
                {/* Vibrant Yellow Curved Name Ribbon */}
                <div
                  className="w-[82%] sm:w-[84%] h-14 sm:h-16 rounded-l-[28px] rounded-r-[12px] bg-gradient-to-r from-[#FFF438] via-[#FFD700] to-[#FFAE00] border-[3px] border-[#15803D] shadow-[0_8px_25px_rgba(0,0,0,0.35)] flex items-center pl-6 pr-4"
                >
                  <h3
                    className={`font-black text-[#14231B] truncate leading-tight tracking-tight drop-shadow-xs ${getNameFontSizeClass()}`}
                    title={config.displayName}
                  >
                    {config.displayName || 'সদস্যের নাম'}
                  </h3>
                </div>

                {/* Overlapping Leaf/Droplet Member Number Badge */}
                {config.showSerialBadge && (
                  <div
                    className="absolute -right-1 sm:right-0 top-1/2 -translate-y-1/2 w-20 h-24 sm:w-22 sm:h-26 rounded-[34px] rounded-br-[12px] bg-white border-[4px] border-[#15803D] shadow-[0_10px_28px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center p-1 z-30 transform hover:scale-105 transition-transform"
                    style={{
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3), inset 0 0 0 2px #9BD038',
                    }}
                  >
                    <span className="text-[#0B6B3A] font-black text-xs sm:text-[13px] leading-tight">
                      সদস্য
                    </span>
                    <span className="text-[#0B6B3A] font-black text-xs sm:text-[13px] leading-tight">
                      নং
                    </span>
                    <span className="text-[#0B6B3A] font-black text-2xl sm:text-3xl leading-none tracking-tight mt-0.5">
                      {toBengaliDigits(config.displayMemberSerial || '০১')}
                    </span>
                  </div>
                )}
              </div>

              {/* 6. Lower Deep Green Pill Card: Blood Group + Mobile Number */}
              <div className="w-full max-w-[420px] mt-3">
                <div
                  className="rounded-[22px] bg-gradient-to-b from-[#094522] via-[#052C16] to-[#032010] border-[3px] border-[#9BD038] shadow-[0_12px_32px_rgba(0,0,0,0.45)] px-4 py-2.5 flex items-center justify-between"
                  style={{
                    boxShadow: '0 12px 30px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.2)',
                  }}
                >
                  {/* Left Column: Blood Group */}
                  {config.showBloodGroup && (
                    <div className="flex items-center gap-2.5 min-w-0 pr-3">
                      {/* Stylized Crimson Red Blood Droplet SVG */}
                      <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center filter drop-shadow-[0_2px_5px_rgba(239,68,68,0.6)]">
                        <svg
                          viewBox="0 0 24 24"
                          className="w-full h-full fill-red-600 stroke-white stroke-1"
                        >
                          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                          <circle cx="10" cy="11" r="1.5" fill="white" opacity="0.6" />
                        </svg>
                      </div>

                      <div className="flex flex-col leading-tight">
                        <span className="text-emerald-100 font-semibold text-[11px] sm:text-xs">
                          রক্তের গ্রুপ
                        </span>
                        <span className="text-white font-black text-xl sm:text-2xl leading-tight tracking-wide">
                          {config.displayBloodGroup || 'জানা নেই'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Vertical Divider */}
                  {config.showBloodGroup && config.showPhone && (
                    <div className="w-[2px] h-10 bg-[#9BD038]/50 shrink-0 mx-1" />
                  )}

                  {/* Right Column: Mobile Number */}
                  {config.showPhone && (
                    <div className="flex items-center gap-2.5 min-w-0 pl-2 flex-1 justify-end">
                      {/* White Phone Icon in Green Circle */}
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 border border-white/30 shrink-0 flex items-center justify-center text-white shadow-xs">
                        <Phone className="w-4 h-4 fill-white" />
                      </div>

                      <div className="flex flex-col leading-tight text-right">
                        <span className="text-emerald-100 font-semibold text-[11px] sm:text-xs">
                          মোবাইল নম্বর
                        </span>
                        <span className="text-white font-black text-base sm:text-lg font-mono tracking-wider leading-tight">
                          {config.displayPhone || '০১৭১২-৩৪৫৬৭৮'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 7. Bottom Signature / Attribution Watermark */}
              {config.showFooterText && (
                <div className="mt-8 flex items-center justify-center gap-3 select-none">
                  <div className="w-12 sm:w-16 h-[1.5px] bg-gradient-to-r from-transparent to-[#FFE21D]/70" />
                  <span className="text-[#FFE21D] font-semibold italic text-xs tracking-widest drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                    {config.footerText || 'Design by Mehedi'}
                  </span>
                  <div className="w-12 sm:w-16 h-[1.5px] bg-gradient-to-l from-transparent to-[#FFE21D]/70" />
                </div>
              )}
            </div>
          </>
        ) : (
          /* ========================================================
           * BACK SIDE OF ID CARD (OFFICIAL TERMS, DETAILS & QR CODE)
           * ======================================================== */
          <div className="relative w-full h-full p-6 sm:p-7 flex flex-col justify-between bg-gradient-to-br from-[#063319] via-[#0B4A26] to-[#042412] text-white">
            {/* Background Texture & Embellishments */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#9BD038]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Back Header: Organization Identity */}
            <div className="border-b border-white/20 pb-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white p-1.5 shrink-0 shadow-md flex items-center justify-center">
                  <img
                    src="/images/id-card-logo-transparent.png"
                    alt="Logo"
                    className="w-full h-full object-contain"
                    crossOrigin="anonymous"
                  />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base sm:text-lg text-white leading-tight">
                    সময়ের বাতিঘর
                  </h3>
                  <p className="text-xs text-emerald-200 font-medium">
                    একটি সামাজিক স্বেচ্ছাসেবী সংগঠন
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9BD038] bg-black/40 px-2.5 py-1 rounded-full border border-[#9BD038]/40">
                  পরিচয়পত্র (পিছন পাশ)
                </span>
              </div>
            </div>

            {/* Back Body: Official Rules & Terms */}
            <div className="space-y-3 py-4 z-10 text-xs sm:text-[13px] text-emerald-50">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#9BD038] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  এই কার্ডটি সংগঠনের সক্রিয় সদস্যের প্রাতিষ্ঠানিক পরিচয়পত্র।
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#9BD038] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  কার্ডটি অহস্তান্তরযোগ্য। যেকোনো সমাজসেবামূলক ও মানবিক কার্যক্রমে এটি প্রদর্শনযোগ্য।
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#9BD038] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  কার্ডে প্রদত্ত যাবতীয় তথ্য কেন্দ্রীয় ডাটাবেজে সুরক্ষিত ও নিবন্ধিত রয়েছে।
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#9BD038] shrink-0 mt-0.5" />
                <p className="leading-relaxed text-emerald-200">
                  কার্ডটি হারিয়ে গেলে কিংবা বিনষ্ট হলে অবিলম্বে সংগঠন কার্যালয়ে অবহিত করুন।
                </p>
              </div>
            </div>

            {/* Member Details Box */}
            <div className="bg-black/30 border border-white/15 rounded-xl p-3.5 z-10 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-emerald-200">সদস্যের নাম:</span>
                <span className="font-bold text-white">{config.displayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-200">আইডি নম্বর:</span>
                <span className="font-mono font-bold text-[#FFE21D]">{config.displayIdNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-200">রক্তের গ্রুপ:</span>
                <span className="font-bold text-rose-300">{config.displayBloodGroup}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-200">যোগাযোগ:</span>
                <span className="font-mono text-white">{config.displayPhone}</span>
              </div>
            </div>

            {/* Back Footer: QR Code, Address & Authorized Signature */}
            <div className="border-t border-white/20 pt-4 flex items-end justify-between z-10 text-xs">
              {/* QR Verification */}
              <div className="flex items-center gap-2.5">
                <div className="w-14 h-14 rounded-lg bg-white p-1 text-slate-900 shadow-md flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-[#073D1E]" />
                </div>
                <div className="flex flex-col text-[10px] text-emerald-200">
                  <span className="font-bold text-white">কেন্দ্রীয় কার্যালয়</span>
                  <span>সাপাহার, নওগাঁ, রাজশাহী</span>
                  <span className="text-[#9BD038]">somoyerbatighor.org</span>
                </div>
              </div>

              {/* Authorized Signature */}
              <div className="flex flex-col items-center">
                <div className="w-24 border-b border-[#9BD038] mb-1" />
                <span className="text-[10px] font-bold text-emerald-200 tracking-wider">
                  অনুমোদিত স্বাক্ষর
                </span>
                <span className="text-[9px] text-emerald-300">সময়ের বাতিঘর</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

IdCardCanvas.displayName = 'IdCardCanvas';
