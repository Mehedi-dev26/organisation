import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'bn' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Navigation
  'nav.home': { bn: 'হোম', en: 'Home' },
  'nav.about': { bn: 'আমাদের সম্পর্কে', en: 'About Us' },
  'nav.members': { bn: 'সদস্যবৃন্দ', en: 'Members' },
  'nav.committee': { bn: 'কমিটি', en: 'Committee' },
  'nav.news': { bn: 'সংবাদ', en: 'News' },
  'nav.gallery': { bn: 'গ্যালারি', en: 'Gallery' },
  'nav.contact': { bn: 'যোগাযোগ', en: 'Contact' },
  'nav.login': { bn: 'লগইন', en: 'Login' },
  
  // Hero
  'hero.title': { bn: 'জনকল্যাণ সংগঠন', en: 'Jonokallyan Sangathan' },
  'hero.subtitle': { bn: 'একতাই শক্তি, সেবাই ধর্ম', en: 'Unity is Strength, Service is Religion' },
  'hero.cta': { bn: 'সদস্য হন', en: 'Become a Member' },
  'hero.learn': { bn: 'আরও জানুন', en: 'Learn More' },
  
  // About
  'about.title': { bn: 'আমাদের সম্পর্কে', en: 'About Us' },
  'about.mission': { bn: 'আমাদের লক্ষ্য', en: 'Our Mission' },
  'about.missionText': { 
    bn: 'সমাজের সুবিধাবঞ্চিত মানুষদের পাশে দাঁড়ানো এবং তাদের জীবনমান উন্নয়নে কাজ করা।', 
    en: 'To stand by the underprivileged people of society and work to improve their quality of life.' 
  },
  'about.vision': { bn: 'আমাদের দৃষ্টিভঙ্গি', en: 'Our Vision' },
  'about.visionText': { 
    bn: 'একটি সুন্দর, সমতাপূর্ণ ও সমৃদ্ধ সমাজ গঠন।', 
    en: 'To build a beautiful, equitable and prosperous society.' 
  },
  'about.values': { bn: 'আমাদের মূল্যবোধ', en: 'Our Values' },
  'about.valuesText': { 
    bn: 'সততা, নিষ্ঠা, সেবা ও ঐক্য।', 
    en: 'Honesty, Dedication, Service and Unity.' 
  },
  
  // Stats
  'stats.members': { bn: 'সদস্য সংখ্যা', en: 'Total Members' },
  'stats.projects': { bn: 'প্রকল্প সমূহ', en: 'Projects' },
  'stats.years': { bn: 'বছরের অভিজ্ঞতা', en: 'Years Experience' },
  'stats.events': { bn: 'অনুষ্ঠান সম্পন্ন', en: 'Events Completed' },
  
  // Committee
  'committee.title': { bn: 'নির্বাহী কমিটি', en: 'Executive Committee' },
  'committee.president': { bn: 'সভাপতি', en: 'President' },
  'committee.vicePresident': { bn: 'সহ-সভাপতি', en: 'Vice President' },
  'committee.secretary': { bn: 'সাধারণ সম্পাদক', en: 'General Secretary' },
  'committee.treasurer': { bn: 'কোষাধ্যক্ষ', en: 'Treasurer' },
  'committee.member': { bn: 'কার্যনির্বাহী সদস্য', en: 'Executive Member' },
  
  // News
  'news.title': { bn: 'সর্বশেষ সংবাদ', en: 'Latest News' },
  'news.readMore': { bn: 'বিস্তারিত পড়ুন', en: 'Read More' },
  
  // Contact
  'contact.title': { bn: 'যোগাযোগ করুন', en: 'Contact Us' },
  'contact.name': { bn: 'আপনার নাম', en: 'Your Name' },
  'contact.email': { bn: 'ইমেইল', en: 'Email' },
  'contact.phone': { bn: 'ফোন নম্বর', en: 'Phone Number' },
  'contact.message': { bn: 'বার্তা', en: 'Message' },
  'contact.send': { bn: 'পাঠান', en: 'Send Message' },
  'contact.address': { bn: 'ঠিকানা', en: 'Address' },
  
  // Footer
  'footer.rights': { bn: 'সর্বস্বত্ব সংরক্ষিত', en: 'All Rights Reserved' },
  'footer.quickLinks': { bn: 'দ্রুত লিংক', en: 'Quick Links' },
  'footer.followUs': { bn: 'আমাদের অনুসরণ করুন', en: 'Follow Us' },
  
  // Members
  'members.title': { bn: 'আমাদের সদস্যবৃন্দ', en: 'Our Members' },
  'members.search': { bn: 'সদস্য খুঁজুন...', en: 'Search members...' },
  'members.total': { bn: 'মোট সদস্য', en: 'Total Members' },
  
  // Gallery
  'gallery.title': { bn: 'ছবি গ্যালারি', en: 'Photo Gallery' },
  
  // Common
  'common.loading': { bn: 'লোড হচ্ছে...', en: 'Loading...' },
  'common.error': { bn: 'কিছু ভুল হয়েছে', en: 'Something went wrong' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('bn');
  
  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
