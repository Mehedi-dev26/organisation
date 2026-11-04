import { supabase } from '@/integrations/supabase/client';

export const SETTINGS_KEY_MAGIC_PAYMENT_LINKS = 'magic_payment_links';

export interface MagicPaymentLinkRecord {
  token: string;
  memberId: string; // Database UUID or internal ID
  memberDisplayId: string; // e.g. "SB-2601"
  memberName: string;
  memberPhone: string;
  dueId?: string | null;
  amount: number;
  month: string;
  purpose?: string;
  isUsed: boolean;
  usedAt?: string | null;
  transactionId?: string | null;
  paymentMethod?: string | null;
  createdAt: string;
  expiresAt: string; // ISO date string
}

export interface CreateMagicLinkParams {
  memberId: string;
  memberDisplayId?: string;
  memberName?: string;
  memberPhone?: string;
  dueId?: string | null;
  amount: number;
  month?: string;
  purpose?: string;
  expiryDays?: number; // default: 14 days
}

export interface ResolveMagicLinkResult {
  status: 'active' | 'already_paid' | 'pending_verification' | 'already_used' | 'expired' | 'not_found';
  record?: MagicPaymentLinkRecord;
  message?: string;
}

/**
 * Returns the official base domain for payment links.
 * Always resolves to the user's official domain https://samoyerbatighor.pro.bd
 */
export const getBasePaymentDomain = (): string => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    if (origin.includes('samoyerbatighor.pro.bd') || (!origin.includes('localhost') && !origin.includes('127.0.0.1'))) {
      return origin;
    }
  }
  return 'https://samoyerbatighor.pro.bd';
};

/**
 * Generates a clean, short, URL-friendly unique token.
 * E.g. "PL-2601-8K3M" or "PL-2601-XY7" (only 14 characters total)
 */
export const generateShortToken = (displayId = '2601'): string => {
  const cleanId = displayId.replace(/^SB[-/ ]?/i, '') || '01';
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timePart = Date.now().toString(36).slice(-3).toUpperCase();
  return `PL-${cleanId}-${randomPart}${timePart}`;
};

/**
 * Encodes a fallback compact URL-safe base64 string
 */
export const encodeCompactPayload = (params: CreateMagicLinkParams, token: string): string => {
  try {
    const payload = {
      t: token,
      m: params.memberId,
      id: params.memberDisplayId || 'SB-2601',
      n: params.memberName || '',
      p: params.memberPhone || '',
      a: params.amount,
      mo: params.month || '',
      d: params.dueId || '',
      exp: Date.now() + (params.expiryDays || 14) * 86400 * 1000,
    };
    const json = JSON.stringify(payload);
    return btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch {
    return token;
  }
};

/**
 * Decodes fallback compact URL-safe base64 string
 */
export const decodeCompactPayload = (encoded: string): MagicPaymentLinkRecord | null => {
  try {
    let str = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    const json = decodeURIComponent(escape(atob(str)));
    const p = JSON.parse(json);
    if (!p.m || !p.a) return null;

    return {
      token: p.t || encoded,
      memberId: p.m,
      memberDisplayId: p.id || 'SB-2601',
      memberName: p.n || 'সদস্য',
      memberPhone: p.p || '',
      amount: p.a,
      month: p.mo || 'মাসিক চাঁদা',
      dueId: p.d || null,
      isUsed: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(p.exp).toISOString(),
    };
  } catch {
    return null;
  }
};

/**
 * Fetch all stored magic links from site_settings (with local cache fallback)
 */
export const getStoredMagicLinks = async (): Promise<Record<string, MagicPaymentLinkRecord>> => {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', SETTINGS_KEY_MAGIC_PAYMENT_LINKS)
      .maybeSingle();

    if (error || !data?.value) {
      const cached = localStorage.getItem('batighor_magic_links_cache');
      return cached ? JSON.parse(cached) : {};
    }

    const map = (data.value as Record<string, MagicPaymentLinkRecord>) || {};
    try {
      localStorage.setItem('batighor_magic_links_cache', JSON.stringify(map));
    } catch {}
    return map;
  } catch (err) {
    console.warn('Error reading magic links from site_settings:', err);
    const cached = localStorage.getItem('batighor_magic_links_cache');
    return cached ? JSON.parse(cached) : {};
  }
};

