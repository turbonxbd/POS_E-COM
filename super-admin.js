// SmartPOS Master Super Admin Logic Engine

const MASTER_PIN = '9999';

document.addEventListener('DOMContentLoaded', () => {
  initSecurityModal();
  initTabNavigation();
  initCMSForms();
  loadSubscribers();
});

// Default CMS payload matching revised business model
let currentCMS = {
  hero: {
    badge: "🚀 ৩,০০০+ দোকানে বিশ্বস্ত - স্মার্ট ক্লাউড POS সফটওয়্যার",
    title: "আপনার দোকানের ব্যবসা পরিচালনা করুন <span>যেকোনো স্থান থেকে!</span>",
    desc: "স্মার্ট ইনভেন্টরি এন্ট্রি, বারকোড স্ক্যানিং, রিয়েল-টাইম ফায়ারবেস ক্লাউড সিঙ্ক, আল্ট্রা-ফাস্ট ক্যাশিয়ার টার্মিনাল ও নিট প্রফিটের অটোম্যাটেড রিপোর্ট নিন এক ক্লিকে।",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
  },
  showcase: [
    {
      id: "sc1",
      badge: "কাউন্টার সেলস টার্মিনাল",
      badgeClass: "bg-blue-glow",
      title: "আল্ট্রা-ফাস্ট ক্যাশিয়ার কাউন্টার ও ডিজিটাল মেমো",
      desc: "বারকোড স্ক্যানার দিয়ে পেমেন্ট নিন, অটোমেটিক ডিসকাউন্ট/ট্যাক্স যোগ করুন এবং মুহূর্তে প্রফেশনাল থার্মাল ও পিডিএফ মেমো প্রিন্ট দিন।",
      image: "https://images.unsplash.com/photo-1556742049-0a670f4a458d?auto=format&fit=crop&w=800&q=80",
      bullets: [
        "বারকোড স্ক্যানার ও কিবোর্ড শর্টকাট সাপোর্ট",
        "বিকাশ, নগদ, কার্ড ও ক্যাশ পেমেন্ট গেটওয়ে",
        "এক ক্লিকে প্রফেশনাল ডিজিটাল রসিদ প্রিন্ট"
      ]
    },
    {
      id: "sc2",
      badge: "ওয়্যারহাউস ও মার্চেন্ট প্যানেল",
      badgeClass: "bg-orange-glow",
      title: "স্মার্ট স্টক এন্ট্রি ও অটো বারকোড স্টিকার জেনারেটর",
      desc: "এক ক্লিকে নতুন প্রোডাক্ট যোগ করুন, ক্রয়মূল্য ও বিক্রয়মূল্য সেট করুন এবং যেকোনো পণ্যের জন্য নিজস্ব সাইজের বারকোড স্টিকার তৈরি করে প্রিন্ট নিন।",
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
      bullets: [
        "পণ্যের ছবি, ক্যাটেগরি ও স্টক এলার্ট",
        "নিজস্ব ফরম্যাটে প্রফেশনাল বারকোড স্টিকার জেনারেট",
        "লো-স্টক নোটিফিকেশন ও অটোমেটিক ইনভেন্টরি সামঞ্জস্য"
      ]
    }
  ],
  plans: [
    { id: "pos_standalone", name: "স্মার্ট POS টার্মিনাল ও ইনভেন্টরি", desc: "দোকানের কাউন্টার সেলস ও ইনভেন্টরি", setupPrice: 9999, monthlyPrice: 499, status: "LIVE", popular: false, comingSoon: false, features: ["১টি ফিজিক্যাল শপ ক্যাশিয়ার কাউন্টার এক্সেস", "মার্চেন্ট এডমিন ড্যাশবোর্ড ও ইনভেন্টরি সাপোর্ট", "বারকোড স্ক্যানার ও অটোমেটিক স্টিকার জেনারেটর", "ফায়ারবেস রিয়েল-টাইম ক্লাউড সিঙ্কিং", "৭ দিনের ফ্রি ট্রায়াল অন্তর্ভুক্ত"] },
    { id: "pos_ecommerce_combo", name: "POS কাউন্টার + ই-কমার্স ওয়েবসাইট", desc: "দোকানের POS কাউন্টার ও অনলাইন ওয়েবসাইট একসাথে সিঙ্কড", setupPrice: 14999, monthlyPrice: 999, status: "BEST_SELLER", popular: true, comingSoon: true, features: ["POS কাউন্টার ও কাস্টম ই-কমার্স শপ সমন্বিত", "ওয়েবসাইট ও দোকানের স্টক রিয়েল-টাইমে অটো সিঙ্ক", "অনলাইন অর্ডার নোটিফিকেশন ও কাস্টমার পোর্টাল", "আনলিমিটেড প্রোডাক্ট ও ইমেজ গ্যালারি", "২৪/৭ প্রিওরিটি ফোন ও হোয়াটসঅ্যাপ সাপোর্ট"] },
    { id: "ecommerce_only", name: "অনলাইন ই-কমার্স ওয়েবসাইট", desc: "শুধুমাত্র ব্র্যান্ডের নিজস্ব কাস্টম ই-কমার্স শপ", setupPrice: 7999, monthlyPrice: 499, status: "COMING_SOON", popular: false, comingSoon: true, features: ["কাস্টম ব্র্যান্ডেড ই-কমার্স প্ল্যাটফর্ম", "বিকাশ/নগদ পেমেন্ট গেটওয়ে ইন্টিগ্রেশন", "কাস্টমার একাউন্ট ও অর্ডার ট্র্যাকিং", "ফেসবুক পিক্সেল ও এসইও অপটিমাইজড"] }
  ]
};

