// Smart POS - Cashier Terminal Logic (Restricted Storefront & Variant Sales Interface)

class CashierTerminal {
  constructor() {
    const isRegisteredStore = !!localStorage.getItem('pos_active_store_id');
    this.products = JSON.parse(localStorage.getItem('pos_products')) || (isRegisteredStore ? [] : (typeof INITIAL_PRODUCTS !== 'undefined' ? INITIAL_PRODUCTS : []));
    this.sales = JSON.parse(localStorage.getItem('pos_sales')) || (isRegisteredStore ? [] : (typeof INITIAL_SALES !== 'undefined' ? INITIAL_SALES : []));
    this.settings = JSON.parse(localStorage.getItem('pos_settings')) || (typeof DEFAULT_SETTINGS !== 'undefined' ? DEFAULT_SETTINGS : {});
    if (this.settings) {
      // Only fill in defaults if values are completely missing — do NOT override existing Bengali store names
      if (!this.settings.storeName) this.settings.storeName = 'My Shop';
      if (!this.settings.storeAddress) this.settings.storeAddress = 'Dhaka, Bangladesh';
      if (!this.settings.receiptFooterNote) this.settings.receiptFooterNote = 'Thank you! Come again.';
      localStorage.setItem('pos_settings', JSON.stringify(this.settings));
    }
    this.cart = [];
    this.coupons = JSON.parse(localStorage.getItem('pos_coupons')) || (isRegisteredStore ? [] : (typeof INITIAL_COUPONS !== 'undefined' ? INITIAL_COUPONS : []));
    this.customers = JSON.parse(localStorage.getItem('pos_customers')) || (isRegisteredStore ? [] : (typeof INITIAL_CUSTOMERS !== 'undefined' ? INITIAL_CUSTOMERS : []));
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
    this.activeTab = 'cashierDashboardView';
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
    this.initEventListeners();
    this.initLiveClock();
    this.initDatePicker();
    this.renderDashboardView();
    this.renderProducts();
    this.updateDiscountTaxUI();
    this.populateCustomerSelect();
    this.setupCustomerLookupInModals();
    this.setupCartCustomerEvents();
    this.renderCart();
    this.renderShiftSales();
    this.renderCashierCustomers();
    this.setupHardwareScanner();
    this.setupBarcodePanel();
    this.renderQuickBarcodeChips();
    this.setupMobileSidebar();
    this.updateSidebarStoreBranding();

    // Listen for storage changes from Admin panel in real-time
    window.addEventListener('storage', () => {
      const isRegistered = !!localStorage.getItem('pos_active_store_id');
      this.products = JSON.parse(localStorage.getItem('pos_products')) || (isRegistered ? [] : (typeof INITIAL_PRODUCTS !== 'undefined' ? INITIAL_PRODUCTS : []));
      this.sales = JSON.parse(localStorage.getItem('pos_sales')) || (isRegistered ? [] : (typeof INITIAL_SALES !== 'undefined' ? INITIAL_SALES : []));
      this.settings = JSON.parse(localStorage.getItem('pos_settings')) || (typeof DEFAULT_SETTINGS !== 'undefined' ? DEFAULT_SETTINGS : {});
      this.customers = JSON.parse(localStorage.getItem('pos_customers')) || (isRegistered ? [] : (typeof INITIAL_CUSTOMERS !== 'undefined' ? INITIAL_CUSTOMERS : []));
      this.discountType = this.settings.defaultDiscountMode || 'percent';
      this.discountValue = this.settings.defaultDiscountValue !== undefined ? parseFloat(this.settings.defaultDiscountValue) || 0 : 0;
      this.taxType = this.settings.defaultTaxMode || 'percent';
      this.taxValue = this.settings.defaultTax !== undefined ? parseFloat(this.settings.defaultTax) || 0 : 0;
      this.updateDiscountTaxUI();
      this.populateCustomerSelect();
      this.renderCart();
      if (this.activeTab === 'cashierDashboardView') this.renderDashboardView();
      else if (this.activeTab === 'cashierTerminalView') this.renderProducts();
      else if (this.activeTab === 'cashierAnalyticsView') this.renderAnalyticsView();
      else if (this.activeTab === 'cashierShiftView') this.renderShiftSales();
      else if (this.activeTab === 'cashierCustomersView') this.renderCashierCustomers();
      this.renderQuickBarcodeChips();
    });

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
    const s = this.settings || {};
    const storeNameEl = document.getElementById('cashierSidebarStoreName');
    const cashierNameEl = document.getElementById('cashierNameDisplay');
    const shiftEl = document.getElementById('cashierShiftDisplay');
    if (storeNameEl && s.storeName) storeNameEl.textContent = s.storeName;
    if (cashierNameEl) cashierNameEl.textContent = s.cashierName || 'ক্যাশিয়ার টার্মিনাল';
    if (shiftEl) {
      const now = new Date();
      const shiftId = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
      shiftEl.textContent = `শিফট: ${shiftId}`;
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

  // Handle Scanned Barcode Logic (Matches exact or fuzzy variant barcode)
  handleBarcodeScan(barcodeStr) {
    if (!barcodeStr) return;
    const cleanStr = String(barcodeStr).trim();
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
      this.addVariantToCart(foundProd, foundVar);
      this.playAudioBeep('scan');
      this.showToast(`স্ক্যান সফল: ${foundProd.name} (${foundVar.color}/${foundVar.size}) - ৳${foundVar.price}`);
      this.highlightCartItem(foundVar.variantId);
      
      const barInput = document.getElementById('barcodeScanInput');
      if (barInput) {
        barInput.value = '';
        barInput.focus();
      }
    } else {
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
    const searchVal = document.getElementById('productSearchInput').value.toLowerCase().trim();

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
          <div class="product-img-wrap">
            <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'><rect width=\'100\' height=\'100\' fill=\'%231e293b\'/><text x=\'50%\' y=\'50%\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%2394a3b8\' font-family=\'sans-serif\' font-size=\'12\'>No Image</text></svg>'">
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

    if (custSelect) custSelect.value = 'Walk-in Customer';
    if (cartPhone) cartPhone.value = '';
    if (cartName) cartName.value = '';
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
      discInput.value = this.discountValue;
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
      taxInput.value = this.taxValue;
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

  renderCart() {
    const cartList = document.getElementById('cartItemsList');
    const badge = document.getElementById('cartCountBadge');
    const totalItems = this.cart.reduce((sum, i) => sum + i.quantity, 0);
    badge.innerText = `${totalItems} আইটেম`;

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

    const totals = this.getCartTotals();
    document.getElementById('cartSubtotal').innerText = `৳${totals.subtotal.toFixed(2)}`;
    document.getElementById('cartGrandTotal').innerText = `৳${totals.grandTotal.toFixed(2)}`;

    const mobileCartCount = document.getElementById('mobileCartCount');
    const mobileCartTotal = document.getElementById('mobileCartTotal');
    if (mobileCartCount) mobileCartCount.innerText = totalItems;
    if (mobileCartTotal) mobileCartTotal.innerText = `৳${totals.grandTotal.toFixed(2)}`;

    const hasItems = this.cart.length > 0;
    document.getElementById('payCashBtn').disabled = !hasItems;
    document.getElementById('payEpayBtn').disabled = !hasItems;
  }

  // CASH PAYMENT FLOW
  openCashModal() {
    const totals = this.getCartTotals();
    document.getElementById('cashModalTotal').innerText = `৳${totals.grandTotal.toFixed(2)}`;
    const tenderedInput = document.getElementById('cashTenderedInput');
    tenderedInput.value = '';
    document.getElementById('cashChangeAmount').innerText = '৳0.00';
    document.getElementById('confirmCashPayBtn').disabled = true;

    this.prefillCustomerInModal('cash');
    this.openModal('cashPaymentModal');
    setTimeout(() => tenderedInput.focus(), 100);
  }

  calculateCashChange() {
    const totals = this.getCartTotals();
    const tendered = parseFloat(document.getElementById('cashTenderedInput').value) || 0;
    const change = tendered - totals.grandTotal;

    const changeEl = document.getElementById('cashChangeAmount');
    const confirmBtn = document.getElementById('confirmCashPayBtn');

    if (change >= 0) {
      changeEl.innerText = `৳${change.toFixed(2)}`;
      changeEl.style.color = 'var(--accent-green)';
      confirmBtn.disabled = false;
    } else {
      changeEl.innerText = `কম দেওয়া হয়েছে: ৳${Math.abs(change).toFixed(2)}`;
      changeEl.style.color = 'var(--accent-red)';
      confirmBtn.disabled = true;
    }
  }

  processCashPayment() {
    const totals = this.getCartTotals();
    const tendered = parseFloat(document.getElementById('cashTenderedInput').value) || totals.grandTotal;
    const change = tendered - totals.grandTotal;

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

    const saleRecord = {
      id: `INV-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}${String(new Date().getDate()).padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      customerId: custInfo.id,
      customer: custInfo.name,
      customerPhone: custInfo.phone,
      customerEmail: custInfo.email,
      customerAddress: custInfo.address,
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
      tax: totals.taxAmount,
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

    const saleRecord = {
      id: `INV-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}${String(new Date().getDate()).padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      customerId: custInfo.id,
      customer: custInfo.name,
      customerPhone: custInfo.phone,
      customerEmail: custInfo.email,
      customerAddress: custInfo.address,
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
      tax: totals.taxAmount,
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
    this.showReceiptModal(saleRecord);
    this.clearCart();
  }

  showReceiptModal(saleRecord) {
    const s = this.settings || {};
    const sym = s.currencySymbol || '৳';

    const storeTitleEl = document.querySelector('#printableReceipt .receipt-header h2');
    if (storeTitleEl) storeTitleEl.innerText = s.storeName || 'Super Shop Dhaka';

    const storeAddressEl = document.querySelectorAll('#printableReceipt .receipt-header p')[0];
    if (storeAddressEl) storeAddressEl.innerText = s.storeAddress || 'Mirpur 10, Dhaka - 1216';

    const storePhoneEl = document.querySelectorAll('#printableReceipt .receipt-header p')[1];
    if (storePhoneEl) storePhoneEl.innerText = `Mobile: ${s.storePhone || '+880 1700-000000'}`;

    const footerNoteEl = document.querySelector('#printableReceipt .receipt-footer .thank-you');
    if (footerNoteEl) footerNoteEl.innerText = s.receiptFooterNote || 'Thank you! Come again.';

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

    if (typeof JsBarcode !== 'undefined') {
      JsBarcode("#rcptBarcodeSvg", saleRecord.id, {
        format: "CODE128", width: 1.5, height: 40, displayValue: false, margin: 0,
        background: "#ffffff", lineColor: "#000000"
      });
    }

    this.openModal('receiptModal');

    // Automatically play in-website thermal print animation on screen (no browser print window)
    setTimeout(() => {
      this.playInModalReceiptPrint('printableReceipt', false);
    }, 200);
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

  // Shift Sales Report
  renderShiftSales() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    const todaySales = this.sales.filter(s => {
      const saleTime = new Date(s.timestamp).getTime();
      return !isNaN(saleTime) && saleTime >= todayStart && saleTime <= todayEnd;
    });

    const cashTotal = todaySales.filter(s => s.paymentMethod === 'CASH').reduce((sum, s) => sum + s.grandTotal, 0);
    const epayTotal = todaySales.filter(s => s.paymentMethod === 'EPAY').reduce((sum, s) => sum + s.grandTotal, 0);

    document.getElementById('cashierShiftCash').innerText = `৳${cashTotal.toFixed(2)}`;
    document.getElementById('cashierShiftEpay').innerText = `৳${epayTotal.toFixed(2)}`;
    document.getElementById('cashierShiftCount').innerText = `${todaySales.length} টি`;

    const tbody = document.getElementById('cashierShiftTableBody');
    tbody.innerHTML = todaySales.map(s => `
      <tr>
        <td><strong>${s.id}</strong></td>
        <td>${new Date(s.timestamp).toLocaleTimeString('bn-BD')}</td>
        <td>${s.customer}</td>
        <td><span class="badge" style="background:rgba(16,185,129,0.15); color:var(--accent-green);">${s.paymentMethod}</span></td>
        <td><strong>৳${s.grandTotal.toFixed(2)}</strong></td>
        <td><button class="btn btn-outline btn-sm" onclick="cashier.showReceiptModalById('${s.id}')"><i class="fa-solid fa-receipt"></i> মেমো</button></td>
      </tr>
    `).join('');

    this.renderShiftChart(todaySales);
  }

  renderShiftChart(todaySales) {
    const chartCanvas = document.getElementById('cashierShiftChart');
    if (!chartCanvas || typeof Chart === 'undefined') return;

    const hourlyData = {};
    for (let h = 8; h <= 22; h++) {
      const label = `${h > 12 ? h - 12 : h} ${h >= 12 ? 'PM' : 'AM'}`;
      hourlyData[label] = 0;
    }

    todaySales.forEach(s => {
      const date = new Date(s.timestamp);
      const h = date.getHours();
      const label = `${h > 12 ? h - 12 : h} ${h >= 12 ? 'PM' : 'AM'}`;
      if (hourlyData[label] !== undefined) {
        hourlyData[label] += s.grandTotal;
      }
    });

    const labels = Object.keys(hourlyData);
    const data = Object.values(hourlyData);

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
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#3b82f6'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
          x: { grid: { display: false } }
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
      this.renderDashboardView();
    } else if (tabId === 'cashierTerminalView') {
      this.renderProducts();
      this.renderCart();
    } else if (tabId === 'cashierAnalyticsView') {
      this.renderAnalyticsView();
    } else if (tabId === 'cashierShiftView') {
      this.renderShiftSales();
    } else if (tabId === 'cashierCustomersView') {
      this.renderCashierCustomers();
    }
  }

  // 1. DASHBOARD VIEW LOGIC (7 KPI METRICS IN EXACT ORDER)
  renderDashboardView() {
    const todaySales = this.getCashierFilteredSales();

    const totalRev = todaySales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    const totalOrders = todaySales.length;
    let itemsSold = 0;
    let cashReceived = 0;
    let epayReceived = 0;
    let totalNetProfit = 0;

    todaySales.forEach(s => {
      if (s.paymentMethod === 'epay' || (s.paymentDetails && s.paymentDetails.method === 'epay') || s.paymentMethod === 'EPAY') {
        epayReceived += (s.grandTotal || 0);
      } else {
        cashReceived += (s.grandTotal || 0);
      }

      if (s.items && Array.isArray(s.items)) {
        s.items.forEach(i => {
          const qty = i.quantity || 1;
          itemsSold += qty;
          const cost = i.cost !== undefined ? i.cost : (i.price * 0.8);
          const price = i.price || 0;
          const itemRev = i.subtotal || (price * qty);
          totalNetProfit += (itemRev - (cost * qty));
        });
      }
    });

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

    const revEl = document.getElementById('dashTotalRevenue');
    if (revEl) revEl.innerText = `৳${totalRev.toFixed(2)}`;

    const profitEl = document.getElementById('dashNetProfit');
    if (profitEl) profitEl.innerText = `৳${totalNetProfit.toFixed(2)}`;

    this.renderDashboardChart(todaySales);

    // Recent 5 Sales Table Body
    const recentBody = document.getElementById('dashRecentSalesBody');
    if (recentBody) {
      if (todaySales.length === 0) {
        recentBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted p-3">আজ কোনো বিক্রি হয়নি</td></tr>`;
      } else {
        recentBody.innerHTML = todaySales.slice(0, 5).map(s => `
          <tr>
            <td><strong>${s.id}</strong></td>
            <td>${new Date(s.timestamp).toLocaleTimeString('bn-BD')}</td>
            <td><strong>৳${s.grandTotal.toFixed(2)}</strong></td>
            <td><span class="badge" style="background:rgba(16,185,129,0.15); color:var(--accent-green);">${s.paymentMethod}</span></td>
          </tr>
        `).join('');
      }
    }
  }

  renderDashboardChart(todaySales) {
    const chartCanvas = document.getElementById('cashierDashboardChart');
    if (!chartCanvas || typeof Chart === 'undefined') return;

    const hourlyData = {};
    for (let h = 8; h <= 22; h++) {
      const label = `${h > 12 ? h - 12 : h} ${h >= 12 ? 'PM' : 'AM'}`;
      hourlyData[label] = 0;
    }

    todaySales.forEach(s => {
      const date = new Date(s.timestamp);
      const h = date.getHours();
      const label = `${h > 12 ? h - 12 : h} ${h >= 12 ? 'PM' : 'AM'}`;
      if (hourlyData[label] !== undefined) hourlyData[label] += s.grandTotal;
    });

    const labels = Object.keys(hourlyData);
    const data = Object.values(hourlyData);

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
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#10b981'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // 2. ANALYTICS VIEW LOGIC (7 KPI METRICS IN EXACT ORDER)
  renderAnalyticsView() {
    const targetSales = this.getCashierFilteredSales();

    const totalRev = targetSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    const totalOrders = targetSales.length;
    let cashReceived = 0;
    let epayReceived = 0;
    let totalItemsSold = 0;
    let totalNetProfit = 0;

    targetSales.forEach(s => {
      if (s.paymentMethod === 'epay' || (s.paymentDetails && s.paymentDetails.method === 'epay') || s.paymentMethod === 'EPAY') {
        epayReceived += (s.grandTotal || 0);
      } else {
        cashReceived += (s.grandTotal || 0);
      }

      if (s.items && Array.isArray(s.items)) {
        s.items.forEach(i => {
          const qty = i.quantity || 1;
          totalItemsSold += qty;
          const cost = i.cost !== undefined ? i.cost : (i.price * 0.8);
          const price = i.price || 0;
          const itemRev = i.subtotal || (price * qty);
          totalNetProfit += (itemRev - (cost * qty));
        });
      }
    });

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

    const revEl = document.getElementById('analyticsRevenue');
    if (revEl) revEl.innerText = `৳${totalRev.toFixed(2)}`;

    const profitEl = document.getElementById('analyticsNetProfit');
    if (profitEl) profitEl.innerText = `৳${totalNetProfit.toFixed(2)}`;

    this.renderAnalyticsHourlyChart(targetSales);
    this.renderAnalyticsPaymentChart(targetSales);
    this.renderAnalyticsCategoryChart(targetSales);
  }

  renderAnalyticsHourlyChart(todaySales) {
    const canvas = document.getElementById('cashierAnalyticsHourlyChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const hourlyData = {};
    for (let h = 8; h <= 22; h++) {
      const label = `${h > 12 ? h - 12 : h} ${h >= 12 ? 'PM' : 'AM'}`;
      hourlyData[label] = 0;
    }

    todaySales.forEach(s => {
      const date = new Date(s.timestamp);
      const h = date.getHours();
      const label = `${h > 12 ? h - 12 : h} ${h >= 12 ? 'PM' : 'AM'}`;
      if (hourlyData[label] !== undefined) hourlyData[label] += s.grandTotal;
    });

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
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  renderAnalyticsPaymentChart(todaySales) {
    const canvas = document.getElementById('cashierAnalyticsPaymentChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const cashTotal = todaySales.filter(s => s.paymentMethod === 'CASH').reduce((sum, s) => sum + s.grandTotal, 0);
    const epayTotal = todaySales.filter(s => s.paymentMethod === 'EPAY').reduce((sum, s) => sum + s.grandTotal, 0);

    if (this.analyticsPaymentChart) this.analyticsPaymentChart.destroy();

    this.analyticsPaymentChart = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['নগদ (CASH)', 'ডিজিটাল (E-PAY)'],
        datasets: [{
          data: [cashTotal, epayTotal],
          backgroundColor: ['#10b981', '#3b82f6'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af' } } }
      }
    });
  }

  renderAnalyticsCategoryChart(todaySales) {
    const canvas = document.getElementById('cashierAnalyticsCategoryChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const catTotals = {};
    todaySales.forEach(s => {
      if (s.items) {
        s.items.forEach(i => {
          const prod = this.products.find(p => p.id === i.id);
          const cat = prod ? prod.category : 'অন্যান্য';
          catTotals[cat] = (catTotals[cat] || 0) + i.subtotal;
        });
      }
    });

    const labels = Object.keys(catTotals);
    const data = Object.values(catTotals);

    if (this.analyticsCategoryChart) this.analyticsCategoryChart.destroy();

    this.analyticsCategoryChart = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels.length > 0 ? labels : ['কোনো বিক্রি নেই'],
        datasets: [{
          label: 'বিক্রি (৳)',
          data: data.length > 0 ? data : [0],
          backgroundColor: 'rgba(139, 92, 246, 0.75)',
          borderColor: '#8b5cf6',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  showReceiptModalById(id) {
    const sale = this.sales.find(s => s.id === id);
    if (sale) this.showReceiptModal(sale);
  }

  promptAdminPin() {
    document.getElementById('adminPinInput').value = '';
    this.openModal('adminPinModal');
    setTimeout(() => document.getElementById('adminPinInput').focus(), 100);
  }

  verifyAdminPin() {
    const pin = document.getElementById('adminPinInput').value.trim();
    if (pin === '1234') {
      this.closeModal('adminPinModal');
      window.location.href = 'admin.html';
    } else {
      this.showToast('ভুল এডমিন পিন! (ডিফল্ট: 1234)', 'error');
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

    document.getElementById('btnOpenAdminModal').addEventListener('click', () => this.promptAdminPin());
    document.getElementById('submitPinBtn').addEventListener('click', () => this.verifyAdminPin());
    document.getElementById('adminPinInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.verifyAdminPin();
    });

    document.getElementById('themeToggleBtn').addEventListener('click', () => {
      const html = document.documentElement;
      const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
    });

    document.getElementById('soundToggleBtn').addEventListener('click', () => {
      this.soundEnabled = !this.soundEnabled;
      const btn = document.getElementById('soundToggleBtn');
      btn.style.color = this.soundEnabled ? 'var(--text-main)' : 'var(--accent-red)';
    });

    document.getElementById('cameraScanBtn').addEventListener('click', () => this.openCameraScanner());

    document.getElementById('clearCartHeaderBtn').addEventListener('click', () => {
      if (this.cart.length > 0 && confirm('আপনি কি পুরো কার্ট খালি করতে চান?')) this.clearCart();
    });

    const searchInput = document.getElementById('productSearchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    searchInput.addEventListener('input', (e) => {
      clearSearchBtn.style.display = e.target.value ? 'block' : 'none';
      this.renderProducts();
    });
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      this.renderProducts();
    });

    document.getElementById('simulateBarcodeBtn').addEventListener('click', () => {
      // Pick a random variant barcode
      const randomProd = this.products[Math.floor(Math.random() * this.products.length)];
      if (randomProd && randomProd.variants && randomProd.variants.length > 0) {
        const randomVar = randomProd.variants[Math.floor(Math.random() * randomProd.variants.length)];
        this.handleBarcodeScan(randomVar.barcode);
      }
    });

    document.getElementById('categoriesBar').addEventListener('click', (e) => {
      if (e.target.classList.contains('cat-pill')) {
        document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        this.activeCategory = e.target.dataset.cat;
        this.renderProducts();
      }
    });

    const discInput = document.getElementById('discountInput');
    if (discInput) {
      discInput.addEventListener('input', (e) => {
        this.discountValue = parseFloat(e.target.value) || 0;
        this.renderCart();
      });
    }

    const discToggle = document.getElementById('discountModeToggle');
    if (discToggle) {
      discToggle.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-toggle-mode');
        if (btn && btn.dataset.mode) {
          this.discountType = btn.dataset.mode;
          this.updateDiscountTaxUI();
          this.renderCart();
        }
      });
    }

    const taxInput = document.getElementById('taxInput');
    if (taxInput) {
      taxInput.addEventListener('input', (e) => {
        this.taxValue = parseFloat(e.target.value) || 0;
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
        window.print();
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

    // Cashier Analytics Date Filter
    const cashDateSelect = document.getElementById('cashierDateFilterSelect');
    if (cashDateSelect) {
      cashDateSelect.addEventListener('change', (e) => {
        this.currentDateFilter = e.target.value;
        this.renderAnalyticsView();
        this.showToast(`সময়কাল ফিল্টার রিলোড করা হলো: ${e.target.options[e.target.selectedIndex].text}`);
      });
    }

    // Analytics Hub 7 KPI Cards Click Listeners
    ['analyticsCardTotalSale', 'analyticsCardRevenue'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => this.openCashierRevenueModal());
    });
    ['analyticsCardCashPayment', 'analyticsCardEpayPayment'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => this.openCashierRevenueModal());
    });
    const analOrders = document.getElementById('analyticsCardTotalOrders');
    if (analOrders) analOrders.addEventListener('click', () => this.switchTab('cashierShiftView'));

    const analItem = document.getElementById('analyticsCardTotalItem');
    if (analItem) analItem.addEventListener('click', () => this.openCashierItemsSoldModal());

    const analNetProfit = document.getElementById('analyticsCardNetProfit');
    if (analNetProfit) analNetProfit.addEventListener('click', () => this.openCashierNetProfitModal());

    // Cashier Dashboard 7 KPI Card Click Listeners
    ['dashCardTotalSale', 'dashCardRevenue', 'cashCardRevenue'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => this.openCashierRevenueModal());
    });
    ['dashCardCashPayment', 'dashCardEpayPayment', 'cashCardCash'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => this.openCashierRevenueModal());
    });
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

  openCashierRevenueModal() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    const todaySales = this.sales.filter(s => {
      const saleTime = new Date(s.timestamp).getTime();
      return !isNaN(saleTime) && saleTime >= todayStart && saleTime <= todayEnd;
    });

    const totalRev = todaySales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    const totalOrders = todaySales.length;
    const avgTicket = totalOrders > 0 ? totalRev / totalOrders : 0;

    let cashTotal = 0;
    let epayTotal = 0;

    todaySales.forEach(s => {
      if (s.paymentMethod === 'epay' || (s.paymentDetails && s.paymentDetails.method === 'epay')) {
        epayTotal += (s.grandTotal || 0);
      } else {
        cashTotal += (s.grandTotal || 0);
      }
    });

    const elTotal = document.getElementById('cashModalRevTotal');
    const elOrders = document.getElementById('cashModalRevOrders');
    const elAvg = document.getElementById('cashModalRevAvg');
    const elCash = document.getElementById('cashModalRevCashTotal');
    const elEpay = document.getElementById('cashModalRevEpayTotal');

    if (elTotal) elTotal.innerText = `৳${totalRev.toFixed(2)}`;
    if (elOrders) elOrders.innerText = `${totalOrders} টি`;
    if (elAvg) elAvg.innerText = `৳${avgTicket.toFixed(2)}`;
    if (elCash) elCash.innerText = `৳${cashTotal.toFixed(2)}`;
    if (elEpay) elEpay.innerText = `৳${epayTotal.toFixed(2)}`;

    const tbody = document.getElementById('cashModalRevRecentBody');
    if (tbody) {
      if (todaySales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted" style="padding: 1.5rem;">আজকে এখনো কোনো বিক্রি রেকর্ড করা হয়নি।</td></tr>`;
      } else {
        tbody.innerHTML = todaySales.slice(-5).reverse().map(s => `
          <tr>
            <td><strong>${s.id}</strong></td>
            <td><small>${new Date(s.timestamp).toLocaleTimeString('bn-BD')}</small></td>
            <td><span class="badge" style="background: ${s.paymentMethod === 'epay' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)'}; color: ${s.paymentMethod === 'epay' ? '#3b82f6' : '#10b981'};">${s.paymentMethod === 'epay' ? 'ই-পে' : 'ক্যাশ'}</span></td>
            <td style="text-align: right; font-weight: 700; color: var(--accent-green);">৳${(s.grandTotal || 0).toFixed(2)}</td>
          </tr>
        `).join('');
      }
    }

    this.openModal('cashierRevenueModal');
  }

  openCashierItemsSoldModal() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    const todaySales = this.sales.filter(s => {
      const saleTime = new Date(s.timestamp).getTime();
      return !isNaN(saleTime) && saleTime >= todayStart && saleTime <= todayEnd;
    });

    const itemMap = {};
    todaySales.forEach(s => {
      if (s.items && Array.isArray(s.items)) {
        s.items.forEach(i => {
          if (!itemMap[i.name]) {
            itemMap[i.name] = {
              name: i.name,
              category: i.category || 'General',
              price: i.price || 0,
              qty: 0,
              total: 0
            };
          }
          itemMap[i.name].qty += (i.quantity || 1);
          itemMap[i.name].total += (i.subtotal || (i.price * i.quantity));
        });
      }
    });

    const tbody = document.getElementById('cashModalItemsSoldBody');
    if (tbody) {
      const itemList = Object.values(itemMap).sort((a, b) => b.qty - a.qty);
      if (itemList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 1.5rem;">আজকে এখনো কোনো পণ্য বিক্রি হয়নি।</td></tr>`;
      } else {
        tbody.innerHTML = itemList.map(item => `
          <tr>
            <td><strong>${item.name}</strong></td>
            <td><span class="badge" style="background: rgba(59,130,246,0.15); color: #3b82f6;">${item.category}</span></td>
            <td>৳${item.price.toFixed(2)}</td>
            <td><strong style="color: var(--accent-purple);">${item.qty} টি</strong></td>
            <td style="text-align: right; font-weight: 700; color: var(--accent-green);">৳${item.total.toFixed(2)}</td>
          </tr>
        `).join('');
      }
    }

    this.openModal('cashierItemsSoldModal');
  }

