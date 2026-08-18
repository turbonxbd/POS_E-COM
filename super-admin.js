// SmartPOS - Super Admin Master Control Console Engine
// Features 7 Core Modules with separated Access Setup Fees (Tab 3) & Monthly Recurring Subscriptions (Tab 4)

let subscribersList = [];
let filteredSubscribers = [];
let activeSubFilter = 'all';

// Default CMS State
const DEFAULT_CMS = {
  hero: {
    badge: '🔥 বাংলাদেশের সবচেয়ে দ্রুতগতির POS ও ইনভентরি ম্যানেজমেন্ট',
    title: 'আপনার সুপারশপ ও শোরুম সামলান এক ক্লিকে!',
    desc: 'সম্পূর্ণ নিরাপদ অটো-বারকোড স্ক্যানিং, মেমো প্রিন্টিং, বাকি খাতা ও কাস্টমার রিপোর্ট ম্যানেজমেন্ট সিস্টেম।',
    videoUrl: 'https://www.youtube.com/embed/5qap5aO4i9A'
  },
  rates: {
    rate1m: 150,
    rate6m: 810,
    rate12m: 1440,
    rateAccess: 14999
  },
  discountBadge: '🎉 ২০% স্পেশাল ডিসকাউন্ট অফার!',
  promoBanner: 'সীমিত সময়ের জন্য এক্সেস ফি-তে পাচ্ছেন বিশাল ছাড়!',
  bkashNumber: '01700000000',
  nagadNumber: '01800000000',
  rocketNumber: '01900000000-7',
  bankDetails: 'Dutch Bangla Bank - A/C: 123456789 - Branch: Gulshan',
  pushNotificationMsg: 'আপনার স্টোরের সাবস্ক্রিপশনের মেয়াদের সময় প্রায় শেষ! নিরবচ্ছিন্ন সেবা পেতে এখনই রিনিউ করুন।'
};

let currentCMS = { ...DEFAULT_CMS };

document.addEventListener('DOMContentLoaded', () => {
  initMasterAuth();
  initTabNavigation();
  loadCMSData();
  initCMSForms();
  loadSubscribers();
});

// Master PIN Security Auth Gate
function initMasterAuth() {
  const overlay = document.getElementById('masterAuthOverlay');
  const form = document.getElementById('masterLoginForm');

  if (sessionStorage.getItem('pos_master_authenticated') === 'true') {
    if (overlay) overlay.style.display = 'none';
    return;
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const pin = document.getElementById('masterPinInput').value.trim();
      if (pin === 'admin123' || pin === '0000' || pin === '1234') {
        sessionStorage.setItem('pos_master_authenticated', 'true');
        if (overlay) overlay.style.display = 'none';
      } else {
        alert('❌ ভুল মাস্টার পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিয়ে চেষ্টা করুন।');
      }
    });
  }
}

// Tab Navigation Manager for 7 Core Modules
function initTabNavigation() {
  const menuItems = document.querySelectorAll('.master-menu-item[data-tab]');
  const tabViews = document.querySelectorAll('.tab-view');
  const titleEl = document.getElementById('activeTabTitle');

  const tabTitles = {
    tabOverview: '১. প্ল্যাটফর্ম ড্যাশবোর্ড ও অ্যানালিটিক্স',
    tabMerchants: '২. মার্চেন্ট অ্যাকাউন্টস ও প্রোফাইল ডিরেক্টরি',
    tabAccessFees: '৩. এক্সেস ফি ও এককালীন সেটআপ পারচেজ (Setup Fees)',
    tabMonthlySubscriptions: '৪. মাসিক সাবস্ক্রিপশন ফি ও রিনিউাল হাব (Monthly)',
    tabConsoleCMS: '৫. স্মার্ট POS ল্যান্ডিং পেজ কনসোল (CMS)',
    tabPaymentGateways: '৬. পেমেন্ট গেটওয়ে ডিটেইলস সেটিংস',
    tabSecurityLogs: '৭. সিকিউরিটি ও আইসোলেশন লগস'
  };

  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.dataset.tab;

      menuItems.forEach(m => m.classList.remove('active'));
      item.classList.add('active');

      tabViews.forEach(view => {
        view.style.display = view.id === targetTab ? 'block' : 'none';
      });

      if (titleEl && tabTitles[targetTab]) {
        titleEl.textContent = tabTitles[targetTab];
      }

      if (targetTab === 'tabAccessFees') renderAccessFeesTable();
      if (targetTab === 'tabMonthlySubscriptions') renderPendingSubscriptionsTable();
    });
  });
}

// Convert English numbers to Bengali numbers
function toBnNum(num) {
  const bnNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, d => bnNums[d]);
}

// Calculate detailed remaining time: Days + Minutes
function formatRemainingTime(expiryDateIso) {
  if (!expiryDateIso) return { expired: true, text: 'মেয়াদ শেষ!', days: 0, minutes: 0 };
  const expiry = new Date(expiryDateIso);
  const now = new Date();
  const diffMs = expiry - now;

  if (diffMs <= 0) return { expired: true, text: 'মেয়াদ শেষ হয়ে গেছে!', days: 0, minutes: 0 };

  const diffMinsTotal = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(diffMinsTotal / (60 * 24));
  const mins = diffMinsTotal % 60;
  const months = Math.floor(days / 30);

  if (days >= 30) {
    const remDays = days % 30;
    return { expired: false, days, minutes: mins, text: `${toBnNum(months)} মাস ${remDays > 0 ? toBnNum(remDays) + ' দিন' : ''}`.trim() };
  } else {
    return { expired: false, days, minutes: mins, text: `${toBnNum(days)} দিন ${toBnNum(mins)} মিনিট` };
  }
}

