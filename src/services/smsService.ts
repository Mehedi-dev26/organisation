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
  purpose: 'dues_reminder' | 'notice' | 'welcome' | 'payment_approved' | 'payment_rejected' | 'custom' | 'test';
  provider: string;
  responseMessage?: string;
  createdAt: string;
}

export interface SmsTemplateItem {
  id: 'member_welcome' | 'dues_reminder' | 'payment_approved' | 'payment_rejected' | 'general_notice';
  nameBn: string;
  nameEn: string;
  category: 'member' | 'dues' | 'payment' | 'notice';
  template: string;
  defaultTemplate: string;
  description: string;
  isActive: boolean;
  availableTags: Array<{ tag: string; label: string; sample: string }>;
}

export const SETTINGS_KEY_SMS_GATEWAY = 'sms_gateway_settings';
export const SETTINGS_KEY_SMS_LOGS = 'sms_delivery_logs';
export const SETTINGS_KEY_SMS_TEMPLATES = 'sms_templates_config';

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
  duesSmsTemplate: 'প্রিয় {name} (আইডি: {member_id}), সময়ের বাতিঘরে {month} মাসের চাঁদা ৳{amount} বকেয়া রয়েছে। পরিশোধ: batighor.org/payment',
  duesNotificationChannels: {
    sms: true,
    push: true,
    email: false,
  },
};

