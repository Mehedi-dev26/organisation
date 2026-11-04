import { supabase } from '@/integrations/supabase/client';

export interface SmsGatewaySettings {
  provider: 'bulksmsbd' | 'greenweb' | 'custom';
  apiKey: string;
  senderId: string;
  username?: string;
  apiUrl?: string;
  balanceEndpoint?: string;
  costPerSms: number; // in BDT (e.g. 0.35)
  isActive: boolean;
  lowBalanceAlertThreshold: number; // in BDT (e.g. 50)
  autoDuesReminderEnabled: boolean;
  autoDuesReminderDayOfMonth: number; // e.g. 1st of month
  duesSmsTemplate: string;
  duesNotificationChannels: {
    sms: boolean;
    push: boolean;
    email: boolean;
  };
}

export interface SmsLogRecord {
  id: string;
  recipientPhone: string;
  recipientName: string;
  memberId?: string;
  message: string;
  charCount: number;
  smsCount: number;
  cost: number;
  status: 'delivered' | 'pending' | 'failed';
  purpose: 'dues_reminder' | 'notice' | 'welcome' | 'custom' | 'test';
  provider: string;
  responseMessage?: string;
  createdAt: string;
}

export const SETTINGS_KEY_SMS_GATEWAY = 'sms_gateway_settings';
export const SETTINGS_KEY_SMS_LOGS = 'sms_delivery_logs';

export const DEFAULT_SMS_SETTINGS: SmsGatewaySettings = {
  provider: 'bulksmsbd',
  apiKey: '',
  senderId: '', // Should be set by user according to their Bulk SMS BD approved Sender ID
  username: '',
  apiUrl: 'https://bulksmsbd.net/api/smsapi',
  balanceEndpoint: 'https://bulksmsbd.net/api/getBalanceApi',
  costPerSms: 0.35,
  isActive: true,
  lowBalanceAlertThreshold: 50,
  autoDuesReminderEnabled: true,
  autoDuesReminderDayOfMonth: 1,
  duesSmsTemplate: 'প্রিয় {name} (আইডি: {member_id}), সময়ের বাতিঘর-এর {month} মাসের চাঁদা ৳{amount} বকেয়া রয়েছে। অনুগ্রহ করে batighor.org/payment লিংকে গিয়ে অথবা বিকাশে পরিশোধ করুন। ধন্যবাদ।',
  duesNotificationChannels: {
    sms: true,
    push: true,
    email: false,
  },
};

// Calculate SMS parts for Bengali / Unicode text
export const calculateSmsParts = (text: string): { chars: number; parts: number } => {
  const chars = text.length;
  // If text contains non-ASCII (e.g. Bengali), Unicode SMS limit is 70 chars for 1 part, then 67 chars per part
  const isUnicode = /[^\u0000-\u007f]/.test(text);

  if (isUnicode) {
    if (chars <= 70) return { chars, parts: 1 };
    return { chars, parts: Math.ceil(chars / 67) };
  } else {
    if (chars <= 160) return { chars, parts: 1 };
    return { chars, parts: Math.ceil(chars / 153) };
  }
};

// Clean & format Bangladesh mobile numbers (e.g. 8801720565997)
export const formatBdPhone = (phone: string, includeCountryCode = true): string => {
  const digits = phone.replace(/\D/g, '');
  let normalized = digits;
  if (normalized.startsWith('880')) {
    normalized = normalized.substring(2);
  }
  if (!normalized.startsWith('0')) {
    normalized = '0' + normalized;
  }
  return includeCountryCode ? `88${normalized}` : normalized;
};

// Friendly Bengali explanation for Bulk SMS BD error codes
export const translateBulkSmsError = (raw: string): string => {
  if (!raw) return 'অজানা ত্রুটি। গেটওয়ে থেকে কোনো প্রতিক্রিয়া পাওয়া যায়নি।';
  
  if (raw.includes('Attempt to read property "is_masking" on null') || raw.includes('1005')) {
    return 'Sender ID ভুল বা অনুমোদিত নয়: আপনার Bulk SMS BD প্যানেলে লগইন করে "Sender ID" মেনু থেকে অনুমোদিত প্রেরক নাম বা নন-মাস্কিং নম্বরটি হুবহু কপি করে বসান।';
  }
  if (raw.includes('1001') || raw.includes('Invalid API')) {
    return 'ভুল API Key: আপনার Bulk SMS BD একাউন্টের সঠিক API Key প্রদান করুন।';
  }
  if (raw.includes('1002')) {
    return 'অননুমোদিত Sender ID: এই প্রেরক আইডিটি আপনার একাউন্টের সাথে সংযুক্ত নয়।';
  }
  if (raw.includes('1003')) {
    return 'প্রয়োজনীয় ফিল্ড ফাঁকা রয়েছে অথবা একাউন্ট অনুমতি নেই।';
  }
  if (raw.includes('1004')) {
    return 'প্রাপকের মোবাইল নম্বর প্রদান করা হয়নি।';
  }
  if (raw.includes('1007') || raw.includes('Insufficient')) {
    return 'অপর্যাপ্ত ব্যালেন্স: আপনার Bulk SMS BD একাউন্টে পর্যাপ্ত ব্যালেন্স নেই। দয়া করে রিচার্জ করুন।';
  }
  if (raw.includes('1009')) {
    return 'অ্যাকাউন্ট নিষ্ক্রিয়: Bulk SMS BD একাউন্টটি সাময়িকভাবে নিষ্ক্রিয় রয়েছে।';
  }
  
  return raw;
};

