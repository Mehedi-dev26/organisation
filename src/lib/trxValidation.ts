/**
 * Validation utility for mobile banking Transaction IDs (TrxID) in Bangladesh
 * Covers bKash, Nagad, Rocket, Upay, Cellfin, Tap
 */

export interface TrxValidationResult {
  isValid: boolean;
  message?: string;
}

export const validateTransactionId = (method: string, trxId: string): TrxValidationResult => {
  const clean = trxId.trim().toUpperCase();

  if (!clean) {
    return { 
      isValid: false, 
      message: 'অনুগ্রহ করে ট্রানজেকশন আইডি (TrxID) প্রদান করুন।' 
    };
  }

  // Common basic check
  if (clean.length < 6) {
    return { 
      isValid: false, 
      message: 'ট্রানজেকশন আইডি ন্যূনতম ৬-১০ অক্ষরের হতে হবে।' 
    };
  }

  // Cannot contain spaces or special symbols
  if (!/^[A-Z0-9]+$/.test(clean)) {
    return { 
      isValid: false, 
      message: 'ট্রানজেকশন আইডিতে কোনো স্পেস বা বিশেষ চিহ্ন (!, @, # ইত্যাদি) থাকা যাবে না।' 
    };
  }

  // Prevent users mistakenly typing a Bangladeshi mobile phone number (017..., 018..., etc.)
  if (/^01[3-9]\d{8}$/.test(clean)) {
    return { 
      isValid: false, 
      message: 'আপনি প্রেরক মোবাইল নম্বর দিয়েছেন। অনুগ্রহ করে এসএমএস-এ প্রাপ্ত আসল ট্রানজেকশন আইডি (TrxID) লিখুন।' 
    };
  }

  // Method specific validation
  if (method === 'bkash') {
    // bKash TrxID is usually 10 alphanumeric characters (e.g., BKG783KL92, 9H52KM87PQ)
    if (clean.length !== 10) {
      return { 
        isValid: false, 
        message: `বিকাশ ট্রানজেকশন আইডি (TrxID) সাধারণত ঠিক ১০ অক্ষরের হয় (যেমন: BKG783KL92)। আপনি দিয়েছেন ${clean.length} অক্ষর।` 
      };
    }
  } else if (method === 'nagad') {
    // Nagad TrxID is usually 8 alphanumeric characters (e.g., 7X89BKL2)
    if (clean.length < 8 || clean.length > 10) {
      return { 
        isValid: false, 
        message: `নগদ ট্রানজেকশন আইডি (TrxID) সাধারণত ৮ অক্ষরের হয় (যেমন: 7X89BKL2)। আপনি দিয়েছেন ${clean.length} অক্ষর।` 
      };
    }
  } else {
    // Rocket, Upay, Cellfin, Tap
    if (clean.length < 8 || clean.length > 16) {
      return { 
        isValid: false, 
        message: `সঠিক ট্রানজেকশন আইডি প্রদান করুন (৮ থেকে ১৬ অক্ষরের)। আপনি দিয়েছেন ${clean.length} অক্ষর।` 
      };
    }
  }

  return { isValid: true };
};