// Load Subscribers Data INSTANTLY from LocalStorage first (0ms), then fetch Firestore in parallel (Promise.all)
async function loadSubscribers() {
  // Step 1: Render Local Cached Data INSTANTLY (0ms Delay)
  let cachedSubs = JSON.parse(localStorage.getItem('pos_subscriptions')) || [];
  if (Array.isArray(cachedSubs) && cachedSubs.length > 0) {
    subscribersList = cachedSubs;
    renderDashboardStats();
    renderSubscribersMasterTable();
  }

  // Step 2: Parallel Async Cloud Synchronization
  // Step 2: Unique Merchant Deduplication Engine: Groups multi-request renewals by unique Phone Number / Store Name
  const mergedMap = new Map();

  const getDedupeKey = (item) => {
    if (!item) return null;

    let phone = (item.phone || item.senderPhone || item.storePhone || '').replace(/[^0-9]/g, '');
    if (phone.startsWith('88')) phone = phone.substring(2);

    const storeName = (item.storeName || item.name || '').trim().toLowerCase();
    const ownerName = (item.ownerName || item.storeOwner || '').trim().toLowerCase();

    // 1. Primary Deduplication Key: Phone Number (if valid 10-11 digits)
    if (phone.length >= 10) {
      return `phone_${phone}`;
    }

    // 2. Secondary Deduplication Key: Normalized Store Name + Owner Name
    if (storeName && storeName !== 'merchant shop') {
      return `name_${storeName}_${ownerName}`;
    }

    // 3. Fallback Key: Store ID
    return item.storeId || item.id || `store_${Date.now()}`;
  };

  const addMerchantToMap = (item) => {
    if (!item) return;
    const key = getDedupeKey(item);
    if (!key) return;

    const storeId = item.storeId || item.id || `store_${Date.now()}`;
    const normalizedItem = {
      id: storeId,
      storeId: storeId,
      storeName: item.storeName || item.name || 'Merchant Shop',
      ownerName: item.ownerName || item.storeOwner || 'Merchant Owner',
      phone: item.phone || item.storePhone || '01700000000',
      email: item.email || item.storeEmail || '',
      storeAddress: item.storeAddress || item.address || 'Dhaka, Bangladesh',
      plan: item.plan || 'SmartPOS Counter + E-Commerce Combo',
      setupFee: item.setupFee || (currentCMS.rates ? currentCMS.rates.rateAccess : 14999),
      amountPaid: item.amountPaid || 150,
      requestedMonths: item.requestedMonths || 1,
      status: item.status || 'Active Paid',
      subRequestStatus: item.subRequestStatus || undefined,
      isRead: item.isRead === true,
      isTrial: item.isTrial !== false,
      accountBlocked: item.accountBlocked === true,
      accessBlocked: item.accessBlocked === true,
      accessFeePaid: item.accessFeePaid !== false,
      trialExpiresAt: item.trialExpiresAt || (item.createdAt ? new Date(new Date(item.createdAt).getTime() + 7 * 86400000).toISOString() : new Date(0).toISOString()),
      paymentMethod: item.paymentMethod || 'bKash Send Money',
      trxId: item.trxId || '',
      senderPhone: item.senderPhone || item.phone || '',
      createdAt: item.createdAt || item.submittedAt || new Date().toISOString()
    };

    if (mergedMap.has(key)) {
      const existing = mergedMap.get(key);

      // Intelligently merge: Keep the one-time setupFee paid on registration!
      const mergedTrialExpiresAt = (new Date(normalizedItem.trialExpiresAt) > new Date(existing.trialExpiresAt)) 
        ? normalizedItem.trialExpiresAt 
        : existing.trialExpiresAt;

      const mergedSetupFee = existing.setupFee || normalizedItem.setupFee || 14999;
      
      // CRITICAL FIX: If existing item is ALREADY Approved or Rejected, DO NOT let legacy cloud sync docs revert status to 'Pending'!
      const existingStatus = existing.subRequestStatus;
      const isAlreadyResolved = existingStatus === 'Approved' || existingStatus === 'Rejected';

      const incomingStatus = normalizedItem.subRequestStatus;
      const incomingIsResolved = incomingStatus === 'Approved' || incomingStatus === 'Rejected';

      let finalStatus = existingStatus;
      if (incomingIsResolved || (!isAlreadyResolved && incomingStatus)) {
        finalStatus = incomingStatus;
      }

      let finalTrxId = normalizedItem.trxId || existing.trxId || normalizedItem.transactionId || existing.transactionId || normalizedItem.trx || existing.trx || '';

      mergedMap.set(key, {
        ...existing,
        ...normalizedItem,
        id: existing.id || normalizedItem.id,
        storeId: existing.storeId || normalizedItem.storeId,
        setupFee: mergedSetupFee,
        trialExpiresAt: mergedTrialExpiresAt,
        subRequestStatus: finalStatus,
        trxId: finalTrxId,
        isRead: (finalStatus === 'Approved' || finalStatus === 'Rejected') ? true : (existing.isRead || normalizedItem.isRead)
      });
    } else {
      if (normalizedItem.subRequestStatus === 'Approved' || normalizedItem.subRequestStatus === 'Rejected') {
        normalizedItem.isRead = true;
      }
      mergedMap.set(key, normalizedItem);
    }
  };

  // Seed map with cached stores first
  if (Array.isArray(cachedSubs)) cachedSubs.forEach(addMerchantToMap);
  let activeSub = JSON.parse(localStorage.getItem('pos_subscription'));
  if (activeSub) addMerchantToMap(activeSub);

  if (window.POS_FIREBASE && window.POS_FIREBASE.db) {
    try {
      // Parallel Fetch: Fetch /stores and /subscriptions simultaneously
      const [storesSnapshot, subSnapshot] = await Promise.all([
        window.POS_FIREBASE.db.collection('stores').get().catch(() => null),
        window.POS_FIREBASE.db.collection('subscriptions').get().catch(() => null)
      ]);

      if (storesSnapshot && !storesSnapshot.empty) {
        // Parallel inner fetching of store settings for all stores at once
        await Promise.all(storesSnapshot.docs.map(async (doc) => {
          const storeData = doc.data() || {};
          const profile = storeData.profile || storeData;
          try {
            const settingsDoc = await window.POS_FIREBASE.db.collection('stores').doc(doc.id).collection('pos_data').doc('pos_settings').get();
            const settings = settingsDoc.exists ? (settingsDoc.data().data || {}) : {};

            const ownerName = settings.ownerName || settings.storeOwner || profile.ownerName || profile.storeOwner || storeData.ownerName || 'Merchant Owner';
            const phone = settings.phone || settings.storePhone || settings.personalPhone || profile.phone || profile.storePhone || profile.senderPhone || storeData.phone || '';
            const email = settings.email || settings.storeEmail || settings.personalEmail || profile.email || profile.storeEmail || storeData.email || '';
            const storeAddress = settings.storeAddress || profile.storeAddress || storeData.storeAddress || 'Dhaka, Bangladesh';

            addMerchantToMap({
              storeId: doc.id,
              id: doc.id,
              ...profile,
              ...storeData,
              storeName: settings.storeName || profile.storeName || storeData.storeName || doc.id,
              ownerName,
              phone,
              email,
              storeAddress,
              plan: profile.plan || storeData.plan || 'SmartPOS Counter + E-Commerce Combo',
              setupFee: profile.setupFee || storeData.setupFee || 14999,
              status: profile.status || storeData.status || 'Active Paid',
              isFreshSignup: true
            });
          } catch (e) {
            addMerchantToMap({ storeId: doc.id, id: doc.id, ...profile, ...storeData, isFreshSignup: true });
          }
        }));
      }

      if (subSnapshot && !subSnapshot.empty) {
        subSnapshot.forEach(doc => addMerchantToMap({ id: doc.id, ...doc.data() }));
      }
    } catch (err) {
      console.warn('[Super Admin Cloud Sync Warning]:', err);
    }
  }

  // Filter out mock test entries from legacy test runs
  const allLoaded = Array.from(mergedMap.values());
  let validStores = allLoaded.filter(item => {
    const isGuest = item.storeId === 'store_demo_101' || item.id === 'store_demo_101';
    if (isGuest) return true;

    const name = (item.storeName || '').toLowerCase();
    const phone = (item.phone || item.senderPhone || '');
    if (name.includes('hhhh') || name.includes('bbbb') || name.includes('gggg') || phone.includes('01333333333') || phone.includes('01222222222')) {
      return false;
    }
    return true;
  });

  if (validStores.length === 0) {
    validStores = [{
      id: 'store_demo_101',
      storeId: 'store_demo_101',
      storeName: 'গেস্ট ডেমো সুপারশপ (Default Guest Account)',
      ownerName: 'গেস্ট এডমিন',
      phone: '01700000000',
      email: 'guest@smartpos.com',
      storeAddress: 'ঢাকা, বাংলাদেশ',
      plan: 'SmartPOS Counter + E-Commerce Combo',
      setupFee: 14999,
      status: 'Active Paid',
      isTrial: false,
      accountBlocked: false,
      accessBlocked: false,
      accessFeePaid: true,
      trialExpiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
      paymentMethod: 'bKash Send Money',
      trxId: 'GUEST1234',
      senderPhone: '01700000000',
      createdAt: '2026-08-01'
    }];
  }

  subscribersList = validStores;
  localStorage.setItem('pos_subscriptions', JSON.stringify(subscribersList));

  renderDashboardStats();
  renderSubscribersMasterTable();
  await loadSubscriptionRequests();
}

// Render Dashboard Analytics Overview (Separated Setup Fees & Monthly Subscriptions)
function renderDashboardStats() {
  const totalStores = subscribersList.length;

  let totalAccessFees = subscribersList.reduce((acc, curr) => acc + (parseFloat(curr.setupFee) || 14999), 0);
  let totalMonthlySubs = subscribersList.reduce((acc, curr) => acc + (parseFloat(curr.amountPaid) || 150), 0);
  let grandRevenue = totalAccessFees + totalMonthlySubs;

  document.getElementById('statTotalStores').textContent = toBnNum(totalStores);
  document.getElementById('statAccessFeeTotal').textContent = `৳${toBnNum(totalAccessFees.toLocaleString())}`;
  document.getElementById('statMonthlySubTotal').textContent = `৳${toBnNum(totalMonthlySubs.toLocaleString())}`;
  document.getElementById('statTotalRevenue').textContent = `৳${toBnNum(grandRevenue.toLocaleString())}`;

  // Overview Table
  const overviewBody = document.getElementById('overviewSubscribersBody');
  if (overviewBody) {
    overviewBody.innerHTML = subscribersList.slice(0, 5).map(s => `
      <tr>
        <td><strong>${s.storeName}</strong></td>
        <td>${s.ownerName} (${s.phone})</td>
        <td><span class="badge" style="background:rgba(59,130,246,0.15); color:#3b82f6; padding:2px 8px; border-radius:10px;">৳${toBnNum(s.setupFee || 14999)} (Setup)</span></td>
        <td><span class="badge" style="background:rgba(225,29,72,0.15); color:#e11d48; padding:2px 8px; border-radius:10px;">৳${toBnNum(s.amountPaid || 150)}/মাস</span></td>
        <td><span class="badge-status ${s.accountBlocked ? 'badge-suspended' : (s.isTrial ? 'badge-pending' : 'badge-active')}">${s.accountBlocked ? 'সাসপেন্ডেড' : s.status}</span></td>
        <td>${s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('bn-BD') : 'আজকে'}</td>
      </tr>
    `).join('') || `<tr><td colspan="6" class="text-center p-3 text-muted">কোনো সাবস্ক্রাইবার পাওয়া যায়নি</td></tr>`;
  }
}

// Filter Subscribers
function filterSubscribers(filterType) {
  if (filterType) activeSubFilter = filterType;

  const searchInput = document.getElementById('subSearchInput')?.value.toLowerCase().trim() || '';

  document.querySelectorAll('.sub-filter-pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.subfilter === activeSubFilter);
  });

  filteredSubscribers = subscribersList.filter(s => {
    let matchFilter = true;
    if (activeSubFilter === 'active') matchFilter = !s.accountBlocked && (s.status === 'Active Paid' || !s.isTrial);
    else if (activeSubFilter === 'trial') matchFilter = !s.accountBlocked && s.isTrial;
    else if (activeSubFilter === 'suspended') matchFilter = s.accountBlocked || s.status === 'Suspended';

    let matchSearch = !searchInput || (
      (s.storeName && s.storeName.toLowerCase().includes(searchInput)) ||
      (s.ownerName && s.ownerName.toLowerCase().includes(searchInput)) ||
      (s.phone && s.phone.includes(searchInput)) ||
      (s.storeId && s.storeId.toLowerCase().includes(searchInput))
    );

    return matchFilter && matchSearch;
  });

  renderSubscribersMasterTable();
}