  openCashierNetProfitModal() {
    const targetSales = this.getCashierFilteredSales();
    let totalSales = 0;
    let totalCost = 0;
    const itemProfits = {};

    targetSales.forEach(sale => {
      totalSales += (sale.grandTotal || 0);
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          const cost = item.cost !== undefined ? item.cost : (item.price * 0.8);
          const price = item.price || 0;
          const qty = item.quantity || 1;
          const itemCostTotal = cost * qty;
          const itemRevTotal = item.subtotal || (price * qty);
          const itemProfit = itemRevTotal - itemCostTotal;

          totalCost += itemCostTotal;
          const key = item.id || item.name;

          if (!itemProfits[key]) {
            itemProfits[key] = {
              name: item.name,
              variant: (item.color || item.size) ? `${item.color || ''} ${item.size || ''}`.trim() : 'Standard',
              category: item.category || 'অন্যান্য',
              quantity: 0,
              cost: cost,
              price: price,
              totalSales: 0,
              totalCost: 0,
              totalProfit: 0
            };
          }
          itemProfits[key].quantity += qty;
          itemProfits[key].totalSales += itemRevTotal;
          itemProfits[key].totalCost += itemCostTotal;
          itemProfits[key].totalProfit += itemProfit;
        });
      }
    });

    const netProfit = totalSales - totalCost;
    const marginPct = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : 0;

    const elSales = document.getElementById('cashModalProfitTotalSales');
    const elCost = document.getElementById('cashModalProfitTotalCost');
    const elNet = document.getElementById('cashModalProfitNetTotal');
    const elMargin = document.getElementById('cashModalProfitMarginPercent');

    if (elSales) elSales.innerText = `৳${totalSales.toFixed(2)}`;
    if (elCost) elCost.innerText = `৳${totalCost.toFixed(2)}`;
    if (elNet) elNet.innerText = `৳${netProfit.toFixed(2)}`;
    if (elMargin) elMargin.innerText = `${marginPct}%`;

    const itemsList = Object.values(itemProfits);

    const renderTable = (query = '') => {
      const tbody = document.getElementById('cashModalProfitItemsBody');
      if (!tbody) return;

      const filtered = itemsList.filter(i => 
        !query || 
        i.name.toLowerCase().includes(query) || 
        i.category.toLowerCase().includes(query) ||
        i.variant.toLowerCase().includes(query)
      );

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding: 1.5rem;">কোনো প্রোডাক্টের প্রফিট ডাটা পাওয়া যায়নি।</td></tr>`;
      } else {
        tbody.innerHTML = filtered.sort((a, b) => b.totalProfit - a.totalProfit).map(item => `
          <tr>
            <td>
              <strong>${item.name}</strong><br>
              <small class="text-muted">(${item.variant})</small>
            </td>
            <td><span class="badge" style="background: rgba(59,130,246,0.15); color: #3b82f6;">${item.category}</span></td>
            <td><strong>${item.quantity} টি</strong></td>
            <td>৳${item.cost.toFixed(2)}</td>
            <td>৳${item.price.toFixed(2)}</td>
            <td>৳${item.totalSales.toFixed(2)}</td>
            <td>৳${item.totalCost.toFixed(2)}</td>
            <td style="text-align: right;">
              <strong style="color: ${item.totalProfit >= 0 ? 'var(--accent-purple)' : '#ef4444'}; font-size: 0.95rem;">
                ${item.totalProfit >= 0 ? '+' : ''}৳${item.totalProfit.toFixed(2)}
              </strong>
            </td>
          </tr>
        `).join('');
      }
    };

    renderTable();

    const searchInput = document.getElementById('cashModalProfitSearchInput');
    if (searchInput) {
      searchInput.value = '';
      searchInput.oninput = (e) => renderTable(e.target.value.toLowerCase().trim());
    }

    this.openModal('cashierNetProfitModal');
  }

  playInModalReceiptPrint(receiptPaperId, autoTriggerSystemPrint = false) {
    const paperEl = document.getElementById(receiptPaperId);
    if (!paperEl) {
      if (autoTriggerSystemPrint) window.print();
      return;
    }

    const container = paperEl.closest('.receipt-feed-container');
    const viewport = paperEl.closest('.receipt-feed-viewport');
    const scanline = container ? container.querySelector('.thermal-feed-scanline') : null;
    const statusIndicator = container ? container.querySelector('.slot-status-indicator') : null;
    const statusText = container ? container.querySelector('.slot-status-text') : null;

    if (statusIndicator) statusIndicator.classList.add('printing');
    if (statusText) statusText.innerText = 'Printing...';
    if (scanline) scanline.style.display = 'block';

    if (window.printHub && window.printHub.playPrinterAudio) {
      window.printHub.playPrinterAudio(1600);
    }

    const duration = 1600;
    const startTime = performance.now();

    if (viewport) viewport.scrollTop = 0;

    paperEl.style.transition = 'none';
    paperEl.style.transform = 'translateY(60px)';
    paperEl.style.opacity = '0.3';

    function step(now) {
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
        if (statusText) statusText.innerText = 'Ready';

        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }

        if (window.printHub && window.printHub.playSuccessBeep) {
          window.printHub.playSuccessBeep();
        }
      }
    }

    requestAnimationFrame(step);

    if (autoTriggerSystemPrint) {
      setTimeout(() => {
        window.print();
      }, 300);
    }
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
          format: "CODE128", width: 1.8, height: 45, displayValue: false, margin: 0,
          background: "#ffffff", lineColor: "#000000"
        });
      } catch(e) {}
    }

    const opt = {
      margin: [4, 4, 4, 4],
      filename: `Memo_${invId.replace(/[^a-zA-Z0-9_\-]/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollY: 0 },
      jsPDF: { unit: 'mm', format: [80, 190], orientation: 'portrait' }
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
      window.print();
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

  renderCashierCustomers() {
    this.customers = JSON.parse(localStorage.getItem('pos_customers')) || (typeof INITIAL_CUSTOMERS !== 'undefined' ? INITIAL_CUSTOMERS : []);
    this.sales = JSON.parse(localStorage.getItem('pos_sales')) || (typeof INITIAL_SALES !== 'undefined' ? INITIAL_SALES : []);

    const countEl = document.getElementById('cashierCustCount');
    const ordersEl = document.getElementById('cashierCustOrders');
    const spentEl = document.getElementById('cashierCustSpent');
    const tbody = document.getElementById('cashierCustomersTableBody');
    const searchVal = (document.getElementById('cashierCustSearchInput')?.value || '').toLowerCase().trim();

    const totalOrdersCount = this.customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
    const totalSpentSum = this.customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

    if (countEl) countEl.innerText = `${this.customers.length} জন`;
    if (ordersEl) ordersEl.innerText = `${totalOrdersCount} টি`;
    if (spentEl) spentEl.innerText = `৳${totalSpentSum.toFixed(2)}`;

    const filtered = this.customers.filter(c => 
      !searchVal || 
      (c.name || '').toLowerCase().includes(searchVal) ||
      (c.phone || '').includes(searchVal) ||
      (c.address || '').toLowerCase().includes(searchVal) ||
      (c.email || '').toLowerCase().includes(searchVal)
    );

    if (!tbody) return;
    if (filtered.length === 0) {
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

    tbody.innerHTML = filtered.map(c => {
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
  }

  getCashierFilteredSales() {
    const filter = this.currentDateFilter || 'today';
    if (filter === 'all') return this.sales;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

    if (filter === 'custom' && this.customStartDate && this.customEndDate) {
      const startMs = new Date(this.customStartDate + 'T00:00:00').getTime();
      const endMs = new Date(this.customEndDate + 'T23:59:59').getTime();
      return this.sales.filter(sale => {
        const saleTime = new Date(sale.timestamp).getTime();
        if (isNaN(saleTime)) return true;
        return saleTime >= startMs && saleTime <= endMs;
      });
    }

    const currentDayOfWeek = now.getDay();
    const sundayStart = todayStart - (currentDayOfWeek * 86400000);
    const lastSundayStart = sundayStart - (7 * 86400000);

    return this.sales.filter(sale => {
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

    const cleanInputPhone = this.normalizePhone(phoneOrName);
    let c = null;

    if (phoneOrName) {
      c = this.customers.find(x => x.id === phoneOrName || x.phone === phoneOrName || x.name === phoneOrName);
    }
    if (!c && cleanInputPhone) {
      c = this.customers.find(x => this.normalizePhone(x.phone) === cleanInputPhone);
    }

    const custName = c ? c.name : phoneOrName;
    const custPhone = c ? c.phone : (cleanInputPhone || phoneOrName);

    // Deep multi-criteria sales matching across ID, phone, and name
    const custSales = this.sales.filter(s => {
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
}

let cashier;
document.addEventListener('DOMContentLoaded', () => {
  cashier = new CashierTerminal();
  window.cashier = cashier;

  document.getElementById('btnNavCustomers')?.addEventListener('click', () => cashier.switchTab('cashierCustomersView'));
  document.getElementById('cashierAddNewCustBtn')?.addEventListener('click', () => cashier.openAddNewCustomerModal());
  document.getElementById('cashierCustSearchInput')?.addEventListener('input', () => cashier.renderCashierCustomers());
});
