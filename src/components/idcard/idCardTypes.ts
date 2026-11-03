export interface IdCardConfig {
  // Photo controls
  photoUrl: string | null;
  photoZoom: number; // 0.5 to 3.0 (default 1.0)
  photoPanX: number; // in pixels (default 0)
  photoPanY: number; // in pixels (default 0)
  photoRotate: number; // in degrees (default 0)

  // Text & Display customizations
  displayName: string;
  displayIdNumber: string; // e.g. "01" or "SB-01"
  displayMemberSerial: string; // e.g. "01"
  displayBloodGroup: string;
  displayPhone: string;
  footerText: string;

  // Visibility toggles
  showBloodGroup: boolean;
  showPhone: boolean;
  showSerialBadge: boolean;
  showFooterText: boolean;

  // Typography sizing
  nameFontSize: 'small' | 'medium' | 'large';
  idFontSize: 'small' | 'medium' | 'large';

  // Active side
  activeSide: 'front' | 'back';
}

export const DEFAULT_ID_CARD_CONFIG: IdCardConfig = {
  photoUrl: null,
  photoZoom: 1.0,
  photoPanX: 0,
  photoPanY: 0,
  photoRotate: 0,
  displayName: '',
  displayIdNumber: '01',
  displayMemberSerial: '01',
  displayBloodGroup: 'B+',
  displayPhone: '01712-345678',
  footerText: 'Design by Mehedi',
  showBloodGroup: true,
  showPhone: true,
  showSerialBadge: true,
  showFooterText: true,
  nameFontSize: 'medium',
  idFontSize: 'medium',
  activeSide: 'front',
};

/**
 * Converts English digits (0-9) to Bengali digits (০-৯)
 */
export const toBengaliDigits = (val: string | number | null | undefined): string => {
  if (val === null || val === undefined) return '';
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(val).replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
};

/**
 * Extracts a 2-digit serial number from member_id (e.g., "SB-001" -> "01", "12" -> "12")
 */
export const extractMemberSerial = (memberId: string | null | undefined): string => {
  if (!memberId) return '01';
  const digitsMatch = memberId.match(/\d+/g);
  if (digitsMatch && digitsMatch.length > 0) {
    const rawNumber = parseInt(digitsMatch[digitsMatch.length - 1], 10);
    return rawNumber < 10 ? `0${rawNumber}` : String(rawNumber);
  }
  return '01';
};

