// SmartPOS SaaS Landing Page & CMS Dynamic Engine

document.addEventListener('DOMContentLoaded', () => {
  initCMSData();
  initVideoModal();
  initFAQAccordion();
  initCheckoutForm();
  initMobileNav();
});

// Default CMS fallback data matching revised business model
const DEFAULT_CMS = {
  hero: {
    badge: "🚀 ৩,০০০+ দোকানে বিশ্বস্ত - স্মার্ট ক্লাউড POS সফটওয়্যার",
    title: "আপনার দোকানের ব্যবসা পরিচালনা করুন <span>যেকোনো স্থান থেকে!</span>",
    desc: "স্মার্ট ইনভেন্টরি এন্ট্রি, বারকোড স্ক্যানিং, রিয়েল-টাইম ফায়ারবেস ক্লাউড সিঙ্ক, আল্ট্রা-ফাস্ট ক্যাশিয়ার টার্মিনাল ও নিট প্রফিটের অটোম্যাটেড রিপোর্ট নিন এক ক্লিকে।",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
  },
  showcase: [
    {
      id: "cashier_showcase",
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
      id: "admin_showcase",
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
    },
    {
      id: "analytics_showcase",
      badge: "লাইভ সেলস ও নিট প্রফিট অ্যানালিটিক্স",
      badgeClass: "bg-purple-glow",
      title: "নিখুঁত লাভ-ক্ষতি হিসাব ও রিয়েল-টাইম রিপোর্ট",
      desc: "প্রতিটি বিক্রির লাভ, প্রতিদিনের খরচ এবং নিট মুনাফার পূর্ণাঙ্গ গ্রাফিকাল চার্ট দেখুন। কোনো ভুল বা গরমিল ছাড়াই আপনার ব্যবসা পরিচালনা করুন।",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
      bullets: [
        "আজকের বিক্রির সাথে গতকালের তুলনামূলক অ্যানালিটিক্স",
        "ইনভয়েস হিস্ট্রি ও কাস্টমার ওয়াইজ বাকির হিসেব",
        "এক ক্লিকে এক্সেল বা পিডিএফ সেলস সামারি ডাউনলোড"
      ]
    }
  ],
  plans: [
    {
      id: "pos_standalone",
      name: "স্মার্ট POS টার্মিনাল ও ইনভেন্টরি",
      desc: "দোকানের কাউন্টার সেলস, ইনভেন্টরি ও ফায়ারবেস ক্লাউড সিঙ্ক (লাইভ সার্ভিস)",
      setupPrice: 9999,
      monthlyPrice: 499,
      status: "LIVE",
      popular: false,
      comingSoon: false,
      features: [
        "১টি ফিজিক্যাল শপ ক্যাশিয়ার কাউন্টার এক্সেস",
        "মার্চেন্ট এডমিন ড্যাশবোর্ড ও ইনভেন্টরি সাপোর্ট",
        "বারকোড স্ক্যানার ও অটোমেটিক স্টিকার জেনারেটর",
        "ফায়ারবেস রিয়েল-টাইম ক্লাউড সিঙ্কিং",
        "২৪/৭ প্রিওরিটি কাস্টমার সাপোর্ট"
      ]
    },
    {
      id: "pos_ecommerce_combo",
      name: "POS কাউন্টার + ই-কমার্স ওয়েবসাইট",
      desc: "দোকানের POS কাউন্টার ও অনলাইন ওয়েবসাইট একসাথে সিঙ্কড (🔥 আমাদের বেস্ট সেলিং প্রোডাক্ট)",
      setupPrice: 14999,
      monthlyPrice: 999,
      status: "BEST_SELLER",
      popular: true,
      comingSoon: true,
      features: [
        "POS কাউন্টার ও কাস্টম ই-কমার্স শপ সমন্বিত",
        "ওয়েবসাইট ও দোকানের স্টক রিয়েল-টাইমে অটো সিঙ্ক",
        "অনলাইন অর্ডার নোটিফিকেশন ও কাস্টমার পোর্টাল",
        "আনলিমিটেড প্রোডাক্ট ও ইমেজ গ্যালারি",
        "২৪/৭ প্রিওরিটি ফোন ও হোয়াটসঅ্যাপ সাপোর্ট"
      ]
    },
    {
      id: "ecommerce_only",
      name: "অনলাইন ই-কমার্স ওয়েবসাইট",
      desc: "শুধুমাত্র ব্র্যান্ডের নিজস্ব কাস্টম ই-কমার্স শপ",
      setupPrice: 7999,
      monthlyPrice: 499,
      status: "COMING_SOON",
      popular: false,
      comingSoon: true,
      features: [
        "কাস্টম ব্র্যান্ডেড ই-কমার্স প্ল্যাটফর্ম",
        "বিকাশ/নগদ পেমেন্ট গেটওয়ে ইন্টিগ্রেশন",
        "কাস্টমার একাউন্ট ও অর্ডার ট্র্যাকিং",
        "ফেসবুক পিক্সেল ও এসইও অপটিমাইজড"
      ]
    }
  ]
};

