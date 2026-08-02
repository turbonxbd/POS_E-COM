import { TranslationDictionary } from '../../../types/i18n.types';

export const bn: TranslationDictionary = {
  common: {
    appName: 'অ্যান্টিগ্র্যাভিটি প্ল্যাটফর্ম',
    welcome: 'স্বাগতম',
    welcomeUser: 'স্বাগতম, {name}!',
    loading: 'লোড হচ্ছে...',
    save: 'সংরক্ষণ করুন',
    cancel: 'বাতিল করুন',
    delete: 'মুছে ফেলুন',
    edit: 'সম্পাদনা করুন',
    search: 'অনুসন্ধান করুন',
    actions: 'পদক্ষেপ',
    status: 'অবস্থা',
    success: 'সফল হয়েছে',
    error: 'একটি ত্রুটি ঘটেছে',
  },
  auth: {
    login: 'লগইন করুন',
    logout: 'লগআউট করুন',
    email: 'ইমেইল ঠিকানা',
    password: 'পাসওয়ার্ড',
    forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?',
    sessionExpired: 'আপনার সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে পুনরায় লগইন করুন।',
  },
  tenant: {
    organization: 'প্রতিষ্ঠান',
    selectTenant: 'টেন্যান্ট নির্বাচন করুন',
    currentTenant: 'বর্তমান টেন্যান্ট: {tenantName}',
    domain: 'ডোমেইন',
    statusActive: 'সক্রিয়',
    statusInactive: 'নিষ্ক্রিয়',
    statusSuspended: 'স্থগিত',
  },
  theme: {
    mode: 'থিম মোড',
    light: 'লাইট মোড',
    dark: 'ডার্ক মোড',
    system: 'সিস্টেম ডিফল্ট',
    customBranding: 'কাস্টম ব্র্যান্ডিং',
  },
  language: {
    selectLanguage: 'ভাষা নির্বাচন করুন',
    english: 'ইংরেজি',
    bengali: 'বাংলা',
  },
  errors: {
    notFound: 'অনুরোধকৃত তথ্যটি পাওয়া যায়নি।',
    unauthorized: 'এই কাজটি করার জন্য আপনার অনুমতি নেই।',
    serverError: 'অভ্যন্তরীণ সার্ভার ত্রুটি। অনুগ্রহ করে পরে আবার চেষ্টা করুন।',
  },
};

export default bn;
