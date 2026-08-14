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
        "৭ দিনের ফ্রি ট্রায়াল অন্তর্ভুক্ত"
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

// Fetch Dynamic CMS Data from Firebase Firestore
async function initCMSData() {
  let cmsData = DEFAULT_CMS;

  if (window.POS_FIREBASE && window.POS_FIREBASE.db) {
    try {
      const doc = await window.POS_FIREBASE.db.collection('landing_cms').doc('content').get();
      if (doc.exists && doc.data()) {
        const cloudCMS = doc.data();
        cmsData = {
          hero: cloudCMS.hero || DEFAULT_CMS.hero,
          showcase: cloudCMS.showcase || DEFAULT_CMS.showcase,
          plans: cloudCMS.plans || DEFAULT_CMS.plans
        };
      }
    } catch (e) {
      console.warn('[CMS Engine] Using default content layout:', e);
    }
  }

  renderHeroCMS(cmsData.hero);
  renderShowcaseCMS(cmsData.showcase);
  renderPricingCMS(cmsData.plans);
}

function renderHeroCMS(hero) {
  if (!hero) return;
  const badgeEl = document.getElementById('heroBadge');
  const titleEl = document.getElementById('heroTitle');
  const descEl = document.getElementById('heroDesc');

  if (badgeEl && hero.badge) badgeEl.innerHTML = `<i class="fa-solid fa-sparkles"></i> ${hero.badge}`;
  if (titleEl && hero.title) titleEl.innerHTML = hero.title;
  if (descEl && hero.desc) descEl.textContent = hero.desc;
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

  container.innerHTML = plans.map(p => {
    return `
      <div class="pricing-card ${p.popular ? 'popular' : ''} ${p.comingSoon ? 'coming-soon-card' : ''}">
        ${p.popular ? '<div class="popular-badge">🔥 সেরা পছন্দ</div>' : ''}
        ${p.comingSoon ? '<div class="coming-soon-badge"><i class="fa-solid fa-clock"></i> শীঘ্রই আসছে</div>' : ''}
        
        <div class="plan-name">${p.name}</div>
        <div class="plan-desc">${p.desc}</div>
        
        <div class="setup-price-tag">
          <i class="fa-solid fa-coins"></i> এককালীন সেটআপ ফি: ৳${p.setupPrice.toLocaleString()}
        </div>

        <div class="plan-price">
          ৳${p.monthlyPrice.toLocaleString()} <span>/মাসিক মেইনটেন্যান্স</span>
        </div>

        <ul class="plan-features">
          ${p.features.map(f => `<li><i class="fa-solid fa-check"></i> ${f}</li>`).join('')}
        </ul>

        ${p.comingSoon ? `
          <button class="btn-plan btn-plan-warning" onclick="alert('এই প্যাকেজটি অতি শীঘ্রই লাইভ হতে যাচ্ছে! ৭ দিনের ফ্রি ট্রায়ালে POS ব্যবহার শুরু করতে উপরের ফ্রী ট্রায়াল বাটনে চাপুন।')">
            <i class="fa-solid fa-bell"></i> নোটিফিকেশন বুক করুন
          </button>
        ` : `
          <div style="display:flex; flex-direction:column; gap:0.65rem;">
            <button class="btn-plan btn-plan-primary openCheckoutModal" 
                    data-plan="${p.name}" data-price="${p.setupPrice}" data-monthly="${p.monthlyPrice}" data-mode="full">
              <i class="fa-solid fa-shield-check"></i> ফুল প্যাকেজ অর্ডারিং
            </button>
            <button class="btn-hero-secondary openCheckoutModal" 
                    style="justify-content:center; width:100%; border-radius:14px; font-size:0.95rem;"
                    data-plan="${p.name}" data-price="0" data-mode="trial">
              <i class="fa-solid fa-gift text-warning"></i> ৭ দিনের ফ্রি ট্রায়াল শুরু করুন
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
  const typeTrial = document.getElementById('typeTrial');
  const typeFull = document.getElementById('typeFull');
  const paymentSection = document.getElementById('paymentMethodSection');

  if (planInput) {
    if (mode === 'trial') {
      planInput.value = `${planName} (৭ দিনের ফ্রি ট্রায়াল - ৳০)`;
      if (typeTrial) typeTrial.classList.add('active');
      if (typeFull) typeFull.classList.remove('active');
      if (paymentSection) paymentSection.style.display = 'none';
    } else {
      planInput.value = `${planName} (সেটআপ ফি: ৳${price})`;
      if (typeFull) typeFull.classList.add('active');
      if (typeTrial) typeTrial.classList.remove('active');
      if (paymentSection) paymentSection.style.display = 'block';
    }
  }

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
  const paymentSection = document.getElementById('paymentMethodSection');

  if (btnTrialMode && btnFullMode) {
    btnTrialMode.addEventListener('click', () => {
      btnTrialMode.classList.add('active');
      btnFullMode.classList.remove('active');
      if (paymentSection) paymentSection.style.display = 'none';
    });

    btnFullMode.addEventListener('click', () => {
      btnFullMode.classList.add('active');
      btnTrialMode.classList.remove('active');
      if (paymentSection) paymentSection.style.display = 'block';
    });
  }

  if (closeCheckoutModal && checkoutModal) {
    closeCheckoutModal.addEventListener('click', () => checkoutModal.classList.remove('active'));
  }

  if (subscriptionForm) {
    subscriptionForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const storeName = document.getElementById('subStoreName').value.trim();
      const ownerName = document.getElementById('subOwnerName').value.trim();
      const phone = document.getElementById('subPhone').value.trim();
      const email = document.getElementById('subEmail')?.value.trim() || '';
      const storeAddress = document.getElementById('subAddress')?.value.trim() || 'Dhaka, Bangladesh';
      const adminPin = document.getElementById('subAdminPin')?.value.trim() || '1234';
      const storeLogo = document.getElementById('subLogoUrl')?.value.trim() || '';
      const plan = document.getElementById('selectedPlanName').value;
      const isTrial = btnTrialMode?.classList.contains('active');
      const paymentMethod = isTrial ? '7-Day Free Trial' : document.getElementById('subPaymentMethod').value;

      const now = new Date();
      const trialExpiry = new Date();
      trialExpiry.setDate(now.getDate() + 7);

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
        isTrial,
        trialExpiresAt: trialExpiry.toISOString(),
        paymentMethod,
        status: isTrial ? 'Trial Active' : 'Pending Approval',
        createdAt: now.toISOString()
      };

      // Save subscription metadata
      localStorage.setItem('pos_subscription', JSON.stringify(storeProfile));

      // Initialize 100% FRESH isolated store instance in Firebase & LocalStorage
      if (window.POS_FIREBASE) {
        await window.POS_FIREBASE.initializeFreshStore(storeId, storeProfile);
      }

      if (isTrial) {
        alert(`অভিনন্দন ${ownerName}! আপনার ${storeName}-এর জন্য সম্পূর্ণ ফ্রেশ ৭ দিনের ফ্রী ট্রায়াল প্যানেল তৈরি করা হয়েছে।`);
      } else {
        alert(`ধন্যবাদ ${ownerName}! আপনার ${storeName}-এর জন্য ফ্রেশ প্যানেল তৈরি করা হয়েছে।`);
      }

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