// Render Master Merchant Directory Table (With Active Duration & Direct +/- Days Edit Controls)
function renderSubscribersMasterTable() {
  const masterBody = document.getElementById('subscribersMasterTableBody');
  const list = filteredSubscribers.length > 0 || activeSubFilter !== 'all' ? filteredSubscribers : subscribersList;

  if (!masterBody) return;

  masterBody.innerHTML = list.map(s => {
    const expiryIso = s.trialExpiresAt || new Date(Date.now() + 7 * 86400000).toISOString();
    const timeInfo = formatRemainingTime(expiryIso);
    const isExpired = timeInfo.expired || (new Date(expiryIso) <= new Date());
    const isStopped = s.accountBlocked === true || s.status === 'Stopped' || s.status === 'Suspended' || isExpired;

    return `
      <tr style="cursor: pointer;" onclick="openMerchantProfileModal('${s.storeId || s.id}')">
        <td>
          <strong style="font-size:0.95rem; color:#fff; display:block;">${s.storeName}</strong>
          <small style="color:#94a3b8;"><i class="fa-solid fa-location-dot"></i> ${s.storeAddress || 'ঢাকা, বাংলাদেশ'}</small>
        </td>
        <td>
          <strong style="color:#a855f7; display:block;">${s.ownerName}</strong>
          <small style="color:#94a3b8;"><i class="fa-solid fa-phone"></i> ${s.phone}</small>
        </td>
        <td><span class="badge" style="background:rgba(59,130,246,0.15); color:#3b82f6; padding:2px 8px; border-radius:10px;">${s.plan || 'POS Counter + E-Commerce Combo'}</span></td>
        <td>
          <span style="font-weight: 700; color: ${isExpired ? '#ef4444' : '#10b981'}; display: block;">
            <i class="fa-solid ${isExpired ? 'fa-circle-xmark' : 'fa-hourglass-half'}"></i> ${isExpired ? '🔴 000 (০ দিন বাকি / মেয়াদ শেষ)' : timeInfo.text}
          </span>
          <small style="color: #64748b; font-size: 0.78rem;">শেষ তারিখ: ${new Date(expiryIso).toLocaleDateString('bn-BD')}</small>
        </td>
        <td>
          <span class="badge-status ${isStopped ? 'badge-suspended' : (s.isTrial ? 'badge-pending' : 'badge-active')}">${isExpired ? '🔴 সাবস্ক্রিপশন শেষ' : (isStopped ? '⛔ বন্ধ/স্থগিত' : s.status)}</span>
        </td>
        <td onclick="event.stopPropagation();">
          <div style="display:flex; gap:0.4rem; justify-content:center; flex-wrap:wrap;">
            <button onclick="openMerchantProfileModal('${s.storeId || s.id}')" class="btn-submit" style="padding:0.35rem 0.55rem; font-size:0.75rem; background:linear-gradient(135deg, #a855f7, #7c3aed);" title="প্রোফাইল ডিটেইলস">
              <i class="fa-solid fa-id-card"></i> প্রোফাইল
            </button>
            <button onclick="extendMerchantSubscription('${s.storeId || s.id}')" class="btn-submit" style="padding:0.35rem 0.55rem; font-size:0.75rem; background:#8b5cf6;" title="সাবস্ক্রিপশন মেয়াদ দিন বাড়ান বা কমান (+/-)">
              <i class="fa-solid fa-calendar-plus"></i> মেয়াদ +/-
            </button>
            <button onclick="loginAsMerchant('${s.storeId || s.id}')" class="btn-submit" style="padding:0.35rem 0.55rem; font-size:0.75rem; background:linear-gradient(135deg, #3b82f6, #2563eb);" title="মার্চেন্ট এডমিন প্যানেলে ঢুকুন">
              <i class="fa-solid fa-user-gear"></i> এডমিন
            </button>
            <button onclick="loginAsCashier('${s.storeId || s.id}')" class="btn-submit" style="padding:0.35rem 0.55rem; font-size:0.75rem; background:linear-gradient(135deg, #10b981, #059669);" title="ক্যাশিয়ার POS প্যানেলে ঢুকুন">
              <i class="fa-solid fa-cash-register"></i> POS
            </button>
            <button onclick="toggleMonthlySubscriptionStatus('${s.storeId || s.id}')" class="btn-submit" style="padding:0.35rem 0.55rem; font-size:0.75rem; background:${isStopped ? '#10b981' : '#e11d48'};" title="${isStopped ? 'অ্যাকাউন্ট চালু' : 'অ্যাকাউন্ট বন্ধ'}">
              <i class="fa-solid ${isStopped ? 'fa-play' : 'fa-pause'}"></i> ${isStopped ? 'চালু' : 'বন্ধ'}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="6" class="text-center p-3 text-muted">কোনো সাবস্ক্রাইবার মার্চেন্ট পাওয়া যায়নি</td></tr>`;
}

// Render Dedicated Access Setup Fees Table (Tab 3 - With Access Block vs Approve)
function renderAccessFeesTable() {
  const body = document.getElementById('accessFeesTableBody');
  if (!body) return;

  body.innerHTML = subscribersList.map(s => `
    <tr>
      <td><strong>${s.storeName}</strong></td>
      <td>${s.ownerName} (${s.phone})</td>
      <td><span class="badge" style="background:rgba(59,130,246,0.15); color:#3b82f6; padding:2px 8px; border-radius:10px;">${s.plan || 'SmartPOS Counter + E-Commerce Combo'}</span></td>
      <td><strong style="color:#10b981; font-size:1rem;">৳${toBnNum(s.setupFee || 14999)} BDT</strong></td>
      <td>
        <span class="badge-status ${s.accessBlocked ? 'badge-suspended' : 'badge-active'}">
          ${s.accessBlocked ? '🔴 এক্সেস ফি ব্লকড' : '🟢 Paid Full'}
        </span>
      </td>
      <td style="text-align: center;">
        <div style="display:flex; gap:0.4rem; justify-content:center;">
          <button onclick="toggleAccessFeeBlock('${s.storeId || s.id}')" class="btn-submit" style="padding:0.35rem 0.65rem; font-size:0.78rem; background:${s.accessBlocked ? '#10b981' : '#f59e0b'};">
            <i class="fa-solid ${s.accessBlocked ? 'fa-check-circle' : 'fa-ban'}"></i> ${s.accessBlocked ? 'এক্সেস অ্যাপ্রুভ' : 'এক্সেস ব্লক'}
          </button>
          <button onclick="toggleStoreModuleAccess('${s.storeId || s.id}')" class="btn-submit" style="padding:0.35rem 0.65rem; font-size:0.78rem; background:#3b82f6;">
            <i class="fa-solid fa-sliders"></i> মডিউল চেঞ্জ
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

let subscriptionRequestsList = []; // Complete collection of all individual renewal requests
let currentMonthlySubTab = 'merchant'; // Options: 'merchant', 'pending', 'all'

async function loadSubscriptionRequests() {
  const reqMap = new Map();

  const addReq = (item) => {
    if (!item) return;
    const reqId = item.reqId || item.id || `req_${item.submittedAt || Date.now()}_${item.trxId || Math.random()}`;

    const existing = reqMap.get(reqId);
    let finalStatus = item.subRequestStatus || (item.trxId ? 'Pending' : 'Approved');

    // If existing or incoming item is Approved or Rejected, permanently lock status as Approved or Rejected!
    if (existing && (existing.subRequestStatus === 'Approved' || existing.subRequestStatus === 'Rejected')) {
      finalStatus = existing.subRequestStatus;
    } else if (item.subRequestStatus === 'Approved' || item.subRequestStatus === 'Rejected') {
      finalStatus = item.subRequestStatus;
    }

    reqMap.set(reqId, {
      ...existing,
      ...item,
      reqId: reqId,
      storeId: item.storeId || item.id || (existing ? existing.storeId : 'store_demo_101'),
      storeName: item.storeName || item.name || (existing ? existing.storeName : 'Merchant Shop'),
      ownerName: item.ownerName || item.storeOwner || (existing ? existing.ownerName : 'Merchant Owner'),
      phone: item.phone || item.senderPhone || (existing ? existing.phone : '01700000000'),
      requestedMonths: parseInt(item.requestedMonths) || (existing ? existing.requestedMonths : 1),
      amountPaid: parseFloat(item.amountPaid) || (existing ? existing.amountPaid : 150),
      paymentMethod: item.paymentMethod || (existing ? existing.paymentMethod : 'bKash Send Money'),
      trxId: item.trxId || (existing ? existing.trxId : ''),
      senderPhone: item.senderPhone || item.phone || (existing ? existing.senderPhone : ''),
      receiptImage: item.receiptImage || (existing ? existing.receiptImage : ''),
      subRequestStatus: finalStatus,
      isRead: (finalStatus === 'Approved' || finalStatus === 'Rejected') ? true : (item.isRead === true || (existing && existing.isRead)),
      submittedAt: item.submittedAt || item.createdAt || (existing ? existing.submittedAt : new Date().toISOString())
    });
  };

  // 1. Seed from local cache array
  let cachedReqs = JSON.parse(localStorage.getItem('pos_subscription_requests')) || [];
  if (Array.isArray(cachedReqs)) cachedReqs.forEach(addReq);

  // 2. Seed from pos_subscription active key if pending
  let activeSub = JSON.parse(localStorage.getItem('pos_subscription'));
  if (activeSub && activeSub.trxId) {
    addReq({ reqId: activeSub.reqId || `req_${activeSub.submittedAt || Date.now()}`, ...activeSub });
  }

  // 3. Parallel fetch from Cloud Firestore /subscription_requests and /subscriptions
  if (window.POS_FIREBASE && window.POS_FIREBASE.db) {
    try {
      const [reqSnap, subSnap] = await Promise.all([
        window.POS_FIREBASE.db.collection('subscription_requests').get().catch(() => null),
        window.POS_FIREBASE.db.collection('subscriptions').get().catch(() => null)
      ]);

      if (reqSnap && !reqSnap.empty) {
        reqSnap.forEach(doc => addReq({ reqId: doc.id, ...doc.data() }));
      }
      if (subSnap && !subSnap.empty) {
        subSnap.forEach(doc => {
          const d = doc.data() || {};
          if (d.trxId || d.requestedMonths) {
            addReq({ reqId: d.reqId || `sub_${doc.id}_${d.submittedAt || d.trxId}`, storeId: doc.id, ...d });
          }
        });
      }
    } catch (e) {
      console.warn('[Cloud Sync Requests Warning]:', e);
    }
  }

  subscriptionRequestsList = Array.from(reqMap.values()).sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
  localStorage.setItem('pos_subscription_requests', JSON.stringify(subscriptionRequestsList));

  renderPendingSubscriptionsTable();
}

function switchMonthlySubTab(tabName) {
  currentMonthlySubTab = tabName;
  document.querySelectorAll('.monthly-sub-pill').forEach(pill => {
    pill.style.background = 'transparent';
    pill.style.borderColor = 'var(--border-color)';
    pill.style.color = 'var(--text-muted)';
    pill.classList.remove('active');
  });

  const pillMap = {
    merchant: { id: 'pillMerchantAccounts', bg: 'rgba(168,85,247,0.25)', border: '#a855f7', color: '#fff' },
    pending: { id: 'pillPendingRequests', bg: 'rgba(245,158,11,0.25)', border: '#f59e0b', color: '#f59e0b' },
    all: { id: 'pillAllRequests', bg: 'rgba(59,130,246,0.25)', border: '#3b82f6', color: '#3b82f6' }
  };

  const activeInfo = pillMap[tabName] || pillMap.merchant;
  const activePill = document.getElementById(activeInfo.id);
  if (activePill) {
    activePill.classList.add('active');
    activePill.style.background = activeInfo.bg;
    activePill.style.borderColor = activeInfo.border;
    activePill.style.color = activeInfo.color;
  }

  renderPendingSubscriptionsTable();
}

// Mark specific request as read
function markRequestAsRead(reqId) {
  const req = subscriptionRequestsList.find(r => r.reqId === reqId);
  if (req && req.isRead !== true) {
    req.isRead = true;
    localStorage.setItem('pos_subscription_requests', JSON.stringify(subscriptionRequestsList));
    if (window.POS_FIREBASE && window.POS_FIREBASE.db) {
      try {
        window.POS_FIREBASE.db.collection('subscription_requests').doc(reqId).set({ isRead: true }, { merge: true });
      } catch (e) {}
    }
    renderPendingSubscriptionsTable();
  }
}

// Render Dedicated Monthly Recurring Subscriptions Table (Tab 4 - 3 View Sub-Tabs)
function renderPendingSubscriptionsTable() {
  const body = document.getElementById('pendingSubscriptionsTableBody');
  if (!body) return;

  // Filter pending requests: requests with subRequestStatus === 'Pending' or (trxId present and not Approved/Rejected)
  const pendingReqs = subscriptionRequestsList.filter(r => r.subRequestStatus === 'Pending' || (r.trxId && r.subRequestStatus !== 'Approved' && r.subRequestStatus !== 'Rejected'));

  // Update Pending Requests Badge Counter on Tab Pill 2
  const pendingBadgeEl = document.getElementById('pendingSubRequestsBadge');
  if (pendingBadgeEl) {
    if (pendingReqs.length > 0) {
      pendingBadgeEl.textContent = pendingReqs.length;
      pendingBadgeEl.style.display = 'inline-block';
    } else {
      pendingBadgeEl.style.display = 'none';
    }
  }

  // Update Sidebar Unread Counter
  const unreadCount = subscriptionRequestsList.filter(r => (r.subRequestStatus === 'Pending' || r.trxId) && r.isRead !== true).length;
  const unreadBadgeEl = document.getElementById('tab4UnreadBadge');
  if (unreadBadgeEl) {
    if (unreadCount > 0) {
      unreadBadgeEl.textContent = unreadCount;
      unreadBadgeEl.style.display = 'inline-block';
    } else {
      unreadBadgeEl.style.display = 'none';
    }
  }

  // -------------------------------------------------------------
  // VIEW 1: 🏪 মার্চেন্ট অ্যাকাউন্টস (Merchant Accounts View)
  // -------------------------------------------------------------
  if (currentMonthlySubTab === 'merchant') {
    body.innerHTML = subscribersList.map(s => {
      const expiryIso = s.trialExpiresAt || new Date(Date.now() + 7 * 86400000).toISOString();
      const timeInfo = formatRemainingTime(expiryIso);
      const isExpired = timeInfo.expired || (new Date(expiryIso) <= new Date());
      const isStopped = s.accountBlocked === true || s.status === 'Stopped' || s.status === 'Suspended' || isExpired;

      const merchantPendingCount = subscriptionRequestsList.filter(r => (r.storeId === s.storeId || r.phone === s.phone) && (r.subRequestStatus === 'Pending' || (r.trxId && r.subRequestStatus !== 'Approved' && r.subRequestStatus !== 'Rejected'))).length;

      let statusBadgeHTML = `<span class="badge-status badge-active">🟢 সক্রিয়</span>`;
      if (isStopped) {
        statusBadgeHTML = `<span class="badge-status badge-suspended">⛔ সাবস্ক্রিপশন বন্ধ (${isExpired ? 'মেয়াদ শেষ' : 'স্থগিত'})</span>`;
      }

      return `
        <tr>
          <td>
            <strong style="font-size: 0.98rem; color: var(--text-color);">${s.storeName}</strong><br>
            <small style="color: #94a3b8;">👤 ${s.ownerName} (${s.phone})</small>
          </td>
          <td>
            <span style="font-weight: 700; color: ${isExpired ? '#ef4444' : '#10b981'}; display: block;">
              <i class="fa-solid ${isExpired ? 'fa-lock' : 'fa-hourglass-half'}"></i> ${isExpired ? '🔴 সাবস্ক্রিপশন বন্ধ (মেয়াদ শেষ)' : timeInfo.text}
            </span>
            <small style="color: #64748b; font-size: 0.78rem;">মেয়াদ শেষ: ${new Date(expiryIso).toLocaleDateString('bn-BD')}</small>
          </td>
          <td>
            <span class="badge" style="background:rgba(59,130,246,0.15); color:#3b82f6; padding:2px 8px; border-radius:10px;">${s.plan || 'SmartPOS Counter Combo'}</span>
          </td>
          <td>
            ${merchantPendingCount > 0 ? `<span class="badge-status badge-pending">🟡 ${toBnNum(merchantPendingCount)} টি পেন্ডিং আবেদন</span>` : `<span class="text-muted" style="font-size:0.85rem;">কোনো পেন্ডিং আবেদন নেই</span>`}
          </td>
          <td>${statusBadgeHTML}</td>
          <td style="text-align: center;">
            <div style="display:flex; gap:0.4rem; justify-content:center;">
              <button onclick="openMerchantProfileModal('${s.storeId || s.id}')" class="btn-submit" style="padding:0.35rem 0.65rem; font-size:0.78rem; background:#3b82f6;">
                <i class="fa-solid fa-eye"></i> রিভিউ
              </button>
              <button onclick="toggleMonthlySubscriptionStatus('${s.storeId || s.id}')" class="btn-submit" style="padding:0.35rem 0.65rem; font-size:0.78rem; background:${isStopped ? '#10b981' : '#f59e0b'};" title="মার্চেন্ট সাবস্ক্রিপশন অ্যাকাউন্ট বন্ধ বা চালু করুন">
                <i class="fa-solid ${isStopped ? 'fa-play' : 'fa-pause'}"></i> ${isStopped ? 'অনুকূল / চালু' : 'বন্ধ করুন'}
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('') || `<tr><td colspan="6" class="text-center p-3 text-muted">কোনো মার্চেন্ট অ্যাকাউন্ট পাওয়া যায়নি</td></tr>`;
    return;
  }

  // -------------------------------------------------------------
  // VIEW 2: 📥 সাবস্ক্রিপশন রিকোয়েস্ট (Pending Requests Only)
  // Disappears from here IMMEDIATELY when Approved or Rejected!
  // -------------------------------------------------------------
  if (currentMonthlySubTab === 'pending') {
    if (pendingReqs.length === 0) {
      body.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-muted"><i class="fa-solid fa-circle-check" style="font-size:2rem; display:block; margin-bottom:8px; color:#10b981;"></i> কোনো নতুন বা পেন্ডিং সাবস্ক্রিপশন রিকোয়েস্ট নেই। সব আবেদন সম্পন্ন করা হয়েছে!</td></tr>`;
      return;
    }

    body.innerHTML = pendingReqs.map(r => {
      const isUnread = r.isRead !== true;
      const merchant = subscribersList.find(s => s.storeId === r.storeId || s.phone === r.phone) || {};
      const expiryIso = merchant.trialExpiresAt || new Date().toISOString();
      const timeInfo = formatRemainingTime(expiryIso);

      return `
        <tr style="${isUnread ? 'background: rgba(239, 68, 68, 0.12); border-left: 4px solid #ef4444;' : 'background: rgba(168, 85, 247, 0.08); border-left: 4px solid #a855f7;'}" onclick="markRequestAsRead('${r.reqId}')">
          <td>
            <div style="display:flex; align-items:center; gap:6px;">
              ${isUnread ? `<span class="badge" style="background:#ef4444; color:#fff; font-size:0.72rem; padding:2px 8px; border-radius:12px; font-weight:700;"><i class="fa-solid fa-bell"></i> 🔴 NEW</span>` : ''}
              <strong style="font-size: 0.98rem; color: var(--text-color);">${r.storeName}</strong>
            </div>
            <small style="color: #94a3b8;">👤 ${r.ownerName} (${r.phone})</small>
          </td>
          <td>
            <span style="font-weight: 700; color: #10b981; display: block;">
              <i class="fa-solid fa-hourglass-half"></i> ${timeInfo.text}
            </span>
            <small style="color: #64748b; font-size: 0.78rem;">মেয়াদ শেষ: ${new Date(expiryIso).toLocaleDateString('bn-BD')}</small>
          </td>
          <td>
            <strong style="color:#a855f7; display:block;"><i class="fa-solid fa-gem"></i> ${toBnNum(r.requestedMonths || 1)} মাস</strong>
            <small style="color:#10b981; font-weight:700;">৳${toBnNum(r.amountPaid || 150)} BDT</small>
          </td>
          <td>
            <span class="badge" style="background:rgba(59,130,246,0.15); color:#3b82f6; font-size:0.75rem; margin-bottom:2px; display:inline-block;">${r.paymentMethod || 'bKash Send Money'}</span>
            <strong style="color:#10b981; font-family:monospace; display:block; font-size:0.92rem;">TrxID: ${(r.trxId && r.trxId.trim()) ? r.trxId : 'N/A'}</strong>
            <small style="color:#94a3b8;">প্রেরক: ${r.senderPhone || r.phone}</small>
          </td>
          <td><span class="badge-status badge-pending">🟡 আবেদন পেন্ডিং</span></td>
          <td style="text-align: center;" onclick="event.stopPropagation();">
            <div style="display:flex; gap:0.4rem; justify-content:center; flex-wrap:wrap;">
              <button onclick="markRequestAsRead('${r.reqId}'); openMerchantProfileModal('${r.reqId}')" class="btn-submit" style="padding:0.35rem 0.6rem; font-size:0.78rem; background:#3b82f6;" title="পেমেন্ট রসিদ পিকচার ও ট্রানজ্যাকশন রিভিউ করুন">
                <i class="fa-solid fa-eye"></i> রিভিউ
              </button>
              <button onclick="approveMerchantSubscriptionRequest('${r.reqId}')" class="btn-submit" style="padding:0.35rem 0.65rem; font-size:0.78rem; background:#10b981;" title="আবেদনটি অনুমোদন করুন (+মেয়াদ যোগ হবে)">
                <i class="fa-solid fa-check"></i> অনুমোদন
              </button>
              <button onclick="rejectMerchantSubscriptionRequest('${r.reqId}')" class="btn-submit" style="padding:0.35rem 0.65rem; font-size:0.78rem; background:#e11d48;" title="আবেদনটি বাতিল করুন">
                <i class="fa-solid fa-xmark"></i> বাতিল
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    return;
  }

  // -------------------------------------------------------------
  // VIEW 3: 📜 অল রিকোয়েস্ট (All Historical Renewal Requests)
  // Shows EVERY SINGLE RENEWAL REQUEST FROM BEGINNING TO END (A to Z)!
  // -------------------------------------------------------------
  if (currentMonthlySubTab === 'all') {
    if (subscriptionRequestsList.length === 0) {
      body.innerHTML = `<tr><td colspan="6" class="text-center p-3 text-muted">কোনো সাবস্ক্রিপশন আবেদন হিস্ট্রি পাওয়া যায়নি</td></tr>`;
      return;
    }

    body.innerHTML = subscriptionRequestsList.map(r => {
      const reqStatus = r.subRequestStatus;

      let statusBadgeHTML = `<span class="badge-status badge-pending">🟡 আবেদন পেন্ডিং</span>`;
      if (reqStatus === 'Approved') {
        statusBadgeHTML = `<span class="badge" style="background:rgba(16,185,129,0.2); color:#10b981; border:1px solid #10b981; font-weight:700; padding:3px 8px; border-radius:12px;"><i class="fa-solid fa-circle-check"></i> 🟢 অনুমোদিত (Approved)</span>`;
      } else if (reqStatus === 'Rejected') {
        statusBadgeHTML = `<span class="badge" style="background:rgba(225,29,72,0.2); color:#e11d48; border:1px solid #e11d48; font-weight:700; padding:3px 8px; border-radius:12px;"><i class="fa-solid fa-circle-xmark"></i> 🔴 বাতিল করা হয়েছে (Rejected)</span>`;
      }

      return `
        <tr>
          <td>
            <strong style="font-size: 0.98rem; color: var(--text-color);">${r.storeName}</strong><br>
            <small style="color: #94a3b8;">👤 ${r.ownerName} (${r.phone})</small>
          </td>
          <td>
            <small style="color: #64748b; font-size: 0.85rem;">তারিখ: ${new Date(r.submittedAt || Date.now()).toLocaleDateString('bn-BD')}</small>
          </td>
          <td>
            <strong style="color:#a855f7;"><i class="fa-solid fa-gem"></i> ${toBnNum(r.requestedMonths || 1)} মাস</strong>
            <small style="color:#10b981; font-weight:700; display:block;">৳${toBnNum(r.amountPaid || 150)} BDT</small>
          </td>
          <td>
            <span class="badge" style="background:rgba(59,130,246,0.15); color:#3b82f6; font-size:0.75rem; margin-bottom:2px; display:inline-block;">${r.paymentMethod || 'bKash Send Money'}</span>
            <strong style="color:#10b981; font-family:monospace; display:block; font-size:0.92rem;">TrxID: ${(r.trxId && r.trxId.trim()) ? r.trxId : 'N/A'}</strong>
            <small style="color:#94a3b8; display:block;">প্রেরক: ${r.senderPhone || r.phone || 'N/A'}</small>
          </td>
          <td>${statusBadgeHTML}</td>
          <td style="text-align: center;">
            <button onclick="openMerchantProfileModal('${r.reqId}')" class="btn-submit" style="padding:0.35rem 0.65rem; font-size:0.78rem; background:#3b82f6;">
              <i class="fa-solid fa-eye"></i> রিভিউ হিস্ট্রি
            </button>
          </td>
        </tr>
      `;
    }).join('');
    return;
  }
}

// Open Clickable Merchant Profile Modal with Deep-Dive Details & Receipt Image Preview
function openMerchantProfileModal(idOrReqId) {
  let req = subscriptionRequestsList.find(r => r.reqId === idOrReqId);
  let sub = null;

  if (req) {
    sub = subscribersList.find(s => s.storeId === req.storeId || s.phone === req.phone) || req;
  } else {
    sub = subscribersList.find(s => s.storeId === idOrReqId || s.id === idOrReqId) || {};
    req = subscriptionRequestsList.find(r => r.storeId === sub.storeId || r.phone === sub.phone);
  }

  if (!sub && !req) return;

  const modal = document.getElementById('merchantProfileModal');
  const container = document.getElementById('merchantProfileContent');

  const expiryIso = sub.trialExpiresAt || new Date(Date.now() + 7 * 86400000).toISOString();
  const timeInfo = formatRemainingTime(expiryIso);
  const isStopped = sub.accountBlocked === true || sub.status === 'Stopped' || sub.status === 'Suspended';

  const storeName = sub.storeName || req.storeName || 'Merchant Store';
  const ownerName = sub.ownerName || req.ownerName || 'Merchant Owner';
  const phone = sub.phone || req.phone || req.senderPhone || '01700000000';
  const email = sub.email || req.email || 'N/A';
  const storeId = sub.storeId || sub.id || req.storeId || idOrReqId;
  const currentTrxId = (req && req.trxId) ? req.trxId : (sub.trxId || 'N/A');

  // Mark request as read
  if (req && req.reqId) markRequestAsRead(req.reqId);

  container.innerHTML = `
    <!-- PROFILE HEADER CARD -->
    <div style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(59, 130, 246, 0.1)); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 18px; padding: 1.25rem; margin-bottom: 1.25rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <span class="badge-status ${isStopped ? 'badge-suspended' : (req && req.subRequestStatus === 'Pending' ? 'badge-pending' : 'badge-active')}">${isStopped ? '🔴 বন্ধ/স্থগিত' : (sub.status || 'Active Paid')}</span>
        <small style="color: #94a3b8;">Store ID: <code>${storeId}</code></small>
      </div>
      <h3 style="color: #fff; font-size: 1.3rem; margin-bottom: 0.2rem;">${storeName}</h3>
      <p style="color: #cbd5e1; font-size: 0.9rem;"><i class="fa-solid fa-user"></i> মালিক: <strong>${ownerName}</strong> | <i class="fa-solid fa-phone"></i> ${phone}</p>
    </div>

    <!-- REMAINING TIME COUNTER CARD -->
    <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; border-radius: 14px; padding: 1rem; margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <small style="color: #64748b; font-weight: 600; display: block;">অবশিষ্ট মেয়াদের সময় (Exact Remaining Time):</small>
        <h3 style="color: #10b981; font-size: 1.3rem; margin-top: 2px;">${timeInfo.text}</h3>
      </div>
      <div style="font-size: 2rem; color: #10b981;"><i class="fa-solid fa-hourglass-half"></i></div>
    </div>

    <!-- RENEWAL REQUEST TRANSACTION & RECEIPT HIGHLIGHT -->
    ${req ? `
      <div style="background: rgba(168, 85, 247, 0.15); border: 2px solid #a855f7; border-radius: 14px; padding: 1rem; margin-bottom: 1.25rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <strong style="color: #a855f7; font-size: 1.05rem;">
            <i class="fa-solid fa-receipt"></i> সাবস্ক্রিপশন আবেদন ডিটেইলস
          </strong>
          <span class="badge" style="background:${req.subRequestStatus === 'Approved' ? 'rgba(16,185,129,0.2)' : (req.subRequestStatus === 'Rejected' ? 'rgba(225,29,72,0.2)' : 'rgba(245,158,11,0.2)')}; color:${req.subRequestStatus === 'Approved' ? '#10b981' : (req.subRequestStatus === 'Rejected' ? '#e11d48' : '#f59e0b')}; font-weight:700;">
            ${req.subRequestStatus === 'Approved' ? '🟢 অনুমোদিত (Approved)' : (req.subRequestStatus === 'Rejected' ? '🔴 বাতিল করা হয়েছে (Rejected)' : '🟡 আবেদন পেন্ডিং')}
          </span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.9rem; color: #fff; margin-bottom: 0.75rem;">
          <div>মেয়াদ: <strong style="color:#a855f7;">${toBnNum(req.requestedMonths || 1)} মাস (৳${toBnNum(req.amountPaid || 150)} BDT)</strong></div>
          <div>মেথড: <strong>${req.paymentMethod || 'bKash Send Money'}</strong></div>
          <div>TrxID: <strong style="color:#10b981; font-family:monospace; font-size:1rem;">${currentTrxId}</strong></div>
          <div>প্রেরক ফোন: <strong style="color:#3b82f6;">${req.senderPhone || phone}</strong></div>
        </div>

        <!-- UPLOADED PAYMENT RECEIPT PICTURE PREVIEW -->
        ${req.receiptImage ? `
          <div style="background: #0f172a; border: 1px solid rgba(168,85,247,0.3); border-radius: 10px; padding: 0.75rem; text-align: center; margin-top: 0.5rem;">
            <small style="color: #a855f7; font-weight: 700; display: block; margin-bottom: 0.4rem;"><i class="fa-solid fa-image"></i> প্রেরিত পেমেন্ট রসিদের মূল ছবি:</small>
            <img src="${req.receiptImage}" alt="Payment Receipt" style="max-width: 100%; max-height: 260px; border-radius: 8px; border: 1px solid #334155; cursor: pointer; object-fit: contain;" onclick="window.open(this.src, '_blank')" title="ছবিতে ক্লিক করে ফুল স্ক্রিনে বড় করে দেখুন">
            <small style="color: #94a3b8; display: block; margin-top: 4px;">🔍 ছবিতে ক্লিক করে ফুল সাইজে বড় করুন</small>
          </div>
        ` : `<div style="background: rgba(30,41,59,0.5); padding: 0.5rem; border-radius: 8px; font-size: 0.82rem; color: #94a3b8; text-align: center;"><i class="fa-solid fa-circle-info"></i> কোনো পেমেন্ট রসিদ ছবি সংযুক্ত করা হয়নি</div>`}

        ${req.subRequestStatus === 'Pending' ? `
          <div style="display: flex; gap: 10px; margin-top: 0.85rem;">
            <button onclick="approveMerchantSubscriptionRequest('${req.reqId}')" class="btn-submit" style="background: #10b981; flex: 1;">
              <i class="fa-solid fa-check"></i> এই পেমেন্ট অনুমোদন দিন (+মেয়াদ যোগ হবে)
            </button>
            <button onclick="rejectMerchantSubscriptionRequest('${req.reqId}')" class="btn-submit" style="background: #e11d48; flex: 1;">
              <i class="fa-solid fa-xmark"></i> ভুয়া TrxID বাতিল করুন
            </button>
          </div>
        ` : ''}
      </div>
    ` : ''}

    <!-- DETAILS GRID -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; font-size: 0.9rem;">
      <div style="background: rgba(30,41,59,0.5); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-color);">
        <strong style="color: #a855f7; display: block; margin-bottom: 0.5rem;"><i class="fa-solid fa-circle-info"></i> পার্সোনাল তথ্য</strong>
        <div>ইমেইল: <strong>${email}</strong></div>
        <div>ফোন: <strong>${phone}</strong></div>
        <div>নিবন্ধন তারিখ: <strong>${sub.createdAt || 'আজকে'}</strong></div>
      </div>

      <div style="background: rgba(30,41,59,0.5); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-color);">
        <strong style="color: #3b82f6; display: block; margin-bottom: 0.5rem;"><i class="fa-solid fa-building"></i> বিজনেস ও পেমেন্ট তথ্য</strong>
        <div>এক্সেস সেটআপ ফি: <strong style="color:#10b981;">৳${toBnNum(sub.setupFee || 14999)}</strong></div>
        <div>সর্বশেষ প্যাকেজ: <strong>${toBnNum(sub.requestedMonths || 1)} মাস</strong></div>
        <div>TrxID: <strong style="color:#10b981; font-family:monospace;">${currentTrxId}</strong></div>
      </div>
    </div>

    <!-- ACTION BUTTONS -->
    <div style="display: flex; gap: 8px; flex-wrap: wrap; border-top: 1px solid var(--border-color); padding-top: 1rem;">
      <button onclick="loginAsMerchant('${storeId}')" class="btn-submit" style="background: linear-gradient(135deg, #3b82f6, #2563eb); flex: 1;">
        <i class="fa-solid fa-user-gear"></i> এডমিন
      </button>
      <button onclick="loginAsCashier('${storeId}')" class="btn-submit" style="background: linear-gradient(135deg, #10b981, #059669); flex: 1;">
        <i class="fa-solid fa-cash-register"></i> POS
      </button>
      <button onclick="extendMerchantSubscription('${storeId}')" class="btn-submit" style="background: #8b5cf6; flex: 1;">
        <i class="fa-solid fa-calendar-plus"></i> দিন বাড়ান/কমান (+/-)
      </button>
      <button onclick="toggleMonthlySubscriptionStatus('${storeId}')" class="btn-submit" style="background: ${isStopped ? '#10b981' : '#e11d48'}; flex: 1;">
        <i class="fa-solid ${isStopped ? 'fa-play' : 'fa-pause'}"></i> ${isStopped ? 'সাবস্ক্রিপশন চালু' : 'সাবস্ক্রিপশন বন্ধ'}
      </button>
      <button onclick="deleteMerchantAccount('${storeId}')" class="btn-submit" style="background: rgba(239,68,68,0.2); border: 1px solid #ef4444; color: #ef4444;">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `;

  modal.style.display = 'flex';
}

function closeMerchantProfileModal() {
  const modal = document.getElementById('merchantProfileModal');
  if (modal) modal.style.display = 'none';
}

// Centralized Subscriber Sync Helper: updates pos_subscriptions array, pos_subscription singular key, and Firestore collections
function saveAndSyncSubscriberState(storeId, sub) {
  if (!sub) return;
  const targetId = storeId || sub.storeId || sub.id;

  const idx = subscribersList.findIndex(s => s.storeId === targetId || s.id === targetId);
  if (idx !== -1) {
    subscribersList[idx] = { ...subscribersList[idx], ...sub };
  } else {
    subscribersList.push(sub);
  }
  localStorage.setItem('pos_subscriptions', JSON.stringify(subscribersList));

  let activeSub = JSON.parse(localStorage.getItem('pos_subscription')) || {};
  activeSub = { ...activeSub, ...sub };
  localStorage.setItem('pos_subscription', JSON.stringify(activeSub));
  localStorage.setItem(`pos_tenant_${targetId}_pos_subscription`, JSON.stringify(activeSub));

  if (window.POS_FIREBASE && window.POS_FIREBASE.db) {
    try {
      window.POS_FIREBASE.db.collection('subscriptions').doc(targetId).set(sub, { merge: true });
      window.POS_FIREBASE.db.collection('stores').doc(targetId).set({ profile: sub, pos_subscription: sub }, { merge: true });
    } catch (e) {
      console.warn('[Cloud Sync Warning]:', e);
    }
  }

  window.dispatchEvent(new Event('storage'));
}

// Approve Specific Monthly Subscription Request & Extend Exact Requested Duration
async function approveMerchantSubscriptionRequest(reqId) {
  const req = subscriptionRequestsList.find(r => r.reqId === reqId);
  if (!req) return;

  const targetStoreId = req.storeId;
  const merchant = subscribersList.find(s => s.storeId === targetStoreId || s.phone === req.phone) || {};

  const reqMonths = parseInt(req.requestedMonths) || 1;
  let addDays = 30;
  if (reqMonths === 6) addDays = 180;
  else if (reqMonths === 12) addDays = 365;
  else addDays = reqMonths * 30;

  const currentExpiry = merchant.trialExpiresAt ? new Date(merchant.trialExpiresAt) : new Date();
  const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
  baseDate.setDate(baseDate.getDate() + addDays);

  const newExpiryIso = baseDate.toISOString();

  // 1. Update request status
  req.subRequestStatus = 'Approved';
  req.isRead = true;

  // 2. Update merchant profile
  merchant.trialExpiresAt = newExpiryIso;
  merchant.status = 'Active Paid';
  merchant.isTrial = false;
  merchant.accountBlocked = false;
  merchant.accessBlocked = false;
  merchant.trxId = req.trxId || merchant.trxId || '';

  // Save requests list
  localStorage.setItem('pos_subscription_requests', JSON.stringify(subscriptionRequestsList));

  // Sync to Firestore /subscription_requests
  if (window.POS_FIREBASE && window.POS_FIREBASE.db) {
    try {
      await window.POS_FIREBASE.db.collection('subscription_requests').doc(reqId).set({
        subRequestStatus: 'Approved',
        isRead: true,
        approvedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {}
  }

  saveAndSyncSubscriberState(targetStoreId, merchant);

  alert(`✅ '${req.storeName}' এর ${toBnNum(reqMonths)} মাসের সাবস্ক্রিপশন সফলভাবে অনুমোদন করা হয়েছে!\n\nনতুন শেষ মেয়াদ: ${baseDate.toLocaleDateString('bn-BD')}`);
  
  await loadSubscriptionRequests();
  await loadSubscribers();
  closeMerchantProfileModal();
}

// Reject Specific Monthly Subscription Request Without Adding Extra Days
async function rejectMerchantSubscriptionRequest(reqId) {
  const req = subscriptionRequestsList.find(r => r.reqId === reqId);
  if (!req) return;

  const targetStoreId = req.storeId;
  const merchant = subscribersList.find(s => s.storeId === targetStoreId || s.phone === req.phone) || {};
  const reqMonths = parseInt(req.requestedMonths) || 1;

  if (confirm(`⚠️ পেমেন্ট না আসায়/ভুয়া TrxID প্রদান করায় '${req.storeName}' এর ${toBnNum(reqMonths)} মাসের সাবস্ক্রিপশন আবেদনটি বাতিল করতে চান?\n\nআবেদনটি বাতিল করলে নতুন কোনো দিন যোগ হবে না। মার্চেন্টের আগের অবশিষ্ট মেয়াদের সময় বজায় থাকবে।`)) {
    // 1. Permanently update request object (preserve original trxId for historical records!)
    req.subRequestStatus = 'Rejected';
    req.isRead = true;

    // 2. Update merchant profile status
    merchant.subRequestStatus = 'Rejected';

    localStorage.setItem('pos_subscription_requests', JSON.stringify(subscriptionRequestsList));
    saveAndSyncSubscriberState(targetStoreId, merchant);

    if (window.POS_FIREBASE && window.POS_FIREBASE.db) {
      try {
        await window.POS_FIREBASE.db.collection('subscription_requests').doc(reqId).set({
          subRequestStatus: 'Rejected',
          isRead: true,
          rejectedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {}
    }

    alert(`🔴 '${req.storeName}' এর রিনিউ আবেদনটি সফলভাবে বাতিল করা হয়েছে! মার্চেন্টের আগের অবশিষ্ট মেয়াদ বহাল রয়েছে।`);
    
    await loadSubscriptionRequests();
    await loadSubscribers();
    closeMerchantProfileModal();
  }
}

// Toggle Merchant Subscription Stop / Resume Status
function toggleMonthlySubscriptionStatus(storeId) {
  const sub = subscribersList.find(s => s.storeId === storeId || s.id === storeId);
  if (!sub) return;

  const isStopped = sub.accountBlocked === true || sub.status === 'Stopped' || sub.status === 'Suspended';
  const newStatus = isStopped ? 'Active Paid' : 'Stopped';

  if (confirm(`'${sub.storeName}' এর সাবস্ক্রিপশন ${isStopped ? 'চালু ও পুনরুজ্জীবিত' : 'বন্ধ ও স্থগিত'} করতে চান?`)) {
    sub.accountBlocked = !isStopped;
    sub.status = newStatus;

    saveAndSyncSubscriberState(storeId, sub);

    alert(`🎉 '${sub.storeName}' এর সাবস্ক্রিপশন ${isStopped ? 'সফলভাবে চালু করা হয়েছে' : 'বন্ধ করা হয়েছে'}!`);
    loadSubscribers();
    renderPendingSubscriptionsTable();
    closeMerchantProfileModal();
  }
}

// Toggle Access Fee Block / Approval (From Access Fee Tab 3)
function toggleAccessFeeBlock(storeId) {
  const sub = subscribersList.find(s => s.storeId === storeId || s.id === storeId);
  if (!sub) return;

  const isBlocked = !sub.accessBlocked;
  if (confirm(`'${sub.storeName}' এর এক্সেস ফি ${isBlocked ? 'ব্লক' : 'অ্যাপ্রুভ'} করতে চান?`)) {
    sub.accessBlocked = isBlocked;
    sub.accessFeePaid = !isBlocked;

    localStorage.setItem('pos_subscriptions', JSON.stringify(subscribersList));

    if (window.POS_FIREBASE && window.POS_FIREBASE.db) {
      try {
        window.POS_FIREBASE.db.collection('subscriptions').doc(storeId).set(sub, { merge: true });
      } catch (err) {}
    }

    alert(`🎉 '${sub.storeName}' এর এক্সেস স্ট্যাটাস আপডেট করা হয়েছে: ${isBlocked ? 'এক্সেস ফি ব্লকড' : 'এক্সেস ফি অ্যাপ্রুভড'}`);
    renderAccessFeesTable();
  }
}

function toggleStoreModuleAccess(storeId) {
  const sub = subscribersList.find(s => s.storeId === storeId || s.id === storeId);
  if (!sub) return;

  if (confirm(`'${sub.storeName}' এর জন্য ই-কমার্স ওয়েবসাইট মডিউল এক্সেস অন/অফ করতে চান?`)) {
    if (!sub.plan || !sub.plan.includes('Ecommerce')) {
      sub.plan = 'SmartPOS Counter + E-Commerce Combo';
      sub.setupFee = currentCMS.rates ? currentCMS.rates.rateAccess : 14999;
    } else {
      sub.plan = 'SmartPOS Standard Counter';
      sub.setupFee = 9999;
    }

    localStorage.setItem('pos_subscriptions', JSON.stringify(subscribersList));
    alert(`🎉 '${sub.storeName}' এর এক্সেস আপডেট করা হয়েছে: ${sub.plan}`);
    renderAccessFeesTable();
  }
}

// Load CMS Data
function loadCMSData() {
  const saved = localStorage.getItem('pos_landing_cms');
  if (saved) {
    try {
      currentCMS = { ...DEFAULT_CMS, ...JSON.parse(saved) };
    } catch (e) {}
  }

  populateCMSForms();
}

function populateCMSForms() {
  if (currentCMS.hero) {
    if (document.getElementById('cmsBadge')) document.getElementById('cmsBadge').value = currentCMS.hero.badge || '';
    if (document.getElementById('cmsTitle')) document.getElementById('cmsTitle').value = currentCMS.hero.title || '';
    if (document.getElementById('cmsDesc')) document.getElementById('cmsDesc').value = currentCMS.hero.desc || '';
    if (document.getElementById('cmsVideoUrl')) document.getElementById('cmsVideoUrl').value = currentCMS.hero.videoUrl || '';
  }

  if (currentCMS.rates) {
    if (document.getElementById('cmsRate1m')) document.getElementById('cmsRate1m').value = currentCMS.rates.rate1m || 150;
    if (document.getElementById('cmsRate6m')) document.getElementById('cmsRate6m').value = currentCMS.rates.rate6m || 810;
    if (document.getElementById('cmsRate12m')) document.getElementById('cmsRate12m').value = currentCMS.rates.rate12m || 1440;
    if (document.getElementById('cmsRateAccess')) document.getElementById('cmsRateAccess').value = currentCMS.rates.rateAccess || 14999;
  }

  const pkg = currentCMS.packageRates || {
    card1: { setup: 9999, monthly: 150 },
    card2: { setup: 14999, monthly: 999 },
    card3: { setup: 7999, monthly: 499 }
  };

  if (document.getElementById('cmsCard1Setup')) document.getElementById('cmsCard1Setup').value = pkg.card1 ? pkg.card1.setup : 9999;
  if (document.getElementById('cmsCard1Monthly')) document.getElementById('cmsCard1Monthly').value = pkg.card1 ? pkg.card1.monthly : 150;
  if (document.getElementById('cmsCard2Setup')) document.getElementById('cmsCard2Setup').value = pkg.card2 ? pkg.card2.setup : 14999;
  if (document.getElementById('cmsCard2Monthly')) document.getElementById('cmsCard2Monthly').value = pkg.card2 ? pkg.card2.monthly : 999;
  if (document.getElementById('cmsCard3Setup')) document.getElementById('cmsCard3Setup').value = pkg.card3 ? pkg.card3.setup : 7999;
  if (document.getElementById('cmsCard3Monthly')) document.getElementById('cmsCard3Monthly').value = pkg.card3 ? pkg.card3.monthly : 499;

  if (document.getElementById('cmsDiscountBadge')) document.getElementById('cmsDiscountBadge').value = currentCMS.discountBadge || '🎉 ২০% স্পেশাল ডিসকাউন্ট অফার!';
  if (document.getElementById('cmsPromoBanner')) document.getElementById('cmsPromoBanner').value = currentCMS.promoBanner || 'সীমিত সময়ের জন্য এক্সেস ফি-তে পাচ্ছেন বিশাল ছাড়!';

  if (document.getElementById('cmsBkashNumber')) document.getElementById('cmsBkashNumber').value = currentCMS.bkashNumber || '01700000000';
  if (document.getElementById('cmsNagadNumber')) document.getElementById('cmsNagadNumber').value = currentCMS.nagadNumber || '01800000000';
  if (document.getElementById('cmsRocketNumber')) document.getElementById('cmsRocketNumber').value = currentCMS.rocketNumber || '01900000000-7';
  if (document.getElementById('cmsBankDetails')) document.getElementById('cmsBankDetails').value = currentCMS.bankDetails || 'Dutch Bangla Bank - A/C: 123456789 - Branch: Gulshan';
  if (document.getElementById('cmsWhatsappNumber')) document.getElementById('cmsWhatsappNumber').value = currentCMS.whatsappNumber || '8801700000000';
  if (document.getElementById('cmsPushNotificationMsg')) document.getElementById('cmsPushNotificationMsg').value = currentCMS.pushNotificationMsg || 'আপনার স্টোরের সাবস্ক্রিপশনের মেয়াদের সময় প্রায় শেষ! নিরবচ্ছিন্ন সেবা পেতে এখনই রিনিউ করুন।';

  const gw = currentCMS.gateways || { bkash: true, nagad: true, rocket: false, bank: false };
  if (document.getElementById('cmsBkashEnable')) document.getElementById('cmsBkashEnable').checked = gw.bkash !== false;
  if (document.getElementById('cmsNagadEnable')) document.getElementById('cmsNagadEnable').checked = gw.nagad !== false;
  if (document.getElementById('cmsRocketEnable')) document.getElementById('cmsRocketEnable').checked = gw.rocket === true;
  if (document.getElementById('cmsBankEnable')) document.getElementById('cmsBankEnable').checked = gw.bank === true;
}

function initCMSForms() {
  document.getElementById('btnForcePublishCMS')?.addEventListener('click', () => {
    saveCMSDataToCloud();
  });

  document.getElementById('heroCMSForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    currentCMS.hero = {
      badge: document.getElementById('cmsBadge').value.trim(),
      title: document.getElementById('cmsTitle').value.trim(),
      desc: document.getElementById('cmsDesc').value.trim(),
      videoUrl: document.getElementById('cmsVideoUrl').value.trim()
    };
    saveCMSDataToCloud();
    alert('✅ হিরো সেকশন কন্টেন্ট সেভ করা হয়েছে!');
  });

  document.getElementById('planRatesCMSForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    currentCMS.rates = {
      rate1m: parseFloat(document.getElementById('cmsRate1m')?.value) || 150,
      rate6m: parseFloat(document.getElementById('cmsRate6m')?.value) || 810,
      rate12m: parseFloat(document.getElementById('cmsRate12m')?.value) || 1440,
      rateAccess: parseFloat(document.getElementById('cmsRateAccess')?.value) || 14999
    };
    currentCMS.packageRates = {
      card1: {
        setup: parseFloat(document.getElementById('cmsCard1Setup')?.value) || 9999,
        monthly: parseFloat(document.getElementById('cmsCard1Monthly')?.value) || 150
      },
      card2: {
        setup: parseFloat(document.getElementById('cmsCard2Setup')?.value) || 14999,
        monthly: parseFloat(document.getElementById('cmsCard2Monthly')?.value) || 999
      },
      card3: {
        setup: parseFloat(document.getElementById('cmsCard3Setup')?.value) || 7999,
        monthly: parseFloat(document.getElementById('cmsCard3Monthly')?.value) || 499
      }
    };
    currentCMS.discountBadge = document.getElementById('cmsDiscountBadge')?.value.trim() || '🎉 ২০% স্পেশাল ডিসকাউন্ট অফার!';
    currentCMS.promoBanner = document.getElementById('cmsPromoBanner')?.value.trim() || 'সীমিত সময়ের জন্য এক্সেস ফি-তে পাচ্ছেন বিশাল ছাড়!';

    saveCMSDataToCloud();
    alert('✅ সকল প্যাকেজ রেট ও ডিসকাউন্ট সফলভাবে সেভ করা হয়েছে!');
  });

  document.getElementById('pricingCMSForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    currentCMS.gateways = {
      bkash: document.getElementById('cmsBkashEnable')?.checked !== false,
      nagad: document.getElementById('cmsNagadEnable')?.checked !== false,
      rocket: document.getElementById('cmsRocketEnable')?.checked === true,
      bank: document.getElementById('cmsBankEnable')?.checked === true
    };
    currentCMS.bkashNumber = document.getElementById('cmsBkashNumber')?.value.trim() || '01700000000';
    currentCMS.nagadNumber = document.getElementById('cmsNagadNumber')?.value.trim() || '01800000000';
    currentCMS.rocketNumber = document.getElementById('cmsRocketNumber')?.value.trim() || '01900000000-7';
    currentCMS.bankDetails = document.getElementById('cmsBankDetails')?.value.trim() || 'Dutch Bangla Bank - A/C: 123456789 - Branch: Gulshan';
    currentCMS.whatsappNumber = document.getElementById('cmsWhatsappNumber')?.value.trim() || '8801700000000';
    currentCMS.pushNotificationMsg = document.getElementById('cmsPushNotificationMsg')?.value.trim() || 'আপনার স্টোরের সাবস্ক্রিপশনের মেয়াদের সময় প্রায় শেষ! নিরবচ্ছিন্ন সেবা পেতে এখনই রিনিউ করুন।';

    saveCMSDataToCloud();
    alert('✅ পেমেন্ট সেটিংস সফলভাবে সেভ করা হয়েছে!');
  });

  document.getElementById('btnSendGlobalPushAlert')?.addEventListener('click', () => {
    currentCMS.bkashNumber = document.getElementById('cmsBkashNumber')?.value.trim() || '01700000000';
    currentCMS.nagadNumber = document.getElementById('cmsNagadNumber')?.value.trim() || '01800000000';
    currentCMS.pushNotificationMsg = document.getElementById('cmsPushNotificationMsg')?.value.trim() || 'আপনার স্টোরের সাবস্ক্রিপশনের মেয়াদের সময় প্রায় শেষ! নিরবচ্ছিন্ন সেবা পেতে এখনই রিনিউ করুন।';

    saveCMSDataToCloud();

    try {
      const bc = new BroadcastChannel('pos_cms_sync');
      bc.postMessage({ type: 'global_sub_push_alert', msg: currentCMS.pushNotificationMsg });
    } catch (e) {}

    alert('📢 সকল সক্রিয় মার্চেন্ট ও ক্যাশিয়ার টার্মিনালে সাবস্ক্রিপশন পুশ নোটিফিকেশন পাঠানো হয়েছে!');
  });

  document.getElementById('btnPublishAppUpdate')?.addEventListener('click', () => {
    currentCMS.appVersion = 'v2.6.0';
    saveCMSDataToCloud();

    try {
      const bc = new BroadcastChannel('pos_app_update_channel');
      bc.postMessage({ type: 'APP_UPDATE_PUBLISHED', version: 'v2.6.0' });
    } catch (e) {}

    alert('🚀 সকল মার্চেন্ট ও ক্যাশিয়ার অ্যাপে নতুন অ্যাপ আপডেট সিগন্যাল প্রকাশ করা হয়েছে! ইউজারের ইনস্টল করা অ্যাপে "🚀 নতুন আপডেট পাওয়া গেছে!" পপআপ ব্যানার দেখা যাবে।');
  });
}

// Push CMS Changes to Local Storage, BroadcastChannel & Cloud Firestore
async function saveCMSDataToCloud() {
  localStorage.setItem('pos_landing_cms', JSON.stringify(currentCMS));

  try {
    const bc = new BroadcastChannel('pos_cms_sync');
    bc.postMessage({ type: 'cms_updated', cms: currentCMS });
  } catch (e) {}

  if (window.POS_FIREBASE && window.POS_FIREBASE.db) {
    try {
      await window.POS_FIREBASE.db.collection('landing_cms').doc('content').set(currentCMS, { merge: true });
    } catch (e) {
      console.warn('Firestore CMS save error:', e);
    }
  }
}

// Context Switch into Merchant Admin Panel
function loginAsMerchant(storeId) {
  const sub = subscribersList.find(s => s.storeId === storeId || s.id === storeId);
  if (!sub) return;

  const targetStoreId = sub.storeId || storeId;
  if (window.POS_FIREBASE && typeof window.POS_FIREBASE.setStoreId === 'function') {
    window.POS_FIREBASE.setStoreId(targetStoreId);
  }

  localStorage.setItem('pos_active_store_id', targetStoreId);
  localStorage.setItem('pos_subscription', JSON.stringify(sub));

  closeMerchantProfileModal();
  window.open('admin.html', '_blank');
}

// Context Switch into Cashier POS Panel
function loginAsCashier(storeId) {
  const sub = subscribersList.find(s => s.storeId === storeId || s.id === storeId);
  if (!sub) return;

  const targetStoreId = sub.storeId || storeId;
  if (window.POS_FIREBASE && typeof window.POS_FIREBASE.setStoreId === 'function') {
    window.POS_FIREBASE.setStoreId(targetStoreId);
  }

  localStorage.setItem('pos_active_store_id', targetStoreId);
  localStorage.setItem('pos_subscription', JSON.stringify(sub));

  closeMerchantProfileModal();
  window.open('cashier.html', '_blank');
}

// Extend or Reduce Merchant Subscription Duration (+/- Days)
function extendMerchantSubscription(storeId) {
  const sub = subscribersList.find(s => s.storeId === storeId || s.id === storeId);
  if (!sub) return;

  const currentExpiry = sub.trialExpiresAt ? new Date(sub.trialExpiresAt) : new Date();
  const daysStr = prompt(`'${sub.storeName}' এর সাবস্ক্রিপশন কত দিন বাড়াতে (+) বা কমাতে (-) চান?\n\n(উদাহরণ: 30 লিখলে ৩০ দিন বাড়বে, -15 লিখলে ১৫ দিন কমবে)`, "30");
  if (!daysStr) return;

  const deltaDays = parseInt(daysStr);
  if (isNaN(deltaDays)) {
    alert('অনুগ্রহ করে সঠিক সংখ্যা লিখুন (যেমন: 30 বা -15)');
    return;
  }

  currentExpiry.setDate(currentExpiry.getDate() + deltaDays);
  sub.trialExpiresAt = currentExpiry.toISOString();

  if (currentExpiry > new Date()) {
    sub.status = 'Active Paid';
    sub.accountBlocked = false;
    sub.accessBlocked = false;
  } else {
    sub.status = 'Expired';
  }

  saveAndSyncSubscriberState(storeId, sub);

  alert(`🎉 '${sub.storeName}' এর মেয়াদের সময় সফলভাবে ${deltaDays >= 0 ? `${deltaDays} দিন বাড়ানো` : `${Math.abs(deltaDays)} দিন কমানো`} হয়েছে!\n\nনতুন শেষ মেয়াদ: ${currentExpiry.toLocaleDateString('bn-BD')}`);
  loadSubscribers();
  closeMerchantProfileModal();
}

// Delete Merchant Account
async function deleteMerchantAccount(storeId) {
  const sub = subscribersList.find(s => s.storeId === storeId || s.id === storeId);
  if (!sub) return;

  if (confirm(`⛔ সতর্কতা: '${sub.storeName}' অ্যাকাউন্টটি স্থায়ীভাবে ডিলেট করতে চান?`)) {
    subscribersList = subscribersList.filter(s => s.storeId !== storeId && s.id !== storeId);
    localStorage.setItem('pos_subscriptions', JSON.stringify(subscribersList));

    if (window.POS_FIREBASE && window.POS_FIREBASE.db) {
      try {
        await window.POS_FIREBASE.db.collection('subscriptions').doc(storeId).delete();
        await window.POS_FIREBASE.db.collection('stores').doc(storeId).delete();
      } catch (err) {}
    }

    alert(`🗑️ '${sub.storeName}' অ্যাকাউন্টটি ডিলেট করা হয়েছে।`);
    loadSubscribers();
    closeMerchantProfileModal();
  }
}

// Purge All Merchant Accounts Completely (Except default demo guest account)
async function purgeAllMerchantsPrompt() {
  if (confirm("⚠️ সতর্কতা: আপনি কি নিশ্চিত যে সমস্ত টেস্ট/নতুন মার্চেন্ট অ্যাকাউন্ট স্থায়ীভাবে ডিলিট করতে চান?\n\nএটি ডাটাবেস ও সুপার এডমিন প্যানেল থেকে সমস্ত মার্চেন্ট রিমুভ করে দেবে যাতে ওই মোবাইল নম্বর দিয়ে আবার নতুন করে নিবন্ধন (Register) করা যায়।")) {
    const idsToDelete = subscribersList
      .filter(s => s.storeId !== 'store_demo_101' && s.id !== 'store_demo_101')
      .map(s => s.storeId || s.id);

    // Filter out non-guest merchants
    subscribersList = subscribersList.filter(s => s.storeId === 'store_demo_101' || s.id === 'store_demo_101');
    if (subscribersList.length === 0) {
      subscribersList = [{
        id: 'store_demo_101',
        storeId: 'store_demo_101',
        storeName: 'গেস্ট ডেমো সুপারশপ (Default Guest Account)',
        ownerName: 'গেস্ট এডমিন',
        phone: '01700000000',
        email: 'guest@smartpos.com',
        storeAddress: 'ঢাকা, বাংলাদেশ',
        plan: 'SmartPOS Counter + E-Commerce Combo',
        setupFee: 14999,
        status: 'Active Paid',
        isTrial: false,
        accountBlocked: false,
        accessBlocked: false,
        accessFeePaid: true,
        trialExpiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
        paymentMethod: 'bKash Send Money',
        trxId: 'GUEST1234',
        senderPhone: '01700000000',
        createdAt: new Date().toISOString()
      }];
    }

    localStorage.setItem('pos_subscriptions', JSON.stringify(subscribersList));
    localStorage.setItem('pos_merchants_purged', 'true');

    // Clear active store subscription if it was one of the deleted stores
    const activeStoreId = localStorage.getItem('pos_active_store_id');
    if (activeStoreId && activeStoreId !== 'store_demo_101') {
      localStorage.removeItem('pos_subscription');
      localStorage.setItem('pos_active_store_id', 'store_demo_101');
    }

    // Purge from Cloud Firestore /subscriptions and /stores
    if (window.POS_FIREBASE && window.POS_FIREBASE.db) {
      for (const id of idsToDelete) {
        try {
          await window.POS_FIREBASE.db.collection('subscriptions').doc(id).delete();
          await window.POS_FIREBASE.db.collection('stores').doc(id).delete();
        } catch (e) {
          console.warn('[Firestore Purge Error]:', e);
        }
      }
    }

    alert('🎉 সকল অনাকাঙ্ক্ষিত মার্চেন্ট অ্যাকাউন্ট সফলভাবে ডিলিট ও ডাটাবেস সম্পূর্ণ ক্লিয়ার করা হয়েছে!\n\nএখন যে কেউ ওই নম্বর দিয়ে নতুন করে রেজিস্ট্রেশন করতে পারবে।');
    loadSubscribers();
  }
}

// Add New Merchant Prompt (Manual Creation from Super Admin)
function addNewSubscriberPrompt() {
  const storeName = prompt("নতুন মার্চেন্ট শপের নাম লিখুন:", "নতুন ফ্যাশন হাউস");
  if (!storeName) return;
  const ownerName = prompt("মালিকের নাম লিখুন:", "মার্চেন্ট ওনার");
  if (!ownerName) return;
  const phone = prompt("মোবাইল নম্বর লিখুন:", "01700000000");
  if (!phone) return;

  const newStoreId = `store_${Date.now()}`;
  const newSub = {
    id: newStoreId,
    storeId: newStoreId,
    storeName: storeName,
    ownerName: ownerName,
    phone: phone,
    email: '',
    storeAddress: 'ঢাকা, বাংলাদেশ',
    plan: 'SmartPOS Counter + E-Commerce Combo',
    setupFee: currentCMS.rates ? currentCMS.rates.rateAccess : 14999,
    amountPaid: 150,
    requestedMonths: 1,
    status: 'Active Paid',
    isTrial: false,
    accountBlocked: false,
    accessBlocked: false,
    accessFeePaid: true,
    trialExpiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    paymentMethod: 'bKash Send Money',
    trxId: 'ADMIN_MANUAL',
    senderPhone: phone,
    createdAt: new Date().toISOString()
  };

  subscribersList.unshift(newSub);
  localStorage.setItem('pos_subscriptions', JSON.stringify(subscribersList));

  if (window.POS_FIREBASE && window.POS_FIREBASE.db) {
    try {
      window.POS_FIREBASE.db.collection('subscriptions').doc(newStoreId).set(newSub, { merge: true });
    } catch (e) {}
  }

  alert(`✅ নতুন মার্চেন্ট '${storeName}' সফলভাবে তৈরি করা হয়েছে!`);
  loadSubscribers();
}


