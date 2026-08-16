// SmartPOS - Merchant Subscription & Payment Engine
// 100% exact match to user's bKash & Nagad screenshot buttons and "💳 এখনই সাবস্ক্রাইব করুন" action button

(function () {
  let selectedMonths = 1;
  let selectedGateway = 'bkash'; // 'bkash' or 'nagad'
  let baseProductPrice = 150;
  let discountValue = 0;
  let calculatedAmount = 150;
  let receiptBase64 = '';

  // Load Google Font 'Hind Siliguri' for upright Bengali typography
  if (!document.getElementById('hindSiliguriFont')) {
    const link = document.createElement('link');
    link.id = 'hindSiliguriFont';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap';
    document.head.appendChild(link);
  }

  // Fetch gateway numbers & push message from Super Admin CMS
  function getCMSSettings() {
    const cms = JSON.parse(localStorage.getItem('pos_landing_cms')) || {};
    return {
      bkash: cms.bkashNumber || '01700000000',
      nagad: cms.nagadNumber || '01800000000',
      rocket: cms.rocketNumber || '01900000000-7',
      bank: cms.bankDetails || 'Dutch Bangla Bank - A/C: 123456789 - Branch: Gulshan',
      rates: cms.rates || { rate1m: 150, rate6m: 810, rate12m: 1440, rateAccess: 14999 },
      pushMsg: cms.pushNotificationMsg || 'আপনার স্টোরের সাবস্ক্রিপশনের মেয়াদের সময় প্রায় শেষ! নিরবচ্ছিন্ন সেবা পেতে এখনই রিনিউ করুন।'
    };
  }

  // Convert English numbers to Bengali numbers
  function toBnNum(num) {
    const bnNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/[0-9]/g, d => bnNums[d]);
  }

  // Calculate detailed remaining time: Days + Minutes
  function formatRemainingTime(expiryDateIso) {
    const expiry = new Date(expiryDateIso);
    const now = new Date();
    const diffMs = expiry - now;

    if (diffMs <= 0) return { expired: true, text: 'মেয়াদ শেষ হয়ে গেছে!', days: 0, months: 0, minutes: 0, badgeText: 'মেয়াদ শেষ!' };

    const diffMinsTotal = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(diffMinsTotal / (60 * 24));
    const mins = diffMinsTotal % 60;
    const months = Math.floor(days / 30);

    if (days >= 30) {
      const remDays = days % 30;
      return {
        expired: false,
        days,
        months,
        minutes: mins,
        text: `${toBnNum(months)} মাস ${remDays > 0 ? toBnNum(remDays) + ' দিন' : ''}`.trim(),
        badgeText: `${toBnNum(months)} মাস বাকি`
      };
    } else {
      return {
        expired: false,
        days,
        months: 0,
        minutes: mins,
        text: `${toBnNum(days)} দিন ${toBnNum(mins)} মিনিট`,
        badgeText: `${toBnNum(days)} দিন বাকি`
      };
    }
  }

  // Inject Modal HTML into DOM if not present
  function injectSubscriptionModal() {
    if (document.getElementById('subscriptionRenewModal')) return;

    const cms = getCMSSettings();
    const r = cms.rates;

    const modalHTML = `
      <div class="modal notranslate" id="subscriptionRenewModal" translate="no" style="font-family: 'Hind Siliguri', 'Inter', sans-serif;">
        <div class="modal-content modal-md" style="border-radius: 24px; border: 1px solid var(--border-color); background: var(--bg-card); max-width: 600px; max-height: 94vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.35);">
          
          <div class="modal-header" style="border-bottom: 1px solid var(--border-color); padding-bottom: 0.85rem;">
            <h3 style="color: #a855f7; display: flex; align-items: center; gap: 8px; font-size: 1.2rem; font-family: 'Hind Siliguri', sans-serif; font-style: normal;">
              <i class="fa-solid fa-crown"></i> সাবস্ক্রিপশন প্যাকেজ ও মেয়াদ রিনিউ হাব
            </h3>
            <button type="button" class="close-modal close-sub-modal"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="modal-body" style="padding: 1rem 0;">
            
            <!-- 1. TOP ACTIVE SUBSCRIPTION PROFILE STATUS CARD -->
            <div style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(59, 130, 246, 0.08)); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 18px; padding: 1rem; margin-bottom: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                <span class="badge" style="background: #a855f7; color: #fff; padding: 0.35rem 0.85rem; border-radius: 20px; font-weight: 700; font-style: normal;" id="subModalPlanBadge">
                  <i class="fa-solid fa-bolt"></i> SmartPOS Standard
                </span>
                <span class="badge" style="background: rgba(16,185,129,0.2); color: #10b981; border: 1px solid #10b981; padding: 0.35rem 0.75rem; border-radius: 20px; font-weight: 700; font-style: normal;" id="subModalStatusBadge">
                  🟢 সক্রিয়
                </span>
              </div>
              
              <h4 id="subModalStoreName" style="font-weight: 700; color: var(--text-color); font-size: 1.15rem; margin-bottom: 0.4rem; font-style: normal;">-</h4>
              
              <!-- EXACT REMAINING TIME COUNTER (DAYS + MINS IN BENGALI) -->
              <div style="background: var(--bg-body); border: 1px solid var(--border-color); border-radius: 12px; padding: 0.75rem; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <small style="color: #64748b; font-weight: 600; display: block; font-family: 'Hind Siliguri', sans-serif; font-style: normal;">অবশিষ্ট মেয়াদের সময় (Remaining Time):</small>
                  <h3 id="subModalExactRemainingText" style="color: #10b981; font-weight: 700; font-size: 1.2rem; margin: 2px 0 0; font-family: 'Hind Siliguri', sans-serif; font-style: normal;">-</h3>
                </div>
                <div style="font-size: 1.6rem; color: #10b981;"><i class="fa-solid fa-hourglass-half"></i></div>
              </div>

              <!-- LAST SUBSCRIPTION DETAILS -->
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 0.88rem; color: var(--text-color); font-family: 'Hind Siliguri', sans-serif; font-style: normal;">
                <div><i class="fa-regular fa-calendar-check" style="color:#a855f7;"></i> শেষ রিনিউ: <strong id="subModalLastDate">-</strong></div>
                <div><i class="fa-solid fa-box-archive" style="color:#a855f7;"></i> শেষ প্যাকেজ: <strong id="subModalLastPackage">-</strong></div>
              </div>
            </div>

            <!-- 2. SUBSCRIPTION DURATION OPTIONS (1m = ৳150, 6m = 10% off ৳810, 12m = 20% off ৳1440) -->
            <div style="margin-bottom: 1.25rem;">
              <label style="font-weight: 700; display: block; margin-bottom: 0.6rem; color: var(--text-color); font-size: 0.95rem; font-family: 'Hind Siliguri', sans-serif; font-style: normal;">
                <i class="fa-solid fa-gem" style="color:#a855f7;"></i> মেয়াদের প্যাকেজ নির্বাচন করুন:
              </label>
              
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem;">
                <!-- 1 MONTH -->
                <div class="sub-duration-card active" data-months="1" style="border: 2px solid #a855f7; background: rgba(168, 85, 247, 0.12); border-radius: 16px; padding: 0.75rem 0.5rem; text-align: center; cursor: pointer; transition: all 0.2s;">
                  <strong style="display: block; font-size: 0.95rem; color: var(--text-color); font-family: 'Hind Siliguri', sans-serif; font-style: normal;">১ মাস</strong>
                  <h4 style="color: #a855f7; font-weight: 700; margin: 4px 0; font-style: normal;">৳${toBnNum(r.rate1m)}</h4>
                  <small style="color: #64748b; font-size: 0.78rem; font-family: 'Hind Siliguri', sans-serif; font-style: normal;">৳${toBnNum(r.rate1m)} / মাস</small>
                </div>

                <!-- 6 MONTHS (10% OFF) -->
                <div class="sub-duration-card" data-months="6" style="border: 1px solid var(--border-color); background: var(--bg-card); border-radius: 16px; padding: 0.75rem 0.5rem; text-align: center; cursor: pointer; transition: all 0.2s; position: relative;">
                  <span style="position: absolute; top: -10px; right: 4px; background: #10b981; color: #fff; font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 10px; font-family: 'Hind Siliguri', sans-serif; font-style: normal;">১০% ছাড়</span>
                  <strong style="display: block; font-size: 0.95rem; color: var(--text-color); font-family: 'Hind Siliguri', sans-serif; font-style: normal;">৬ মাস</strong>
                  <h4 style="color: #10b981; font-weight: 700; margin: 4px 0; font-style: normal;">৳${toBnNum(r.rate6m)}</h4>
                  <small style="color: #64748b; font-size: 0.78rem; font-family: 'Hind Siliguri', sans-serif; font-style: normal;"><del>৳${toBnNum(r.rate1m * 6)}</del></small>
                </div>

                <!-- 12 MONTHS (20% OFF) -->
                <div class="sub-duration-card" data-months="12" style="border: 1px solid var(--border-color); background: var(--bg-card); border-radius: 16px; padding: 0.75rem 0.5rem; text-align: center; cursor: pointer; transition: all 0.2s; position: relative;">
                  <span style="position: absolute; top: -10px; right: 4px; background: #e11d48; color: #fff; font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 10px; font-family: 'Hind Siliguri', sans-serif; font-style: normal;">২০% ছাড়</span>
                  <strong style="display: block; font-size: 0.95rem; color: var(--text-color); font-family: 'Hind Siliguri', sans-serif; font-style: normal;">১২ মাস (১ বছর)</strong>
                  <h4 style="color: #e11d48; font-weight: 700; margin: 4px 0; font-style: normal;">৳${toBnNum(r.rate12m)}</h4>
                  <small style="color: #64748b; font-size: 0.78rem; font-family: 'Hind Siliguri', sans-serif; font-style: normal;"><del>৳${toBnNum(r.rate1m * 12)}</del></small>
                </div>
              </div>
            </div>

            <!-- 3. PAYMENT GATEWAY SELECTION (bKash, Nagad, Rocket, Bank) -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; margin-bottom: 1.25rem;">
              <!-- bKash -->
              <div id="tabBkashBtn" class="gateway-pill active" style="border: 2px solid #e2136e; background: #ffffff; border-radius: 14px; padding: 0.6rem 0.3rem; text-align: center; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 75px;">
                <span style="font-weight: 800; font-style: italic; color: #e2136e; font-size: 1.05rem;">bKash</span>
              </div>

              <!-- Nagad -->
              <div id="tabNagadBtn" class="gateway-pill" style="border: 1px solid #cbd5e1; background: #ffffff; border-radius: 14px; padding: 0.6rem 0.3rem; text-align: center; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 75px;">
                <span style="font-weight: 800; font-style: italic; color: #f97316; font-size: 1.05rem;">Nagad</span>
              </div>

              <!-- Rocket -->
              <div id="tabRocketBtn" class="gateway-pill" style="border: 1px solid #cbd5e1; background: #ffffff; border-radius: 14px; padding: 0.6rem 0.3rem; text-align: center; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 75px;">
                <span style="font-weight: 800; font-style: italic; color: #8b5cf6; font-size: 1.05rem;">Rocket</span>
              </div>

              <!-- Bank -->
              <div id="tabBankBtn" class="gateway-pill" style="border: 1px solid #cbd5e1; background: #ffffff; border-radius: 14px; padding: 0.6rem 0.3rem; text-align: center; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 75px;">
                <span style="font-weight: 800; font-style: normal; color: #10b981; font-size: 0.95rem;"><i class="fa-solid fa-building-columns"></i> Bank</span>
              </div>
            </div>

            <!-- 4. INVOICE SUMMARY BILL CARD -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 1.1rem; margin-bottom: 1.25rem; color: #1e293b; font-family: 'Hind Siliguri', sans-serif; font-style: normal;">
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700; font-style: normal; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 0.75rem;">
                <span>PRODUCT-NAME</span>
                <span style="margin-left: auto; margin-right: 2rem;">QTT</span>
                <span>PRICE</span>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 0.95rem; font-weight: 700; font-style: normal; margin-bottom: 0.75rem;">
                <span id="summaryPkgName">SmartPOS Standard (১ মাস)</span>
                <span style="margin-left: auto; margin-right: 2.2rem;">১</span>
                <span id="summaryBasePrice">১৫০ ৳</span>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 0.92rem; font-weight: 700; font-style: normal; margin-bottom: 0.5rem; color: #1e293b;">
                <span>Total product price:</span>
                <span id="summaryProductTotal">১৫০ ৳</span>
              </div>

              <div id="summaryDiscountRow" style="display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; font-weight: 700; font-style: normal; margin-bottom: 0.75rem;">
                <span style="background: #d1fae5; color: #059669; padding: 2px 8px; border-radius: 6px;">ডিসকাউন্ট:</span>
                <span id="summaryDiscountVal" style="color: #059669;">- ০ ৳</span>
              </div>

              <div style="border-top: 1px dashed #cbd5e1; padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                <strong style="font-size: 1.15rem; font-style: normal; font-weight: 700; color: #0f172a;">সর্বমোট বিল</strong>
                <strong id="summaryGrandTotal" style="font-size: 1.35rem; font-style: normal; font-weight: 700; color: #0f172a;">১৫০ ৳</strong>
              </div>
            </div>

            <!-- 5. INSTRUCTION & TRANSACTION ENTRY CARD -->
            <form id="subRenewalForm">
              <div id="paymentInstructionsCard" translate="no" class="notranslate" style="background: #fff0f5; border: 1px solid #fbcfe8; border-radius: 18px; padding: 1.1rem; margin-bottom: 1.25rem; font-family: 'Hind Siliguri', sans-serif; font-style: normal;">
                <h4 id="instructionTitle" style="color: #e2136e; font-weight: 700; font-style: normal; font-size: 1.08rem; margin-bottom: 0.3rem;">
                   বিকাশে পেমেন্ট করার নিয়ম.
                </h4>
                <p id="instructionSub" style="color: #475569; font-size: 0.88rem; font-style: normal; margin-bottom: 0.85rem;">
                  বিকাশ পার্সোনাল নাম্বার অবশ্যই সেন্ড মানি করবেন
                </p>

                <ol id="instructionList" translate="no" class="notranslate" style="padding-left: 1.2rem; font-size: 0.92rem; font-style: normal; color: #334155; margin-bottom: 1.1rem; line-height: 1.85;">
                  <!-- Rendered dynamically -->
                </ol>

                <div style="margin-bottom: 0.85rem;">
                  <label id="lblSubTrxId" style="font-weight: 700; font-style: normal; color: #0f172a; font-size: 0.92rem; display: block; margin-bottom: 0.4rem;">
                    ট্রানজ্যাকশন আইডি (TrxID):
                  </label>
                  <input type="text" id="subTrxId" class="form-control" placeholder="ENTER TRANSACTION ID" style="border-radius: 12px; border: 1px solid #f472b6; padding: 0.75rem 1rem; font-weight: 700; font-style: normal; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 2px; width: 100%; background: #ffffff; color: #0f172a;" required>
                </div>

                <div style="margin-bottom: 0.85rem;">
                  <label id="lblSubSenderPhone" style="font-weight: 700; font-style: normal; color: #0f172a; font-size: 0.92rem; display: block; margin-bottom: 0.4rem;">
                    প্রেরক বিকাশ নম্বর:
                  </label>
                  <input type="text" id="subSenderPhone" class="form-control" placeholder="যেমন: 017XXXXXXXX" style="border-radius: 12px; border: 1px solid #cbd5e1; padding: 0.7rem 1rem; font-weight: 700; font-style: normal; font-size: 0.95rem; width: 100%; background: #ffffff; color: #0f172a;" required>
                </div>

                <small style="color: #64748b; font-style: normal; font-size: 0.8rem; display: block;">
                  * পেমেন্ট সাবমিট করার সাথে সাথেই আপনার সাবস্ক্রিপশন অটোমেটিক সক্রিয় হয়ে যাবে।
                </small>
              </div>

              <!-- 6. SUBMIT ACTION BUTTON -->
              <button type="submit" class="btn btn-primary btn-block" style="padding: 0.95rem; border-radius: 14px; font-weight: 700; font-size: 1.15rem; font-style: normal; background: #4f46e5; border: none; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; color: #fff; box-shadow: 0 8px 25px rgba(79, 70, 229, 0.4); cursor: pointer; font-family: 'Hind Siliguri', sans-serif;">
                💳 এখনই সাবস্ক্রাইব করুন (Subscribe Now)
              </button>
            </form>

          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    bindSubscriptionModalEvents();
  }

  function calculateSubscriptionPrice(months) {
    months = parseInt(months) || 1;
    selectedMonths = months;

    const cms = getCMSSettings();
    const r = cms.rates;

    if (months === 1) {
      baseProductPrice = r.rate1m;
      discountValue = 0;
      calculatedAmount = r.rate1m;
    } else if (months === 6) {
      baseProductPrice = r.rate1m * 6;
      calculatedAmount = r.rate6m;
      discountValue = baseProductPrice - calculatedAmount;
    } else if (months === 12) {
      baseProductPrice = r.rate1m * 12;
      calculatedAmount = r.rate12m;
      discountValue = baseProductPrice - calculatedAmount;
    } else {
      baseProductPrice = months * r.rate1m;
      discountValue = Math.round(baseProductPrice * 0.1);
      calculatedAmount = baseProductPrice - discountValue;
    }

    const pkgNameEl = document.getElementById('summaryPkgName');
    const basePriceEl = document.getElementById('summaryBasePrice');
    const productTotalEl = document.getElementById('summaryProductTotal');
    const discountValEl = document.getElementById('summaryDiscountVal');
    const grandTotalEl = document.getElementById('summaryGrandTotal');
    const instructionAmountEl = document.getElementById('instructionAmountText');

    if (pkgNameEl) pkgNameEl.textContent = `SmartPOS Standard (${toBnNum(months)} মাস)`;
    if (basePriceEl) basePriceEl.textContent = `${toBnNum(baseProductPrice)} ৳`;
    if (productTotalEl) productTotalEl.textContent = `${toBnNum(baseProductPrice)} ৳`;
    if (discountValEl) discountValEl.textContent = `- ${toBnNum(discountValue)} ৳`;
    if (grandTotalEl) grandTotalEl.textContent = `${toBnNum(calculatedAmount)} ৳`;
    if (instructionAmountEl) instructionAmountEl.textContent = `${toBnNum(calculatedAmount)} ৳`;
  }

  function updatePaymentGatewayUI(gateway) {
    selectedGateway = gateway;
    const cms = getCMSSettings();

    const bkashBtn = document.getElementById('tabBkashBtn');
    const nagadBtn = document.getElementById('tabNagadBtn');
    const rocketBtn = document.getElementById('tabRocketBtn');
    const bankBtn = document.getElementById('tabBankBtn');

    const instructionsCard = document.getElementById('paymentInstructionsCard');
    const titleEl = document.getElementById('instructionTitle');
    const subEl = document.getElementById('instructionSub');
    const listEl = document.getElementById('instructionList');

    const gatewayColors = {
      bkash: { main: '#e2136e', bg: '#fff0f5', border: '#fbcfe8' },
      nagad: { main: '#f97316', bg: '#fff8f0', border: '#fed7aa' },
      rocket: { main: '#8b5cf6', bg: '#f3e8ff', border: '#ddd6fe' },
      bank: { main: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' }
    };

    const activeColor = gatewayColors[gateway] || gatewayColors.bkash;

    [
      { btn: bkashBtn, name: 'bkash', color: '#e2136e' },
      { btn: nagadBtn, name: 'nagad', color: '#f97316' },
      { btn: rocketBtn, name: 'rocket', color: '#8b5cf6' },
      { btn: bankBtn, name: 'bank', color: '#10b981' }
    ].forEach(item => {
      if (!item.btn) return;
      const isActive = gateway === item.name;
      item.btn.style.border = isActive ? `2px solid ${item.color}` : '1px solid #cbd5e1';
      item.btn.style.boxShadow = isActive ? `0 4px 15px ${item.color}25` : 'none';
      const span = item.btn.querySelector('span');
      if (span) span.style.color = isActive ? item.color : '#64748b';
    });

    if (instructionsCard) {
      instructionsCard.style.background = activeColor.bg;
      instructionsCard.style.borderColor = activeColor.border;
    }

    if (titleEl) {
      titleEl.textContent = gateway === 'bkash' ? ' বিকাশে পেমেন্ট করার নিয়ম' :
                            gateway === 'nagad' ? ' নগদে পেমেন্ট করার নিয়ম' :
                            gateway === 'rocket' ? ' রকেটে পেমেন্ট করার নিয়ম' : ' ব্যাংক একাউন্টে ফান্ড ট্রান্সফার করার নিয়ম';
      titleEl.style.color = activeColor.main;
    }

    if (subEl) {
      subEl.textContent = gateway === 'bkash' ? 'bKash পার্সোনাল নম্বরে সেন্ড মানি (Send Money) করবেন' :
                          gateway === 'nagad' ? 'নগদ পার্সোনাল নম্বরে সেন্ড মানি (Send Money) করবেন' :
                          gateway === 'rocket' ? 'রকেট পার্সোনাল নম্বরে সেন্ড মানি (Send Money) করবেন' : 'নিচের ব্যাংক একাউন্টে ফান্ড ট্রান্সফার / জমা প্রদান করুন';
    }

    const lblTrx = document.getElementById('lblSubTrxId');
    const inputTrx = document.getElementById('subTrxId');
    const lblPhone = document.getElementById('lblSubSenderPhone');
    const inputPhone = document.getElementById('subSenderPhone');

    if (lblTrx) {
      lblTrx.textContent = gateway === 'bank' ? 'ব্যাংক রেফারেন্স নম্বর (Bank Ref No.):' : 'ট্রানজ্যাকশন আইডি (TrxID):';
    }
    if (inputTrx) {
      inputTrx.placeholder = gateway === 'bank' ? 'ENTER BANK REF NO' : 'ENTER TRANSACTION ID';
    }

    if (lblPhone) {
      lblPhone.textContent = gateway === 'bkash' ? 'প্রেরক বিকাশ নম্বর:' :
                             gateway === 'nagad' ? 'প্রেরক নগদ নম্বর:' :
                             gateway === 'rocket' ? 'প্রেরক রকেট নম্বর:' : 'প্রেরক ব্যাংক একাউন্টের নাম / নম্বর:';
    }
    if (inputPhone) {
      inputPhone.placeholder = gateway === 'bkash' ? 'যেমন: 017XXXXXXXX' :
                               gateway === 'nagad' ? 'যেমন: 018XXXXXXXX' :
                               gateway === 'rocket' ? 'যেমন: 019XXXXXXXX-7' : 'যেমন: 1234567890 / MD RAHIM';
    }

    if (listEl) {
      let destInfo = cms.bkash;
      if (gateway === 'nagad') destInfo = cms.nagad;
      else if (gateway === 'rocket') destInfo = cms.rocket;
      else if (gateway === 'bank') destInfo = cms.bank;

      if (gateway === 'bank') {
        listEl.innerHTML = `
          <li>১. আপনার <strong>ব্যাংক মোবাইল অ্যাপ</strong> (CellFin, Citytouch, EBL, ইত্যাদি) অথবা ব্রাঞ্চে যান।</li>
          <li>২. <strong>'Fund Transfer'</strong> বা <strong>'NPSB / BEFTN'</strong> অপশন নির্বাচন করুন।</li>
          <li>
            ৩. নিচের ব্যাংক একাউন্ট নম্বর ও শাখা ডিটেইলস কপি করুন:
            <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
              <div style="background: #ffffff; border: 1px solid ${activeColor.main}; border-radius: 10px; padding: 6px 12px; font-weight: 700; font-family: monospace; font-size: 0.95rem; color: ${activeColor.main};" id="instructionPhoneNum">
                ${destInfo}
              </div>
              <button type="button" id="btnCopyPhone" style="background: none; border: none; cursor: pointer; color: ${activeColor.main}; font-size: 1.2rem;" title="কপি করুন">
                <i class="fa-regular fa-copy"></i>
              </button>
            </div>
          </li>
          <li>৪. টাকার পরিমাণ লিখুন: <strong id="instructionAmountText" style="font-weight: 700; color: #0f172a;">${toBnNum(calculatedAmount)} ৳</strong></li>
          <li>৫. Note / Remarks বক্সে আপনার <strong>দোকানের নাম</strong> লিখুন।</li>
          <li>৬. ট্রান্সফার সম্পন্ন হওয়ার পর প্রাপ্ত <strong>ব্যাংক রেফারেন্স নম্বর (Bank Ref No.)</strong> কপি করে নিচের বক্সে পেস্ট করুন।</li>
        `;
      } else {
        const gName = gateway === 'bkash' ? 'bKash' : (gateway === 'nagad' ? 'Nagad' : 'Rocket');
        const gCode = gateway === 'bkash' ? '*247#' : (gateway === 'nagad' ? '*167#' : '*322#');
        listEl.innerHTML = `
          <li>১. <strong>${gName} অ্যাপ</strong> খুলুন অথবা <strong>${gCode}</strong> ডায়াল করুন।</li>
          <li>২. <strong>'Send Money'</strong> অপশনে চাপুন।</li>
          <li>
            ৩. নিচের ${gName} পার্সোনাল নম্বরটি কপি করে বসান:
            <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
              <div style="background: #ffffff; border: 1px solid ${activeColor.main}; border-radius: 10px; padding: 4px 12px; font-weight: 700; font-family: monospace; font-size: 1.05rem; color: ${activeColor.main};" id="instructionPhoneNum">
                ${destInfo}
              </div>
              <button type="button" id="btnCopyPhone" style="background: none; border: none; cursor: pointer; color: ${activeColor.main}; font-size: 1.2rem;" title="কপি করুন">
                <i class="fa-regular fa-copy"></i>
              </button>
            </div>
          </li>
          <li>৪. টাকার পরিমাণ লিখুন: <strong id="instructionAmountText" style="font-weight: 700; color: #0f172a;">${toBnNum(calculatedAmount)} ৳</strong></li>
          <li>৫. Reference বক্সে আপনার <strong>দোকানের নাম</strong> লিখুন।</li>
          <li>৬. ${gName} PIN দিয়ে সেন্ড মানি সম্পন্ন করার পর প্রাপ্ত <strong>ট্রানজ্যাকশন আইডি (TrxID)</strong> কপি করে নিচের বক্সে পেস্ট করুন।</li>
        `;
      }
    }

    calculateSubscriptionPrice(selectedMonths);
  }

  function loadSubscriptionModalState() {
    const settings = JSON.parse(localStorage.getItem('pos_settings')) || {};
    const subscription = JSON.parse(localStorage.getItem('pos_subscription')) || {};

    const storeName = settings.storeName || subscription.storeName || 'আমার শপ';
    const planName = subscription.plan || 'SmartPOS Standard';
    const isTrial = subscription.isTrial !== false;

    const storeNameEl = document.getElementById('subModalStoreName');
    const planBadgeEl = document.getElementById('subModalPlanBadge');
    const statusBadgeEl = document.getElementById('subModalStatusBadge');
    const exactRemEl = document.getElementById('subModalExactRemainingText');
    const lastDateEl = document.getElementById('subModalLastDate');
    const lastPkgEl = document.getElementById('subModalLastPackage');

    if (storeNameEl) storeNameEl.textContent = storeName;
    if (planBadgeEl) planBadgeEl.innerHTML = `<i class="fa-solid fa-bolt"></i> ${planName}`;
    if (statusBadgeEl) {
      statusBadgeEl.textContent = isTrial ? '🟡 7-Day Free Trial' : '🟢 Active Paid';
      statusBadgeEl.style.background = isTrial ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)';
      statusBadgeEl.style.color = isTrial ? '#f59e0b' : '#10b981';
      statusBadgeEl.style.borderColor = isTrial ? '#f59e0b' : '#10b981';
    }

    const expiryIso = subscription.trialExpiresAt || new Date(Date.now() + 7 * 86400000).toISOString();
    const timeInfo = formatRemainingTime(expiryIso);

    if (exactRemEl) {
      exactRemEl.textContent = timeInfo.text;
      exactRemEl.style.color = timeInfo.expired || timeInfo.days <= 7 ? '#ef4444' : '#10b981';
    }

    const lastSubDate = subscription.submittedAt ? new Date(subscription.submittedAt).toLocaleDateString('bn-BD') : 'আজকে';
    const lastPkgName = subscription.requestedMonths ? `${toBnNum(subscription.requestedMonths)} মাস` : '৭ দিনের ফ্রি ট্রায়াল';

    if (lastDateEl) lastDateEl.textContent = lastSubDate;
    if (lastPkgEl) lastPkgEl.textContent = lastPkgName;

    applyGatewayVisibility();
  }

  function applyGatewayVisibility() {
    const cms = getCMSSettings();
    const gw = cms.gateways || { bkash: true, nagad: true, rocket: false, bank: false };

    const bkashBtn = document.getElementById('tabBkashBtn');
    const nagadBtn = document.getElementById('tabNagadBtn');
    const rocketBtn = document.getElementById('tabRocketBtn');
    const bankBtn = document.getElementById('tabBankBtn');

    if (bkashBtn) bkashBtn.style.display = gw.bkash !== false ? 'flex' : 'none';
    if (nagadBtn) nagadBtn.style.display = gw.nagad !== false ? 'flex' : 'none';
    if (rocketBtn) rocketBtn.style.display = gw.rocket === true ? 'flex' : 'none';
    if (bankBtn) bankBtn.style.display = gw.bank === true ? 'flex' : 'none';

    if ((selectedGateway === 'rocket' && !gw.rocket) || (selectedGateway === 'bank' && !gw.bank) || (selectedGateway === 'nagad' && gw.nagad === false) || (selectedGateway === 'bkash' && gw.bkash === false)) {
      if (gw.bkash !== false) selectedGateway = 'bkash';
      else if (gw.nagad !== false) selectedGateway = 'nagad';
      else if (gw.rocket === true) selectedGateway = 'rocket';
      else if (gw.bank === true) selectedGateway = 'bank';
    }

    updatePaymentGatewayUI(selectedGateway);
  }

  function bindSubscriptionModalEvents() {
    const modal = document.getElementById('subscriptionRenewModal');

    // Close modal
    document.querySelectorAll('.close-sub-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        if (modal) modal.classList.remove('active');
      });
    });

    // Duration cards selection (1m, 5m, 12m)
    document.querySelectorAll('.sub-duration-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.sub-duration-card').forEach(c => {
          c.classList.remove('active');
          c.style.border = '1px solid var(--border-color)';
          c.style.background = 'var(--bg-card)';
        });

        card.classList.add('active');
        const m = parseInt(card.dataset.months) || 1;
        card.style.border = '2px solid #a855f7';
        card.style.background = 'rgba(168, 85, 247, 0.12)';

        calculateSubscriptionPrice(m);
      });
    });

    // Payment gateway tabs
    const bkashBtn = document.getElementById('tabBkashBtn');
    const nagadBtn = document.getElementById('tabNagadBtn');
    const rocketBtn = document.getElementById('tabRocketBtn');
    const bankBtn = document.getElementById('tabBankBtn');

    if (bkashBtn) bkashBtn.addEventListener('click', () => updatePaymentGatewayUI('bkash'));
    if (nagadBtn) nagadBtn.addEventListener('click', () => updatePaymentGatewayUI('nagad'));
    if (rocketBtn) rocketBtn.addEventListener('click', () => updatePaymentGatewayUI('rocket'));
    if (bankBtn) bankBtn.addEventListener('click', () => updatePaymentGatewayUI('bank'));

    // Copy Phone button (delegated event)
    document.addEventListener('click', (e) => {
      const copyBtn = e.target.closest('#btnCopyPhone');
      if (copyBtn) {
        const cms = getCMSSettings();
        let textToCopy = cms.bkash;
        if (selectedGateway === 'nagad') textToCopy = cms.nagad;
        else if (selectedGateway === 'rocket') textToCopy = cms.rocket;
        else if (selectedGateway === 'bank') textToCopy = cms.bank;

        if (textToCopy) {
          navigator.clipboard.writeText(textToCopy);
          copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
          setTimeout(() => copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>', 2000);
        }
      }
    });

    // Receipt Pic file upload
    const btnUpload = document.getElementById('btnUploadReceiptPic');
    const fileInput = document.getElementById('subReceiptFileInput');
    const fileNameSpan = document.getElementById('subReceiptFileName');
    const previewContainer = document.getElementById('subReceiptPreviewContainer');
    const previewImg = document.getElementById('subReceiptPreviewImg');

    if (btnUpload && fileInput) {
      btnUpload.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (fileNameSpan) fileNameSpan.textContent = file.name;

        const reader = new FileReader();
        reader.onload = (event) => {
          receiptBase64 = event.target.result;
          if (previewImg) previewImg.src = receiptBase64;
          if (previewContainer) previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
      });
    }

    // Form Submission Handler (Instant Access + Super Admin Sync)
    const form = document.getElementById('subRenewalForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const senderPhone = document.getElementById('subSenderPhone').value.trim();
        const trxId = document.getElementById('subTrxId').value.trim();

        const settings = JSON.parse(localStorage.getItem('pos_settings')) || {};
        const currentSub = JSON.parse(localStorage.getItem('pos_subscription')) || {};
        const storeId = localStorage.getItem('pos_active_store_id') || `store_${Date.now()}`;

        // Calculate extended expiry date
        const currentExpiry = currentSub.trialExpiresAt ? new Date(currentSub.trialExpiresAt) : new Date();
        const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
        baseDate.setMonth(baseDate.getMonth() + selectedMonths);
        const newExpiryIso = baseDate.toISOString();

        const renewalPayload = {
          id: storeId,
          storeId: storeId,
          storeName: settings.storeName || currentSub.storeName || 'Merchant Store',
          ownerName: settings.storeOwner || currentSub.ownerName || 'Merchant Owner',
          phone: settings.storePhone || currentSub.phone || senderPhone,
          email: settings.storeEmail || currentSub.email || '',
          requestedMonths: selectedMonths,
          amountPaid: calculatedAmount,
          senderPhone: senderPhone,
          trxId: trxId,
          receiptImage: receiptBase64,
          status: 'Active Paid (Pending Verification)',
          isTrial: false,
          trialExpiresAt: newExpiryIso,
          paymentMethod: selectedGateway === 'bkash' ? 'bKash Send Money' : 'Nagad Send Money',
          submittedAt: new Date().toISOString()
        };

        // 1. Instantly update active merchant local subscription so they get IMMEDIATE access!
        localStorage.setItem('pos_subscription', JSON.stringify(renewalPayload));

        // Update local registry array
        let allSubs = JSON.parse(localStorage.getItem('pos_subscriptions')) || [];
        const existingIdx = allSubs.findIndex(s => s.storeId === storeId || s.id === storeId);
        if (existingIdx >= 0) {
          allSubs[existingIdx] = { ...allSubs[existingIdx], ...renewalPayload };
        } else {
          allSubs.push(renewalPayload);
        }
        localStorage.setItem('pos_subscriptions', JSON.stringify(allSubs));

        // 2. Save renewal request to Cloud Firestore
        if (window.POS_FIREBASE && window.POS_FIREBASE.db) {
          try {
            await window.POS_FIREBASE.db.collection('subscriptions').doc(storeId).set(renewalPayload, { merge: true });
          } catch (err) {
            console.warn('[Firestore] Renewal save error:', err);
          }
        }

        // 3. Broadcast to Super Admin live dashboard
        if (typeof BroadcastChannel !== 'undefined') {
          try {
            const channel = new BroadcastChannel('pos_subscriptions_channel');
            channel.postMessage({ type: 'new_subscriber', subscriber: renewalPayload });
          } catch (err) {
            console.warn('BroadcastChannel error:', err);
          }
        }

        updateSidebarSubscriptionBadge();

        if (modal) modal.classList.remove('active');
        alert(`🎉 স্বাগতম! আপনার ${toBnNum(selectedMonths)} মাসের সাবস্ক্রিপশন সফলভাবে জমা দেওয়া হয়েছে এবং তাৎক্ষণিক সক্রিয় করা হয়েছে!\n\nপেমেন্ট TrxID: ${trxId}\nমেয়াদের শেষ তারিখ: ${baseDate.toLocaleDateString('bn-BD')}\n\n(সুপার এডমিন আপনার পেমেন্ট ট্রানজেকশন আইটেমটি ভেরিফাই করবে)`);
      });
    }
  }

  // Update Sidebar remaining time badge & trigger push notification if expiring
  function updateSidebarSubscriptionBadge() {
    const subscription = JSON.parse(localStorage.getItem('pos_subscription')) || {};
    const expiryIso = subscription.trialExpiresAt || new Date(Date.now() + 7 * 86400000).toISOString();
    
    const timeInfo = formatRemainingTime(expiryIso);

    const adminBtn = document.getElementById('btnOpenSubscriptionModalAdmin');
    const cashierBtn = document.getElementById('btnOpenSubscriptionModalCashier');

    [adminBtn, cashierBtn].forEach(btn => {
      if (!btn) return;
      let badge = btn.querySelector('.sub-sidebar-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'sub-sidebar-badge';
        badge.style.cssText = 'margin-left: auto; font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; font-weight: 700; display: inline-block; font-family: "Hind Siliguri", sans-serif; font-style: normal;';
        btn.appendChild(badge);
      }

      if (timeInfo.expired) {
        badge.textContent = 'মেয়াদ শেষ!';
        badge.style.background = '#ef4444';
        badge.style.color = '#fff';
      } else if (timeInfo.days <= 7) {
        badge.textContent = `⚠️ ${timeInfo.badgeText}`;
        badge.style.background = '#ef4444';
        badge.style.color = '#fff';
      } else {
        badge.textContent = timeInfo.badgeText;
        badge.style.background = 'rgba(168, 85, 247, 0.25)';
        badge.style.color = '#a855f7';
      }
    });

    // Check if Push Notification Banner should be shown (if <= 7 days or expired)
    if (timeInfo.expired || timeInfo.days <= 7) {
      showSubscriptionPushNotification(timeInfo);
    }
  }

  // Show daily automatic push notification banner at bottom right if <= 7 days remaining
  function showSubscriptionPushNotification(timeInfo) {
    if (sessionStorage.getItem('pos_sub_push_closed') === 'true') return;
    if (document.getElementById('subPushNotificationBanner')) return;

    const cms = getCMSSettings();

    const bannerHTML = `
      <div id="subPushNotificationBanner" translate="no" class="notranslate" style="position: fixed; bottom: 24px; right: 24px; z-index: 99999; max-width: 420px; background: linear-gradient(135deg, #1e293b, #0f172a); border: 2px solid #ef4444; border-radius: 20px; padding: 1.1rem; color: #fff; box-shadow: 0 20px 50px rgba(239, 68, 68, 0.4); animation: slideUp 0.4s ease; font-family: 'Hind Siliguri', sans-serif; font-style: normal;">
        <div style="display: flex; align-items: flex-start; gap: 14px;">
          <div style="width: 44px; height: 44px; border-radius: 14px; background: rgba(239, 68, 68, 0.2); color: #ef4444; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0;">
            <i class="fa-solid fa-bell"></i>
          </div>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <strong style="color: #ef4444; font-size: 0.98rem; font-weight: 700; font-style: normal;"><i class="fa-solid fa-triangle-exclamation"></i> সাবস্ক্রিপশন এলার্ট (${timeInfo.text} বাকি)</strong>
              <button type="button" id="closeSubPushBtn" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 1.1rem; padding: 0 4px;"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <p style="font-size: 0.88rem; color: #cbd5e1; margin-bottom: 0.85rem; line-height: 1.5; font-style: normal;">${cms.pushMsg}</p>
            <div style="display: flex; gap: 8px;">
              <button type="button" onclick="window.openSubscriptionRenewModal()" class="btn btn-sm" style="background: linear-gradient(135deg, #a855f7, #7c3aed); color: #fff; border: none; font-weight: 700; font-style: normal; padding: 0.45rem 0.95rem; border-radius: 10px; font-size: 0.88rem; cursor: pointer; font-family: 'Hind Siliguri', sans-serif;">
                💳 এখনই সাবস্ক্রাইব করুন
              </button>
              <button type="button" id="dismissSubPushBtn" class="btn btn-sm btn-secondary" style="font-size: 0.88rem; border-radius: 10px; cursor: pointer; font-family: 'Hind Siliguri', sans-serif; font-style: normal;">
                পরে করবো
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', bannerHTML);

    document.getElementById('closeSubPushBtn')?.addEventListener('click', () => {
      sessionStorage.setItem('pos_sub_push_closed', 'true');
      document.getElementById('subPushNotificationBanner')?.remove();
    });

    document.getElementById('dismissSubPushBtn')?.addEventListener('click', () => {
      sessionStorage.setItem('pos_sub_push_closed', 'true');
      document.getElementById('subPushNotificationBanner')?.remove();
    });
  }

  // Listen for BroadcastChannel live push alerts from Super Admin
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel('pos_cms_sync');
      bc.onmessage = (e) => {
        if (e.data && e.data.type === 'global_sub_push_alert') {
          sessionStorage.removeItem('pos_sub_push_closed');
          showSubscriptionPushNotification({ text: 'জরুরি রিনিউ নোটিশ', expired: false, days: 0 });
        }
      };
    } catch (err) {}
  }

  // Public method to open modal
  window.openSubscriptionRenewModal = function () {
    injectSubscriptionModal();
    loadSubscriptionModalState();
    const modal = document.getElementById('subscriptionRenewModal');
    if (modal) modal.classList.add('active');
  };

  // Bind clicks & sidebar badge updates
  document.addEventListener('DOMContentLoaded', () => {
    injectSubscriptionModal();
    updateSidebarSubscriptionBadge();

    document.addEventListener('click', (e) => {
      const targetBtn = e.target.closest('#btnOpenSubscriptionModalAdmin, #btnOpenSubscriptionModalCashier, .open-subscription-btn');
      if (targetBtn) {
        e.preventDefault();
        window.openSubscriptionRenewModal();
      }
    });
  });
})();
