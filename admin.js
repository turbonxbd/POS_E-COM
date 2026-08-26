// Smart POS - Merchant Admin & Warehouse Manager Logic

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

window.addEventListener('resize', () => {
  if (document.body.classList.contains('has-custom-wallpaper')) {
    applyMerchantCustomWallpaper();
  }
});

class AdminPanel {
  constructor() {
    const activeStoreId = localStorage.getItem('pos_active_store_id') || 'store_demo_101';
    const isGuestStore = activeStoreId === 'store_demo_101';

    const tenantProdKey = `pos_tenant_${activeStoreId}_pos_products`;
    const tenantSalesKey = `pos_tenant_${activeStoreId}_pos_sales`;
    const tenantSettingsKey = `pos_tenant_${activeStoreId}_pos_settings`;
    const tenantCatKey = `pos_tenant_${activeStoreId}_pos_categories`;
    const tenantCouponKey = `pos_tenant_${activeStoreId}_pos_coupons`;
    const tenantCustKey = `pos_tenant_${activeStoreId}_pos_customers`;

    let rawProd = localStorage.getItem(tenantProdKey) || localStorage.getItem('pos_products');
    let rawSales = localStorage.getItem(tenantSalesKey) || localStorage.getItem('pos_sales');
    let rawSettings = localStorage.getItem(tenantSettingsKey) || localStorage.getItem('pos_settings');
    let rawCats = localStorage.getItem(tenantCatKey) || localStorage.getItem('pos_categories');
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

    this.categories = rawCats && rawCats !== '[]' ? JSON.parse(rawCats) : (isGuestStore && typeof INITIAL_CATEGORIES !== 'undefined' ? INITIAL_CATEGORIES : []);
    this.coupons = rawCoupons && rawCoupons !== '[]' ? JSON.parse(rawCoupons) : [];
    this.customers = rawCusts && rawCusts !== '[]' ? JSON.parse(rawCusts) : [];
    
    this.activeTab = 'adminAllProducts';
    this.selectedVariantCategory = 'ALL';
    this.editingCategoryId = null;
    this.currentDateFilter = 'today';
    this.customStartDate = null;
    this.customEndDate = null;
    this.calendarViewDate = new Date();
    this.hoverDate = null;

    this.categoryChart = null;
    this.paymentChart = null;

    this.init();
  }

  init() {
    this.checkAccountStatusSecurityGuard();
    setInterval(() => this.checkAccountStatusSecurityGuard(), 3000);

    const reloadAdminState = () => {
      const activeStoreId = localStorage.getItem('pos_active_store_id') || 'store_demo_101';
      const isGuestStore = activeStoreId === 'store_demo_101';

      const tenantProdKey     = `pos_tenant_${activeStoreId}_pos_products`;
      const tenantSalesKey    = `pos_tenant_${activeStoreId}_pos_sales`;
      const tenantSettingsKey = `pos_tenant_${activeStoreId}_pos_settings`;
      const tenantCatKey      = `pos_tenant_${activeStoreId}_pos_categories`;
      const tenantCouponKey   = `pos_tenant_${activeStoreId}_pos_coupons`;
      const tenantCustKey     = `pos_tenant_${activeStoreId}_pos_customers`;

      // Always prefer tenant-scoped key; fall back to global key
      const rawProd     = localStorage.getItem(tenantProdKey)     || localStorage.getItem('pos_products');
      const rawSales    = localStorage.getItem(tenantSalesKey)    || localStorage.getItem('pos_sales');
      const rawSettings = localStorage.getItem(tenantSettingsKey) || localStorage.getItem('pos_settings');
      const rawCats     = localStorage.getItem(tenantCatKey)      || localStorage.getItem('pos_categories');
      const rawCoupons  = localStorage.getItem(tenantCouponKey)   || localStorage.getItem('pos_coupons');
      const rawCusts    = localStorage.getItem(tenantCustKey)     || localStorage.getItem('pos_customers');

      try { this.products  = rawProd     && rawProd     !== '[]' ? JSON.parse(rawProd)     : (isGuestStore && typeof INITIAL_PRODUCTS  !== 'undefined' ? INITIAL_PRODUCTS  : []); } catch(e) { this.products  = []; }
      try { this.sales     = rawSales    && rawSales    !== '[]' ? JSON.parse(rawSales)    : []; }                                                                                    catch(e) { this.sales     = []; }
      try { this.settings  = rawSettings && rawSettings !== '{}' ? JSON.parse(rawSettings) : (typeof DEFAULT_SETTINGS !== 'undefined' ? DEFAULT_SETTINGS : {}); }                   catch(e) { this.settings  = {}; }
      try { this.categories= rawCats     && rawCats     !== '[]' ? JSON.parse(rawCats)     : (isGuestStore && typeof INITIAL_CATEGORIES !== 'undefined' ? INITIAL_CATEGORIES : []); } catch(e) { this.categories= []; }
      try { this.coupons   = rawCoupons  && rawCoupons  !== '[]' ? JSON.parse(rawCoupons)  : []; }                                                                                    catch(e) { this.coupons   = []; }
      try { this.customers = rawCusts    && rawCusts    !== '[]' ? JSON.parse(rawCusts)    : []; }                                                                                    catch(e) { this.customers = []; }

      applyMerchantCustomWallpaper(this.settings);
      this.populateCategoryDropdowns();
      this.renderInventoryTable();
      this.renderCategoryCards();
      this.renderCategoryProductsTable();
      this.renderSalesLog();
      this.renderDashboard();
      this.renderSettingsForm();
      this.renderCoupons();
      this.renderAdminCustomers();
      this.updateSidebarStoreProfile();
    };

    // Single source of truth handler — registered ONCE for all cloud/storage/tenant events
    window.addEventListener('storage',              reloadAdminState);
    window.addEventListener('pos_cloud_update',     reloadAdminState);
    window.addEventListener('pos_tenant_changed',   reloadAdminState);

    window.addEventListener('pos_online_sync_completed', () => {
      reloadAdminState();
      this.showToast('🟢 ইন্টারনেট কানেক্ট হয়েছে! অফলাইনের সকল ডেটা (প্রোডাক্ট, ক্যাটাগরি, সেলস ও সেটিংস) সার্ভারে অটোমেটিক আপডেট করা হয়েছে!');
    });

    this.initEventListeners();
    this.initClock();
    this.initDatePicker();
    this.updateSidebarStoreProfile();
    this.populateCategoryDropdowns();
    this.renderSettingsForm();
    this.renderCoupons();
    this.renderAdminCustomers();
    this.renderDashboard();
    this.renderInventoryTable();
    this.renderCategoryCards();
    this.renderCategoryProductsTable();
    this.initBarcodeGenerator();
    this.renderSalesLog();
    this.setupMobileSidebar();
    this.setupHardwareScanner();

    try {
      this.stateChannel = new BroadcastChannel('pos_state_sync');
      this.stateChannel.onmessage = (event) => {
        if (event.data?.type === 'customers_updated') {
          this.customers = JSON.parse(localStorage.getItem('pos_customers')) || [];
          this.renderAdminCustomers();
        } else if (event.data?.type === 'sales_updated' || event.data?.type === 'products_updated') {
          this.products = JSON.parse(localStorage.getItem('pos_products')) || [];
          this.sales = JSON.parse(localStorage.getItem('pos_sales')) || [];
          this.renderAdminCustomers();
          this.refreshCurrentView();
        }
      };
    } catch (e) {}

    // NOTE: reloadAdminState above is the single authoritative handler for all sync events.
    // BroadcastChannel handler below handles same-browser tab cross-communication only.
    const reloadState = () => {
      const activeStoreId = localStorage.getItem('pos_active_store_id') || 'store_demo_101';
      const isGuestStore = activeStoreId === 'store_demo_101';

      const tenantProdKey     = `pos_tenant_${activeStoreId}_pos_products`;
      const tenantSalesKey    = `pos_tenant_${activeStoreId}_pos_sales`;
      const tenantSettingsKey = `pos_tenant_${activeStoreId}_pos_settings`;
      const tenantCatKey      = `pos_tenant_${activeStoreId}_pos_categories`;
      const tenantCouponKey   = `pos_tenant_${activeStoreId}_pos_coupons`;
      const tenantCustKey     = `pos_tenant_${activeStoreId}_pos_customers`;

      // --- Products: prefer tenant key over global, NEVER overwrite non-empty with empty ---
      const rawTenantProd  = localStorage.getItem(tenantProdKey);
      const rawGlobalProd  = localStorage.getItem('pos_products');
      const parsedTenant   = (rawTenantProd  && rawTenantProd  !== '[]') ? (() => { try { return JSON.parse(rawTenantProd); } catch(e) { return null; } })() : null;
      const parsedGlobal   = (rawGlobalProd  && rawGlobalProd  !== '[]') ? (() => { try { return JSON.parse(rawGlobalProd); } catch(e) { return null; } })() : null;

      if (Array.isArray(parsedTenant) && parsedTenant.length > 0) {
        this.products = parsedTenant;
      } else if (Array.isArray(parsedGlobal) && parsedGlobal.length > 0) {
        this.products = parsedGlobal;
      } else if (!this.products || this.products.length === 0) {
        this.products = (isGuestStore && typeof INITIAL_PRODUCTS !== 'undefined') ? INITIAL_PRODUCTS : [];
      }
      // Always keep both keys consistent after reading
      if (this.products && this.products.length > 0) {
        const prodJson = JSON.stringify(this.products);
        if (rawTenantProd !== prodJson) localStorage.setItem(tenantProdKey, prodJson);
        if (rawGlobalProd !== prodJson) localStorage.setItem('pos_products', prodJson);
      }

      // --- Other keys: read from tenant key, fall back to global ---
      const rawSales    = localStorage.getItem(tenantSalesKey)    || localStorage.getItem('pos_sales');
      const rawSettings = localStorage.getItem(tenantSettingsKey) || localStorage.getItem('pos_settings');
      const rawCats     = localStorage.getItem(tenantCatKey)      || localStorage.getItem('pos_categories');
      const rawCoupons  = localStorage.getItem(tenantCouponKey)   || localStorage.getItem('pos_coupons');
      const rawCusts    = localStorage.getItem(tenantCustKey)     || localStorage.getItem('pos_customers');

      this.sales     = (rawSales    && rawSales    !== '[]') ? JSON.parse(rawSales)    : [];
      this.settings  = (rawSettings && rawSettings !== '{}') ? JSON.parse(rawSettings) : (typeof DEFAULT_SETTINGS !== 'undefined' ? DEFAULT_SETTINGS : {});
      this.categories= (rawCats     && rawCats     !== '[]') ? JSON.parse(rawCats)     : (isGuestStore && typeof INITIAL_CATEGORIES !== 'undefined' ? INITIAL_CATEGORIES : []);
      this.coupons   = (rawCoupons  && rawCoupons  !== '[]') ? JSON.parse(rawCoupons)  : [];
      this.customers = (rawCusts    && rawCusts    !== '[]') ? JSON.parse(rawCusts)    : [];

      applyMerchantCustomWallpaper(this.settings);
      this.updateSidebarStoreProfile();
      this.populateCategoryDropdowns();
      this.renderCoupons();
      this.renderAdminCustomers();
      this.renderDashboard();
      this.renderSalesLog();
      this.renderInventoryTable();
      this.refreshCurrentView();
    };

    // reloadAdminState above is the single authoritative handler — no duplicate registration needed here.

    document.addEventListener('click', (e) => {
      if (e.target.closest('.close-modal')) {
        const modal = e.target.closest('.modal');
        if (modal) modal.classList.remove('active');
      }
    });
  }