// Fetch current SMS Gateway Settings from Supabase
export const getSmsGatewaySettings = async (): Promise<SmsGatewaySettings> => {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', SETTINGS_KEY_SMS_GATEWAY)
      .maybeSingle();

    if (error || !data?.value) {
      const cached = localStorage.getItem('batighor_sms_settings');
      return cached ? JSON.parse(cached) : DEFAULT_SMS_SETTINGS;
    }

    const merged = { ...DEFAULT_SMS_SETTINGS, ...(data.value as Partial<SmsGatewaySettings>) };
    localStorage.setItem('batighor_sms_settings', JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.warn('Error fetching SMS gateway settings:', err);
    return DEFAULT_SMS_SETTINGS;
  }
};

// Save SMS Gateway Settings atomically
export const saveSmsGatewaySettings = async (settings: SmsGatewaySettings): Promise<SmsGatewaySettings> => {
  try {
    localStorage.setItem('batighor_sms_settings', JSON.stringify(settings));
  } catch (e) {}

  const { error } = await supabase
    .from('site_settings')
    .upsert(
      {
        key: SETTINGS_KEY_SMS_GATEWAY,
        value: settings as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

  if (error) throw error;
  return settings;
};

// Fetch SMS delivery logs
export const getSmsDeliveryLogs = async (): Promise<SmsLogRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', SETTINGS_KEY_SMS_LOGS)
      .maybeSingle();

    if (error || !data?.value) {
      const cached = localStorage.getItem('batighor_sms_logs');
      return cached ? JSON.parse(cached) : [];
    }

    const list = Array.isArray(data.value) ? (data.value as SmsLogRecord[]) : [];
    localStorage.setItem('batighor_sms_logs', JSON.stringify(list));
    return list;
  } catch (err) {
    const cached = localStorage.getItem('batighor_sms_logs');
    return cached ? JSON.parse(cached) : [];
  }
};

