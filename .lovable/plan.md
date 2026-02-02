

# PipraPay ইন্টিগ্রেশন পরিকল্পনা

## বর্তমান সিস্টেম

বর্তমানে আপনার সিস্টেমে চাঁদা পরিশোধের ফ্লো:

```text
সদস্য বিকাশে টাকা পাঠায় → ট্রানজেকশন আইডি জমা দেয় → অ্যাডমিন ম্যানুয়ালি যাচাই করে → অনুমোদন/প্রত্যাখ্যান
```

## PipraPay দিয়ে নতুন ফ্লো

```text
সদস্য Pay বাটনে ক্লিক করে → PipraPay পেজে রিডাইরেক্ট → পেমেন্ট সম্পন্ন → SMS ভেরিফিকেশন → Webhook → অটোমেটিক আপডেট
```

## প্রয়োজনীয় কাজ

### ধাপ ১: PipraPay থেকে প্রয়োজনীয় তথ্য সংগ্রহ

আপনাকে PipraPay থেকে নিম্নলিখিত তথ্য সংগ্রহ করতে হবে:
- **API Key / Secret Key** - অথেন্টিকেশনের জন্য
- **Merchant ID** - আপনার মার্চেন্ট আইডি
- **Webhook/IPN URL Format** - পেমেন্ট সফল হলে কোথায় নোটিফিকেশন পাঠাবে
- **API Documentation** - পেমেন্ট ইনিশিয়েট এবং ভেরিফাই করার এন্ডপয়েন্ট

### ধাপ ২: নতুন Edge Function তৈরি

দুটি নতুন Edge Function তৈরি করব:

**`pirapay-initiate`** - পেমেন্ট শুরু করার জন্য:
- সদস্যের তথ্য এবং পরিমাণ নিয়ে PipraPay এ পেমেন্ট তৈরি করবে
- পেমেন্ট URL ফেরত দেবে যেখানে সদস্যকে রিডাইরেক্ট করা হবে

**`pirapay-webhook`** - পেমেন্ট কনফার্মেশন রিসিভ করার জন্য:
- PipraPay থেকে পেমেন্ট সফল/ব্যর্থ নোটিফিকেশন পাবে
- সফল হলে স্বয়ংক্রিয়ভাবে `member_dues` আপডেট করবে
- ট্রানজেকশন তৈরি করবে
- সদস্যকে ইমেইল নোটিফিকেশন পাঠাবে

### ধাপ ৩: PayDues পেজ আপডেট

- নতুন "PipraPay দিয়ে পরিশোধ করুন" বাটন যোগ করব
- ক্লিক করলে PipraPay পেমেন্ট পেজে রিডাইরেক্ট হবে
- পেমেন্ট সফল হলে সফলতার পেজে ফেরত আসবে

### ধাপ ৪: Database আপডেট

`member_dues` টেবিলে নতুন কলাম:
- `piprapay_transaction_id` - PipraPay ট্রানজেকশন আইডি
- `payment_gateway` - কোন গেটওয়ে ব্যবহার হয়েছে (manual/piprapay)

## পরবর্তী পদক্ষেপ

আপনাকে প্রথমে PipraPay থেকে নিচের তথ্যগুলো সংগ্রহ করতে হবে:

1. **API Credentials** (API Key, Secret Key, Merchant ID)
2. **API Documentation** বা তাদের Integration Guide
3. **Test/Sandbox Credentials** (যদি থাকে)

## প্রযুক্তিগত বিবরণ

### Edge Function কাঠামো

```text
supabase/functions/
├── pirapay-initiate/
│   └── index.ts          # পেমেন্ট শুরু করে
└── pirapay-webhook/
    └── index.ts          # পেমেন্ট কনফার্মেশন হ্যান্ডল করে
```

### নতুন Secrets যোগ করতে হবে

- `PIPRAPAY_API_KEY`
- `PIPRAPAY_SECRET_KEY`
- `PIPRAPAY_MERCHANT_ID`

### Webhook Flow

```text
1. Member clicks "Pay with PipraPay"
2. Frontend calls pirapay-initiate edge function
3. Edge function creates payment in PipraPay
4. User redirected to PipraPay payment page
5. User completes payment (bKash/Nagad)
6. PipraPay sends webhook to pirapay-webhook
7. Webhook verifies and updates member_dues
8. Transaction record created
9. Email notification sent
10. User sees success page
```

---

**আপনার কাছ থেকে প্রয়োজন:**
- PipraPay এর API Documentation বা Integration Guide শেয়ার করুন
- API Credentials (API Key, Secret, Merchant ID) প্রস্তুত রাখুন

এই তথ্যগুলো পেলে আমি পূর্ণাঙ্গ ইন্টিগ্রেশন তৈরি করে দিতে পারব।