  updateSidebarStoreProfile() {
    const s = this.settings || JSON.parse(localStorage.getItem('pos_settings')) || {};
    const sub = JSON.parse(localStorage.getItem('pos_subscription')) || JSON.parse(localStorage.getItem('pos_active_subscription')) || {};
    const storeName = s.storeName || sub.storeName || 'SmartPOS Admin';
    const ownerName = s.storeOwner || sub.ownerName || s.ownerName || 'মার্চেন্ট';
    const storeLogo = s.storeLogo || sub.storeLogo || '';

    const brandNameEl = document.getElementById('adminSidebarStoreName');
    const storeTitleEl = document.getElementById('adminSidebarStoreTitle');
    const ownerNameEl = document.getElementById('adminSidebarOwnerName');

    if (brandNameEl) brandNameEl.textContent = storeName;
    if (storeTitleEl) storeTitleEl.textContent = storeName;
    if (ownerNameEl) ownerNameEl.textContent = `মালিক: ${ownerName}`;

    const profileDiv = document.querySelector('.sidebar-footer .store-profile div');
    if (profileDiv) {
      profileDiv.innerHTML = `
        <strong>${storeName}</strong>
        <small>Owner: ${ownerName}</small>
      `;
    }

    // Top-Left Sidebar Main Logo Update
    const logoContainer = document.getElementById('adminSidebarBrandLogo');
    const logoIcon = document.getElementById('adminSidebarBrandIcon');
    const logoImg = document.getElementById('adminSidebarBrandImg');

    if (logoImg && logoIcon && logoContainer) {
      if (storeLogo) {
        logoImg.src = storeLogo;
        logoImg.style.display = 'block';
        logoIcon.style.display = 'none';
        logoContainer.style.background = 'transparent';
      } else {
        logoImg.style.display = 'none';
        logoIcon.style.display = 'block';
        logoContainer.style.background = 'linear-gradient(135deg, var(--accent-orange), var(--accent-purple))';
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

      let overlay = document.getElementById('accountBlockedOverlayGate');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'accountBlockedOverlayGate';
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
              ${isBlocked ? 'আপনার মার্চেন্ট অ্যাকাউন্টটি সুপার এডমিন দ্বারা স্থগিত বা বন্ধ রাখা হয়েছে।' : 'আপনার মার্চেন্ট এডমিন প্যানেল সাবস্ক্রিপশনের মেয়াদের সময় শেষ হয়ে গেছে। নিরবচ্ছিন্ন সেবা পেতে এখনই প্যাকেজ রিনিউ করুন।'}
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
      const existingOverlay = document.getElementById('accountBlockedOverlayGate');
      if (existingOverlay) existingOverlay.remove();
    }

    // 2. Access Fee Block Check
    if (sub.accessBlocked === true || sub.accessFeePaid === false) {
      if (typeof window.openSubscriptionRenewModal === 'function') {
        setTimeout(() => window.openSubscriptionRenewModal(), 1000);
      }
    }
  }

  initClock() {
    const clockEl = document.getElementById('adminClock');
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

      // Midnight Rollover Check: Auto refresh views when calendar date changes past 12:00 AM midnight
      if (this.lastTrackedDate && this.lastTrackedDate !== currentDateStr) {
        this.lastTrackedDate = currentDateStr;
        if (typeof this.applyPresetRange === 'function' && (this.currentDateFilter === 'today' || !this.currentDateFilter)) {
          this.applyPresetRange(this.currentDateFilter || 'today');
        }
        if (typeof this.renderDashboard === 'function') {
          this.renderDashboard();
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
    toast.style.color = '#ffffff';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '10px';
    toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
    toast.style.zIndex = '99999';
    toast.style.fontWeight = '600';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '10px';
    toast.style.fontSize = '0.92rem';

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  openModal(modalId) {
    const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
    if (modal) modal.classList.add('active');
  }

  closeModal(modalId) {
    const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
    if (modal) modal.classList.remove('active');
  }

  refreshCurrentView() {
    this.renderDashboard();
    this.renderInventoryTable();
    this.renderCategoryCards();
    this.renderCategoryProductsTable();
    this.initBarcodeGeneratorOptions();
    this.renderSalesLog();
    this.renderAdminCustomers();
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    
    document.querySelectorAll('.sidebar .nav-item[data-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    const views = {
      'adminDashboard': 'adminDashboardView',
      'adminAllProducts': 'adminAllProductsView',
      'adminVariants': 'adminVariantsView',
      'adminBarcodes': 'adminBarcodesView',
      'adminSales': 'adminSalesView',
      'adminCustomers': 'adminCustomersView',
      'adminSettings': 'adminSettingsView'
    };

    const titles = {
      'adminDashboard': 'মার্চেন্ট ওভারভিউ ও অ্যানালিটিক্স',
      'adminAllProducts': 'সকল প্রোডাক্ট তালিকা (All Products Catalog)',
      'adminVariants': 'প্রোডাক্ট ক্যাটাগরি হাব (Product Category Hub)',
      'adminBarcodes': 'বারকোড স্টিকার প্রিন্টার হাব',
      'adminSales': 'বিক্রি ইতিহাস ও লাভ (Sales Log)',
      'adminCustomers': 'কাস্টমার প্রোফাইল ও ব্যবস্থাপনা (Customer Management Hub)',
      'adminSettings': 'দোকান সেটিংস ও শপ ম্যানেজমেন্ট (Shop Settings)'
    };

    document.getElementById('adminPageTitle').innerText = titles[tabId] || 'মার্চেন্ট এডমিন প্যানেল';

    Object.keys(views).forEach(key => {
      const viewEl = document.getElementById(views[key]);
      if (viewEl) {
        viewEl.classList.toggle('active', key === tabId);
      }
    });

    if (tabId === 'adminDashboard') {
      this.renderDashboard();
    } else if (tabId === 'adminAllProducts') {
      this.renderInventoryTable();
    } else if (tabId === 'adminVariants') {
      this.renderCategoryCards();
      this.renderCategoryProductsTable();
    } else if (tabId === 'adminBarcodes') {
      this.initBarcodeGeneratorOptions();
      const paperFormatSelect = document.getElementById('barcodePaperFormatSelect');
      if (paperFormatSelect) {
        const savedFormat = localStorage.getItem('pos_barcode_paper_format') || 'sticker_38x25';
        paperFormatSelect.value = savedFormat;
      }
      this.renderBarcodeBatchPreview();
    } else if (tabId === 'adminSales') {
      this.renderSalesLog();
    } else if (tabId === 'adminCustomers') {
      this.renderAdminCustomers();
    } else if (tabId === 'adminSettings') {
      this.renderSettingsForm();
    }
  }

  populateCategoryDropdowns() {
    const filterSelect = document.getElementById('allProductCategoryFilter');
    const modalCatSelect = document.getElementById('prodFormCategory');

    if (filterSelect) {
      const currentVal = filterSelect.value;
      filterSelect.innerHTML = `<option value="ALL">সকল ক্যাটাগরি (All Categories)</option>` + 
        this.categories.map(c => `<option value="${c.name}">${c.bnName || c.name} (${c.name})</option>`).join('');
      filterSelect.value = currentVal || 'ALL';
    }

    if (modalCatSelect) {
      const currentModalVal = modalCatSelect.value;
      modalCatSelect.innerHTML = this.categories.map(c => 
        `<option value="${c.name}">${c.name} (${c.bnName || c.name})</option>`
      ).join('');
      if (currentModalVal) modalCatSelect.value = currentModalVal;
    }
  }

  getFilteredSales() {
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
      const currentDayOfWeek = now.getDay(); // 0 = Sun
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

  // 1. DASHBOARD ANALYTICS (9 KPI METRICS IN EXACT ORDER)
  renderDashboard() {
    const filteredSales = this.getFilteredSales();
    const totalOrders = filteredSales.length;

    let cashTotal = 0;
    let epayTotal = 0;
    let totalItemsSold = 0;
    let grossItemsSold = 0;
    let returnedItemsSold = 0;
    let totalNetProfit = 0;
    let totalReturnsCount = 0;
    let totalRefundAmount = 0;

    filteredSales.forEach(s => {
      const refunded = s.refundedAmount || 0;
      const netGrand = Math.max(0, (s.grandTotal || 0) - refunded);

      if (s.status === 'RETURNED' || s.status === 'PARTIALLY_RETURNED') {
        totalReturnsCount++;
        totalRefundAmount += refunded;
      }

      // Payment Breakdown — normalize to uppercase for comparison
      const pm = (s.paymentMethod || '').toUpperCase();
      if (pm === 'EPAY') {
        epayTotal += netGrand;
      } else {
        cashTotal += netGrand;
      }

      // Items Sold & Profit Breakdown
      if (s.items && Array.isArray(s.items)) {
        s.items.forEach(item => {
          const origQty = item.quantity || 1;
          const retQty = item.returnedQuantity || 0;
          const netQty = Math.max(0, origQty - retQty);
          const cost = item.cost !== undefined ? item.cost : (item.price * 0.8);
          const price = item.price || 0;

          grossItemsSold += origQty;
          returnedItemsSold += retQty;
          totalItemsSold += netQty;

          const itemRev = item.subtotal ? (item.subtotal * (netQty / origQty)) : (price * netQty);
          const itemCostTotal = cost * netQty;
          totalNetProfit += (itemRev - itemCostTotal);
        });
      }
    });

    const netGrossRevenue = cashTotal + epayTotal;

    let lowStockCount = 0;
    this.products.forEach(p => {
      if (p.variants && Array.isArray(p.variants)) {
        p.variants.forEach(v => {
          if (v.stock <= 10) lowStockCount++;
        });
      }
    });

    const elGross = document.getElementById('statGrossRevenue');
    const elCash = document.getElementById('statCashPayment');
    const elEpay = document.getElementById('statEpayPayment');
    const elOrders = document.getElementById('statTotalOrders');
    const elItem = document.getElementById('statTotalItem');
    const elProfit = document.getElementById('statNetProfit');
    const elRet = document.getElementById('statTotalReturns');
    const elBannerBadge = document.getElementById('bannerLowStockBadge');

    let totalVat = 0;
    let totalCouponDisc = 0;
    let totalManualDisc = 0;

    filteredSales.forEach(s => {
      const vatAmt = s.tax || 0;
      const discAmt = s.discount || 0;
      const hasCoupon = Boolean(s.couponCode || s.coupon || (s.couponDiscount && s.couponDiscount > 0));

      totalVat += vatAmt;

      if (hasCoupon) {
        totalCouponDisc += (s.couponDiscount !== undefined ? s.couponDiscount : discAmt);
      } else {
        totalManualDisc += (s.manualDiscount !== undefined ? s.manualDiscount : discAmt);
      }
    });

    const totalDiscounts = totalCouponDisc + totalManualDisc;
    const netVatDisc = totalVat - totalDiscounts;

    const elVatDisc = document.getElementById('statVatDiscount');
    if (elVatDisc) {
      if (netVatDisc > 0) {
        elVatDisc.innerText = `+৳${netVatDisc.toFixed(2)}`;
        elVatDisc.style.color = 'var(--accent-green, #10b981)';
      } else if (netVatDisc < 0) {
        elVatDisc.innerText = `-৳${Math.abs(netVatDisc).toFixed(2)}`;
        elVatDisc.style.color = '#ef4444';
      } else {
        elVatDisc.innerText = `৳0.00`;
        elVatDisc.style.color = 'inherit';
      }
    }

    const finalNetProfit = totalNetProfit + netVatDisc;
    if (elGross) elGross.innerText = `৳${netGrossRevenue.toFixed(2)}`;
    if (elCash) elCash.innerText = `৳${cashTotal.toFixed(2)}`;
    if (elEpay) elEpay.innerText = `৳${epayTotal.toFixed(2)}`;
    if (elOrders) elOrders.innerText = `${totalOrders} টি`;
    if (elItem) elItem.innerText = `${totalItemsSold} টি`;
    if (elProfit) {
      elProfit.innerText = `৳${finalNetProfit.toFixed(2)}`;
      if (finalNetProfit < 0) {
        elProfit.style.color = '#ef4444';
      } else {
        elProfit.style.color = 'var(--accent-purple, #8b5cf6)';
      }
    }
    if (elRet) elRet.innerText = `${totalReturnsCount} টি (৳${totalRefundAmount.toFixed(2)})`;
    if (elBannerBadge) elBannerBadge.innerText = `${lowStockCount} টি পণ্য লো স্টক`;

    this.renderCharts(filteredSales);
  }

  renderCharts(filteredSalesInput = null) {
    if (typeof Chart === 'undefined') return;

    const salesList = filteredSalesInput || this.getFilteredSales();

    const categoryTotals = {};
    salesList.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          const prod = this.products.find(p => p.id === item.id);
          const cat = (prod && prod.category) ? prod.category : (item.category || 'অন্যান্য');
          const itemSub = item.subtotal || (item.price * item.quantity);
          categoryTotals[cat] = (categoryTotals[cat] || 0) + itemSub;
        });
      }
    });

    const catLabels = Object.keys(categoryTotals);
    const catData = Object.values(categoryTotals);

    const catCanvas = document.getElementById('adminCategoryChart');
    if (catCanvas) {
      const labels = catLabels.length > 0 ? catLabels : ['কোনো ডেটা নেই'];
      const data = catData.length > 0 ? catData : [0];

      if (this.categoryChart && typeof this.categoryChart.update === 'function') {
        this.categoryChart.data.labels = labels;
        this.categoryChart.data.datasets[0].data = data;
        this.categoryChart.update('none');
      } else {
        this.categoryChart = new Chart(catCanvas.getContext('2d'), {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'বিক্রি (৳)',
              data: data,
              backgroundColor: 'rgba(16, 185, 129, 0.8)',
              borderColor: '#10b981',
              borderWidth: 1,
              borderRadius: 6,
              maxBarThickness: 36,
              categoryPercentage: 0.5,
              barPercentage: 0.7
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 300, easing: 'easeOutQuart' },
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
    }

    let cashTotal = 0;
    let epayTotal = 0;
    salesList.forEach(s => {
      const pm = (s.paymentMethod || '').toUpperCase();
      const isEpay = pm === 'EPAY' || (s.paymentDetails && (s.paymentDetails.method || '').toLowerCase() === 'epay');
      const refunded = s.refundedAmount || 0;
      const netGrand = Math.max(0, (s.grandTotal || 0) - refunded);
      if (isEpay) {
        epayTotal += netGrand;
      } else {
        cashTotal += netGrand;
      }
    });

    const payCanvas = document.getElementById('adminPaymentChart');
    if (payCanvas) {
      const pData = [cashTotal, epayTotal];

      if (this.paymentChart && typeof this.paymentChart.update === 'function') {
        this.paymentChart.data.datasets[0].data = pData;
        this.paymentChart.update('none');
      } else {
        this.paymentChart = new Chart(payCanvas.getContext('2d'), {
          type: 'doughnut',
          data: {
            labels: ['ক্যাশ পেমেন্ট', 'ডিজিটাল ই-পে'],
            datasets: [{
              data: pData,
              backgroundColor: ['#10b981', '#3b82f6'],
              hoverBackgroundColor: ['#059669', '#2563eb'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 300, easing: 'easeOutQuart' },
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
                  pointStyle: 'circle',
                  boxWidth: 10,
                  boxHeight: 10
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
    }
  }

  // 2. ALL PRODUCTS TABLE (WITH SEARCH, CATEGORY & STOCK FILTERS)
  renderInventoryTable() {
    const tbody = document.getElementById('adminInventoryTableBody');
    if (!tbody) return;

    const query = (document.getElementById('allProductSearch')?.value || '').toLowerCase().trim();
    const catFilter = document.getElementById('allProductCategoryFilter')?.value || 'ALL';
    const stockFilter = document.getElementById('allProductStockFilter')?.value || 'ALL';

    let filteredProducts = this.products.filter(p => {
      const matchCat = catFilter === 'ALL' || p.category === catFilter;
      const matchQuery = !query || 
        p.name.toLowerCase().includes(query) || 
        p.category.toLowerCase().includes(query) ||
        (p.variants || []).some(v => 
          (v.color || '').toLowerCase().includes(query) || 
          (v.size || '').toLowerCase().includes(query) || 
          (v.barcode || '').includes(query)
        );

      let matchStock = true;
      if (stockFilter === 'LOW') {
        matchStock = (p.variants || []).some(v => v.stock <= 10);
      } else if (stockFilter === 'IN_STOCK') {
        matchStock = (p.variants || []).some(v => v.stock > 10);
      }

      return matchCat && matchQuery && matchStock;
    });

    if (filteredProducts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center p-4">কোনো প্রোডাক্ট পাওয়া যায়নি</td></tr>`;
      return;
    }

    let html = '';

    filteredProducts.forEach(p => {
      const variants = p.variants || [];
      const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);

      variants.forEach((v, idx) => {
        const isFirst = idx === 0;
        const discountTag = (v.mrp && v.mrp > v.price) ? `<del style="color:var(--text-muted); font-size:0.8rem; margin-right:4px;">৳${v.mrp}</del>` : '';

        html += `
          <tr style="${isFirst ? 'border-top: 2px solid var(--border-color);' : ''}">
            ${isFirst ? `
              <td rowspan="${variants.length}">
                <img src="${p.image}" alt="${p.name}" style="width:48px; height:48px; border-radius:10px; object-fit:cover;" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'><rect width=\'100\' height=\'100\' fill=\'%231e293b\'/><text x=\'50%\' y=\'50%\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%2394a3b8\' font-family=\'sans-serif\' font-size=\'12\'>No Image</text></svg>'">
              </td>
              <td rowspan="${variants.length}">
                <strong>${p.name}</strong><br>
                <span class="badge" style="background:rgba(59, 130, 246, 0.15); color:var(--accent-blue);">${p.category}</span>
                <small class="display-block text-muted mt-1">মোট মজুদ: ${totalStock} ${p.unit || 'pcs'}</small>
              </td>
            ` : ''}

            <td>
              <span class="badge" style="background:rgba(245, 158, 11, 0.15); color:var(--accent-orange); margin-right:4px;">🎨 ${v.color || 'Standard'}</span>
              <span class="badge" style="background:rgba(139, 92, 246, 0.15); color:var(--accent-purple);">📏 ${v.size || 'N/A'}</span>
            </td>
            <td>
              <code style="cursor:pointer; display:inline-block; margin-bottom:4px;" title="বারকোড কোড কপি করতে ক্লিক করুন" onclick="navigator.clipboard.writeText('${v.barcode}'); admin.showToast('বারকোড ${v.barcode} কপি করা হয়েছে!')">
                <i class="fa-solid fa-barcode"></i> ${v.barcode}
              </code>
              <button class="btn btn-xs btn-primary" style="font-size:0.75rem; padding:3px 8px; display:block; margin-top:2px;" onclick="admin.quickPrintVariantBarcode('${p.id}', '${v.variantId}')" title="নষ্ট হয়ে যাওয়া বা হারিয়ে যাওয়া স্টিকার পুনরায় প্রিন্ট করুন">
                <i class="fa-solid fa-print"></i> স্টিকার রি-প্রিন্ট
              </button>
            </td>
            <td>৳${v.cost || 0}</td>
            <td>${discountTag} <strong>৳${v.mrp || v.price}</strong></td>
            <td><strong style="color:var(--accent-green);">৳${v.price}</strong></td>
            <td>
              <span class="badge ${v.stock <= 10 ? 'badge-danger' : 'badge-success'}" style="font-size:0.85rem; padding:4px 10px;">
                ${v.stock} ${p.unit || 'pcs'}
              </span>
            </td>
            <td>
              ${isFirst ? `
                <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                  <button class="btn btn-sm btn-primary" onclick="admin.openRestockModal('${p.id}')" title="স্টক রিস্টক ও নতুন বারকোড প্রিন্ট">
                    <i class="fa-solid fa-boxes-packing"></i> রিস্টক
                  </button>
                  <button class="btn btn-sm btn-outline" onclick="admin.openProductModal('${p.id}')" title="সম্পাদনা">
                    <i class="fa-solid fa-pen-to-square"></i> এডিট
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="admin.deleteProduct('${p.id}')" title="মুছে ফেলুন">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              ` : ''}
            </td>
          </tr>
        `;
      });
    });

    tbody.innerHTML = html;
  }

  quickPrintVariantBarcode(prodId, variantId) {
    const prod = this.products.find(p => String(p.id) === String(prodId));
    if (!prod) {
      this.showToast('পণ্যটি সিস্টেমে পাওয়া যায়নি!', 'error');
      return;
    }
    const variant = (prod.variants || []).find(v => String(v.variantId) === String(variantId)) || (prod.variants || [])[0];

    // 1. Switch to Barcode Generator tab
    this.switchTab('adminBarcodes');

    // 2. Select product & variant in Barcode Studio controls for customization
    setTimeout(() => {
      this.initBarcodeGeneratorOptions();
      const prodSelect = document.getElementById('barcodeProdSelect');
      const variantSelect = document.getElementById('barcodeVariantSelect');

      if (prodSelect) {
        prodSelect.value = prodId;
        const targetVarId = variant ? variant.variantId : (variantId || 'ALL');
        this.onBarcodeProductChange(false, targetVarId);
        if (variantSelect && variant) {
          variantSelect.value = variant.variantId;
          this.renderBarcodeBatchPreview();
        }

        const vName = variant ? ` (${variant.color || ''} ${variant.size ? '| ' + variant.size : ''})` : '';
        const vStock = variant ? variant.stock : (prod.variants || []).reduce((acc, v) => acc + (v.stock || 0), 0);
        this.showToast(`🏷️ '${prod.name}${vName}' বারকোড জেনারেটরে সিলেক্ট করা হয়েছে! কাস্টমাইজ করে প্রিন্ট দিন। (মজুদ: ${vStock} টি)`);
      }
    }, 50);
  }

  // 3. RICH SQUARE IMAGE CATEGORY CARDS & PRODUCT HUB VIEW
  renderCategoryCards() {
    const container = document.getElementById('categoryCardsContainer');
    if (!container) return;

    let html = '';

    this.categories.forEach(c => {
      const prodsUnderCat = this.products.filter(p => p.category === c.name);
      const totalItems = prodsUnderCat.length;
      const totalStock = prodsUnderCat.reduce((acc, p) => acc + (p.variants || []).reduce((s, v) => s + (v.stock || 0), 0), 0);
      const imgUrl = c.image || '';
      const desc = c.description || `${c.name} ক্যাটাগরির মানসম্মত পণ্যসমূহ`;
      const catImgMarkup = imgUrl 
        ? `<img src="${imgUrl}" class="category-card-sq-img" alt="${c.bnName || c.name}" style="background:#000000; object-fit:cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"><div style="display:none; width:100%; height:100%; background:#000000;"></div>`
        : `<div class="category-card-sq-img" style="background:#000000; width:100%; height:100%;"></div>`;

      html += `
        <div class="category-card-sq" onclick="admin.filterByVariantCategory('${c.name}')">
          <div class="category-card-sq-imgwrap" style="background:#000000;">
            ${catImgMarkup}
            <div class="category-card-sq-overlay">
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <span class="category-badge-chip" style="border-color:${c.color || '#3b82f6'};">
                  <i class="fa-solid ${c.icon || 'fa-tag'}"></i> ${c.bnName || c.name}
                </span>
                <div class="category-icon-badge" style="background:${c.color || '#3b82f6'}dd;">
                  <i class="fa-solid ${c.icon || 'fa-tag'}"></i>
                </div>
              </div>

              <div>
                <h4 style="color:#fff; margin:0 0 4px 0; font-size:1.15rem; font-weight:700;">${c.bnName || c.name} (${c.name})</h4>
                <p style="color:#d1d5db; font-size:0.8rem; margin:0 0 8px 0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${desc}</p>
                <div style="display:flex; gap:0.5rem; margin-bottom:10px;">
                  <span class="badge" style="background:rgba(16,185,129,0.25); color:#6ee7b7; font-size:0.75rem;">📦 ${totalItems} টি পণ্য</span>
                  <span class="badge" style="background:rgba(59,130,246,0.25); color:#93c5fd; font-size:0.75rem;">📊 ${totalStock} টি স্টক</span>
                </div>

                <div style="display:flex; gap:0.4rem;" onclick="event.stopPropagation();">
                  <button class="btn btn-sm btn-primary" style="flex:1; font-size:0.8rem;" onclick="admin.filterByVariantCategory('${c.name}')">
                    <i class="fa-solid fa-eye"></i> প্রোডাক্ট দেখুন
                  </button>
                  <button class="btn btn-sm btn-outline" style="border-color:rgba(255,255,255,0.3); color:#fff; font-size:0.8rem;" onclick="admin.editCategory('${c.id}')" title="এডিট">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button class="btn btn-sm btn-danger" style="font-size:0.8rem;" onclick="admin.deleteCategory('${c.id}')" title="মুছুন">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  filterByVariantCategory(catName) {
    this.selectedVariantCategory = catName;
    this.renderCategoryProductsTable();
    const titleEl = document.getElementById('variantCategoryTableTitle');
    const badgeEl = document.getElementById('variantCategoryBadge');

    if (catName === 'ALL') {
      if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-list-check"></i> সকল ক্যাটাগরির প্রোডাক্টসমূহ`;
      if (badgeEl) badgeEl.innerText = `সকল ক্যাটাগরি`;
    } else {
      const c = this.categories.find(item => item.name === catName);
      const nameText = c ? `${c.bnName || c.name} (${c.name})` : catName;
      if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-list-check"></i> ${nameText} ক্যাটাগরির অন্তর্ভুক্ত সকল প্রোডাক্ট তালিকা`;
      if (badgeEl) badgeEl.innerText = nameText;
    }
  }

  renderCategoryProductsTable() {
    const tbody = document.getElementById('variantCategoryProductsTableBody');
    if (!tbody) return;

    const catName = this.selectedVariantCategory || 'ALL';
    let filtered = catName === 'ALL' ? this.products : this.products.filter(p => p.category === catName);

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center p-4">এই ক্যাটাগরিতে কোনো পণ্য পাওয়া যায়নি</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(p => {
      const variants = p.variants || [];
      const prices = variants.map(v => v.price);
      const minPrice = prices.length ? Math.min(...prices) : 0;
      const maxPrice = prices.length ? Math.max(...prices) : 0;
      const priceText = minPrice === maxPrice ? `৳${minPrice}` : `৳${minPrice} - ৳${maxPrice}`;

      const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);

      const variantBadges = variants.map(v => 
        `<span class="variant-chip"><i class="fa-solid fa-tag"></i> ${v.color || 'Std'} / ${v.size || 'N/A'} (৳${v.price} | ${v.stock} টি)</span>`
      ).join('');

      return `
        <tr>
          <td>
            ${p.image && p.image.trim() !== '' 
              ? `<img src="${p.image}" alt="${p.name}" style="width:44px; height:44px; border-radius:10px; object-fit:cover; background:#000000;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';"><div style="display:none; width:44px; height:44px; border-radius:10px; background:#000000;"></div>`
              : `<div style="width:44px; height:44px; border-radius:10px; background:#000000; display:inline-block;"></div>`}
          </td>
          <td><strong>${p.name}</strong></td>
          <td><span class="badge" style="background:rgba(59,130,246,0.15); color:var(--accent-blue);">${p.category}</span></td>
          <td>${variantBadges}</td>
          <td><strong style="color:var(--accent-green);">${priceText}</strong></td>
          <td>
            <span class="badge ${totalStock <= 10 ? 'badge-danger' : 'badge-success'}">${totalStock} ${p.unit || 'pcs'}</span>
          </td>
          <td>
            <div style="display:flex; gap:0.4rem;">
              <button class="btn btn-sm btn-outline" onclick="admin.openProductModal('${p.id}')">
                <i class="fa-solid fa-pen-to-square"></i> এডিট
              </button>
              <button class="btn btn-sm btn-primary" onclick="admin.openRestockModal('${p.id}')">
                <i class="fa-solid fa-boxes-packing"></i> রিস্টক
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // 4. ADD & EDIT PRODUCT MODAL
  openProductModalWithCategory(catName) {
    this.openProductModal();
    const select = document.getElementById('prodFormCategory');
    if (select) select.value = catName;
  }

  openProductModal(id = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const title = document.getElementById('productModalTitle');
    const container = document.getElementById('variantRowsContainer');

    form.reset();
    container.innerHTML = '';
    this.populateCategoryDropdowns();

    if (id) {
      const p = this.products.find(item => item.id === id);
      if (p) {
        title.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> পণ্য ও ভেরিয়েন্ট তথ্য সম্পাদনা`;
        document.getElementById('prodFormId').value = p.id;
        document.getElementById('prodFormName').value = p.name;
        document.getElementById('prodFormCategory').value = p.category;
        document.getElementById('prodFormImage').value = p.image || '';
        document.getElementById('prodFormImgPreview').src = p.image || 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'><rect width=\'100\' height=\'100\' fill=\'%231e293b\'/><text x=\'50%\' y=\'50%\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%2394a3b8\' font-family=\'sans-serif\' font-size=\'12\'>No Image</text></svg>';
        document.getElementById('prodImgFileName').innerText = p.image ? 'সংরক্ষিত ছবি' : 'গ্যালারি থেকে ছবি সিলেক্ট করুন';

        if (p.variants && p.variants.length > 0) {
          p.variants.forEach(v => this.addVariantRow(v));
        } else {
          this.addVariantRow();
        }
      }
    } else {
      title.innerHTML = `<i class="fa-solid fa-plus-circle"></i> নতুন পণ্য ও ভেরিয়েন্ট এন্ট্রি দিন`;
      document.getElementById('prodFormId').value = '';
      document.getElementById('prodFormImage').value = '';
      document.getElementById('prodFormImgPreview').src = 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'><rect width=\'100\' height=\'100\' fill=\'%231e293b\'/><text x=\'50%\' y=\'50%\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%2394a3b8\' font-family=\'sans-serif\' font-size=\'12\'>No Image</text></svg>';
      document.getElementById('prodImgFileName').innerText = 'গ্যালারি থেকে ছবি সিলেক্ট করুন';
      this.addVariantRow();
    }

    modal.classList.add('active');
  }

  addVariantRow(vData = null) {
    const container = document.getElementById('variantRowsContainer');
    const rowIndex = container.children.length;

    const row = document.createElement('div');
    row.className = 'variant-row-card';
    row.style.background = 'var(--bg-sidebar)';
    row.style.border = '1px solid var(--border-color)';
    row.style.borderRadius = '12px';
    row.style.padding = '1rem';

    const colorVal = vData ? (vData.color || '') : '';
    const sizeVal = vData ? (vData.size || '') : '';
    const costVal = vData ? vData.cost : '';
    const mrpVal = vData ? (vData.mrp || '') : '';
    const priceVal = vData ? vData.price : '';
    const stockVal = vData ? vData.stock : '';
    const barcodeVal = vData ? vData.barcode : this.generateBarcodeNumber(rowIndex);

    row.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
        <span class="badge" style="background:rgba(16,185,129,0.15); color:var(--accent-green);">ভেরিয়েন্ট #${rowIndex + 1}</span>
        ${rowIndex > 0 ? `
          <button type="button" class="btn btn-sm btn-danger remove-vrow-btn" title="মুছে ফেলুন">
            <i class="fa-solid fa-xmark"></i> রিমুভ
          </button>
        ` : ''}
      </div>

      <div class="form-row">
        <div class="form-group col-3">
          <label>কালার (Color / Model)</label>
          <input type="text" class="form-control v-color" value="${colorVal}" placeholder="যেমন: Red, Black, Titan">
        </div>
        <div class="form-group col-3">
          <label>সাইজ / ভেরিয়েন্ট (Size/Storage)</label>
          <input type="text" class="form-control v-size" value="${sizeVal}" placeholder="যেমন: M, XL, 256GB, 15inch">
        </div>
        <div class="form-group col-3">
          <label>কেনা দাম (Cost ৳) *</label>
          <input type="number" class="form-control v-cost" value="${costVal}" required min="0" placeholder="300">
        </div>
        <div class="form-group col-3">
          <label>এমআরপি (MRP ৳)</label>
          <input type="number" class="form-control v-mrp" value="${mrpVal}" min="0" placeholder="500">
        </div>
      </div>

      <div class="form-row mt-2">
        <div class="form-group col-4">
          <label>বিক্রি মূল্য (Selling Price ৳) *</label>
          <input type="number" class="form-control v-price" value="${priceVal}" required min="0" placeholder="400">
        </div>
        <div class="form-group col-4">
          <label>মজুদ কোয়ান্টিটি (Stock) *</label>
          <input type="number" class="form-control v-stock" value="${stockVal}" required min="0" placeholder="50">
        </div>
        <div class="form-group col-4">
          <label>স্বতন্ত্র বারকোড *</label>
          <div class="input-group">
            <input type="text" class="form-control v-barcode" value="${barcodeVal}" required placeholder="8942001001">
            <button type="button" class="btn btn-outline btn-gen-vbc" title="নতুন কোড জেনারেট করুন">
              <i class="fa-solid fa-wand-magic-sparkles"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    container.appendChild(row);

    const removeBtn = row.querySelector('.remove-vrow-btn');
    if (removeBtn) removeBtn.addEventListener('click', () => row.remove());

    const genBcBtn = row.querySelector('.btn-gen-vbc');
    if (genBcBtn) {
      genBcBtn.addEventListener('click', () => {
        const newCode = this.generateBarcodeNumber(Math.floor(Math.random() * 900));
        row.querySelector('.v-barcode').value = newCode;
        this.showToast(`নতুন ইউনিক বারকোড #${newCode} তৈরি হয়েছে!`);
      });
    }
  }

  generateBarcodeNumber(offset = 0) {
    let attempts = 0;
    let code = '';
    const existingBarcodes = new Set();
    
    (this.products || []).forEach(p => {
      (p.variants || []).forEach(v => {
        if (v.barcode) existingBarcodes.add(v.barcode.toString().trim());
      });
    });

    do {
      const timeStr = (Date.now() + attempts * 17 + offset).toString().slice(-7);
      const rand = Math.floor(10 + Math.random() * 90);
      code = `894${timeStr}${rand}`;
      attempts++;
    } while (existingBarcodes.has(code) && attempts < 100);

    return code;
  }

  saveProductFromForm(shouldPrintBarcodes = false) {
    const id = document.getElementById('prodFormId').value;
    const name = document.getElementById('prodFormName').value.trim();
    const category = document.getElementById('prodFormCategory').value;
    const image = document.getElementById('prodFormImage').value.trim();

    if (!name) {
      this.showToast('পণ্যের নাম পূরণ করা আবশ্যক!', 'error');
      return;
    }

    const vRows = document.querySelectorAll('#variantRowsContainer .variant-row-card');
    if (vRows.length === 0) {
      this.showToast('অন্তত একটি ভেরিয়েন্ট যোগ করা আবশ্যক!', 'error');
      return;
    }

    const variants = [];
    vRows.forEach((row, i) => {
      const color = row.querySelector('.v-color').value.trim() || 'Standard';
      const size = row.querySelector('.v-size').value.trim() || 'N/A';
      const cost = parseFloat(row.querySelector('.v-cost').value) || 0;
      const mrpRaw = row.querySelector('.v-mrp').value;
      const price = parseFloat(row.querySelector('.v-price').value) || 0;
      const mrp = mrpRaw ? parseFloat(mrpRaw) : price;
      const stock = parseInt(row.querySelector('.v-stock').value) || 0;
      const barcode = row.querySelector('.v-barcode').value.trim() || this.generateBarcodeNumber(i);

      variants.push({
        variantId: `VAR-${Date.now().toString().slice(-4)}-${i+1}`,
        color,
        size,
        barcode,
        cost,
        mrp: mrp || price,
        price,
        stock
      });
    });

    let targetProdId = id;

    if (id) {
      const p = this.products.find(item => item.id === id);
      if (p) {
        p.name = name;
        p.category = category;
        p.image = image;
        p.variants = variants;
      }
    } else {
      targetProdId = `PROD-${Math.floor(1000 + Math.random() * 9000)}`;
      const newProd = {
        id: targetProdId,
        name,
        category,
        unit: 'pcs',
        image,
        variants
      };
      this.products.unshift(newProd);
    }

    this.saveProducts();
    this.closeModal('productModal');
    this.refreshCurrentView();

    this.showToast(id ? 'পণ্য ও ভেরিয়েন্ট আপডেট সম্পন্ন!' : 'নতুন পণ্য এন্ট্রি সফল হয়েছে!');

    if (shouldPrintBarcodes) {
      this.switchTab('adminBarcodes');
      setTimeout(() => {
        this.initBarcodeGeneratorOptions();
        const prodSelect = document.getElementById('barcodeProdSelect');
        if (prodSelect) {
          prodSelect.value = targetProdId;
          this.onBarcodeProductChange();
          this.renderBarcodeBatchPreview();
        }
      }, 100);
    }
  }

  deleteProduct(id) {
    if (confirm('আপনি কি নিশ্চিত যে এই পণ্যটি মুছে ফেলতে চান?')) {
      this.products = this.products.filter(p => p.id !== id);
      this.saveProducts();
      this.refreshCurrentView();
      this.showToast('পণ্যটি সফলভাবে মুছে ফেলা হয়েছে!');
    }
  }

  // 5. CATEGORY PRESETS MODAL HANDLER
  openVariantCategoryModal() {
    this.editingCategoryId = null;
    const modal = document.getElementById('variantCategoryModal');
    const form = document.getElementById('variantCategoryForm');
    const modalTitle = document.getElementById('variantCategoryModalTitle');
    
    if (form) form.reset();
    if (modalTitle) modalTitle.innerHTML = `<i class="fa-solid fa-folder-plus"></i> নতুন প্রোডাক্ট ক্যাটাগরি যোগ করুন`;
    
    document.getElementById('catImgUrl').value = '';
    document.getElementById('catFormImgPreview').src = 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'><rect width=\'100\' height=\'100\' fill=\'%231e293b\'/><text x=\'50%\' y=\'50%\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%2394a3b8\' font-family=\'sans-serif\' font-size=\'12\'>Cover</text></svg>';
    document.getElementById('catImgFileName').innerText = 'গ্যালারি থেকে ছবি সিলেক্ট করুন';

    this.toggleModalActionFields('CATEGORY');
    modal.classList.add('active');
  }

  editCategory(catId) {
    const c = this.categories.find(item => item.id === catId);
    if (!c) return;

    this.editingCategoryId = catId;
    const modal = document.getElementById('variantCategoryModal');
    const modalTitle = document.getElementById('variantCategoryModalTitle');
    
    if (modalTitle) modalTitle.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> '${c.bnName || c.name}' ক্যাটাগরি সম্পাদন করুন`;
    
    this.toggleModalActionFields('CATEGORY');
    
    const catNameEng = document.getElementById('catNameEng');
    const catNameBn = document.getElementById('catNameBn');
    const catImgUrl = document.getElementById('catImgUrl');
    const catDescription = document.getElementById('catDescription');
    const catIconSelect = document.getElementById('catIconSelect');
    const catColorSelect = document.getElementById('catColorSelect');

    if (catNameEng) catNameEng.value = c.name || '';
    if (catNameBn) catNameBn.value = c.bnName || '';
    if (catImgUrl) catImgUrl.value = c.image || '';
    if (catDescription) catDescription.value = c.description || '';
    if (catIconSelect) catIconSelect.value = c.icon || 'fa-tag';
    if (catColorSelect) catColorSelect.value = c.color || '#3b82f6';

    const preview = document.getElementById('catFormImgPreview');
    const fileName = document.getElementById('catImgFileName');
    if (preview) preview.src = c.image || 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'><rect width=\'100\' height=\'100\' fill=\'%231e293b\'/><text x=\'50%\' y=\'50%\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%2394a3b8\' font-family=\'sans-serif\' font-size=\'12\'>Cover</text></svg>';
    if (fileName) fileName.innerText = c.image ? 'সংরক্ষিত ক্যাটাগরি ছবি' : 'গ্যালারি থেকে ছবি সিলেক্ট করুন';

    modal.classList.add('active');
  }

  deleteCategory(catId) {
    const c = this.categories.find(item => item.id === catId);
    if (!c) return;

    if (confirm(`আপনি কি নিশ্চিত যে '${c.bnName || c.name}' ক্যাটাগরিটি মুছে ফেলতে চান?`)) {
      this.categories = this.categories.filter(item => item.id !== catId);
      localStorage.setItem('pos_categories', JSON.stringify(this.categories));
      this.populateCategoryDropdowns();
      this.renderCategoryCards();
      this.showToast(`'${c.bnName || c.name}' ক্যাটাগরি মুছে ফেলা হয়েছে!`);
    }
  }

  toggleModalActionFields(type) {
    const catSec = document.getElementById('categoryFieldsSection');
    if (catSec) catSec.style.display = 'block';
  }

  saveCategoryOrVariant(e) {
    e.preventDefault();

    const nameEng = document.getElementById('catNameEng').value.trim();
    const nameBn = document.getElementById('catNameBn').value.trim();
    const imgUrl = document.getElementById('catImgUrl').value.trim();
    const description = document.getElementById('catDescription').value.trim();
    const icon = document.getElementById('catIconSelect').value;
    const color = document.getElementById('catColorSelect').value;

    if (!nameEng || !nameBn) {
      this.showToast('ক্যাটাগরির ইংরেজি ও বাংলা নাম দেওয়া আবশ্যক!', 'error');
      return;
    }

    if (this.editingCategoryId) {
      const cat = this.categories.find(item => item.id === this.editingCategoryId);
      if (cat) {
        cat.name = nameEng;
        cat.bnName = nameBn;
        cat.image = imgUrl;
        cat.description = description;
        cat.icon = icon;
        cat.color = color;
      }
      this.showToast(`ক্যাটাগরি '${nameBn}' সফলভাবে আপডেট হয়েছে!`);
      this.editingCategoryId = null;
    } else {
      const newCat = {
        id: `CAT-${Date.now().toString().slice(-4)}`,
        name: nameEng,
        bnName: nameBn,
        image: imgUrl,
        icon,
        color,
        description: description || `${nameEng} ক্যাটাগরির পণ্যসমূহ`
      };

      this.categories.push(newCat);
      this.showToast(`নতুন ক্যাটাগরি '${nameBn}' সফলভাবে তৈরি হয়েছে!`);
    }

    localStorage.setItem('pos_categories', JSON.stringify(this.categories));
    this.populateCategoryDropdowns();
    this.renderCategoryCards();
    this.closeModal('variantCategoryModal');
    this.refreshCurrentView();
  }

  // 6. RESTOCK WORKFLOW & PRICE UPDATES
  openRestockModal(prodId) {
    const prod = this.products.find(p => p.id === prodId);
    if (!prod) return;

    document.getElementById('restockProdId').value = prod.id;
    document.getElementById('restockProdTitle').innerText = prod.name;
    document.getElementById('restockProdCategory').innerText = prod.category;
    document.getElementById('restockProdImg').src = prod.image;

    const container = document.getElementById('restockVariantsContainer');
    container.innerHTML = (prod.variants || []).map((v, i) => `
      <div class="restock-var-card" data-vid="${v.variantId}" style="background:var(--bg-sidebar); border:1px solid var(--border-color); border-radius:12px; padding:1rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <span class="badge" style="background:rgba(59,130,246,0.15); color:var(--accent-blue);">
            🎨 ${v.color || 'Std'} | 📏 ${v.size || 'N/A'}
          </span>
          <span class="badge" style="background:rgba(16,185,129,0.15); color:var(--accent-green);">বর্তমান স্টক: ${v.stock}</span>
        </div>
        
        <div class="form-row">
          <div class="form-group col-4">
            <label>নতুন স্টক সংখ্যা (+ Stock) *</label>
            <input type="number" class="form-control r-add-stock" value="0" min="0">
          </div>
          <div class="form-group col-4">
            <label>নতুন বিক্রয় মূল্য (Price ৳)</label>
            <input type="number" class="form-control r-price" value="${v.price}" min="0">
          </div>
          <div class="form-group col-4">
            <label>নতুন কেনা দাম (Cost ৳)</label>
            <input type="number" class="form-control r-cost" value="${v.cost || 0}" min="0">
          </div>
        </div>
      </div>
    `).join('');

    this.openModal('restockModal');
  }

  processRestock(shouldPrintBarcodes = false) {
    const prodId = document.getElementById('restockProdId').value;
    const prod = this.products.find(p => p.id === prodId);
    if (!prod) return;

    const restockedMap = {};
    let totalRestockedCount = 0;

    const cards = document.querySelectorAll('#restockVariantsContainer .restock-var-card');
    cards.forEach(card => {
      const vid = card.dataset.vid;
      const variant = prod.variants.find(v => v.variantId === vid);
      if (variant) {
        const addStock = parseInt(card.querySelector('.r-add-stock').value) || 0;
        const newPrice = parseFloat(card.querySelector('.r-price').value) || variant.price;
        const newCost = parseFloat(card.querySelector('.r-cost').value) || variant.cost;

        variant.stock += addStock;
        variant.price = newPrice;
        variant.cost = newCost;

        if (addStock > 0) {
          restockedMap[vid] = addStock;
          totalRestockedCount += addStock;
        }
      }
    });

    this.saveProducts();
    this.closeModal('restockModal');
    this.refreshCurrentView();
    this.showToast('স্টক রিস্টক ও মূল্য আপডেট সফল হয়েছে!');

    if (shouldPrintBarcodes) {
      this.activeRestockContext = {
        prodId: prodId,
        restockedMap: restockedMap,
        totalRestocked: totalRestockedCount
      };

      this.switchTab('adminBarcodes');
      setTimeout(() => {
        this.initBarcodeGeneratorOptions();
        const prodSelect = document.getElementById('barcodeProdSelect');
        if (prodSelect) {
          prodSelect.value = prodId;
          this.onBarcodeProductChange(true);
        }
      }, 100);
    }
  }

  setupHardwareScanner() {
    this.scannerBuffer = '';
    this.scannerTimeout = null;

    document.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      const isInput = activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT';
      
      if (activeEl && (activeEl.id === 'allProductSearch' || activeEl.id === 'allSalesSearch' || activeEl.id === 'barcodeBatchCount')) {
        return;
      }

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

  handleBarcodeScan(barcodeStr) {
    if (!barcodeStr) return;
    const cleanStr = String(barcodeStr).trim();
    const normClean = cleanStr.toLowerCase().replace(/\s+/g, '');
    const isInvoicePrefix = normClean.startsWith('inv') || normClean.startsWith('inv-');

    // Check if Invoice
    const saleMatch = this.sales.find(s => {
      const sid = String(s.id).toLowerCase().replace(/\s+/g, '');
      return sid === normClean || sid.includes(normClean) || normClean.includes(sid);
    });

    if (saleMatch || isInvoicePrefix) {
      const targetId = saleMatch ? saleMatch.id : cleanStr;
      this.switchTab('adminSales');
      const salesSearch = document.getElementById('allSalesSearch');
      if (salesSearch) {
        salesSearch.value = targetId;
        this.renderSalesLog();
      }
      if (saleMatch) {
        this.openSaleDetailsModal(saleMatch.id);
        this.showToast(`🧾 ইনভয়েস ${saleMatch.id} পাওয়া গেছে! সেলস লগে নেভিগেট করা হয়েছে।`);
      } else {
        this.showToast(`ইনভয়েস '${cleanStr}' সেলস লগে পাওয়া যায়নি!`, 'error');
      }
      return;
    }

    // Check if Product
    let foundProd = null;
    let foundVar = null;

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

    if (foundProd && foundVar) {
      this.switchTab('adminBarcodes');
      setTimeout(() => {
        const prodSelect = document.getElementById('barcodeProdSelect');
        const variantSelect = document.getElementById('barcodeVariantSelect');
        if (prodSelect) {
          prodSelect.value = foundProd.id;
          this.onBarcodeProductChange();
          if (variantSelect) variantSelect.value = foundVar.variantId;
          this.renderBarcodeBatchPreview();
        }
      }, 100);
      this.showToast(`🏷️ পণ্য ${foundProd.name} (${foundVar.color}/${foundVar.size}) বারকোড জেনারেটরে সিলেক্ট করা হয়েছে!`);
    } else {
      this.showToast(`বারকোড '${cleanStr}' সিস্টেমে পাওয়া যায়নি!`, 'error');
    }
  }

  // 7. BARCODE STICKER GENERATOR
  initBarcodeGenerator() {
    this.initBarcodeGeneratorOptions();

    const prodSelect = document.getElementById('barcodeProdSelect');
    const variantSelect = document.getElementById('barcodeVariantSelect');
    const modeSelect = document.getElementById('barcodePrintModeSelect');
    const paperFormatSelect = document.getElementById('barcodePaperFormatSelect');
    const customInput = document.getElementById('barcodeBatchCount');

    // Load saved barcode paper format or fallback to sticker_38x25 as default
    if (paperFormatSelect) {
      const posSettings = JSON.parse(localStorage.getItem('pos_settings')) || {};
      const savedFormat = localStorage.getItem('pos_barcode_paper_format') || posSettings.barcodePaperFormat || 'sticker_38x25';
      paperFormatSelect.value = savedFormat;

      paperFormatSelect.addEventListener('change', () => {
        const val = paperFormatSelect.value;
        localStorage.setItem('pos_barcode_paper_format', val);
        try {
          const posS = JSON.parse(localStorage.getItem('pos_settings')) || {};
          posS.barcodePaperFormat = val;
          localStorage.setItem('pos_settings', JSON.stringify(posS));
        } catch(e) {}
        this.renderBarcodeBatchPreview();
      });
    }

    if (prodSelect) {
      prodSelect.addEventListener('change', () => {
        this.activeRestockContext = null;
        this.onBarcodeProductChange(false, 'ALL');
      });
    }
    if (variantSelect) {
      variantSelect.addEventListener('change', () => {
        if (this.activeRestockContext && variantSelect.value !== 'ALL') {
          // If selecting a single variant manually, clear multi-restock override for standard count evaluation
          const vid = variantSelect.value;
          if (this.activeRestockContext.restockedMap[vid] === undefined) {
            this.activeRestockContext = null;
          }
        }
        this.renderBarcodeBatchPreview();
      });
    }
    if (modeSelect) {
      modeSelect.addEventListener('change', () => {
        const customGrp = document.getElementById('barcodeCustomCountGroup');
        if (customGrp) customGrp.style.display = modeSelect.value === 'custom' ? 'block' : 'none';
        this.renderBarcodeBatchPreview();
      });
    }
    if (customInput) customInput.addEventListener('input', () => this.renderBarcodeBatchPreview());
  }

  initBarcodeGeneratorOptions(preserveVariantId = null) {
    const prodSelect = document.getElementById('barcodeProdSelect');
    if (!prodSelect) return;

    if (!this.products || this.products.length === 0) {
      prodSelect.innerHTML = '<option value="">কোনো পণ্য উপলব্ধ নেই</option>';
      return;
    }

    const currentSelectedId = prodSelect.value;
    const currentVariantId = preserveVariantId !== null ? preserveVariantId : document.getElementById('barcodeVariantSelect')?.value;

    prodSelect.innerHTML = this.products.map(p => `<option value="${p.id}">${p.name} (${p.category || 'General'})</option>`).join('');

    if (currentSelectedId && this.products.some(p => p.id === currentSelectedId)) {
      prodSelect.value = currentSelectedId;
    } else {
      prodSelect.selectedIndex = 0;
    }
    this.onBarcodeProductChange(false, currentVariantId);
  }

  onBarcodeProductChange(fromRestock = false, targetVariantId = null) {
    const prodId = document.getElementById('barcodeProdSelect')?.value;
    const prod = this.products.find(p => p.id === prodId);
    const variantSelect = document.getElementById('barcodeVariantSelect');

    if (variantSelect && prod) {
      const activeVariantVal = targetVariantId !== null ? targetVariantId : variantSelect.value;

      variantSelect.innerHTML = `<option value="ALL">সকল ভেরিয়েন্ট (All Variants)</option>` + 
        (prod.variants || []).map(v => `<option value="${v.variantId}">${v.color || 'Std'} - ${v.size || 'N/A'} (৳${v.price})</option>`).join('');

      if (activeVariantVal && (activeVariantVal === 'ALL' || (prod.variants || []).some(v => v.variantId === activeVariantVal))) {
        variantSelect.value = activeVariantVal;
      } else if (fromRestock && this.activeRestockContext && this.activeRestockContext.prodId === prodId) {
        const restockedKeys = Object.keys(this.activeRestockContext.restockedMap || {});
        if (restockedKeys.length === 1) {
          variantSelect.value = restockedKeys[0];
        } else {
          variantSelect.value = 'ALL';
        }
      }
    }

    this.renderBarcodeBatchPreview();
  }

  renderBarcodeBatchPreview() {
    const grid = document.getElementById('barcodeBatchGrid');
    if (!grid) return;

    const prodId = document.getElementById('barcodeProdSelect')?.value;
    const variantId = document.getElementById('barcodeVariantSelect')?.value;
    const printMode = document.getElementById('barcodePrintModeSelect')?.value;
    const customCount = parseInt(document.getElementById('barcodeBatchCount')?.value) || 1;
    const paperFormatSelect = document.getElementById('barcodePaperFormatSelect');
    const paperFormat = paperFormatSelect ? paperFormatSelect.value : (localStorage.getItem('pos_barcode_paper_format') || 'sticker_38x25');

    const prod = this.products.find(p => p.id === prodId);
    if (!prod) {
      grid.innerHTML = '<p class="text-muted">কোনো পণ্য সিলেক্ট করা হয়নি</p>';
      return;
    }

    let targetVariants = prod.variants || [];
    if (variantId && variantId !== 'ALL') {
      targetVariants = targetVariants.filter(v => v.variantId === variantId);
    } else if (this.activeRestockContext && this.activeRestockContext.prodId === prodId) {
      const restockedKeys = Object.keys(this.activeRestockContext.restockedMap || {});
      if (restockedKeys.length > 0) {
        targetVariants = targetVariants.filter(v => restockedKeys.includes(v.variantId));
      }
    }

    const getCopyCount = (v) => {
      if (this.activeRestockContext && this.activeRestockContext.prodId === prodId && this.activeRestockContext.restockedMap[v.variantId] !== undefined) {
        return this.activeRestockContext.restockedMap[v.variantId];
      }
      return printMode === 'auto_stock' ? Math.max(1, v.stock) : customCount;
    };

    // Calculate preview card dimension and styling per sticker paper format
    let cardWidth = '160px';
    let cardMinHeight = '110px';
    let cardPadding = '5px 4px';
    let titleFontSize = '0.66rem';
    let titleLineClamp = '2';
    let variantFontSize = '0.58rem';
    let priceFontSize = '0.76rem';
    let bcWidth = 1.25;
    let bcHeight = 44;
    let bcFontSize = 9.5;
    let bcMargin = 1;

    switch (paperFormat) {
      case 'sticker_38x25':
        cardWidth = '160px';
        cardMinHeight = '105px';
        cardPadding = '6px 5px 6px 5px';
        titleFontSize = '0.62rem';
        variantFontSize = '0.54rem';
        priceFontSize = '0.72rem';
        bcWidth = 1.05;
        bcHeight = 22;
        bcFontSize = 8.5;
        bcMargin = 0;
        break;
      case 'sticker_50x30':
        cardWidth = '205px';
        cardMinHeight = '130px';
        cardPadding = '8px 6px';
        titleFontSize = '0.72rem';
        variantFontSize = '0.64rem';
        priceFontSize = '0.82rem';
        bcWidth = 1.4;
        bcHeight = 52;
        bcFontSize = 10;
        bcMargin = 2;
        break;
      case 'sticker_50x25':
        cardWidth = '205px';
        cardMinHeight = '110px';
        cardPadding = '6px 6px';
        titleFontSize = '0.68rem';
        variantFontSize = '0.60rem';
        priceFontSize = '0.78rem';
        bcWidth = 1.35;
        bcHeight = 44;
        bcFontSize = 9.5;
        bcMargin = 1;
        break;
      case 'sticker_75x50':
        cardWidth = '280px';
        cardMinHeight = '185px';
        cardPadding = '12px 10px';
        titleFontSize = '0.85rem';
        variantFontSize = '0.74rem';
        priceFontSize = '0.92rem';
        bcWidth = 1.8;
        bcHeight = 72;
        bcFontSize = 12;
        bcMargin = 3;
        break;
      case 'sticker_25x15':
        cardWidth = '125px';
        cardMinHeight = '78px';
        cardPadding = '4px 2px';
        titleFontSize = '0.55rem';
        titleLineClamp = '1';
        variantFontSize = '0.50rem';
        priceFontSize = '0.65rem';
        bcWidth = 0.9;
        bcHeight = 28;
        bcFontSize = 8;
        bcMargin = 0;
        break;
      case '2up_label':
        cardWidth = '175px';
        cardMinHeight = '115px';
        cardPadding = '6px 4px';
        titleFontSize = '0.68rem';
        variantFontSize = '0.60rem';
        priceFontSize = '0.78rem';
        bcWidth = 1.3;
        bcHeight = 44;
        bcFontSize = 9.5;
        bcMargin = 1;
        break;
      case 'a4_grid':
        cardWidth = '165px';
        cardMinHeight = '110px';
        cardPadding = '6px 4px';
        titleFontSize = '0.66rem';
        variantFontSize = '0.58rem';
        priceFontSize = '0.76rem';
        bcWidth = 1.25;
        bcHeight = 42;
        bcFontSize = 9.5;
        bcMargin = 1;
        break;
      case '80mm':
        cardWidth = '240px';
        cardMinHeight = '140px';
        cardPadding = '10px 8px';
        titleFontSize = '0.78rem';
        variantFontSize = '0.70rem';
        priceFontSize = '0.85rem';
        bcWidth = 1.4;
        bcHeight = 56;
        bcFontSize = 10;
        bcMargin = 1;
        break;
    }

    let html = '';
    let svgIndex = 0;

    targetVariants.forEach(v => {
      const copyCount = getCopyCount(v);
      let priceFormatted = '';
      if (v.mrp && parseFloat(v.mrp) > parseFloat(v.price)) {
        priceFormatted = `Price:&nbsp;<span style="position: relative; display: inline-block; vertical-align: baseline; color: #333333 !important; font-weight: 700; font-size: 0.88em; margin-right: 5px; line-height: 1.1;">৳${parseFloat(v.mrp).toFixed(0)}<span style="position: absolute; left: -2px; right: -2px; top: 52%; height: 1.2px; background: #000000 !important; background-color: #000000 !important; display: block; transform: translateY(-50%) rotate(-7deg); transform-origin: center; pointer-events: none; z-index: 10;"></span></span>&nbsp;<strong style="color: #000000 !important; font-weight: 900; font-size: 1.05em; display: inline-block; vertical-align: baseline; line-height: 1.1;">৳${parseFloat(v.price).toFixed(0)}</strong>`;
      } else {
        priceFormatted = `Price:&nbsp;<strong style="color: #000000 !important; font-weight: 900; font-size: 1.05em; display: inline-block; vertical-align: baseline; line-height: 1.1;">৳${parseFloat(v.price).toFixed(0)}</strong>`;
      }

      const nameStr = prod.name || '';
      const len = nameStr.trim().length;

      let dynamicTitleStyle = `font-size:${titleFontSize}; font-weight:700; line-height:1.1; margin-bottom:1px;`;
      if (len > 32) {
        dynamicTitleStyle = `font-size:calc(${titleFontSize} - 0.08rem); font-weight:600; line-height:1.05; margin-bottom:1px;`;
      } else if (len > 22) {
        dynamicTitleStyle = `font-size:calc(${titleFontSize} - 0.04rem); font-weight:700; line-height:1.08; margin-bottom:1px;`;
      }

      for (let i = 0; i < copyCount; i++) {
        html += `
          <div class="barcode-sticker-card" style="width:${cardWidth}; min-height:${cardMinHeight}; max-width:100%; box-sizing:border-box; padding:${cardPadding}; background:#fff; color:#000; border-radius:8px; text-align:center; border:1px solid #000; box-shadow:0 3px 10px rgba(0,0,0,0.12); overflow:hidden; display:flex; flex-direction:column; align-items:center; justify-content:space-between; transition: all 0.2s ease;">
            <div style="${dynamicTitleStyle} width:100%; text-align:center; color:#000; display:-webkit-box; -webkit-line-clamp:${titleLineClamp}; -webkit-box-orient:vertical; overflow:hidden; word-break:break-word; margin-top:2px; margin-bottom:1px; padding-top:1px;">${prod.name}</div>
            <div style="font-size:${variantFontSize}; font-weight:600; color:#4b5563; margin-top:1px; margin-bottom:1px; line-height:1.05;">${v.color || ''} ${v.size ? '| ' + v.size : ''}</div>
            <div style="width:100%; overflow:visible; display:flex; justify-content:center; margin:1px 0;">
              <svg id="bcSvg_${svgIndex}" style="max-width:100%; height:auto; display:block; margin:0 auto; shape-rendering:crispEdges; image-rendering:pixelated;"></svg>
            </div>
            <div style="font-size:${priceFontSize}; font-weight:800; color:#000; margin-top:1px; margin-bottom:2px; line-height:1.05; padding-bottom:1px;">
              ${priceFormatted}
            </div>
          </div>
        `;
        svgIndex++;
      }
    });

    grid.innerHTML = html;

    if (typeof JsBarcode !== 'undefined') {
      let idx = 0;
      targetVariants.forEach(v => {
        const copyCount = getCopyCount(v);
        for (let i = 0; i < copyCount; i++) {
          try {
            JsBarcode(`#bcSvg_${idx}`, v.barcode.toString().trim(), {
              format: "CODE128",
              width: bcWidth,
              height: bcHeight,
              fontSize: bcFontSize,
              fontOptions: "bold",
              font: "monospace",
              marginTop: 1,
              marginBottom: 4,
              textMargin: 3,
              background: "#ffffff",
              lineColor: "#000000",
              displayValue: true
            });
            const svgNode = document.getElementById(`bcSvg_${idx}`);
            if (svgNode) svgNode.setAttribute('shape-rendering', 'crispEdges');
          } catch(e) {
            console.error("Barcode render error:", e);
          }
          idx++;
        }
      });
    }
  }

  getBarcodeItemsList() {
    const prodId = document.getElementById('barcodeProdSelect')?.value;
    const variantId = document.getElementById('barcodeVariantSelect')?.value;
    const printMode = document.getElementById('barcodePrintModeSelect')?.value;
    const customCount = parseInt(document.getElementById('barcodeBatchCount')?.value) || 1;

    const prod = this.products.find(p => p.id === prodId);
    if (!prod) return [];

    let targetVariants = prod.variants || [];
    if (variantId && variantId !== 'ALL') {
      targetVariants = targetVariants.filter(v => v.variantId === variantId);
    } else if (this.activeRestockContext && this.activeRestockContext.prodId === prodId) {
      const restockedKeys = Object.keys(this.activeRestockContext.restockedMap || {});
      if (restockedKeys.length > 0) {
        targetVariants = targetVariants.filter(v => restockedKeys.includes(v.variantId));
      }
    }

    const getCopyCount = (v) => {
      if (this.activeRestockContext && this.activeRestockContext.prodId === prodId && this.activeRestockContext.restockedMap[v.variantId] !== undefined) {
        return this.activeRestockContext.restockedMap[v.variantId];
      }
      return printMode === 'auto_stock' ? Math.max(1, v.stock) : customCount;
    };

    const items = [];
    targetVariants.forEach(v => {
      const copyCount = getCopyCount(v);
      for (let i = 0; i < copyCount; i++) {
        items.push({
          name: prod.name,
          variantDetails: `${v.color || ''} ${v.size ? '| ' + v.size : ''}`.trim(),
          barcode: v.barcode,
          price: v.price,
          mrp: v.mrp
        });
      }
    });
    return items;
  }

  printBarcodeStickers() {
    const items = this.getBarcodeItemsList();
    if (items.length === 0) {
      this.showToast('প্রিন্ট করার জন্য কোনো বারকোড আইটেম পাওয়া যায়নি!', 'warning');
      return;
    }

    const paperFormatSelect = document.getElementById('barcodePaperFormatSelect');
    const selectedFormat = paperFormatSelect ? paperFormatSelect.value : (localStorage.getItem('pos_barcode_paper_format') || 'sticker_38x25');

    const prodId = document.getElementById('barcodeProdSelect')?.value;
    const prod = this.products.find(p => p.id === prodId);
    const prodTitle = prod ? prod.name : 'বারকোড স্টিকার';

    if (window.printHub) {
      window.printHub.openBarcodeStudio({
        title: `${prodTitle} - বারকোড স্টিকার প্রিন্ট হাব`,
        items: items,
        paperFormat: selectedFormat
      });

      this.showToast(`🖨️ ${items.length} টি বারকোড স্টিকার প্রিন্টারে পাঠানো হচ্ছে...`, 'success');
    } else {
      window.print();
    }
  }

  // Helper: Get payment badge configuration for a sale (retains payment method name + refund status)
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

  // 8. SALES LOG & AUDIT REPORT
  renderSalesLog() {
    const tbody = document.getElementById('adminSalesTableBody');
    if (!tbody) return;

    if (this.sales.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center p-4">কোনো বিক্রি ইতিহাস রেকর্ড পাওয়া যায়নি</td></tr>`;
      return;
    }

    const sortedSales = this.sales.slice().sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    tbody.innerHTML = sortedSales.map(s => {
      const { bg, color, label } = this.getPaymentBadge(s);
      const refunded = s.refundedAmount || 0;
      const netAmt = Math.max(0, (s.grandTotal || 0) - refunded);
      return `
      <tr>
        <td><strong>${s.id}</strong></td>
        <td>${new Date(s.timestamp).toLocaleString('bn-BD')}</td>
        <td>${s.customer}</td>
        <td><span class="badge" style="background:${bg}; color:${color}; font-weight:700; padding: 4px 10px; border-radius: 6px; display: inline-flex; align-items: center;">${label}</span></td>
        <td style="text-align: right; font-weight: 800; color: ${s.status === 'RETURNED' ? '#ef4444' : '#10b981'};">
          ৳${netAmt.toFixed(2)}
          ${refunded > 0 ? `<div style="color: #ef4444; font-size: 0.72rem; font-weight: 600; margin-top: 2px;">(-৳${refunded.toFixed(2)} refund)</div>` : ''}
        </td>
        <td><button class="btn btn-outline btn-sm" onclick="adminApp.showReceiptModalById('${s.id}')"><i class="fa-solid fa-receipt"></i> মেমো</button></td>
      </tr>`;
    }).join('');
  }

  showReceiptModalById(id) {
    const sale = this.sales.find(s => s.id === id);
    if (!sale) return;

    document.getElementById('rcptInvId').innerText = sale.id;
    document.getElementById('rcptDate').innerText = new Date(sale.timestamp).toLocaleString('bn-BD');
    document.getElementById('rcptCustomer').innerText = sale.customer;

    const itemsBody = document.getElementById('rcptItemsBody');
    itemsBody.innerHTML = sale.items.map(i => `
      <tr>
        <td>
          ${i.name}<br>
          <small style="color:#666;">(${i.color || ''} / ${i.size || ''})</small>
        </td>
        <td>${i.quantity} × ৳${i.price}</td>
        <td class="text-right">৳${i.subtotal}</td>
      </tr>
    `).join('');

    document.getElementById('rcptSubtotal').innerText = `৳${sale.subtotal.toFixed(2)}`;
    document.getElementById('rcptDiscount').innerText = `-৳${sale.discount.toFixed(2)}`;
    document.getElementById('rcptTax').innerText = `+৳${sale.tax.toFixed(2)}`;
    document.getElementById('rcptGrandTotal').innerText = `৳${sale.grandTotal.toFixed(2)}`;

    if (typeof JsBarcode !== 'undefined') {
      JsBarcode("#rcptBarcodeSvg", sale.id, {
        format: "CODE128", width: 1.8, height: 48, displayValue: true, fontSize: 13, fontOptions: "bold", font: "monospace",
        marginTop: 8, marginBottom: 8, marginLeft: 18, marginRight: 18,
        background: "#ffffff", lineColor: "#000000"
      });
    }

    this.openModal('adminReceiptModal');
  }

  saveProducts() {
    const activeStoreId = localStorage.getItem('pos_active_store_id') || 'store_demo_101';
    const tenantProdKey = `pos_tenant_${activeStoreId}_pos_products`;
    const prodJson = JSON.stringify(this.products || []);

    localStorage.setItem(tenantProdKey, prodJson);
    localStorage.setItem('pos_products', prodJson);

    if (window.posFirebase) {
      if (typeof window.posFirebase.saveDoc === 'function') {
        window.posFirebase.saveDoc('pos_products', this.products);
      } else if (typeof window.posFirebase.pushKeyToCloud === 'function') {
        window.posFirebase.pushKeyToCloud('pos_products', prodJson);
      }
    }

    window.dispatchEvent(new CustomEvent('pos_cloud_update', { detail: { key: 'pos_products', data: this.products } }));
  }

  openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
  }

  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
  }

  initEventListeners() {
    // Navigation items click
    document.querySelectorAll('.sidebar .nav-item[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    // Permanent Theme Selection (Day / Night Mode) Handler
    const applyPermanentTheme = (themeMode) => {
      document.documentElement.setAttribute('data-theme', themeMode);
      localStorage.setItem('pos_theme', themeMode);
      
      const themeSelect = document.getElementById('settingDefaultTheme');
      if (themeSelect) themeSelect.value = themeMode;

      const themeBtn = document.getElementById('themeToggleBtn');
      if (themeBtn) {
        themeBtn.innerHTML = themeMode === 'dark' ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
      }

      try {
        const currentSettings = JSON.parse(localStorage.getItem('pos_settings')) || {};
        currentSettings.defaultTheme = themeMode;
        localStorage.setItem('pos_settings', JSON.stringify(currentSettings));
        if (this.settings) this.settings.defaultTheme = themeMode;
      } catch(e) {}
    };

    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const curTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const nextTheme = curTheme === 'dark' ? 'light' : 'dark';
        applyPermanentTheme(nextTheme);
      });
    }

    const themeSelect = document.getElementById('settingDefaultTheme');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        applyPermanentTheme(e.target.value);
      });
    }

    // Canvas Image Compression Helper — Auto-scales any resolution down to max 1080px
    // Automatically outputs WebP (smaller size) where browser supports it, else JPEG
    const compressGalleryImage = (file, maxDimension = 1080, quality = 0.85, callback) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width  = img.width;
          let height = img.height;

          // Scale down if either dimension exceeds maxDimension
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width  = maxDimension;
            } else {
              width  = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width  = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Smart quality: bigger original → more compression to save Firebase space
          const megapixels = (img.width * img.height) / 1_000_000;
          const smartQuality = megapixels > 8 ? 0.75 : megapixels > 4 ? 0.80 : quality;

          // Prefer WebP (30-40% smaller than JPEG), fall back to JPEG
          const supportsWebP = canvas.toDataURL('image/webp').startsWith('data:image/webp');
          const format  = supportsWebP ? 'image/webp' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(format, smartQuality);
          callback(dataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    };

    // Store Logo Device/Gallery File Upload Listener
    const settingLogoBtn = document.getElementById('settingStoreLogoBtn');
    const settingLogoFileInput = document.getElementById('settingStoreLogoFileInput');
    const settingLogoPreview = document.getElementById('settingStoreLogoPreview');
    const settingLogoFileName = document.getElementById('settingStoreLogoFileName');
    if (settingLogoBtn && settingLogoFileInput) {
      settingLogoBtn.addEventListener('click', () => settingLogoFileInput.click());
      if (settingLogoPreview) settingLogoPreview.addEventListener('click', () => settingLogoFileInput.click());
      settingLogoFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          compressGalleryImage(file, 1080, 0.85, (dataUrl) => {
            const hiddenVal = document.getElementById('settingStoreLogo');
            if (hiddenVal) hiddenVal.value = dataUrl;
            if (settingLogoPreview) settingLogoPreview.src = dataUrl;
            if (settingLogoFileName) settingLogoFileName.innerText = file.name;
            if (this.settings) this.settings.storeLogo = dataUrl;
            this.updateSidebarStoreProfile();
          });
        }
      });
    }

    // Invoice Logo Device/Gallery File Upload Listener (Transparent PNG Supported)
    const invLogoBtn = document.getElementById('settingInvoiceLogoBtn');
    const invLogoFileInput = document.getElementById('settingInvoiceLogoFileInput');
    const invLogoPreview = document.getElementById('settingInvoiceLogoPreview');
    const invLogoFileName = document.getElementById('settingInvoiceLogoFileName');

    if (invLogoBtn && invLogoFileInput) {
      invLogoBtn.addEventListener('click', () => invLogoFileInput.click());
      if (invLogoPreview) invLogoPreview.addEventListener('click', () => invLogoFileInput.click());

      invLogoFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          compressGalleryImage(file, 600, 0.9, (dataUrl) => {
            const hiddenVal = document.getElementById('settingInvoiceLogo');
            if (hiddenVal) hiddenVal.value = dataUrl;
            if (invLogoPreview) invLogoPreview.src = dataUrl;
            if (invLogoFileName) invLogoFileName.innerText = file.name;
          });
        }
      });
    }

    // Owner NID Card File Upload Listener
    const nidBtn = document.getElementById('settingOwnerNIDBtn');
    const nidFileInput = document.getElementById('settingOwnerNIDFileInput');
    const nidPreview = document.getElementById('settingOwnerNIDPreview');
    const nidFileName = document.getElementById('settingOwnerNIDFileName');

    if (nidBtn && nidFileInput) {
      nidBtn.addEventListener('click', () => nidFileInput.click());
      if (nidPreview) nidPreview.addEventListener('click', () => nidFileInput.click());

      nidFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          compressGalleryImage(file, 800, 0.8, (dataUrl) => {
            const hiddenVal = document.getElementById('settingOwnerNIDImage');
            if (hiddenVal) hiddenVal.value = dataUrl;
            if (nidPreview) nidPreview.src = dataUrl;
            if (nidFileName) nidFileName.innerText = file.name;
          });
        }
      });
    }

    // Desktop Background Wallpaper File Upload Listener
    const deskBgBtn = document.getElementById('settingDesktopBgBtn');
    const deskBgFileInput = document.getElementById('settingDesktopBgFileInput');
    const deskBgPreview = document.getElementById('settingDesktopBgPreview');
    const deskBgFileName = document.getElementById('settingDesktopBgFileName');

    if (deskBgBtn && deskBgFileInput) {
      deskBgBtn.addEventListener('click', () => deskBgFileInput.click());
      if (deskBgPreview) deskBgPreview.addEventListener('click', () => deskBgFileInput.click());

      deskBgFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          compressGalleryImage(file, 1920, 0.82, (dataUrl) => {
            const hiddenVal = document.getElementById('settingDesktopBg');
            if (hiddenVal) hiddenVal.value = dataUrl;
            if (deskBgPreview) deskBgPreview.src = dataUrl;
            if (deskBgFileName) deskBgFileName.innerText = file.name;
          });
        }
      });
    }

    // Mobile Background Wallpaper File Upload Listener
    const mobBgBtn = document.getElementById('settingMobileBgBtn');
    const mobBgFileInput = document.getElementById('settingMobileBgFileInput');
    const mobBgPreview = document.getElementById('settingMobileBgPreview');
    const mobBgFileName = document.getElementById('settingMobileBgFileName');

    if (mobBgBtn && mobBgFileInput) {
      mobBgBtn.addEventListener('click', () => mobBgFileInput.click());
      if (mobBgPreview) mobBgPreview.addEventListener('click', () => mobBgFileInput.click());

      mobBgFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          compressGalleryImage(file, 1080, 0.82, (dataUrl) => {
            const hiddenVal = document.getElementById('settingMobileBg');
            if (hiddenVal) hiddenVal.value = dataUrl;
            if (mobBgPreview) mobBgPreview.src = dataUrl;
            if (mobBgFileName) mobBgFileName.innerText = file.name;
          });
        }
      });
    }

    // Remove Custom Wallpapers Handler
    document.getElementById('btnRemoveCustomWallpapers')?.addEventListener('click', () => {
      if (confirm('আপনি কি নিশ্চিত যে কাস্টম ব্যাকগ্রাউন্ড রিমুভ করে ডিফল্ট থিমে ফেরত যেতে চান?')) {
        const setD = document.getElementById('settingDesktopBg');
        const setM = document.getElementById('settingMobileBg');
        if (setD) setD.value = '';
        if (setM) setM.value = '';
        if (deskBgPreview) deskBgPreview.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='70' viewBox='0 0 120 70'><rect width='120' height='70' fill='%231e293b'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='10'>Desktop Wall</text></svg>";
        if (mobBgPreview) mobBgPreview.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='70' height='100' viewBox='0 0 70 100'><rect width='70' height='100' fill='%231e293b'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='10'>Mobile Wall</text></svg>";
        if (this.settings) {
          this.settings.customDesktopBg = '';
          this.settings.customMobileBg = '';
        }
        localStorage.setItem('pos_settings', JSON.stringify(this.settings));
        applyMerchantCustomWallpaper(this.settings);
        this.showToast('কাস্টম ব্যাকগ্রাউন্ড রিমুভ করা হয়েছে!');
      }
    });

    // Product Image Device/Gallery File Upload Listener
    // Images are uploaded to Firebase Storage → CDN URL stored (keeps Firestore tiny → unlimited products)
    const prodUploadBtn = document.getElementById('prodFormUploadBtn');
    const prodFileInput = document.getElementById('prodFormFileInput');
    const prodFormImgPreview = document.getElementById('prodFormImgPreview');
    if (prodUploadBtn && prodFileInput) {
      prodUploadBtn.addEventListener('click', () => prodFileInput.click());
      if (prodFormImgPreview) prodFormImgPreview.addEventListener('click', () => prodFileInput.click());
      prodFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileNameEl = document.getElementById('prodImgFileName');
        const hiddenImg   = document.getElementById('prodFormImage');

        // Step 1: Compress image first
        compressGalleryImage(file, 1080, 0.85, async (dataUrl) => {
          // Show preview immediately from compressed dataUrl
          if (prodFormImgPreview) prodFormImgPreview.src = dataUrl;
          if (fileNameEl) fileNameEl.innerText = `⏫ আপলোড হচ্ছে...`;

          // Step 2: Upload to Firebase Storage, get CDN URL
          const storeId   = localStorage.getItem('pos_active_store_id') || 'store_default';
          const safeName  = `prod_${Date.now()}`;

          try {
            const finalUrl = await window.uploadImageToStorage(
              dataUrl, storeId, safeName,
              (pct) => { if (fileNameEl) fileNameEl.innerText = `⏫ আপলোড: ${pct}%`; }
            );
            if (hiddenImg) hiddenImg.value = finalUrl;
            if (fileNameEl) {
              fileNameEl.innerText = window.isStorageUrl && window.isStorageUrl(finalUrl)
                ? `✅ ${file.name} (Cloud-এ সেভ হয়েছে)`
                : file.name;
            }
          } catch (err) {
            // Fallback: store base64
            if (hiddenImg) hiddenImg.value = dataUrl;
            if (fileNameEl) fileNameEl.innerText = file.name;
          }
        });
      });
    }

    // Category Image Device/Gallery File Upload Listener
    // Images are uploaded to Firebase Storage → CDN URL stored
    const catUploadBtn = document.getElementById('catFormUploadBtn');
    const catFileInput = document.getElementById('catFormFileInput');
    const catFormImgPreview = document.getElementById('catFormImgPreview');
    if (catUploadBtn && catFileInput) {
      catUploadBtn.addEventListener('click', () => catFileInput.click());
      if (catFormImgPreview) catFormImgPreview.addEventListener('click', () => catFileInput.click());
      catFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileNameEl = document.getElementById('catImgFileName');
        const hiddenCat  = document.getElementById('catImgUrl');

        compressGalleryImage(file, 1080, 0.85, async (dataUrl) => {
          if (catFormImgPreview) catFormImgPreview.src = dataUrl;
          if (fileNameEl) fileNameEl.innerText = `⏫ আপলোড হচ্ছে...`;

          const storeId  = localStorage.getItem('pos_active_store_id') || 'store_default';
          const safeName = `cat_${Date.now()}`;

          try {
            const finalUrl = await window.uploadImageToStorage(
              dataUrl, storeId, safeName,
              (pct) => { if (fileNameEl) fileNameEl.innerText = `⏫ আপলোড: ${pct}%`; }
            );
            if (hiddenCat) hiddenCat.value = finalUrl;
            if (fileNameEl) {
              fileNameEl.innerText = window.isStorageUrl && window.isStorageUrl(finalUrl)
                ? `✅ ${file.name} (Cloud-এ সেভ হয়েছে)`
                : file.name;
            }
          } catch (err) {
            if (hiddenCat) hiddenCat.value = dataUrl;
            if (fileNameEl) fileNameEl.innerText = file.name;
          }
        });
      });
    }

    // Sidebar & In-Page Add Product Buttons
    const addProdBtnIds = [
      'sidebarAddProductBtn', 
      'allProdAddProdBtn', 
      'bottomAddProductBtn', 
      'variantViewAddProductBtn', 
      'variantBottomAddProductBtn'
    ];
    addProdBtnIds.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', () => this.openProductModal());
    });

    // Sidebar & In-Page Add Variant / Category Buttons
    const addVarBtnIds = [
      'sidebarAddVariantBtn', 
      'allProdAddVariantBtn', 
      'bottomAddVariantBtn', 
      'variantViewAddCategoryBtn', 
      'categoryViewAddCatBtn',
      'variantBottomAddCategoryBtn',
      'modalQuickAddCategoryBtn'
    ];
    addVarBtnIds.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', () => this.openVariantCategoryModal());
    });

    // All Product Filters
    const searchInput = document.getElementById('allProductSearch');
    const catSelect = document.getElementById('allProductCategoryFilter');
    const stockSelect = document.getElementById('allProductStockFilter');

    if (searchInput) searchInput.addEventListener('input', () => this.renderInventoryTable());
    if (catSelect) catSelect.addEventListener('change', () => this.renderInventoryTable());
    if (stockSelect) stockSelect.addEventListener('change', () => this.renderInventoryTable());

    // Add Variant Row in Product Modal
    const addVarRowBtn = document.getElementById('addVariantRowBtn');
    if (addVarRowBtn) addVarRowBtn.addEventListener('click', () => this.addVariantRow());

    // Save Buttons in Product Modal
    const saveOnlyBtn = document.getElementById('saveOnlyBtn');
    if (saveOnlyBtn) saveOnlyBtn.addEventListener('click', () => this.saveProductFromForm(false));

    const saveAndPrintBtn = document.getElementById('saveAndPrintBtn');
    if (saveAndPrintBtn) saveAndPrintBtn.addEventListener('click', () => this.saveProductFromForm(true));

    // Variant Category Modal form submission
    const varCatForm = document.getElementById('variantCategoryForm');
    if (varCatForm) varCatForm.addEventListener('submit', (e) => this.saveCategoryOrVariant(e));

    // Restock Modal buttons
    const confirmRestockOnlyBtn = document.getElementById('confirmRestockOnlyBtn');
    if (confirmRestockOnlyBtn) confirmRestockOnlyBtn.addEventListener('click', () => this.processRestock(false));

    const confirmRestockAndPrintBtn = document.getElementById('confirmRestockAndPrintBtn');
    if (confirmRestockAndPrintBtn) confirmRestockAndPrintBtn.addEventListener('click', () => this.processRestock(true));

    const printBatchBtn = document.getElementById('printBatchStickersBtn');
    if (printBatchBtn) printBatchBtn.addEventListener('click', () => this.printBarcodeStickers());

    // Shop Settings Buttons
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', () => this.saveSettingsFromForm());

    document.querySelectorAll('.settings-subtab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchSettingsSubTab(btn.dataset.subtab);
      });
    });

    const exportBackupBtn = document.getElementById('exportBackupBtn');
    if (exportBackupBtn) exportBackupBtn.addEventListener('click', () => this.exportSystemBackup());

    const restoreDemoBtn = document.getElementById('restoreDemoBtn');
    if (restoreDemoBtn) restoreDemoBtn.addEventListener('click', () => this.restoreDemoData());

    const addNewCouponBtn = document.getElementById('addNewCouponBtn');
    if (addNewCouponBtn) addNewCouponBtn.addEventListener('click', () => this.openCouponModal());

    const couponForm = document.getElementById('couponForm');
    if (couponForm) couponForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveCouponFromForm();
    });

    const adminPrintBtn = document.getElementById('adminPrintReceiptBtn');
    if (adminPrintBtn) {
      adminPrintBtn.addEventListener('click', () => this.playInModalReceiptPrint('printableReceipt', false));
    }

    const replayBtn = document.getElementById('adminRcptReplayAnimBtn');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => this.playInModalReceiptPrint('printableReceipt', false));
    }

    const pdfBtn = document.getElementById('adminRcptDownloadPdfBtn');
    if (pdfBtn) {
      pdfBtn.addEventListener('click', () => this.downloadReceiptPDF('printableReceipt'));
    }

    // Date Range Filter Control
    const dateFilterSelect = document.getElementById('adminDateFilterSelect');
    if (dateFilterSelect) {
      dateFilterSelect.addEventListener('change', (e) => {
        this.currentDateFilter = e.target.value;
        this.renderDashboard();
        this.showToast(`সময়কাল ফিল্টার আপডেট করা হলো: ${e.target.options[e.target.selectedIndex].text}`);
      });
    }

    // Stat Card Click Listeners for All 7 KPI Options in Merchant Admin
    const cardSale = document.getElementById('adminCardTotalSale') || document.getElementById('adminCardGrossRevenue');
    if (cardSale) cardSale.addEventListener('click', () => this.openGrossSalesModal());

    const cardCash = document.getElementById('adminCardCashPayment');
    if (cardCash) cardCash.addEventListener('click', () => this.openCashPaymentModalDetails());

    const cardEpay = document.getElementById('adminCardEpayPayment');
    if (cardEpay) cardEpay.addEventListener('click', () => this.openEpayPaymentModalDetails());

    const cardOrders = document.getElementById('adminCardTotalOrders');
    if (cardOrders) cardOrders.addEventListener('click', () => this.openTotalOrdersModal());

    const cardItem = document.getElementById('adminCardTotalItem');
    if (cardItem) cardItem.addEventListener('click', () => this.openTotalItemsSoldModal());

    const cardNetProfit = document.getElementById('adminCardNetProfit');
    if (cardNetProfit) cardNetProfit.addEventListener('click', () => this.openNetProfitModal());

    const cardReturns = document.getElementById('adminCardReturns');
    if (cardReturns) cardReturns.addEventListener('click', () => this.openAdminReturnsModal());

    const cardVatDisc = document.getElementById('adminCardVatDiscount');
    if (cardVatDisc) cardVatDisc.addEventListener('click', () => this.openVatDiscountModal());

    const bannerLowStock = document.getElementById('adminLowStockBanner');
    if (bannerLowStock) bannerLowStock.addEventListener('click', () => this.openLowStockModal());

    const btnLowStock = document.getElementById('bannerLowStockBtn');
    if (btnLowStock) btnLowStock.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openLowStockModal();
    });

    const cardLowStock = document.getElementById('adminCardLowStock');
    if (cardLowStock) cardLowStock.addEventListener('click', () => this.openLowStockModal());

    const btnModalOrdersSales = document.getElementById('btnModalOrdersGoToSales');
    if (btnModalOrdersSales) btnModalOrdersSales.addEventListener('click', () => {
      this.closeModal('totalOrdersModal');
      this.switchTab('adminSales');
    });

    // Navigation inside stat modals
    const btnGrossSales = document.getElementById('modalGrossGoToSalesBtn');
    if (btnGrossSales) btnGrossSales.addEventListener('click', () => {
      this.closeModal('grossSalesModal');
      this.switchTab('adminSales');
    });

    const btnProfitSales = document.getElementById('modalProfitGoToSalesBtn');
    if (btnProfitSales) btnProfitSales.addEventListener('click', () => {
      this.closeModal('netProfitModal');
      this.switchTab('adminSales');
    });

    const btnLowStockProd = document.getElementById('modalLowStockGoToProductsBtn');
    if (btnLowStockProd) btnLowStockProd.addEventListener('click', () => {
      this.closeModal('lowStockDetailModal');
      this.switchTab('adminAllProducts');
    });

    // Customer Stat Cards
    const cardTotalCust = document.getElementById('adminCardTotalCust');
    if (cardTotalCust) cardTotalCust.addEventListener('click', () => {
      this.switchTab('adminCustomers');
      const searchInput = document.getElementById('adminCustomerSearchInput');
      if (searchInput) { searchInput.value = ''; this.renderAdminCustomers(); searchInput.focus(); }
    });

    const cardCustOrders = document.getElementById('adminCardCustOrders');
    if (cardCustOrders) cardCustOrders.addEventListener('click', () => {
      this.switchTab('adminCustomers');
    });

    const cardCustSpent = document.getElementById('adminCardCustSpent');
    if (cardCustSpent) cardCustSpent.addEventListener('click', () => {
      this.openCustomerDueModal();
    });

    // Close Modal buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) this.closeModal(modal.id);
      });
    });
  }

  openGrossSalesModal() {
    const targetSales = this.getFilteredSales();

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

    const elNet = document.getElementById('totSalesNetRevenue') || document.getElementById('modalGrossSalesTotal');
    const elCash = document.getElementById('totSalesCashTotal') || document.getElementById('modalGrossCashTotal');
    const elEpay = document.getElementById('totSalesEpayTotal') || document.getElementById('modalGrossEpayTotal');
    const elRefund = document.getElementById('totSalesRefundTotal');

    if (elNet) elNet.innerText = `৳${netRevenue.toFixed(2)}`;
    if (elCash) elCash.innerText = `৳${(cashGross - cashRefunds).toFixed(2)}`;
    if (elEpay) elEpay.innerText = `৳${(epayGross - epayRefunds).toFixed(2)}`;
    if (elRefund) elRefund.innerText = `-৳${totalRefunds.toFixed(2)}`;

    const tbody = document.getElementById('totSalesTableBody') || document.getElementById('modalGrossRecentInvoicesBody');
    if (tbody) {
      if (targetSales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 1.5rem;">নির্বাচন করা সময়কালে কোনো বিক্রির ইনভয়েস রেকর্ড করা হয়নি।</td></tr>`;
      } else {
        tbody.innerHTML = targetSales.map(s => {
          const dtStr = new Date(s.timestamp).toLocaleString('bn-BD');
          const { bg, color, label } = this.getPaymentBadge(s);
          const refunded = s.refundedAmount || 0;
          const netAmt = Math.max(0, (s.grandTotal || 0) - refunded);

          return `
          <tr>
            <td>
              <strong style="cursor: pointer; color: var(--accent-blue);" onclick="adminApp.showReceiptModalById('${s.id}')" title="ইনভয়েস বিবরণী দেখুন">${s.id}</strong>
              <div style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace;">${(s.paymentDetails && s.paymentDetails.trxId) ? s.paymentDetails.trxId : 'SALE-RECORD'}</div>
            </td>
            <td><small>${dtStr}</small></td>
            <td>
              <span class="badge" style="background: ${bg}; color: ${color}; font-weight: 700; padding: 4px 10px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
                ${label}
              </span>
            </td>
            <td>${s.customer || s.customerName || 'Walk-in Customer'}</td>
            <td style="text-align: right; font-weight: 800; color: ${s.status === 'RETURNED' ? '#ef4444' : '#10b981'}; font-size: 1.05rem;">
              ৳${netAmt.toFixed(2)}
              ${refunded ? `<br><small style="color: #ef4444; font-size: 0.7rem;">(৳${refunded.toFixed(2)} refund)</small>` : ''}
            </td>
          </tr>
        `;
        }).join('');
      }
    }

    this.openModal('grossSalesModal');
  }

  openTotalOrdersModal() {
    const filteredSales = this.getFilteredSales();
    const totalRev = filteredSales.reduce((sum, s) => sum + Math.max(0, (s.grandTotal || 0) - (s.refundedAmount || 0)), 0);
    const totalRefunds = filteredSales.reduce((sum, s) => sum + (s.refundedAmount || 0), 0);

    const elBadgeCount = document.getElementById('modalOrdersCountBadge');
    const elBadgeTotal = document.getElementById('modalOrdersTotalAmountBadge');
    if (elBadgeCount) elBadgeCount.innerText = `${filteredSales.length} টি মেমো`;
    if (elBadgeTotal) elBadgeTotal.innerHTML = `৳${totalRev.toFixed(2)}${totalRefunds > 0 ? `<small style="font-size:0.75rem; color:#ef4444; margin-left:6px;">(-৳${totalRefunds.toFixed(2)} refund)</small>` : ''}`;

    const tbody = document.getElementById('modalOrdersTableBody');
    if (tbody) {
      if (filteredSales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding: 1.5rem;">নির্বাচন করা সময়কালে কোনো মেমো পাওয়া যায়নি।</td></tr>`;
      } else {
        tbody.innerHTML = filteredSales.map(s => {
          const { bg, color, label } = this.getPaymentBadge(s);
          const refunded = s.refundedAmount || 0;
          const netAmt = Math.max(0, (s.grandTotal || 0) - refunded);
          return `
          <tr>
            <td><strong>${s.id}</strong></td>
            <td><small>${new Date(s.timestamp).toLocaleString('bn-BD')}</small></td>
            <td>${s.customer || 'Walk-in Customer'}</td>
            <td><span class="badge" style="background: ${bg}; color: ${color}; font-weight: 700; padding: 4px 10px; border-radius: 6px;">${label}</span></td>
            <td>${(s.items || []).length} টি আইটেম</td>
            <td style="text-align: right; font-weight: 700; color: ${s.status === 'RETURNED' ? '#ef4444' : 'var(--accent-green)'};">
              ৳${netAmt.toFixed(2)}
              ${refunded > 0 ? `<br><small style="color: #ef4444; font-size: 0.7rem;">(-৳${refunded.toFixed(2)} refund)</small>` : ''}
            </td>
          </tr>
        `;
        }).join('');
      }
    }

    this.openModal('totalOrdersModal');
  }

  // --- MERCHANT ADMIN RETURN & EXCHANGE BREAKDOWN MODALS ---
  openAdminReturnsModal() {
    const filteredSales = this.getFilteredSales();
    const returnedSales = filteredSales.filter(s => s.status === 'RETURNED' || s.status === 'PARTIALLY_RETURNED' || (s.returnHistory && s.returnHistory.length > 0));

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
            <td>${s.customer || s.customerName || 'Walk-in Customer'}</td>
            <td><small>${itemTexts}</small></td>
            <td style="text-align: center;"><span class="badge bg-orange" style="font-weight:700; padding:3px 8px;">${h.returnedItems && h.returnedItems.length > 0 ? h.returnedItems.reduce((acc, x) => acc + (x.qtyReturned||0), 0) : 1} টি</span></td>
            <td style="text-align: right; font-weight: 700; color: var(--accent-red, #ef4444);">৳${refAmt.toFixed(2)}</td>
            <td style="text-align: center;">
              <button class="btn btn-outline btn-sm" onclick="adminApp.showReceiptModalById('${s.id}')" title="ইনভয়েস মেমো">
                <i class="fa-solid fa-receipt"></i> মেমো
              </button>
            </td>
          </tr>
        `);
      });
    });

    const elRefund = document.getElementById('adminRetModalTotalRefund');
    const elInvCount = document.getElementById('adminRetModalInvCount');
    const elItemQty = document.getElementById('adminRetModalItemQty');
    const tbody = document.getElementById('adminReturnsTableBody');

    if (elRefund) elRefund.innerText = `৳${totalRefund.toFixed(2)}`;
    if (elInvCount) elInvCount.innerText = `${invCount} টি`;
    if (elItemQty) elItemQty.innerText = `${totalItemQty} টি`;

    if (tbody) {
      if (rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted p-3">নির্বাচন করা সময়কালে কোনো রিটার্নের রেকর্ড নেই।</td></tr>`;
      } else {
        tbody.innerHTML = rows.join('');
      }
    }

    this.openModal('adminReturnsModal');
  }

  openVatDiscountModal(tabFilter = 'all') {
    this.currentVatDiscTab = tabFilter || 'all';
    const targetSales = this.getFilteredSales();

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

    const elCouponTot = document.getElementById('vatDiscModalCouponTotal');
    const elCouponCnt = document.getElementById('vatDiscModalCouponCount');
    const elManualTot = document.getElementById('vatDiscModalManualTotal');
    const elManualCnt = document.getElementById('vatDiscModalManualCount');
    const elTaxTot = document.getElementById('vatDiscModalTaxTotal');
    const elTaxCnt = document.getElementById('vatDiscModalTaxCount');
    const elNetBal = document.getElementById('vatDiscModalNetBalance');

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
    this.openModal('adminVatDiscountModal');
  }

  filterVatDiscountModal(tabFilter) {
    this.currentVatDiscTab = tabFilter || 'all';
    const targetSales = this.getFilteredSales();

    const allMatchedSales = targetSales.filter(s => (s.tax || 0) > 0 || (s.discount || 0) > 0 || s.couponCode || s.coupon);
    const couponMatchedSales = targetSales.filter(s => Boolean(s.couponCode || s.coupon || (s.couponDiscount && s.couponDiscount > 0)));
    const discountMatchedSales = targetSales.filter(s => !s.couponCode && !s.coupon && (!s.couponDiscount || s.couponDiscount === 0) && (s.discount || 0) > 0);
    const taxMatchedSales = targetSales.filter(s => (s.tax || 0) > 0);

    const cntAll = document.getElementById('vatDiscTabCountAll');
    const cntCoupon = document.getElementById('vatDiscTabCountCoupon');
    const cntDisc = document.getElementById('vatDiscTabCountDiscount');
    const cntTax = document.getElementById('vatDiscTabCountTax');

    if (cntAll) cntAll.innerText = allMatchedSales.length;
    if (cntCoupon) cntCoupon.innerText = couponMatchedSales.length;
    if (cntDisc) cntDisc.innerText = discountMatchedSales.length;
    if (cntTax) cntTax.innerText = taxMatchedSales.length;

    const btnAll = document.getElementById('btnVatTabAll');
    const btnCoupon = document.getElementById('btnVatTabCoupon');
    const btnDisc = document.getElementById('btnVatTabDiscount');
    const btnTax = document.getElementById('btnVatTabTax');

    if (btnAll) btnAll.classList.toggle('active', tabFilter === 'all');
    if (btnCoupon) btnCoupon.classList.toggle('active', tabFilter === 'coupon');
    if (btnDisc) btnDisc.classList.toggle('active', tabFilter === 'discount');
    if (btnTax) btnTax.classList.toggle('active', tabFilter === 'tax');

    let displaySales = allMatchedSales;
    if (tabFilter === 'coupon') displaySales = couponMatchedSales;
    else if (tabFilter === 'discount') displaySales = discountMatchedSales;
    else if (tabFilter === 'tax') displaySales = taxMatchedSales;

    const tbody = document.getElementById('vatDiscModalTableBody');
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
                <strong style="cursor: pointer; color: var(--accent-blue);" onclick="adminApp.showReceiptModalById('${s.id}')" title="ইনভয়েস বিবরণী দেখুন">${s.id}</strong>
              </td>
              <td><small>${dtStr}</small></td>
              <td>${s.customer || 'Walk-in Customer'}</td>
              <td>${couponPill}</td>
              <td>${manualPill}</td>
              <td>${taxPill}</td>
              <td style="font-weight: 700; color: var(--text-main);">৳${(s.grandTotal || 0).toFixed(2)}</td>
              <td style="text-align: right;">
                <button class="btn btn-outline btn-sm" onclick="adminApp.showReceiptModalById('${s.id}')"><i class="fa-solid fa-receipt"></i> মেমো দেখুন</button>
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  openCashPaymentModalDetails() {
    const filteredSales = this.getFilteredSales();
    const cashSales = filteredSales.filter(s => (s.paymentMethod || '').toUpperCase() !== 'EPAY' && (!s.paymentDetails || (s.paymentDetails.method || '').toLowerCase() !== 'epay'));
    const totalCash = cashSales.reduce((sum, s) => sum + Math.max(0, (s.grandTotal || 0) - (s.refundedAmount || 0)), 0);
    const totalRefunds = cashSales.reduce((sum, s) => sum + (s.refundedAmount || 0), 0);

    const elTotal = document.getElementById('modalCashTotalAmount');
    const elOrders = document.getElementById('modalCashOrdersCount');
    if (elTotal) elTotal.innerHTML = `৳${totalCash.toFixed(2)}${totalRefunds > 0 ? `<small style="font-size:0.75rem; color:#ef4444; margin-left:6px;">(-৳${totalRefunds.toFixed(2)} refund)</small>` : ''}`;
    if (elOrders) elOrders.innerText = `${cashSales.length} টি`;

    const tbody = document.getElementById('modalCashTableBody');
    if (tbody) {
      if (cashSales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 1.5rem;">কোনো ক্যাশ পেমেন্ট ইনভয়েস পাওয়া যায়নি।</td></tr>`;
      } else {
        tbody.innerHTML = cashSales.map(s => {
          const dtStr = new Date(s.timestamp).toLocaleString('bn-BD');
          const { bg, color, label } = this.getPaymentBadge(s);
          const refunded = s.refundedAmount || 0;
          const netAmt = Math.max(0, (s.grandTotal || 0) - refunded);
          return `
          <tr>
            <td>
              <strong style="cursor: pointer; color: var(--accent-blue);" onclick="adminApp.showReceiptModalById('${s.id}')" title="ইনভয়েস মেমো দেখুন">${s.id}</strong>
              <div style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace;">CASH-PAYMENT</div>
            </td>
            <td><small>${dtStr}</small></td>
            <td>
              <span class="badge" style="background: ${bg}; color: ${color}; font-weight: 700; padding: 4px 10px; border-radius: 6px; display: inline-flex; align-items: center;">
                ${label}
              </span>
            </td>
            <td>${s.customer || s.customerName || 'Walk-in Customer'}</td>
            <td style="text-align: right; font-weight: 800; color: ${s.status === 'RETURNED' ? '#ef4444' : '#10b981'}; font-size: 1.05rem;">
              ৳${netAmt.toFixed(2)}
              ${refunded > 0 ? `<br><small style="color: #ef4444; font-size: 0.7rem;">(-৳${refunded.toFixed(2)} refund)</small>` : ''}
            </td>
          </tr>
        `;
        }).join('');
      }
    }

    this.openModal('cashPaymentModalDetails');
  }

  openEpayPaymentModalDetails(filterProvider = 'all') {
    const filteredSales = this.getFilteredSales();
    const epaySales = filteredSales.filter(s => (s.paymentMethod || '').toUpperCase() === 'EPAY' || (s.paymentDetails && (s.paymentDetails.method || '').toLowerCase() === 'epay'));

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

    // Filter by provider
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

    const totalEpay = displaySales.reduce((sum, s) => sum + Math.max(0, (s.grandTotal || 0) - (s.refundedAmount || 0)), 0);
    const totalEpayRefunds = displaySales.reduce((sum, s) => sum + (s.refundedAmount || 0), 0);

    const elTotal = document.getElementById('modalEpayTotalAmount');
    const elOrders = document.getElementById('modalEpayOrdersCount');
    if (elTotal) {
      elTotal.innerHTML = `৳${totalEpay.toFixed(2)}${totalEpayRefunds > 0 ? `<small style="font-size:0.75rem; color:#ef4444; margin-left:6px;">(-৳${totalEpayRefunds.toFixed(2)} refund)</small>` : ''}`;
    }
    if (elOrders) elOrders.innerText = `${displaySales.length} টি`;

    // Render Provider Breakdown Mini Stat Cards
    const provStatsEl = document.getElementById('modalEpayProviderStats');
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
        <button onclick="adminApp.openEpayPaymentModalDetails('${p.filter}')" style="background:${p.bg}; color:${p.color}; border:1px solid ${p.color}30; font-weight:700; flex:1; min-width:90px; padding:6px 10px; border-radius:8px; cursor:pointer; font-size:0.82rem; display:flex; flex-direction:column; align-items:center; gap:2px;">
          ${p.label}<br><small style="font-size:0.72rem;">৳${pt[p.key].toFixed(0)}</small>${refStr}
        </button>
      `;
      }).join('');
    }

    // Render Filter Tabs
    const tabsEl = document.getElementById('modalEpayFilterTabs');
    if (tabsEl) {
      const tabs = [
        { key: 'all', label: 'সব' },
        { key: 'bKash', label: 'bKash' },
        { key: 'Nagad', label: 'Nagad' },
        { key: 'BanglaQR', label: 'Bangla QR' },
        { key: 'Card', label: 'Card' }
      ];
      tabsEl.innerHTML = tabs.map(t => `
        <button onclick="adminApp.openEpayPaymentModalDetails('${t.key}')" style="${filterProvider === t.key ? 'background:var(--accent-orange); color:#fff;' : 'background:var(--bg-card); color:var(--text-muted);'} border:1px solid var(--border-color); padding:5px 12px; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.82rem;">${t.label}</button>
      `).join('');
    }

    const tbody = document.getElementById('modalEpayTableBody');
    if (tbody) {
      if (displaySales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 1.5rem;">এই প্রোভাইডারের কোনো ডিজিটাল ই-পে রেকর্ড পাওয়া যায়নি।</td></tr>`;
      } else {
        tbody.innerHTML = displaySales.map(s => {
          const { bg, color, label } = this.getPaymentBadge(s);
          const trxId = s.paymentDetails?.trxId ? `<br><small style="color:var(--text-muted); font-size:0.75rem;">TrxID: ${s.paymentDetails.trxId}</small>` : '';
          const refunded = s.refundedAmount || 0;
          const netAmt = Math.max(0, (s.grandTotal || 0) - refunded);
          return `
            <tr>
              <td><strong>${s.id}</strong>${trxId}</td>
              <td><small>${new Date(s.timestamp).toLocaleString('bn-BD')}</small></td>
              <td><span class="badge" style="background: ${bg}; color: ${color}; font-weight: 700; padding: 4px 10px; border-radius: 6px;">${label}</span></td>
              <td>${s.customer || 'Walk-in Customer'}</td>
              <td style="text-align: right; font-weight: 800; color: ${s.status === 'RETURNED' ? '#ef4444' : color}; font-size: 1.05rem;">
                ৳${netAmt.toFixed(2)}
                ${refunded > 0 ? `<br><small style="color: #ef4444; font-size: 0.7rem;">(-৳${refunded.toFixed(2)} refund)</small>` : ''}
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    this.openModal('epayPaymentModalDetails');
  }

  openTotalItemsSoldModal(defaultFilter = 'net') {
    this.currentItemsSoldFilter = defaultFilter;
    const filteredSales = this.getFilteredSales();

    const itemMap = {};
    let totalNetUnits = 0;
    let totalGrossUnits = 0;
    let totalReturnedUnits = 0;

    const returnedItemsList = [];

    filteredSales.forEach(s => {
      if (s.items && Array.isArray(s.items)) {
        s.items.forEach(item => {
          const origQty = item.quantity || 1;
          const retQty = item.returnedQuantity || 0;
          const netQty = Math.max(0, origQty - retQty);

          totalGrossUnits += origQty;
          totalReturnedUnits += retQty;
          totalNetUnits += netQty;

          const colorStr = (item.color && item.color !== 'N/A') ? item.color : '';
          const sizeStr = (item.size && item.size !== 'N/A') ? item.size : '';
          const variantKey = [colorStr, sizeStr].filter(Boolean).join('_') || 'Standard';
          const key = `${item.id || item.name}_${variantKey}`;

          let variantLabel = 'Standard';
          if (colorStr && sizeStr) variantLabel = `🎨 ${colorStr} / 📏 ${sizeStr}`;
          else if (colorStr) variantLabel = `🎨 ${colorStr}`;
          else if (sizeStr) variantLabel = `📏 ${sizeStr}`;

          if (!itemMap[key]) {
            const prod = this.products.find(p => p.id === item.id);
            itemMap[key] = {
              name: item.name,
              variant: variantLabel,
              category: (prod && prod.category) ? prod.category : (item.category || 'অন্যান্য'),
              price: item.price || 0,
              grossQty: 0,
              returnedQty: 0,
              netQty: 0,
              netSubtotal: 0,
              grossSubtotal: 0
            };
          }
          itemMap[key].grossQty += origQty;
          itemMap[key].returnedQty += retQty;
          itemMap[key].netQty += netQty;
          itemMap[key].netSubtotal += (item.price * netQty);
          itemMap[key].grossSubtotal += (item.price * origQty);

          if (retQty > 0) {
            returnedItemsList.push({
              invoiceId: s.id,
              date: new Date(s.timestamp).toLocaleString('bn-BD'),
              name: item.name,
              color: item.color || 'N/A',
              size: item.size || 'N/A',
              variant: variantLabel,
              category: (this.products.find(p => p.id === item.id)?.category) || item.category || 'অন্যান্য',
              price: item.price || 0,
              returnedQty: retQty,
              refundAmount: (item.price || 0) * retQty,
              customer: s.customer || s.customerName || 'Walk-in Customer'
            });
          }
        });
      }
    });

    this.cachedItemsSoldData = {
      itemsList: Object.values(itemMap),
      returnedItemsList: returnedItemsList,
      totalNetUnits,
      totalGrossUnits,
      totalReturnedUnits
    };

    // Update Box Count Labels
    const elNetCount = document.getElementById('modalItemsSoldNetCount');
    const elRetCount = document.getElementById('modalItemsSoldReturnedCount');
    const elGrossCount = document.getElementById('modalItemsSoldGrossCount');

    if (elNetCount) elNetCount.innerText = `${totalNetUnits} টি`;
    if (elRetCount) elRetCount.innerText = `${totalReturnedUnits} টি`;
    if (elGrossCount) elGrossCount.innerText = `${totalGrossUnits} টি`;

    const searchInput = document.getElementById('modalItemsSearchInput');
    if (searchInput) searchInput.value = '';

    this.renderItemsSoldModalTable(defaultFilter);
    this.openModal('totalItemsSoldModal');
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
    const data = this.cachedItemsSoldData;
    if (!data) return;

    // Update Box Styling (active border and bg)
    ['boxFilterNet', 'boxFilterReturned', 'boxFilterGross'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.border = '1px solid var(--border-color)';
        el.style.background = 'var(--bg-card)';
      }
    });

    if (filterMode === 'net') {
      const activeEl = document.getElementById('boxFilterNet');
      if (activeEl) {
        activeEl.style.border = '2px solid #10b981';
        activeEl.style.background = 'rgba(16,185,129,0.12)';
      }
    } else if (filterMode === 'returned') {
      const activeEl = document.getElementById('boxFilterReturned');
      if (activeEl) {
        activeEl.style.border = '2px solid #ef4444';
        activeEl.style.background = 'rgba(239,68,68,0.12)';
      }
    } else if (filterMode === 'gross') {
      const activeEl = document.getElementById('boxFilterGross');
      if (activeEl) {
        activeEl.style.border = '2px solid #3b82f6';
        activeEl.style.background = 'rgba(59,130,246,0.12)';
      }
    }

    const searchInput = document.getElementById('modalItemsSearchInput');
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

    const thead = document.querySelector('#totalItemsSoldModal table thead');
    const tbody = document.getElementById('modalItemsSoldTableBody');
    if (!tbody) return;

    if (filterMode === 'returned') {
      // Returned Items Detailed View (Showing Product Name, Color, Size, Price, Qty Returned, Refund Amount)
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
      // Gross Sales View (Showing Gross, Returned, Net Breakdown)
      if (thead) {
        thead.innerHTML = `
          <tr>
            <th>পণ্যের নাম ও ভেরিয়েন্ট</th>
            <th>ক্যাটাগরি</th>
            <th>বিক্রয় ব্রেকডাউন (Gross/Ret/Net)</th>
            <th>একক বিক্রয় মূল্য</th>
            <th style="text-align: right;">সর্বমোট বিক্রয় টাকা</th>
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
            <td style="text-align: right; font-weight: 700; color: var(--accent-green);">৳${item.grossSubtotal.toFixed(2)}</td>
          </tr>
        `).join('');
      }

    } else {
      // Net Sales View (Default Box 1 - Showing Net Sold Items)
      if (thead) {
        thead.innerHTML = `
          <tr>
            <th>পণ্যের নাম ও ভেরিয়েন্ট</th>
            <th>ক্যাটাগরি</th>
            <th>সক্রিয় বিক্রির সংখ্যা (Net)</th>
            <th>একক মূল্য</th>
            <th style="text-align: right;">নিট বিক্রয় টাকা</th>
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
            <td>
              <strong style="color: #10b981; font-size: 1.05rem;">${item.netQty} টি</strong>
            </td>
            <td>৳${item.price.toFixed(2)}</td>
            <td style="text-align: right; font-weight: 800; color: #10b981;">৳${item.netSubtotal.toFixed(2)}</td>
          </tr>
        `).join('');
      }
    }
  }

  openNetProfitModal(defaultFilter = 'net') {
    this.currentProfitFilter = defaultFilter;
    const filteredSales = this.getFilteredSales();

    let totalNetSales = 0;
    let totalNetCost = 0;
    let totalGrossSales = 0;
    let totalGrossCost = 0;
    let totalReturnedRefund = 0;
    let totalReturnedCost = 0;
    let totalReturnedItemsCount = 0;

    const itemProfitsMap = {};
    const returnedProfitItemsList = [];

    filteredSales.forEach(sale => {
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
            const prod = this.products.find(p => p.id === item.id);
            itemProfitsMap[key] = {
              name: item.name,
              variant: variantLabel,
              category: (prod && prod.category) ? prod.category : (item.category || 'অন্যান্য'),
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
              category: (this.products.find(p => p.id === item.id)?.category) || item.category || 'অন্যান্য',
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

    filteredSales.forEach(s => {
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

    this.cachedProfitData = {
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
    const elNet = document.getElementById('modalProfitNetTotal');
    const elNetSub = document.getElementById('modalProfitTotalSalesSub');
    const elRet = document.getElementById('modalProfitReturnedTotal');
    const elRetSub = document.getElementById('modalProfitReturnedCountSub');
    const elGross = document.getElementById('modalProfitGrossTotal');
    const elGrossSub = document.getElementById('modalProfitGrossSalesSub');
    const elMargin = document.getElementById('modalProfitMarginPercent');
    const elHeaderDetail = document.getElementById('modalProfitHeaderDetail');

    if (elNet) elNet.innerText = `৳${finalAdjustedNetProfit.toFixed(2)}`;
    if (elNetSub) elNetSub.innerText = `(পণ্য মুনাফা ৳${grossProductProfit.toFixed(2)} ${netVatDiscAdjustment >= 0 ? '+' : ''}৳${netVatDiscAdjustment.toFixed(2)} ভ্যাট/ডিসকাউন্ট)`;

    if (elRet) elRet.innerText = `-৳${totalReturnedRefund.toFixed(2)}`;
    if (elRetSub) elRetSub.innerText = `(${totalReturnedItemsCount}টি রিটার্ন | রিস্টকড খরচ: ৳${totalReturnedCost.toFixed(2)})`;

    if (elGross) elGross.innerText = `৳${totalGrossProfit.toFixed(2)}`;
    if (elGrossSub) elGrossSub.innerText = `(গ্রস রিভেনিউ ৳${totalGrossSales.toFixed(2)})`;

    if (elMargin) elMargin.innerText = `${netMarginPct}%`;
    if (elHeaderDetail) elHeaderDetail.innerText = `(নিট রিভেনিউ ৳${totalNetSales.toFixed(2)} থেকে নিট কেনা খরচ ৳${totalNetCost.toFixed(2)} বাদ দিয়ে)`;

    const statusBadge = document.getElementById('modalProfitStatusBadge');
    if (statusBadge) {
      if (netMarginPct >= 20) {
        statusBadge.className = 'badge bg-green';
        statusBadge.innerText = 'চমৎকার প্রফিট মার্জিন (> 20%)';
      } else if (netMarginPct >= 10) {
        statusBadge.className = 'badge bg-blue';
        statusBadge.innerText = 'সন্তোষজনক মার্জিন (10%-20%)';
      } else {
        statusBadge.className = 'badge bg-orange';
        statusBadge.innerText = 'স্বল্প মার্জিন (< 10%)';
      }
    }

    const searchInput = document.getElementById('modalProfitSearchInput');
    if (searchInput) searchInput.value = '';

    this.renderNetProfitModalTable(defaultFilter);
    this.openModal('netProfitModal');
  }

  setNetProfitModalFilter(filterMode) {
    this.currentProfitFilter = filterMode;
    this.renderNetProfitModalTable(filterMode);
  }

  onNetProfitSearchInput() {
    this.renderNetProfitModalTable(this.currentProfitFilter || 'net');
  }

  onNetProfitSortChange() {
    this.renderNetProfitModalTable(this.currentProfitFilter || 'net');
  }

  renderNetProfitModalTable(filterMode = 'net') {
    const data = this.cachedProfitData;
    if (!data) return;

    // Update Box Styling
    ['profitBoxNet', 'profitBoxReturned', 'profitBoxGross'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.border = '1px solid var(--border-color)';
        el.style.background = 'var(--bg-card)';
      }
    });

    if (filterMode === 'net') {
      const activeEl = document.getElementById('profitBoxNet');
      if (activeEl) {
        activeEl.style.border = '2px solid #10b981';
        activeEl.style.background = 'rgba(16,185,129,0.12)';
      }
    } else if (filterMode === 'returned') {
      const activeEl = document.getElementById('profitBoxReturned');
      if (activeEl) {
        activeEl.style.border = '2px solid #ef4444';
        activeEl.style.background = 'rgba(239,68,68,0.12)';
      }
    } else if (filterMode === 'gross') {
      const activeEl = document.getElementById('profitBoxGross');
      if (activeEl) {
        activeEl.style.border = '2px solid #3b82f6';
        activeEl.style.background = 'rgba(59,130,246,0.12)';
      }
    }

    const searchInput = document.getElementById('modalProfitSearchInput');
    const sortSelect = document.getElementById('modalProfitSortSelect');
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const sortMode = sortSelect ? sortSelect.value : 'highest_profit';

    const thead = document.querySelector('#netProfitModal table thead');
    const tbody = document.getElementById('modalProfitTopItemsBody');
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

      if (sortMode === 'highest_profit') filtered.sort((a, b) => b.grossProfit - a.grossProfit);
      else if (sortMode === 'highest_qty') filtered.sort((a, b) => b.grossQty - a.grossQty);
      else if (sortMode === 'lowest_profit') filtered.sort((a, b) => a.grossProfit - b.grossProfit);

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

      if (sortMode === 'highest_profit') filtered.sort((a, b) => b.netProfit - a.netProfit);
      else if (sortMode === 'highest_qty') filtered.sort((a, b) => b.netQty - a.netQty);
      else if (sortMode === 'lowest_profit') filtered.sort((a, b) => a.netProfit - b.netProfit);

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

  openLowStockModal() {
    const lowStockItems = [];
    this.products.forEach(p => {
      if (p.variants && Array.isArray(p.variants)) {
        p.variants.forEach(v => {
          if (v.stock <= 10) {
            lowStockItems.push({
              productId: p.id,
              productName: p.name,
              category: p.category || 'General',
              sku: v.sku,
              barcode: v.barcode,
              color: v.color,
              size: v.size,
              stock: v.stock,
              image: p.image || ''
            });
          }
        });
      }
    });

    const tbody = document.getElementById('modalLowStockTableBody');
    if (tbody) {
      if (lowStockItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding: 2rem;"><i class="fa-solid fa-circle-check" style="font-size: 2rem; color: var(--accent-green); margin-bottom: 0.5rem; display: block;"></i>সব পণ্যের স্টক পর্যাপ্ত রয়েছে! কোনো স্টক অ্যালার্ট নেই।</td></tr>`;
      } else {
        tbody.innerHTML = lowStockItems.map(item => `
          <tr>
            <td><img src="${item.image || 'https://via.placeholder.com/40'}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover;"></td>
            <td>
              <strong>${item.productName}</strong>
              <div style="font-size: 0.78rem; color: var(--text-muted);">
                SKU: ${item.sku || 'N/A'} | বারকোড: ${item.barcode || 'N/A'}
                ${(item.color || item.size) ? `(${item.color || ''} ${item.size ? '/ ' + item.size : ''})` : ''}
              </div>
            </td>
            <td><span class="badge" style="background: rgba(59,130,246,0.15); color: #3b82f6;">${item.category}</span></td>
            <td>
              <span class="badge" style="background: rgba(239,68,68,0.2); color: #ef4444; border: 1px solid rgba(239,68,68,0.4); padding: 4px 10px; font-weight: 700;">
                <i class="fa-solid fa-triangle-exclamation"></i> ${item.stock} টি
              </span>
            </td>
            <td><small class="text-muted">১০ টি (ন্যূনতম)</small></td>
            <td style="text-align: right;">
              <button type="button" class="btn btn-sm btn-success btn-quick-restock-modal" data-id="${item.productId}">
                <i class="fa-solid fa-boxes-packing"></i> স্টক রিফিল
              </button>
            </td>
          </tr>
        `).join('');

        tbody.querySelectorAll('.btn-quick-restock-modal').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const prodId = parseInt(e.currentTarget.dataset.id);
            this.closeModal('lowStockDetailModal');
            this.openRestockModal(prodId);
          });
        });
      }
    }

    this.openModal('lowStockDetailModal');
  }

  openCustomerDueModal() {
    this.switchTab('adminCustomers');
    this.showToast('কাস্টমার বাকি ও বাকির হিসাব দেখতে কাস্টমার ট্যাবে নিয়ে যাওয়া হলো');
  }

  showReceiptModalById(id, isNewSale = false) {
    const sale = this.sales.find(s => s.id === id);
    if (!sale) return;

    const s = this.settings || JSON.parse(localStorage.getItem('pos_settings')) || {};
    const sym = s.currencySymbol || '৳';

    const logoImg = document.getElementById('rcptStoreLogoImg');
    const storeTitleEl = document.getElementById('rcptStoreTitle');
    const storeAddressEl = document.getElementById('rcptStoreAddress');
    const storePhoneEl = document.getElementById('rcptStorePhone');
    const storeEmailEl = document.getElementById('rcptStoreEmail');

    const logoSrc = s.invoiceLogo || s.storeLogo || '';
    const showLogo = s.showInvoiceLogo !== false && logoSrc;
    const showName = s.showInvoiceStoreName !== false;
    const showAddress = s.showInvoiceAddress !== false;
    const showPhone = s.showInvoicePhone !== false;
    const showEmail = s.showInvoiceEmail === true;

    if (logoImg) {
      if (showLogo) {
        logoImg.src = logoSrc;
        logoImg.style.display = 'block';
      } else {
        logoImg.style.display = 'none';
      }
    }

    if (storeTitleEl) {
      storeTitleEl.innerText = s.storeName || 'Super Shop Warehouse';
      storeTitleEl.style.display = showName ? 'block' : 'none';
    }

    if (storeAddressEl) {
      storeAddressEl.innerText = s.storeAddress || 'Mirpur 10, Dhaka - 1216';
      storeAddressEl.style.display = showAddress && s.storeAddress ? 'block' : 'none';
    }

    if (storePhoneEl) {
      storePhoneEl.innerText = `Mobile: ${s.storePhone || '+880 1700-000000'}`;
      storePhoneEl.style.display = showPhone && s.storePhone ? 'block' : 'none';
    }

    if (storeEmailEl) {
      storeEmailEl.innerText = `Email: ${s.storeEmail || ''}`;
      storeEmailEl.style.display = showEmail && s.storeEmail ? 'block' : 'none';
    }

    const footerNoteEl = document.querySelector('#printableReceipt .receipt-footer .thank-you');
    if (footerNoteEl) {
      footerNoteEl.innerText = s.receiptFooterNote || 'Thank you! Come again.';
      footerNoteEl.style.display = s.showInvoiceFooter !== false ? 'block' : 'none';
    }

    document.getElementById('rcptInvId').innerText = sale.id;
    document.getElementById('rcptDate').innerText = new Date(sale.timestamp).toLocaleString('en-US');
    document.getElementById('rcptCustomer').innerText = sale.customer || 'Walk-in Customer';

    const itemsBody = document.getElementById('rcptItemsBody');
    if (itemsBody && sale.items) {
      itemsBody.innerHTML = sale.items.map(i => `
        <tr>
          <td class="col-name">
            <span class="item-name">${i.name}</span>
            ${(i.color || i.size) ? `<small class="item-variant">(${i.color || ''} ${i.size ? '/ ' + i.size : ''})</small>` : ''}
          </td>
          <td class="col-qty text-center">${i.quantity} × ${sym}${i.price}</td>
          <td class="col-price text-right">${sym}${i.subtotal.toFixed(2)}</td>
        </tr>
      `).join('');
    }

    const subtotalEl = document.getElementById('rcptSubtotal');
    if (subtotalEl) subtotalEl.innerText = `${sym}${sale.subtotal.toFixed(2)}`;

    const discEl = document.getElementById('rcptDiscount');
    if (discEl) discEl.innerText = `-${sym}${sale.discount.toFixed(2)}`;

    const taxEl = document.getElementById('rcptTax');
    if (taxEl) taxEl.innerText = `+${sym}${sale.tax.toFixed(2)}`;

    const grandEl = document.getElementById('rcptGrandTotal');
    if (grandEl) grandEl.innerText = `${sym}${sale.grandTotal.toFixed(2)}`;

    const noteBox = document.getElementById('rcptOrderNoteBox');
    const orderNoteStr = (sale.orderNote || sale.note || '').trim();

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
      try {
        JsBarcode("#rcptBarcodeSvg", sale.id, { format: "CODE128", width: 1.8, height: 48, displayValue: true, fontSize: 13, fontOptions: "bold", font: "monospace", marginTop: 8, marginBottom: 8, marginLeft: 18, marginRight: 18, background: "#ffffff", lineColor: "#000000" });
      } catch(e) {}
    }

    this.openModal('adminReceiptModal');

    const paperEl = document.getElementById('printableReceipt');
    const container = paperEl ? paperEl.closest('.receipt-feed-container') : null;
    const scanline = container ? container.querySelector('.thermal-feed-scanline') : null;
    const statusIndicator = container ? container.querySelector('.slot-status-indicator') : null;
    const statusText = container ? container.querySelector('.slot-status-text') : null;

    if (isNewSale) {
      setTimeout(() => {
        this.playInModalReceiptPrint('printableReceipt', false);
      }, 200);
    } else {
      if (paperEl) {
        paperEl.style.transform = 'translateY(0)';
        paperEl.style.opacity = '1';
      }
      if (scanline) scanline.style.display = 'none';
      if (statusIndicator) statusIndicator.classList.remove('printing');
      if (statusText) statusText.innerText = 'Ready';
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

        if (window.confetti) {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        }
      }
    };

    requestAnimationFrame(step);
  }

  downloadReceiptPDF(receiptPaperId) {
    const paperEl = document.getElementById(receiptPaperId);
    if (!paperEl) return;

    const pdfBtn = document.getElementById('adminRcptDownloadPdfBtn');
    if (pdfBtn) {
      pdfBtn.disabled = true;
      pdfBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Downloading PDF...';
    }

    const invId = document.getElementById('rcptInvId')?.innerText || 'INV-000';

    if (typeof JsBarcode !== 'undefined') {
      try {
        JsBarcode("#rcptBarcodeSvg", invId, { format: "CODE128", width: 1.8, height: 48, displayValue: true, fontSize: 13, fontOptions: "bold", font: "monospace", marginTop: 8, marginBottom: 8, marginLeft: 18, marginRight: 18, background: "#ffffff", lineColor: "#000000" });
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

  updateSidebarStoreProfile() {
    const profileDiv = document.querySelector('.sidebar-footer .store-profile div');
    if (profileDiv && this.settings) {
      profileDiv.innerHTML = `
        <strong>${this.settings.storeName || 'Super Shop & Warehouse'}</strong>
        <small>Owner: ${this.settings.storeOwner || 'Md. Abdul Baqui'}</small>
      `;
    }
  }

  switchManageShopSubTab(tabName) {
    const btnPersonal = document.getElementById('btnShopTabPersonal');
    const btnBusiness = document.getElementById('btnShopTabBusiness');
    const contentPersonal = document.getElementById('shopTabPersonalContent');
    const contentBusiness = document.getElementById('shopTabBusinessContent');

    if (tabName === 'personal') {
      if (btnPersonal) {
        btnPersonal.classList.add('active');
        btnPersonal.style.background = 'var(--accent-blue)';
        btnPersonal.style.color = '#ffffff';
      }
      if (btnBusiness) {
        btnBusiness.classList.remove('active');
        btnBusiness.style.background = 'transparent';
        btnBusiness.style.color = 'var(--text-color)';
      }
      if (contentPersonal) contentPersonal.style.display = 'block';
      if (contentBusiness) contentBusiness.style.display = 'none';
    } else {
      if (btnBusiness) {
        btnBusiness.classList.add('active');
        btnBusiness.style.background = 'var(--accent-green)';
        btnBusiness.style.color = '#ffffff';
      }
      if (btnPersonal) {
        btnPersonal.classList.remove('active');
        btnPersonal.style.background = 'transparent';
        btnPersonal.style.color = 'var(--text-color)';
      }
      if (contentPersonal) contentPersonal.style.display = 'none';
      if (contentBusiness) contentBusiness.style.display = 'block';
    }
  }

  renderSettingsForm() {
    const s = this.settings || (typeof DEFAULT_SETTINGS !== 'undefined' ? DEFAULT_SETTINGS : {});
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined ? val : '';
    };

    // Owner Personal Information
    setVal('settingStoreOwner', s.storeOwner || 'Md. Abdul Baqui');
    setVal('settingPersonalPhone', s.personalPhone || s.storePhone || '+880 1700-000000');
    setVal('settingPersonalEmail', s.personalEmail || s.storeEmail || '');
    setVal('settingOwnerNID', s.ownerNID || '');
    setVal('settingOwnerNIDImage', s.ownerNIDImage || '');
    const nidPrev = document.getElementById('settingOwnerNIDPreview');
    if (nidPrev && s.ownerNIDImage) nidPrev.src = s.ownerNIDImage;
    setVal('settingOwnerAddress', s.ownerAddress || '');

    // Business & Brand Information
    setVal('settingStoreName', s.storeName || 'Super Shop Dhaka');
    setVal('settingStorePhone', s.storePhone || '+880 1700-000000');
    setVal('settingStoreEmail', s.storeEmail || 'dhaka.supershop@gmail.com');
    setVal('settingStoreAddress', s.storeAddress || 'Mirpur 10, Dhaka - 1216');
    setVal('settingTradeLicense', s.tradeLicense || '');
    setVal('settingStoreLogo', s.storeLogo || '');
    const logoPrev = document.getElementById('settingStoreLogoPreview');
    if (logoPrev && s.storeLogo) logoPrev.src = s.storeLogo;

    // Load Invoice & Barcode Print Customization Settings
    setVal('settingInvoiceLogo', s.invoiceLogo || s.storeLogo || '');
    const invLogoPrev = document.getElementById('settingInvoiceLogoPreview');
    if (invLogoPrev && (s.invoiceLogo || s.storeLogo)) invLogoPrev.src = s.invoiceLogo || s.storeLogo;

    const setChk = (id, checked) => {
      const el = document.getElementById(id);
      if (el) el.checked = !!checked;
    };

    setChk('settingShowInvoiceLogo', s.showInvoiceLogo !== false);
    setChk('settingShowInvoiceStoreName', s.showInvoiceStoreName !== false);
    setChk('settingShowInvoicePhone', s.showInvoicePhone !== false);
    setChk('settingShowInvoiceEmail', s.showInvoiceEmail === true);
    setChk('settingShowInvoiceAddress', s.showInvoiceAddress !== false);
    setChk('settingShowInvoiceFooter', s.showInvoiceFooter !== false);

    setVal('settingInvoiceHeaderNote', s.receiptHeaderNote || '');
    setVal('settingInvoiceFooterNote', s.receiptFooterNote || 'Thank you! Come again.');

    setVal('settingBarcodePaperFormat', s.barcodePaperFormat || 'sticker_38x25');
    setVal('settingBarcodeScale', s.barcodeScale || 'normal');
    setChk('settingBarcodeShowName', s.barcodeShowName !== false);
    setChk('settingBarcodeShowVariant', s.barcodeShowVariant !== false);
    setChk('settingBarcodeShowPrice', s.barcodeShowPrice !== false);

    setVal('settingDefaultDiscountMode', s.defaultDiscountMode || 'percent');
    setVal('settingDefaultDiscountValue', s.defaultDiscountValue !== undefined ? s.defaultDiscountValue : 0);
    setVal('settingDefaultTaxMode', s.defaultTaxMode || 'percent');
    setVal('settingDefaultTax', s.defaultTax !== undefined ? s.defaultTax : 0);
    setVal('settingCurrencySymbol', s.currencySymbol || '৳');
    setVal('settingReceiptHeader', s.receiptHeaderNote || 'Mirpur 10, Dhaka - 1216');
    setVal('settingCurrentAdminPin', '');
    setVal('settingNewAdminPin', '');
    setVal('settingConfirmAdminPin', '');
    setVal('settingDefaultTheme', s.defaultTheme || 'dark');

    // Update Forgot Password WhatsApp Link dynamically from Super Admin CMS
    try {
      const cms = JSON.parse(localStorage.getItem('pos_landing_cms')) || {};
      let rawWa = cms.whatsappNumber || cms.phone || cms.bkashNumber || '01700000000';
      let waNum = rawWa.replace(/[^0-9]/g, '');
      if (waNum.length === 11 && waNum.startsWith('01')) waNum = '88' + waNum;

      const storeNameStr = s.storeName || 'আমার স্টোর';
      document.querySelectorAll('a[href*="wa.me"]').forEach(btn => {
        btn.href = `https://wa.me/${waNum}?text=${encodeURIComponent('হ্যালো, আমার স্টোরের (' + storeNameStr + ') পাসওয়ার্ড ভুলে গেছি। রিসেট করতে সহায়তার প্রয়োজন।')}`;
      });
    } catch (e) {}

    // Load Custom Background Wallpaper Settings
    setVal('settingDesktopBg', s.customDesktopBg || '');
    setVal('settingMobileBg', s.customMobileBg || '');
    if (s.customDesktopBg && document.getElementById('settingDesktopBgPreview')) {
      document.getElementById('settingDesktopBgPreview').src = s.customDesktopBg;
    }
    if (s.customMobileBg && document.getElementById('settingMobileBgPreview')) {
      document.getElementById('settingMobileBgPreview').src = s.customMobileBg;
    }

    // Load payment gateways settings
    const gateways = JSON.parse(localStorage.getItem('pos_payment_gateways')) || (typeof DEFAULT_PAYMENT_GATEWAYS !== 'undefined' ? DEFAULT_PAYMENT_GATEWAYS : {});

    setChk('gwEnableBkash', gateways.bKash ? gateways.bKash.enabled !== false : true);
    setVal('gwNumBkash', gateways.bKash ? gateways.bKash.accountNumber : '01700-000000');
    setVal('gwNoteBkash', gateways.bKash ? gateways.bKash.instructions : 'bKash মার্চেন্ট বা পার্সোনাল নম্বরে পেমেন্ট করুন এবং TrxID দিন।');

    setChk('gwEnableNagad', gateways.Nagad ? gateways.Nagad.enabled !== false : true);
    setVal('gwNumNagad', gateways.Nagad ? gateways.Nagad.accountNumber : '01800-000000');
    setVal('gwNoteNagad', gateways.Nagad ? gateways.Nagad.instructions : 'Nagad নম্বরে ক্যাশইন/পেমেন্ট করুন এবং TrxID দিন।');

    setChk('gwEnableQR', gateways.QR ? gateways.QR.enabled !== false : true);
    setVal('gwNumQR', gateways.QR ? gateways.QR.accountNumber : 'SuperShop-BanglaQR');
    setVal('gwNoteQR', gateways.QR ? gateways.QR.instructions : 'কাউন্টারে টানানো বাংলা QR কোড স্ক্যান করে পেমেন্ট করুন।');

    setChk('gwEnableCard', gateways.Card ? gateways.Card.enabled !== false : true);
    setVal('gwNumCard', gateways.Card ? gateways.Card.accountNumber : 'POS Terminal #1');
    setVal('gwNoteCard', gateways.Card ? gateways.Card.instructions : 'কাউন্টার POS মেশিনে ডেবিট/ক্রেডিট কার্ড সোয়াইপ/ট্যাপ করুন।');
  }

  saveSettingsFromForm() {
    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };

    const getChk = (id) => {
      const el = document.getElementById(id);
      return el ? el.checked : false;
    };

    const updatedSettings = {
      storeName: getVal('settingStoreName') || 'Super Shop Dhaka',
      storeOwner: getVal('settingStoreOwner') || 'Md. Abdul Baqui',
      personalPhone: getVal('settingPersonalPhone') || getVal('settingStorePhone'),
      personalEmail: getVal('settingPersonalEmail') || getVal('settingStoreEmail'),
      ownerNID: getVal('settingOwnerNID'),
      ownerNIDImage: getVal('settingOwnerNIDImage'),
      ownerAddress: getVal('settingOwnerAddress'),
      storePhone: getVal('settingStorePhone') || '+880 1700-000000',
      storeEmail: getVal('settingStoreEmail'),
      storeAddress: getVal('settingStoreAddress') || 'Mirpur 10, Dhaka - 1216',
      tradeLicense: getVal('settingTradeLicense'),
      storeLogo: getVal('settingStoreLogo'),
      invoiceLogo: getVal('settingInvoiceLogo') || getVal('settingStoreLogo'),
      customDesktopBg: getVal('settingDesktopBg'),
      customMobileBg: getVal('settingMobileBg'),
      showInvoiceLogo: true,
      showInvoiceStoreName: true,
      showInvoicePhone: true,
      showInvoiceEmail: getChk('settingShowInvoiceEmail'),
      showInvoiceAddress: true,
      showInvoiceFooter: true,
      receiptHeaderNote: getVal('settingInvoiceHeaderNote') || getVal('settingReceiptHeader'),
      receiptFooterNote: getVal('settingInvoiceFooterNote') || getVal('settingReceiptFooter') || 'Thank you! Come again.',
      barcodePaperFormat: getVal('settingBarcodePaperFormat') || 'sticker_38x25',
      barcodeScale: getVal('settingBarcodeScale') || 'normal',
      barcodeShowName: true,
      barcodeShowVariant: true,
      barcodeShowPrice: true,
      defaultDiscountMode: getVal('settingDefaultDiscountMode') || 'percent',
      defaultDiscountValue: parseFloat(getVal('settingDefaultDiscountValue')) || 0,
      defaultTaxMode: getVal('settingDefaultTaxMode') || 'percent',
      defaultTax: parseFloat(getVal('settingDefaultTax')) || 0,
      currencySymbol: getVal('settingCurrencySymbol') || '৳',
      currencyCode: 'BDT',
      defaultTheme: getVal('settingDefaultTheme') || 'dark'
    };

    const activeStoreId = localStorage.getItem('pos_active_store_id') || 'store_demo_101';
    const tenantSettings = JSON.parse(localStorage.getItem(`pos_tenant_${activeStoreId}_pos_settings`)) || {};
    const activeSub = JSON.parse(localStorage.getItem('pos_subscription')) || {};
    const existingPin = String(activeSub.merchantPassword || activeSub.adminPin || tenantSettings.adminPin || this.settings.adminPin || '1234').trim();

    const currentPinInput = getVal('settingCurrentAdminPin');
    const newPinInput = getVal('settingNewAdminPin');
    const confirmPinInput = getVal('settingConfirmAdminPin');

    let finalPin = existingPin;
    let isPasswordChanged = false;

    // Check if user is attempting to change password
    if (currentPinInput || newPinInput || confirmPinInput) {
      if (!currentPinInput) {
        alert('⚠️ পাসওয়ার্ড পরিবর্তন করতে হলে আপনার বর্তমান (আগের) পাসওয়ার্ড দেওয়া আবশ্যক!');
        return;
      }
      if (currentPinInput !== existingPin) {
        alert('❌ বর্তমান সিকিউরিটি পাসওয়ার্ডটি সঠিক নয়! সঠিক আগের পাসওয়ার্ড লিখে পুনরায় চেষ্টা করুন।\n\n(ভুলে গেলে নিচে "হোয়াটসঅ্যাপে হেল্প নিন" বাটনে ক্লিক করে সহায়তার সুযোগ রয়েছে)');
        return;
      }
      if (!newPinInput || newPinInput.length < 4) {
        alert('⚠️ নতুন সিকিউরিটি পাসওয়ার্ডটি কমপক্ষে ৪ ডিজিট বা অক্ষরের হতে হবে!');
        return;
      }
      if (newPinInput !== confirmPinInput) {
        alert('❌ নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না! দুটো ঘরে হুবহু একই পাসওয়ার্ড লিখুন।');
        return;
      }

      finalPin = newPinInput;
      isPasswordChanged = true;
    }

    updatedSettings.adminPin = finalPin;
    updatedSettings.merchantPassword = finalPin;

    this.settings = updatedSettings;

    // Save strictly to tenant-isolated LocalStorage key
    localStorage.setItem(`pos_tenant_${activeStoreId}_pos_settings`, JSON.stringify(updatedSettings));
    localStorage.setItem('pos_settings', JSON.stringify(updatedSettings));
    localStorage.setItem('pos_theme', updatedSettings.defaultTheme);
    document.documentElement.setAttribute('data-theme', updatedSettings.defaultTheme);
    applyMerchantCustomWallpaper(updatedSettings);

    // Sync merchant password/pin to tenant master profile in pos_subscriptions & Firestore /subscriptions
    let allSubs = JSON.parse(localStorage.getItem('pos_subscriptions')) || [];
    const subIdx = allSubs.findIndex(s => s.storeId === activeStoreId || s.id === activeStoreId);
    if (subIdx >= 0) {
      allSubs[subIdx].adminPin = updatedSettings.adminPin;
      allSubs[subIdx].merchantPassword = updatedSettings.adminPin;
      localStorage.setItem('pos_subscriptions', JSON.stringify(allSubs));

      if (window.POS_FIREBASE && window.POS_FIREBASE.db) {
        try {
          window.POS_FIREBASE.db.collection('subscriptions').doc(activeStoreId).set({
            adminPin: updatedSettings.adminPin,
            merchantPassword: updatedSettings.adminPin
          }, { merge: true });
        } catch (e) {}
      }
    }

    const paymentGateways = {
      bKash: {
        enabled: getChk('gwEnableBkash'),
        accountNumber: getVal('gwNumBkash'),
        instructions: getVal('gwNoteBkash')
      },
      Nagad: {
        enabled: getChk('gwEnableNagad'),
        accountNumber: getVal('gwNumNagad'),
        instructions: getVal('gwNoteNagad')
      },
      QR: {
        enabled: getChk('gwEnableQR'),
        accountNumber: getVal('gwNumQR'),
        instructions: getVal('gwNoteQR')
      },
      Card: {
        enabled: getChk('gwEnableCard'),
        accountNumber: getVal('gwNumCard'),
        instructions: getVal('gwNoteCard')
      }
    };

    localStorage.setItem('pos_payment_gateways', JSON.stringify(paymentGateways));
    this.updateSidebarStoreProfile();
    const currentInput = document.getElementById('settingCurrentAdminPin');
    const newInput = document.getElementById('settingNewAdminPin');
    const confirmInput = document.getElementById('settingConfirmAdminPin');
    if (currentInput) currentInput.value = '';
    if (newInput) newInput.value = '';
    if (confirmInput) confirmInput.value = '';

    if (isPasswordChanged) {
      alert('🎉 সিকিউরিটি পিন / পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!');
    }
    this.showToast('দোকানের সেটিংস সফলভাবে সেভ হয়েছে!');
  }

  switchSettingsSubTab(subTabId) {
    document.querySelectorAll('.settings-subtab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.subtab === subTabId);
    });

    document.querySelectorAll('.settings-subpanel').forEach(panel => {
      const isActive = panel.id === subTabId;
      panel.classList.toggle('active', isActive);
      panel.style.display = isActive ? 'block' : 'none';
    });
  }

  renderCoupons() {
    const tbody = document.getElementById('couponsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    this.coupons = JSON.parse(localStorage.getItem('pos_coupons')) || (typeof INITIAL_COUPONS !== 'undefined' ? INITIAL_COUPONS : []);

    if (this.coupons.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
            কোনো কুপন যোগ করা হয়নি। "নতুন কুপন যুক্ত করুন" বাটনে ক্লিক করে কুপন তৈরি করুন।
          </td>
        </tr>
      `;
      return;
    }

    this.coupons.forEach(coupon => {
      const tr = document.createElement('tr');
      const discText = coupon.discountType === 'percent' ? `${coupon.discountValue}% ছাড়` : `৳${coupon.discountValue} ছাড়`;
      const minOrderText = coupon.minOrder > 0 ? `৳${coupon.minOrder}` : 'প্রযোজ্য নয়';
      const isActive = coupon.status === 'active';
      const statusBadge = isActive
        ? `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-green);">সক্রিয়</span>`
        : `<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: var(--accent-red);">নিষ্ক্রিয়</span>`;

      tr.innerHTML = `
        <td><strong style="color: var(--accent-blue); letter-spacing: 0.5px;">${coupon.code}</strong> ${coupon.note ? `<small class="text-muted display-block">${coupon.note}</small>` : ''}</td>
        <td>${discText}</td>
        <td>${minOrderText}</td>
        <td>${statusBadge}</td>
        <td style="text-align: right;">
          <button class="btn btn-xs btn-outline btn-toggle-coupon" data-id="${coupon.id}" style="margin-right: 4px;" title="স্ট্যাটাস পরিবর্তন করুন">
            <i class="fa-solid fa-power-off"></i> ${isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
          </button>
          <button class="btn btn-xs btn-outline btn-edit-coupon" data-id="${coupon.id}" style="margin-right: 4px;" title="এডিট করুন">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn btn-xs btn-outline btn-delete-coupon" data-id="${coupon.id}" style="border-color: var(--accent-red); color: var(--accent-red);" title="মুছে ফেলুন">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-toggle-coupon').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.toggleCouponStatus(id);
      });
    });

    tbody.querySelectorAll('.btn-edit-coupon').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.openCouponModal(id);
      });
    });

    tbody.querySelectorAll('.btn-delete-coupon').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.deleteCoupon(id);
      });
    });
  }

  openCouponModal(couponId = null) {
    const modal = document.getElementById('couponModal');
    const form = document.getElementById('couponForm');
    const title = document.getElementById('couponModalTitle');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('couponFormId').value = '';

    if (couponId) {
      const coupon = this.coupons.find(c => c.id === couponId);
      if (coupon) {
        title.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> কুপন এডিট করুন`;
        document.getElementById('couponFormId').value = coupon.id;
        document.getElementById('couponFormCode').value = coupon.code;
        document.getElementById('couponFormType').value = coupon.discountType;
        document.getElementById('couponFormValue').value = coupon.discountValue;
        document.getElementById('couponFormMinOrder').value = coupon.minOrder || 0;
        document.getElementById('couponFormStatus').value = coupon.status;
        document.getElementById('couponFormNote').value = coupon.note || '';
      }
    } else {
      title.innerHTML = `<i class="fa-solid fa-ticket"></i> নতুন কুপন যুক্ত করুন`;
    }

    modal.classList.add('active');
  }

  saveCouponFromForm() {
    const id = document.getElementById('couponFormId').value;
    const code = document.getElementById('couponFormCode').value.trim().toUpperCase();
    const discountType = document.getElementById('couponFormType').value;
    const discountValue = parseFloat(document.getElementById('couponFormValue').value) || 0;
    const minOrder = parseFloat(document.getElementById('couponFormMinOrder').value) || 0;
    const status = document.getElementById('couponFormStatus').value;
    const note = document.getElementById('couponFormNote').value.trim();

    if (!code) {
      alert('কুপন কোড ইনপুট দিন!');
      return;
    }

    const existing = this.coupons.find(c => c.code.toUpperCase() === code && c.id !== id);
    if (existing) {
      alert(`'${code}' কোড দিয়ে একটি কুপন ইতিপূর্বে তৈরি করা হয়েছে! অন্য কোড ব্যবহার করুন।`);
      return;
    }

    if (id) {
      const coupon = this.coupons.find(c => c.id === id);
      if (coupon) {
        coupon.code = code;
        coupon.discountType = discountType;
        coupon.discountValue = discountValue;
        coupon.minOrder = minOrder;
        coupon.status = status;
        coupon.note = note;
      }
    } else {
      const newCoupon = {
        id: 'CPN-' + Date.now(),
        code,
        discountType,
        discountValue,
        minOrder,
        status,
        note
      };
      this.coupons.push(newCoupon);
    }

    localStorage.setItem('pos_coupons', JSON.stringify(this.coupons));
    this.renderCoupons();

    const modal = document.getElementById('couponModal');
    if (modal) modal.classList.remove('active');

    this.showToast('কুপন তথ্য সফলভাবে সেভ হয়েছে!');
  }

  toggleCouponStatus(id) {
    const coupon = this.coupons.find(c => c.id === id);
    if (coupon) {
      coupon.status = coupon.status === 'active' ? 'inactive' : 'active';
      localStorage.setItem('pos_coupons', JSON.stringify(this.coupons));
      this.renderCoupons();
      this.showToast(`কুপন '${coupon.code}' এর স্ট্যাটাস আপডেট করা হয়েছে!`);
    }
  }

  deleteCoupon(id) {
    const coupon = this.coupons.find(c => c.id === id);
    if (coupon && confirm(`আপনি কি নিশ্চিত যে '${coupon.code}' কুপনটি ডিলিট করতে চান?`)) {
      this.coupons = this.coupons.filter(c => c.id !== id);
      localStorage.setItem('pos_coupons', JSON.stringify(this.coupons));
      this.renderCoupons();
      this.showToast(`কুপন '${coupon.code}' ডিলিট করা হয়েছে!`);
    }
  }

  isGuestSale(s) {
    if (!s) return false;
    if (s.customerId === 'GUEST') return true;
    if (s.customerPhone && String(s.customerPhone).trim() !== '') return false;
    const nameLower = (s.customer || s.customerName || '').toLowerCase().trim();
    if (!nameLower || nameLower === 'walk-in customer' || nameLower === 'walk-in' || nameLower === 'guest' || nameLower === 'n/a') return true;
    return !s.customerPhone;
  }

  // CUSTOMER MANAGEMENT METHODS
  renderAdminCustomers() {
    this.customers = JSON.parse(localStorage.getItem('pos_customers')) || (typeof INITIAL_CUSTOMERS !== 'undefined' ? INITIAL_CUSTOMERS : []);
    this.sales = JSON.parse(localStorage.getItem('pos_sales')) || (typeof INITIAL_SALES !== 'undefined' ? INITIAL_SALES : []);

    const countEl = document.getElementById('custStatTotalCount');
    const ordersEl = document.getElementById('custStatTotalOrders');
    const spentEl = document.getElementById('custStatTotalSpent');
    const badgeEl = document.getElementById('custTableCountBadge');
    const tbody = document.getElementById('adminCustomersTableBody');
    const searchVal = (document.getElementById('custSearchInput')?.value || '').toLowerCase().trim();

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

    if (badgeEl) badgeEl.innerText = `মোট ${filtered.length + (showGuest ? 1 : 0)} জন (গেস্ট অন্তর্ভুক্ত)`;

    if (!tbody) return;

    let html = '';

    if (showGuest) {
      html += `
        <tr onclick="adminApp.viewCustomerOrders('GUEST')" style="cursor: pointer; background: rgba(245, 158, 11, 0.08); border-left: 4px solid #f59e0b;" title="অনিবন্ধিত গেস্ট ও ওয়াক-ইন কাস্টমারদের কেনাকাটার বিস্তারিত দেখুন">
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
          <td><small class="text-muted">সিস্টেম মেম্বার</small></td>
          <td style="text-align: right;" onclick="event.stopPropagation();">
            <button type="button" class="btn btn-sm btn-warning" onclick="adminApp.viewCustomerOrders('GUEST')" title="গেস্ট ইনভয়েস ও মেমো দেখুন">
              <i class="fa-solid fa-id-card"></i> গেস্ট বিবরণী
            </button>
          </td>
        </tr>
      `;
    }

    if (filtered.length === 0 && !showGuest) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center py-4 text-muted">
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
        <tr onclick="adminApp.viewCustomerOrders('${c.id}')" style="cursor: pointer;" title="কাস্টমার প্রোফাইল ও কেনাকাটার বিবরণ দেখুন">
          <td><strong style="color: var(--accent-blue);">${c.id || 'CUST'}</strong></td>
          <td><strong style="color: var(--text-main);">${c.name}</strong> ${statusBadge}</td>
          <td><span class="badge" style="background: rgba(59, 130, 246, 0.15); color: var(--accent-blue);"><i class="fa-solid fa-phone"></i> ${c.phone}</span></td>
          <td>${c.email || '<span class="text-muted">N/A</span>'}</td>
          <td>${c.address || '<span class="text-muted">N/A</span>'}</td>
          <td><span class="badge" style="background: rgba(139, 92, 246, 0.15); color: var(--accent-purple);">${c.totalOrders || 0} টি অর্ডার</span></td>
          <td><strong style="color: var(--accent-green);">৳${(c.totalSpent || 0).toFixed(2)}</strong></td>
          <td><small class="text-muted">${c.createdAt || 'N/A'}</small></td>
          <td style="text-align: right;" onclick="event.stopPropagation();">
            <div style="display: inline-flex; gap: 4px;">
              <button type="button" class="btn btn-sm btn-outline" onclick="adminApp.viewCustomerOrders('${c.id}')" title="কেনাকাটার ইতিহাস ও প্রডাক্ট বিবরণ">
                <i class="fa-solid fa-id-card"></i>
              </button>
              <button type="button" class="btn btn-sm btn-primary" onclick="adminApp.openCustomerModal('${c.id}')" title="এডিট">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              ${isBlocked ? `
                <button type="button" class="btn btn-sm btn-success" onclick="adminApp.toggleBlockCustomer('${c.id}')" title="আনব্লক করুন">
                  <i class="fa-solid fa-user-check"></i> আনব্লক
                </button>
              ` : `
                <button type="button" class="btn btn-sm btn-warning" onclick="adminApp.toggleBlockCustomer('${c.id}')" title="ব্লক করুন">
                  <i class="fa-solid fa-user-slash"></i> ব্লক
                </button>
              `}
              <button type="button" class="btn btn-sm btn-danger" onclick="adminApp.deleteCustomer('${c.id}')" title="ডিলিট">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.innerHTML = html;
  }

  toggleBlockCustomer(id) {
    this.customers = JSON.parse(localStorage.getItem('pos_customers')) || (typeof INITIAL_CUSTOMERS !== 'undefined' ? INITIAL_CUSTOMERS : []);
    const c = this.customers.find(x => x.id === id);
    if (!c) return;

    if (c.status === 'blocked') {
      c.status = 'active';
      this.showToast(`কাস্টমার '${c.name}' সফলভাবে আনব্লক করা হয়েছে!`);
    } else {
      if (confirm(`আপনি কি নিশ্চিত যে কাস্টমার '${c.name}' কে ব্লক করতে চান?\nব্লক করার পর ক্যাশিয়ার কাউন্টারে উনার লেনদেন স্থগিত থাকবে।`)) {
        c.status = 'blocked';
        this.showToast(`কাস্টমার '${c.name}' কে ব্লক করা হয়েছে!`, 'error');
      } else {
        return;
      }
    }

    localStorage.setItem('pos_customers', JSON.stringify(this.customers));
    this.broadcastStateChange('customers');
    this.renderAdminCustomers();
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
    const memosTab = document.getElementById('adminCustMemosTabContent');
    const productsTab = document.getElementById('adminCustProductsTabContent');
    const memosBtn = document.getElementById('adminTabMemosBtn');
    const productsBtn = document.getElementById('adminTabProductsBtn');

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
    const modal = document.getElementById('customerOrdersModal');
    if (!modal) return;

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

    // Deep multi-criteria sales matching
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

    // Auto-bind unlinked sales to this customer ID & sync totals
    if (c && custSales.length > 0) {
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
        this.renderAdminCustomers();
      }
    }

    // Aggregate Products Purchased ("কী কী অর্ডার করেছে")
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
    const headerInfo = document.getElementById('custOrdersModalHeaderInfo');
    if (headerInfo) {
      const firstChar = (custName || 'C').charAt(0).toUpperCase();
      headerInfo.innerHTML = `
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

    // Render Memos List
    const memosContainer = document.getElementById('adminCustMemosContainer');
    if (memosContainer) {
      if (custSales.length === 0) {
        memosContainer.innerHTML = `<div class="text-center py-4 text-muted"><i class="fa-solid fa-receipt mb-2" style="font-size: 2rem; color: var(--text-muted);"></i><p>এই কাস্টমারের কোনো কেনাকাটার মেমো পাওয়া যায়নি</p></div>`;
      } else {
        memosContainer.innerHTML = custSales.map(s => {
          const formattedDate = s.date || new Date(s.timestamp || Date.now()).toLocaleString('bn-BD');
          const itemsList = s.items || [];
          const badgeInfo = this.getPaymentBadge(s);
          return `
            <div class="cust-memo-card">
              <div class="cust-memo-header">
                <div>
                  <strong style="color: var(--accent-blue); font-size: 1rem;">${s.id}</strong>
                  <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 0.5rem;"><i class="fa-regular fa-clock"></i> ${formattedDate}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <span class="badge" style="background: ${badgeInfo.bg}; color: ${badgeInfo.color}; font-weight:700;">${badgeInfo.label}</span>
                  <strong style="color: var(--accent-green); font-size: 1.05rem;">৳${(s.grandTotal || 0).toFixed(2)}</strong>
                  <button type="button" class="btn btn-sm btn-outline" onclick="adminApp.viewSaleDetails('${s.id}')" title="মেমো দেখুন / প্রিন্ট করুন">
                    <i class="fa-solid fa-file-invoice"></i> মেমো দেখুন
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
    const productsTbody = document.getElementById('adminCustProductsTableBody');
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

    this.switchCustProfileTab('memos');
    this.openModal('customerOrdersModal');
  }

  viewSaleDetails(saleId) {
    this.sales = JSON.parse(localStorage.getItem('pos_sales')) || (typeof INITIAL_SALES !== 'undefined' ? INITIAL_SALES : []);
    const s = this.sales.find(x => x.id === saleId);
    if (!s) {
      alert('মেমো রেকর্ড পাওয়া যায়নি!');
      return;
    }

    const itemsStr = (s.items || []).map(i => `• ${i.name} (${[i.color, i.size].filter(Boolean).join('/') || 'Standard'}) - ${i.quantity} পিস × ৳${i.price} = ৳${i.subtotal || (i.price * i.quantity)}`).join('\n');
    alert(`📄 ইনভয়েস মেমো: ${s.id}\n📅 তারিখ: ${s.date || new Date(s.timestamp || Date.now()).toLocaleString('bn-BD')}\n👤 কাস্টমার: ${s.customer || 'Walk-in'}\n📞 ফোন: ${s.customerPhone || 'N/A'}\n💳 পেমেন্ট মেথড: ${s.paymentMethod || 'CASH'}\n💰 মোট বিল: ৳${(s.grandTotal || 0).toFixed(2)}\n\n📦 ক্রয়কৃত পণ্য তালিকা:\n${itemsStr}`);
  }

  openCustomerModal(customerId = null) {
    const modal = document.getElementById('customerModal');
    const titleEl = document.getElementById('customerModalTitle');
    const formId = document.getElementById('custFormId');
    const firstNameInput = document.getElementById('custFormFirstName');
    const lastNameInput = document.getElementById('custFormLastName');
    const phoneInput = document.getElementById('custFormPhone');
    const emailInput = document.getElementById('custFormEmail');
    const addressInput = document.getElementById('custFormAddress');
    const statusInput = document.getElementById('custFormStatus');

    if (customerId) {
      const c = this.customers.find(x => x.id === customerId);
      if (c) {
        if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-user-pen"></i> কাস্টমার প্রোফাইল আপডেট`;
        if (formId) formId.value = c.id;
        const nameParts = (c.name || '').split(' ');
        if (firstNameInput) firstNameInput.value = c.firstName || nameParts[0] || '';
        if (lastNameInput) lastNameInput.value = c.lastName || nameParts.slice(1).join(' ') || '';
        if (phoneInput) phoneInput.value = c.phone || '';
        if (emailInput) emailInput.value = c.email || '';
        if (addressInput) addressInput.value = c.address || '';
        if (statusInput) statusInput.value = c.status || 'active';
      }
    } else {
      if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-user-plus"></i> নতুন কাস্টমার প্রোফাইল এন্ট্রি`;
      if (formId) formId.value = '';
      if (firstNameInput) firstNameInput.value = '';
      if (lastNameInput) lastNameInput.value = '';
      if (phoneInput) phoneInput.value = '';
      if (emailInput) emailInput.value = '';
      if (addressInput) addressInput.value = '';
      if (statusInput) statusInput.value = 'active';
    }

    if (modal) modal.classList.add('active');
  }

  saveCustomerFromForm() {
    const formId = document.getElementById('custFormId')?.value;
    const firstName = document.getElementById('custFormFirstName')?.value.trim() || '';
    const lastName = document.getElementById('custFormLastName')?.value.trim() || '';
    const name = `${firstName} ${lastName}`.trim();
    const phone = document.getElementById('custFormPhone')?.value.trim() || '';
    const email = document.getElementById('custFormEmail')?.value.trim() || '';
    const address = document.getElementById('custFormAddress')?.value.trim() || '';
    const status = document.getElementById('custFormStatus')?.value || 'active';

    if (!firstName && !name) {
      alert('কাস্টমারের ফার্স্ট নেম দেওয়া বাধ্যতামূলক!');
      return;
    }

    if (phone && phone.length !== 11) {
      alert('ফোন নম্বর অবশ্যই ১১ ডিজিটের হতে হবে (যেমন: 01700000000)!');
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা দিন (যেমন: customer@gmail.com)!');
      return;
    }

    const existing = this.customers.find(c => c.phone === phone && phone !== '' && c.id !== formId);
    if (existing) {
      alert(`এই ফোন নম্বরটি (${phone}) ইতোমধ্যেই '${existing.name}' এর প্রোফাইলে নিবন্ধিত আছে!`);
      return;
    }

    if (formId) {
      const c = this.customers.find(x => x.id === formId);
      if (c) {
        c.firstName = firstName;
        c.lastName = lastName;
        c.name = name;
        c.phone = phone;
        c.email = email;
        c.address = address;
        c.status = status;
      }
    } else {
      const newCust = {
        id: `CUST-${Date.now().toString().slice(-4)}`,
        firstName,
        lastName,
        name,
        phone,
        email,
        address,
        status,
        totalOrders: 0,
        totalSpent: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };
      this.customers.unshift(newCust);
    }

    localStorage.setItem('pos_customers', JSON.stringify(this.customers));
    this.broadcastStateChange('customers');
    document.getElementById('customerModal')?.classList.remove('active');
    this.renderAdminCustomers();
    this.showToast('কাস্টমার প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে!');
  }

  broadcastStateChange(type) {
    try {
      if (!this.stateChannel) this.stateChannel = new BroadcastChannel('pos_state_sync');
      this.stateChannel.postMessage({ type: `${type}_updated`, timestamp: Date.now() });
    } catch (e) {}
  }

  deleteCustomer(id) {
    const c = this.customers.find(x => x.id === id);
    if (!c) return;
    if (confirm(`আপনি কি নিশ্চিত যে কাস্টমার '${c.name}' এর প্রোফাইল ডিলিট করতে চান?`)) {
      this.customers = this.customers.filter(x => x.id !== id);
      localStorage.setItem('pos_customers', JSON.stringify(this.customers));
      this.broadcastStateChange('customers');
      this.renderAdminCustomers();
      this.showToast('কাস্টমার প্রোফাইল রিমুভ করা হয়েছে!', 'error');
    }
  }

  // INTERACTIVE DATE RANGE CALENDAR PICKER ENGINE (SHOPIFY / GA DESIGN MATCH)
  initDatePicker() {
    const triggerBtn = document.getElementById('openCustomDateRangeModalBtn');
    const closeBtn = document.getElementById('closeDateRangeModalBtn');
    const prevBtn = document.getElementById('calPrevMonthBtn');
    const nextBtn = document.getElementById('calNextMonthBtn');
    const applyBtn = document.getElementById('applyDateRangeBtn');
    const dateSelect = document.getElementById('adminDateFilterSelect');

    this.populateMonthYearDropdowns();
    this.applyPresetRange(this.currentDateFilter || 'today');

    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => {
        this.openModal('dateRangePickerModal');
        this.syncPresetsRadioUI();
        this.renderCalendarGrid();
      });
    }

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
          this.renderDashboard();
          this.showToast(`সময়কাল ফিল্টার ফিল্টার পরিবর্তন করা হলো: ${e.target.options[e.target.selectedIndex].text}`);
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
        this.renderDashboard();
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
    const btnText = document.getElementById('customDateRangeBtnText');
    if (!btnText) return;

    if (this.currentDateFilter === 'custom' && this.customStartDate && this.customEndDate) {
      if (this.customStartDate === this.customEndDate) {
        btnText.innerText = this.formatShortDate(this.customStartDate);
      } else {
        btnText.innerText = `${this.formatShortDate(this.customStartDate)} – ${this.formatShortDate(this.customEndDate)}`;
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
      btnText.innerText = map[this.currentDateFilter] || 'Today';
    }
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
}

let adminApp;
let admin;

function initAdminApp() {
  if (window._adminAppInitialized) return;
  window._adminAppInitialized = true;

  try {
    adminApp = new AdminPanel();
    admin = adminApp;
    window.adminApp = adminApp;
    window.admin = adminApp;

    // Global listener for Customer Forms and Actions
    document.getElementById('adminAddNewCustomerBtn')?.addEventListener('click', () => adminApp?.openCustomerModal());
    document.getElementById('customerForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      adminApp?.saveCustomerFromForm();
    });
    document.getElementById('custSearchInput')?.addEventListener('input', () => adminApp?.renderAdminCustomers());

    // Listen for storage events across tabs / PWA windows
    window.addEventListener('storage', (e) => {
      if (e.key === 'pos_active_store_id' || e.key === 'pos_session_logged_in' || e.key === 'pos_settings') {
        if (typeof adminApp?.renderAdminDashboard === 'function') {
          adminApp.renderAdminDashboard();
        }
      }
    });
  } catch (err) {
    console.error('[Admin Panel Initializer Error]:', err);
  }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initAdminApp();
} else {
  document.addEventListener('DOMContentLoaded', initAdminApp);
}