let subscribersList = [];

// Security Verification Modal
function initSecurityModal() {
  const modal = document.getElementById('superPinModal');
  const form = document.getElementById('pinAuthForm');
  const pinInput = document.getElementById('masterPinInput');
  const layout = document.getElementById('masterLayout');

  if (sessionStorage.getItem('pos_master_authenticated') === 'true') {
    modal.style.display = 'none';
    layout.style.display = 'flex';
    loadCMSFromCloud();
    return;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (pinInput.value.trim() === MASTER_PIN) {
      sessionStorage.setItem('pos_master_authenticated', 'true');
      modal.style.display = 'none';
      layout.style.display = 'flex';
      loadCMSFromCloud();
    } else {
      alert('ভুল সুপার এডমিন সিকিউরিটি পিন! সঠিক পিন ইনপুট দিন।');
      pinInput.value = '';
    }
  });
}

// Tab Switching Navigation
function initTabNavigation() {
  const menuItems = document.querySelectorAll('.master-menu-item[data-tab]');
  const tabViews = document.querySelectorAll('.tab-view');
  const titleEl = document.getElementById('activeTabTitle');

  const titlesMap = {
    tabOverview: 'প্ল্যাটফর্ম ওভারভিউ ও অ্যানালিটিক্স',
    tabHeroCMS: 'ল্যান্ডিং পেজ কন্টেন্ট এডিটর',
    tabShowcaseCMS: 'প্যানেল ছবি ও ফিচার এডিটর',
    tabPricingCMS: 'সাবস্ক্রিপশন প্রাইসিং ও সেটআপ ফি কন্ট্রোল',
    tabSubscribers: 'নিবন্ধিত সাবস্ক্রাইবার শপস ও ফ্রি ট্রায়াল ট্র্যাকিং'
  };

  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      menuItems.forEach(i => i.classList.remove('active'));
      tabViews.forEach(v => v.style.display = 'none');

      item.classList.add('active');
      const targetTab = item.getAttribute('data-tab');
      const targetView = document.getElementById(targetTab);
      if (targetView) targetView.style.display = 'block';
      if (titleEl && titlesMap[targetTab]) titleEl.textContent = titlesMap[targetTab];
    });
  });
}

// Load CMS Data from Firestore
async function loadCMSFromCloud() {
  if (window.POS_FIREBASE && window.POS_FIREBASE.db) {
    try {
      const doc = await window.POS_FIREBASE.db.collection('landing_cms').doc('content').get();
      if (doc.exists && doc.data()) {
        currentCMS = { ...currentCMS, ...doc.data() };
        console.log('[Master Admin] Loaded CMS data from Firestore');
      }
    } catch (e) {
      console.warn('[Master Admin] Using local CMS state:', e);
    }
  }

  populateCMSForms();
}