export const DEFAULT_SMS_TEMPLATES: SmsTemplateItem[] = [
  {
    id: 'member_welcome',
    nameBn: 'সদস্য অনুমোদন ও স্বাগতম বার্তা',
    nameEn: 'Member Approval & Welcome',
    category: 'member',
    description: 'নতুন সদস্যের আবেদন অনুমোদনের সাথে সাথে স্বয়ংক্রিয়ভাবে তার সদস্য আইডি ও ডিফল্ট পাসওয়ার্ড সহ কনফার্মেশন এসএমএস পাঠানো হবে।',
    template: 'অভিনন্দন {name}! সময়ের বাতিঘরে আপনার সদস্যপদ অনুমোদিত হয়েছে। আইডি: {member_id}, পাসওয়ার্ড: {password}। লগইন: batighor.org',
    defaultTemplate: 'অভিনন্দন {name}! সময়ের বাতিঘরে আপনার সদস্যপদ অনুমোদিত হয়েছে। আইডি: {member_id}, পাসওয়ার্ড: {password}। লগইন: batighor.org',
    isActive: true,
    availableTags: [
      { tag: '{name}', label: 'সদস্যের নাম', sample: 'মেহেদী হাসান' },
      { tag: '{member_id}', label: 'সদস্য আইডি', sample: 'SB-01' },
      { tag: '{password}', label: 'ডিফল্ট পাসওয়ার্ড', sample: 'batighor123' },
      { tag: '{phone}', label: 'মোবাইল নম্বর', sample: '017XXXXXXXX' },
      { tag: '{login_link}', label: 'লগইন লিংক', sample: 'batighor.org/login' },
      { tag: '{org_name}', label: 'সংগঠনের নাম', sample: 'সময়ের বাতিঘর' },
    ],
  },
  {
    id: 'dues_reminder',
    nameBn: 'বকেয়া চাঁদা রিমাইন্ডার',
    nameEn: 'Dues Payment Reminder',
    category: 'dues',
    description: 'সদস্যদের মাসিক বকেয়া চাঁদা পরিশোধের জন্য স্বয়ংক্রিয় বা এক ক্লিকে বাল্ক রিমাইন্ডার এসএমএস পাঠানো হবে।',
    template: 'প্রিয় {name} (আইডি: {member_id}), সময়ের বাতিঘরে {month} মাসের চাঁদা ৳{amount} বকেয়া রয়েছে। পরিশোধ: batighor.org/payment',
    defaultTemplate: 'প্রিয় {name} (আইডি: {member_id}), সময়ের বাতিঘরে {month} মাসের চাঁদা ৳{amount} বকেয়া রয়েছে। পরিশোধ: batighor.org/payment',
    isActive: true,
    availableTags: [
      { tag: '{name}', label: 'সদস্যের নাম', sample: 'কামরুল ইসলাম' },
      { tag: '{member_id}', label: 'সদস্য আইডি', sample: 'SB-05' },
      { tag: '{month}', label: 'বকেয়া মাস', sample: 'নভেম্বর ২০২৬' },
      { tag: '{amount}', label: 'টাকার পরিমাণ', sample: '১০০' },
      { tag: '{payment_link}', label: 'পেমেন্ট লিংক', sample: 'batighor.org/payment' },
      { tag: '{org_name}', label: 'সংগঠনের নাম', sample: 'সময়ের বাতিঘর' },
    ],
  },
  {
    id: 'payment_approved',
    nameBn: 'পেমেন্ট যাচাই ও অনুমোদন প্রাপ্তিস্বীকার',
    nameEn: 'Payment Verification Approved',
    category: 'payment',
    description: 'সদস্যের বিকাশ বা নগদ পেমেন্ট অ্যাডমিন/ক্যাশিয়ার অনুমোদন করার সাথে সাথে স্বয়ংক্রিয় প্রাপ্তিস্বীকার এসএমএস চলে যাবে।',
    template: 'অভিনন্দন {name}! আপনার ৳{amount} চাঁদা পেমেন্ট সফল হয়েছে। TrxID: {trx_id}। ধন্যবাদ - সময়ের বাতিঘর।',
    defaultTemplate: 'অভিনন্দন {name}! আপনার ৳{amount} চাঁদা পেমেন্ট সফল হয়েছে। TrxID: {trx_id}। ধন্যবাদ - সময়ের বাতিঘর।',
    isActive: true,
    availableTags: [
      { tag: '{name}', label: 'সদস্যের নাম', sample: 'রাকিব হোসেন' },
      { tag: '{member_id}', label: 'সদস্য আইডি', sample: 'SB-12' },
      { tag: '{amount}', label: 'পরিশোধিত টাকা', sample: '১০০' },
      { tag: '{trx_id}', label: 'ট্রানজেকশন আইডি', sample: '9J8KL45M' },
      { tag: '{month}', label: 'পরিশোধের মাস', sample: 'নভেম্বর' },
      { tag: '{org_name}', label: 'সংগঠনের নাম', sample: 'সময়ের বাতিঘর' },
    ],
  },
  {
    id: 'payment_rejected',
    nameBn: 'পেমেন্ট বাতিল / প্রত্যাখ্যান বার্তা',
    nameEn: 'Payment Rejection Notification',
    category: 'payment',
    description: 'ভুল তথ্য বা ইনভ্যালিড TrxID-এর কারণে পেমেন্ট বাতিল হলে কারণ উল্লেখপূর্বক সদস্যকে এসএমএস পাঠানো হবে।',
    template: 'প্রিয় {name}, আপনার ৳{amount} পেমেন্ট বাতিল হয়েছে। কারণ: {reject_reason}। পুনরায় চেষ্টা করুন - সময়ের বাতিঘর।',
    defaultTemplate: 'প্রিয় {name}, আপনার ৳{amount} পেমেন্ট বাতিল হয়েছে। কারণ: {reject_reason}। পুনরায় চেষ্টা করুন - সময়ের বাতিঘর।',
    isActive: true,
    availableTags: [
      { tag: '{name}', label: 'সদস্যের নাম', sample: 'নাজমুল হক' },
      { tag: '{member_id}', label: 'সদস্য আইডি', sample: 'SB-18' },
      { tag: '{amount}', label: 'টাকার পরিমাণ', sample: '১০০' },
      { tag: '{reject_reason}', label: 'বাতিলের কারণ', sample: 'ভুল TrxID' },
      { tag: '{payment_link}', label: 'পেমেন্ট লিংক', sample: 'batighor.org/payment' },
      { tag: '{org_name}', label: 'সংগঠনের নাম', sample: 'সময়ের বাতিঘর' },
    ],
  },
  {
    id: 'general_notice',
    nameBn: 'সাধারণ নোটিশ ও জরুরি ঘোষণা',
    nameEn: 'General Notice & Announcement',
    category: 'notice',
    description: 'ওয়েবসাইটে জরুরি নোটিশ প্রকাশ করার সময় সদস্যদের মোবাইল নম্বরে সরাসরি সম্প্রচার করার ফরম্যাট।',
    template: '[সময়ের বাতিঘর]\n{title}\n{content}',
    defaultTemplate: '[সময়ের বাতিঘর]\n{title}\n{content}',
    isActive: true,
    availableTags: [
      { tag: '{name}', label: 'সদস্যের নাম', sample: 'সদস্য' },
      { tag: '{title}', label: 'নোটিশ শিরোনাম', sample: 'জরুরি সাধারণ সভা' },
      { tag: '{content}', label: 'নোটিশের বিবরণ', sample: 'আগামী শুক্রবার বিকাল ৪টায়...' },
      { tag: '{org_name}', label: 'সংগঠনের নাম', sample: 'সময়ের বাতিঘর' },
    ],
  },
];

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

