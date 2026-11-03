export type PaymentMethod = "bkash" | "nagad" | "rocket" | "bank";
export type AccountType = "personal" | "merchant" | "payment";

const METHOD_NAMES: Record<PaymentMethod, string> = {
  bkash: "বিকাশ",
  nagad: "নগদ",
  rocket: "রকেট",
  bank: "ব্যাংক অ্যাকাউন্ট",
};

const ACTION_NAMES: Record<AccountType, string> = {
  personal: "Send Money",
  merchant: "Payment",
  payment: "Payment / বিল পে",
};

/**
 * Generates clear, professional Bengali instructions for users based on gateway and number type.
 */
export function generateLocalPaymentInstruction(
  method: PaymentMethod,
  type: AccountType,
  number: string,
  reference?: string
): string {
  const mName = METHOD_NAMES[method] || method;
  const action = ACTION_NAMES[type] || "Send Money";
  const num = number.trim() || "০১XXXXXXXXX";

  if (method === "bank") {
    return [
      `১. আপনার মোবাইল ব্যাংকিং বা ব্যাংক অ্যাপে প্রবেশ করুন।`,
      `২. ফান্ড ট্রান্সফার (NPSB / BEFTN) অপশনটি নির্বাচন করুন।`,
      `৩. ব্যাংক অ্যাকাউন্ট নম্বর: ${num}`,
      reference?.trim() ? `৪. রেফারেন্স/মন্তব্য: ${reference.trim()}` : null,
      `৫. নির্ধারিত চাঁদার সঠিক পরিমাণ টাকা ট্রান্সফার করুন।`,
      `৬. প্রাপ্ত ট্রানজেকশন আইডি / রেফারেন্স নম্বর সংগ্রহ করুন।`,
      `৭. নিচে আপনার প্রেরক অ্যাকাউন্ট নম্বর ও TrxID বসিয়ে সাবমিট করুন।`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `১. আপনার ${mName} অ্যাপে প্রবেশ করুন।`,
    `২. "${action}" অপশনটি নির্বাচন করুন।`,
    `৩. প্রাপক নম্বরে এই নম্বরটি দিন: ${num}`,
    reference?.trim() ? `৪. রেফারেন্সে আপনার সদস্য আইডি দিন: ${reference.trim()}` : `৪. রেফারেন্সে আপনার সদস্য আইডি দিন।`,
    `৫. চাঁদার নির্ধারিত সঠিক পরিমাণ টাকা সেন্ড করুন।`,
    `৬. সফলভাবে টাকা পাঠানোর পর প্রাপ্ত ট্রানজেকশন আইডি (TrxID) টি কপি করুন।`,
    `৭. নিচের ফর্মে আপনার প্রেরক নম্বর এবং TrxID বসিয়ে পেমেন্ট নিশ্চিত করুন।`,
  ]
    .filter(Boolean)
    .join("\n");
}