// Populate CMS Input Forms
function populateCMSForms() {
  if (currentCMS.hero) {
    document.getElementById('cmsBadge').value = currentCMS.hero.badge || '';
    document.getElementById('cmsTitle').value = currentCMS.hero.title || '';
    document.getElementById('cmsDesc').value = currentCMS.hero.desc || '';
    document.getElementById('cmsVideoUrl').value = currentCMS.hero.videoUrl || '';
  }

  if (currentCMS.showcase && currentCMS.showcase.length >= 2) {
    document.getElementById('sc1Image').value = currentCMS.showcase[0].image || '';
    document.getElementById('sc1Title').value = currentCMS.showcase[0].title || '';
    document.getElementById('sc1Desc').value = currentCMS.showcase[0].desc || '';

    document.getElementById('sc2Image').value = currentCMS.showcase[1].image || '';
    document.getElementById('sc2Title').value = currentCMS.showcase[1].title || '';
    document.getElementById('sc2Desc').value = currentCMS.showcase[1].desc || '';
  }

  if (currentCMS.plans && currentCMS.plans.length >= 3) {
    document.getElementById('p1Monthly').value = currentCMS.plans[0].setupPrice || 9999;
    document.getElementById('p1Yearly').value = currentCMS.plans[0].monthlyPrice || 499;

    document.getElementById('p2Monthly').value = currentCMS.plans[1].setupPrice || 14999;
    document.getElementById('p2Yearly').value = currentCMS.plans[1].monthlyPrice || 999;

    document.getElementById('p3Monthly').value = currentCMS.plans[2].setupPrice || 7999;
    document.getElementById('p3Yearly').value = currentCMS.plans[2].monthlyPrice || 499;
  }
}

// Form Submission Handlers
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
  });

  document.getElementById('showcaseCMSForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentCMS.showcase) currentCMS.showcase = DEFAULT_CMS.showcase;

    currentCMS.showcase[0].image = document.getElementById('sc1Image').value.trim();
    currentCMS.showcase[0].title = document.getElementById('sc1Title').value.trim();
    currentCMS.showcase[0].desc = document.getElementById('sc1Desc').value.trim();

    currentCMS.showcase[1].image = document.getElementById('sc2Image').value.trim();
    currentCMS.showcase[1].title = document.getElementById('sc2Title').value.trim();
    currentCMS.showcase[1].desc = document.getElementById('sc2Desc').value.trim();

    saveCMSDataToCloud();
  });

  document.getElementById('pricingCMSForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentCMS.plans) currentCMS.plans = DEFAULT_CMS.plans;

    currentCMS.plans[0].setupPrice = parseFloat(document.getElementById('p1Monthly').value) || 9999;
    currentCMS.plans[0].monthlyPrice = parseFloat(document.getElementById('p1Yearly').value) || 499;

    currentCMS.plans[1].setupPrice = parseFloat(document.getElementById('p2Monthly').value) || 14999;
    currentCMS.plans[1].monthlyPrice = parseFloat(document.getElementById('p2Yearly').value) || 999;

    currentCMS.plans[2].setupPrice = parseFloat(document.getElementById('p3Monthly').value) || 7999;
    currentCMS.plans[2].monthlyPrice = parseFloat(document.getElementById('p3Yearly').value) || 499;

    saveCMSDataToCloud();
  });
}

// Push CMS Changes to Cloud Firestore
async function saveCMSDataToCloud() {
  if (window.POS_FIREBASE && window.POS_FIREBASE.db) {
    try {
      await window.POS_FIREBASE.db.collection('landing_cms').doc('content').set(currentCMS, { merge: true });
      alert('সফলভাবে লাইভ ওয়েবসাইটে সকল পরিবর্তন সেভ ও পাবলিশ করা হয়েছে! 🎉');
    } catch (err) {
      console.error('[CMS Cloud Save Error]:', err);
      alert('ফায়ারবেস ক্লাউডে সেভ করতে সমস্যা হয়েছে: ' + err.message);
    }
  } else {
    alert('ফায়ারবেস ডাটাবেস কানেক্টেড নয়!');
  }
}

// Load Subscribers Data
async function loadSubscribers() {
  subscribersList = [];

  if (window.POS_FIREBASE && window.POS_FIREBASE.db) {
    try {
      const snap = await window.POS_FIREBASE.db.collection('subscriptions').get();
      snap.forEach(doc => {
        subscribersList.push({ id: doc.id, ...doc.data() });
      });
    } catch (e) {
      console.warn('Subscribers load error:', e);
    }
  }

  if (!subscribersList.length) {
    subscribersList = [
      { id: "sub1", storeName: "মা ফার্মেসী ও সার্জিক্যাল", ownerName: "আবু তাহের", phone: "01711223344", plan: "SmartPOS Terminal", paymentMethod: "7-Day Free Trial", status: "Trial Active", isTrial: true, createdAt: "2026-08-14" },
      { id: "sub2", storeName: "রয়্যাল ক্লথিং ব্র্যান্ড", ownerName: "তানভীর হাসান", phone: "01855667788", plan: "SmartPOS Terminal (৳9,999)", paymentMethod: "bKash", status: "Active Paid", isTrial: false, createdAt: "2026-08-14" }
    ];
  }

  renderSubscribersOverview();
}

