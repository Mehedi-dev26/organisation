/**
 * Device & Security Audit Utility for Somoyer Batighor
 * Captures applicant device model, browser, screen resolution, timezone, and approximate IP/location.
 */

export interface DeviceAuditInfo {
  deviceType: 'Mobile' | 'Tablet' | 'Desktop';
  deviceModel: string;
  os: string;
  browser: string;
  screenResolution: string;
  timezone: string;
  language: string;
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  isp?: string;
  submittedAt: string;
}

/**
 * Detect client device, operating system, and browser details
 */
export function detectDeviceInfo(): Omit<DeviceAuditInfo, 'ip' | 'city' | 'region' | 'country' | 'isp' | 'submittedAt'> {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const screen = typeof window !== 'undefined' ? window.screen : { width: 0, height: 0 };

  // 1. Device Type
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (isMobile && screen.width >= 768);
  const deviceType: DeviceAuditInfo['deviceType'] = isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop';

  // 2. Operating System & Version
  let os = 'Unknown OS';
  if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1';
  else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7';
  else if (/Android\s([0-9.]+)/i.test(ua)) {
    const match = ua.match(/Android\s([0-9.]+)/i);
    os = `Android ${match?.[1] || ''}`.trim();
  } else if (/iPhone OS\s([0-9_]+)/i.test(ua)) {
    const match = ua.match(/iPhone OS\s([0-9_]+)/i);
    os = `iOS ${match?.[1]?.replace(/_/g, '.') || ''}`.trim();
  } else if (/iPad.*OS\s([0-9_]+)/i.test(ua)) {
    const match = ua.match(/OS\s([0-9_]+)/i);
    os = `iPadOS ${match?.[1]?.replace(/_/g, '.') || ''}`.trim();
  } else if (/Mac OS X\s([0-9_]+)/i.test(ua)) {
    os = 'macOS';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  // 3. Device Model / Brand detection
  let deviceModel = deviceType;
  if (/iPhone/i.test(ua)) deviceModel = 'Apple iPhone';
  else if (/iPad/i.test(ua)) deviceModel = 'Apple iPad';
  else if (/SAMSUNG|SM-|GT-/i.test(ua)) {
    const modelMatch = ua.match(/(SM-[A-Z0-9]+|GT-[A-Z0-9]+)/i);
    deviceModel = `Samsung ${modelMatch?.[1] || ''}`.trim();
  } else if (/Xiaomi|Redmi|POCO/i.test(ua)) {
    const modelMatch = ua.match(/(Redmi [A-Za-z0-9\s]+|POCO [A-Za-z0-9\s]+)/i);
    deviceModel = modelMatch?.[1] || 'Xiaomi';
  } else if (/Oppo|CPH[0-9]+/i.test(ua)) {
    deviceModel = 'Oppo';
  } else if (/Vivo|V[0-9]{4}/i.test(ua)) {
    deviceModel = 'Vivo';
  } else if (/Realme|RMX[0-9]+/i.test(ua)) {
    deviceModel = 'Realme';
  } else if (/OnePlus/i.test(ua)) {
    deviceModel = 'OnePlus';
  } else if (deviceType === 'Desktop') {
    deviceModel = `PC (${os})`;
  }

  // 4. Browser Detection
  let browser = 'Unknown Browser';
  if (/Edg\/([0-9.]+)/i.test(ua)) {
    const match = ua.match(/Edg\/([0-9.]+)/i);
    browser = `Microsoft Edge ${match?.[1]?.split('.')[0] || ''}`;
  } else if (/Chrome\/([0-9.]+)/i.test(ua) && !/Chromium|Edg|OPR/i.test(ua)) {
    const match = ua.match(/Chrome\/([0-9.]+)/i);
    browser = `Google Chrome ${match?.[1]?.split('.')[0] || ''}`;
  } else if (/Firefox\/([0-9.]+)/i.test(ua)) {
    const match = ua.match(/Firefox\/([0-9.]+)/i);
    browser = `Mozilla Firefox ${match?.[1]?.split('.')[0] || ''}`;
  } else if (/Safari\/([0-9.]+)/i.test(ua) && !/Chrome|Chromium/i.test(ua)) {
    browser = 'Apple Safari';
  } else if (/OPR\/([0-9.]+)/i.test(ua)) {
    browser = 'Opera';
  }

  // 5. Screen & Timezone
  const screenResolution = `${screen.width}x${screen.height}`;
  let timezone = 'Asia/Dhaka';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka';
  } catch {
    // fallback
  }

  const language = typeof navigator !== 'undefined' ? navigator.language || 'bn-BD' : 'bn-BD';

  return {
    deviceType,
    deviceModel,
    os,
    browser,
    screenResolution,
    timezone,
    language,
  };
}

/**
 * Capture full device audit with approximate non-blocking IP / location lookup
 */
export async function captureDeviceAudit(): Promise<DeviceAuditInfo> {
  const base = detectDeviceInfo();
  const submittedAt = new Date().toISOString();

  let ip = 'Unavailable';
  let city = '';
  let region = '';
  let country = 'Bangladesh';
  let isp = '';

  try {
    // Fast 1.5s timeout lookup to prevent any registration delay
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const res = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      ip = data.ip || 'Unavailable';
      city = data.city || '';
      region = data.region || '';
      country = data.country_name || 'Bangladesh';
      isp = data.org || '';
    }
  } catch {
    // If blocked by ad-blocker or offline, try fast fallback or leave defaults
    try {
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 1000);
      const res2 = await fetch('https://api.country.is', { signal: controller2.signal });
      clearTimeout(timeoutId2);
      if (res2.ok) {
        const d2 = await res2.json();
        ip = d2.ip || ip;
        country = d2.country || country;
      }
    } catch {
      // safe ignore
    }
  }

  return {
    ...base,
    ip,
    city,
    region,
    country,
    isp,
    submittedAt,
  };
}

const AUDIT_TAG_PREFIX = '\n[DEVICE_AUDIT:';
const AUDIT_TAG_SUFFIX = ']';

/**
 * Append audit JSON into address text safely
 */
export function embedDeviceAuditInAddress(addressText: string, audit: DeviceAuditInfo): string {
  const jsonStr = JSON.stringify(audit);
  return `${addressText.trim()}${AUDIT_TAG_PREFIX}${jsonStr}${AUDIT_TAG_SUFFIX}`;
}

/**
 * Extract clean address and structured audit info
 */
export function extractDeviceAudit(addressText?: string | null): {
  cleanAddress: string;
  audit: DeviceAuditInfo | null;
} {
  if (!addressText) {
    return { cleanAddress: '', audit: null };
  }

  const tagIndex = addressText.indexOf(AUDIT_TAG_PREFIX);
  if (tagIndex === -1) {
    return { cleanAddress: addressText.trim(), audit: null };
  }

  const cleanAddress = addressText.slice(0, tagIndex).trim();
  const rest = addressText.slice(tagIndex + AUDIT_TAG_PREFIX.length);
  const closingIndex = rest.lastIndexOf(AUDIT_TAG_SUFFIX);

  if (closingIndex === -1) {
    return { cleanAddress, audit: null };
  }

  const jsonStr = rest.slice(0, closingIndex).trim();
  try {
    const parsed = JSON.parse(jsonStr) as DeviceAuditInfo;
    return { cleanAddress, audit: parsed };
  } catch {
    return { cleanAddress, audit: null };
  }
}