// Fetch Dynamic CMS Data from LocalStorage, BroadcastChannel, and Firebase Firestore
async function initCMSData() {
  let cmsData = DEFAULT_CMS;

  const localCMS = JSON.parse(localStorage.getItem('pos_landing_cms'));
  if (localCMS) {
    cmsData = { ...DEFAULT_CMS, ...localCMS };
  }

  if (window.POS_FIREBASE && window.POS_FIREBASE.db) {
    try {
      const doc = await window.POS_FIREBASE.db.collection('landing_cms').doc('content').get();
      if (doc.exists && doc.data()) {
        const cloudCMS = doc.data();
        cmsData = {
          hero: cloudCMS.hero || cmsData.hero,
          showcase: cloudCMS.showcase || cmsData.showcase,
          plans: cloudCMS.plans || cmsData.plans
        };
      }
    } catch (e) {
      console.warn('[CMS Engine] Using local/default content layout:', e);
    }
  }

  renderHeroCMS(cmsData.hero);
  renderShowcaseCMS(cmsData.showcase);
  renderPricingCMS(cmsData.plans);

  try {
    const bc = new BroadcastChannel('pos_cms_sync');
    bc.onmessage = (event) => {
      if (event.data?.type === 'cms_updated' && event.data.cms) {
        const fresh = event.data.cms;
        if (fresh.hero) renderHeroCMS(fresh.hero);
        if (fresh.showcase) renderShowcaseCMS(fresh.showcase);
        if (fresh.plans) renderPricingCMS(fresh.plans);
      }
    };
  } catch (e) {}
}

function renderHeroCMS(hero) {
  if (!hero) return;
  const badgeEl = document.getElementById('heroBadge');
  const titleEl = document.getElementById('heroTitle');
  const descEl = document.getElementById('heroDesc');
  const iframeEl = document.querySelector('#videoDemoModal iframe');

  if (badgeEl && hero.badge) badgeEl.innerHTML = `<i class="fa-solid fa-sparkles"></i> ${hero.badge}`;
  if (titleEl && hero.title) titleEl.innerHTML = hero.title;
  if (descEl && hero.desc) descEl.textContent = hero.desc;
  if (iframeEl && hero.videoUrl) iframeEl.src = hero.videoUrl;
}

function renderShowcaseCMS(showcaseList) {
  const container = document.getElementById('panelShowcaseContainer');
  if (!container || !showcaseList || !showcaseList.length) return;

  container.innerHTML = showcaseList.map((item, index) => `
    <div class="panel-showcase-item ${index % 2 === 1 ? 'reverse' : ''}">
      <div class="showcase-image-card">
        <img src="${item.image}" alt="${item.title}" loading="lazy">
      </div>

      <div class="showcase-text">
        <span class="showcase-badge ${item.badgeClass || 'bg-green-glow'}">
          <i class="fa-solid fa-layer-group"></i> ${item.badge}
        </span>
        <h3>${item.title}</h3>
        <p>${item.desc}</p>
        <ul class="showcase-bullet-list">
          ${item.bullets.map(b => `<li><i class="fa-solid fa-circle-check"></i> ${b}</li>`).join('')}
        </ul>
      </div>
    </div>
  `).join('');
}