function renderSubscribersOverview() {
  const totalStoresEl = document.getElementById('statTotalStores');
  const activeStoresEl = document.getElementById('statActiveStores');
  const pendingStoresEl = document.getElementById('statPendingStores');
  const totalRevEl = document.getElementById('statTotalRevenue');

  const overviewBody = document.getElementById('overviewSubscribersTableBody');
  const masterBody = document.getElementById('subscribersMasterTableBody');

  const activeCount = subscribersList.filter(s => s.status.includes('Active')).length;
  const pendingCount = subscribersList.filter(s => s.status.includes('Pending') || s.isTrial).length;

  let totalRev = 0;
  subscribersList.forEach(s => {
    if (!s.isTrial) {
      if (s.plan.includes('9999')) totalRev += 9999;
      else if (s.plan.includes('14999')) totalRev += 14999;
      else totalRev += 9999;
    }
  });

  if (totalStoresEl) totalStoresEl.textContent = subscribersList.length;
  if (activeStoresEl) activeStoresEl.textContent = activeCount;
  if (pendingStoresEl) pendingStoresEl.textContent = pendingCount;
  if (totalRevEl) totalRevEl.textContent = `৳${totalRev.toLocaleString()}`;

  const rowsHTML = subscribersList.map(s => `
    <tr>
      <td><strong>${s.storeName}</strong></td>
      <td>${s.ownerName}</td>
      <td>${s.phone}</td>
      <td><span class="badge" style="background:rgba(59,130,246,0.15); color:#3b82f6;">${s.plan}</span></td>
      <td>${s.paymentMethod}</td>
      <td><span class="badge-status ${s.isTrial ? 'badge-pending' : 'badge-active'}">${s.status}</span></td>
      <td>${s.createdAt ? s.createdAt.substring(0, 10) : 'Today'}</td>
    </tr>
  `).join('');

  if (overviewBody) overviewBody.innerHTML = rowsHTML;

  const masterRowsHTML = subscribersList.map(s => `
    <tr>
      <td><strong>${s.storeName}</strong></td>
      <td>${s.ownerName}</td>
      <td>${s.phone}</td>
      <td>${s.plan}</td>
      <td>${s.paymentMethod}</td>
      <td><span class="badge-status ${s.isTrial ? 'badge-pending' : 'badge-active'}">${s.status}</span></td>
      <td>
        ${s.isTrial ? `<button onclick="updateSubStatus('${s.id}', 'Active Paid')" class="btn-submit" style="padding:0.35rem 0.75rem; font-size:0.8rem; background:#10b981;"><i class="fa-solid fa-check"></i> ফুল পেড এক্টিভ করুন</button>` : ''}
        ${!s.isTrial && s.status !== 'Suspended' ? `<button onclick="updateSubStatus('${s.id}', 'Suspended')" class="btn-submit" style="padding:0.35rem 0.75rem; font-size:0.8rem; background:#ef4444;"><i class="fa-solid fa-ban"></i> স্থগিত</button>` : ''}
      </td>
    </tr>
  `).join('');

  if (masterBody) masterBody.innerHTML = masterRowsHTML;
}

// Update Subscription Status in Cloud
async function updateSubStatus(id, newStatus) {
  const target = subscribersList.find(s => s.id === id);
  if (target) {
    target.status = newStatus;
    target.isTrial = false;
    if (window.POS_FIREBASE && window.POS_FIREBASE.db && !id.startsWith('sub')) {
      try {
        await window.POS_FIREBASE.db.collection('subscriptions').doc(id).update({ status: newStatus, isTrial: false });
      } catch (e) {
        console.error('Subscription status update error:', e);
      }
    }
    renderSubscribersOverview();
    alert(`সাবস্ক্রাইবার স্ট্যাটাস ${newStatus}-এ আপডেট করা হয়েছে!`);
  }
}