// Fetch SMS Templates configuration
export const getSmsTemplatesConfig = async (): Promise<SmsTemplateItem[]> => {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', SETTINGS_KEY_SMS_TEMPLATES)
      .maybeSingle();

    if (error || !data?.value) {
      const cached = localStorage.getItem('batighor_sms_templates');
      return cached ? JSON.parse(cached) : DEFAULT_SMS_TEMPLATES;
    }

    const savedTemplates = Array.isArray(data.value) ? (data.value as SmsTemplateItem[]) : [];
    // Merge with defaults to ensure all template IDs exist
    const merged = DEFAULT_SMS_TEMPLATES.map((def) => {
      const found = savedTemplates.find((s) => s.id === def.id);
      return found ? { ...def, ...found } : def;
    });

    localStorage.setItem('batighor_sms_templates', JSON.stringify(merged));
    return merged;
  } catch (err) {
    const cached = localStorage.getItem('batighor_sms_templates');
    return cached ? JSON.parse(cached) : DEFAULT_SMS_TEMPLATES;
  }
};

// Save SMS Templates configuration
export const saveSmsTemplatesConfig = async (templates: SmsTemplateItem[]): Promise<SmsTemplateItem[]> => {
  try {
    localStorage.setItem('batighor_sms_templates', JSON.stringify(templates));
  } catch (e) {}

  const { error } = await supabase
    .from('site_settings')
    .upsert(
      {
        key: SETTINGS_KEY_SMS_TEMPLATES,
        value: templates as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

  if (error) throw error;
  return templates;
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
  data: Record<string, any>
): string => {
  let result = template;
  Object.keys(data).forEach((key) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, data[key] !== undefined && data[key] !== null ? String(data[key]) : '');
  });
  return result;
};

// Send Automated Templated SMS (e.g. member welcome, dues reminder, payment approval, payment rejection)
export const sendTemplatedSms = async (
  templateId: SmsTemplateItem['id'],
  recipientPhone: string,
  recipientName: string,
  variables: Record<string, any>,
  purpose: SmsLogRecord['purpose'] = 'custom',
  memberId?: string
): Promise<{ sent: boolean; message: string; log?: SmsLogRecord }> => {
  try {
    const templates = await getSmsTemplatesConfig();
    const targetTemplate = templates.find((t) => t.id === templateId);

    // If template not found or turned off by admin
    if (!targetTemplate || !targetTemplate.isActive) {
      return {
        sent: false,
        message: `এসএমএস ফরম্যাট (${templateId}) নিষ্ক্রিয় থাকায় কোনো বার্তা পাঠানো হয়নি।`,
      };
    }

    const populatedMessage = renderSmsTemplate(targetTemplate.template, {
      org_name: 'সময়ের বাতিঘর',
      login_link: 'batighor.org/login',
      payment_link: 'batighor.org/payment',
      ...variables,
    });

    const res = await sendSingleSms(
      recipientPhone,
      recipientName,
      populatedMessage,
      purpose,
      memberId
    );

    return {
      sent: res.success,
      message: res.message,
      log: res.log,
    };
  } catch (err: any) {
    console.warn(`sendTemplatedSms failed for ${templateId}:`, err);
    return {
      sent: false,
      message: err.message || 'টেমপ্লেট এসএমএস পাঠানো যায়নি।',
    };
  }
};