function renderPricingCMS(plans) {
  const container = document.getElementById('pricingGridContainer');
  if (!container || !plans || !plans.length) return;

  const cms = JSON.parse(localStorage.getItem('pos_landing_cms')) || {};
  const rates = cms.rates || {};
  const pkg = cms.packageRates || {
    card1: { setup: 9999, monthly: 150 },
    card2: { setup: 14999, monthly: 999 },
    card3: { setup: 7999, monthly: 499 }
  };

  container.innerHTML = plans.map((p, idx) => {
    let sPrice = p.setupPrice;
    let mPrice = p.monthlyPrice;

    if (p.id === 'pos_standalone' || idx === 0) {
      if (pkg.card1) { sPrice = pkg.card1.setup; mPrice = pkg.card1.monthly; }
    } else if (p.id === 'pos_ecommerce_combo' || idx === 1) {
      if (pkg.card2) { sPrice = pkg.card2.setup; mPrice = pkg.card2.monthly; }
    } else if (p.id === 'ecommerce_only' || idx === 2) {
      if (pkg.card3) { sPrice = pkg.card3.setup; mPrice = pkg.card3.monthly; }
    }

    return `
      <div class="pricing-card ${p.popular ? 'popular' : ''} ${p.comingSoon ? 'coming-soon-card' : ''}">
        ${p.popular ? '<div class="popular-badge">🔥 সেরা পছন্দ</div>' : ''}
        ${p.comingSoon ? '<div class="coming-soon-badge"><i class="fa-solid fa-clock"></i> শীঘ্রই আসছে</div>' : ''}
        
        <div class="plan-name">${p.name}</div>
        <div class="plan-desc">${p.desc}</div>
        
        <div class="setup-price-tag">
          <i class="fa-solid fa-coins"></i> এককালীন সেটআপ ফি: ৳${sPrice.toLocaleString()}
        </div>

        <div class="plan-price">
          ৳${mPrice.toLocaleString()} <span>/মাসিক মেইনটেন্যান্স</span>
        </div>

        <ul class="plan-features">
          ${p.features.map(f => `<li><i class="fa-solid fa-check"></i> ${f}</li>`).join('')}
        </ul>

        ${p.comingSoon ? `
          <button class="btn-plan btn-plan-warning" onclick="alert('এই প্যাকেজটি অতি শীঘ্রই লাইভ হতে যাচ্ছে! সার্ভিস প্যাকেজ কিনতে উপরের রেজিস্ট্রেশন বোতামে চাপুন।')">
            <i class="fa-solid fa-bell"></i> নোটিফিকেশন বুক করুন
          </button>
        ` : `
          <div style="display:flex; flex-direction:column; gap:0.65rem;">
            <button class="btn-plan btn-plan-primary openCheckoutModal" 
                    data-plan="${p.name}" data-price="${sPrice}" data-monthly="${mPrice}" data-mode="full">
              <i class="fa-solid fa-shield-check"></i> সার্ভিস প্যাকেজ অর্ডারিং করুন
            </button>
          </div>
        `}
      </div>
    `;
  }).join('');

  // Re-attach checkout modal event listeners
  document.querySelectorAll('.openCheckoutModal').forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = btn.getAttribute('data-plan');
      const price = btn.getAttribute('data-price');
      const mode = btn.getAttribute('data-mode');
      openCheckoutModalWithMode(plan, price, mode);
    });
  });
}

