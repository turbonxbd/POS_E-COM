// Smart POS - Cashier Terminal Logic (Restricted Storefront & Variant Sales Interface)

function applyMerchantCustomWallpaper(settingsObj = null) {
  const settings = settingsObj || JSON.parse(localStorage.getItem('pos_settings')) || {};
  const deskBg = settings.customDesktopBg || '';
  const mobBg = settings.customMobileBg || deskBg;

  let bgWrap = document.getElementById('merchantCustomBackgroundWrap');
  if (!deskBg && !mobBg) {
    if (bgWrap) bgWrap.style.display = 'none';
    document.body.classList.remove('has-custom-wallpaper');
    return;
  }

  if (!bgWrap) {
    bgWrap = document.createElement('div');
    bgWrap.id = 'merchantCustomBackgroundWrap';
    document.body.prepend(bgWrap);
  }

  const isMobile = window.innerWidth < 768;
  const targetBg = (isMobile && mobBg) ? mobBg : (deskBg || mobBg);

  if (targetBg) {
    bgWrap.style.backgroundImage = `url("${targetBg}")`;
    bgWrap.style.display = 'block';
    document.body.classList.add('has-custom-wallpaper');
  } else {
    bgWrap.style.display = 'none';
    document.body.classList.remove('has-custom-wallpaper');
  }
}

// Automatic Thermal Receipt Logo Processor: Strips away black/white background boxes & converts logo graphics to solid dark black ink
function convertLogoToThermalBW(imageSrc, callback) {
  if (!imageSrc) return callback('');

  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = function() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const w = img.naturalWidth || img.width || 140;
      const h = img.naturalHeight || img.height || 140;
      canvas.width = w;
      canvas.height = h;

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Sample border pixels to detect dominant outer background (dark vs light)
      let borderDarkCount = 0;
      let borderTotal = 0;

      const sampleStepX = Math.max(1, Math.floor(w / 15));
      const sampleStepY = Math.max(1, Math.floor(h / 15));

      // Top & Bottom edges
      for (let x = 0; x < w; x += sampleStepX) {
        let idxTop = (0 * w + x) * 4;
        if (data[idxTop + 3] > 40) {
          borderTotal++;
          if ((data[idxTop] + data[idxTop + 1] + data[idxTop + 2]) / 3 < 110) borderDarkCount++;
        }
        let idxBot = ((h - 1) * w + x) * 4;
        if (data[idxBot + 3] > 40) {
          borderTotal++;
          if ((data[idxBot] + data[idxBot + 1] + data[idxBot + 2]) / 3 < 110) borderDarkCount++;
        }
      }

      // Left & Right edges
      for (let y = 0; y < h; y += sampleStepY) {
        let idxLeft = (y * w + 0) * 4;
        if (data[idxLeft + 3] > 40) {
          borderTotal++;
          if ((data[idxLeft] + data[idxLeft + 1] + data[idxLeft + 2]) / 3 < 110) borderDarkCount++;
        }
        let idxRight = (y * w + (w - 1)) * 4;
        if (data[idxRight + 3] > 40) {
          borderTotal++;
          if ((data[idxRight] + data[idxRight + 1] + data[idxRight + 2]) / 3 < 110) borderDarkCount++;
        }
      }

      const isDarkBg = borderTotal > 0 && (borderDarkCount / borderTotal > 0.4);

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a < 30) {
          data[i + 3] = 0;
          continue;
        }

        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        if (isDarkBg) {
          // Image has a dark/black background box (like dark square box around logo)
          if (brightness < 75) {
            // Dark outer background box -> Make 100% transparent (paper-white)!
            data[i + 3] = 0;
          } else if (brightness > 220 || (r > 210 && g > 210 && b > 210)) {
            // White text/highlights inside dark shapes -> Preserve as transparent paper cutout!
            data[i + 3] = 0;
          } else {
            // Logo graphic/lines -> Convert to solid dark black ink!
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
            data[i + 3] = 255;
          }
        } else {
          // Image has a light/white/transparent background (like Afia Cosmetics logo!)
          if (brightness > 210 || (r > 200 && g > 200 && b > 200)) {
            // Light background paper OR white text inside dark banners -> Preserve as transparent paper cutout!
            data[i + 3] = 0;
          } else {
            // Logo graphic & colored banners -> Convert to solid dark black ink!
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
            data[i + 3] = 255;
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      callback(canvas.toDataURL('image/png'));
    } catch (e) {
      console.warn('[Thermal Canvas Logo Converter Fallback]:', e);
      callback(imageSrc);
    }
  };

  img.onerror = function() {
    callback(imageSrc);
  };

  img.src = imageSrc;
}

window.addEventListener('resize', () => {
  if (document.body.classList.contains('has-custom-wallpaper')) {
    applyMerchantCustomWallpaper();
  }
});

class CashierTerminal {
  constructor() {
    const activeStoreId = localStorage.getItem('pos_active_store_id') || 'store_demo_101';
    const isGuestStore = activeStoreId === 'store_demo_101';

    const tenantProdKey = `pos_tenant_${activeStoreId}_pos_products`;
    const tenantSalesKey = `pos_tenant_${activeStoreId}_pos_sales`;
    const tenantSettingsKey = `pos_tenant_${activeStoreId}_pos_settings`;
    const tenantCouponKey = `pos_tenant_${activeStoreId}_pos_coupons`;
    const tenantCustKey = `pos_tenant_${activeStoreId}_pos_customers`;

    let rawProd = localStorage.getItem(tenantProdKey) || localStorage.getItem('pos_products');
    let rawSales = localStorage.getItem(tenantSalesKey) || localStorage.getItem('pos_sales');
    let rawSettings = localStorage.getItem(tenantSettingsKey) || localStorage.getItem('pos_settings');
    let rawCoupons = localStorage.getItem(tenantCouponKey) || localStorage.getItem('pos_coupons');
    let rawCusts = localStorage.getItem(tenantCustKey) || localStorage.getItem('pos_customers');

    this.products = rawProd && rawProd !== '[]' ? JSON.parse(rawProd) : (isGuestStore && typeof INITIAL_PRODUCTS !== 'undefined' ? INITIAL_PRODUCTS : []);
    this.sales = rawSales && rawSales !== '[]' ? JSON.parse(rawSales) : [];
    this.settings = rawSettings && rawSettings !== '{}' ? JSON.parse(rawSettings) : {};
    applyMerchantCustomWallpaper(this.settings);

    // Pull active merchant profile metadata if settings keys are empty for non-guest stores
    if (!isGuestStore) {
      const activeSub = JSON.parse(localStorage.getItem('pos_subscription')) || {};
      const allSubs = JSON.parse(localStorage.getItem('pos_subscriptions')) || [];
      const matchSub = (activeSub.storeId === activeStoreId ? activeSub : null) || allSubs.find(s => s.storeId === activeStoreId || s.id === activeStoreId);
      if (matchSub) {
        this.settings.storeName = this.settings.storeName || matchSub.storeName || 'My Shop';
        this.settings.storeOwner = this.settings.storeOwner || this.settings.ownerName || matchSub.ownerName || matchSub.storeOwner || '';
        this.settings.ownerName = this.settings.ownerName || this.settings.storeOwner;
        this.settings.storePhone = this.settings.storePhone || this.settings.phone || this.settings.personalPhone || matchSub.phone || matchSub.storePhone || '';
        this.settings.phone = this.settings.phone || this.settings.storePhone;
        this.settings.personalPhone = this.settings.personalPhone || this.settings.storePhone;
        this.settings.storeEmail = this.settings.storeEmail || this.settings.email || this.settings.personalEmail || matchSub.email || matchSub.storeEmail || '';
        this.settings.email = this.settings.email || this.settings.storeEmail;
        this.settings.personalEmail = this.settings.personalEmail || this.settings.storeEmail;
        this.settings.storeAddress = this.settings.storeAddress || matchSub.storeAddress || 'Dhaka, Bangladesh';
      }
    } else if (typeof DEFAULT_SETTINGS !== 'undefined' && (!this.settings || !this.settings.storeName)) {
      this.settings = { ...DEFAULT_SETTINGS, ...this.settings };
    }

    if (this.settings) {
      if (!this.settings.storeName) this.settings.storeName = isGuestStore ? 'গেস্ট ডেমো সুপারশপ' : 'My Shop';
      if (!this.settings.storeAddress) this.settings.storeAddress = 'Dhaka, Bangladesh';
      if (!this.settings.receiptFooterNote) this.settings.receiptFooterNote = 'Thank you! Come again.';
      localStorage.setItem('pos_settings', JSON.stringify(this.settings));
      localStorage.setItem(tenantSettingsKey, JSON.stringify(this.settings));
    }
    this.cart = [];
    this.coupons = rawCoupons && rawCoupons !== '[]' ? JSON.parse(rawCoupons) : [];
    this.customers = rawCusts && rawCusts !== '[]' ? JSON.parse(rawCusts) : [];
    this.appliedCoupon = null;
    this.discountType = this.settings.defaultDiscountMode || 'percent';
    this.discountValue = this.settings.defaultDiscountValue !== undefined ? parseFloat(this.settings.defaultDiscountValue) || 0 : 0;
    this.taxType = this.settings.defaultTaxMode || 'percent';
    this.taxValue = this.settings.defaultTax !== undefined ? parseFloat(this.settings.defaultTax) || 0 : 0;
    this.soundEnabled = true;
    this.activeCategory = 'all';
    this.html5QrcodeScanner = null;
    this.selectedEpayProvider = 'bKash';
    this.scannerBuffer = '';
    this.scannerTimeout = null;
    this.audioCtx = null;
    this.activeTab = 'cashierTerminalView';
    this.currentDateFilter = 'today';
    this.customStartDate = null;
    this.customEndDate = null;
    this.calendarViewDate = new Date();
    this.hoverDate = null;

    this.dashboardChart = null;
    this.shiftChart = null;
    this.analyticsHourlyChart = null;
    this.analyticsPaymentChart = null;
    this.analyticsCategoryChart = null;

    this.init();
  }

  init() {
    this.checkAccountStatusSecurityGuard();
    setInterval(() => this.checkAccountStatusSecurityGuard(), 3000);
    window.addEventListener('storage', () => this.checkAccountStatusSecurityGuard());
    this.initEventListeners();
    this.initLiveClock();
    this.initDatePicker();
    this.switchTab('cashierTerminalView');
    this.updateDiscountTaxUI();
    this.populateCustomerSelect();
    this.setupCustomerLookupInModals();
    this.setupCartCustomerEvents();
    this.setupHardwareScanner();
    this.setupBarcodePanel();
    this.renderQuickBarcodeChips();
    this.setupMobileSidebar();
    this.updateSidebarStoreBranding();

    // Listen for storage & cloud changes from Admin panel in real-time
    const reloadCashierState = () => {
      const activeStoreId = localStorage.getItem('pos_active_store_id') || 'store_demo_101';
      const isGuestStore = activeStoreId === 'store_demo_101';

      const tenantProdKey = `pos_tenant_${activeStoreId}_pos_products`;
      const tenantSalesKey = `pos_tenant_${activeStoreId}_pos_sales`;
      const tenantSettingsKey = `pos_tenant_${activeStoreId}_pos_settings`;
      const tenantCustKey = `pos_tenant_${activeStoreId}_pos_customers`;

      let rawTenantProd = localStorage.getItem(tenantProdKey);
      let rawGlobalProd = localStorage.getItem('pos_products');
      let parsedTenant  = (rawTenantProd && rawTenantProd !== '[]') ? (() => { try { return JSON.parse(rawTenantProd); } catch(e) { return null; } })() : null;
      let parsedGlobal  = (rawGlobalProd && rawGlobalProd !== '[]') ? (() => { try { return JSON.parse(rawGlobalProd); } catch(e) { return null; } })() : null;

      if (Array.isArray(parsedTenant) && parsedTenant.length > 0) {
        this.products = parsedTenant;
      } else if (Array.isArray(parsedGlobal) && parsedGlobal.length > 0) {
        this.products = parsedGlobal;
      } else if (!this.products || this.products.length === 0) {
        this.products = (isGuestStore && typeof INITIAL_PRODUCTS !== 'undefined') ? INITIAL_PRODUCTS : [];
      }

      // --- Other keys: read from tenant key, fall back to global ---
      const rawSales    = localStorage.getItem(tenantSalesKey)    || localStorage.getItem('pos_sales');
      const rawSettings = localStorage.getItem(tenantSettingsKey) || localStorage.getItem('pos_settings');
      const rawCusts    = localStorage.getItem(tenantCustKey)     || localStorage.getItem('pos_customers');

      this.sales     = (rawSales    && rawSales    !== '[]') ? JSON.parse(rawSales)    : [];
      this.settings  = (rawSettings && rawSettings !== '{}') ? JSON.parse(rawSettings) : (typeof DEFAULT_SETTINGS !== 'undefined' ? DEFAULT_SETTINGS : {});
      applyMerchantCustomWallpaper(this.settings);
      this.customers = (rawCusts    && rawCusts    !== '[]') ? JSON.parse(rawCusts)    : [];

      this.populateCustomerSelect();
      this.renderCart();
      if (this.activeTab === 'cashierDashboardView') this.renderDashboardView();
      if (this.activeTab === 'cashierProductsView') this.renderProducts();
      
      if (this.cart.length === 0 && !this._userHasCustomDiscount && !this._userHasCustomTax) {
        this.discountType = this.settings.defaultDiscountMode || 'percent';
        this.discountValue = this.settings.defaultDiscountValue !== undefined ? parseFloat(this.settings.defaultDiscountValue) || 0 : 0;
        this.taxType = this.settings.defaultTaxMode || 'percent';
        this.taxValue = this.settings.defaultTax !== undefined ? parseFloat(this.settings.defaultTax) || 0 : 0;
        this.updateDiscountTaxUI();
      }
      
      if (this.activeTab === 'cashierDashboardView') this.renderDashboardView();
      else if (this.activeTab === 'cashierTerminalView') this.renderProducts();
      else if (this.activeTab === 'cashierAnalyticsView') this.renderAnalyticsView();
      else if (this.activeTab === 'cashierShiftView') this.renderShiftSales();
      else if (this.activeTab === 'cashierCustomersView') this.renderCashierCustomers();
      this.renderQuickBarcodeChips();
    };

    window.addEventListener('storage', reloadCashierState);
    window.addEventListener('pos_cloud_update', reloadCashierState);
    window.addEventListener('pos_tenant_changed', reloadCashierState);

    document.addEventListener('click', (e) => {
      if (e.target.closest('.close-modal')) {
        const modal = e.target.closest('.modal');
        if (modal) modal.classList.remove('active');
      }
    });
  }

  openModal(modalId) {
    const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
    if (modal) modal.classList.add('active');
  }

  closeModal(modalId) {
    const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
    if (modal) {
      modal.classList.remove('active');
      if (modalId === 'scannerModal') this.stopCameraScanner();
    }
  }

  updateSidebarStoreBranding() {
    const s = this.settings || JSON.parse(localStorage.getItem('pos_settings')) || {};
    const sub = JSON.parse(localStorage.getItem('pos_subscription')) || JSON.parse(localStorage.getItem('pos_active_subscription')) || {};
    const storeName = s.storeName || sub.storeName || 'SmartPOS Cashier';
    const storeLogo = s.storeLogo || sub.storeLogo || '';

    const storeNameEl = document.getElementById('cashierSidebarStoreName');
    const cashierNameEl = document.getElementById('cashierNameDisplay');
    const shiftEl = document.getElementById('cashierShiftDisplay');

    if (storeNameEl && storeName) storeNameEl.textContent = storeName;
    if (cashierNameEl) cashierNameEl.textContent = s.cashierName || 'ক্যাশিয়ার টার্মিনাল';
    if (shiftEl) {
      const now = new Date();
      const shiftId = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
      shiftEl.textContent = `শিফট: ${shiftId}`;
    }

    // Top-Left Sidebar Main Logo Update
    const logoContainer = document.getElementById('cashierSidebarBrandLogo');
    const logoIcon = document.getElementById('cashierSidebarBrandIcon');
    const logoImg = document.getElementById('cashierSidebarBrandImg');

    if (logoImg && logoIcon && logoContainer) {
      if (storeLogo) {
        logoImg.src = storeLogo;
        logoImg.style.display = 'block';
        logoIcon.style.display = 'none';
        logoContainer.style.background = 'transparent';
      } else {
        logoImg.style.display = 'none';
        logoIcon.style.display = 'block';
        logoContainer.style.background = 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple, #8b5cf6))';
      }
    }
  }

  checkAccountStatusSecurityGuard() {
    const activeStoreId = localStorage.getItem('pos_active_store_id') || 'store_demo_101';
    const settings = JSON.parse(localStorage.getItem('pos_settings')) || {};
    const allSubs = JSON.parse(localStorage.getItem('pos_subscriptions')) || [];
    let sub = JSON.parse(localStorage.getItem('pos_subscription')) || {};

    if (allSubs.length > 0) {
      const match = allSubs.find(s => 
        (s.storeId && s.storeId === activeStoreId) || 
        (s.id && s.id === activeStoreId) ||
        (settings.storeName && s.storeName === settings.storeName) ||
        (settings.ownerName && (s.ownerName === settings.ownerName || s.ownerName === settings.storeOwner))
      );
      if (match) sub = { ...sub, ...match };
    }

    const isBlocked = sub.accountBlocked === true || sub.status === 'Suspended' || sub.status === 'Stopped' || sub.status === 'Suspended (Transaction Rejected)';
    const isExpired = sub.trialExpiresAt ? (new Date(sub.trialExpiresAt) <= new Date()) : false;

    // 1. Full Lock Check (Blocked OR Expired)
    if (isBlocked || isExpired) {
      const cms = JSON.parse(localStorage.getItem('pos_landing_cms')) || {};
      let rawWa = cms.whatsappNumber || cms.phone || '8801700000000';
      let waNum = rawWa.replace(/[^0-9]/g, '');
      if (waNum.length === 11 && waNum.startsWith('01')) waNum = '88' + waNum;
      const storeName = settings.storeName || sub.storeName || 'Merchant Store';

      let overlay = document.getElementById('accountBlockedOverlayGateCashier');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'accountBlockedOverlayGateCashier';
        overlay.style.cssText = 'position:fixed; inset:0; background:rgba(15,23,42,0.96); backdrop-filter:blur(16px); z-index:999998; display:flex; align-items:center; justify-content:center; padding:1.5rem; color:#fff; text-align:center; font-family:"Hind Siliguri", sans-serif;';
        overlay.innerHTML = `
          <div style="background:#1e293b; border:2px solid ${isBlocked ? '#ef4444' : '#f59e0b'}; border-radius:24px; padding:2.2rem 1.8rem; max-width:500px; width:100%; box-shadow:0 25px 60px rgba(0,0,0,0.5);">
            <div style="width:70px; height:70px; border-radius:50%; background:${isBlocked ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}; color:${isBlocked ? '#ef4444' : '#f59e0b'}; display:flex; align-items:center; justify-content:center; font-size:2.5rem; margin:0 auto 1.25rem;">
              <i class="fa-solid ${isBlocked ? 'fa-user-slash' : 'fa-hourglass-end'}"></i>
            </div>
            <h2 style="color:${isBlocked ? '#ef4444' : '#f59e0b'}; font-size:1.5rem; margin-bottom:0.75rem; font-weight:700;">
              ${isBlocked ? '⛔ সাবস্ক্রিপশন স্থগিত (Suspended)' : '⚠️ সাবস্ক্রিপশনের মেয়াদ শেষ (Subscription Expired)'}
            </h2>
            <p style="color:#cbd5e1; font-size:0.95rem; line-height:1.6; margin-bottom:1.5rem;">
              ${isBlocked ? 'আপনার মার্চেন্ট অ্যাকাউন্টটি সুপার এডমিন দ্বারা স্থগিত বা বন্ধ রাখা হয়েছে।' : 'আপনার দোকানের স্মার্ট POS কাউন্টার সাবস্ক্রিপশনের মেয়াদের সময় শেষ হয়ে গেছে। নিরবচ্ছিন্ন সেবা পেতে এখনই প্যাকেজ রিনিউ করুন।'}
            </p>
            <div style="display:flex; flex-direction:column; gap:12px;">
              <button type="button" onclick="if(typeof window.openSubscriptionRenewModal==='function') window.openSubscriptionRenewModal()" class="btn" style="background:linear-gradient(135deg, #a855f7, #9333ea); color:#fff; padding:0.85rem 1.25rem; border-radius:14px; font-weight:700; font-size:1rem; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 10px 25px rgba(168,85,247,0.4);">
                <i class="fa-solid fa-credit-card"></i> 💳 এখনই সাবস্ক্রিপশন রিনিউ করুন
              </button>
              <a href="https://wa.me/${waNum}?text=${encodeURIComponent('হ্যালো, আমার স্টোরের (' + storeName + ') সাবস্ক্রিপশন সংক্রান্ত সাহায্য প্রয়োজন।')}" target="_blank" class="btn" style="background:linear-gradient(135deg, #25D366, #128C7E); color:#fff; padding:0.8rem 1.25rem; border-radius:14px; text-decoration:none; font-weight:700; font-size:0.95rem; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 8px 20px rgba(37,211,102,0.3);">
                <i class="fa-brands fa-whatsapp" style="font-size:1.3rem;"></i> 💬 হেল্প ও সহায়তার জন্য হোয়াটসঅ্যাপে মেসেজ দিন
              </a>
            </div>
          </div>
        `;
        document.body.appendChild(overlay);
      }
      return;
    } else {
      const existingOverlay = document.getElementById('accountBlockedOverlayGateCashier');
      if (existingOverlay) existingOverlay.remove();
    }

