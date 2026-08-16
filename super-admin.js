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

// Load Subscribers Data from ALL sources (LocalStorage, Firestore /subscriptions, Firestore /stores)
async function loadSubscribers() {
  const mergedMap = new Map();

  // Helper to add/merge merchant into map safely
  const addMerchantToMap = (item) => {
    if (!item) return;
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
      isTrial: item.isTrial !== false,
      accountBlocked: item.accountBlocked === true,
      accessBlocked: item.accessBlocked === true,
      accessFeePaid: item.accessFeePaid !== false,
      trialExpiresAt: item.trialExpiresAt || new Date(Date.now() + 7 * 86400000).toISOString(),
      paymentMethod: item.paymentMethod || 'bKash Send Money',
      trxId: item.trxId || '',
      senderPhone: item.senderPhone || item.phone || '',
      createdAt: item.createdAt || item.submittedAt || new Date().toISOString()
    };

    if (mergedMap.has(storeId)) {
      mergedMap.set(storeId, { ...mergedMap.get(storeId), ...normalizedItem });
    } else {
      mergedMap.set(storeId, normalizedItem);
    }
  };

  // 1. Load from LocalStorage pos_subscriptions array
  let localSubs = JSON.parse(localStorage.getItem('pos_subscriptions'));
  const isPurgedState = localStorage.getItem('pos_merchants_purged') === 'true';

  if (Array.isArray(localSubs) && localSubs.length > 0) {
    localSubs.forEach(addMerchantToMap);
  }

  // 2. Load from LocalStorage active pos_subscription if present and not purged
  let activeSub = JSON.parse(localStorage.getItem('pos_subscription'));
  if (activeSub && !isPurgedState) addMerchantToMap(activeSub);

  // 3. Load from Cloud Firestore /subscriptions collection if not purged
  if (!isPurgedState && window.POS_FIREBASE && window.POS_FIREBASE.db) {
    try {
      const subSnapshot = await window.POS_FIREBASE.db.collection('subscriptions').get();
      if (!subSnapshot.empty) {
        subSnapshot.forEach(doc => addMerchantToMap({ id: doc.id, ...doc.data() }));
      }
    } catch (err) {
      console.warn('Firestore /subscriptions fetch warning:', err);
    }

    // 4. Load from Cloud Firestore /stores collection (All registered store accounts!)
    try {
      const storesSnapshot = await window.POS_FIREBASE.db.collection('stores').get();
      if (!storesSnapshot.empty) {
        for (const doc of storesSnapshot.docs) {
          const storeData = doc.data() || {};
          try {
            const settingsDoc = await window.POS_FIREBASE.db.collection('stores').doc(doc.id).collection('pos_data').doc('pos_settings').get();
            if (settingsDoc.exists) {
              const settings = settingsDoc.data().data || {};
              addMerchantToMap({
                storeId: doc.id,
                storeName: settings.storeName || storeData.storeName || doc.id,
                ownerName: settings.ownerName || settings.storeOwner || 'Merchant Owner',
                phone: settings.phone || settings.storePhone || '01700000000',
                email: settings.email || settings.storeEmail || '',
                storeAddress: settings.storeAddress || 'Dhaka, Bangladesh',
                plan: storeData.plan || 'SmartPOS Counter + E-Commerce Combo',
                setupFee: storeData.setupFee || 14999,
                status: storeData.status || 'Active Paid'
              });
            } else {
              addMerchantToMap({ storeId: doc.id, storeName: storeData.storeName || doc.id, ...storeData });
            }
          } catch (e) {
            addMerchantToMap({ storeId: doc.id, storeName: storeData.storeName || doc.id, ...storeData });
          }
        }
      }
    } catch (err) {
      console.warn('Firestore /stores fetch warning:', err);
    }
  }

  // Filter out any legacy test stores (hhhhhhhh, bbbbbbbb, gggggggg, etc.)
  const allLoaded = Array.from(mergedMap.values());
  let validStores = allLoaded.filter(item => {
    const isGuest = item.storeId === 'store_demo_101' || item.id === 'store_demo_101';
    if (isGuest) return true;

    // Keep fresh signups created from now on
    if (item.isFreshSignup) return true;

    // Filter out mock test entries from previous test runs
    const name = (item.storeName || '').toLowerCase();
    const phone = (item.phone || item.senderPhone || '');
    if (name.includes('hhhh') || name.includes('bbbb') || name.includes('gggg') || phone.includes('01333333333') || phone.includes('01222222222')) {
      return false;
    }

    // By default, purge all legacy pre-reset test stores unless specifically registered fresh
    return false;
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
  localStorage.setItem('pos_merchants_purged', 'true');

  renderDashboardStats();
  renderSubscribersMasterTable();
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

// Render Master Merchant Directory Table (With separate Merchant Admin & Cashier POS Inspection Buttons)
function renderSubscribersMasterTable() {
  const masterBody = document.getElementById('subscribersMasterTableBody');
  const list = filteredSubscribers.length > 0 || activeSubFilter !== 'all' ? filteredSubscribers : subscribersList;

  if (!masterBody) return;

  masterBody.innerHTML = list.map(s => `
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
        <div>৳${toBnNum(s.amountPaid || 150)}/মাস</div>
        ${s.trxId ? `<small style="color:#10b981; font-weight:700; font-family:monospace; display:block;">TrxID: ${s.trxId}</small>` : ''}
      </td>
      <td>
        <span class="badge-status ${s.accountBlocked ? 'badge-suspended' : (s.isTrial ? 'badge-pending' : 'badge-active')}">${s.accountBlocked ? '⛔ অ্যাকাউন্ট ব্লকড' : s.status}</span>
      </td>
      <td onclick="event.stopPropagation();">
        <div style="display:flex; gap:0.4rem; justify-content:center; flex-wrap:wrap;">
          <button onclick="openMerchantProfileModal('${s.storeId || s.id}')" class="btn-submit" style="padding:0.35rem 0.55rem; font-size:0.75rem; background:linear-gradient(135deg, #a855f7, #7c3aed);" title="প্রোফাইল ডিটেইলস">
            <i class="fa-solid fa-id-card"></i> প্রোফাইল
          </button>
          <button onclick="loginAsMerchant('${s.storeId || s.id}')" class="btn-submit" style="padding:0.35rem 0.55rem; font-size:0.75rem; background:linear-gradient(135deg, #3b82f6, #2563eb);" title="মার্চেন্ট এডমিন প্যানেলে ঢুকুন">
            <i class="fa-solid fa-user-gear"></i> এডমিন
          </button>
          <button onclick="loginAsCashier('${s.storeId || s.id}')" class="btn-submit" style="padding:0.35rem 0.55rem; font-size:0.75rem; background:linear-gradient(135deg, #10b981, #059669);" title="ক্যাশিয়ার POS প্যানেলে ঢুকুন">
            <i class="fa-solid fa-cash-register"></i> POS
          </button>
          <button onclick="toggleMerchantAccountBlock('${s.storeId || s.id}')" class="btn-submit" style="padding:0.35rem 0.55rem; font-size:0.75rem; background:${s.accountBlocked ? '#10b981' : '#e11d48'};" title="${s.accountBlocked ? 'অ্যাকাউন্ট আনব্লক' : 'অ্যাকাউন্ট ব্লক'}">
            <i class="fa-solid ${s.accountBlocked ? 'fa-lock-open' : 'fa-lock'}"></i> ${s.accountBlocked ? 'আনব্লক' : 'ব্লক'}
          </button>
        </div>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="6" class="text-center p-3 text-muted">কোনো সাবস্ক্রাইবার মার্চেন্ট পাওয়া যায়নি</td></tr>`;
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

// Render Dedicated Monthly Recurring Subscriptions Table (Tab 4 - With Requested Months & Verification Actions)
function renderPendingSubscriptionsTable() {
  const body = document.getElementById('pendingSubscriptionsTableBody');
  if (!body) return;

  const pendingList = subscribersList.filter(s => s.trxId || s.status === 'Active Paid (Pending Verification)' || s.isTrial);

  body.innerHTML = pendingList.map(s => `
    <tr>
      <td><strong>${s.storeName}</strong></td>
      <td>${s.ownerName} (${s.phone})</td>
      <td><strong style="color:#a855f7;">${toBnNum(s.requestedMonths || 1)} মাস</strong> (${toBnNum(s.amountPaid || 150)} ৳)</td>
      <td>
        <strong style="color:#10b981; font-family:monospace; display:block;">TrxID: ${s.trxId || 'N/A'}</strong>
        <small style="color:#94a3b8;">Sender: ${s.senderPhone || s.phone}</small>
      </td>
      <td>${s.submittedAt ? new Date(s.submittedAt).toLocaleTimeString('bn-BD') : 'আজকে'}</td>
      <td style="text-align: center;">
        <div style="display:flex; gap:0.4rem; justify-content:center;">
          <button onclick="approveMerchantSubscription('${s.storeId || s.id}')" class="btn-submit" style="padding:0.35rem 0.75rem; font-size:0.8rem; background:#10b981;">
            <i class="fa-solid fa-check"></i> অনুমোদন দিন
          </button>
          <button onclick="rejectMerchantSubscription('${s.storeId || s.id}')" class="btn-submit" style="padding:0.35rem 0.75rem; font-size:0.8rem; background:#e11d48;">
            <i class="fa-solid fa-xmark"></i> বাতিল ও দিন মাইনাস
          </button>
        </div>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="6" class="text-center p-3 text-muted">কোনো পেন্ডিং রিনিউ আবেদন পাওয়া যায়নি</td></tr>`;
}

// Open Clickable Merchant Profile Modal with Deep-Dive Details
function openMerchantProfileModal(storeId) {
  const sub = subscribersList.find(s => s.storeId === storeId || s.id === storeId);
  if (!sub) return;

  const modal = document.getElementById('merchantProfileModal');
  const container = document.getElementById('merchantProfileContent');

  const expiryIso = sub.trialExpiresAt || new Date(Date.now() + 7 * 86400000).toISOString();
  const timeInfo = formatRemainingTime(expiryIso);

  container.innerHTML = `
    <!-- PROFILE HEADER CARD -->
    <div style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(59, 130, 246, 0.1)); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 18px; padding: 1.25rem; margin-bottom: 1.25rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <span class="badge-status ${sub.accountBlocked ? 'badge-suspended' : (sub.isTrial ? 'badge-pending' : 'badge-active')}">${sub.accountBlocked ? '⛔ অ্যাকাউন্ট ব্লকড' : sub.status}</span>
        <small style="color: #94a3b8;">Store ID: <code>${sub.storeId || storeId}</code></small>
      </div>
      <h3 style="color: #fff; font-size: 1.3rem; margin-bottom: 0.2rem;">${sub.storeName}</h3>
      <p style="color: #cbd5e1; font-size: 0.9rem;"><i class="fa-solid fa-user"></i> মালিক: <strong>${sub.ownerName}</strong> | <i class="fa-solid fa-phone"></i> ${sub.phone}</p>
    </div>

    <!-- REMAINING TIME COUNTER CARD -->
    <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; border-radius: 14px; padding: 1rem; margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <small style="color: #64748b; font-weight: 600; display: block;">অবশিষ্ট মেয়াদের সময় (Exact Remaining Time):</small>
        <h3 style="color: #10b981; font-size: 1.3rem; margin-top: 2px;">${timeInfo.text}</h3>
      </div>
      <div style="font-size: 2rem; color: #10b981;"><i class="fa-solid fa-hourglass-half"></i></div>
    </div>

    <!-- DETAILS GRID -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; font-size: 0.9rem;">
      <div style="background: rgba(30,41,59,0.5); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-color);">
        <strong style="color: #a855f7; display: block; margin-bottom: 0.5rem;"><i class="fa-solid fa-circle-info"></i> পার্সোনাল তথ্য</strong>
        <div>ইমেইল: <strong>${sub.email || 'N/A'}</strong></div>
        <div>ফোন: <strong>${sub.phone}</strong></div>
        <div>নিবন্ধন তারিখ: <strong>${sub.createdAt || 'আজকে'}</strong></div>
      </div>

      <div style="background: rgba(30,41,59,0.5); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-color);">
        <strong style="color: #3b82f6; display: block; margin-bottom: 0.5rem;"><i class="fa-solid fa-building"></i> বিজনেস ও পেমেন্ট তথ্য</strong>
        <div>এক্সেস সেটআপ ফি: <strong style="color:#10b981;">৳${toBnNum(sub.setupFee || 14999)}</strong></div>
        <div>মাসিক ফি: <strong>৳${toBnNum(sub.amountPaid || 150)}/মাস (${toBnNum(sub.requestedMonths || 1)} মাস)</strong></div>
        <div>TrxID: <strong style="color:#10b981; font-family:monospace;">${sub.trxId || 'N/A'}</strong></div>
      </div>
    </div>

    <!-- ACTION BUTTONS -->
    <div style="display: flex; gap: 8px; flex-wrap: wrap; border-top: 1px solid var(--border-color); padding-top: 1rem;">
      <button onclick="loginAsMerchant('${sub.storeId || storeId}')" class="btn-submit" style="background: linear-gradient(135deg, #3b82f6, #2563eb); flex: 1;">
        <i class="fa-solid fa-user-gear"></i> এডমিন
      </button>
      <button onclick="loginAsCashier('${sub.storeId || storeId}')" class="btn-submit" style="background: linear-gradient(135deg, #10b981, #059669); flex: 1;">
        <i class="fa-solid fa-cash-register"></i> POS
      </button>
      <button onclick="extendMerchantSubscription('${sub.storeId || storeId}')" class="btn-submit" style="background: #8b5cf6; flex: 1;">
        <i class="fa-solid fa-calendar-plus"></i> মেয়াদ বাড়ান
      </button>
      <button onclick="toggleMerchantAccountBlock('${sub.storeId || storeId}')" class="btn-submit" style="background: ${sub.accountBlocked ? '#10b981' : '#e11d48'}; flex: 1;">
        <i class="fa-solid ${sub.accountBlocked ? 'fa-lock-open' : 'fa-lock'}"></i> ${sub.accountBlocked ? 'আনব্লক' : 'ব্লক'}
      </button>
      <button onclick="deleteMerchantAccount('${sub.storeId || storeId}')" class="btn-submit" style="background: rgba(239,68,68,0.2); border: 1px solid #ef4444; color: #ef4444;">
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

// Approve Monthly Subscription Request
function approveMerchantSubscription(storeId) {
  const sub = subscribersList.find(s => s.storeId === storeId || s.id === storeId);
  if (!sub) return;

  sub.status = 'Active Paid';
  sub.isTrial = false;
  sub.accountBlocked = false;

  localStorage.setItem('pos_subscriptions', JSON.stringify(subscribersList));

  if (window.POS_FIREBASE && window.POS_FIREBASE.db) {
    window.POS_FIREBASE.db.collection('subscriptions').doc(storeId).set(sub, { merge: true });
  }

  alert(`✅ '${sub.storeName}' এর সাবস্ক্রিপশন সফলভাবে অনুমোদন করা হয়েছে!`);
  loadSubscribers();
  renderPendingSubscriptionsTable();
}

// Reject Monthly Subscription Request & DEDUCT Exact Duration (30 Days for 1m, 180 Days for 6m, 365 Days for 12m)
function rejectMerchantSubscription(storeId) {
  const sub = subscribersList.find(s => s.storeId === storeId || s.id === storeId);
  if (!sub) return;

  const reqMonths = parseInt(sub.requestedMonths) || 1;
  let deductDays = 30;
  if (reqMonths === 6) deductDays = 180;
  else if (reqMonths === 12) deductDays = 365;
  else deductDays = reqMonths * 30;

  if (confirm(`⚠️ ট্রানজ্যাকশন আইডি ভুল/ভুয়া চিহ্নিত করে '${sub.storeName}' এর ${toBnNum(reqMonths)} মাসের সাবস্ক্রিপশন বাতিল করতে চান?\n\nএটি মার্চেন্টের অ্যাকাউন্ট থেকে সর্বমোট ${deductDays} দিন মেয়াদী সাবস্ক্রিপশন মাইনাস (Deduct) করবে!`)) {
    const currentExpiry = sub.trialExpiresAt ? new Date(sub.trialExpiresAt) : new Date();
    currentExpiry.setDate(currentExpiry.getDate() - deductDays);

    sub.trialExpiresAt = currentExpiry.toISOString();
    sub.status = 'Suspended (Transaction Rejected)';
    sub.trxId = '';

    localStorage.setItem('pos_subscriptions', JSON.stringify(subscribersList));

    if (window.POS_FIREBASE && window.POS_FIREBASE.db) {
      try {
        window.POS_FIREBASE.db.collection('subscriptions').doc(storeId).set(sub, { merge: true });
      } catch (err) {}
    }

    alert(`🔴 '${sub.storeName}' এর ${toBnNum(reqMonths)} মাসের সাবস্ক্রিপশন বাতিল করা হয়েছে এবং অ্যাকাউন্ট থেকে ${toBnNum(deductDays)} দিন মাইনাস করা হয়েছে!`);
    loadSubscribers();
    renderPendingSubscriptionsTable();
    closeMerchantProfileModal();
  }
}

// Block / Unblock Full Merchant Account (From All Merchants)
function toggleMerchantAccountBlock(storeId) {
  const sub = subscribersList.find(s => s.storeId === storeId || s.id === storeId);
  if (!sub) return;

  const willBlock = !sub.accountBlocked;
  const actionText = willBlock ? 'ব্লক ও অ্যাকাউন্ট স্থগিত' : 'আনব্লক ও অ্যাকাউন্ট পুনরুজ্জীবিত';

  if (confirm(`'${sub.storeName}' অ্যাকাউন্টটি ${actionText} করতে চান?`)) {
    sub.accountBlocked = willBlock;
    sub.status = willBlock ? 'Suspended' : 'Active Paid';

    localStorage.setItem('pos_subscriptions', JSON.stringify(subscribersList));

    if (window.POS_FIREBASE && window.POS_FIREBASE.db) {
      try {
        window.POS_FIREBASE.db.collection('subscriptions').doc(storeId).set(sub, { merge: true });
      } catch (err) {}
    }

    alert(`🎉 '${sub.storeName}' অ্যাকাউন্টটি সফলভাবে ${willBlock ? 'ব্লক' : 'আনব্লক'} করা হয়েছে!`);
    loadSubscribers();
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

// Extend Merchant Subscription
function extendMerchantSubscription(storeId) {
  const sub = subscribersList.find(s => s.storeId === storeId || s.id === storeId);
  if (!sub) return;

  const daysStr = prompt(`'${sub.storeName}' এর সাবস্ক্রিপশন কত দিন বাড়াতে চান?`, "30");
  if (!daysStr) return;

  const addDays = parseInt(daysStr) || 30;

  const currentExpiry = sub.trialExpiresAt ? new Date(sub.trialExpiresAt) : new Date();
  const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
  baseDate.setDate(baseDate.getDate() + addDays);

  sub.trialExpiresAt = baseDate.toISOString();
  sub.isTrial = false;
  sub.status = 'Active Paid';
  sub.accountBlocked = false;

  localStorage.setItem('pos_subscriptions', JSON.stringify(subscribersList));

  if (window.POS_FIREBASE && window.POS_FIREBASE.db) {
    window.POS_FIREBASE.db.collection('subscriptions').doc(storeId).set(sub, { merge: true });
  }

  alert(`🎉 '${sub.storeName}' এর সাবস্ক্রিপশন মেয়াদ ${addDays} দিন বাড়ানো হয়েছে!`);
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