function openCheckoutModalWithMode(planName, price, mode) {
  const modal = document.getElementById('checkoutModal');
  const planInput = document.getElementById('selectedPlanName');
  const paymentSection = document.getElementById('paymentMethodSection');

  if (planInput) {
    planInput.value = `${planName || 'SmartPOS Combo'} (এক্সেস সেটআপ ফি: ৳${price || '১৪,৯৯৯'})`;
  }
  if (paymentSection) paymentSection.style.display = 'block';
  if (modal) modal.classList.add('active');
}

function initVideoModal() {
  const openVideoBtn = document.getElementById('openDemoVideoBtn');
  const videoModal = document.getElementById('videoDemoModal');
  const closeVideoBtn = document.getElementById('closeVideoDemoModal');

  if (openVideoBtn && videoModal) {
    openVideoBtn.addEventListener('click', () => videoModal.classList.add('active'));
  }
  if (closeVideoBtn && videoModal) {
    closeVideoBtn.addEventListener('click', () => videoModal.classList.remove('active'));
  }
}

function initFAQAccordion() {
  document.querySelectorAll('.faq-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      item.classList.toggle('active');
    });
  });
}

function initCheckoutForm() {
  const checkoutModal = document.getElementById('checkoutModal');
  const closeCheckoutModal = document.getElementById('closeCheckoutModal');
  const subscriptionForm = document.getElementById('subscriptionForm');

  const btnTrialMode = document.getElementById('typeTrial');
  const btnFullMode = document.getElementById('typeFull');

  const step1 = document.getElementById('onboardingStep1');
  const step2 = document.getElementById('onboardingStep2');
  const btnBack = document.getElementById('btnBackToStep1');
  const btnSubmit = document.getElementById('btnSubmitOnboarding');

  let currentOnboardingGateway = 'bkash';

  const getCMSSettings = () => {
    const cms = JSON.parse(localStorage.getItem('pos_landing_cms')) || {};
    return {
      bkash: cms.bkashNumber || '01700000000',
      nagad: cms.nagadNumber || '01800000000'
    };
  };

  const updatePortalGatewayUI = (gateway) => {
    currentOnboardingGateway = gateway;
    const cms = getCMSSettings();
    const isBkash = gateway === 'bkash';

    const bkashBtn = document.getElementById('portalBkashBtn');
    const nagadBtn = document.getElementById('portalNagadBtn');
    const instructionsCard = document.getElementById('portalPaymentInstructionsCard');
    const titleEl = document.getElementById('portalInstructionTitle');
    const subEl = document.getElementById('portalInstructionSub');
    const phoneEl = document.getElementById('portalInstructionPhoneNum');
    const listEl = document.getElementById('portalInstructionList');
    const trxInput = document.getElementById('portalSubTrxId');

    if (bkashBtn) {
      bkashBtn.style.border = isBkash ? '2px solid #e2136e' : '1px solid #cbd5e1';
      bkashBtn.style.boxShadow = isBkash ? '0 4px 15px rgba(226, 19, 110, 0.15)' : 'none';
      const bSpan = bkashBtn.querySelector('span');
      if (bSpan) bSpan.style.color = isBkash ? '#e2136e' : '#64748b';
    }

    if (nagadBtn) {
      nagadBtn.style.border = !isBkash ? '1.5px solid #f97316' : '1px solid #cbd5e1';
      nagadBtn.style.background = !isBkash ? '#fff8f0' : '#ffffff';
      nagadBtn.style.boxShadow = !isBkash ? '0 4px 15px rgba(249, 115, 22, 0.15)' : 'none';
      const nSpan = nagadBtn.querySelector('span');
      if (nSpan) nSpan.style.color = !isBkash ? '#f97316' : '#64748b';
    }

    if (instructionsCard) {
      instructionsCard.style.background = isBkash ? '#fff0f5' : '#fff8f0';
      instructionsCard.style.borderColor = isBkash ? '#fbcfe8' : '#fed7aa';
    }

    if (titleEl) {
      titleEl.textContent = isBkash ? ' বিকাশে পেমেন্ট করার নিয়ম' : ' নগদে পেমেন্ট করার নিয়ম';
      titleEl.style.color = isBkash ? '#e2136e' : '#f97316';
    }

    if (subEl) {
      subEl.textContent = isBkash ? 'bKash পার্সোনাল নম্বরে সেন্ড মানি (Send Money) করবেন' : 'নগদ পার্সোনাল নম্বরে সেন্ড মানি (Send Money) করবেন';
    }

    if (phoneEl) {
      phoneEl.textContent = isBkash ? cms.bkash : cms.nagad;
      phoneEl.style.color = isBkash ? '#e2136e' : '#f97316';
      phoneEl.style.borderColor = isBkash ? '#f472b6' : '#fdba74';
    }

    if (trxInput) {
      trxInput.style.borderColor = isBkash ? '#f472b6' : '#fdba74';
    }

    const priceText = document.getElementById('selectedPlanName')?.value || '১৪,৯৯৯ ৳';
    let extractPrice = '১৪,৯৯৯';
    const match = priceText.match(/৳([0-9,]+)/);
    if (match) extractPrice = match[1];

    if (listEl) {
      const gName = isBkash ? 'bKash' : 'Nagad';
      const gCode = isBkash ? '*247#' : '*167#';
      const phoneNum = isBkash ? cms.bkash : cms.nagad;
      listEl.innerHTML = `
        <li>১. <strong>${gName} অ্যাপ</strong> খুলুন অথবা <strong>${gCode}</strong> ডায়াল করুন।</li>
        <li>২. <strong>'Send Money'</strong> অপশনে চাপুন।</li>
        <li>
          ৩. নিচের ${gName} পার্সোনাল নম্বরটি কপি করে বসান:
          <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
            <div style="background: #ffffff; border: 1px solid ${isBkash ? '#f472b6' : '#fdba74'}; border-radius: 10px; padding: 4px 12px; font-weight: 700; font-family: monospace; font-size: 1.1rem; color: ${isBkash ? '#e2136e' : '#f97316'};" id="portalInstructionPhoneNum">
              ${phoneNum}
            </div>
            <button type="button" id="portalBtnCopyPhone" style="background: none; border: none; cursor: pointer; color: ${isBkash ? '#e2136e' : '#f97316'}; font-size: 1.1rem;" title="কপি করুন">
              <i class="fa-regular fa-copy"></i>
            </button>
          </div>
        </li>
        <li>৪. টাকার পরিমাণ লিখুন: <strong id="portalInstructionAmountText" style="font-weight: 700; color: #0f172a;">৳${extractPrice} ৳</strong></li>
        <li>৫. Reference বক্সে আপনার <strong>দোকানের নাম</strong> লিখুন।</li>
        <li>৬. <strong>${gName} PIN</strong> দিয়ে সেন্ড মানি সম্পন্ন করুন।</li>
        <li>৭. সম্পন্ন হওয়ার পরে, প্রাপ্ত <strong>ট্রানজ্যাকশন আইডি (TrxID)</strong> কপি করে নিচের বক্সে পেস্ট করুন।</li>
      `;
    }
  };

  document.getElementById('portalBkashBtn')?.addEventListener('click', () => updatePortalGatewayUI('bkash'));
  document.getElementById('portalNagadBtn')?.addEventListener('click', () => updatePortalGatewayUI('nagad'));

  document.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('#portalBtnCopyPhone');
    if (copyBtn) {
      const cms = getCMSSettings();
      const phone = currentOnboardingGateway === 'bkash' ? cms.bkash : cms.nagad;
      if (phone) {
        navigator.clipboard.writeText(phone);
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(() => copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>', 2000);
      }
    }
  });

  const switchMode = (isTrial) => {
    if (isTrial) {
      btnTrialMode?.classList.add('active');
      btnFullMode?.classList.remove('active');
      if (step2) step2.style.display = 'none';
      if (step1) step1.style.display = 'block';
      if (btnBack) btnBack.style.display = 'none';
      if (btnSubmit) btnSubmit.innerHTML = `<i class="fa-solid fa-check-circle"></i> ৭ দিনের ফ্রি ট্রায়াল শুরু করুন`;
    } else {
      btnFullMode?.classList.add('active');
      btnTrialMode?.classList.remove('active');
      if (step1) step1.style.display = 'block';
      if (step2) step2.style.display = 'none';
      if (btnBack) btnBack.style.display = 'none';
      if (btnSubmit) btnSubmit.innerHTML = `পরবর্তী: পেমেন্ট গেটওয়েতে যান <i class="fa-solid fa-arrow-right"></i>`;
    }
  };

  if (btnTrialMode && btnFullMode) {
    btnTrialMode.addEventListener('click', () => switchMode(true));
    btnFullMode.addEventListener('click', () => switchMode(false));
  }

  if (btnBack) {
    btnBack.addEventListener('click', () => {
      step2.style.display = 'none';
      step1.style.display = 'block';
      btnBack.style.display = 'none';
      btnSubmit.innerHTML = `পরবর্তী: পেমেন্ট গেটওয়েতে যান <i class="fa-solid fa-arrow-right"></i>`;
    });
  }

  if (closeCheckoutModal && checkoutModal) {
    closeCheckoutModal.addEventListener('click', () => checkoutModal.classList.remove('active'));
  }

  // Device Gallery Logo Picker listener
  const subLogoUploadBtn = document.getElementById('subLogoUploadBtn');
  const subLogoFileInput = document.getElementById('subLogoFileInput');
  const subLogoPreviewWrap = document.getElementById('subLogoPreviewWrap');
  const subLogoPreview = document.getElementById('subLogoPreview');
  const subLogoFileName = document.getElementById('subLogoFileName');
  const subLogoUrl = document.getElementById('subLogoUrl');

  if (subLogoUploadBtn && subLogoFileInput) {
    subLogoUploadBtn.addEventListener('click', () => subLogoFileInput.click());
    if (subLogoPreview) subLogoPreview.addEventListener('click', () => subLogoFileInput.click());

    subLogoFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        compressGalleryImage(file, 800, 0.8, (dataUrl) => {
          if (subLogoUrl) subLogoUrl.value = dataUrl;
          if (subLogoPreview) subLogoPreview.src = dataUrl;
          if (subLogoPreviewWrap) subLogoPreviewWrap.style.display = 'flex';
          if (subLogoFileName) subLogoFileName.innerText = file.name || 'লোগো যুক্ত হয়েছে';
        });
      }
    });
  }

  if (subscriptionForm) {
    subscriptionForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const isTrial = false;

      // If on Step 1, transition to Step 2 (Payment Gateway)
      if (step1 && step1.style.display !== 'none') {
        const storeName = document.getElementById('subStoreName').value.trim();
        const ownerName = document.getElementById('subOwnerName').value.trim();
        const phone = document.getElementById('subPhone').value.trim();
        const storeAddress = document.getElementById('subAddress').value.trim();

        if (!storeName || !ownerName || !phone || !storeAddress) {
          alert('অনুগ্রহ করে প্রয়োজনীয় সব তথ্য (দোকানের নাম, আপনার নাম, ফোন নম্বর, ঠিকানা) পূরণ করুন।');
          return;
        }

        if (step1) step1.style.display = 'none';
        if (step2) step2.style.display = 'block';
        if (btnBack) btnBack.style.display = 'block';
        if (btnSubmit) btnSubmit.innerHTML = `💳 এক্সেস সাবস্ক্রাইব ও প্যানেলে প্রবেশ করুন`;
        updatePortalGatewayUI(currentOnboardingGateway);
        return;
      }

      // Final Submission Processing
      const storeName = document.getElementById('subStoreName').value.trim();
      const ownerName = document.getElementById('subOwnerName').value.trim();
      const phone = document.getElementById('subPhone').value.trim();
      const email = document.getElementById('subEmail')?.value.trim() || '';
      const storeAddress = document.getElementById('subAddress')?.value.trim() || 'Dhaka, Bangladesh';
      const adminPin = document.getElementById('subAdminPin')?.value.trim() || '1234';
      const storeLogo = document.getElementById('subLogoUrl')?.value.trim() || '';
      const plan = document.getElementById('selectedPlanName').value;

      const trxId = document.getElementById('portalSubTrxId')?.value.trim() || '';
      const senderPhone = document.getElementById('portalSubSenderPhone')?.value.trim() || phone;

      if (!trxId || !senderPhone) {
        alert('অনুগ্রহ করে বিকাশ/নগদ পেমেন্টের TrxID এবং প্রেরক মোবাইল নম্বর দিন।');
        return;
      }

      const paymentMethod = currentOnboardingGateway === 'bkash' ? 'bKash Send Money' : 'Nagad Send Money';

      const now = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(now.getDate() + 30);

      // Generate unique store tenant ID
      const storeId = `store_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const storeProfile = {
        storeId,
        storeName,
        ownerName,
        phone,
        email,
        storeAddress,
        adminPin,
        storeLogo,
        plan,
        isTrial: false,
        isFreshSignup: true,
        trialExpiresAt: expiryDate.toISOString(),
        paymentMethod,
        trxId,
        senderPhone,
        status: 'Active Paid (Pending Verification)',
        createdAt: now.toISOString()
      };

      // Save subscription metadata & clear purged flag
      localStorage.removeItem('pos_merchants_purged');
      localStorage.setItem('pos_subscription', JSON.stringify(storeProfile));
      localStorage.setItem('pos_active_store_id', storeId);

      // Sync with pos_subscriptions array for Master Super Admin Panel
      const allSubs = JSON.parse(localStorage.getItem('pos_subscriptions')) || [];
      const existingIdx = allSubs.findIndex(s => s.storeId === storeId || (s.phone && s.phone === phone));
      if (existingIdx >= 0) allSubs[existingIdx] = storeProfile;
      else allSubs.unshift(storeProfile);
      localStorage.setItem('pos_subscriptions', JSON.stringify(allSubs));

      try {
        const bc = new BroadcastChannel('pos_subscriptions_channel');
        bc.postMessage({ type: 'new_subscriber', subscriber: storeProfile });
      } catch (err) {}

      // Initialize 100% FRESH isolated store instance in Firebase & LocalStorage
      if (window.POS_FIREBASE) {
        await window.POS_FIREBASE.initializeFreshStore(storeId, storeProfile);
      }

      alert(`🎉 অভিনন্দন ${ownerName}! আপনার '${storeName}'-এর জন্য সার্ভিস অনবোর্ডিং সাবস্ক্রিপশন তৈরি করা হয়েছে।\n\nTrxID: ${trxId}\nপেমেন্ট ভেরিফাই হলে সুপার এডমিন সম্পূর্ণ অনুমোদন দেবে।`);

      window.location.href = 'portal.html';
    });
  }
}

// Mobile Navigation Drawer Toggle
function initMobileNav() {
  const toggle = document.getElementById('mobileNavToggle');
  const icon = document.getElementById('mobileNavIcon');
  const drawer = document.getElementById('mobileNavDrawer');
  if (!toggle || !drawer) return;

  toggle.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('open');
    icon.className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
  });

  // Close drawer when a link is clicked
  drawer.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      drawer.classList.remove('open');
      icon.className = 'fa-solid fa-bars';
    });
  });
}

// Override initFAQAccordion with accordion behavior
function initFAQAccordion() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-q');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Close all
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

// Utility: Canvas image compression for device gallery photos of any size
function compressGalleryImage(file, maxDimension = 800, quality = 0.8, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      callback(dataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