    // 2. Access Fee Block Check
    if (sub.accessBlocked === true || sub.accessFeePaid === false) {
      if (typeof window.openSubscriptionRenewModal === 'function') {
        setTimeout(() => window.openSubscriptionRenewModal(), 1000);
      }
    }
  }

  playAudioBeep(type = 'scan') {
    if (!this.soundEnabled) return;
    try {
      if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'scan') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.12);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.12);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, this.audioCtx.currentTime);
        osc.frequency.setValueAtTime(880, this.audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.35);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(350, this.audioCtx.currentTime);
        osc.frequency.setValueAtTime(180, this.audioCtx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.25);
      }
    } catch (e) { console.log(e); }
  }

  initLiveClock() {
    const clockEl = document.getElementById('liveClock');
    if (!clockEl) return;

    if (!clockEl.querySelector('.clock-time')) {
      clockEl.innerHTML = `
        <div class="live-dot-container" title="লাইভ সময় রানিং">
          <span class="live-dot-ping"></span>
          <span class="live-dot-core"></span>
        </div>
        <div class="clock-section time-section">
          <i class="fa-regular fa-clock clock-icon"></i>
          <span class="clock-time">00:00:00 AM</span>
        </div>
        <div class="clock-divider"></div>
        <div class="clock-section date-section">
          <i class="fa-regular fa-calendar-days date-icon"></i>
          <span class="clock-date">--/--/----</span>
        </div>
      `;
    }

    const timeEl = clockEl.querySelector('.clock-time');
    const dateEl = clockEl.querySelector('.clock-date');

    this.lastTrackedDate = new Date().toDateString();

    const update = () => {
      const now = new Date();
      const currentDateStr = now.toDateString();

      // Midnight Rollover Check: Auto refresh cashier views when calendar date changes past 12:00 AM midnight
      if (this.lastTrackedDate && this.lastTrackedDate !== currentDateStr) {
        this.lastTrackedDate = currentDateStr;
        if (typeof this.applyPresetRange === 'function' && (this.currentDateFilter === 'today' || !this.currentDateFilter)) {
          this.applyPresetRange(this.currentDateFilter || 'today');
        }
        if (typeof this.renderShiftSales === 'function') {
          this.renderShiftSales();
        }
        if (typeof this.renderDashboardStats === 'function') {
          this.renderDashboardStats();
        }
      }
      
      // Time format: HH:MM:SS AM/PM
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedHours = String(hours).padStart(2, '0');
      const timeStr = `${formattedHours}:${minutes}:${seconds} ${ampm}`;

      // Date format: DD/MM/YYYY
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const dateStr = `${day}/${month}/${year}`;

      if (timeEl) timeEl.textContent = timeStr;
      if (dateEl) dateEl.textContent = dateStr;
    };

    update();
    setInterval(update, 1000);
  }

  setupMobileSidebar() {
    const toggleBtn = document.getElementById('mobileMenuToggle');
    const closeBtn = document.getElementById('closeMobileSidebarBtn');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (!sidebar) return;

    const openSidebar = () => {
      sidebar.classList.add('mobile-active');
      if (overlay) overlay.classList.add('active');
    };

    const closeSidebar = () => {
      sidebar.classList.remove('mobile-active');
      if (overlay) overlay.classList.remove('active');
    };

    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (sidebar.classList.contains('mobile-active')) {
          closeSidebar();
        } else {
          openSidebar();
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', closeSidebar);
    }

    if (overlay) {
      overlay.addEventListener('click', closeSidebar);
    }

    const navItems = sidebar.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          closeSidebar();
        }
      });
    });

    const btnGoCart = document.getElementById('btnMobileGoToCart');
    if (btnGoCart) {
      btnGoCart.addEventListener('click', () => {
        const cartPanel = document.querySelector('.cart-panel');
        if (cartPanel) {
          cartPanel.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }

  setupBarcodePanel() {
    const input = document.getElementById('barcodeScanInput');
    const clearBtn = document.getElementById('clearBarcodeBtn');
    const submitBtn = document.getElementById('submitBarcodeBtn');
    const cameraBtn = document.getElementById('barcodeCameraBtn');

    if (input) {
      input.addEventListener('input', (e) => {
        if (clearBtn) clearBtn.style.display = e.target.value ? 'block' : 'none';
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const val = input.value.trim();
          if (val) {
            this.handleBarcodeScan(val);
            input.value = '';
            if (clearBtn) clearBtn.style.display = 'none';
          }
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (input) {
          input.value = '';
          input.focus();
        }
        clearBtn.style.display = 'none';
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        if (input) {
          const val = input.value.trim();
          if (val) {
            this.handleBarcodeScan(val);
            input.value = '';
            if (clearBtn) clearBtn.style.display = 'none';
            input.focus();
          } else {
            input.focus();
          }
        }
      });
    }

    if (cameraBtn) {
      cameraBtn.addEventListener('click', () => this.openCameraScanner());
    }
  }

  renderQuickBarcodeChips() {
    const container = document.getElementById('quickBarcodeChips');
    if (!container) return;

    const chips = [];
    this.products.forEach(p => {
      if (p.variants && Array.isArray(p.variants)) {
        p.variants.forEach(v => {
          if (v.barcode) {
            chips.push({
              barcode: v.barcode,
              name: p.name,
              color: v.color,
              size: v.size,
              price: v.price
            });
          }
        });
      }
    });

    if (chips.length === 0) {
      container.innerHTML = `<small class="text-muted">কোনো বারকোড পাওয়া যায়নি</small>`;
      return;
    }

    container.innerHTML = chips.map(c => `
      <button type="button" class="quick-chip" onclick="cashier.handleBarcodeScan('${c.barcode}')" title="${c.name} (${c.color}/${c.size}) - ৳${c.price}">
        <i class="fa-solid fa-barcode"></i> ${c.barcode}
      </button>
    `).join('');
  }

  setupHardwareScanner() {
    document.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      const isInput = activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT';
      
      // If focused in barcode scanner input or product search, let their keydown handle it
      if (activeEl.id === 'barcodeScanInput' || activeEl.id === 'productSearchInput') {
        return;
      }

      // If focused in other form fields, skip global buffer scanner
      if (isInput) return;

      if (e.key === 'Enter') {
        if (this.scannerBuffer.trim().length >= 2) {
          this.handleBarcodeScan(this.scannerBuffer.trim());
          this.scannerBuffer = '';
        }
      } else if (e.key.length === 1) {
        this.scannerBuffer += e.key;
        clearTimeout(this.scannerTimeout);
        this.scannerTimeout = setTimeout(() => { this.scannerBuffer = ''; }, 250);
      }
    });
  }

  // Handle Scanned Barcode Logic (Matches exact variant barcode or invoice ID)
  handleBarcodeScan(barcodeStr) {
    if (!barcodeStr) return;
    const cleanStr = String(barcodeStr).trim();
    const normClean = cleanStr.toLowerCase().replace(/\s+/g, '');
    const isInvoicePrefix = normClean.startsWith('inv') || normClean.startsWith('inv-');

    // 0. Check if scanned barcode matches an Invoice ID (INV-XXXX) or has invoice format
    const saleMatch = this.sales.find(s => {
      const sid = String(s.id).toLowerCase().replace(/\s+/g, '');
      return sid === normClean || sid.includes(normClean) || normClean.includes(sid);
    });

    if (saleMatch || isInvoicePrefix) {
      const targetInvId = saleMatch ? saleMatch.id : cleanStr;

      // AUTOMATICALLY SWITCH TAB TO TODAY'S SHIFT REPORT / SALES LOG VIEW
      this.switchTab('cashierShiftView');

      // Auto-fill invoice search input box on Sales Summary page & filter list
      const shiftSearch = document.getElementById('shiftInvoiceSearchInput');
      if (shiftSearch) {
        shiftSearch.value = targetInvId;
        if (typeof this.filterShiftSales === 'function') {
          this.filterShiftSales();
        }
      }

      if (saleMatch) {
        this.openInvoiceReturnExchangeModal(saleMatch.id);
        this.playAudioBeep('success');
        this.showToast(`🧾 ইনভয়েস ${saleMatch.id} সেলস সামারিতে লোড করা হয়েছে!`);
      } else {
        this.playAudioBeep('error');
        this.showToast(`ইনভয়েস '${cleanStr}' সেলস সামারিতে সিস্টেমে পাওয়া যায়নি!`, 'error');
      }
      return;
    }

    let foundProd = null;
    let foundVar = null;

    // 1. Exact match on variant barcode
    for (const p of this.products) {
      if (p.variants && Array.isArray(p.variants)) {
        const matchingVar = p.variants.find(v => String(v.barcode).trim() === cleanStr);
        if (matchingVar) {
          foundProd = p;
          foundVar = matchingVar;
          break;
        }
      }
    }

    // 2. Case-insensitive / Substring fallback match
    if (!foundProd) {
      for (const p of this.products) {
        if (p.variants && Array.isArray(p.variants)) {
          const matchingVar = p.variants.find(v => String(v.barcode).toLowerCase().includes(cleanStr.toLowerCase()));
          if (matchingVar) {
            foundProd = p;
            foundVar = matchingVar;
            break;
          }
        }
      }
    }

    // 3. Product ID / Variant ID fallback
    if (!foundProd) {
      foundProd = this.products.find(p => p.id.toLowerCase() === cleanStr.toLowerCase());
      if (foundProd && foundProd.variants && foundProd.variants.length > 0) {
        foundVar = foundProd.variants[0];
      }
    }

    if (foundProd && foundVar) {
      // AUTOMATICALLY SWITCH TAB TO POS TERMINAL (cashierTerminalView)
      if (this.activeTab !== 'cashierTerminalView') {
        this.switchTab('cashierTerminalView');
      }

      this.addVariantToCart(foundProd, foundVar);
      this.playAudioBeep('scan');
      this.showToast(`🛒 ${foundProd.name} (${foundVar.color}/${foundVar.size}) - পিওএস টার্মিনালে কার্টে যোগ করা হয়েছে!`);
      this.highlightCartItem(foundVar.variantId);
      
      const barInput = document.getElementById('barcodeScanInput');
      if (barInput) {
        barInput.value = '';
        barInput.focus();
      }
    } else {
      // If barcode is unknown, switch to POS terminal so user sees error toast & scanner input
      if (this.activeTab !== 'cashierTerminalView') {
        this.switchTab('cashierTerminalView');
      }

      this.playAudioBeep('error');
      this.showToast(`বারকোড '${cleanStr}' সিস্টেমে পাওয়া যায়নি!`, 'error');

      const statusPill = document.getElementById('panelScannerStatus');
      if (statusPill) {
        statusPill.classList.add('error-pulse');
        setTimeout(() => statusPill.classList.remove('error-pulse'), 1500);
      }
    }
  }

  highlightCartItem(variantId) {
    setTimeout(() => {
      const items = document.querySelectorAll('.cart-item');
      items.forEach(el => {
        if (el.dataset.variantId === variantId) {
          el.classList.remove('cart-item-scanned');
          void el.offsetWidth; // trigger reflow
          el.classList.add('cart-item-scanned');
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    }, 50);
  }

  showToast(msg, type = 'success') {
    const existing = document.querySelector('.pos-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `pos-toast ${type}`;
    toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}"></i> ${msg}`;
    
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.background = type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)';
    toast.style.color = '#fff';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '12px';
    toast.style.fontWeight = '600';
    toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.4)';
    toast.style.zIndex = '99999';

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  // Render Products Grid for Cashier
  renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    const prodHash = JSON.stringify(this.products || []) + '_' + this.activeCategory;
    if (grid.matches(':hover') && this._lastProductsRenderHash === prodHash) {
      return;
    }
    this._lastProductsRenderHash = prodHash;

    const searchInput = document.getElementById('productSearchInput');
    const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const filtered = this.products.filter(p => {
      const matchCat = this.activeCategory === 'all' || p.category === this.activeCategory;
      const matchName = p.name.toLowerCase().includes(searchVal);
      const matchBarcode = p.variants ? p.variants.some(v => v.barcode.includes(searchVal)) : false;
      return matchCat && (matchName || matchBarcode);
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem;">
          <i class="fa-solid fa-box-open" style="font-size: 2.5rem; opacity: 0.4;"></i>
          <p class="mt-2">কোনো পণ্য পাওয়া যায়নি</p>
        </div>`;
      return;
    }

    grid.innerHTML = filtered.map(p => {
      const variants = p.variants || [];
      const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
      const minPrice = variants.length > 0 ? Math.min(...variants.map(v => v.price)) : 0;
      const maxPrice = variants.length > 0 ? Math.max(...variants.map(v => v.price)) : 0;
      const priceDisplay = minPrice === maxPrice ? `৳${minPrice}` : `৳${minPrice} - ৳${maxPrice}`;

      // Calculate highest MRP if higher than current price
      const mrpList = variants.map(v => v.mrp).filter(m => m && m > 0);
      const maxMrp = mrpList.length > 0 ? Math.max(...mrpList) : 0;
      const mrpStrikethrough = (maxMrp > minPrice) ? `<del class="mrp-price-tag">৳${maxMrp}</del>` : '';

      // Color/Size variant badges preview with icons
      const variantTags = variants.slice(0, 2).map(v => `
        <span class="badge" style="background:rgba(245, 158, 11, 0.12); color:var(--accent-orange); font-size:0.72rem; padding:2px 7px; border:1px solid rgba(245,158,11,0.25);">
          🎨 ${v.color} ${v.size !== 'N/A' ? `/ 📏 ${v.size}` : ''}
        </span>
      `).join('');

      const stockClass = totalStock <= 0 ? 'out' : (totalStock <= 10 ? 'low' : '');
      const stockText = totalStock <= 0 ? 'স্টক শেষ' : `মজুদ: ${totalStock}`;

      return `
        <div class="product-card" onclick="cashier.handleProductCardClick('${p.id}')">
          <div class="product-img-wrap" style="background:#000000;">
            ${p.image && p.image.trim() !== '' 
              ? `<img src="${p.image}" alt="${p.name}" loading="lazy" style="background:#000000; object-fit:cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"><div style="display:none; width:100%; height:100%; background:#000000;"></div>`
              : `<div style="width:100%; height:100%; background:#000000;"></div>`}
            <span class="stock-tag ${stockClass}">${stockText}</span>
          </div>
          <div class="product-details">
            <h4>${p.name}</h4>
            <div style="display:flex; gap:4px; margin:2px 0; flex-wrap:wrap;">
              ${variantTags} ${variants.length > 2 ? `<small class="text-muted" style="font-size:0.7rem;">+${variants.length - 2}</small>` : ''}
            </div>
            <div class="product-price-row">
              <div>
                ${mrpStrikethrough}
                <span class="price">${priceDisplay}</span>
              </div>
              <button class="btn-add-cart" title="ভেরিয়েন্ট নির্বাচন করুন / কার্টে যোগ"><i class="fa-solid fa-plus"></i></button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  handleProductCardClick(prodId) {
    const prod = this.products.find(p => p.id === prodId);
    if (!prod || !prod.variants || prod.variants.length === 0) return;

    if (prod.variants.length === 1) {
      // Direct add if only 1 variant exists
      this.addVariantToCart(prod, prod.variants[0]);
      this.playAudioBeep('scan');
    } else {
      // Open Variant Choice Modal
      this.openVariantSelectionModal(prod);
    }
  }

  openVariantSelectionModal(prod) {
    document.getElementById('variantModalTitle').innerText = prod.name;
    document.getElementById('variantModalCategory').innerText = prod.category;
    document.getElementById('variantModalImg').src = prod.image;

    const list = document.getElementById('variantModalList');
    list.innerHTML = prod.variants.map(v => {
      const mrpTag = (v.mrp && v.mrp > v.price) ? `<del style="color:var(--text-muted); font-size:0.8rem; margin-right:6px;">৳${v.mrp}</del>` : '';
      const isOutOfStock = v.stock < 1;

      return `
        <div class="variant-choice-item" onclick="${isOutOfStock ? '' : `cashier.selectVariantFromModal('${prod.id}', '${v.variantId}')`}"
             style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:12px; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; cursor:${isOutOfStock ? 'not-allowed' : 'pointer'}; opacity:${isOutOfStock ? 0.5 : 1}; transition:all 0.2s ease;">
          <div>
            <div style="font-weight:600; font-size:0.95rem;">
              <span class="badge" style="background:rgba(245, 158, 11, 0.15); color:var(--accent-orange); margin-right:6px;">🎨 ${v.color}</span>
              <span class="badge" style="background:rgba(139, 92, 246, 0.15); color:var(--accent-purple);">📏 ${v.size}</span>
            </div>
            <small style="color:var(--text-muted); font-size:0.78rem;" class="mt-1 display-block">বারকোড: <code>${v.barcode}</code> | মজুদ: ${v.stock} pcs</small>
          </div>
          <div style="text-align:right;">
            <div style="font-size:1.1rem; font-weight:700; color:var(--accent-green);">
              ${mrpTag}৳${v.price}
            </div>
            ${isOutOfStock ? `<span class="badge badge-danger">স্টক শেষ</span>` : `<button class="btn btn-sm btn-primary mt-1"><i class="fa-solid fa-cart-plus"></i> যোগ করুন</button>`}
          </div>
        </div>
      `;
    }).join('');

    this.openModal('cashierVariantModal');
  }

  selectVariantFromModal(prodId, variantId) {
    const prod = this.products.find(p => p.id === prodId);
    if (!prod) return;
    const v = prod.variants.find(item => item.variantId === variantId);
    if (!v) return;

    this.addVariantToCart(prod, v);
    this.playAudioBeep('scan');
    this.closeModal('cashierVariantModal');
  }

  addVariantToCart(prod, variant) {
    const existing = this.cart.find(item => item.variantId === variant.variantId);
    if (existing) {
      if (existing.quantity + 1 > variant.stock) {
        this.showToast(`স্টক সীমা অতিক্রম করেছে! (মজুদ: ${variant.stock})`, 'error');
        return;
      }
      existing.quantity += 1;
      existing.subtotal = existing.quantity * variant.price;
    } else {
      if (variant.stock < 1) {
        this.showToast('পণ্যটি স্টকে নেই!', 'error');
        return;
      }
      this.cart.push({
        productId: prod.id,
        variantId: variant.variantId,
        name: prod.name,
        color: variant.color,
        size: variant.size,
        barcode: variant.barcode,
        price: variant.price,
        cost: variant.cost,
        mrp: variant.mrp,
        quantity: 1,
        subtotal: variant.price
      });
    }
    this.renderCart();
  }

  updateCartQty(variantId, delta) {
    const item = this.cart.find(i => i.variantId === variantId);
    if (!item) return;

    // Find current stock from product schema
    let currentStock = 999;
    const prod = this.products.find(p => p.id === item.productId);
    if (prod && prod.variants) {
      const v = prod.variants.find(v => v.variantId === variantId);
      if (v) currentStock = v.stock;
    }

    item.quantity += delta;
    if (item.quantity <= 0) {
      this.cart = this.cart.filter(i => i.variantId !== variantId);
    } else {
      if (item.quantity > currentStock) {
        item.quantity = currentStock;
        this.showToast(`স্টক সীমা অতিক্রম করেছে! (মজুদ: ${currentStock})`, 'error');
      }
      item.subtotal = item.quantity * item.price;
    }
    this.renderCart();
  }

  removeFromCart(variantId) {
    this.cart = this.cart.filter(i => i.variantId !== variantId);
    this.renderCart();
  }

  clearCart() {
    this.cart = [];
    this._userHasCustomDiscount = false;
    this._userHasCustomTax = false;
    this.discountType = 'percent';
    this.discountValue = 0;
    this.taxType = 'percent';
    this.taxValue = this.settings.defaultTax !== undefined ? parseFloat(this.settings.defaultTax) || 0 : 0;
    this.appliedCoupon = null;

    const discInput = document.getElementById('discountInput');
    const taxInput = document.getElementById('taxInput');
    if (discInput) discInput.value = 0;
    if (taxInput) taxInput.value = this.taxValue;

    const custSelect = document.getElementById('customerSelect');
    const cartPhone = document.getElementById('cartCustPhone');
    const cartName = document.getElementById('cartCustName');
    const cartBadge = document.getElementById('posCartCustBadge');
    const cartOrderNote = document.getElementById('cartOrderNote');

    if (custSelect) custSelect.value = 'Walk-in Customer';
    if (cartPhone) cartPhone.value = '';
    if (cartName) cartName.value = '';
    if (cartOrderNote) {
      cartOrderNote.value = '';
      cartOrderNote.style.height = 'auto';
    }
    if (cartBadge) cartBadge.style.display = 'none';

    this.updateCouponUI();
    this.updateDiscountTaxUI();
    this.renderCart();
  }

  getCartTotals() {
    const subtotal = this.cart.reduce((sum, item) => sum + item.subtotal, 0);

    let discountAmount = 0;
    const dVal = Math.max(0, parseFloat(this.discountValue) || 0);
    if (this.discountType === 'flat') {
      discountAmount = dVal;
    } else {
      discountAmount = (subtotal * dVal) / 100;
    }
    discountAmount = Math.min(subtotal, discountAmount);

    const taxableSubtotal = Math.max(0, subtotal - discountAmount);

    let taxAmount = 0;
    const tVal = Math.max(0, parseFloat(this.taxValue) || 0);
    if (this.taxType === 'flat') {
      taxAmount = tVal;
    } else {
      taxAmount = (taxableSubtotal * tVal) / 100;
    }

    const grandTotal = Math.max(0, taxableSubtotal + taxAmount);
    return { subtotal, discountAmount, taxAmount, grandTotal };
  }

  updateDiscountTaxUI() {
    const discPills = document.querySelectorAll('#discountModeToggle .btn-toggle-mode');
    discPills.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === this.discountType);
    });
    const discSymbol = document.getElementById('discountUnitPrefix');
    if (discSymbol) discSymbol.innerText = this.discountType === 'percent' ? '%' : '৳';

    const discInput = document.getElementById('discountInput');
    if (discInput) {
      if (this.discountType === 'percent') {
        discInput.setAttribute('max', '100');
      } else {
        discInput.removeAttribute('max');
      }
      if (document.activeElement !== discInput) {
        discInput.value = this.discountValue;
      }
    }

    const taxPills = document.querySelectorAll('#taxModeToggle .btn-toggle-mode');
    taxPills.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === this.taxType);
    });
    const taxSymbol = document.getElementById('taxUnitPrefix');
    if (taxSymbol) taxSymbol.innerText = this.taxType === 'percent' ? '%' : '৳';

    const taxInput = document.getElementById('taxInput');
    if (taxInput) {
      if (this.taxType === 'percent') {
        taxInput.setAttribute('max', '100');
      } else {
        taxInput.removeAttribute('max');
      }
      if (document.activeElement !== taxInput) {
        taxInput.value = this.taxValue;
      }
    }
  }

  applyCoupon(code) {
    if (!code) {
      alert('অনুগ্রহ করে কুপন কোড ইনপুট দিন!');
      return;
    }
    const cleanCode = code.trim().toUpperCase();
    this.coupons = JSON.parse(localStorage.getItem('pos_coupons')) || (typeof INITIAL_COUPONS !== 'undefined' ? INITIAL_COUPONS : []);
    const coupon = this.coupons.find(c => c.code.toUpperCase() === cleanCode);

    if (!coupon) {
      alert(`'${cleanCode}' নামের কোনো কুপন পাওয়া যায়নি!`);
      return;
    }

    if (coupon.status !== 'active') {
      alert(`'${cleanCode}' কুপনটি বর্তমানে নিষ্ক্রিয় রয়েছে!`);
      return;
    }

    const subtotal = this.cart.reduce((sum, item) => sum + item.subtotal, 0);
    if (coupon.minOrder && subtotal < parseFloat(coupon.minOrder)) {
      alert(`'${cleanCode}' কুপনটির জন্য সর্বনিম্ন ৳${coupon.minOrder} কেনাকাটা প্রয়োজন! আপনার বর্তমান সাবটোটাল ৳${subtotal.toFixed(2)}।`);
      return;
    }

    this.appliedCoupon = coupon;
    this.discountType = coupon.discountType || 'percent';
    this.discountValue = parseFloat(coupon.discountValue) || 0;

    const discInput = document.getElementById('discountInput');
    if (discInput) discInput.value = this.discountValue;

    this.updateCouponUI();
    this.updateDiscountTaxUI();
    this.renderCart();

    const discSymbol = this.discountType === 'percent' ? '%' : '৳';
    alert(`কুপন '${coupon.code}' সফলভাবে প্রয়োগ করা হয়েছে! (${this.discountValue}${discSymbol} ছাড়)`);
  }

  removeCoupon() {
    this.appliedCoupon = null;
    this.discountType = this.settings.defaultDiscountMode || 'percent';
    this.discountValue = this.settings.defaultDiscountValue !== undefined ? parseFloat(this.settings.defaultDiscountValue) || 0 : 0;

    const discInput = document.getElementById('discountInput');
    if (discInput) discInput.value = this.discountValue;

    const couponInput = document.getElementById('couponInput');
    if (couponInput) couponInput.value = '';

    this.updateCouponUI();
    this.updateDiscountTaxUI();
    this.renderCart();
  }

  updateCouponUI() {
    const badge = document.getElementById('activeCouponBadge');
    const inputContainer = document.getElementById('couponInputContainer');
    const appliedCodeEl = document.getElementById('appliedCouponCode');
    const couponInput = document.getElementById('couponInput');

    if (this.appliedCoupon) {
      if (badge) badge.style.display = 'inline-flex';
      if (inputContainer) inputContainer.style.display = 'none';
      if (appliedCodeEl) {
        const symbol = this.appliedCoupon.discountType === 'percent' ? '%' : '৳';
        appliedCodeEl.innerText = `${this.appliedCoupon.code} (${this.appliedCoupon.discountValue}${symbol} ছাড়)`;
      }
    } else {
      if (badge) badge.style.display = 'none';
      if (inputContainer) inputContainer.style.display = 'flex';
      if (couponInput) couponInput.value = '';
    }
  }

  renderCart(force = false) {
    const cartList = document.getElementById('cartItemsList');
    const badge = document.getElementById('cartCountBadge');
    const totalItems = this.cart.reduce((sum, i) => sum + i.quantity, 0);
    if (badge) badge.innerText = `${totalItems} আইটেম`;

    const currentCartJSON = JSON.stringify(this.cart);
    const cartChanged = force || this.lastRenderedCartJSON !== currentCartJSON;

    if (cartChanged && cartList) {
      this.lastRenderedCartJSON = currentCartJSON;
      if (this.cart.length === 0) {
        cartList.innerHTML = `
          <div class="empty-cart-state">
            <i class="fa-solid fa-barcode-read"></i>
            <p>কার্ট খালি রয়েছে</p>
            <small>বারকোড স্ক্যান করুন অথবা ক্লিক করে ভেরিয়েন্ট যোগ করুন</small>
          </div>`;
      } else {
        cartList.innerHTML = this.cart.map(item => `
          <div class="cart-item" data-variant-id="${item.variantId}">
            <div class="cart-item-top">
              <h5 class="cart-item-title" title="${item.name}">${item.name}</h5>
              <span class="cart-item-variant">(${item.color} / ${item.size})</span>
            </div>
            <div class="cart-item-bottom">
              <div class="cart-qty-wrap">
                <div class="cart-qty-controls">
                  <button class="qty-btn" onclick="cashier.updateCartQty('${item.variantId}', -1)">-</button>
                  <input type="number" class="qty-val-input" value="${item.quantity}" min="1" onchange="cashier.setCartQty('${item.variantId}', this.value)" onfocus="this.select()" title="কোয়ান্টিটি সরাসরি টাইপ করতে ক্লিক করুন">
                  <button class="qty-btn" onclick="cashier.updateCartQty('${item.variantId}', 1)">+</button>
                </div>
                <span class="unit-price-breakdown">৳${item.price} × ${item.quantity}</span>
              </div>
              <div class="cart-item-price-actions">
                <span class="cart-item-subtotal">৳${item.subtotal}</span>
                <button class="btn-remove-item" onclick="cashier.removeFromCart('${item.variantId}')" title="আইটেম মুছুন"><i class="fa-solid fa-trash-can"></i></button>
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    const totals = this.getCartTotals();
    const subtotalEl = document.getElementById('cartSubtotal');
    const grandTotalEl = document.getElementById('cartGrandTotal');
    if (subtotalEl) subtotalEl.innerText = `৳${totals.subtotal.toFixed(2)}`;
    if (grandTotalEl) grandTotalEl.innerText = `৳${totals.grandTotal.toFixed(2)}`;

    const mobileCartCount = document.getElementById('mobileCartCount');
    const mobileCartTotal = document.getElementById('mobileCartTotal');
    if (mobileCartCount) mobileCartCount.innerText = totalItems;
    if (mobileCartTotal) mobileCartTotal.innerText = `৳${totals.grandTotal.toFixed(2)}`;

    const hasItems = this.cart.length > 0;
    const payCashBtn = document.getElementById('payCashBtn');
    const payEpayBtn = document.getElementById('payEpayBtn');
    if (payCashBtn) payCashBtn.disabled = !hasItems;
    if (payEpayBtn) payEpayBtn.disabled = !hasItems;
  }

  // CASH PAYMENT FLOW
  openCashModal() {
    const totals = this.getCartTotals();
    const grandTotal = totals.grandTotal;
    document.getElementById('cashModalTotal').innerText = `৳${grandTotal.toFixed(2)}`;

    const tenderedInput = document.getElementById('cashTenderedInput');
    if (tenderedInput) {
      tenderedInput.value = '';
      tenderedInput.placeholder = `${grandTotal.toFixed(2)} (গ্রাহকের জমা টাকা টাইপ করুন)`;
    }

    this.prefillCustomerInModal('cash');
    this.openModal('cashPaymentModal');
    this.calculateCashChange();
    setTimeout(() => tenderedInput && tenderedInput.focus(), 100);
  }

  calculateCashChange() {
    const totals = this.getCartTotals();
    const grandTotal = totals.grandTotal;
    const tenderedInput = document.getElementById('cashTenderedInput');
    const rawVal = tenderedInput ? tenderedInput.value.trim() : '';
    const changeLabel = document.getElementById('cashChangeLabel');
    const changeEl = document.getElementById('cashChangeAmount');
    const statusBox = document.getElementById('cashStatusBox');
    const confirmBtn = document.getElementById('confirmCashPayBtn');

    if (rawVal === '') {
      // 1. Initial state: Empty input, customer will pay exact grandTotal
      if (changeLabel) changeLabel.innerHTML = '<i class="fa-solid fa-circle-info"></i> কাস্টমার থেকে পাবেন (প্রদেয় বিল):';
      if (changeEl) {
        changeEl.innerText = `৳${grandTotal.toFixed(2)}`;
        changeEl.style.color = 'var(--accent-blue)';
      }
      if (statusBox) {
        statusBox.style.background = 'rgba(56, 189, 248, 0.1)';
        statusBox.style.borderColor = 'rgba(56, 189, 248, 0.3)';
      }
      if (confirmBtn) confirmBtn.disabled = true;
      return;
    }

    const tendered = parseFloat(rawVal) || 0;
    const diff = tendered - grandTotal;

    if (diff > 0.001) {
      // 2. Tendered > Total Bill: Customer receives change / refund
      if (changeLabel) changeLabel.innerHTML = '<i class="fa-solid fa-hand-holding-dollar"></i> কাস্টমারকে ক্যাশ ব্যাক / রিফান্ড দিন (Change Return):';
      if (changeEl) {
        changeEl.innerText = `৳${diff.toFixed(2)}`;
        changeEl.style.color = '#10b981';
      }
      if (statusBox) {
        statusBox.style.background = 'rgba(16, 185, 129, 0.14)';
        statusBox.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      }
      if (confirmBtn) confirmBtn.disabled = false;
    } else if (Math.abs(diff) <= 0.001) {
      // 3. Exact Payment
      if (changeLabel) changeLabel.innerHTML = '<i class="fa-solid fa-circle-check"></i> সম্পূর্ণ পরিশোধিত (Exact Payment):';
      if (changeEl) {
        changeEl.innerText = `৳0.00 (কোনো ক্যাশ ব্যাক দেওয়া লাগবে না)`;
        changeEl.style.color = '#10b981';
      }
      if (statusBox) {
        statusBox.style.background = 'rgba(16, 185, 129, 0.14)';
        statusBox.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      }
      if (confirmBtn) confirmBtn.disabled = false;
    } else {
      // 4. Shortage: Tendered < Total Bill
      const shortage = Math.abs(diff);
      if (changeLabel) changeLabel.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> অপর্যাপ্ত ক্যাশ জমা (Shortage Amount):';
      if (changeEl) {
        changeEl.innerText = `কম দেওয়া হয়েছে: ৳${shortage.toFixed(2)} (প্রদেয় বিল: ৳${grandTotal.toFixed(2)})`;
        changeEl.style.color = '#ef4444';
      }
      if (statusBox) {
        statusBox.style.background = 'rgba(239, 68, 68, 0.14)';
        statusBox.style.borderColor = 'rgba(239, 68, 68, 0.4)';
      }
      if (confirmBtn) confirmBtn.disabled = true;
    }
  }

  processCashPayment() {
    const totals = this.getCartTotals();
    const grandTotal = totals.grandTotal;
    const rawVal = (document.getElementById('cashTenderedInput')?.value || '').trim();
    const tendered = parseFloat(rawVal);

    if (isNaN(tendered) || tendered < grandTotal - 0.001) {
      alert(`প্রদেয় বিল ৳${grandTotal.toFixed(2)} এর চেয়ে কম টাকা গ্রহণ করা যাবে না! অনুগ্রহ করে ৳${grandTotal.toFixed(2)} বা তার বেশি টাকা জমা লিখুন।`);
      return;
    }
    const change = tendered - grandTotal;

    const custFirstName = document.getElementById('cashCustFirstName')?.value.trim() || '';
    const custLastName = document.getElementById('cashCustLastName')?.value.trim() || '';
    const cartName = document.getElementById('cartCustName')?.value.trim() || '';
    const modalName = `${custFirstName} ${custLastName}`.trim();
    const selectVal = document.getElementById('customerSelect')?.value || '';
    const custName = modalName || cartName || (selectVal !== 'Walk-in Customer' ? selectVal : 'Walk-in Customer');
    const custPhone = document.getElementById('cashCustPhone')?.value.trim() || document.getElementById('cartCustPhone')?.value.trim() || '';
    const custEmail = document.getElementById('cashCustEmail')?.value.trim() || '';
    const custAddress = document.getElementById('cashCustAddress')?.value.trim() || '';

    if (custEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(custEmail)) {
      alert('অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা লিখুন (যেমন: customer@gmail.com)!');
      return;
    }

    const custInfo = this.updateOrCreateCustomerOnSale(custPhone, custFirstName, custLastName, custName, custEmail, custAddress, totals.grandTotal);

    if (custInfo && custInfo.status === 'blocked') {
      alert(`⚠️ কাস্টমার '${custInfo.name}' কে ব্লকলিস্টভুক্ত করা হয়েছে!\nএই অ্যাকাউন্ট থেকে কেনাকাটা বা পেমেন্ট সম্পন্ন করা যাবে না।`);
      return;
    }

    const orderNote = (document.getElementById('cartOrderNote')?.value || '').trim();

    const saleRecord = {
      id: `INV-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}${String(new Date().getDate()).padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      customerId: custInfo.id,
      customer: custInfo.name,
      customerPhone: custInfo.phone,
      customerEmail: custInfo.email,
      customerAddress: custInfo.address,
      orderNote: orderNote,
      items: this.cart.map(i => ({
        id: i.productId,
        variantId: i.variantId,
        barcode: i.barcode,
        name: i.name,
        color: i.color,
        size: i.size,
        price: i.price,
        cost: i.cost,
        quantity: i.quantity,
        subtotal: i.subtotal
      })),
      subtotal: totals.subtotal,
      discount: totals.discountAmount,
      couponCode: this.appliedCoupon ? this.appliedCoupon.code : null,
      couponDiscount: this.appliedCoupon ? totals.discountAmount : 0,
      manualDiscount: this.appliedCoupon ? 0 : totals.discountAmount,
      discountType: this.discountType,
      discountValue: this.discountValue,
      tax: totals.taxAmount,
      taxType: this.taxType,
      taxValue: this.taxValue,
      grandTotal: totals.grandTotal,
      paymentMethod: 'CASH',
      paymentDetails: { cashReceived: tendered, changeGiven: change }
    };

    this.completeSale(saleRecord);
    this.closeModal('cashPaymentModal');
  }

  // E-PAYMENT FLOW
  updateEpayNoticeBox(provider) {
    const gateways = JSON.parse(localStorage.getItem('pos_payment_gateways')) || (typeof DEFAULT_PAYMENT_GATEWAYS !== 'undefined' ? DEFAULT_PAYMENT_GATEWAYS : {});
    const gw = gateways[provider] || {};

    const numEl = document.getElementById('epayGwAccountNum');
    const noteEl = document.getElementById('epayGwInstructionText');

    if (numEl) numEl.innerText = gw.accountNumber || '01700-000000';
    if (noteEl) noteEl.innerText = gw.instructions || 'পেমেন্ট সম্পন্ন করে TrxID ইনপুট দিন।';
  }

  openEpayModal() {
    const totals = this.getCartTotals();
    document.getElementById('epayModalTotal').innerText = `৳${totals.grandTotal.toFixed(2)}`;
    document.getElementById('epayAccountInput').value = '';
    document.getElementById('epayTrxInput').value = `TRX${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    this.prefillCustomerInModal('epay');

    const gateways = JSON.parse(localStorage.getItem('pos_payment_gateways')) || (typeof DEFAULT_PAYMENT_GATEWAYS !== 'undefined' ? DEFAULT_PAYMENT_GATEWAYS : {});
    
    const cards = document.querySelectorAll('.epay-card');
    let firstAvailable = null;
    cards.forEach(card => {
      const p = card.dataset.provider;
      const isEnabled = gateways[p] ? gateways[p].enabled !== false : true;
      card.style.display = isEnabled ? 'flex' : 'none';
      if (isEnabled && !firstAvailable) firstAvailable = p;
    });

    if (gateways[this.selectedEpayProvider]?.enabled === false && firstAvailable) {
      this.selectedEpayProvider = firstAvailable;
    }

    cards.forEach(card => {
      card.classList.toggle('active', card.dataset.provider === this.selectedEpayProvider);
    });

    this.updateEpayNoticeBox(this.selectedEpayProvider);
    this.openModal('epayPaymentModal');
  }

  processEpayPayment() {
    const totals = this.getCartTotals();
    const accountNo = document.getElementById('epayAccountInput').value.trim() || '017XXXXXXXX';
    const trxId = document.getElementById('epayTrxInput').value.trim() || `TRX${Date.now()}`;

    const custFirstName = document.getElementById('epayCustFirstName')?.value.trim() || '';
    const custLastName = document.getElementById('epayCustLastName')?.value.trim() || '';
    const cartName = document.getElementById('cartCustName')?.value.trim() || '';
    const modalName = `${custFirstName} ${custLastName}`.trim();
    const selectVal = document.getElementById('customerSelect')?.value || '';
    const custName = modalName || cartName || (selectVal !== 'Walk-in Customer' ? selectVal : 'Walk-in Customer');
    const custPhone = document.getElementById('epayCustPhone')?.value.trim() || document.getElementById('cartCustPhone')?.value.trim() || '';
    const custEmail = document.getElementById('epayCustEmail')?.value.trim() || '';
    const custAddress = document.getElementById('epayCustAddress')?.value.trim() || '';

    if (custEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(custEmail)) {
      alert('অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা লিখুন (যেমন: customer@gmail.com)!');
      return;
    }

    const custInfo = this.updateOrCreateCustomerOnSale(custPhone, custFirstName, custLastName, custName, custEmail, custAddress, totals.grandTotal);

    if (custInfo && custInfo.status === 'blocked') {
      alert(`⚠️ কাস্টমার '${custInfo.name}' কে ব্লকলিস্টভুক্ত করা হয়েছে!\nএই অ্যাকাউন্ট থেকে কেনাকাটা বা পেমেন্ট সম্পন্ন করা যাবে না।`);
      return;
    }

    const orderNote = (document.getElementById('cartOrderNote')?.value || '').trim();

    const saleRecord = {
      id: `INV-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}${String(new Date().getDate()).padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      customerId: custInfo.id,
      customer: custInfo.name,
      customerPhone: custInfo.phone,
      customerEmail: custInfo.email,
      customerAddress: custInfo.address,
      orderNote: orderNote,
      items: this.cart.map(i => ({
        id: i.productId,
        variantId: i.variantId,
        barcode: i.barcode,
        name: i.name,
        color: i.color,
        size: i.size,
        price: i.price,
        cost: i.cost,
        quantity: i.quantity,
        subtotal: i.subtotal
      })),
      subtotal: totals.subtotal,
      discount: totals.discountAmount,
      couponCode: this.appliedCoupon ? this.appliedCoupon.code : null,
      couponDiscount: this.appliedCoupon ? totals.discountAmount : 0,
      manualDiscount: this.appliedCoupon ? 0 : totals.discountAmount,
      discountType: this.discountType,
      discountValue: this.discountValue,
      tax: totals.taxAmount,
      taxType: this.taxType,
      taxValue: this.taxValue,
      grandTotal: totals.grandTotal,
      paymentMethod: 'EPAY',
      paymentDetails: { provider: this.selectedEpayProvider, accountNo, trxId }
    };

    this.completeSale(saleRecord);
    this.closeModal('epayPaymentModal');
  }

  completeSale(saleRecord) {
    // Deduct stock per variant
    saleRecord.items.forEach(item => {
      const prod = this.products.find(p => p.id === item.id);
      if (prod && prod.variants) {
        const v = prod.variants.find(varObj => varObj.variantId === item.variantId);
        if (v) {
          v.stock = Math.max(0, v.stock - item.quantity);
        }
      }
    });

    this.sales.unshift(saleRecord);
    localStorage.setItem('pos_products', JSON.stringify(this.products));
    localStorage.setItem('pos_sales', JSON.stringify(this.sales));

    this.playAudioBeep('success');
    if (window.confetti) confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });

    this.renderProducts();
    this.renderShiftSales();
    this.showReceiptModal(saleRecord, true);
    this.clearCart();
  }

  showReceiptModal(saleRecord, isNewSale = false) {
    const s = this.settings || JSON.parse(localStorage.getItem('pos_settings')) || {};
    const sub = JSON.parse(localStorage.getItem('pos_subscription')) || {};
    const sym = s.currencySymbol || '৳';

    const storeNameText = s.storeName || sub.storeName || 'Super Shop Dhaka';
    const storeAddrText = s.storeAddress || sub.storeAddress || 'Mirpur 10, Dhaka - 1216';
    const storePhoneText = s.storePhone || sub.phone || sub.storePhone || '+880 1700-000000';
    const storeEmailText = s.storeEmail || sub.email || '';
    const logoSrc = s.invoiceLogo || s.storeLogo || sub.invoiceLogo || sub.storeLogo || '';

    const logoImg = document.getElementById('rcptStoreLogoImg');
    const storeTitleEl = document.getElementById('rcptStoreTitle');
    const storeAddressEl = document.getElementById('rcptStoreAddress');
    const storePhoneEl = document.getElementById('rcptStorePhone');
    const storeEmailEl = document.getElementById('rcptStoreEmail');

    if (logoImg) {
      if (logoSrc) {
        convertLogoToThermalBW(logoSrc, (processedDataUrl) => {
          logoImg.src = processedDataUrl;
          logoImg.style.display = 'block';
        });
      } else {
        logoImg.style.display = 'none';
      }
    }

    if (storeTitleEl) {
      storeTitleEl.innerText = storeNameText;
      storeTitleEl.style.display = 'block';
    }

    if (storeAddressEl) {
      storeAddressEl.innerText = storeAddrText;
      storeAddressEl.style.display = 'block';
    }

    if (storePhoneEl) {
      storePhoneEl.innerText = `Mobile: ${storePhoneText}`;
      storePhoneEl.style.display = 'block';
    }

    if (storeEmailEl) {
      if (storeEmailText && s.showInvoiceEmail !== false) {
        storeEmailEl.innerText = `Email: ${storeEmailText}`;
        storeEmailEl.style.display = 'block';
      } else {
        storeEmailEl.style.display = 'none';
      }
    }

    const footerNoteEl = document.querySelector('#printableReceipt .receipt-footer .thank-you');
    if (footerNoteEl) {
      footerNoteEl.innerText = s.receiptFooterNote || 'Thank you! Come again.';
      footerNoteEl.style.display = s.showInvoiceFooter !== false ? 'block' : 'none';
    }

    document.getElementById('rcptInvId').innerText = saleRecord.id;
    document.getElementById('rcptDate').innerText = new Date(saleRecord.timestamp).toLocaleString('en-US');
    document.getElementById('rcptCustomer').innerText = saleRecord.customer || 'Walk-in Customer';

    const phoneRow = document.getElementById('rcptPhoneRow');
    const addressRow = document.getElementById('rcptAddressRow');
    if (phoneRow) {
      if (saleRecord.customerPhone) {
        document.getElementById('rcptPhone').innerText = saleRecord.customerPhone;
        phoneRow.style.display = 'flex';
      } else {
        phoneRow.style.display = 'none';
      }
    }
    if (addressRow) {
      if (saleRecord.customerAddress) {
        document.getElementById('rcptAddress').innerText = saleRecord.customerAddress;
        addressRow.style.display = 'flex';
      } else {
        addressRow.style.display = 'none';
      }
    }

    const itemsBody = document.getElementById('rcptItemsBody');
    if (itemsBody) {
      itemsBody.innerHTML = saleRecord.items.map(i => `
        <tr>
          <td class="col-name">
            <span class="item-name">${i.name}</span>
            ${(i.color || i.size) ? `<small class="item-variant">(${i.color || ''} ${i.size ? '/ ' + i.size : ''})</small>` : ''}
          </td>
          <td class="col-qty text-center">${i.quantity} × ${this.settings?.currencySymbol || '৳'}${i.price}</td>
          <td class="col-price text-right">${this.settings?.currencySymbol || '৳'}${i.subtotal.toFixed(2)}</td>
        </tr>
      `).join('');
    }

    const subtotalEl = document.getElementById('rcptSubtotal');
    if (subtotalEl) subtotalEl.innerText = `${this.settings?.currencySymbol || '৳'}${saleRecord.subtotal.toFixed(2)}`;

    const discEl = document.getElementById('rcptDiscount');
    if (discEl) discEl.innerText = `${this.settings?.currencySymbol || '৳'}${saleRecord.discount.toFixed(2)}`;

    const taxEl = document.getElementById('rcptTax');
    if (taxEl) taxEl.innerText = `${this.settings?.currencySymbol || '৳'}${saleRecord.tax.toFixed(2)}`;

    const grandEl = document.getElementById('rcptGrandTotal');
    if (grandEl) grandEl.innerText = `${sym}${saleRecord.grandTotal.toFixed(2)}`;

    const methodEl = document.getElementById('rcptMethod');
    if (methodEl) methodEl.innerText = saleRecord.paymentMethod === 'CASH' ? 'Cash (CASH)' : `E-Pay (${saleRecord.paymentDetails.provider})`;

    const payRow = document.getElementById('rcptPayDetailsRow');
    const changeRow = document.getElementById('rcptChangeRow');

    if (saleRecord.paymentMethod === 'CASH') {
      const paidLabel = document.getElementById('rcptPaidLabel');
      const paidVal = document.getElementById('rcptPaidVal');
      const changeVal = document.getElementById('rcptChangeVal');

      if (paidLabel) paidLabel.innerText = 'Cash Received:';
      if (paidVal) paidVal.innerText = `${sym}${saleRecord.paymentDetails.cashReceived.toFixed(2)}`;
      if (changeVal) changeVal.innerText = `${sym}${saleRecord.paymentDetails.changeGiven.toFixed(2)}`;

      if (payRow) payRow.style.display = 'table-row';
      if (changeRow) changeRow.style.display = 'table-row';
    } else {
      const paidLabel = document.getElementById('rcptPaidLabel');
      const paidVal = document.getElementById('rcptPaidVal');

      if (paidLabel) paidLabel.innerText = 'TrxID:';
      if (paidVal) paidVal.innerText = saleRecord.paymentDetails.trxId || 'N/A';

      if (payRow) payRow.style.display = 'table-row';
      if (changeRow) changeRow.style.display = 'none';
    }

    const noteBox = document.getElementById('rcptOrderNoteBox');
    const orderNoteStr = (saleRecord.orderNote || saleRecord.note || '').trim();

    if (noteBox) {
      if (orderNoteStr) {
        const safeNote = String(orderNoteStr).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        noteBox.innerHTML = `<strong style="font-weight: 700; color: #000; display: inline;">Note: </strong><span style="font-weight: 500; color: #111; word-break: break-word; overflow-wrap: break-word; white-space: pre-wrap; display: inline;">${safeNote}</span>`;
        noteBox.style.display = 'block';
      } else {
        noteBox.style.display = 'none';
      }
    }

    if (typeof JsBarcode !== 'undefined') {
      JsBarcode("#rcptBarcodeSvg", saleRecord.id, {
        format: "CODE128", width: 1.8, height: 48, displayValue: true, fontSize: 13, fontOptions: "bold", font: "monospace",
        marginTop: 8, marginBottom: 8, marginLeft: 18, marginRight: 18,
        background: "#ffffff", lineColor: "#000000"
      });
    }

    this.openModal('receiptModal');

    const paperEl = document.getElementById('printableReceipt');
    const container = paperEl ? paperEl.closest('.receipt-feed-container') : null;
    const scanline = container ? container.querySelector('.thermal-feed-scanline') : null;
    const statusIndicator = container ? container.querySelector('.slot-status-indicator') : null;
    const statusText = container ? container.querySelector('.slot-status-text') : null;

    if (isNewSale) {
      // New Checkout: Play animation & trigger physical POS printer output
      setTimeout(() => {
        this.playInModalReceiptPrint('printableReceipt', true);
      }, 200);
    } else {
      // Past Invoice History Inspection: Static display only (no animation, no auto-print)
      if (paperEl) {
        paperEl.style.transform = 'translateY(0)';
        paperEl.style.opacity = '1';
      }
      if (scanline) scanline.style.display = 'none';
      if (statusIndicator) statusIndicator.classList.remove('printing');
      if (statusText) statusText.innerText = 'Ready';
    }
  }

  promptAdminPin() {
    const input = document.getElementById('adminPinInput');
    if (input) input.value = '';
    this.openModal('adminPinModal');
  }

  verifyAdminPin() {
    const input = document.getElementById('adminPinInput');
    const entered = input ? input.value.trim() : '';
    const expectedPin = (this.settings && this.settings.adminPin) ? this.settings.adminPin : '1234';

    if (entered === expectedPin) {
      this.closeModal('adminPinModal');
      this.showToast('এডমিন পিন ভেরিফাইড! এডমিন প্যানেলে রিডাইরেক্ট করা হচ্ছে...');
      setTimeout(() => {
        window.location.href = 'admin.html';
      }, 500);
    } else {
      this.playAudioBeep('error');
      this.showToast('ভুল এডমিন সিকিউরিটি পিন! পুনরায় চেষ্টা করুন।', 'error');
    }
  }

  // Camera Scanner
  openCameraScanner() {
    this.openModal('scannerModal');
    if (!this.html5QrcodeScanner) {
      this.html5QrcodeScanner = new Html5Qrcode("reader");
    }
    const config = { fps: 10, qrbox: { width: 250, height: 150 } };
    this.html5QrcodeScanner.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        this.handleBarcodeScan(decodedText);
        this.closeModal('scannerModal');
      },
      () => {}
    ).catch(err => console.error(err));
  }

  stopCameraScanner() {
    if (this.html5QrcodeScanner && this.html5QrcodeScanner.isScanning) {
      this.html5QrcodeScanner.stop().catch(err => console.error(err));
    }
  }

  // Helper: get provider-specific badge config for a sale (retains payment method name + refund status)
  getPaymentBadge(s) {
    const pm = (s.paymentMethod || 'CASH').toUpperCase();
    const prov = ((s.paymentDetails && s.paymentDetails.provider) || '').toLowerCase();

    let base = { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: '💵 CASH', name: 'CASH' };
    if (pm === 'EPAY' || prov !== '') {
      if (prov.includes('bkash')) {
        base = { bg: 'rgba(233,30,140,0.15)', color: '#e91e8c', label: '📱 bKash', name: 'bKash' };
      } else if (prov.includes('nagad')) {
        base = { bg: 'rgba(249,115,22,0.15)', color: '#f97316', label: '📲 Nagad', name: 'Nagad' };
      } else if (prov.includes('qr') || prov.includes('bangla')) {
        base = { bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6', label: '🔲 Bangla QR', name: 'Bangla QR' };
      } else if (prov.includes('card')) {
        base = { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', label: '💳 Card', name: 'Card' };
      } else {
        const pName = (s.paymentDetails?.provider || 'E-PAY').toUpperCase();
        base = { bg: 'rgba(6,182,212,0.15)', color: '#06b6d4', label: `📱 ${pName}`, name: pName };
      }
    }

    const isReturned = s.status === 'RETURNED';
    const isPartial = s.status === 'PARTIALLY_RETURNED' || (!isReturned && (s.refundedAmount || 0) > 0);

    if (isReturned) {
      return {
        bg: base.bg,
        color: base.color,
        label: `<div style="display:inline-flex; flex-direction:column; align-items:flex-start; line-height:1.2;"><span>${base.label}</span><span style="font-size:0.68rem; color:#ef4444; font-weight:800; margin-top:2px;"><i class="fa-solid fa-rotate-left"></i> 🔴 Refunded</span></div>`,
        name: base.name
      };
    }

    if (isPartial) {
      return {
        bg: base.bg,
        color: base.color,
        label: `<div style="display:inline-flex; flex-direction:column; align-items:flex-start; line-height:1.2;"><span>${base.label}</span><span style="font-size:0.68rem; color:#f59e0b; font-weight:800; margin-top:2px;"><i class="fa-solid fa-rotate-left"></i> 🟠 Partial Refund</span></div>`,
        name: base.name
      };
    }

    if (s.status === 'EXCHANGED') {
      return {
        bg: base.bg,
        color: base.color,
        label: `<div style="display:inline-flex; flex-direction:column; align-items:flex-start; line-height:1.2;"><span>${base.label}</span><span style="font-size:0.68rem; color:#8b5cf6; font-weight:800; margin-top:2px;"><i class="fa-solid fa-rotate-left"></i> 🔄 Exchanged</span></div>`,
        name: base.name
      };
    }

    return base;
  }

  // Cashier E-Pay Breakdown Modal
  openCashierEpayBreakdownModal(filterProvider = 'all') {
    const targetSales = this.getCashierFilteredSales();
    const epaySales = targetSales.filter(s => (s.paymentMethod || '').toUpperCase() === 'EPAY' || (s.paymentDetails && (s.paymentDetails.method || '').toLowerCase() === 'epay'));

    // Provider totals calculation (NET of refunds)
    const pt = { bKash: 0, Nagad: 0, 'Bangla QR': 0, Card: 0, Other: 0 };
    const ptRefunds = { bKash: 0, Nagad: 0, 'Bangla QR': 0, Card: 0, Other: 0 };

    epaySales.forEach(s => {
      const p = ((s.paymentDetails && s.paymentDetails.provider) || '').toLowerCase();
      const refunded = s.refundedAmount || 0;
      const netAmt = Math.max(0, (s.grandTotal || 0) - refunded);

      if (p.includes('bkash')) { pt.bKash += netAmt; ptRefunds.bKash += refunded; }
      else if (p.includes('nagad')) { pt.Nagad += netAmt; ptRefunds.Nagad += refunded; }
      else if (p.includes('qr') || p.includes('bangla')) { pt['Bangla QR'] += netAmt; ptRefunds['Bangla QR'] += refunded; }
      else if (p.includes('card')) { pt.Card += netAmt; ptRefunds.Card += refunded; }
      else { pt.Other += netAmt; ptRefunds.Other += refunded; }
    });

    // Filter
    let displaySales = epaySales;
    if (filterProvider !== 'all') {
      displaySales = epaySales.filter(s => {
        const p = ((s.paymentDetails && s.paymentDetails.provider) || '').toLowerCase();
        if (filterProvider === 'bKash') return p.includes('bkash');
        if (filterProvider === 'Nagad') return p.includes('nagad');
        if (filterProvider === 'BanglaQR') return p.includes('qr') || p.includes('bangla');
        if (filterProvider === 'Card') return p.includes('card');
        return true;
      });
    }

    const total = displaySales.reduce((s, x) => s + Math.max(0, (x.grandTotal || 0) - (x.refundedAmount || 0)), 0);
    const totalRefunds = displaySales.reduce((s, x) => s + (x.refundedAmount || 0), 0);
    const totalEl = document.getElementById('cashierEpayModalTotal');
    const countEl = document.getElementById('cashierEpayModalCount');
    if (totalEl) {
      totalEl.innerHTML = `৳${total.toFixed(2)}${totalRefunds > 0 ? `<small style="font-size:0.75rem; color:#ef4444; margin-left:6px;">(-৳${totalRefunds.toFixed(2)} refund)</small>` : ''}`;
    }
    if (countEl) countEl.innerText = `${displaySales.length} টি`;

    // Provider mini-stat cards
    const provStatsEl = document.getElementById('cashierEpayProviderStats');
    if (provStatsEl) {
      const cfg = [
        { key: 'bKash', filter: 'bKash', label: 'bKash', bg: 'rgba(233,30,140,0.15)', color: '#e91e8c' },
        { key: 'Nagad', filter: 'Nagad', label: 'Nagad', bg: 'rgba(249,115,22,0.15)', color: '#f97316' },
        { key: 'Bangla QR', filter: 'BanglaQR', label: 'Bangla QR', bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6' },
        { key: 'Card', filter: 'Card', label: 'Card', bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
      ];
      provStatsEl.innerHTML = cfg.map(p => {
        const refStr = ptRefunds[p.key] > 0 ? `<span style="font-size:0.65rem; color:#ef4444;">(-৳${ptRefunds[p.key].toFixed(0)} refund)</span>` : '';
        return `
        <button onclick="cashier.openCashierEpayBreakdownModal('${p.filter}')" style="background:${p.bg}; color:${p.color}; border:1px solid ${p.color}30; font-weight:700; flex:1; min-width:90px; padding:6px 10px; border-radius:8px; cursor:pointer; font-size:0.82rem; display:flex; flex-direction:column; align-items:center; gap:2px;">
          ${p.label}<br><small style="font-size:0.72rem;">৳${pt[p.key].toFixed(0)}</small>${refStr}
        </button>
      `;
      }).join('');
    }

    // Filter tabs
    const tabsEl = document.getElementById('cashierEpayFilterTabs');
    if (tabsEl) {
      const tabs = [{ key: 'all', label: 'সব' }, { key: 'bKash', label: 'bKash' }, { key: 'Nagad', label: 'Nagad' }, { key: 'BanglaQR', label: 'Bangla QR' }, { key: 'Card', label: 'Card' }];
      tabsEl.innerHTML = tabs.map(t => `
        <button onclick="cashier.openCashierEpayBreakdownModal('${t.key}')" style="${filterProvider === t.key ? 'background:var(--accent-orange); color:#fff;' : 'background:var(--bg-card); color:var(--text-muted);'} border:1px solid var(--border-color); padding:5px 12px; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.82rem;">${t.label}</button>
      `).join('');
    }

    // Table
    const tbody = document.getElementById('cashierEpayTableBody');
    if (tbody) {
      if (displaySales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:1.5rem;">এই প্রোভাইডারের কোনো ই-পে রেকর্ড পাওয়া যায়নি।</td></tr>`;
      } else {
        tbody.innerHTML = displaySales.map(s => {
          const { bg, color, label } = this.getPaymentBadge(s);
          const trxId = s.paymentDetails?.trxId ? `<small style="color:var(--text-muted);">${s.paymentDetails.trxId}</small>` : '';
          const refunded = s.refundedAmount || 0;
          const netAmt = Math.max(0, (s.grandTotal || 0) - refunded);
          return `
            <tr>
              <td><strong>${s.id}</strong><br>${trxId}</td>
              <td><small>${new Date(s.timestamp).toLocaleString('bn-BD')}</small></td>
              <td><span class="badge" style="background:${bg}; color:${color}; font-weight:700; padding:4px 10px; border-radius:6px;">${label}</span></td>
              <td>${s.customer || 'Walk-in Customer'}</td>
              <td style="text-align:right; font-weight:800; color:${s.status === 'RETURNED' ? '#ef4444' : color}; font-size:1.05rem;">
                ৳${netAmt.toFixed(2)}
                ${refunded > 0 ? `<br><small style="color: #ef4444; font-size: 0.7rem;">(-৳${refunded.toFixed(2)} refund)</small>` : ''}
              </td>
            </tr>`;
        }).join('');
      }
    }

    this.openModal('cashierEpayBreakdownModal');
  }

  // Shift Sales Report
  renderShiftSales() {

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    const todaySales = this.sales.filter(s => {
      const saleTime = new Date(s.timestamp).getTime();
      return !isNaN(saleTime) && saleTime >= todayStart && saleTime <= todayEnd;
    });

    const cashTotal = todaySales.filter(s => (s.paymentMethod || '').toUpperCase() !== 'EPAY' && (!s.paymentDetails || (s.paymentDetails.method || '').toLowerCase() !== 'epay')).reduce((sum, s) => sum + Math.max(0, (s.grandTotal || 0) - (s.refundedAmount || 0)), 0);
    const epayTotal = todaySales.filter(s => (s.paymentMethod || '').toUpperCase() === 'EPAY' || (s.paymentDetails && (s.paymentDetails.method || '').toLowerCase() === 'epay')).reduce((sum, s) => sum + Math.max(0, (s.grandTotal || 0) - (s.refundedAmount || 0)), 0);

    document.getElementById('cashierShiftCash').innerText = `৳${cashTotal.toFixed(2)}`;
    document.getElementById('cashierShiftEpay').innerText = `৳${epayTotal.toFixed(2)}`;
    document.getElementById('cashierShiftCount').innerText = `${todaySales.length} টি`;

    const tbody = document.getElementById('cashierShiftTableBody');
    const sortedTodaySales = todaySales.slice().sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    tbody.innerHTML = sortedTodaySales.map(s => {
      const { bg, color, label } = this.getPaymentBadge(s);
      const refunded = s.refundedAmount || 0;
      const netAmt = Math.max(0, (s.grandTotal || 0) - refunded);
      return `
      <tr>
        <td><strong>${s.id}</strong></td>
        <td>${new Date(s.timestamp).toLocaleTimeString('bn-BD')}</td>
        <td>${s.customer}</td>
        <td><span class="badge" style="background:${bg}; color:${color}; font-weight:700; padding:4px 10px; border-radius:6px;">${label}</span></td>
        <td style="text-align:right; font-weight:800; color:${s.status === 'RETURNED' ? '#ef4444' : '#10b981'};">
          ৳${netAmt.toFixed(2)}
          ${refunded > 0 ? `<br><small style="color: #ef4444; font-size: 0.7rem;">(-৳${refunded.toFixed(2)} refund)</small>` : ''}
        </td>
        <td><button class="btn btn-outline btn-sm" onclick="cashier.showReceiptModalById('${s.id}')"><i class="fa-solid fa-receipt"></i> মেমো</button></td>
      </tr>`;
    }).join('');

    this.renderShiftChart(todaySales);
  }

  renderShiftChart(todaySales) {
    const chartCanvas = document.getElementById('cashierShiftChart');
    if (!chartCanvas || typeof Chart === 'undefined') return;

    const hourlyData = {};
    for (let h = 8; h <= 22; h++) {
      const displayH = h === 0 ? 12 : (h > 12 ? h - 12 : h);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const label = `${displayH} ${ampm}`;
      hourlyData[label] = 0;
    }

    (todaySales || []).forEach(s => {
      const date = new Date(s.timestamp);
      const h = date.getHours();
      const displayH = h === 0 ? 12 : (h > 12 ? h - 12 : h);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const label = `${displayH} ${ampm}`;
      if (hourlyData[label] !== undefined) {
        hourlyData[label] += Math.max(0, (s.grandTotal || 0) - (s.refundedAmount || 0));
      }
    });

    const labels = Object.keys(hourlyData);
    const data = Object.values(hourlyData);
    const shiftChartHash = labels.join(',') + '_' + data.join(',');
    if (this._lastShiftChartHash === shiftChartHash && this.shiftChart) return;
    this._lastShiftChartHash = shiftChartHash;

    if (this.shiftChart) this.shiftChart.destroy();

    this.shiftChart = new Chart(chartCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'ঘণ্টাভিত্তিক বিক্রি (৳)',
          data: data,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5
        }]
      },
      options: {
        animation: { duration: 250, easing: 'easeOutQuart' },
        resizeDelay: 100,
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 10, bottom: 5, left: 5, right: 10 }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            callbacks: {
              label: (ctx) => ` বিক্রি: ৳${(ctx.parsed.y || 0).toFixed(2)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#9ca3af',
              font: { family: "'Inter', sans-serif", size: 11 },
              callback: (v) => '৳' + v
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              color: '#cbd5e1',
              font: { family: "'Inter', sans-serif", size: 11 }
            }
          }
        }
      }
    });
  }

  switchTab(tabId) {
    this.activeTab = tabId;

    const navButtons = {
      'cashierDashboardView': 'btnNavDashboard',
      'cashierTerminalView': 'btnNavTerminal',
      'cashierAnalyticsView': 'btnNavAnalytics',
      'cashierShiftView': 'btnNavShiftSales',
      'cashierCustomersView': 'btnNavCustomers'
    };

    const pageTitles = {
      'cashierDashboardView': 'ক্যাশিয়ার ড্যাশবোর্ড ও ওভারভিউ',
      'cashierTerminalView': 'ক্যাশিয়ার সেলস কাউন্টার (POS Terminal)',
      'cashierAnalyticsView': 'কাউন্টার সেলস অ্যানালিটিক্স ও পারফরম্যান্স',
      'cashierShiftView': 'আজকের শিফট রিপোর্ট (Shift Summary)',
      'cashierCustomersView': 'কাস্টমার প্রোফাইল ও সেলস ইতিহাস (Customers Hub)'
    };

    const titleEl = document.getElementById('cashierPageTitle');
    if (titleEl) titleEl.innerText = pageTitles[tabId] || 'ক্যাশিয়ার কাউন্টার';

    Object.keys(navButtons).forEach(viewId => {
      const btn = document.getElementById(navButtons[viewId]);
      const view = document.getElementById(viewId);
      if (btn) btn.classList.toggle('active', viewId === tabId);
      if (view) view.classList.toggle('active', viewId === tabId);
    });

    if (tabId === 'cashierDashboardView') {
      requestAnimationFrame(() => {
        setTimeout(() => this.renderDashboardView(), 40);
      });
    } else if (tabId === 'cashierTerminalView') {
      this.renderProducts();
      this.renderCart();
    } else if (tabId === 'cashierAnalyticsView') {
      requestAnimationFrame(() => {
        setTimeout(() => this.renderAnalyticsView(), 40);
      });
    } else if (tabId === 'cashierShiftView') {
      requestAnimationFrame(() => {
        setTimeout(() => this.renderShiftSales(), 40);
      });
    } else if (tabId === 'cashierCustomersView') {
      this.renderCashierCustomers();
    }
  }

  // 1. DASHBOARD VIEW LOGIC (7 KPI METRICS IN EXACT ORDER)
  renderDashboardView() {
    const todaySales = this.getCashierFilteredSales();

    let totalOrders = todaySales.length;
    let itemsSold = 0;
    let grossItemsSold = 0;
    let returnedItemsSold = 0;
    let cashReceived = 0;
    let epayReceived = 0;
    let totalNetProfit = 0;
    let totalReturnsCount = 0;
    let totalRefundAmount = 0;
    let dashVat = 0;
    let dashCouponDisc = 0;
    let dashManualDisc = 0;

    todaySales.forEach(s => {
      const vatAmt = s.tax || 0;
      const discAmt = s.discount || 0;
      const hasCoupon = Boolean(s.couponCode || s.coupon || (s.couponDiscount && s.couponDiscount > 0));

      dashVat += vatAmt;

      if (hasCoupon) {
        dashCouponDisc += (s.couponDiscount !== undefined ? s.couponDiscount : discAmt);
      } else {
        dashManualDisc += (s.manualDiscount !== undefined ? s.manualDiscount : discAmt);
      }

      const refunded = s.refundedAmount || 0;
      const netGrand = Math.max(0, (s.grandTotal || 0) - refunded);

      if (s.status === 'RETURNED' || s.status === 'PARTIALLY_RETURNED' || (s.returnHistory && s.returnHistory.length > 0)) {
        totalReturnsCount++;
        totalRefundAmount += refunded;
      }

      const pm = (s.paymentMethod || '').toUpperCase();
      const isEpay = pm === 'EPAY' || (s.paymentDetails && (s.paymentDetails.method || '').toLowerCase() === 'epay');
      if (isEpay) {
        epayReceived += netGrand;
      } else {
        cashReceived += netGrand;
      }

      if (s.items && Array.isArray(s.items)) {
        s.items.forEach(i => {
          const origQty = i.quantity || 1;
          const retQty = i.returnedQuantity || 0;
          const netQty = Math.max(0, origQty - retQty);

          grossItemsSold += origQty;
          returnedItemsSold += retQty;
          itemsSold += netQty;

          const cost = i.cost !== undefined ? i.cost : (i.price * 0.8);
          const price = i.price || 0;
          const itemRev = price * netQty;
          totalNetProfit += (itemRev - (cost * netQty));
        });
      }
    });

    const totalRev = cashReceived + epayReceived;
    const totalDashDiscounts = dashCouponDisc + dashManualDisc;
    const netDashVatDisc = dashVat - totalDashDiscounts;

    const elDashVatDisc = document.getElementById('dashVatDiscount');
    if (elDashVatDisc) {
      if (netDashVatDisc > 0) {
        elDashVatDisc.innerText = `+৳${netDashVatDisc.toFixed(2)}`;
        elDashVatDisc.style.color = 'var(--accent-green, #10b981)';
      } else if (netDashVatDisc < 0) {
        elDashVatDisc.innerText = `-৳${Math.abs(netDashVatDisc).toFixed(2)}`;
        elDashVatDisc.style.color = '#ef4444';
      } else {
        elDashVatDisc.innerText = `৳0.00`;
        elDashVatDisc.style.color = 'inherit';
      }
    }

    const saleEl = document.getElementById('dashTotalSale');
    if (saleEl) saleEl.innerText = `৳${totalRev.toFixed(2)}`;

    const cashEl = document.getElementById('dashCashPayment') || document.getElementById('dashCashReceived');
    if (cashEl) cashEl.innerText = `৳${cashReceived.toFixed(2)}`;

    const epayEl = document.getElementById('dashEpayPayment');
    if (epayEl) epayEl.innerText = `৳${epayReceived.toFixed(2)}`;

    const ordersEl = document.getElementById('dashTotalOrders');
    if (ordersEl) ordersEl.innerText = `${totalOrders} টি`;

    const itemsEl = document.getElementById('dashItemsSold');
    if (itemsEl) itemsEl.innerText = `${itemsSold} টি`;

    const retEl = document.getElementById('dashTotalReturns');
    if (retEl) retEl.innerText = `${totalReturnsCount} টি (৳${totalRefundAmount.toFixed(2)})`;

    const revEl = document.getElementById('dashTotalRevenue');
    if (revEl) revEl.innerText = `৳${totalRev.toFixed(2)}`;

    const finalDashNetProfit = totalNetProfit + netDashVatDisc;
    const profitEl = document.getElementById('dashNetProfit');
    if (profitEl) {
      profitEl.innerText = `৳${finalDashNetProfit.toFixed(2)}`;
      if (finalDashNetProfit < 0) {
        profitEl.style.color = '#ef4444';
      }
    }

    this.renderDashboardChart(todaySales);

    // Recent 5 Sales Table Body
    const recentBody = document.getElementById('dashRecentSalesBody');
    if (recentBody) {
      if (todaySales.length === 0) {
        recentBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted p-3">আজ কোনো বিক্রি হয়নি</td></tr>`;
      } else {
        recentBody.innerHTML = todaySales.slice(0, 5).map(s => {
          const { bg, color, label } = this.getPaymentBadge(s);
          return `
          <tr>
            <td><strong>${s.id}</strong></td>
            <td>${new Date(s.timestamp).toLocaleTimeString('bn-BD')}</td>
            <td><strong>৳${(s.grandTotal || 0).toFixed(2)}</strong></td>
            <td><span class="badge" style="background:${bg}; color:${color}; font-weight:700;">${label}</span></td>
          </tr>
        `;
        }).join('');
      }
    }
  }

  renderDashboardChart(todaySales) {
    const chartCanvas = document.getElementById('cashierDashboardChart');
    if (!chartCanvas || typeof Chart === 'undefined') return;

    const hourlyData = {};
    for (let h = 8; h <= 22; h++) {
      const displayH = h === 0 ? 12 : (h > 12 ? h - 12 : h);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const label = `${displayH} ${ampm}`;
      hourlyData[label] = 0;
    }

    (todaySales || []).forEach(s => {
      const date = new Date(s.timestamp);
      const h = date.getHours();
      const displayH = h === 0 ? 12 : (h > 12 ? h - 12 : h);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const label = `${displayH} ${ampm}`;
      if (hourlyData[label] !== undefined) {
        hourlyData[label] += Math.max(0, (s.grandTotal || 0) - (s.refundedAmount || 0));
      }
    });

    const labels = Object.keys(hourlyData);
    const data = Object.values(hourlyData);
    const dashChartHash = labels.join(',') + '_' + data.join(',') + '_' + (this.currentDateFilter || '');
    if (this._lastDashboardChartHash === dashChartHash && this.dashboardChart) return;
    this._lastDashboardChartHash = dashChartHash;

    if (this.dashboardChart) this.dashboardChart.destroy();

    this.dashboardChart = new Chart(chartCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'বিক্রি (৳)',
          data: data,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5
        }]
      },
      options: {
        animation: { duration: 250, easing: 'easeOutQuart' },
        resizeDelay: 100,
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 10, bottom: 5, left: 5, right: 10 }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            callbacks: {
              label: (ctx) => ` বিক্রি: ৳${(ctx.parsed.y || 0).toFixed(2)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#9ca3af',
              font: { family: "'Inter', sans-serif", size: 11 },
              callback: (v) => '৳' + v
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              color: '#cbd5e1',
              font: { family: "'Inter', sans-serif", size: 11 }
            }
          }
        }
      }
    });
  }

  // 2. ANALYTICS VIEW LOGIC (7 KPI METRICS IN EXACT ORDER)
  renderAnalyticsView() {
    const targetSales = this.getCashierFilteredSales();

    const totalOrders = targetSales.length;
    let cashReceived = 0;
    let epayReceived = 0;
    let totalItemsSold = 0;
    let grossItemsSold = 0;
    let returnedItemsSold = 0;
    let totalNetProfit = 0;
    let totalReturnsCount = 0;
    let totalRefundAmount = 0;

    let analyticsVat = 0;
    let analyticsCouponDisc = 0;
    let analyticsManualDisc = 0;

    targetSales.forEach(s => {
      const vatAmt = s.tax || 0;
      const discAmt = s.discount || 0;
      const hasCoupon = Boolean(s.couponCode || s.coupon || (s.couponDiscount && s.couponDiscount > 0));

      analyticsVat += vatAmt;

      if (hasCoupon) {
        analyticsCouponDisc += (s.couponDiscount !== undefined ? s.couponDiscount : discAmt);
      } else {
        analyticsManualDisc += (s.manualDiscount !== undefined ? s.manualDiscount : discAmt);
      }

      const refunded = s.refundedAmount || 0;
      const netGrand = Math.max(0, (s.grandTotal || 0) - refunded);

      if (s.status === 'RETURNED' || s.status === 'PARTIALLY_RETURNED' || (s.returnHistory && s.returnHistory.length > 0)) {
        totalReturnsCount++;
        totalRefundAmount += refunded;
      }

      const pm = (s.paymentMethod || '').toUpperCase();
      const isEpay = pm === 'EPAY' || (s.paymentDetails && (s.paymentDetails.method || '').toLowerCase() === 'epay');
      if (isEpay) {
        epayReceived += netGrand;
      } else {
        cashReceived += netGrand;
      }

      if (s.items && Array.isArray(s.items)) {
        s.items.forEach(i => {
          const origQty = i.quantity || 1;
          const retQty = i.returnedQuantity || 0;
          const netQty = Math.max(0, origQty - retQty);

          grossItemsSold += origQty;
          returnedItemsSold += retQty;
          totalItemsSold += netQty;

          const cost = i.cost !== undefined ? i.cost : (i.price * 0.8);
          const price = i.price || 0;
          const itemRev = price * netQty;
          totalNetProfit += (itemRev - (cost * netQty));
        });
      }
    });

    const totalRev = cashReceived + epayReceived;
    const totalAnalyticsDiscounts = analyticsCouponDisc + analyticsManualDisc;
    const netAnalyticsVatDisc = analyticsVat - totalAnalyticsDiscounts;

    const elAnalyticsVatDisc = document.getElementById('analyticsVatDiscount');
    if (elAnalyticsVatDisc) {
      if (netAnalyticsVatDisc > 0) {
        elAnalyticsVatDisc.innerText = `+৳${netAnalyticsVatDisc.toFixed(2)}`;
        elAnalyticsVatDisc.style.color = 'var(--accent-green, #10b981)';
      } else if (netAnalyticsVatDisc < 0) {
        elAnalyticsVatDisc.innerText = `-৳${Math.abs(netAnalyticsVatDisc).toFixed(2)}`;
        elAnalyticsVatDisc.style.color = '#ef4444';
      } else {
        elAnalyticsVatDisc.innerText = `৳0.00`;
        elAnalyticsVatDisc.style.color = 'inherit';
      }
    }

    const saleEl = document.getElementById('analyticsTotalSale');
    if (saleEl) saleEl.innerText = `৳${totalRev.toFixed(2)}`;

    const cashEl = document.getElementById('analyticsCashPayment');
    if (cashEl) cashEl.innerText = `৳${cashReceived.toFixed(2)}`;

    const epayEl = document.getElementById('analyticsEpayPayment');
    if (epayEl) epayEl.innerText = `৳${epayReceived.toFixed(2)}`;

    const ordersEl = document.getElementById('analyticsTotalOrders');
    if (ordersEl) ordersEl.innerText = `${totalOrders} টি`;

    const itemEl = document.getElementById('analyticsTotalItem');
    if (itemEl) itemEl.innerText = `${totalItemsSold} টি`;

    const retEl = document.getElementById('analyticsTotalReturns');
    if (retEl) retEl.innerText = `${totalReturnsCount} টি (৳${totalRefundAmount.toFixed(2)})`;

    const revEl = document.getElementById('analyticsRevenue');
    if (revEl) revEl.innerText = `৳${totalRev.toFixed(2)}`;

    const finalAnalyticsNetProfit = totalNetProfit + netAnalyticsVatDisc;
    const profitEl = document.getElementById('analyticsNetProfit');
    if (profitEl) {
      profitEl.innerText = `৳${finalAnalyticsNetProfit.toFixed(2)}`;
      if (finalAnalyticsNetProfit < 0) {
        profitEl.style.color = '#ef4444';
      }
    }

    this.renderAnalyticsHourlyChart(targetSales);
    this.renderAnalyticsPaymentChart(targetSales, cashReceived, epayReceived);
    this.renderAnalyticsCategoryChart(targetSales);
  }

  renderAnalyticsHourlyChart(todaySales) {
    const canvas = document.getElementById('cashierAnalyticsHourlyChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const hourlyData = {};
    for (let h = 8; h <= 22; h++) {
      const displayH = h === 0 ? 12 : (h > 12 ? h - 12 : h);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const label = `${displayH} ${ampm}`;
      hourlyData[label] = 0;
    }

    (todaySales || []).forEach(s => {
      const date = new Date(s.timestamp);
      const h = date.getHours();
      const displayH = h === 0 ? 12 : (h > 12 ? h - 12 : h);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const label = `${displayH} ${ampm}`;
      if (hourlyData[label] !== undefined) {
        const refunded = s.refundedAmount || 0;
        const netGrand = Math.max(0, (s.grandTotal || 0) - refunded);
        hourlyData[label] += netGrand;
      }
    });

    const labels = Object.keys(hourlyData);
    const data = Object.values(hourlyData);
    const hourlyChartHash = labels.join(',') + '_' + data.join(',') + '_' + (this.currentDateFilter || '');
    if (this._lastAnalyticsHourlyChartHash === hourlyChartHash && this.analyticsHourlyChart) return;
    this._lastAnalyticsHourlyChartHash = hourlyChartHash;

    if (this.analyticsHourlyChart) this.analyticsHourlyChart.destroy();

    this.analyticsHourlyChart = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: Object.keys(hourlyData),
        datasets: [{
          label: 'সেলস রিভেনিউ (৳)',
          data: Object.values(hourlyData),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5
        }]
      },
      options: {
        animation: { duration: 250, easing: 'easeOutQuart' },
        resizeDelay: 100,
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 10, bottom: 5, left: 5, right: 10 }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            callbacks: {
              label: (ctx) => ` রিভেনিউ: ৳${(ctx.parsed.y || 0).toFixed(2)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#9ca3af',
              font: { family: "'Inter', sans-serif", size: 11 },
              callback: (v) => '৳' + v
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              color: '#cbd5e1',
              font: { family: "'Inter', sans-serif", size: 11 }
            }
          }
        }
      }
    });
  }

  renderAnalyticsPaymentChart(todaySales, cashRec, epayRec) {
    const canvas = document.getElementById('cashierAnalyticsPaymentChart');
    if (!canvas || typeof Chart === 'undefined') return;

    let cashTotal = 0;
    let epayTotal = 0;

    if (typeof cashRec === 'number' && typeof epayRec === 'number') {
      cashTotal = cashRec;
      epayTotal = epayRec;
    } else {
      (todaySales || []).forEach(s => {
        const refunded = s.refundedAmount || 0;
        const netGrand = Math.max(0, (s.grandTotal || 0) - refunded);
        const pm = (s.paymentMethod || '').toUpperCase();
        const isEpay = pm === 'EPAY' || (s.paymentDetails && (s.paymentDetails.method || '').toLowerCase() === 'epay');
        if (isEpay) {
          epayTotal += netGrand;
        } else {
          cashTotal += netGrand;
        }
      });
    }

    const payChartHash = `${cashTotal}_${epayTotal}_${this.currentDateFilter || ''}`;
    if (this._lastAnalyticsPaymentChartHash === payChartHash && this.analyticsPaymentChart) return;
    this._lastAnalyticsPaymentChartHash = payChartHash;

    if (this.analyticsPaymentChart) this.analyticsPaymentChart.destroy();

    this.analyticsPaymentChart = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['নগদ (CASH)', 'ডিজিটাল (E-PAY)'],
        datasets: [{
          data: [cashTotal, epayTotal],
          backgroundColor: ['#10b981', '#3b82f6'],
          hoverBackgroundColor: ['#059669', '#2563eb'],
          borderWidth: 0
        }]
      },
      options: {
        animation: { duration: 250, easing: 'easeOutQuart' },
        resizeDelay: 100,
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        layout: {
          padding: { top: 10, bottom: 15, left: 10, right: 10 }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#cbd5e1',
              font: { family: "'Inter', sans-serif", size: 12, weight: '500' },
              padding: 14,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            callbacks: {
              label: function(ctx) {
                const val = ctx.parsed || 0;
                const total = cashTotal + epayTotal;
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
                return ` ${ctx.label}: ৳${val.toFixed(2)} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  renderAnalyticsCategoryChart(todaySales) {
    const canvas = document.getElementById('cashierAnalyticsCategoryChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const catTotals = {};
    (todaySales || []).forEach(s => {
      if (s.items && Array.isArray(s.items)) {
        s.items.forEach(i => {
          const origQty = i.quantity || 1;
          const retQty = i.returnedQuantity || 0;
          const netQty = Math.max(0, origQty - retQty);
          if (netQty > 0) {
            const prod = (this.products || []).find(p => p.id === i.id);
            const cat = (prod && prod.category) ? prod.category : (i.category || 'অন্যান্য');
            const sub = (i.price || 0) * netQty;
            catTotals[cat] = (catTotals[cat] || 0) + sub;
          }
        });
      }
    });

    const labels = Object.keys(catTotals);
    const data = Object.values(catTotals);
    const catChartHash = labels.join(',') + '_' + data.join(',') + '_' + (this.currentDateFilter || '');
    if (this._lastAnalyticsCategoryChartHash === catChartHash && this.analyticsCategoryChart) return;
    this._lastAnalyticsCategoryChartHash = catChartHash;

    if (this.analyticsCategoryChart) this.analyticsCategoryChart.destroy();

    this.analyticsCategoryChart = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels.length > 0 ? labels : ['কোনো বিক্রি নেই'],
        datasets: [{
          label: 'বিক্রি (৳)',
          data: data.length > 0 ? data : [0],
          backgroundColor: 'rgba(139, 92, 246, 0.8)',
          borderColor: '#8b5cf6',
          borderWidth: 1,
          borderRadius: 6,
          maxBarThickness: 36,
          categoryPercentage: 0.5,
          barPercentage: 0.7
        }]
      },
      options: {
        animation: { duration: 250, easing: 'easeOutQuart' },
        resizeDelay: 100,
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 10, bottom: 5, left: 5, right: 10 }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            callbacks: {
              label: (ctx) => ` বিক্রি: ৳${(ctx.parsed.y || 0).toFixed(2)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#9ca3af',
              font: { family: "'Inter', sans-serif", size: 11 },
              callback: (v) => '৳' + v
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              color: '#cbd5e1',
              font: { family: "'Inter', sans-serif", size: 11, weight: '500' }
            }
          }
        }
      }
    });
  }

  showReceiptModalById(id) {
    const sale = this.sales.find(s => s.id === id);
    if (sale) this.showReceiptModal(sale);
  }

  promptAdminPin() {
    const pinInput = document.getElementById('adminPinInput');
    if (pinInput) {
      pinInput.value = '';
      this.openModal('adminPinModal');
      setTimeout(() => pinInput.focus(), 100);
    }
  }

  verifyAdminPin() {
    const pinEl = document.getElementById('adminPinInput');
    if (!pinEl) return;
    const pin = pinEl.value.trim();

    const activeStoreId = localStorage.getItem('pos_active_store_id') || 'store_demo_101';
    const tenantSettings = JSON.parse(localStorage.getItem(`pos_tenant_${activeStoreId}_pos_settings`)) || {};
    const savedSettings = JSON.parse(localStorage.getItem('pos_settings')) || {};
    const activeSub = JSON.parse(localStorage.getItem('pos_subscription')) || {};

    const expectedPin = String(activeSub.merchantPassword || activeSub.adminPin || tenantSettings.adminPin || savedSettings.adminPin || this.settings.adminPin || '1234').trim();

    if (pin === expectedPin) {
      this.closeModal('adminPinModal');
      window.location.href = 'admin.html';
    } else {
      this.showToast('ভুল এডমিন সিকিউরিটি পিন! আপনার সঠিক এডমিন পিন দিয়ে চেষ্টা করুন।', 'error');
    }
  }



  initEventListeners() {
    const btnDash = document.getElementById('btnNavDashboard');
    if (btnDash) btnDash.addEventListener('click', () => this.switchTab('cashierDashboardView'));

    const btnTerm = document.getElementById('btnNavTerminal');
    if (btnTerm) btnTerm.addEventListener('click', () => this.switchTab('cashierTerminalView'));

    const btnAnal = document.getElementById('btnNavAnalytics');
    if (btnAnal) btnAnal.addEventListener('click', () => this.switchTab('cashierAnalyticsView'));

    const btnShift = document.getElementById('btnNavShiftSales');
    if (btnShift) btnShift.addEventListener('click', () => this.switchTab('cashierShiftView'));

    const btnGoTerminal = document.getElementById('btnGoToTerminalFromDashboard');
    if (btnGoTerminal) btnGoTerminal.addEventListener('click', () => this.switchTab('cashierTerminalView'));

    const btnAdmin = document.getElementById('btnOpenAdminModal');
    if (btnAdmin) btnAdmin.addEventListener('click', () => this.promptAdminPin());

    const btnSubmitPin = document.getElementById('submitPinBtn');
    if (btnSubmitPin) btnSubmitPin.addEventListener('click', () => this.verifyAdminPin());

    const adminPinInput = document.getElementById('adminPinInput');
    if (adminPinInput) {
      adminPinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.verifyAdminPin();
      });
    }

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const html = document.documentElement;
        const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('pos_theme', next);
        try {
          const s = JSON.parse(localStorage.getItem('pos_settings')) || {};
          s.defaultTheme = next;
          localStorage.setItem('pos_settings', JSON.stringify(s));
        } catch(e) {}
      });
    }

    const soundToggleBtn = document.getElementById('soundToggleBtn');
    if (soundToggleBtn) {
      soundToggleBtn.addEventListener('click', () => {
        this.soundEnabled = !this.soundEnabled;
        soundToggleBtn.style.color = this.soundEnabled ? 'var(--text-main)' : 'var(--accent-red)';
      });
    }

    const cameraScanBtn = document.getElementById('cameraScanBtn');
    if (cameraScanBtn) cameraScanBtn.addEventListener('click', () => this.openCameraScanner());

    const clearCartHeaderBtn = document.getElementById('clearCartHeaderBtn');
    if (clearCartHeaderBtn) {
      clearCartHeaderBtn.addEventListener('click', () => {
        if (this.cart.length > 0 && confirm('আপনি কি পুরো কার্ট খালি করতে চান?')) this.clearCart();
      });
    }

    const searchInput = document.getElementById('productSearchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    if (searchInput && clearSearchBtn) {
      searchInput.addEventListener('input', (e) => {
        clearSearchBtn.style.display = e.target.value ? 'block' : 'none';
        this.renderProducts();
      });
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        this.renderProducts();
      });
    }

    const simulateBarcodeBtn = document.getElementById('simulateBarcodeBtn');
    if (simulateBarcodeBtn) {
      simulateBarcodeBtn.addEventListener('click', () => {
        const randomProd = this.products[Math.floor(Math.random() * this.products.length)];
        if (randomProd && randomProd.variants && randomProd.variants.length > 0) {
          const randomVar = randomProd.variants[Math.floor(Math.random() * randomProd.variants.length)];
          this.handleBarcodeScan(randomVar.barcode);
        }
      });
    }

    const categoriesBar = document.getElementById('categoriesBar');
    if (categoriesBar) {
      categoriesBar.addEventListener('click', (e) => {
        if (e.target.classList.contains('cat-pill')) {
          document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
          e.target.classList.add('active');
          this.activeCategory = e.target.dataset.cat;
          this.renderProducts();
        }
      });
    }

    const discInput = document.getElementById('discountInput');
    if (discInput) {
      discInput.addEventListener('input', (e) => {
        this.discountValue = parseFloat(e.target.value) || 0;
        this._userHasCustomDiscount = true;
        this.renderCart();
      });
    }

    const discToggle = document.getElementById('discountModeToggle');
    if (discToggle) {
      discToggle.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-toggle-mode');
        if (btn && btn.dataset.mode) {
          this.discountType = btn.dataset.mode;
          this._userHasCustomDiscount = true;
          this.updateDiscountTaxUI();
          this.renderCart();
        }
      });
    }

    const taxInput = document.getElementById('taxInput');
    if (taxInput) {
      taxInput.addEventListener('input', (e) => {
        this.taxValue = parseFloat(e.target.value) || 0;
        this._userHasCustomTax = true;
        this.renderCart();
      });
    }

    const taxToggle = document.getElementById('taxModeToggle');
    if (taxToggle) {
      taxToggle.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-toggle-mode');
        if (btn && btn.dataset.mode) {
          this.taxType = btn.dataset.mode;
          this.updateDiscountTaxUI();
          this.renderCart();
        }
      });
    }

    const applyCouponBtn = document.getElementById('applyCouponBtn');
    const couponInput = document.getElementById('couponInput');
    const removeCouponBtn = document.getElementById('removeCouponBtn');

    if (applyCouponBtn && couponInput) {
      applyCouponBtn.addEventListener('click', () => {
        this.applyCoupon(couponInput.value);
      });
      couponInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.applyCoupon(couponInput.value);
        }
      });
    }

    // Auto-expand input width helper (grows from right to left)
    const setupAutoExpandInput = (inputEl, minWidth = 90, charWidth = 9.5, extraPadding = 26) => {
      if (!inputEl) return;
      const updateWidth = () => {
        const val = inputEl.value || '';
        const textLen = val.length > 0 ? val.length : (inputEl.placeholder ? inputEl.placeholder.length : 0);
        const newWidth = Math.max(minWidth, Math.ceil(textLen * charWidth + extraPadding));
        inputEl.style.width = `${newWidth}px`;
      };
      inputEl.addEventListener('input', updateWidth);
      inputEl.addEventListener('change', updateWidth);
      inputEl.addEventListener('keyup', updateWidth);
      updateWidth();
    };

    setupAutoExpandInput(couponInput, 110, 9.5, 26);
    setupAutoExpandInput(discInput, 90, 10, 30);
    setupAutoExpandInput(taxInput, 90, 10, 30);

    // Auto-clear '0' on focus for Discount & Tax inputs
    const handleZeroFocus = (inputEl, getValue, setValue) => {
      if (!inputEl) return;
      inputEl.addEventListener('focus', () => {
        if (inputEl.value === '0' || parseFloat(inputEl.value) === 0) {
          inputEl.value = '';
        } else {
          inputEl.select();
        }
      });
      inputEl.addEventListener('blur', () => {
        if (inputEl.value.trim() === '') {
          inputEl.value = 0;
          setValue(0);
        }
      });
    };

    handleZeroFocus(discInput, () => this.discountValue, (val) => { this.discountValue = val; this.renderCart(); });
    handleZeroFocus(taxInput, () => this.taxValue, (val) => { this.taxValue = val; this.renderCart(); });

    const cartNoteTextarea = document.getElementById('cartOrderNote');
    if (cartNoteTextarea) {
      cartNoteTextarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
      });
    }

    if (removeCouponBtn) {
      removeCouponBtn.addEventListener('click', () => {
        this.removeCoupon();
      });
    }

    document.getElementById('payCashBtn').addEventListener('click', () => this.openCashModal());
    document.getElementById('cashTenderedInput').addEventListener('input', () => this.calculateCashChange());

    document.querySelectorAll('.quick-cash-btns button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.target.dataset.cash;
        const totals = this.getCartTotals();
        let val = totals.grandTotal;
        if (type !== 'exact') val = parseFloat(type);
        document.getElementById('cashTenderedInput').value = val;
        this.calculateCashChange();
      });
    });

    document.getElementById('confirmCashPayBtn').addEventListener('click', () => this.processCashPayment());

    document.getElementById('payEpayBtn').addEventListener('click', () => this.openEpayModal());
    document.querySelectorAll('.epay-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.epay-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.selectedEpayProvider = card.dataset.provider;
        this.updateEpayNoticeBox(this.selectedEpayProvider);
      });
    });
    document.getElementById('confirmEpayBtn').addEventListener('click', () => this.processEpayPayment());

    const printBtn = document.getElementById('printReceiptBtn');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        this.playInModalReceiptPrint('printableReceipt', false);
      });
    }

    const replayBtn = document.getElementById('rcptReplayAnimBtn');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        this.playInModalReceiptPrint('printableReceipt', false);
      });
    }

    const pdfBtn = document.getElementById('rcptDownloadPdfBtn');
    if (pdfBtn) {
      pdfBtn.addEventListener('click', () => {
        this.downloadReceiptPDF('printableReceipt');
      });
    }


    // Analytics Hub 7 KPI Cards Click Listeners
    ['analyticsCardTotalSale', 'analyticsCardRevenue'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => this.openCashierTotalSalesModal());
    });
    ['analyticsCardCashPayment'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => this.openCashierRevenueModal('CASH'));
    });
    const analyticsEpayCard = document.getElementById('analyticsCardEpayPayment');
    if (analyticsEpayCard) analyticsEpayCard.addEventListener('click', () => this.openCashierEpayBreakdownModal());
    const analOrders = document.getElementById('analyticsCardTotalOrders');
    if (analOrders) analOrders.addEventListener('click', () => this.switchTab('cashierShiftView'));

    const analItem = document.getElementById('analyticsCardTotalItem');
    if (analItem) analItem.addEventListener('click', () => this.openCashierItemsSoldModal());

    const analNetProfit = document.getElementById('analyticsCardNetProfit');
    if (analNetProfit) analNetProfit.addEventListener('click', () => this.openCashierNetProfitModal());

    // Cashier Dashboard 7 KPI Card Click Listeners
    ['dashCardTotalSale', 'dashCardRevenue', 'cashCardRevenue'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => this.openCashierTotalSalesModal());
    });
    ['dashCardCashPayment', 'cashCardCash'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => this.openCashierRevenueModal('CASH'));
    });
    const dashEpayCard = document.getElementById('dashCardEpayPayment');
    if (dashEpayCard) dashEpayCard.addEventListener('click', () => this.openCashierEpayBreakdownModal());
    ['dashCardTotalOrders', 'cashCardOrders'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => this.switchTab('cashierShiftView'));
    });
    ['dashCardTotalItem', 'cashCardItems'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => this.openCashierItemsSoldModal());
    });
    const dashProfit = document.getElementById('dashCardNetProfit');
    if (dashProfit) dashProfit.addEventListener('click', () => this.openCashierNetProfitModal());

    // Return Card Listeners
    ['dashCardReturns', 'analyticsCardReturns'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => this.openCashierReturnsModal());
    });

    // Vat & Discount Card Listeners
    ['dashCardVatDiscount', 'analyticsCardVatDiscount'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => this.openVatDiscountModal());
    });

    const btnGoShift = document.getElementById('btnCashierGoToShiftView');
    if (btnGoShift) btnGoShift.addEventListener('click', () => {
      this.closeModal('cashierRevenueModal');
      this.switchTab('cashierShiftView');
    });

    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('.close-modal');
      if (closeBtn) {
        const modal = closeBtn.closest('.modal');
        if (modal) this.closeModal(modal.id);
      }
    });
  }

  openCashierRevenueModal(filterPaymentType = 'CASH') {
    const targetSales = this.getCashierFilteredSales();
    const cashSales = targetSales.filter(s => (s.paymentMethod || '').toUpperCase() !== 'EPAY' && (!s.paymentDetails || (s.paymentDetails.method || '').toLowerCase() !== 'epay'));
    const totalCash = cashSales.reduce((sum, s) => sum + Math.max(0, (s.grandTotal || 0) - (s.refundedAmount || 0)), 0);
    const totalRefunds = cashSales.reduce((sum, s) => sum + (s.refundedAmount || 0), 0);
    const totalCashCount = cashSales.length;

    const elCash = document.getElementById('cashModalRevCashTotal');
    const elOrders = document.getElementById('cashModalRevOrders');

    if (elCash) elCash.innerHTML = `৳${totalCash.toFixed(2)}${totalRefunds > 0 ? `<small style="font-size:0.75rem; color:#ef4444; margin-left:6px;">(-৳${totalRefunds.toFixed(2)} refund)</small>` : ''}`;
    if (elOrders) elOrders.innerText = `${totalCashCount} টি`;

    const tbody = document.getElementById('cashModalRevRecentBody');
    if (tbody) {
      if (cashSales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 1.5rem;">এখনো কোনো ক্যাশ বিক্রির ইনভয়েস রেকর্ড করা হয়নি।</td></tr>`;
      } else {
        tbody.innerHTML = cashSales.map(s => {
          const dtStr = new Date(s.timestamp).toLocaleString('bn-BD');
          const { bg, color, label } = this.getPaymentBadge(s);
          const refunded = s.refundedAmount || 0;
          const netAmt = Math.max(0, (s.grandTotal || 0) - refunded);
          return `
          <tr>
            <td>
              <strong style="cursor: pointer; color: var(--accent-blue);" onclick="cashier.openInvoiceReturnExchangeModal('${s.id}')" title="ইনভয়েস মেমো দেখুন">${s.id}</strong>
              <div style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace;">CASH-PAYMENT</div>
            </td>
            <td><small>${dtStr}</small></td>
            <td>
              <span class="badge" style="background: ${bg}; color: ${color}; font-weight: 700; padding: 4px 10px; border-radius: 6px; display: inline-flex; align-items: center;">
                ${label}
              </span>
            </td>
            <td>${s.customerName || 'Walk-in Customer'}</td>
            <td style="text-align: right; font-weight: 800; color: ${s.status === 'RETURNED' ? '#ef4444' : '#10b981'}; font-size: 1.05rem;">
              ৳${netAmt.toFixed(2)}
              ${refunded > 0 ? `<br><small style="color: #ef4444; font-size: 0.7rem;">(-৳${refunded.toFixed(2)} refund)</small>` : ''}
            </td>
          </tr>
        `;
        }).join('');
      }
    }

    this.openModal('cashierRevenueModal');
  }

  // --- TOTAL SALES & GROSS REVENUE BREAKDOWN MODAL ---
  openCashierTotalSalesModal() {
    const targetSales = this.getCashierFilteredSales();

    let cashGross = 0;
    let epayGross = 0;
    let totalRefunds = 0;
    let cashRefunds = 0;
    let epayRefunds = 0;

    targetSales.forEach(s => {
      const pm = (s.paymentMethod || '').toUpperCase();
      const isEpay = pm === 'EPAY' || (s.paymentDetails && (s.paymentDetails.method || '').toLowerCase() === 'epay');
      const refunded = s.refundedAmount || 0;
      totalRefunds += refunded;

      if (isEpay) {
        epayGross += (s.grandTotal || 0);
        epayRefunds += refunded;
      } else {
        cashGross += (s.grandTotal || 0);
        cashRefunds += refunded;
      }
    });

    const netRevenue = (cashGross + epayGross) - totalRefunds;

    const elNet = document.getElementById('totSalesNetRevenue');
    const elCash = document.getElementById('totSalesCashTotal');
    const elEpay = document.getElementById('totSalesEpayTotal');
    const elRefund = document.getElementById('totSalesRefundTotal');

    if (elNet) elNet.innerText = `৳${netRevenue.toFixed(2)}`;
    if (elCash) elCash.innerText = `৳${(cashGross - cashRefunds).toFixed(2)}`;
    if (elEpay) elEpay.innerText = `৳${(epayGross - epayRefunds).toFixed(2)}`;
    if (elRefund) elRefund.innerText = `-৳${totalRefunds.toFixed(2)}`;

    const tbody = document.getElementById('totSalesTableBody');
    if (tbody) {
      if (targetSales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 1.5rem;">এখনো কোনো বিক্রির ইনভয়েস রেকর্ড করা হয়নি।</td></tr>`;
      } else {
        tbody.innerHTML = targetSales.map(s => {
          const dtStr = new Date(s.timestamp).toLocaleString('bn-BD');
          const { bg, color, label } = this.getPaymentBadge(s);
          const refunded = s.refundedAmount || 0;
          const netAmt = Math.max(0, (s.grandTotal || 0) - refunded);

          return `
          <tr>
            <td>
              <strong style="cursor: pointer; color: var(--accent-blue);" onclick="cashier.openInvoiceReturnExchangeModal('${s.id}')" title="ইনভয়েস বিবরণী দেখুন">${s.id}</strong>
              <div style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace;">${(s.paymentDetails && s.paymentDetails.trxId) ? s.paymentDetails.trxId : 'SALE-RECORD'}</div>
            </td>
            <td><small>${dtStr}</small></td>
            <td>
              <span class="badge" style="background: ${bg}; color: ${color}; font-weight: 700; padding: 4px 10px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
                ${label}
              </span>
            </td>
            <td>${s.customerName || 'Walk-in Customer'}</td>
            <td style="text-align: right; font-weight: 800; color: ${s.status === 'RETURNED' ? '#ef4444' : '#10b981'}; font-size: 1.05rem;">
              ৳${netAmt.toFixed(2)}
              ${refunded ? `<br><small style="color: #ef4444; font-size: 0.7rem;">(৳${refunded.toFixed(2)} refund)</small>` : ''}
            </td>
          </tr>
        `;
        }).join('');
      }
    }

    this.openModal('cashierTotalSalesModal');
  }

  openCashierItemsSoldModal(defaultFilter = 'net') {
    this.currentItemsSoldFilter = defaultFilter;
    const targetSales = this.getCashierFilteredSales();

    const itemMap = {};
    let totalNetUnits = 0;
    let totalGrossUnits = 0;
    let totalReturnedUnits = 0;

    const returnedItemsList = [];

    targetSales.forEach(s => {
      if (s.items && Array.isArray(s.items)) {
        s.items.forEach(i => {
          const origQty = i.quantity || 1;
          const retQty = i.returnedQuantity || 0;
          const netQty = Math.max(0, origQty - retQty);

          totalGrossUnits += origQty;
          totalReturnedUnits += retQty;
          totalNetUnits += netQty;

          const colorStr = (i.color && i.color !== 'N/A') ? i.color : '';
          const sizeStr = (i.size && i.size !== 'N/A') ? i.size : '';
          const variantKey = [colorStr, sizeStr].filter(Boolean).join('_') || 'Standard';
          const key = `${i.id || i.name}_${variantKey}`;

          let variantLabel = 'Standard';
          if (colorStr && sizeStr) variantLabel = `🎨 ${colorStr} / 📏 ${sizeStr}`;
          else if (colorStr) variantLabel = `🎨 ${colorStr}`;
          else if (sizeStr) variantLabel = `📏 ${sizeStr}`;

          if (!itemMap[key]) {
            itemMap[key] = {
              name: i.name,
              variant: variantLabel,
              category: i.category || 'General',
              price: i.price || 0,
              grossQty: 0,
              returnedQty: 0,
              netQty: 0,
              netTotal: 0,
              grossTotal: 0
            };
          }
          itemMap[key].grossQty += origQty;
          itemMap[key].returnedQty += retQty;
          itemMap[key].netQty += netQty;
          itemMap[key].netTotal += (i.price || 0) * netQty;
          itemMap[key].grossTotal += (i.price || 0) * origQty;

          if (retQty > 0) {
            returnedItemsList.push({
              invoiceId: s.id,
              date: new Date(s.timestamp).toLocaleString('bn-BD'),
              name: i.name,
              color: i.color || 'N/A',
              size: i.size || 'N/A',
              variant: variantLabel,
              category: i.category || 'General',
              price: i.price || 0,
              returnedQty: retQty,
              refundAmount: (i.price || 0) * retQty,
              customer: s.customer || s.customerName || 'Walk-in Customer'
            });
          }
        });
      }
    });

    this.cachedCashierItemsSoldData = {
      itemsList: Object.values(itemMap),
      returnedItemsList: returnedItemsList,
      totalNetUnits,
      totalGrossUnits,
      totalReturnedUnits
    };

    // Update Box Counts
    const elNetCount = document.getElementById('cashModalItemsSoldNetCount');
    const elRetCount = document.getElementById('cashModalItemsSoldReturnedCount');
    const elGrossCount = document.getElementById('cashModalItemsSoldGrossCount');

    if (elNetCount) elNetCount.innerText = `${totalNetUnits} টি`;
    if (elRetCount) elRetCount.innerText = `${totalReturnedUnits} টি`;
    if (elGrossCount) elGrossCount.innerText = `${totalGrossUnits} টি`;

    const searchInput = document.getElementById('cashModalItemsSearchInput');
    if (searchInput) searchInput.value = '';

    this.renderItemsSoldModalTable(defaultFilter);
    this.openModal('cashierItemsSoldModal');
  }

  setItemsSoldModalFilter(filterMode) {
    this.currentItemsSoldFilter = filterMode;
    this.renderItemsSoldModalTable(filterMode);
  }

  onItemsSoldSearchInput() {
    const filterMode = this.currentItemsSoldFilter || 'net';
    this.renderItemsSoldModalTable(filterMode);
  }

  renderItemsSoldModalTable(filterMode = 'net') {
    const data = this.cachedCashierItemsSoldData;
    if (!data) return;

    // Update Box Styling
    ['cashBoxFilterNet', 'cashBoxFilterReturned', 'cashBoxFilterGross'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.border = '1px solid var(--border-color)';
        el.style.background = 'var(--bg-card)';
      }
    });

    if (filterMode === 'net') {
      const activeEl = document.getElementById('cashBoxFilterNet');
      if (activeEl) {
        activeEl.style.border = '2px solid #10b981';
        activeEl.style.background = 'rgba(16,185,129,0.12)';
      }
    } else if (filterMode === 'returned') {
      const activeEl = document.getElementById('cashBoxFilterReturned');
      if (activeEl) {
        activeEl.style.border = '2px solid #ef4444';
        activeEl.style.background = 'rgba(239,68,68,0.12)';
      }
    } else if (filterMode === 'gross') {
      const activeEl = document.getElementById('cashBoxFilterGross');
      if (activeEl) {
        activeEl.style.border = '2px solid #3b82f6';
        activeEl.style.background = 'rgba(59,130,246,0.12)';
      }
    }

    const searchInput = document.getElementById('cashModalItemsSearchInput');
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

    const thead = document.querySelector('#cashierItemsSoldModal table thead');
    const tbody = document.getElementById('cashModalItemsSoldBody');
    if (!tbody) return;

    if (filterMode === 'returned') {
      // Returned Items Detailed View
      if (thead) {
        thead.innerHTML = `
          <tr>
            <th>রিটার্নকৃত পণ্য ও মেমো (Trx)</th>
            <th>ভেরিয়েন্ট (কালার / সাইজ)</th>
            <th>একক মূল্য</th>
            <th>রিটার্ন সংখ্যা</th>
            <th style="text-align: right;">মোট রিফান্ড (৳)</th>
          </tr>
        `;
      }

      const filtered = data.returnedItemsList.filter(i => 
        !query || 
        i.name.toLowerCase().includes(query) || 
        i.color.toLowerCase().includes(query) ||
        i.size.toLowerCase().includes(query) ||
        i.invoiceId.toLowerCase().includes(query)
      );

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 1.5rem;">কোনো রিটার্নকৃত আইটেম ডাটা পাওয়া যায়নি।</td></tr>`;
      } else {
        tbody.innerHTML = filtered.map(i => `
          <tr>
            <td>
              <strong style="color: var(--accent-red, #ef4444);">${i.name}</strong>
              <div style="font-size:0.72rem; color:var(--text-muted); font-family:monospace;">${i.invoiceId} (${i.date})</div>
            </td>
            <td>
              <span class="badge" style="background: rgba(245,158,11,0.15); color: #f59e0b; font-weight:700;">
                ${i.variant}
              </span>
            </td>
            <td>৳${i.price.toFixed(2)}</td>
            <td><strong style="color: #ef4444; font-size: 1.05rem;">${i.returnedQty} টি</strong></td>
            <td style="text-align: right; font-weight: 800; color: #ef4444; font-size: 1.05rem;">৳${i.refundAmount.toFixed(2)}</td>
          </tr>
        `).join('');
      }

    } else if (filterMode === 'gross') {
      // Gross Sales View
      if (thead) {
        thead.innerHTML = `
          <tr>
            <th>আইটেম / পণ্য</th>
            <th>ক্যাটাগরি</th>
            <th>বিক্রয় ব্রেকডাউন (Gross/Ret/Net)</th>
            <th>একক দাম</th>
            <th style="text-align: right;">সর্বমোট অর্জিত রিভেনিউ</th>
          </tr>
        `;
      }

      const filtered = data.itemsList.filter(i => 
        !query || 
        i.name.toLowerCase().includes(query) || 
        i.category.toLowerCase().includes(query) ||
        i.variant.toLowerCase().includes(query)
      );

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 1.5rem;">কোনো বিক্রিত আইটেম ডাটা পাওয়া যায়নি।</td></tr>`;
      } else {
        tbody.innerHTML = filtered.sort((a, b) => b.grossQty - a.grossQty).map(item => `
          <tr>
            <td>
              <strong>${item.name}</strong><br>
              <small class="badge" style="background: rgba(245,158,11,0.15); color: #f59e0b; font-size: 0.72rem; margin-top: 2px;">(${item.variant})</small>
            </td>
            <td><span class="badge" style="background: rgba(59,130,246,0.15); color: #3b82f6;">${item.category}</span></td>
            <td>
              <strong style="color: #3b82f6; font-size: 1rem;">${item.grossQty} টি Gross</strong>
              <div style="font-size: 0.68rem; font-weight: 600; margin-top: 2px;">
                <span style="color:#10b981;">নিট বিক্রি: ${item.netQty}</span> | <span style="color:#ef4444;">রিটার্ন: ${item.returnedQty}</span>
              </div>
            </td>
            <td>৳${item.price.toFixed(2)}</td>
            <td style="text-align: right; font-weight: 700; color: var(--accent-green);">৳${item.grossTotal.toFixed(2)}</td>
          </tr>
        `).join('');
      }

    } else {
      // Net Sales View (Default Box 1)
      if (thead) {
        thead.innerHTML = `
          <tr>
            <th>আইটেম / পণ্য</th>
            <th>ক্যাটাগরি</th>
            <th>একক দাম</th>
            <th>সক্রিয় বিক্রিত সংখ্যা (Net)</th>
            <th style="text-align: right;">নিট অর্জিত রিভেনিউ</th>
          </tr>
        `;
      }

      const filtered = data.itemsList.filter(i => 
        i.netQty > 0 &&
        (!query || 
        i.name.toLowerCase().includes(query) || 
        i.category.toLowerCase().includes(query) ||
        i.variant.toLowerCase().includes(query))
      );

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 1.5rem;">কোনো সক্রিয় বিক্রিত আইটেম ডাটা পাওয়া যায়নি।</td></tr>`;
      } else {
        tbody.innerHTML = filtered.sort((a, b) => b.netQty - a.netQty).map(item => `
          <tr>
            <td>
              <strong>${item.name}</strong><br>
              <small class="badge" style="background: rgba(245,158,11,0.15); color: #f59e0b; font-size: 0.72rem; margin-top: 2px;">(${item.variant})</small>
            </td>
            <td><span class="badge" style="background: rgba(16,185,129,0.15); color: #10b981;">${item.category}</span></td>
            <td>৳${item.price.toFixed(2)}</td>
            <td>
              <strong style="color: #10b981; font-size: 1.05rem;">${item.netQty} টি</strong>
            </td>
            <td style="text-align: right; font-weight: 800; color: #10b981;">৳${item.netTotal.toFixed(2)}</td>
          </tr>
        `).join('');
      }
    }
  }

  openCashierNetProfitModal(defaultFilter = 'net') {
    this.currentProfitFilter = defaultFilter;
    const targetSales = this.getCashierFilteredSales();

    let totalNetSales = 0;
    let totalNetCost = 0;
    let totalGrossSales = 0;
    let totalGrossCost = 0;
    let totalReturnedRefund = 0;
    let totalReturnedCost = 0;
    let totalReturnedItemsCount = 0;

    const itemProfitsMap = {};
    const returnedProfitItemsList = [];

    targetSales.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          const origQty = item.quantity || 1;
          const retQty = item.returnedQuantity || 0;
          const netQty = Math.max(0, origQty - retQty);

          const price = item.price || 0;
          const cost = item.cost !== undefined ? item.cost : (price * 0.8);

          const grossRev = price * origQty;
          const grossCost = cost * origQty;

          const netRev = price * netQty;
          const netCost = cost * netQty;

          const retRev = price * retQty;
          const retCost = cost * retQty;

          totalGrossSales += grossRev;
          totalGrossCost += grossCost;
          totalNetSales += netRev;
          totalNetCost += netCost;
          totalReturnedRefund += retRev;
          totalReturnedCost += retCost;
          totalReturnedItemsCount += retQty;

          const colorStr = (item.color && item.color !== 'N/A') ? item.color : '';
          const sizeStr = (item.size && item.size !== 'N/A') ? item.size : '';
          const variantKey = [colorStr, sizeStr].filter(Boolean).join('_') || 'Standard';
          const key = `${item.id || item.name}_${variantKey}`;

          let variantLabel = 'Standard';
          if (colorStr && sizeStr) variantLabel = `🎨 ${colorStr} / 📏 ${sizeStr}`;
          else if (colorStr) variantLabel = `🎨 ${colorStr}`;
          else if (sizeStr) variantLabel = `📏 ${sizeStr}`;

          if (!itemProfitsMap[key]) {
            itemProfitsMap[key] = {
              name: item.name,
              variant: variantLabel,
              category: item.category || 'অন্যান্য',
              price: price,
              cost: cost,
              grossQty: 0,
              returnedQty: 0,
              netQty: 0,
              grossSales: 0,
              grossCost: 0,
              grossProfit: 0,
              netSales: 0,
              netCost: 0,
              netProfit: 0
            };
          }

          itemProfitsMap[key].grossQty += origQty;
          itemProfitsMap[key].returnedQty += retQty;
          itemProfitsMap[key].netQty += netQty;

          itemProfitsMap[key].grossSales += grossRev;
          itemProfitsMap[key].grossCost += grossCost;
          itemProfitsMap[key].grossProfit += (grossRev - grossCost);

          itemProfitsMap[key].netSales += netRev;
          itemProfitsMap[key].netCost += netCost;
          itemProfitsMap[key].netProfit += (netRev - netCost);

          if (retQty > 0) {
            returnedProfitItemsList.push({
              invoiceId: sale.id,
              date: new Date(sale.timestamp).toLocaleString('bn-BD'),
              name: item.name,
              variant: variantLabel,
              color: item.color || 'N/A',
              size: item.size || 'N/A',
              category: item.category || 'অন্যান্য',
              price: price,
              cost: cost,
              returnedQty: retQty,
              refundAmount: retRev,
              restockedCost: retCost,
              profitAdjustment: -(retRev - retCost)
            });
          }
        });
      }
    });

    let modalVat = 0;
    let modalCouponDisc = 0;
    let modalManualDisc = 0;

    targetSales.forEach(s => {
      const vatAmt = s.tax || 0;
      const discAmt = s.discount || 0;
      const hasCoupon = Boolean(s.couponCode || s.coupon || (s.couponDiscount && s.couponDiscount > 0));

      modalVat += vatAmt;

      if (hasCoupon) {
        modalCouponDisc += (s.couponDiscount !== undefined ? s.couponDiscount : discAmt);
      } else {
        modalManualDisc += (s.manualDiscount !== undefined ? s.manualDiscount : discAmt);
      }
    });

    const netVatDiscAdjustment = modalVat - (modalCouponDisc + modalManualDisc);
    const grossProductProfit = totalNetSales - totalNetCost;
    const finalAdjustedNetProfit = grossProductProfit + netVatDiscAdjustment;
    const totalGrossProfit = totalGrossSales - totalGrossCost;
    const netMarginPct = totalNetSales > 0 ? ((finalAdjustedNetProfit / totalNetSales) * 100).toFixed(1) : 0;

    this.cachedCashierProfitData = {
      itemsList: Object.values(itemProfitsMap),
      returnedItemsList: returnedProfitItemsList,
      totalNetSales,
      totalNetCost,
      totalNetProfit: finalAdjustedNetProfit,
      grossProductProfit,
      netVatDiscAdjustment,
      totalGrossSales,
      totalGrossCost,
      totalGrossProfit,
      totalReturnedRefund,
      totalReturnedCost,
      totalReturnedItemsCount,
      netMarginPct
    };

    // Update Header Cards & Box Values
    const elNet = document.getElementById('cashModalProfitNetTotal');
    const elNetSub = document.getElementById('cashModalProfitTotalSalesSub');
    const elRet = document.getElementById('cashModalProfitReturnedTotal');
    const elRetSub = document.getElementById('cashModalProfitReturnedCountSub');
    const elGross = document.getElementById('cashModalProfitGrossTotal');
    const elGrossSub = document.getElementById('cashModalProfitGrossSalesSub');
    const elMargin = document.getElementById('cashModalProfitMarginPercent');
    const elHeaderDetail = document.getElementById('cashModalProfitHeaderDetail');

    if (elNet) elNet.innerText = `৳${finalAdjustedNetProfit.toFixed(2)}`;
    if (elNetSub) elNetSub.innerText = `(পণ্য মুনাফা ৳${grossProductProfit.toFixed(2)} ${netVatDiscAdjustment >= 0 ? '+' : ''}৳${netVatDiscAdjustment.toFixed(2)} ভ্যাট/ডিসকাউন্ট)`;

    if (elRet) elRet.innerText = `-৳${totalReturnedRefund.toFixed(2)}`;
    if (elRetSub) elRetSub.innerText = `(${totalReturnedItemsCount}টি রিটার্ন | রিস্টকড খরচ: ৳${totalReturnedCost.toFixed(2)})`;

    if (elGross) elGross.innerText = `৳${totalGrossProfit.toFixed(2)}`;
    if (elGrossSub) elGrossSub.innerText = `(গ্রস রিভেনিউ ৳${totalGrossSales.toFixed(2)})`;

    if (elMargin) elMargin.innerText = `${netMarginPct}%`;
    if (elHeaderDetail) elHeaderDetail.innerText = `(নিট রিভেনিউ ৳${totalNetSales.toFixed(2)} থেকে নিট কেনা খরচ ৳${totalNetCost.toFixed(2)} বাদ দিয়ে)`;

    const searchInput = document.getElementById('cashModalProfitSearchInput');
    if (searchInput) searchInput.value = '';

    this.renderNetProfitModalTable(defaultFilter);
    this.openModal('cashierNetProfitModal');
  }

  setNetProfitModalFilter(filterMode) {
    this.currentProfitFilter = filterMode;
    this.renderNetProfitModalTable(filterMode);
  }

  onNetProfitSearchInput() {
    this.renderNetProfitModalTable(this.currentProfitFilter || 'net');
  }

  renderNetProfitModalTable(filterMode = 'net') {
    const data = this.cachedCashierProfitData;
    if (!data) return;

    // Update Box Styling
    ['cashProfitBoxNet', 'cashProfitBoxReturned', 'cashProfitBoxGross'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.border = '1px solid var(--border-color)';
        el.style.background = 'var(--bg-card)';
      }
    });

    if (filterMode === 'net') {
      const activeEl = document.getElementById('cashProfitBoxNet');
      if (activeEl) {
        activeEl.style.border = '2px solid #10b981';
        activeEl.style.background = 'rgba(16,185,129,0.12)';
      }
    } else if (filterMode === 'returned') {
      const activeEl = document.getElementById('cashProfitBoxReturned');
      if (activeEl) {
        activeEl.style.border = '2px solid #ef4444';
        activeEl.style.background = 'rgba(239,68,68,0.12)';
      }
    } else if (filterMode === 'gross') {
      const activeEl = document.getElementById('cashProfitBoxGross');
      if (activeEl) {
        activeEl.style.border = '2px solid #3b82f6';
        activeEl.style.background = 'rgba(59,130,246,0.12)';
      }
    }

    const searchInput = document.getElementById('cashModalProfitSearchInput');
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

    const thead = document.querySelector('#cashierNetProfitModal table thead');
    const tbody = document.getElementById('cashModalProfitItemsBody');
    if (!tbody) return;

    if (filterMode === 'returned') {
      // Returned Profit Breakdown View
      if (thead) {
        thead.innerHTML = `
          <tr>
            <th>রিটার্নকৃত পণ্য ও মেমো (Trx)</th>
            <th>ভেরিয়েন্ট (কালার / সাইজ)</th>
            <th>রিটার্ন সংখ্যা</th>
            <th>একক কেনা (Cost)</th>
            <th>একক বিক্রি (Price)</th>
            <th>রিফান্ড টাকা (Sales Loss)</th>
            <th>রিস্টকড খরচ (Cost Back)</th>
            <th style="text-align: right;">প্রফিট এডজাস্টমেন্ট</th>
          </tr>
        `;
      }

      const filtered = data.returnedItemsList.filter(i => 
        !query || 
        i.name.toLowerCase().includes(query) || 
        i.variant.toLowerCase().includes(query) ||
        i.invoiceId.toLowerCase().includes(query)
      );

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding: 1.5rem;">কোনো রিটার্নকৃত প্রফিট ডাটা পাওয়া যায়নি।</td></tr>`;
      } else {
        tbody.innerHTML = filtered.map(i => `
          <tr>
            <td>
              <strong style="color: var(--accent-red, #ef4444);">${i.name}</strong>
              <div style="font-size:0.72rem; color:var(--text-muted); font-family:monospace;">${i.invoiceId} (${i.date})</div>
            </td>
            <td>
              <span class="badge" style="background: rgba(245,158,11,0.15); color: #f59e0b; font-weight:700;">
                ${i.variant}
              </span>
            </td>
            <td><strong style="color: #ef4444;">${i.returnedQty} টি</strong></td>
            <td>৳${i.cost.toFixed(2)}</td>
            <td>৳${i.price.toFixed(2)}</td>
            <td style="color:#ef4444; font-weight:700;">-৳${i.refundAmount.toFixed(2)}</td>
            <td style="color:#10b981; font-weight:700;">+৳${i.restockedCost.toFixed(2)}</td>
            <td style="text-align: right; font-weight: 800; color: #ef4444;">${i.profitAdjustment.toFixed(2)}৳</td>
          </tr>
        `).join('');
      }

    } else if (filterMode === 'gross') {
      // Gross Profit View
      if (thead) {
        thead.innerHTML = `
          <tr>
            <th>পণ্যের নাম ও ভেরিয়েন্ট</th>
            <th>ক্যাটাগরি</th>
            <th>মোট সেলস (Gross Qty)</th>
            <th>কেনা দাম (Cost)</th>
            <th>বিক্রি দাম (Price)</th>
            <th>গ্রস মোট বিক্রি</th>
            <th>গ্রস কেনা খরচ</th>
            <th style="text-align: right;">গ্রস প্রফিট</th>
          </tr>
        `;
      }

      let filtered = data.itemsList.filter(i => 
        !query || 
        i.name.toLowerCase().includes(query) || 
        i.category.toLowerCase().includes(query) ||
        i.variant.toLowerCase().includes(query)
      );

      filtered.sort((a, b) => b.grossProfit - a.grossProfit);

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding: 1.5rem;">কোনো বিক্রিত প্রফিট ডাটা পাওয়া যায়নি।</td></tr>`;
      } else {
        tbody.innerHTML = filtered.map(item => `
          <tr>
            <td>
              <strong>${item.name}</strong><br>
              <small class="badge" style="background: rgba(245,158,11,0.15); color: #f59e0b; font-size: 0.72rem; margin-top: 2px;">(${item.variant})</small>
            </td>
            <td><span class="badge" style="background: rgba(59,130,246,0.15); color: #3b82f6;">${item.category}</span></td>
            <td>
              <strong style="color: #3b82f6;">${item.grossQty} টি</strong>
              <div style="font-size:0.68rem; color:var(--text-muted);">(নিট: ${item.netQty} | রিটার্ন: ${item.returnedQty})</div>
            </td>
            <td>৳${item.cost.toFixed(2)}</td>
            <td>৳${item.price.toFixed(2)}</td>
            <td>৳${item.grossSales.toFixed(2)}</td>
            <td>৳${item.grossCost.toFixed(2)}</td>
            <td style="text-align: right; font-weight: 800; color: #3b82f6;">৳${item.grossProfit.toFixed(2)}</td>
          </tr>
        `).join('');
      }

    } else {
      // Net Profit View (Default Box 1 - Showing Net Sold Items)
      if (thead) {
        thead.innerHTML = `
          <tr>
            <th>পণ্যের নাম ও ভেরিয়েন্ট</th>
            <th>ক্যাটাগরি</th>
            <th>সক্রিয় বিক্রি (Net Qty)</th>
            <th>কেনা দাম (Cost)</th>
            <th>বিক্রি দাম (Price)</th>
            <th>নিট মোট বিক্রি</th>
            <th>নিট কেনা খরচ</th>
            <th style="text-align: right;">নিট লাভ (Net Profit)</th>
          </tr>
        `;
      }

      let filtered = data.itemsList.filter(i => 
        i.netQty > 0 &&
        (!query || 
        i.name.toLowerCase().includes(query) || 
        i.category.toLowerCase().includes(query) ||
        i.variant.toLowerCase().includes(query))
      );

      filtered.sort((a, b) => b.netProfit - a.netProfit);

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding: 1.5rem;">কোনো সক্রিয় বিক্রিত প্রফিট ডাটা পাওয়া যায়নি।</td></tr>`;
      } else {
        tbody.innerHTML = filtered.map(item => {
          const retBadge = item.returnedQty > 0 ? `<br><span class="badge" style="background:rgba(239,68,68,0.12); color:#ef4444; font-size:0.68rem;">(${item.returnedQty}টি রিটার্ন বাদ)</span>` : '';
          return `
          <tr>
            <td>
              <strong>${item.name}</strong><br>
              <small class="badge" style="background: rgba(245,158,11,0.15); color: #f59e0b; font-size: 0.72rem; margin-top: 2px;">(${item.variant})</small>
            </td>
            <td><span class="badge" style="background: rgba(16,185,129,0.15); color: #10b981;">${item.category}</span></td>
            <td>
              <strong style="color: #10b981; font-size: 1.05rem;">${item.netQty} টি</strong>
              ${retBadge}
            </td>
            <td>৳${item.cost.toFixed(2)}</td>
            <td>৳${item.price.toFixed(2)}</td>
            <td>৳${item.netSales.toFixed(2)}</td>
            <td>৳${item.netCost.toFixed(2)}</td>
            <td style="text-align: right; font-weight: 800; color: #10b981; font-size: 1.05rem;">৳${item.netProfit.toFixed(2)}</td>
          </tr>
        `;
        }).join('');
      }
    }
  }

  playInModalReceiptPrint(receiptPaperId, autoTriggerSystemPrint = false) {
    const paperEl = document.getElementById(receiptPaperId);
    if (!paperEl) return;

    const container = paperEl.closest('.receipt-feed-container');
    const viewport = paperEl.closest('.receipt-feed-viewport');
    const scanline = container ? container.querySelector('.thermal-feed-scanline') : null;
    const statusIndicator = container ? container.querySelector('.slot-status-indicator') : null;
    const statusText = container ? container.querySelector('.slot-status-text') : null;

    if (statusIndicator) statusIndicator.classList.add('printing');
    if (statusText) statusText.innerText = '🖨️ প্রিন্ট হচ্ছে...';
    if (scanline) scanline.style.display = 'block';

    const duration = 450;
    if (window.printHub && window.printHub.playPrinterAudio) {
      window.printHub.playPrinterAudio(duration);
    }

    const startTime = performance.now();

    if (viewport) viewport.scrollTop = 0;

    paperEl.style.transition = 'none';
    paperEl.style.transform = 'translateY(60px)';
    paperEl.style.opacity = '0.3';

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      const translateY = (1 - progress) * 60;
      paperEl.style.transform = `translateY(${translateY}px)`;
      paperEl.style.opacity = (0.3 + progress * 0.7).toFixed(2);

      if (scanline) {
        scanline.style.top = `${progress * 100}%`;
      }

      if (viewport) {
        const maxScroll = viewport.scrollHeight - viewport.clientHeight;
        if (maxScroll > 0) {
          viewport.scrollTop = progress * maxScroll;
        }
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        paperEl.style.transform = 'translateY(0)';
        paperEl.style.opacity = '1';
        if (scanline) scanline.style.display = 'none';

        if (statusIndicator) statusIndicator.classList.remove('printing');
        if (statusText) statusText.innerText = '✅ ইনভয়েস প্রিন্ট সম্পন্ন';

        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }

        if (window.printHub && window.printHub.playSuccessBeep) {
          window.printHub.playSuccessBeep();
        }

        if (window.confetti) {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        }

        if (autoTriggerSystemPrint) {
          if (window.printHub && typeof window.printHub.executeHardwarePrint === 'function') {
            window.printHub.executeHardwarePrint('invoice', null, null, (errMsg) => {
              if (statusText) statusText.innerText = '❌ প্রিন্টার কানেক্টেড নেই বা ইনভয়েস প্রিন্ট ব্যর্থ হয়েছে!';
              if (typeof this.showToast === 'function') {
                this.showToast(`❌ প্রিন্টার কানেক্টেড নেই বা ইনভয়েস প্রিন্ট ব্যর্থ হয়েছে! (${errMsg})`, 'error');
              }
            });
          }
        }
      }
    };

    requestAnimationFrame(step);
  }

  downloadReceiptPDF(receiptPaperId) {
    const paperEl = document.getElementById(receiptPaperId);
    if (!paperEl) return;

    const pdfBtn = document.getElementById('rcptDownloadPdfBtn');
    if (pdfBtn) {
      pdfBtn.disabled = true;
      pdfBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Downloading PDF...';
    }

    const invId = document.getElementById('rcptInvId')?.innerText || 'INV-000';

    if (typeof JsBarcode !== 'undefined') {
      try {
        JsBarcode("#rcptBarcodeSvg", invId, {
          format: "CODE128", width: 1.8, height: 48, displayValue: true, fontSize: 13, fontOptions: "bold", font: "monospace",
          marginTop: 8, marginBottom: 8, marginLeft: 18, marginRight: 18,
          background: "#ffffff", lineColor: "#000000"
        });
      } catch(e) {}
    }

    const pxHeight = Math.max(paperEl.scrollHeight || paperEl.offsetHeight || 0, paperEl.getBoundingClientRect().height || 0);
    const calculatedHeightMm = Math.ceil((pxHeight * 0.2645833) * 1.06) + 15;

    const opt = {
      margin: [2, 2, 2, 2],
      filename: `Memo_${invId.replace(/[^a-zA-Z0-9_\-]/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true, backgroundColor: '#ffffff', scrollY: 0 },
      jsPDF: { unit: 'mm', format: [80, Math.max(60, calculatedHeightMm)], orientation: 'portrait' }
    };

    if (window.html2pdf) {
      window.html2pdf().set(opt).from(paperEl).save()
        .then(() => {
          this.showToast('PDF invoice downloaded successfully!');
        })
        .catch(err => {
          console.error(err);
          this.showToast('PDF export failed. Try Send to printer option.');
        })
        .finally(() => {
          if (pdfBtn) {
            pdfBtn.disabled = false;
            pdfBtn.innerHTML = '<i class="fa-solid fa-file-pdf"></i> PDF Download';
          }
        });
    } else {
      if (pdfBtn) {
        pdfBtn.disabled = false;
        pdfBtn.innerHTML = '<i class="fa-solid fa-file-pdf"></i> PDF Download';
      }
      if (window.printHub && typeof window.printHub.executeHardwarePrint === 'function') {
        window.printHub.executeHardwarePrint('invoice');
      } else {
        window.print();
      }
    }
  }

  // CUSTOMER MANAGEMENT & PHONE NORMALIZATION METHODS
  normalizePhone(phone) {
    if (!phone) return '';
    let cleaned = String(phone).replace(/\D/g, '').trim();
    if (cleaned.startsWith('880')) {
      cleaned = cleaned.slice(2);
    }
    return cleaned;
  }

  broadcastStateChange(type) {
    try {
      if (!this.stateChannel) this.stateChannel = new BroadcastChannel('pos_state_sync');
      this.stateChannel.postMessage({ type: `${type}_updated`, timestamp: Date.now() });
    } catch (e) {
      // BroadcastChannel fallback
    }
  }

  populateCustomerSelect() {
    this.customers = JSON.parse(localStorage.getItem('pos_customers')) || (typeof INITIAL_CUSTOMERS !== 'undefined' ? INITIAL_CUSTOMERS : []);
    const select = document.getElementById('customerSelect');
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = `
      <option value="Walk-in Customer">ওয়াক-ইন কাস্টমার (Walk-in)</option>
      ${this.customers.map(c => `<option value="${c.name}">${c.name} (${c.phone || 'N/A'})</option>`).join('')}
    `;
    if (currentVal && Array.from(select.options).some(opt => opt.value === currentVal)) {
      select.value = currentVal;
    }
  }

  setupCartCustomerEvents() {
    const select = document.getElementById('customerSelect');
    const phoneInput = document.getElementById('cartCustPhone');
    const nameInput = document.getElementById('cartCustName');
    const badge = document.getElementById('posCartCustBadge');

    if (select) {
      select.addEventListener('change', () => {
        const val = select.value;
        if (val === 'Walk-in Customer') {
          if (phoneInput) phoneInput.value = '';
          if (nameInput) nameInput.value = '';
          if (badge) badge.style.display = 'none';
        } else {
          const match = this.customers.find(c => c.name === val || c.phone === val);
          if (match) {
            if (phoneInput) phoneInput.value = match.phone || '';
            if (nameInput) nameInput.value = match.name || '';
            if (badge) badge.style.display = 'inline-flex';
          }
        }
      });
    }

    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        let phone = e.target.value.replace(/\D/g, '').slice(0, 11);
        e.target.value = phone;
        const clean = this.normalizePhone(phone);

        if (clean.length >= 6) {
          const match = this.customers.find(c => this.normalizePhone(c.phone) === clean);
          if (match) {
            if (nameInput) nameInput.value = match.name;
            if (select && Array.from(select.options).some(o => o.value === match.name)) {
              select.value = match.name;
            }
            if (badge) badge.style.display = 'inline-flex';
          } else {
            if (badge) badge.style.display = 'none';
          }
        } else {
          if (badge) badge.style.display = 'none';
        }
      });
    }
  }

  setupCustomerLookupInModals() {
    const handleLookup = (phoneInputId, firstNameId, lastNameId, emailInputId, addressInputId, badgeId) => {
      const phoneInput = document.getElementById(phoneInputId);
      const firstNameInput = document.getElementById(firstNameId);
      const lastNameInput = document.getElementById(lastNameId);
      const emailInput = document.getElementById(emailInputId);
      const addressInput = document.getElementById(addressInputId);
      const badge = document.getElementById(badgeId);

      if (!phoneInput) return;

      phoneInput.addEventListener('input', (e) => {
        let phone = e.target.value.replace(/\D/g, '').slice(0, 11);
        e.target.value = phone;
        const clean = this.normalizePhone(phone);

        if (clean.length >= 6) {
          const match = this.customers.find(c => this.normalizePhone(c.phone) === clean);
          if (match) {
            const parts = (match.name || '').split(' ');
            if (firstNameInput) firstNameInput.value = match.firstName || parts[0] || '';
            if (lastNameInput) lastNameInput.value = match.lastName || parts.slice(1).join(' ') || '';
            if (emailInput) emailInput.value = match.email || '';
            if (addressInput) addressInput.value = match.address || '';
            if (badge) badge.style.display = 'inline-flex';
          } else {
            if (badge) badge.style.display = 'none';
          }
        } else {
          if (badge) badge.style.display = 'none';
        }
      });
    };

    handleLookup('cashCustPhone', 'cashCustFirstName', 'cashCustLastName', 'cashCustEmail', 'cashCustAddress', 'cashCustStatusBadge');
    handleLookup('epayCustPhone', 'epayCustFirstName', 'epayCustLastName', 'epayCustEmail', 'epayCustAddress', 'epayCustStatusBadge');
  }

  prefillCustomerInModal(prefix) {
    const selectVal = document.getElementById('customerSelect')?.value || '';
    const cartPhone = document.getElementById('cartCustPhone')?.value.trim() || '';
    const cartName = document.getElementById('cartCustName')?.value.trim() || '';

    const phoneEl = document.getElementById(`${prefix}CustPhone`);
    const firstNameEl = document.getElementById(`${prefix}CustFirstName`);
    const lastNameEl = document.getElementById(`${prefix}CustLastName`);
    const emailEl = document.getElementById(`${prefix}CustEmail`);
    const addressEl = document.getElementById(`${prefix}CustAddress`);
    const badgeEl = document.getElementById(`${prefix}CustStatusBadge`);

    const cleanCartPhone = this.normalizePhone(cartPhone);
    let match = null;

    if (cleanCartPhone) {
      match = this.customers.find(c => this.normalizePhone(c.phone) === cleanCartPhone);
    }
    if (!match && selectVal && selectVal !== 'Walk-in Customer') {
      match = this.customers.find(c => c.name === selectVal);
    }

    if (match) {
      const parts = (match.name || '').split(' ');
      if (phoneEl) phoneEl.value = match.phone || '';
      if (firstNameEl) firstNameEl.value = match.firstName || parts[0] || '';
      if (lastNameEl) lastNameEl.value = match.lastName || parts.slice(1).join(' ') || '';
      if (emailEl) emailEl.value = match.email || '';
      if (addressEl) addressEl.value = match.address || '';
      if (badgeEl) badgeEl.style.display = 'inline-flex';
      return;
    }

    if (phoneEl) phoneEl.value = cartPhone;
    const nameParts = cartName.split(' ');
    if (firstNameEl) firstNameEl.value = cartName ? nameParts[0] : '';
    if (lastNameEl) lastNameEl.value = cartName ? nameParts.slice(1).join(' ') : '';
    if (emailEl) emailEl.value = '';
    if (addressEl) addressEl.value = '';
    if (badgeEl) badgeEl.style.display = 'none';
  }

  updateOrCreateCustomerOnSale(phone, firstName, lastName, name, email, address, grandTotal) {
    const rawPhone = (phone || document.getElementById('cartCustPhone')?.value || '').trim();
    const cleanPhone = this.normalizePhone(rawPhone);
    const cleanFirstName = (firstName || '').trim();
    const cleanLastName = (lastName || '').trim();
    
    let combinedName = `${cleanFirstName} ${cleanLastName}`.trim();
    const cartName = (document.getElementById('cartCustName')?.value || '').trim();
    let cleanName = (name && name !== 'Walk-in Customer' ? name : (combinedName || cartName)).trim();
    if (!cleanName || cleanName === 'Walk-in Customer') {
      cleanName = cleanPhone ? `Customer (${cleanPhone})` : 'Walk-in Customer';
    }
    
    const cleanEmail = (email || '').trim();
    const cleanAddress = (address || '').trim();

    this.customers = JSON.parse(localStorage.getItem('pos_customers')) || (typeof INITIAL_CUSTOMERS !== 'undefined' ? INITIAL_CUSTOMERS : []);

    let existing = null;
    if (cleanPhone) {
      existing = this.customers.find(c => this.normalizePhone(c.phone) === cleanPhone);
    }

    if (existing) {
      if (cleanFirstName) existing.firstName = cleanFirstName;
      if (cleanLastName) existing.lastName = cleanLastName;
      if (cleanName && cleanName !== 'Walk-in Customer' && !cleanName.startsWith('Customer (')) {
        existing.name = cleanName;
      }
      if (cleanEmail) existing.email = cleanEmail;
      if (cleanAddress) existing.address = cleanAddress;
      existing.totalOrders = (existing.totalOrders || 0) + 1;
      existing.totalSpent = (existing.totalSpent || 0) + grandTotal;
    } else if (cleanPhone) {
      const parts = cleanName.split(' ');
      const newCust = {
        id: `CUST-${Date.now().toString().slice(-4)}`,
        firstName: cleanFirstName || parts[0] || '',
        lastName: cleanLastName || parts.slice(1).join(' ') || '',
        name: cleanName,
        phone: rawPhone || cleanPhone,
        email: cleanEmail,
        address: cleanAddress,
        totalOrders: 1,
        totalSpent: grandTotal,
        createdAt: new Date().toISOString().split('T')[0]
      };
      this.customers.unshift(newCust);
    } else if (cleanName && cleanName !== 'Walk-in Customer') {
      const parts = cleanName.split(' ');
      const newCust = {
        id: `CUST-${Date.now().toString().slice(-4)}`,
        firstName: cleanFirstName || parts[0] || '',
        lastName: cleanLastName || parts.slice(1).join(' ') || '',
        name: cleanName,
        phone: rawPhone,
        email: cleanEmail,
        address: cleanAddress,
        totalOrders: 1,
        totalSpent: grandTotal,
        createdAt: new Date().toISOString().split('T')[0]
      };
      this.customers.unshift(newCust);
    }

    localStorage.setItem('pos_customers', JSON.stringify(this.customers));
    this.broadcastStateChange('customers');
    this.populateCustomerSelect();
    this.renderCashierCustomers();

    const custObj = existing || this.customers.find(c => this.normalizePhone(c.phone) === cleanPhone) || this.customers[0];

    return {
      id: custObj ? custObj.id : `CUST-${Date.now().toString().slice(-4)}`,
      name: cleanName,
      phone: rawPhone || cleanPhone,
      email: cleanEmail,
      address: cleanAddress,
      status: custObj ? (custObj.status || 'active') : 'active'
    };
  }

  isGuestSale(s) {
    if (!s) return false;
    if (s.customerId === 'GUEST') return true;
    if (s.customerPhone && String(s.customerPhone).trim() !== '') return false;
    const nameLower = (s.customer || s.customerName || '').toLowerCase().trim();
    if (!nameLower || nameLower === 'walk-in customer' || nameLower === 'walk-in' || nameLower === 'guest' || nameLower === 'n/a') return true;
    return !s.customerPhone;
  }

  renderCashierCustomers() {
    this.customers = JSON.parse(localStorage.getItem('pos_customers')) || (typeof INITIAL_CUSTOMERS !== 'undefined' ? INITIAL_CUSTOMERS : []);
    this.sales = JSON.parse(localStorage.getItem('pos_sales')) || (typeof INITIAL_SALES !== 'undefined' ? INITIAL_SALES : []);

    const countEl = document.getElementById('cashierCustCount');
    const ordersEl = document.getElementById('cashierCustOrders');
    const spentEl = document.getElementById('cashierCustSpent');
    const tbody = document.getElementById('cashierCustomersTableBody');
    const searchVal = (document.getElementById('cashierCustSearchInput')?.value || '').toLowerCase().trim();

    const guestSales = this.sales.filter(s => this.isGuestSale(s));
    const guestOrdersCount = guestSales.length;
    const guestSpentSum = guestSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);

    const registeredOrdersCount = this.customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
    const registeredSpentSum = this.customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

    const overallTotalOrders = registeredOrdersCount + guestOrdersCount;
    const overallTotalSpent = registeredSpentSum + guestSpentSum;

    if (countEl) countEl.innerText = `${this.customers.length + 1} জন (সহ গেস্ট)`;
    if (ordersEl) ordersEl.innerText = `${overallTotalOrders} টি`;
    if (spentEl) spentEl.innerText = `৳${overallTotalSpent.toFixed(2)}`;

    const filtered = this.customers.filter(c => 
      !searchVal || 
      (c.name || '').toLowerCase().includes(searchVal) ||
      (c.phone || '').includes(searchVal) ||
      (c.address || '').toLowerCase().includes(searchVal) ||
      (c.email || '').toLowerCase().includes(searchVal)
    );

    const showGuest = !searchVal || 'গেস্ট'.includes(searchVal) || 'guest'.includes(searchVal) || 'walk-in'.includes(searchVal) || 'অনিবন্ধিত'.includes(searchVal);

    if (!tbody) return;

    let html = '';

    if (showGuest) {
      html += `
        <tr onclick="cashier.viewCustomerOrders('GUEST')" style="cursor: pointer; background: rgba(245, 158, 11, 0.08); border-left: 4px solid #f59e0b;" title="অনিবন্ধিত গেস্ট ও ওয়াক-ইন কাস্টমারদের কেনাকাটার বিস্তারিত দেখুন">
          <td><strong style="color: #f59e0b;"><i class="fa-solid fa-user-secret"></i> GUEST</strong></td>
          <td>
            <strong style="color: var(--text-main);">গেস্ট / ওয়াক-ইন কাস্টমার</strong>
            <span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; margin-left: 6px; font-weight: 700;"><i class="fa-solid fa-user-tag"></i> সিস্টেম সাধারণ সার্ভিস</span>
          </td>
          <td><span class="badge" style="background: rgba(148, 163, 184, 0.15); color: var(--text-muted);"><i class="fa-solid fa-phone-slash"></i> অনিবন্ধিত</span></td>
          <td><span class="text-muted">N/A</span></td>
          <td><span class="text-muted">দোকানে আগত সাধারণ ক্রেতা</span></td>
          <td><span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; font-weight: 700;">${guestOrdersCount} টি অর্ডার</span></td>
          <td><strong style="color: var(--accent-green);">৳${guestSpentSum.toFixed(2)}</strong></td>
          <td style="text-align: right;" onclick="event.stopPropagation();">
            <button type="button" class="btn btn-sm btn-warning" onclick="cashier.viewCustomerOrders('GUEST')" title="গেস্ট ইনভয়েস ও বিবরণী">
              <i class="fa-solid fa-id-card"></i> গেস্ট বিবরণী
            </button>
          </td>
        </tr>
      `;
    }

    if (filtered.length === 0 && !showGuest) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-4 text-muted">
            <i class="fa-solid fa-users-slash" style="font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
            কোনো কাস্টমার প্রোফাইল পাওয়া যায়নি
          </td>
        </tr>
      `;
      return;
    }

    html += filtered.map(c => {
      const isBlocked = c.status === 'blocked';
      const statusBadge = isBlocked 
        ? `<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; margin-left: 6px;"><i class="fa-solid fa-ban"></i> ব্লকড</span>`
        : `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-green); margin-left: 6px;"><i class="fa-solid fa-circle-check"></i> সচল</span>`;

      return `
        <tr onclick="cashier.viewCustomerOrders('${c.id}')" style="cursor: pointer;" title="কাস্টমার প্রোফাইল ও কেনাকাটার বিস্তারিত দেখুন">
          <td><strong style="color: var(--accent-blue);">${c.id || 'CUST'}</strong></td>
          <td><strong style="color: var(--text-main);">${c.name}</strong> ${statusBadge}</td>
          <td><span class="badge" style="background: rgba(59, 130, 246, 0.15); color: var(--accent-blue);"><i class="fa-solid fa-phone"></i> ${c.phone}</span></td>
          <td>${c.email || '<span class="text-muted">N/A</span>'}</td>
          <td>${c.address || '<span class="text-muted">N/A</span>'}</td>
          <td><span class="badge" style="background: rgba(139, 92, 246, 0.15); color: var(--accent-purple);">${c.totalOrders || 0} টি অর্ডার</span></td>
          <td><strong style="color: var(--accent-green);">৳${(c.totalSpent || 0).toFixed(2)}</strong></td>
          <td style="text-align: right;" onclick="event.stopPropagation();">
            <button type="button" class="btn btn-sm btn-outline" onclick="cashier.viewCustomerOrders('${c.id}')" title="প্রোফাইল ও মেমো ইতিহাস">
              <i class="fa-solid fa-id-card"></i> বিস্তারিত
            </button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.innerHTML = html;
  }

  getCashierFilteredSales() {
    const filter = this.currentDateFilter || 'today';
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

    let matched = this.sales;
    if (filter === 'custom' && this.customStartDate && this.customEndDate) {
      const startMs = new Date(this.customStartDate + 'T00:00:00').getTime();
      const endMs = new Date(this.customEndDate + 'T23:59:59').getTime();
      matched = this.sales.filter(sale => {
        const saleTime = new Date(sale.timestamp).getTime();
        if (isNaN(saleTime)) return true;
        return saleTime >= startMs && saleTime <= endMs;
      });
    } else if (filter !== 'all') {
      const currentDayOfWeek = now.getDay();
      const sundayStart = todayStart - (currentDayOfWeek * 86400000);
      const lastSundayStart = sundayStart - (7 * 86400000);

      matched = this.sales.filter(sale => {
        const saleTime = new Date(sale.timestamp).getTime();
        if (isNaN(saleTime)) return true;

        if (filter === 'today') {
          return saleTime >= todayStart && saleTime <= todayEnd;
        } else if (filter === 'yesterday') {
          const yesterdayStart = todayStart - 86400000;
          return saleTime >= yesterdayStart && saleTime < todayStart;
        } else if (filter === 'today_yesterday') {
          const yesterdayStart = todayStart - 86400000;
          return saleTime >= yesterdayStart && saleTime <= todayEnd;
        } else if (filter === '7days') {
          return saleTime >= todayStart - (6 * 86400000) && saleTime <= todayEnd;
        } else if (filter === '14days') {
          return saleTime >= todayStart - (13 * 86400000) && saleTime <= todayEnd;
        } else if (filter === '28days') {
          return saleTime >= todayStart - (27 * 86400000) && saleTime <= todayEnd;
        } else if (filter === '30days') {
          return saleTime >= todayStart - (29 * 86400000) && saleTime <= todayEnd;
        } else if (filter === 'thisWeek') {
          return saleTime >= sundayStart && saleTime <= todayEnd;
        } else if (filter === 'lastWeek') {
          return saleTime >= lastSundayStart && saleTime < sundayStart;
        } else if (filter === 'thisMonth') {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          return saleTime >= monthStart && saleTime <= todayEnd;
        } else if (filter === 'lastMonth') {
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
          const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          return saleTime >= lastMonthStart && saleTime < thisMonthStart;
        }
        return true;
      });
    }

    return matched.slice().sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
  }

  // INTERACTIVE DATE RANGE CALENDAR PICKER ENGINE (CASHIER POS MATCH)
  initDatePicker() {
    const triggerBtns = document.querySelectorAll('#openCustomDateRangeModalBtn, #openCustomDateRangeModalBtnAnalytics, .analytics-date-trigger-btn');
    const closeBtn = document.getElementById('closeDateRangeModalBtn');
    const prevBtn = document.getElementById('calPrevMonthBtn');
    const nextBtn = document.getElementById('calNextMonthBtn');
    const applyBtn = document.getElementById('applyDateRangeBtn');
    const dateSelect = document.getElementById('cashierDateFilterSelect');

    this.populateMonthYearDropdowns();
    this.applyPresetRange(this.currentDateFilter || 'today');

    triggerBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.openModal('dateRangePickerModal');
        this.syncPresetsRadioUI();
        this.renderCalendarGrid();
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal('dateRangePickerModal'));
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.calendarViewDate.setMonth(this.calendarViewDate.getMonth() - 1);
        this.syncMonthYearDropdowns();
        this.renderCalendarGrid();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.calendarViewDate.setMonth(this.calendarViewDate.getMonth() + 1);
        this.syncMonthYearDropdowns();
        this.renderCalendarGrid();
      });
    }

    ['calMonth1Select', 'calYear1Select', 'calMonth2Select', 'calYear2Select'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => {
          const m1 = parseInt(document.getElementById('calMonth1Select').value, 10);
          const y1 = parseInt(document.getElementById('calYear1Select').value, 10);
          this.calendarViewDate = new Date(y1, m1, 1);
          this.syncMonthYearDropdowns();
          this.renderCalendarGrid();
        });
      }
    });

    if (dateSelect) {
      dateSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        this.currentDateFilter = val;
        if (val === 'custom') {
          this.openModal('dateRangePickerModal');
          this.syncPresetsRadioUI();
          this.renderCalendarGrid();
        } else {
          this.applyPresetRange(val);
          this.updateDateTriggerBtnText();
          this.renderDashboardView();
          this.renderAnalyticsView();
          this.showToast(`সময়কাল ফিল্টার পরিবর্তন করা হলো: ${e.target.options[e.target.selectedIndex].text}`);
        }
      });
    }

    const presetsContainer = document.getElementById('datePickerPresetsContainer');
    if (presetsContainer) {
      presetsContainer.querySelectorAll('.preset-radio-item').forEach(item => {
        item.addEventListener('click', () => {
          presetsContainer.querySelectorAll('.preset-radio-item').forEach(i => {
            i.classList.remove('active');
            const radio = i.querySelector('input[type="radio"]');
            if (radio) radio.checked = false;
          });
          item.classList.add('active');
          const radio = item.querySelector('input[type="radio"]');
          if (radio) radio.checked = true;

          const presetKey = item.dataset.preset;
          this.applyPresetRange(presetKey);
          this.syncPresetsRadioUI();
        });
      });
    }

    const modeDropdown = document.getElementById('calModeDropdown');
    if (modeDropdown) {
      modeDropdown.addEventListener('change', (e) => {
        const val = e.target.value;
        this.applyPresetRange(val);
        this.syncPresetsRadioUI();
      });
    }

    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        this.updateDateTriggerBtnText();
        if (dateSelect) dateSelect.value = this.currentDateFilter;
        this.closeModal('dateRangePickerModal');
        this.renderDashboardView();
        this.renderAnalyticsView();
        this.showToast(`সময়কাল সফলভাবে আপডেট করা হলো!`);
      });
    }

    this.updateDateTriggerBtnText();
  }

  populateMonthYearDropdowns() {
    const m1Select = document.getElementById('calMonth1Select');
    const m2Select = document.getElementById('calMonth2Select');
    const y1Select = document.getElementById('calYear1Select');
    const y2Select = document.getElementById('calYear2Select');
    if (!m1Select || !y1Select) return;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthOpts = months.map((m, i) => `<option value="${i}">${m}</option>`).join('');

    m1Select.innerHTML = monthOpts;
    m2Select.innerHTML = monthOpts;

    const currentYear = new Date().getFullYear();
    let yearOpts = '';
    for (let y = currentYear - 3; y <= currentYear + 2; y++) {
      yearOpts += `<option value="${y}">${y}</option>`;
    }
    y1Select.innerHTML = yearOpts;
    y2Select.innerHTML = yearOpts;

    this.syncMonthYearDropdowns();
  }

  syncMonthYearDropdowns() {
    const m1Select = document.getElementById('calMonth1Select');
    const m2Select = document.getElementById('calMonth2Select');
    const y1Select = document.getElementById('calYear1Select');
    const y2Select = document.getElementById('calYear2Select');
    if (!m1Select || !y1Select) return;

    const m1 = this.calendarViewDate.getMonth();
    const y1 = this.calendarViewDate.getFullYear();

    const date2 = new Date(y1, m1 + 1, 1);
    const m2 = date2.getMonth();
    const y2 = date2.getFullYear();

    m1Select.value = m1;
    y1Select.value = y1;
    m2Select.value = m2;
    y2Select.value = y2;
  }

  syncPresetsRadioUI() {
    const presetsContainer = document.getElementById('datePickerPresetsContainer');
    const modeDropdown = document.getElementById('calModeDropdown');

    if (presetsContainer) {
      presetsContainer.querySelectorAll('.preset-radio-item').forEach(item => {
        const isMatch = (item.dataset.preset === this.currentDateFilter);
        item.classList.toggle('active', isMatch);
        const radio = item.querySelector('input[type="radio"]');
        if (radio) radio.checked = isMatch;
      });
    }

    if (modeDropdown) {
      modeDropdown.value = this.currentDateFilter;
    }
  }

  applyPresetRange(presetKey) {
    const now = new Date();
    const todayStr = this.formatYMD(now);
    this.currentDateFilter = presetKey;

    if (presetKey === 'today') {
      this.customStartDate = todayStr;
      this.customEndDate = todayStr;
    } else if (presetKey === 'yesterday') {
      const y = new Date(now.getTime() - 86400000);
      const yStr = this.formatYMD(y);
      this.customStartDate = yStr;
      this.customEndDate = yStr;
    } else if (presetKey === 'today_yesterday') {
      const y = new Date(now.getTime() - 86400000);
      this.customStartDate = this.formatYMD(y);
      this.customEndDate = todayStr;
    } else if (presetKey === '7days') {
      const d7 = new Date(now.getTime() - (6 * 86400000));
      this.customStartDate = this.formatYMD(d7);
      this.customEndDate = todayStr;
    } else if (presetKey === '14days') {
      const d14 = new Date(now.getTime() - (13 * 86400000));
      this.customStartDate = this.formatYMD(d14);
      this.customEndDate = todayStr;
    } else if (presetKey === '28days') {
      const d28 = new Date(now.getTime() - (27 * 86400000));
      this.customStartDate = this.formatYMD(d28);
      this.customEndDate = todayStr;
    } else if (presetKey === '30days') {
      const d30 = new Date(now.getTime() - (29 * 86400000));
      this.customStartDate = this.formatYMD(d30);
      this.customEndDate = todayStr;
    } else if (presetKey === 'thisWeek') {
      const sun = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      this.customStartDate = this.formatYMD(sun);
      this.customEndDate = todayStr;
    } else if (presetKey === 'lastWeek') {
      const lastSun = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 7);
      const lastSat = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 1);
      this.customStartDate = this.formatYMD(lastSun);
      this.customEndDate = this.formatYMD(lastSat);
    } else if (presetKey === 'thisMonth') {
      const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
      this.customStartDate = this.formatYMD(mStart);
      this.customEndDate = todayStr;
    } else if (presetKey === 'lastMonth') {
      const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      this.customStartDate = this.formatYMD(lmStart);
      this.customEndDate = this.formatYMD(lmEnd);
    } else if (presetKey === 'all') {
      this.customStartDate = '2025-01-01';
      this.customEndDate = todayStr;
    }

    this.renderCalendarGrid();
  }

  formatYMD(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  formatShortDate(ymdStr) {
    if (!ymdStr) return '';
    const parts = ymdStr.split('-');
    if (parts.length !== 3) return ymdStr;
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[monthIdx]} ${day}, ${year}`;
  }

  updateDateTriggerBtnText() {
    const btnTextElements = document.querySelectorAll('#customDateRangeBtnText, #customDateRangeBtnTextAnalytics, .customDateRangeBtnText');
    if (!btnTextElements.length) return;

    let displayText = 'Today';
    if (this.currentDateFilter === 'custom' && this.customStartDate && this.customEndDate) {
      if (this.customStartDate === this.customEndDate) {
        displayText = this.formatShortDate(this.customStartDate);
      } else {
        displayText = `${this.formatShortDate(this.customStartDate)} – ${this.formatShortDate(this.customEndDate)}`;
      }
    } else {
      const map = {
        'today': 'Today',
        'yesterday': 'Yesterday',
        'today_yesterday': 'Today and yesterday',
        '7days': 'Last 7 days',
        '14days': 'Last 14 days',
        '28days': 'Last 28 days',
        '30days': 'Last 30 days',
        'thisWeek': 'This week',
        'lastWeek': 'Last week',
        'thisMonth': 'This month',
        'lastMonth': 'Last month',
        'all': 'Maximum'
      };
      displayText = map[this.currentDateFilter] || 'Today';
    }

    btnTextElements.forEach(el => {
      el.innerText = displayText;
    });
  }

  renderCalendarGrid() {
    const container = document.getElementById('calendarGridContainer');
    const startInput = document.getElementById('calStartDateInput');
    const endInput = document.getElementById('calEndDateInput');
    if (!container) return;

    const baseMonth = new Date(this.calendarViewDate.getFullYear(), this.calendarViewDate.getMonth(), 1);
    const month2 = new Date(this.calendarViewDate.getFullYear(), this.calendarViewDate.getMonth() + 1, 1);

    container.innerHTML = [baseMonth, month2].map(mObj => {
      const year = mObj.getFullYear();
      const month = mObj.getMonth();
      const firstDayIndex = new Date(year, month, 1).getDay();
      const totalDays = new Date(year, month + 1, 0).getDate();

      let daysHtml = '';
      for (let i = 0; i < firstDayIndex; i++) {
        daysHtml += `<div class="cal-day-cell empty"></div>`;
      }

      const todayYMD = this.formatYMD(new Date());

      for (let day = 1; day <= totalDays; day++) {
        const ymd = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        let cellClass = 'cal-day-cell';

        if (ymd === todayYMD) cellClass += ' today';

        const isStart = (this.customStartDate === ymd);
        const isEnd = (this.customEndDate === ymd);
        const isSingle = (isStart && isEnd);

        if (isSingle) {
          cellClass += ' range-single';
        } else if (isStart) {
          cellClass += ' range-start';
        } else if (isEnd) {
          cellClass += ' range-end';
        } else if (this.customStartDate && this.customEndDate && ymd > this.customStartDate && ymd < this.customEndDate) {
          cellClass += ' in-range';
        } else if (this.customStartDate && !this.customEndDate && this.hoverDate && ymd > this.customStartDate && ymd <= this.hoverDate) {
          cellClass += ' in-range';
        }

        daysHtml += `<div class="${cellClass}" data-date="${ymd}">${day}</div>`;
      }

      return `
        <div class="cal-month-col">
          <div class="cal-days-header">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          </div>
          <div class="cal-days-grid">
            ${daysHtml}
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.cal-day-cell:not(.empty)').forEach(cell => {
      const ymd = cell.dataset.date;
      cell.addEventListener('click', () => this.handleDateCellClick(ymd));
      cell.addEventListener('mouseenter', () => {
        if (this.customStartDate && !this.customEndDate) {
          this.hoverDate = ymd;
          this.renderCalendarGrid();
        }
      });
    });

    if (startInput) startInput.value = this.formatShortDate(this.customStartDate) || 'Start Date';
    if (endInput) endInput.value = this.formatShortDate(this.customEndDate) || 'End Date';
  }

  handleDateCellClick(ymd) {
    this.currentDateFilter = 'custom';
    this.syncPresetsRadioUI();

    const isSingleMode = Boolean(this.customStartDate && (!this.customEndDate || this.customStartDate === this.customEndDate));

    if (!this.customStartDate && !this.customEndDate) {
      this.customStartDate = ymd;
      this.customEndDate = ymd;
    } else if (isSingleMode) {
      if (ymd === this.customStartDate) {
        this.customStartDate = ymd;
        this.customEndDate = ymd;
      } else if (ymd > this.customStartDate) {
        this.customEndDate = ymd;
      } else {
        this.customEndDate = this.customStartDate;
        this.customStartDate = ymd;
      }
    } else {
      if (ymd === this.customStartDate) {
        this.customStartDate = ymd;
        this.customEndDate = ymd;
      } else if (ymd === this.customEndDate) {
        this.customStartDate = ymd;
        this.customEndDate = ymd;
      } else {
        this.customStartDate = ymd;
        this.customEndDate = ymd;
      }
    }

    this.hoverDate = null;
    this.renderCalendarGrid();
  }



  normalizePhone(phone) {
    if (!phone) return '';
    let cleaned = String(phone).replace(/\D/g, '').trim();
    if (cleaned.length < 6) return '';
    if (cleaned.startsWith('880')) {
      cleaned = cleaned.slice(2);
    }
    return cleaned;
  }

  matchNames(name1, name2) {
    if (!name1 || !name2) return false;
    const clean1 = String(name1).toLowerCase().replace(/[^\w\s\u0980-\u09FF]/g, ' ').trim();
    const clean2 = String(name2).toLowerCase().replace(/[^\w\s\u0980-\u09FF]/g, ' ').trim();
    
    if (clean1 === clean2) return true;
    if (clean1.includes(clean2) || clean2.includes(clean1)) return true;

    const ignoreWords = new Set(['customer', 'walk-in', 'walkin', 'cust', 'n/a', 'na', 'n', 'a']);
    const tokens1 = clean1.split(/\s+/).filter(w => w.length >= 3 && !ignoreWords.has(w));
    const tokens2 = clean2.split(/\s+/).filter(w => w.length >= 3 && !ignoreWords.has(w));

    if (tokens1.length === 0 || tokens2.length === 0) return false;

    return tokens1.some(t1 => tokens2.some(t2 => t1 === t2 || t1.includes(t2) || t2.includes(t1)));
  }

  switchCustProfileTab(tab) {
    const memosTab = document.getElementById('cashierCustMemosTabContent');
    const productsTab = document.getElementById('cashierCustProductsTabContent');
    const memosBtn = document.getElementById('cashierTabMemosBtn');
    const productsBtn = document.getElementById('cashierTabProductsBtn');

    if (tab === 'memos') {
      if (memosTab) memosTab.style.display = 'block';
      if (productsTab) productsTab.style.display = 'none';
      memosBtn?.classList.add('active');
      productsBtn?.classList.remove('active');
    } else {
      if (memosTab) memosTab.style.display = 'none';
      if (productsTab) productsTab.style.display = 'block';
      memosBtn?.classList.remove('active');
      productsBtn?.classList.add('active');
    }
  }

  viewCustomerOrders(phoneOrName) {
    this.sales = JSON.parse(localStorage.getItem('pos_sales')) || (typeof INITIAL_SALES !== 'undefined' ? INITIAL_SALES : []);
    this.customers = JSON.parse(localStorage.getItem('pos_customers')) || (typeof INITIAL_CUSTOMERS !== 'undefined' ? INITIAL_CUSTOMERS : []);

    const isGuestQuery = (phoneOrName === 'GUEST' || phoneOrName === 'guest' || phoneOrName === 'CUST-GUEST');
    const cleanInputPhone = this.normalizePhone(phoneOrName);
    let c = null;

    if (isGuestQuery) {
      c = {
        id: 'GUEST',
        name: 'গেস্ট / ওয়াক-ইন কাস্টমার',
        phone: 'অনিবন্ধিত কাস্টমার',
        email: 'N/A',
        address: 'দোকানে আগত সাধারণ ক্রেতা',
        status: 'active',
        createdAt: 'সিস্টেম অটো'
      };
    } else {
      if (phoneOrName) {
        c = this.customers.find(x => x.id === phoneOrName || x.phone === phoneOrName || x.name === phoneOrName);
      }
      if (!c && cleanInputPhone) {
        c = this.customers.find(x => this.normalizePhone(x.phone) === cleanInputPhone);
      }
    }

    const custName = c ? c.name : phoneOrName;
    const custPhone = c ? c.phone : (cleanInputPhone || phoneOrName);

    // Deep multi-criteria sales matching across ID, phone, and name
    const custSales = this.sales.filter(s => {
      if (isGuestQuery) {
        return this.isGuestSale(s);
      }

      if (this.isGuestSale(s)) return false;

      // 1. Exact Customer ID match
      if (c && c.id && s.customerId && s.customerId === c.id) return true;
      if (phoneOrName && s.customerId && s.customerId === phoneOrName) return true;

      // 2. Phone match
      if (c && c.phone && s.customerPhone) {
        const cPhoneNorm = this.normalizePhone(c.phone);
        const sPhoneNorm = this.normalizePhone(s.customerPhone);
        if (cPhoneNorm && sPhoneNorm && cPhoneNorm === sPhoneNorm) return true;
      }
      if (cleanInputPhone && s.customerPhone) {
        const sPhoneNorm = this.normalizePhone(s.customerPhone);
        if (sPhoneNorm && sPhoneNorm === cleanInputPhone) return true;
      }

      // 3. Name match
      if (s.customer && custName && this.matchNames(s.customer, custName)) return true;
      if (c && c.name && s.customer && this.matchNames(s.customer, c.name)) return true;
      if (c && c.firstName && s.customer && this.matchNames(s.customer, c.firstName)) return true;
      if (c && c.lastName && s.customer && this.matchNames(s.customer, c.lastName)) return true;

      // 4. Fallback: ID mentioned in customer field
      if (c && c.id && s.customer && s.customer.includes(c.id)) return true;
      if (phoneOrName && s.customer && s.customer.includes(phoneOrName)) return true;

      return false;
    });

    custSales.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

    // Auto-bind unlinked sales to this customer ID & sync totals (ONLY FOR REGISTERED CUSTOMERS)
    if (c && c.id !== 'GUEST' && custSales.length > 0) {
      let salesChanged = false;
      custSales.forEach(s => {
        if (!s.customerId || s.customerId !== c.id) {
          s.customerId = c.id;
          salesChanged = true;
        }
      });
      if (salesChanged) {
        localStorage.setItem('pos_sales', JSON.stringify(this.sales));
      }
      
      const newTotalOrders = custSales.length;
      const newTotalSpent = custSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
      if (c.totalOrders !== newTotalOrders || c.totalSpent !== newTotalSpent) {
        c.totalOrders = newTotalOrders;
        c.totalSpent = newTotalSpent;
        localStorage.setItem('pos_customers', JSON.stringify(this.customers));
        this.renderCashierCustomers();
      }
    }

    // Aggregate Product Statistics ("কী কী অর্ডার করেছে")
    const productMap = {};
    let totalItemsCount = 0;

    custSales.forEach(sale => {
      (sale.items || []).forEach(item => {
        const key = `${item.name}__${item.color || ''}__${item.size || ''}`;
        const qty = Number(item.quantity) || 1;
        const subtotal = Number(item.subtotal || (item.price * qty)) || 0;
        totalItemsCount += qty;

        if (!productMap[key]) {
          productMap[key] = {
            name: item.name,
            variant: [item.color, item.size].filter(Boolean).join(' / ') || 'Standard',
            price: item.price,
            totalQty: 0,
            totalSpend: 0
          };
        }
        productMap[key].totalQty += qty;
        productMap[key].totalSpend += subtotal;
      });
    });

    const totalSpentSum = custSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    const isBlocked = c && c.status === 'blocked';
    const statusHeaderBadge = isBlocked 
      ? `<span class="badge" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; font-size: 0.8rem; margin-left: 8px;"><i class="fa-solid fa-ban"></i> ব্লকড প্রোফাইল</span>`
      : `<span class="badge" style="background: rgba(16, 185, 129, 0.2); color: var(--accent-green); font-size: 0.8rem; margin-left: 8px;"><i class="fa-solid fa-circle-check"></i> অ্যাক্টিভ</span>`;

    // Render Header Info Card
    const headerEl = document.getElementById('cashierCustProfileHeaderInfo');
    if (headerEl) {
      const firstChar = (custName || 'C').charAt(0).toUpperCase();
      headerEl.innerHTML = `
        <div class="cust-profile-header-card">
          <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
            <div class="cust-avatar-circle" style="${isBlocked ? 'background: linear-gradient(135deg, #ef4444, #dc2626);' : ''}">${firstChar}</div>
            <div style="flex: 1; min-width: 220px;">
              <h3 style="margin: 0; font-size: 1.2rem; color: var(--text-main); font-weight: 700;">${custName} ${statusHeaderBadge}</h3>
              <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 0.35rem; font-size: 0.85rem; color: var(--text-muted);">
                <span><i class="fa-solid fa-phone" style="color: var(--accent-blue);"></i> ${c?.phone || custPhone || 'ফোন নম্বর নেই'}</span>
                <span><i class="fa-solid fa-envelope" style="color: var(--accent-purple);"></i> ${c?.email || 'ইমেইল নেই'}</span>
                <span><i class="fa-solid fa-location-dot" style="color: var(--accent-green);"></i> ${c?.address || 'ঠিকানা নেই'}</span>
              </div>
            </div>
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
              <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 0.5rem 0.85rem; border-radius: 8px; text-align: center;">
                <small style="color: var(--text-muted); display: block; font-size: 0.75rem;">মোট বিল</small>
                <strong style="color: var(--accent-green); font-size: 1rem;">৳${totalSpentSum.toFixed(2)}</strong>
              </div>
              <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); padding: 0.5rem 0.85rem; border-radius: 8px; text-align: center;">
                <small style="color: var(--text-muted); display: block; font-size: 0.75rem;">মোট মেমো</small>
                <strong style="color: var(--accent-blue); font-size: 1rem;">${custSales.length} টি</strong>
              </div>
              <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); padding: 0.5rem 0.85rem; border-radius: 8px; text-align: center;">
                <small style="color: var(--text-muted); display: block; font-size: 0.75rem;">মোট পিস প্রডাক্ট</small>
                <strong style="color: var(--accent-purple); font-size: 1rem;">${totalItemsCount} টি</strong>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Render Memos Tab Content
    const memosContainer = document.getElementById('cashierCustMemosContainer');
    if (memosContainer) {
      if (custSales.length === 0) {
        memosContainer.innerHTML = `<div class="text-center py-4 text-muted"><i class="fa-solid fa-receipt mb-2" style="font-size: 2rem;"></i><p>এই কাস্টমারের কোনো কেনাকাটার মেমো পাওয়া যায়নি</p></div>`;
      } else {
        memosContainer.innerHTML = custSales.map(s => {
          const formattedDate = s.date || new Date(s.timestamp || Date.now()).toLocaleString('bn-BD');
          const itemsList = s.items || [];
          return `
            <div class="cust-memo-card">
              <div class="cust-memo-header">
                <div>
                  <strong style="color: var(--accent-blue); font-size: 1rem;">${s.id}</strong>
                  <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 0.5rem;"><i class="fa-regular fa-clock"></i> ${formattedDate}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <span class="badge" style="background: rgba(59, 130, 246, 0.15); color: var(--accent-blue);">${s.paymentMethod || 'CASH'}</span>
                  <strong style="color: var(--accent-green); font-size: 1.05rem;">৳${(s.grandTotal || 0).toFixed(2)}</strong>
                  <button type="button" class="btn btn-sm btn-outline" onclick="cashier.viewSaleMemoDirect('${s.id}')" title="মেমো দেখুন / প্রিন্ট করুন">
                    <i class="fa-solid fa-print"></i> মেমো
                  </button>
                </div>
              </div>
              <div class="cust-memo-body">
                <table class="nested-item-table">
                  <thead>
                    <tr>
                      <th>পণ্য</th>
                      <th>ভেরিয়েন্ট</th>
                      <th class="text-center">পরিমাণ</th>
                      <th class="text-right">একক মূল্য</th>
                      <th class="text-right">মোট</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsList.map(item => `
                      <tr>
                        <td><strong>${item.name}</strong></td>
                        <td><small class="text-muted">${[item.color, item.size].filter(Boolean).join(' / ') || 'Standard'}</small></td>
                        <td class="text-center">${item.quantity} পিস</td>
                        <td class="text-right">৳${item.price}</td>
                        <td class="text-right"><strong>৳${item.subtotal || (item.price * item.quantity)}</strong></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Render Aggregated Products Table Body
    const productsTbody = document.getElementById('cashierCustProductsTableBody');
    if (productsTbody) {
      const productList = Object.values(productMap);
      if (productList.length === 0) {
        productsTbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">কোনো অর্ডারের তথ্য নেই</td></tr>`;
      } else {
        productsTbody.innerHTML = productList.map(prod => `
          <tr>
            <td><strong style="color: var(--text-main);">${prod.name}</strong></td>
            <td><span class="badge" style="background: rgba(139, 92, 246, 0.15); color: var(--accent-purple);">${prod.variant}</span></td>
            <td>৳${prod.price}</td>
            <td><strong style="color: var(--accent-blue);">${prod.totalQty} পিস</strong></td>
            <td><strong style="color: var(--accent-green);">৳${prod.totalSpend.toFixed(2)}</strong></td>
          </tr>
        `).join('');
      }
    }

    // Default to Memos Tab
    this.switchCustProfileTab('memos');
    this.openModal('cashierCustomerProfileModal');
  }

  viewSaleMemoDirect(saleId) {
    this.sales = JSON.parse(localStorage.getItem('pos_sales')) || (typeof INITIAL_SALES !== 'undefined' ? INITIAL_SALES : []);
    const sale = this.sales.find(s => s.id === saleId);
    if (sale) {
      this.showReceiptModal(sale);
    } else {
      alert('মেমো রেকর্ড পাওয়া যায়নি!');
    }
  }

  openAddNewCustomerModal() {
    const phoneInput = document.getElementById('cashierFormPhone');
    const nameInput = document.getElementById('cashierFormName');
    const emailInput = document.getElementById('cashierFormEmail');
    const addressInput = document.getElementById('cashierFormAddress');

    if (phoneInput) phoneInput.value = '';
    if (nameInput) nameInput.value = '';
    if (emailInput) emailInput.value = '';
    if (addressInput) addressInput.value = '';

    this.openModal('cashierCustomerFormModal');
  }

  saveCustomerFromModal() {
    const rawPhone = document.getElementById('cashierFormPhone')?.value.trim() || '';
    const name = document.getElementById('cashierFormName')?.value.trim() || '';
    const email = document.getElementById('cashierFormEmail')?.value.trim() || '';
    const address = document.getElementById('cashierFormAddress')?.value.trim() || '';

    if (!rawPhone || rawPhone.length !== 11) {
      alert('ফোন নম্বর অবশ্যই ১১ ডিজিটের হতে হবে (যেমন: 01700000000)!');
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা দিন (যেমন: customer@gmail.com)!');
      return;
    }

    const nameParts = (name || `Customer (${rawPhone})`).split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    this.updateOrCreateCustomerOnSale(rawPhone, firstName, lastName, name, email, address, 0);
    this.closeModal('cashierCustomerFormModal');
    this.renderCashierCustomers();
    alert('কাস্টমার প্রোফাইল সফলভাবে তৈরি হয়েছে!');
  }

  // --- INVOICE RETURN & EXCHANGE ENGINE ---
  searchAndOpenInvoiceReturnModal() {
    const input = document.getElementById('shiftInvoiceSearchInput');
    const val = input ? input.value.trim() : '';
    if (!val) {
      this.showToast('অনুগ্রহ করে ইনভয়েস আইডি নাম্বার লিখুন বা স্ক্যান করুন', 'warning');
      return;
    }
    this.handleBarcodeScan(val);
    if (input) input.value = '';
  }

  openInvoiceReturnExchangeModal(saleId) {
    const sale = this.sales.find(s => s.id === saleId);
    if (!sale) {
      this.showToast('ইনভয়েস খুঁজে পাওয়া যায়নি!', 'error');
      return;
    }

    this.activeRetExSaleId = saleId;
    this.retExMode = 'RETURN';

    const idEl = document.getElementById('retExInvId');
    const badgeEl = document.getElementById('retExStatusBadge');
    const metaEl = document.getElementById('retExInvMeta');
    const totalEl = document.getElementById('retExOriginalTotal');

    if (idEl) idEl.innerText = sale.id;
    if (badgeEl) {
      const b = this.getPaymentBadge(sale);
      badgeEl.innerText = b.label;
      badgeEl.style.background = b.bg;
      badgeEl.style.color = b.color;
    }
    if (metaEl) {
      const dt = new Date(sale.timestamp).toLocaleString('bn-BD');
      metaEl.innerText = `তারিখ: ${dt} | কাস্টমার: ${sale.customerName || 'Walk-in'} | পেমেন্ট: ${sale.paymentMethod || 'CASH'}`;
    }
    if (totalEl) totalEl.innerText = `৳${(sale.grandTotal || 0).toFixed(2)}`;

    const tbody = document.getElementById('retExItemsTableBody');
    if (tbody) {
      if (!sale.items || sale.items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted p-3">এই ইনভয়েসে কোনো আইটেম পাওয়া যায়নি</td></tr>`;
      } else {
        tbody.innerHTML = sale.items.map((item, idx) => {
          const varText = item.color || item.size ? `(${item.color || ''} / ${item.size || ''})` : '';
          const returned = item.returnedQuantity || 0;
          const maxReturnable = Math.max(0, item.quantity - returned);
          const price = item.price || 0;
          return `
            <tr>
              <td>
                <strong>${item.name}</strong><br>
                <small class="text-muted">বারকোড: ${item.barcode || 'N/A'} ${varText}</small>
              </td>
              <td>৳${price.toFixed(2)}</td>
              <td>${item.quantity} টি</td>
              <td><span class="badge ${returned > 0 ? 'bg-orange' : 'bg-secondary'}" style="padding: 2px 8px; font-weight:700;">${returned} টি</span></td>
              <td>
                <input type="number" id="retQtyInput_${idx}" class="form-control form-control-sm ret-qty-input" 
                       value="0" min="0" max="${maxReturnable}" data-price="${price}" data-index="${idx}"
                       ${maxReturnable === 0 ? 'disabled' : ''} onchange="cashier.calculateReturnExchangeTotals()">
              </td>
              <td style="text-align: right; font-weight: 700;" id="retItemSubtotal_${idx}">৳0.00</td>
            </tr>
          `;
        }).join('');
      }
    }

    this.calculateReturnExchangeTotals();
    this.openModal('invoiceReturnExchangeModal');
  }

  calculateReturnExchangeTotals() {
    const sale = this.sales.find(s => s.id === this.activeRetExSaleId);
    if (!sale || !sale.items) return;

    let totalReturnedVal = 0;
    sale.items.forEach((item, idx) => {
      const input = document.getElementById(`retQtyInput_${idx}`);
      const subEl = document.getElementById(`retItemSubtotal_${idx}`);
      if (input) {
        const qty = parseInt(input.value) || 0;
        const sub = qty * (item.price || 0);
        totalReturnedVal += sub;
        if (subEl) subEl.innerText = `৳${sub.toFixed(2)}`;
      }
    });

    const labelEl = document.getElementById('retExSummaryLabel');
    const amountEl = document.getElementById('retExSummaryAmount');

    if (labelEl) labelEl.innerText = 'কাস্টমারকে ফেরতযোগ্য রিফান্ড টাকা (Refund Amount):';
    if (amountEl) {
      amountEl.innerText = `৳${totalReturnedVal.toFixed(2)}`;
      amountEl.style.color = 'var(--accent-red, #ef4444)';
    }
  }

  executeReturnOrExchange() {
    const sale = this.sales.find(s => s.id === this.activeRetExSaleId);
    if (!sale || !sale.items) {
      this.showToast('ইনভয়েস খুঁজে পাওয়া যায়নি!', 'error');
      return;
    }

    const returnPayload = [];
    let totalRefundAmount = 0;

    sale.items.forEach((item, idx) => {
      const input = document.getElementById(`retQtyInput_${idx}`);
      if (input) {
        const qtyToReturn = parseInt(input.value) || 0;
        if (qtyToReturn > 0) {
          returnPayload.push({
            itemIndex: idx,
            itemId: item.id,
            name: item.name,
            variantId: item.variantId,
            color: item.color,
            size: item.size,
            unitPrice: item.price,
            qtyReturned: qtyToReturn,
            subtotalRefund: qtyToReturn * item.price
          });
          totalRefundAmount += qtyToReturn * item.price;
        }
      }
    });

    if (returnPayload.length === 0) {
      this.showToast('অনুগ্রহ করে অন্তত ১টি আইটেম রিটার্নের জন্য নির্বাচন করুন', 'warning');
      return;
    }

    // 1. Restock returned items to shop inventory
    returnPayload.forEach(ret => {
      const prod = this.products.find(p => p.id === ret.itemId || p.name === ret.name);
      if (prod) {
        prod.stock = (prod.stock || 0) + ret.qtyReturned;
        if (prod.variants && Array.isArray(prod.variants)) {
          const v = prod.variants.find(varObj => varObj.variantId === ret.variantId || (varObj.color === ret.color && varObj.size === ret.size));
          if (v) {
            v.stock = (v.stock || 0) + ret.qtyReturned;
          }
        }
      }

      const origItem = sale.items[ret.itemIndex];
      if (origItem) {
        origItem.returnedQuantity = (origItem.returnedQuantity || 0) + ret.qtyReturned;
      }
    });

    sale.refundedAmount = (sale.refundedAmount || 0) + totalRefundAmount;
    sale.returnHistory = sale.returnHistory || [];
    sale.returnHistory.push({
      timestamp: Date.now(),
      returnedItems: returnPayload,
      refundAmount: totalRefundAmount
    });

    const allFullyReturned = sale.items.every(i => (i.returnedQuantity || 0) >= i.quantity);
    sale.status = allFullyReturned ? 'RETURNED' : 'PARTIALLY_RETURNED';

    this.showToast(`ইনভয়েস ${sale.id} থেকে ৳${totalRefundAmount.toFixed(2)} সফলভাবে রিটার্ন নেওয়া হয়েছে!`);

    localStorage.setItem('pos_products', JSON.stringify(this.products));
    localStorage.setItem('pos_sales', JSON.stringify(this.sales));

    if (window.posFirebase && typeof window.posFirebase.saveDoc === 'function') {
      window.posFirebase.saveDoc('pos_products', this.products);
      window.posFirebase.saveDoc('pos_sales', this.sales);
    }

    window.dispatchEvent(new CustomEvent('pos_sales_update'));

    this.playAudioBeep('success');
    this.closeModal('invoiceReturnExchangeModal');

    this.renderProducts();
    this.renderDashboardView();
    this.renderAnalyticsView();
    this.renderShiftSales();
  }

  // --- RETURN & EXCHANGE BREAKDOWN MODALS ---
  openCashierReturnsModal() {
    const targetSales = this.getCashierFilteredSales();
    const returnedSales = targetSales.filter(s => s.status === 'RETURNED' || s.status === 'PARTIALLY_RETURNED' || (s.returnHistory && s.returnHistory.length > 0));

    let totalRefund = 0;
    let totalItemQty = 0;
    let invCount = returnedSales.length;

    const rows = [];

    returnedSales.forEach(s => {
      const histories = (s.returnHistory && s.returnHistory.length > 0) ? s.returnHistory : [{ timestamp: s.timestamp, returnedItems: [], refundAmount: s.refundedAmount || 0 }];
      histories.forEach(h => {
        const refAmt = h.refundAmount || 0;
        totalRefund += refAmt;

        const itemTexts = (h.returnedItems || []).map(i => {
          totalItemQty += (i.qtyReturned || 0);
          return `${i.name} (${i.color || ''}/${i.size || ''}) x${i.qtyReturned}`;
        }).join(', ') || 'রিটার্নকৃত প্রোডাক্ট';

        const dt = new Date(h.timestamp || s.timestamp).toLocaleString('bn-BD');
        rows.push(`
          <tr>
            <td><strong>${s.id}</strong></td>
            <td><small>${dt}</small></td>
            <td>${s.customerName || 'Walk-in Customer'}</td>
            <td><small>${itemTexts}</small></td>
            <td style="text-align: center;"><span class="badge bg-orange" style="font-weight:700; padding:3px 8px;">${h.returnedItems && h.returnedItems.length > 0 ? h.returnedItems.reduce((acc, x) => acc + (x.qtyReturned||0), 0) : 1} টি</span></td>
            <td style="text-align: right; font-weight: 700; color: var(--accent-red, #ef4444);">৳${refAmt.toFixed(2)}</td>
            <td style="text-align: center;">
              <button class="btn btn-outline btn-sm" onclick="cashier.openInvoiceReturnExchangeModal('${s.id}')" title="ইনভয়েস বিবরণী">
                <i class="fa-solid fa-receipt"></i> মেমো
              </button>
            </td>
          </tr>
        `);
      });
    });

    const elRefund = document.getElementById('retModalTotalRefund');
    const elInvCount = document.getElementById('retModalInvCount');
    const elItemQty = document.getElementById('retModalItemQty');
    const tbody = document.getElementById('cashierReturnsTableBody');

    if (elRefund) elRefund.innerText = `৳${totalRefund.toFixed(2)}`;
    if (elInvCount) elInvCount.innerText = `${invCount} টি`;
    if (elItemQty) elItemQty.innerText = `${totalItemQty} টি`;

    if (tbody) {
      if (rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted p-3">এখনো কোনো পণ্য রিটার্নের রেকর্ড নেই।</td></tr>`;
      } else {
        tbody.innerHTML = rows.join('');
      }
    }

    this.openModal('cashierReturnsModal');
  }

  openVatDiscountModal(tabFilter = 'all') {
    this.currentVatDiscTab = tabFilter || 'all';
    const targetSales = this.getCashierFilteredSales();

    let totalVat = 0;
    let totalCouponDisc = 0;
    let totalManualDisc = 0;
    let vatSalesCount = 0;
    let couponSalesCount = 0;
    let manualSalesCount = 0;

    targetSales.forEach(s => {
      const vatAmt = s.tax || 0;
      const discAmt = s.discount || 0;
      const hasCoupon = Boolean(s.couponCode || s.coupon || (s.couponDiscount && s.couponDiscount > 0));

      if (vatAmt > 0) {
        totalVat += vatAmt;
        vatSalesCount++;
      }

      if (hasCoupon) {
        totalCouponDisc += (s.couponDiscount !== undefined ? s.couponDiscount : discAmt);
        couponSalesCount++;
      } else if (discAmt > 0) {
        totalManualDisc += (s.manualDiscount !== undefined ? s.manualDiscount : discAmt);
        manualSalesCount++;
      }
    });

    const elCouponTot = document.getElementById('cashVatDiscModalCouponTotal');
    const elCouponCnt = document.getElementById('cashVatDiscModalCouponCount');
    const elManualTot = document.getElementById('cashVatDiscModalManualTotal');
    const elManualCnt = document.getElementById('cashVatDiscModalManualCount');
    const elTaxTot = document.getElementById('cashVatDiscModalTaxTotal');
    const elTaxCnt = document.getElementById('cashVatDiscModalTaxCount');
    const elNetBal = document.getElementById('cashVatDiscModalNetBalance');

    if (elCouponTot) elCouponTot.innerText = `৳${totalCouponDisc.toFixed(2)}`;
    if (elCouponCnt) elCouponCnt.innerText = `${couponSalesCount} টি মেমোতে কুপন প্রয়োগ`;
    if (elManualTot) elManualTot.innerText = `৳${totalManualDisc.toFixed(2)}`;
    if (elManualCnt) elManualCnt.innerText = `${manualSalesCount} টি মেমোতে সরাসরি ছাড়`;
    if (elTaxTot) elTaxTot.innerText = `৳${totalVat.toFixed(2)}`;
    if (elTaxCnt) elTaxCnt.innerText = `${vatSalesCount} টি মেমোতে ভ্যাট যোগ করা হয়েছে`;

    const totalDisc = totalCouponDisc + totalManualDisc;
    const netBal = totalVat - totalDisc;
    if (elNetBal) {
      if (netBal > 0) {
        elNetBal.innerHTML = `<span style="color: var(--accent-green, #10b981);"><i class="fa-solid fa-arrow-up"></i> +৳${netBal.toFixed(2)} (ভ্যাট কালেকশন বেশি)</span>`;
      } else if (netBal < 0) {
        elNetBal.innerHTML = `<span style="color: #ef4444;"><i class="fa-solid fa-arrow-down"></i> -৳${Math.abs(netBal).toFixed(2)} (ডিসকাউন্ট ছাড় বেশি)</span>`;
      } else {
        elNetBal.innerHTML = `<span style="color: var(--text-muted);">৳0.00 (সমান ভারসাম্য)</span>`;
      }
    }

    this.filterVatDiscountModal(this.currentVatDiscTab);
    this.openModal('cashierVatDiscountModal');
  }

  filterVatDiscountModal(tabFilter) {
    this.currentVatDiscTab = tabFilter || 'all';
    const targetSales = this.getCashierFilteredSales();

    const allMatchedSales = targetSales.filter(s => (s.tax || 0) > 0 || (s.discount || 0) > 0 || s.couponCode || s.coupon);
    const couponMatchedSales = targetSales.filter(s => Boolean(s.couponCode || s.coupon || (s.couponDiscount && s.couponDiscount > 0)));
    const discountMatchedSales = targetSales.filter(s => !s.couponCode && !s.coupon && (!s.couponDiscount || s.couponDiscount === 0) && (s.discount || 0) > 0);
    const taxMatchedSales = targetSales.filter(s => (s.tax || 0) > 0);

    const cntAll = document.getElementById('cashVatDiscTabCountAll');
    const cntCoupon = document.getElementById('cashVatDiscTabCountCoupon');
    const cntDisc = document.getElementById('cashVatDiscTabCountDiscount');
    const cntTax = document.getElementById('cashVatDiscTabCountTax');

    if (cntAll) cntAll.innerText = allMatchedSales.length;
    if (cntCoupon) cntCoupon.innerText = couponMatchedSales.length;
    if (cntDisc) cntDisc.innerText = discountMatchedSales.length;
    if (cntTax) cntTax.innerText = taxMatchedSales.length;

    const btnAll = document.getElementById('btnCashVatTabAll');
    const btnCoupon = document.getElementById('btnCashVatTabCoupon');
    const btnDisc = document.getElementById('btnCashVatTabDiscount');
    const btnTax = document.getElementById('btnCashVatTabTax');

    if (btnAll) btnAll.classList.toggle('active', tabFilter === 'all');
    if (btnCoupon) btnCoupon.classList.toggle('active', tabFilter === 'coupon');
    if (btnDisc) btnDisc.classList.toggle('active', tabFilter === 'discount');
    if (btnTax) btnTax.classList.toggle('active', tabFilter === 'tax');

    let displaySales = allMatchedSales;
    if (tabFilter === 'coupon') displaySales = couponMatchedSales;
    else if (tabFilter === 'discount') displaySales = discountMatchedSales;
    else if (tabFilter === 'tax') displaySales = taxMatchedSales;

    const tbody = document.getElementById('cashVatDiscModalTableBody');
    if (tbody) {
      if (displaySales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding: 1.5rem;">নির্বাচন করা ক্যাটাগরিতে কোনো মেমো পাওয়া যায়নি।</td></tr>`;
      } else {
        tbody.innerHTML = displaySales.map(s => {
          const dtStr = new Date(s.timestamp).toLocaleString('bn-BD');
          const hasCoupon = Boolean(s.couponCode || s.coupon || (s.couponDiscount && s.couponDiscount > 0));
          const couponAmt = hasCoupon ? (s.couponDiscount !== undefined ? s.couponDiscount : s.discount || 0) : 0;
          const manualAmt = !hasCoupon && (s.discount || 0) > 0 ? (s.manualDiscount !== undefined ? s.manualDiscount : s.discount) : 0;
          const taxAmt = s.tax || 0;

          const couponPill = hasCoupon
            ? `<span class="badge" style="background: rgba(168,85,247,0.15); color: #c084fc; border: 1px solid rgba(168,85,247,0.3); padding: 0.25rem 0.5rem; border-radius: 6px; font-weight: 600;"><i class="fa-solid fa-ticket"></i> ${s.couponCode || 'COUPON'} (-৳${couponAmt.toFixed(2)})</span>`
            : `<span class="text-muted">-</span>`;

          const discTypeStr = s.discountType === 'percent' ? `${s.discountValue || ''}%` : (s.discountType === 'flat' ? `৳${s.discountValue || ''}` : 'ছাড়');
          const manualPill = manualAmt > 0
            ? `<span class="badge" style="background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); padding: 0.25rem 0.5rem; border-radius: 6px; font-weight: 600;"><i class="fa-solid fa-tags"></i> ${discTypeStr} (-৳${manualAmt.toFixed(2)})</span>`
            : `<span class="text-muted">-</span>`;

          const taxTypeStr = s.taxType === 'percent' ? `${s.taxValue || ''}%` : (s.taxType === 'flat' ? `৳${s.taxValue || ''}` : 'ভ্যাট');
          const taxPill = taxAmt > 0
            ? `<span class="badge" style="background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3); padding: 0.25rem 0.5rem; border-radius: 6px; font-weight: 600;"><i class="fa-solid fa-file-invoice-dollar"></i> ${taxTypeStr} (+৳${taxAmt.toFixed(2)})</span>`
            : `<span class="text-muted">-</span>`;

          return `
            <tr>
              <td>
                <strong style="cursor: pointer; color: var(--accent-blue);" onclick="cashier.showReceiptModalById('${s.id}')" title="ইনভয়েস বিবরণী দেখুন">${s.id}</strong>
              </td>
              <td><small>${dtStr}</small></td>
              <td>${s.customer || 'Walk-in Customer'}</td>
              <td>${couponPill}</td>
              <td>${manualPill}</td>
              <td>${taxPill}</td>
              <td style="font-weight: 700; color: var(--text-main);">৳${(s.grandTotal || 0).toFixed(2)}</td>
              <td style="text-align: right;">
                <button class="btn btn-outline btn-sm" onclick="cashier.showReceiptModalById('${s.id}')"><i class="fa-solid fa-receipt"></i> মেমো দেখুন</button>
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  }
}

let cashier;
document.addEventListener('DOMContentLoaded', () => {
  cashier = new CashierTerminal();
  window.cashier = cashier;

  document.getElementById('btnNavCustomers')?.addEventListener('click', () => cashier.switchTab('cashierCustomersView'));
  document.getElementById('cashierAddNewCustBtn')?.addEventListener('click', () => cashier.openAddNewCustomerModal());
  document.getElementById('cashierCustSearchInput')?.addEventListener('input', () => cashier.renderCashierCustomers());
});