/**
 * Save updated magic links store to site_settings
 */
export const saveMagicLinksStore = async (
  map: Record<string, MagicPaymentLinkRecord>
): Promise<void> => {
  try {
    localStorage.setItem('batighor_magic_links_cache', JSON.stringify(map));
  } catch {}

  try {
    await supabase
      .from('site_settings')
      .upsert(
        {
          key: SETTINGS_KEY_MAGIC_PAYMENT_LINKS,
          value: map as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
  } catch (err) {
    console.error('Failed to save magic links in site_settings:', err);
  }
};

/**
 * Creates a single personalized Magic Payment Link and persists it.
 * Returns the short, complete URL for SMS, e.g. https://samoyerbatighor.pro.bd/pay?t=PL-2601-8K3M
 */
export const createMagicPaymentLink = async (
  params: CreateMagicLinkParams
): Promise<{ url: string; token: string; record: MagicPaymentLinkRecord }> => {
  const token = generateShortToken(params.memberDisplayId || '2601');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (params.expiryDays || 14) * 24 * 60 * 60 * 1000);

  const record: MagicPaymentLinkRecord = {
    token,
    memberId: params.memberId,
    memberDisplayId: params.memberDisplayId || 'SB-2601',
    memberName: params.memberName || 'সদস্য',
    memberPhone: params.memberPhone || '',
    dueId: params.dueId || null,
    amount: params.amount,
    month: params.month || 'চলতি মাস',
    purpose: params.purpose || `${params.month || 'চলতি'} মাসের সদস্য চাঁদা`,
    isUsed: false,
    usedAt: null,
    transactionId: null,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  // Persist to site_settings
  try {
    const existing = await getStoredMagicLinks();
    existing[token] = record;
    await saveMagicLinksStore(existing);
  } catch (err) {
    console.warn('Non-fatal error persisting magic link:', err);
  }

  const baseDomain = getBasePaymentDomain();
  const url = `${baseDomain}/pay?t=${token}`;

  return { url, token, record };
};

/**
 * Batch creates multiple Magic Payment Links in one atomic database operation.
 * Used for bulk dues reminders to all unpaid members simultaneously.
 */
export const createBatchMagicPaymentLinks = async (
  items: CreateMagicLinkParams[]
): Promise<Record<string, { url: string; token: string; record: MagicPaymentLinkRecord }>> => {
  const result: Record<string, { url: string; token: string; record: MagicPaymentLinkRecord }> = {};
  if (!items || items.length === 0) return result;

  const now = new Date();
  const baseDomain = getBasePaymentDomain();

  // Load existing map once
  const existingMap = await getStoredMagicLinks();

  items.forEach((item) => {
    const token = generateShortToken(item.memberDisplayId || '2601');
    const expiresAt = new Date(now.getTime() + (item.expiryDays || 14) * 24 * 60 * 60 * 1000);

    const record: MagicPaymentLinkRecord = {
      token,
      memberId: item.memberId,
      memberDisplayId: item.memberDisplayId || 'SB-2601',
      memberName: item.memberName || 'সদস্য',
      memberPhone: item.memberPhone || '',
      dueId: item.dueId || null,
      amount: item.amount,
      month: item.month || 'চলতি মাস',
      purpose: item.purpose || `${item.month || 'চলতি'} মাসের সদস্য চাঁদা`,
      isUsed: false,
      usedAt: null,
      transactionId: null,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    existingMap[token] = record;
    const url = `${baseDomain}/pay?t=${token}`;
    result[item.memberId] = { url, token, record };
  });

  // Save full batch in one atomic database transaction
  await saveMagicLinksStore(existingMap);

  return result;
};

/**
 * Resolves and validates a Magic Payment Link from the query parameter.
 * Performs deep checks:
 * 1. Checks if token exists in site_settings.
 * 2. Checks if expired.
 * 3. Checks if already used (isUsed).
 * 4. Checks if the due record in member_dues was already verified or submitted.
 */
export const resolveMagicPaymentLink = async (
  tokenOrCode: string
): Promise<ResolveMagicLinkResult> => {
  if (!tokenOrCode || !tokenOrCode.trim()) {
    return { status: 'not_found', message: 'পেমেন্ট লিংক পাওয়া যায়নি।' };
  }

  const cleanToken = tokenOrCode.trim();
  const store = await getStoredMagicLinks();
  let record = store[cleanToken];

  // If not found in store, attempt fallback compact decode
  if (!record && cleanToken.length > 20) {
    record = decodeCompactPayload(cleanToken) || undefined;
  }

  if (!record) {
    return {
      status: 'not_found',
      message: 'পেমেন্ট লিংকটি সঠিক নয় অথবা ডাটাবেজে পাওয়া যায়নি।',
    };
  }

  // 1. Check expiration
  if (record.expiresAt && new Date(record.expiresAt).getTime() < Date.now()) {
    return {
      status: 'expired',
      record,
      message: 'এই ম্যাজিক পেমেন্ট লিংকটির মেয়াদ উত্তীর্ণ হয়ে গেছে। নতুন লিংকের জন্য যোগাযোগ করুন।',
    };
  }

  // 2. Check if already marked used in site_settings
  if (record.isUsed) {
    return {
      status: 'already_used',
      record,
      message: 'এই পেমেন্ট লিংকটি ইতোমধ্যে ব্যবহার করা হয়েছে এবং পেমেন্ট জমা দেওয়া হয়েছে।',
    };
  }

  // 3. Deep check live database status for the member's due
  try {
    if (record.dueId) {
      const { data: dueData } = await supabase
        .from('member_dues')
        .select('id, is_paid, payment_status, transaction_id')
        .eq('id', record.dueId)
        .maybeSingle();

      if (dueData) {
        if (dueData.is_paid) {
          return {
            status: 'already_paid',
            record,
            message: 'এই চাঁদাটি ইতোমধ্যে সফলভাবে পরিশোধিত ও অনুমোদিত হয়েছে। ধন্যবাদ!',
          };
        }
        if (dueData.payment_status === 'submitted') {
          return {
            status: 'pending_verification',
            record: {
              ...record,
              transactionId: dueData.transaction_id || record.transactionId,
            },
            message: 'আপনার পেমেন্টটি সাবমিট করা হয়েছে এবং বর্তমানে অ্যাকাউন্টস কমিটির যাচাইকরণের অপেক্ষায় রয়েছে।',
          };
        }
      }
    } else if (record.memberId) {
      // Check if this month's due for this member is already paid
      const { data: memberDue } = await supabase
        .from('member_dues')
        .select('id, is_paid, payment_status, transaction_id, month_year')
        .eq('member_id', record.memberId)
        .eq('month_year', record.month)
        .maybeSingle();

      if (memberDue) {
        if (memberDue.is_paid) {
          return {
            status: 'already_paid',
            record,
            message: 'এই মাসের চাঁদাটি ইতোমধ্যে পরিশোধ করা হয়েছে। ধন্যবাদ!',
          };
        }
        if (memberDue.payment_status === 'submitted') {
          return {
            status: 'pending_verification',
            record: {
              ...record,
              transactionId: memberDue.transaction_id || record.transactionId,
            },
            message: 'আপনার পেমেন্টটি সাবমিট করা হয়েছে এবং অ্যাকাউন্টস কমিটির যাচাইয়ের অপেক্ষায় রয়েছে।',
          };
        }
      }
    }
  } catch (dbErr) {
    console.warn('Database verification check warning:', dbErr);
  }

  return {
    status: 'active',
    record,
  };
};

/**
 * Atomically marks a magic payment link as used with the submitted TrxID.
 */
export const markMagicLinkUsed = async (
  token: string,
  transactionId: string,
  paymentMethod = 'bkash'
): Promise<void> => {
  if (!token) return;
  try {
    const store = await getStoredMagicLinks();
    if (store[token]) {
      store[token].isUsed = true;
      store[token].usedAt = new Date().toISOString();
      store[token].transactionId = transactionId.trim().toUpperCase();
      store[token].paymentMethod = paymentMethod;
      await saveMagicLinksStore(store);
    }
  } catch (err) {
    console.warn('Failed to mark magic link as used:', err);
  }
};
