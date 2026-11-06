export interface CommitteeMember {
  id: string;
  name_bn: string;
  name_en: string | null;
  position_bn: string;
  position_en: string | null;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  sort_order: number | null;
  term_start?: string | null;
  term_end?: string | null;
  member_id?: string | null;
}

export interface CustomCommitteeDetail {
  role_category?: string;
  responsibilities?: string[];
  about?: string;
}

export type CommitteeCustomDetailsMap = Record<string, CustomCommitteeDetail>;

// Professional Organizational Role & Responsibilities Helper
export const getMemberRoleDetails = (
  position: string,
  language: string = 'bn',
  customDetail?: CustomCommitteeDetail | null
) => {
  // If custom responsibilities are provided by admin, prioritize them!
  if (customDetail && (
    (customDetail.responsibilities && customDetail.responsibilities.length > 0) ||
    customDetail.about ||
    customDetail.role_category
  )) {
    return {
      category: customDetail.role_category || (language === 'bn' ? 'সংগঠনের নির্ধারিত ভূমিকা ও দায়িত্ব' : 'Assigned Role & Responsibilities'),
      responsibilities: (customDetail.responsibilities && customDetail.responsibilities.length > 0)
        ? customDetail.responsibilities
        : (language === 'bn' 
            ? ['সংগঠনের অর্পিত দায়িত্ব নিষ্ঠা ও স্বচ্ছতার সাথে পালন করা।']
            : ['Fulfilling assigned organizational responsibilities with dedication.']),
      about: customDetail.about || '',
    };
  }

  const pos = (position || '').toLowerCase();

  if (pos.includes('পরিচালক') || pos.includes('director')) {
    return {
      category: language === 'bn' ? 'প্রধান পরিচালনা ও সর্বোচ্চ দিকনির্দেশনা' : 'Chief Directorate & Direction',
      responsibilities: language === 'bn' ? [
        'সংগঠনের সামগ্রিক রূপরেখা, দীর্ঘমেয়াদী পরিকল্পনা ও ভিশন নির্ধারণ।',
        'সকল প্রকল্প, সমাজকল্যাণমূলক কর্মসূচি ও প্রাতিষ্ঠানিক কার্যক্রমের সর্বোচ্চ তদারকি।',
        'কার্যনির্বাহী পরিষদ ও উপদেষ্টা পরিষদের মাঝে সুষ্ঠু সমন্বয় রক্ষা ও উন্নয়ন নীতি অনুমোদন।'
      ] : [
        'Defines organizational vision, mission and strategic roadmap.',
        'Supreme oversight of all developmental and humanitarian programs.',
        'Harmonizes coordination between Executive and Advisory Councils.'
      ]
    };
  }

  if (pos.includes('সভাপতি') && !pos.includes('সহ')) {
    return {
      category: language === 'bn' ? 'শীর্ষ নেতৃত্ব ও নীতিনির্ধারণ' : 'Supreme Executive Leadership',
      responsibilities: language === 'bn' ? [
        'সংগঠনের প্রধান অভিভাবক ও সকল কার্যনির্বাহী সিদ্ধান্তের চূড়ান্ত অনুমোদনকারী।',
        'পরিষদের সাধারণ ও জরুরি সভায় সভাপতিত্ব করা এবং দিকনির্দেশনা প্রদান।',
        'সংগঠনের গঠনতন্ত্র, আদর্শ এবং দীর্ঘমেয়াদী জনকল্যাণমূলক পরিকল্পনা তদারকি।',
        'জাতীয় ও প্রাতিষ্ঠানিক পর্যায়ে সংগঠনের প্রতিনিধিত্ব অক্ষুণ্ণ রাখা।'
      ] : [
        'Chief executive & constitutional guardian of the organization.',
        'Presides over all executive and general assembly sessions.',
        'Directs strategic welfare policies and development programs.',
        'Represents the organization in institutional forums.'
      ]
    };
  }

  if (pos.includes('সাধারণ সম্পাদক')) {
    return {
      category: language === 'bn' ? 'প্রশাসনিক নেতৃত্ব ও কেন্দ্রীয় সমন্বয়' : 'Executive Administration',
      responsibilities: language === 'bn' ? [
        'সংগঠনের সার্বিক প্রশাসনিক কার্যক্রম পরিচালনা ও সকল বিভাগীয় কাজের সমন্বয়।',
        'কার্যনির্বাহী পরিষদের সভা আহ্বান, আলোচ্যসূচি প্রস্তুত ও কার্যবিবরণী সংরক্ষণ।',
        'সকল বিভাগীয় সম্পাদকদের কাজের অগ্রগতি পর্যবেক্ষণ ও দিকনির্দেশনা প্রদান।',
        'মাঠপর্যায়ে জরুরি মানবিক কার্যক্রম বাস্তবায়ন ও স্বেচ্ছাসেবক পরিচালনা।'
      ] : [
        'Heads day-to-day administrative operations and departmental coordination.',
        'Convenes committee meetings, prepares agendas and official minutes.',
        'Supervises departmental secretaries and reviews program milestones.',
        'Leads field deployment of emergency humanitarian aid.'
      ]
    };
  }

  if (pos.includes('সহ-সভাপতি') || pos.includes('সহসভাপতি')) {
    return {
      category: language === 'bn' ? 'শীর্ষ সহযোগী নেতৃত্ব' : 'Vice Executive Leadership',
      responsibilities: language === 'bn' ? [
        'সভাপতির অনুপস্থিতিতে সভাপতির সমুদয় দায়িত্ব নিষ্ঠার সাথে পালন করা।',
        'গুরুত্বপূর্ণ প্রকল্প, তহবিল সংগ্রহ ও নীতিগত সিদ্ধান্তে শীর্ষ সহায়তা প্রদান।',
        'সংগঠনের অভ্যন্তরীণ শৃঙ্খলা রক্ষা ও বিভাগীয় সম্পাদকদের সাথে পরামর্শমূলক সমন্বয়।'
      ] : [
        'Acts with presidential authority in the absence of the President.',
        'Assists in strategic decisions, fundraising, and welfare projects.',
        'Mentors departmental leadership for optimal performance.'
      ]
    };
  }

  if (pos.includes('ক্যাশিয়ার') || pos.includes('কোষাধ্যক্ষ') || pos.includes('অর্থ') || pos.includes('cashier')) {
    return {
      category: language === 'bn' ? 'অর্থ ব্যবস্থাপনা ও আর্থিক স্বচ্ছতা' : 'Treasury & Financial Management',
      responsibilities: language === 'bn' ? [
        'সংগঠনের সমুদয় আয়-ব্যয়, ব্যাংক হিসাব ও তহবিলের শতভাগ স্বচ্ছতা সংরক্ষণ।',
        'সদস্য চাঁদা ও অনুদান সংগ্রহ, ডিজিটাল রসিদ ইস্যু এবং ক্যাশ রেজিস্টার পরিচালনা।',
        'মাসিক ও বার্ষিক আর্থিক বিবরণী প্রস্তুত ও উন্মুক্ত ডিজিটাল অডিট নিশ্চিতকরণ।',
        'যেকোনো মানবিক ব্যয়ে সুনির্দিষ্ট ভাউচার ও অনুমোদন তদারকি।'
      ] : [
        'Maintains absolute transparency in organizational funds and bank accounts.',
        'Manages member dues collection, digital receipt vouchers, and ledger.',
        'Prepares comprehensive monthly and annual financial audits.',
        'Oversees systematic budget allocations for welfare aid.'
      ]
    };
  }

  if (pos.includes('তথ্যপ্রযুক্তি') || pos.includes('আইসিটি') || pos.includes('ict')) {
    return {
      category: language === 'bn' ? 'তথ্যপ্রযুক্তি ও ডিজিটাল উদ্ভাবন' : 'ICT & Digital Innovation',
      responsibilities: language === 'bn' ? [
        'সংগঠনের অফিশিয়াল ওয়েবসাইট, মেম্বার পোর্টাল ও ডাটাবেসের সার্বক্ষণিক রক্ষণাবেক্ষণ।',
        'অনলাইন চাঁদা পরিশোধ ও ডিজিটাল রসিদ সিস্টেমের কারিগরি নিরাপত্তা বিধান।',
        'অনলাইন সদস্য নিবন্ধন, ডিজিটাল আইডি কার্ড ও সফটওয়্যার আপগ্রেড নিশ্চিতকরণ।',
        'আধুনিক তথ্যপ্রযুক্তির মাধ্যমে সংগঠনের মানবিক প্রচার ও রূপান্তর ত্বরান্বিত করা।'
      ] : [
        'Maintains the official web platform, member management portal and database.',
        'Ensures cyber security, server reliability, and digital payment gateways.',
        'Oversees online member onboarding and digital identity cards.',
        'Drives digital transformation across all organizational workflows.'
      ]
    };
  }

  if (pos.includes('সাংগঠনিক')) {
    return {
      category: language === 'bn' ? 'সাংগঠনিক বিস্তার ও নেটওয়ার্কিং' : 'Organizational Development',
      responsibilities: language === 'bn' ? [
        'সংগঠনের তৃণমূল পর্যায় বিস্তার এবং নতুন স্বেচ্ছাসেবী সদস্য তৈরি।',
        'সদস্যদের সক্রিয় অংশগ্রহণ বৃদ্ধি এবং নিয়মিত সাংগঠনিক শৃঙ্খলা বজায় রাখা।',
        'মাঠপর্যায়ে বিভিন্ন সামাজিক কার্যক্রম বাস্তবায়নে টিম গঠন ও সমন্বয়।'
      ] : [
        'Strengthens grassroots reach and active volunteer recruitment.',
        'Ensures active member participation and organizational discipline.',
        'Forms and coordinates dynamic execution teams for social programs.'
      ]
    };
  }

  if (pos.includes('দপ্তর')) {
    return {
      category: language === 'bn' ? 'দাপ্তরিক ও নথি সংরক্ষণ' : 'Office & Records Management',
      responsibilities: language === 'bn' ? [
        'সংগঠনের অফিশিয়াল নথিপত্র, সভার নোটিশ ও চিঠি আদান-প্রদান ব্যবস্থাপনা।',
        'সদস্য তালিকা ও গুরুত্বপূর্ণ প্রাতিষ্ঠানিক তথ্যাদি সুশৃঙ্খলভাবে সংরক্ষণ।',
        'দাপ্তরিক যোগাযোগ এবং অভ্যন্তরীণ আদেশ ও বিজ্ঞপ্তি প্রচার।'
      ] : [
        'Oversees official documentation, notices, and correspondence.',
        'Maintains orderly registers of member records and proceedings.',
        'Manages internal memos and administrative communication.'
      ]
    };
  }

  if (pos.includes('প্রচার')) {
    return {
      category: language === 'bn' ? 'প্রচার, প্রকাশনা ও মিডিয়া সংযোগ' : 'Public Relations & Media',
      responsibilities: language === 'bn' ? [
        'সংগঠনের মানবিক উদ্যোগসমূহের সংবাদ গণমাধ্যম ও সোশ্যাল মিডিয়ায় প্রচার।',
        'প্রেস বিজ্ঞপ্তি, স্মরণিকা, ব্যানার ও সচেতনতামূলক প্রকাশনা পরিচালনা।',
        'সাধারণ মানুষের কাছে সংগঠনের মানবিক বার্তা পৌঁছে দেওয়া।'
      ] : [
        'Disseminates humanitarian news across social media and press outlets.',
        'Publishes press releases, event coverage, and awareness materials.',
        'Enhances public goodwill and community engagement.'
      ]
    };
  }

  if (pos.includes('রক্ত') || pos.includes('সমাজকল্যাণ')) {
    return {
      category: language === 'bn' ? 'জরুরি রক্তদান ও সমাজকল্যাণ' : 'Blood Donation & Social Welfare',
      responsibilities: language === 'bn' ? [
        '২৪/৭ জরুরি প্রয়োজনে অসহায় মুমূর্ষু রোগীর রক্তের সন্ধান ও রক্তদাতা সমন্বয়।',
        'বিনামূল্যে রক্তের গ্রুপ নির্ণয় ও স্বেচ্ছায় রক্তদান ক্যাম্পের আয়োজন।',
        'অসহায় পরিবার ও দরিদ্র রোগীদের মাঝে জরুরি চিকিৎসা ও খাদ্য সহায়তা বিতরণ।'
      ] : [
        '24/7 coordination of volunteer blood donors for critical patients.',
        'Organizes free blood-group testing and community donation drives.',
        'Directs emergency medical support and humanitarian relief.'
      ]
    };
  }

  return {
    category: language === 'bn' ? 'কার্যনির্বাহী দায়িত্ব ও মানবিক সেবা' : 'Executive Council Responsibilities',
    responsibilities: language === 'bn' ? [
      'সংগঠনের সকল জনকল্যাণমূলক কর্মসূচিতে প্রত্যক্ষ ও সক্রিয় অংশগ্রহণ।',
      'পরিষদের নীতিনির্ধারণী সভায় গঠনমূলক মতামত ও পরামর্শ প্রদান।',
      'অসহায় মানুষের সেবায় সবসময় নিবেদিত থাকা এবং পারস্পরিক ঐক্য সুদৃঢ় রাখা।'
    ] : [
      'Active participation and leadership in all welfare initiatives.',
      'Contributes constructive insights during council meetings.',
      'Dedicated to selfless service and upholding organizational integrity.'
    ]
  };
};

