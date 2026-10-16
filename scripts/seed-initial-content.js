import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://rbmhzcapomiiduknkfya.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibWh6Y2Fwb21paWR1a25rZnlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg2NDIyMiwiZXhwIjoyMTA3NDQwMjIyfQ.XDgizTMeeZjJTuKk-luAMZEj4qubQizBTmKxs3M-J5M";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function seedContent() {
  console.log("=== SEEDING INITIAL CONTENT TO SUPABASE ===");

  // 1. Committee Members
  const { data: existingCommittee } = await supabase.from('committee_members').select('id');
  if (!existingCommittee || existingCommittee.length === 0) {
    console.log("Seeding committee_members...");
    const committeeData = [
      {
        name_bn: 'মো: মেহেদী হাসান',
        name_en: 'Mehedi Hasan',
        position_bn: 'সভাপতি',
        position_en: 'President',
        phone: '01711050841',
        email: 'mehedihasanwork25@mail.com',
        photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
        sort_order: 1,
        is_active: true,
        term_start: '2026-01-01',
        term_end: '2027-12-31'
      },
      {
        name_bn: 'মো: আরিফুল ইসলাম',
        name_en: 'Ariful Islam',
        position_bn: 'সাধারণ সম্পাদক',
        position_en: 'General Secretary',
        phone: '01712345678',
        email: 'ariful@batighor.org',
        photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
        sort_order: 2,
        is_active: true,
        term_start: '2026-01-01',
        term_end: '2027-12-31'
      },
      {
        name_bn: 'মো: তানভীর আহমেদ',
        name_en: 'Tanvir Ahmed',
        position_bn: 'সাংগঠনিক সম্পাদক',
        position_en: 'Organizing Secretary',
        phone: '01723456789',
        email: 'tanvir@batighor.org',
        photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80',
        sort_order: 3,
        is_active: true,
        term_start: '2026-01-01',
        term_end: '2027-12-31'
      },
      {
        name_bn: 'মো: মাহাবুব আলম',
        name_en: 'Mahbub Alam',
        position_bn: 'কোষাধ্যক্ষ',
        position_en: 'Treasurer',
        phone: '01734567890',
        email: 'mahbub@batighor.org',
        photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
        sort_order: 4,
        is_active: true,
        term_start: '2026-01-01',
        term_end: '2027-12-31'
      },
      {
        name_bn: 'মো: সোহেল রানা',
        name_en: 'Sohel Rana',
        position_bn: 'দপ্তর সম্পাদক',
        position_en: 'Office Secretary',
        phone: '01745678901',
        email: 'sohel@batighor.org',
        photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
        sort_order: 5,
        is_active: true,
        term_start: '2026-01-01',
        term_end: '2027-12-31'
      },
      {
        name_bn: 'মো: ইমরান হোসেন',
        name_en: 'Imran Hossain',
        position_bn: 'প্রচার ও প্রকাশনা সম্পাদক',
        position_en: 'Publicity Secretary',
        phone: '01756789012',
        email: 'imran@batighor.org',
        photo_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80',
        sort_order: 6,
        is_active: true,
        term_start: '2026-01-01',
        term_end: '2027-12-31'
      }
    ];

    const { error: commInsertErr } = await supabase.from('committee_members').insert(committeeData);
    if (commInsertErr) console.log("❌ Error inserting committee_members:", commInsertErr);
    else console.log("✅ Seeded 6 committee_members!");
  }

  // 2. Gallery Images
  const { data: existingGallery } = await supabase.from('gallery_images').select('id');
  if (!existingGallery || existingGallery.length === 0) {
    console.log("Seeding gallery_images...");
    const galleryData = [
      {
        title_bn: 'অসহায় শীতার্ত মানুষের মাঝে শীতবস্ত্র ও কম্বল বিতরণ',
        title_en: 'Winter Clothes & Blanket Distribution',
        description_bn: 'তীব্র শীতে অসহায় পরিবারের পাশে সময়ের বাতিঘর স্বেচ্ছাসেবী পরিবার।',
        description_en: 'Distributing warm clothes to vulnerable families during harsh winter.',
        image_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
        category: 'relief',
        event_date: '2026-01-15',
        sort_order: 1,
        is_published: true
      },
      {
        title_bn: 'বিনামূল্যে রক্তের গ্রুপ নির্ণয় ও স্বেচ্ছায় রক্তদান ক্যাম্পেইন',
        title_en: 'Free Blood Grouping & Voluntary Blood Donation Camp',
        description_bn: 'রক্তদান জীবনের শ্রেষ্ঠ উপহার—জরুরি স্বাস্থ্যসেবা কার্যক্রমে তরুণদের স্বতঃস্ফূর্ত অংশগ্রহণ।',
        description_en: 'Youth volunteers participating in emergency blood donation camp.',
        image_url: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=800&q=80',
        category: 'blood',
        event_date: '2026-02-10',
        sort_order: 2,
        is_published: true
      },
      {
        title_bn: 'পরিবেশ সুরক্ষায় মাসব্যাপী বৃক্ষরোপণ কর্মসূচি',
        title_en: 'Month-long Tree Plantation Campaign',
        description_bn: 'সবুজ পৃথিবী বিনির্মাণে বিভিন্ন শিক্ষাপ্রতিষ্ঠান ও সামাজিক চত্বরে গাছের চারা রোপণ।',
        description_en: 'Planting tree saplings in educational institutions to protect the environment.',
        image_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
        category: 'environment',
        event_date: '2026-07-20',
        sort_order: 3,
        is_published: true
      },
      {
        title_bn: 'অসচ্ছল ও সুবিধাবঞ্চিত মেধাবী শিক্ষার্থীদের শিক্ষা উপকরণ বিতরণ',
        title_en: 'Educational Materials Distribution for Underprivileged Students',
        description_bn: 'খাতা, কলম ও বই উপহার দিয়ে শিক্ষার্থীদের মুখে হাসির বিস্তার।',
        description_en: 'Distributing books, notebooks and supplies to meritorious students.',
        image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
        category: 'education',
        event_date: '2026-08-05',
        sort_order: 4,
        is_published: true
      },
      {
        title_bn: 'জরুরি দুর্যোগ ও বন্যায় ক্ষতিগ্রস্ত পরিবারের মাঝে খাদ্য সহায়তা',
        title_en: 'Emergency Food Aid for Flood Affected Families',
        description_bn: 'বন্যাদুর্গত পানিবন্দী মানুষের দোরগোড়ায় পৌঁছে দেওয়া হয়েছে শুকনো খাবার ও ত্রাণ সামগ্রী।',
        description_en: 'Delivering dry food and relief packages to flood victims.',
        image_url: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb9?auto=format&fit=crop&w=800&q=80',
        category: 'relief',
        event_date: '2026-08-25',
        sort_order: 5,
        is_published: true
      },
      {
        title_bn: 'বিনামূল্যে স্বাস্থ্য পরামর্শ ও ওষুধ বিতরণ ক্যাম্প',
        title_en: 'Free Medical Consultation & Medicine Camp',
        description_bn: 'অভিজ্ঞ চিকিৎসকদের মাধ্যমে দরিদ্র রোগীদের স্বাস্থ্য পরীক্ষা ও ওষুধ বিতরণ।',
        description_en: 'Providing free health checkups and vital medicines to disadvantaged patients.',
        image_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
        category: 'medical',
        event_date: '2026-09-12',
        sort_order: 6,
        is_published: true
      }
    ];

    const { error: galInsertErr } = await supabase.from('gallery_images').insert(galleryData);
    if (galInsertErr) console.log("❌ Error inserting gallery_images:", galInsertErr);
    else console.log("✅ Seeded 6 gallery_images!");
  }

  console.log("Done checking and seeding initial content!");
}

seedContent();