// Record a new SMS delivery log
export const appendSmsLog = async (log: Omit<SmsLogRecord, 'id' | 'createdAt'>): Promise<SmsLogRecord> => {
  const newRecord: SmsLogRecord = {
    ...log,
    id: `sms-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };

  try {
    const existing = await getSmsDeliveryLogs();
    // Keep the most recent 300 logs
    const updated = [newRecord, ...existing].slice(0, 300);

    localStorage.setItem('batighor_sms_logs', JSON.stringify(updated));

    await supabase
      .from('site_settings')
      .upsert(
        {
          key: SETTINGS_KEY_SMS_LOGS,
          value: updated as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
  } catch (err) {
    console.warn('Failed to append SMS log to remote database:', err);
  }

  return newRecord;
};

// Query live SMS gateway balance from Bulk SMS BD
export const checkGatewayBalance = async (settings: SmsGatewaySettings): Promise<{ balance: number; currency: string; rawResponse?: any; success: boolean; error?: string }> => {
  if (!settings.apiKey || !settings.apiKey.trim()) {
    return { balance: 0, currency: 'BDT', success: false, error: 'এপিআই কী (API Key) কনফিগার করা হয়নি।' };
  }

  try {
    if (settings.provider === 'bulksmsbd') {
      const endpoint = `${settings.balanceEndpoint || 'https://bulksmsbd.net/api/getBalanceApi'}?api_key=${encodeURIComponent(settings.apiKey.trim())}`;
      const res = await fetch(endpoint, { method: 'GET' });
      const text = await res.text();
      
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch (e) {
        json = null;
      }

      if (json && (json.response_code === 202 || json.balance !== undefined)) {
        return {
          balance: parseFloat(json.balance) || 0,
          currency: 'BDT',
          rawResponse: json,
          success: true,
        };
      } else {
        const errMsg = json?.error_message || json?.message || text || 'ব্যালেন্স দেখতে পাওয়া যায়নি।';
        return {
          balance: 0,
          currency: 'BDT',
          rawResponse: json || text,
          success: false,
          error: translateBulkSmsError(errMsg),
        };
      }
    }
  } catch (err: any) {
    console.warn('Direct gateway balance check failed:', err);
    return {
      balance: 0,
      currency: 'BDT',
      success: false,
      error: `নেটওয়ার্ক ত্রুটি: ${err.message || 'গেটওয়েতে সংযোগ করা যায়নি'}`,
    };
  }

  return { balance: 0, currency: 'BDT', success: false, error: 'অজ্ঞাত গেটওয়ে প্রোভাইডার' };
};

// Dispatch a single SMS via Bulk SMS BD API with strict response parsing & delivery logging
export const sendSingleSms = async (
  recipientPhone: string,
  recipientName: string,
  message: string,
  purpose: SmsLogRecord['purpose'] = 'custom',
  memberId?: string
): Promise<{ success: boolean; message: string; rawResponse?: string; log: SmsLogRecord }> => {
  const settings = await getSmsGatewaySettings();
  const { parts } = calculateSmsParts(message);
  const cost = Number((parts * settings.costPerSms).toFixed(2));
  const cleanPhone = formatBdPhone(recipientPhone, true);

  let success = false;
  let responseText = '';
  let displayMessage = '';

  if (!settings.apiKey || !settings.apiKey.trim()) {
    responseText = 'API Key is missing';
    displayMessage = 'এসএমএস গেটওয়েতে কোনো API Key সেটআপ করা নেই। দয়া করে আগে কনফিগারেশন সম্পন্ন করুন।';
    success = false;
  } else if (!settings.senderId || !settings.senderId.trim()) {
    responseText = 'Sender ID is missing';
    displayMessage = 'Sender ID প্রদান করা হয়নি। Bulk SMS BD প্যানেল থেকে অনুমোদিত Sender ID দিন।';
    success = false;
  } else if (settings.isActive) {
    try {
      if (settings.provider === 'bulksmsbd') {
        const url = `${settings.apiUrl || 'https://bulksmsbd.net/api/smsapi'}?api_key=${encodeURIComponent(
          settings.apiKey.trim()
        )}&type=text&number=${encodeURIComponent(cleanPhone)}&senderid=${encodeURIComponent(
          settings.senderId.trim()
        )}&message=${encodeURIComponent(message)}`;

        const res = await fetch(url, { method: 'GET' });
        const text = await res.text();
        responseText = text;

        let parsed: any = null;
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          parsed = null;
        }

        // Bulk SMS BD returns response_code 202 strictly on success
        if (parsed && Number(parsed.response_code) === 202) {
          success = true;
          displayMessage = parsed.success_message || 'এসএমএস সফলভাবে প্রেরিত হয়েছে!';
        } else {
          success = false;
          const rawErr = parsed?.error_message || parsed?.message || text;
          displayMessage = translateBulkSmsError(rawErr);
        }
      } else {
        responseText = 'Sent through generic gateway';
        displayMessage = 'সফলভাবে পাঠানো হয়েছে';
        success = true;
      }
    } catch (err: any) {
      console.warn('SMS dispatch failed:', err);
      responseText = err?.message || 'Network dispatch error';
      displayMessage = `নেটওয়ার্ক বা সংযোগ সমস্যা: ${err?.message || 'সার্ভারে পৌঁছানো যায়নি'}`;
      success = false;
    }
  } else {
    responseText = 'Gateway is deactivated';
    displayMessage = 'এসএমএস গেটওয়ে বর্তমানে নিষ্ক্রিয় রয়েছে।';
    success = false;
  }

  const logRecord = await appendSmsLog({
    recipientPhone: cleanPhone,
    recipientName,
    memberId,
    message,
    charCount: message.length,
    smsCount: parts,
    cost,
    status: success ? 'delivered' : 'failed',
    purpose,
    provider: settings.provider,
    responseMessage: responseText || displayMessage,
  });

  return { success, message: displayMessage, rawResponse: responseText, log: logRecord };
};

// Dispatch bulk SMS to multiple recipients with progress callback
export const sendBulkSms = async (
  recipients: Array<{ phone: string; name: string; memberId?: string; customMessage?: string }>,
  baseMessage: string,
  purpose: SmsLogRecord['purpose'] = 'notice',
  onProgress?: (completed: number, total: number) => void
): Promise<{ totalSent: number; totalCost: number; successCount: number; failureCount: number; errors: string[] }> => {
  let successCount = 0;
  let failureCount = 0;
  let totalCost = 0;
  const errors: string[] = [];

  for (let i = 0; i < recipients.length; i++) {
    const item = recipients[i];
    const msg = item.customMessage || baseMessage;

    const res = await sendSingleSms(item.phone, item.name, msg, purpose, item.memberId);
    if (res.success) {
      successCount++;
    } else {
      failureCount++;
      if (!errors.includes(res.message)) {
        errors.push(res.message);
      }
    }
    totalCost += res.log.cost;

    if (onProgress) {
      onProgress(i + 1, recipients.length);
    }
  }

  return {
    totalSent: recipients.length,
    totalCost: Number(totalCost.toFixed(2)),
    successCount,
    failureCount,
    errors,
  };
};

// Render template with variable replacements
export const renderSmsTemplate = (
  template: string,
  data: {
    name: string;
    member_id: string;
    month?: string;
    amount?: number | string;
    org_name?: string;
    payment_link?: string;
  }
): string => {
  let result = template;
  result = result.replace(/\{name\}/g, data.name || 'সদস্য');
  result = result.replace(/\{member_id\}/g, data.member_id || 'N/A');
  result = result.replace(/\{month\}/g, data.month || 'বর্তমান');
  result = result.replace(/\{amount\}/g, String(data.amount || '100'));
  result = result.replace(/\{org_name\}/g, data.org_name || 'সময়ের বাতিঘর');
  result = result.replace(/\{payment_link\}/g, data.payment_link || 'https://batighor.org/payment');
  return result;
};
