// Smart POS Core Application Logic

class POSApp {
  constructor() {
    // State Initialization
    this.products = JSON.parse(localStorage.getItem('pos_products')) || INITIAL_PRODUCTS;
    this.sales = JSON.parse(localStorage.getItem('pos_sales')) || INITIAL_SALES;
    this.cart = [];
    this.discountType = 'percent';
    this.discountValue = 0;
    this.taxType = 'percent';
    this.taxValue = 0;
    this.soundEnabled = true;
    this.activeCategory = 'all';
    this.html5QrcodeScanner = null;
    this.selectedEpayProvider = 'bKash';
    
    // USB Hardware Scanner Buffer
    this.scannerBuffer = '';
    this.scannerTimeout = null;

    // Charts references
    this.categoryChart = null;
    this.paymentChart = null;

    // Audio Context Setup
    this.audioCtx = null;

    this.init();
  }

  init() {
    this.initEventListeners();
    this.initLiveClock();
    this.renderProducts();
    this.updateDiscountTaxUI();
    this.renderCart();
    this.renderInventory();
    this.renderSalesHistory();
    this.initCharts();
    this.updateDashboardStats();
    this.setupHardwareScanner();

    // Listen for storage & cloud updates
    const reloadAppState = () => {
      let savedProd = localStorage.getItem('pos_products');
      if (!savedProd || savedProd === '[]') savedProd = localStorage.getItem('pos_products_raw_backup');
      this.products = savedProd && savedProd !== '[]' ? JSON.parse(savedProd) : INITIAL_PRODUCTS;

      let savedSales = localStorage.getItem('pos_sales');
      this.sales = savedSales ? JSON.parse(savedSales) : INITIAL_SALES;

      this.renderProducts();
      this.updateDashboardStats();
    };

    window.addEventListener('storage', reloadAppState);
    window.addEventListener('pos_cloud_update', reloadAppState);
    window.addEventListener('pos_tenant_changed', reloadAppState);
  }

  // Audio Beep Generator using Web Audio API
  playAudioBeep(type = 'scan') {
    if (!this.soundEnabled) return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
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
        osc.frequency.setValueAtTime(587.33, this.audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, this.audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.35);
      }
    } catch (e) {
      console.log('Audio playback restricted', e);
    }
  }

  // Live Clock Counter
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

      // Midnight Rollover Check: Auto update dashboard stats when date changes past 12:00 AM midnight
      if (this.lastTrackedDate && this.lastTrackedDate !== currentDateStr) {
        this.lastTrackedDate = currentDateStr;
        if (typeof this.updateDashboardStats === 'function') {
          this.updateDashboardStats();
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

  // USB Barcode Scanner Hardware Buffer Listener
  setupHardwareScanner() {
    document.addEventListener('keydown', (e) => {
      // Ignore keypresses inside text inputs unless it's the product barcode search input
      const activeEl = document.activeElement;
      const isInput = activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT';

      if (isInput && activeEl.id !== 'productSearchInput') return;

      if (e.key === 'Enter') {
        if (this.scannerBuffer.trim().length >= 3) {
          this.handleBarcodeScan(this.scannerBuffer.trim());
          this.scannerBuffer = '';
          if (activeEl.id === 'productSearchInput') activeEl.value = '';
        }
      } else if (e.key.length === 1) {
        this.scannerBuffer += e.key;
        clearTimeout(this.scannerTimeout);
        this.scannerTimeout = setTimeout(() => {
          this.scannerBuffer = '';
        }, 200);
      }
    });
  }

  // Handle Scanned Barcode Logic
  handleBarcodeScan(barcodeStr) {
    const product = this.products.find(p => p.barcode === barcodeStr || p.id === barcodeStr);
    if (product) {
      this.addToCart(product);
      this.playAudioBeep('scan');
      this.showToast(`স্ক্যান সফল: ${product.name} (৳${product.price})`);
    } else {
      this.showToast(`বারকোড '${barcodeStr}' সিস্টেমে পাওয়া যায়নি!`, 'error');
    }
  }

  // Toast Notification
  showToast(msg, type = 'success') {
    const existing = document.querySelector('.pos-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `pos-toast ${type}`;
    toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}"></i> ${msg}`;
    
    // Add CSS dynamically for toast
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
    toast.style.animation = 'slideIn 0.3s ease';

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  // Tab Navigation Handling
  switchTab(tabId) {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));

    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(`${tabId}View`).classList.add('active');

    const titles = {
      pos: 'POS টার্মিনাল',
      inventory: 'ইনভেন্টরি ও বারকোড পরিচালনা',
      sales: 'বিক্রি ইতিহাস (Sales History)',
      analytics: 'সেলস ড্যাশবোর্ড ও রিপোর্ট'
    };
    document.getElementById('pageTitle').innerText = titles[tabId] || 'Smart POS';

    if (tabId === 'analytics') {
      this.updateDashboardStats();
    }
  }

  // Render Product Catalog Grid
  renderProducts() {
    const grid = document.getElementById('productsGrid');
    const searchVal = document.getElementById('productSearchInput').value.toLowerCase().trim();

    const filtered = this.products.filter(p => {
      const matchCat = this.activeCategory === 'all' || p.category === this.activeCategory;
      const matchSearch = p.name.toLowerCase().includes(searchVal) || p.barcode.includes(searchVal);
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem;">
          <i class="fa-solid fa-box-open" style="font-size: 2.5rem; opacity: 0.4;"></i>
          <p class="mt-2">কোনো প্রোডাক্ট পাওয়া যায়নি</p>
        </div>`;
      return;
    }

    grid.innerHTML = filtered.map(p => `
      <div class="product-card" onclick="app.addToCartById('${p.id}')">
        <div class="product-img-wrap">
          <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'><rect width=\'100\' height=\'100\' fill=\'%231e293b\'/><text x=\'50%\' y=\'50%\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%2394a3b8\' font-family=\'sans-serif\' font-size=\'12\'>No Image</text></svg>'">
          <span class="stock-tag ${p.stock <= 10 ? 'low' : ''}">স্টক: ${p.stock}</span>
        </div>
        <div class="product-details">
          <h4>${p.name}</h4>
          <span class="product-barcode"><i class="fa-solid fa-barcode"></i> ${p.barcode}</span>
          <div class="product-price-row">
            <span class="price">৳${p.price}</span>
            <button class="btn-add-cart" title="কার্টে যোগ করুন"><i class="fa-solid fa-plus"></i></button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Cart Management Methods
  addToCartById(id) {
    const prod = this.products.find(p => p.id === id);
    if (prod) {
      this.addToCart(prod);
      this.playAudioBeep('scan');
    }
  }

  addToCart(product) {
    const existing = this.cart.find(item => item.product.id === product.id);
    if (existing) {
      if (existing.quantity + 1 > product.stock) {
        this.showToast(`স্টক সীমা অতিক্রম করেছে! (মজুদ: ${product.stock})`, 'error');
        return;
      }
      existing.quantity += 1;
      existing.subtotal = existing.quantity * product.price;
    } else {
      if (product.stock < 1) {
        this.showToast('পণ্যটি স্টকে নেই!', 'error');
        return;
      }
      this.cart.push({
        product: product,
        quantity: 1,
        subtotal: product.price
      });
    }
    this.renderCart();
  }

  updateCartQty(id, delta) {
    const item = this.cart.find(i => i.product.id === id);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      this.cart = this.cart.filter(i => i.product.id !== id);
    } else {
      if (item.quantity > item.product.stock) {
        item.quantity = item.product.stock;
        this.showToast(`স্টক সীমা অতিক্রম করেছে! (মজুদ: ${item.product.stock})`, 'error');
      }
      item.subtotal = item.quantity * item.product.price;
    }
    this.renderCart();
  }

  setCartQty(id, newQtyVal) {
    let newQty = parseInt(newQtyVal, 10);
    if (isNaN(newQty) || newQty <= 0) newQty = 1;

    const item = this.cart.find(i => i.product.id === id);
    if (!item) return;

    if (newQty > item.product.stock) {
      newQty = item.product.stock;
      this.showToast(`স্টক সীমা অতিক্রম করেছে! (মজুদ: ${item.product.stock})`, 'error');
    }

    item.quantity = newQty;
    item.subtotal = item.quantity * item.product.price;
    this.renderCart();
  }

  removeFromCart(id) {
    this.cart = this.cart.filter(i => i.product.id !== id);
    this.renderCart();
  }

  clearCart() {
    this.cart = [];
    this.discountType = 'percent';
    this.discountValue = 0;
    this.taxType = 'percent';
    this.taxValue = 0;

    const discInput = document.getElementById('discountInput');
    const taxInput = document.getElementById('taxInput');
    if (discInput) discInput.value = 0;
    if (taxInput) taxInput.value = 0;

    this.updateDiscountTaxUI();
    this.renderCart();
  }

  // Calculate totals
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
          <small>বারকোড স্ক্যান করুন অথবা তালিকা থেকে নির্বাচন করুন</small>
        </div>`;
    } else {
      cartList.innerHTML = this.cart.map(item => `
        <div class="cart-item">
          <div class="cart-item-top">
            <h5 class="cart-item-title" title="${item.product.name}">${item.product.name}</h5>
          </div>
          <div class="cart-item-bottom">
            <div class="cart-qty-wrap">
              <div class="cart-qty-controls">
                <button class="qty-btn" onclick="app.updateCartQty('${item.product.id}', -1)">-</button>
                <input type="number" class="qty-val-input" value="${item.quantity}" min="1" onchange="app.setCartQty('${item.product.id}', this.value)" onfocus="this.select()" title="কোয়ান্টিটি সরাসরি টাইপ করতে ক্লিক করুন">
                <button class="qty-btn" onclick="app.updateCartQty('${item.product.id}', 1)">+</button>
              </div>
              <span class="unit-price-breakdown">৳${item.product.price} × ${item.quantity}</span>
            </div>
            <div class="cart-item-price-actions">
              <span class="cart-item-subtotal">৳${item.subtotal}</span>
              <button class="btn-remove-item" onclick="app.removeFromCart('${item.product.id}')" title="আইটেম মুছুন"><i class="fa-solid fa-trash-can"></i></button>
            </div>
          </div>
        </div>
      `).join('');
    }

    // Calculations
    const totals = this.getCartTotals();
    document.getElementById('cartSubtotal').innerText = `৳${totals.subtotal.toFixed(2)}`;
    document.getElementById('cartGrandTotal').innerText = `৳${totals.grandTotal.toFixed(2)}`;

    // Enable/disable payment buttons
    const hasItems = this.cart.length > 0;
    document.getElementById('payCashBtn').disabled = !hasItems;
    document.getElementById('payEpayBtn').disabled = !hasItems;
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

    const saleRecord = {
      id: `INV-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}${String(new Date().getDate()).padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      customer: document.getElementById('customerSelect').value,
      items: this.cart.map(i => ({
        id: i.product.id,
        barcode: i.product.barcode,
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        subtotal: i.subtotal
      })),
      subtotal: totals.subtotal,
      discount: totals.discountAmount,
      tax: totals.taxAmount,
      grandTotal: totals.grandTotal,
      paymentMethod: 'CASH',
      paymentDetails: {
        cashReceived: tendered,
        changeGiven: change
      }
    };

    this.completeSale(saleRecord);
    this.closeModal('cashPaymentModal');
  }

  // E-PAYMENT FLOW
  openEpayModal() {
    const totals = this.getCartTotals();
    document.getElementById('epayModalTotal').innerText = `৳${totals.grandTotal.toFixed(2)}`;
    document.getElementById('epayAccountInput').value = '';
    document.getElementById('epayTrxInput').value = `TRX${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    this.openModal('epayPaymentModal');
  }

  processEpayPayment() {
    const totals = this.getCartTotals();
    const accountNo = document.getElementById('epayAccountInput').value.trim() || '017XXXXXXXX';
    const trxId = document.getElementById('epayTrxInput').value.trim() || `TRX${Date.now()}`;

    const saleRecord = {
      id: `INV-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}${String(new Date().getDate()).padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      customer: document.getElementById('customerSelect').value,
      items: this.cart.map(i => ({
        id: i.product.id,
        barcode: i.product.barcode,
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        subtotal: i.subtotal
      })),
      subtotal: totals.subtotal,
      discount: totals.discountAmount,
      tax: totals.taxAmount,
      grandTotal: totals.grandTotal,
      paymentMethod: 'EPAY',
      paymentDetails: {
        provider: this.selectedEpayProvider,
        accountNo: accountNo,
        trxId: trxId
      }
    };

    this.completeSale(saleRecord);
    this.closeModal('epayPaymentModal');
  }

  // Complete & Record Sale Transaction
  completeSale(saleRecord) {
    // 1. Deduct Stock
    saleRecord.items.forEach(item => {
      const prod = this.products.find(p => p.id === item.id);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
      }
    });

    // 2. Save Data
    this.sales.unshift(saleRecord);
    localStorage.setItem('pos_products', JSON.stringify(this.products));
    localStorage.setItem('pos_sales', JSON.stringify(this.sales));

    // 3. Play success sound & trigger confetti celebration!
    this.playAudioBeep('success');
    if (window.confetti) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
    }

    // 4. Update UI
    this.renderProducts();
    this.renderInventory();
    this.renderSalesHistory();

    // 5. Open Thermal Receipt Modal
    this.showReceiptModal(saleRecord);

    // 6. Clear Cart
    this.clearCart();
  }

  // Thermal Receipt Generator
  showReceiptModal(saleRecord) {
    document.getElementById('rcptInvId').innerText = saleRecord.id;
    document.getElementById('rcptDate').innerText = new Date(saleRecord.timestamp).toLocaleString('bn-BD');
    document.getElementById('rcptCustomer').innerText = saleRecord.customer;

    // Items table
    const itemsBody = document.getElementById('rcptItemsBody');
    itemsBody.innerHTML = saleRecord.items.map(i => `
      <tr>
        <td>${i.name}</td>
        <td>${i.quantity} × ৳${i.price}</td>
        <td class="text-right">৳${i.subtotal}</td>
      </tr>
    `).join('');

    document.getElementById('rcptSubtotal').innerText = `৳${saleRecord.subtotal.toFixed(2)}`;
    document.getElementById('rcptDiscount').innerText = `-৳${saleRecord.discount.toFixed(2)}`;
    document.getElementById('rcptTax').innerText = `+৳${saleRecord.tax.toFixed(2)}`;
    document.getElementById('rcptGrandTotal').innerText = `৳${saleRecord.grandTotal.toFixed(2)}`;
    document.getElementById('rcptMethod').innerText = saleRecord.paymentMethod === 'CASH' ? 'নগদ (CASH)' : `ই-পে (${saleRecord.paymentDetails.provider})`;

    const payRow = document.getElementById('rcptPayDetailsRow');
    const changeRow = document.getElementById('rcptChangeRow');

    if (saleRecord.paymentMethod === 'CASH') {
      payRow.innerHTML = `<span>প্রাপ্ত নগদ:</span><span>৳${saleRecord.paymentDetails.cashReceived.toFixed(2)}</span>`;
      changeRow.innerHTML = `<span>ফেরত টাকা:</span><span>৳${saleRecord.paymentDetails.changeGiven.toFixed(2)}</span>`;
      payRow.style.display = 'flex';
      changeRow.style.display = 'flex';
    } else {
      payRow.innerHTML = `<span>TrxID:</span><span>${saleRecord.paymentDetails.trxId}</span>`;
      changeRow.style.display = 'none';
    }

    // Render Barcode
    JsBarcode("#rcptBarcodeSvg", saleRecord.id, {
      format: "CODE128",
      width: 1.8,
      height: 48,
      displayValue: true,
      fontSize: 13,
      fontOptions: "bold",
      font: "monospace",
      margin: 8,
      background: "#ffffff",
      lineColor: "#000000"
    });

    this.openModal('receiptModal');
  }

  // Camera Scanner Setup using html5-qrcode
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
      (errorMessage) => {
        // quiet scanning errors
      }
    ).catch(err => {
      console.error("Camera access error:", err);
      this.showToast("ক্যামেরা অন করা সম্ভব হয়নি!", "error");
    });
  }

  stopCameraScanner() {
    if (this.html5QrcodeScanner && this.html5QrcodeScanner.isScanning) {
      this.html5QrcodeScanner.stop().catch(err => console.error(err));
    }
  }

  // Inventory & Barcode Table Rendering
  renderInventory() {
    const tbody = document.getElementById('inventoryTableBody');
    tbody.innerHTML = this.products.map(p => `
      <tr>
        <td>
          <img src="${p.image}" width="40" height="40" style="border-radius:6px; object-fit:cover;">
        </td>
        <td><strong style="font-family:monospace;">${p.barcode}</strong></td>
        <td><strong>${p.name}</strong></td>
        <td><span class="cat-pill" style="font-size:0.75rem; padding: 2px 8px;">${p.category}</span></td>
        <td>৳${p.price}</td>
        <td>
          <span style="color: ${p.stock <= 10 ? 'var(--accent-red)' : 'var(--accent-green)'}; font-weight: bold;">
            ${p.stock} ${p.unit}
          </span>
        </td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="app.openBarcodeStickerModal('${p.id}')" title="বারকোড প্রিন্ট করুন">
            <i class="fa-solid fa-barcode"></i> স্টিকার
          </button>
          <button class="btn btn-secondary btn-sm" onclick="app.editProduct('${p.id}')" title="সম্পাদনা">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="app.deleteProduct('${p.id}')" title="মুছে ফেলুন">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  // Open Barcode Sticker Modal for printing
  openBarcodeStickerModal(productId) {
    const prod = this.products.find(p => p.id === productId);
    if (!prod) return;

    document.getElementById('stickerProdName').innerText = prod.name;
    document.getElementById('stickerProdPrice').innerText = `৳${prod.price}.00`;

    JsBarcode("#barcodeStickerSvg", prod.barcode, {
      format: "CODE128",
      width: 2,
      height: 60,
      displayValue: true,
      fontSize: 14
    });

    this.openModal('barcodePrintModal');
  }

  // Add/Edit Product Modal Logic
  editProduct(id) {
    const prod = this.products.find(p => p.id === id);
    if (!prod) return;

    document.getElementById('productModalTitle').innerText = 'প্রোডাক্ট সম্পাদনা করুন';
    document.getElementById('prodFormId').value = prod.id;
    document.getElementById('prodFormName').value = prod.name;
    document.getElementById('prodFormBarcode').value = prod.barcode;
    document.getElementById('prodFormCategory').value = prod.category;
    document.getElementById('prodFormPrice').value = prod.price;
    document.getElementById('prodFormCost').value = prod.cost || '';
    document.getElementById('prodFormStock').value = prod.stock;
    document.getElementById('prodFormImage').value = prod.image;

    this.openModal('productModal');
  }

  deleteProduct(id) {
    if (confirm('আপনি কি নিশ্চিত যে পণ্যটি মুছে ফেলতে চান?')) {
      this.products = this.products.filter(p => p.id !== id);
      localStorage.setItem('pos_products', JSON.stringify(this.products));
      this.renderProducts();
      this.renderInventory();
      this.showToast('প্রোডাক্ট মুছে ফেলা হয়েছে');
    }
  }

  saveProductForm(e) {
    e.preventDefault();
    const id = document.getElementById('prodFormId').value;
    const name = document.getElementById('prodFormName').value.trim();
    const barcode = document.getElementById('prodFormBarcode').value.trim();
    const category = document.getElementById('prodFormCategory').value;
    const price = parseFloat(document.getElementById('prodFormPrice').value);
    const cost = parseFloat(document.getElementById('prodFormCost').value) || (price * 0.8);
    const stock = parseInt(document.getElementById('prodFormStock').value);
    const image = document.getElementById('prodFormImage').value.trim() || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80';

    if (id) {
      // Edit
      const prod = this.products.find(p => p.id === id);
      if (prod) {
        prod.name = name;
        prod.barcode = barcode;
        prod.category = category;
        prod.price = price;
        prod.cost = cost;
        prod.stock = stock;
        prod.image = image;
      }
    } else {
      // Add New
      const newProd = {
        id: `PROD-${Date.now()}`,
        barcode, name, category, price, cost, stock, unit: 'pcs', image
      };
      this.products.unshift(newProd);
    }

    localStorage.setItem('pos_products', JSON.stringify(this.products));
    this.renderProducts();
    this.renderInventory();
    this.closeModal('productModal');
    this.showToast('প্রোডাক্ট সফলভাবে সংরক্ষিত হয়েছে!');
  }

  // Sales History Table
  renderSalesHistory() {
    const tbody = document.getElementById('salesTableBody');
    const searchVal = document.getElementById('salesSearchInput').value.toLowerCase().trim();

    const filtered = this.sales.filter(s => 
      s.id.toLowerCase().includes(searchVal) || s.customer.toLowerCase().includes(searchVal)
    );

    tbody.innerHTML = filtered.map(s => `
      <tr>
        <td><strong style="color:var(--accent-blue);">${s.id}</strong></td>
        <td>${new Date(s.timestamp).toLocaleString('bn-BD')}</td>
        <td>${s.customer}</td>
        <td>${s.items.reduce((acc, i) => acc + i.quantity, 0)} টি</td>
        <td>
          <span class="badge" style="background: ${s.paymentMethod === 'CASH' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)'}; color: ${s.paymentMethod === 'CASH' ? 'var(--accent-green)' : 'var(--accent-blue)'};">
            ${s.paymentMethod}
          </span>
        </td>
        <td><strong>৳${s.grandTotal.toFixed(2)}</strong></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="app.reprintReceipt('${s.id}')">
            <i class="fa-solid fa-receipt"></i> মেমো দেখুন
          </button>
        </td>
      </tr>
    `).join('');
  }

  reprintReceipt(invoiceId) {
    const sale = this.sales.find(s => s.id === invoiceId);
    if (sale) {
      this.showReceiptModal(sale);
    }
  }

  // Analytics Dashboard & Chart.js Integration
  updateDashboardStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

    const todaySales = this.sales.filter(s => {
      const saleTime = new Date(s.timestamp).getTime();
      return !isNaN(saleTime) && saleTime >= todayStart && saleTime <= todayEnd;
    });

    const totalTodayRevenue = todaySales.reduce((sum, s) => sum + s.grandTotal, 0);
    const lowStockCount = this.products.filter(p => p.stock <= 10).length;

    document.getElementById('statTodaySales').innerText = `৳${totalTodayRevenue.toFixed(2)}`;
    document.getElementById('statOrderCount').innerText = this.sales.length;
    document.getElementById('statProductCount').innerText = this.products.length;
    document.getElementById('statLowStock').innerText = lowStockCount;

    this.renderCharts();
  }

  initCharts() {
    // 1. Sales by Category Bar Chart
    const ctxCat = document.getElementById('categoryChart').getContext('2d');
    this.categoryChart = new Chart(ctxCat, {
      type: 'bar',
      data: {
        labels: ['Snacks', 'Grocery', 'Beverages', 'Spices', 'Personal Care', 'Dairy'],
        datasets: [{
          label: 'মোট বিক্রি (BDT ৳)',
          data: [1200, 2400, 1800, 950, 600, 1400],
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
          x: {
            grid: { display: false },
            ticks: { color: '#cbd5e1', font: { family: "'Inter', sans-serif", size: 11, weight: '500' } }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: {
              color: '#9ca3af',
              font: { family: "'Inter', sans-serif", size: 11 },
              callback: (v) => '৳' + v
            }
          }
        }
      }
    });

    // 2. Payment Method Pie Chart
    const ctxPay = document.getElementById('paymentMethodChart').getContext('2d');
    this.paymentChart = new Chart(ctxPay, {
      type: 'doughnut',
      data: {
        labels: ['ক্যাশ (Cash)', 'ই-পে (E-Pay / bKash/Nagad)'],
        datasets: [{
          data: [65, 35],
          backgroundColor: ['#10b981', '#3b82f6'],
          hoverBackgroundColor: ['#059669', '#2563eb'],
          borderWidth: 0
        }]
      },
      options: {
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
                const total = (ctx.dataset.data || []).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
                return ` ${ctx.label}: ৳${val.toFixed(2)} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  renderCharts() {
    if (!this.categoryChart || !this.paymentChart) return;

    // Calculate dynamic stats from actual sales
    const catMap = {};
    let cashTotal = 0;
    let epayTotal = 0;

    this.sales.forEach(s => {
      if (s.paymentMethod === 'CASH') cashTotal += s.grandTotal;
      else epayTotal += s.grandTotal;

      s.items.forEach(item => {
        const prod = this.products.find(p => p.id === item.id);
        const cat = prod ? prod.category : 'General';
        catMap[cat] = (catMap[cat] || 0) + item.subtotal;
      });
    });

    const catLabels = Object.keys(catMap);
    const catValues = Object.values(catMap);

    if (catLabels.length > 0) {
      this.categoryChart.data.labels = catLabels;
      this.categoryChart.data.datasets[0].data = catValues;
      this.categoryChart.update();
    }

    if (cashTotal > 0 || epayTotal > 0) {
      this.paymentChart.data.datasets[0].data = [cashTotal, epayTotal];
      this.paymentChart.update();
    }
  }

  // Modal Controls
  openModal(id) {
    document.getElementById(id).classList.add('active');
  }

  closeModal(id) {
    document.getElementById(id).classList.remove('active');
    if (id === 'scannerModal') {
      this.stopCameraScanner();
    }
  }

  // Event Listeners Binding
  initEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    // Theme Toggle
    document.getElementById('themeToggleBtn').addEventListener('click', () => {
      const html = document.documentElement;
      const cur = html.getAttribute('data-theme');
      const next = cur === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      document.getElementById('themeToggleBtn').innerHTML = next === 'dark' ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
      localStorage.setItem('pos_theme', next);
      try {
        const s = JSON.parse(localStorage.getItem('pos_settings')) || {};
        s.defaultTheme = next;
        localStorage.setItem('pos_settings', JSON.stringify(s));
      } catch(e) {}
    });

    // Sound Toggle
    document.getElementById('soundToggleBtn').addEventListener('click', () => {
      this.soundEnabled = !this.soundEnabled;
      const btn = document.getElementById('soundToggleBtn');
      btn.innerHTML = this.soundEnabled ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
      btn.style.color = this.soundEnabled ? 'var(--text-main)' : 'var(--accent-red)';
    });

    // Camera Scan Modal Trigger
    document.getElementById('cameraScanBtn').addEventListener('click', () => this.openCameraScanner());

    // Clear Cart Header
    document.getElementById('clearCartHeaderBtn').addEventListener('click', () => {
      if (this.cart.length > 0 && confirm('আপনি কি নিশ্চিত যে পুরো কার্ট খালি করতে চান?')) {
        this.clearCart();
      }
    });

    // Product Search Input
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

    // Barcode Test Simulation Button
    document.getElementById('simulateBarcodeBtn').addEventListener('click', () => {
      const randomProd = this.products[Math.floor(Math.random() * this.products.length)];
      this.handleBarcodeScan(randomProd.barcode);
    });

    // Category Filter Pills
    document.getElementById('categoriesBar').addEventListener('click', (e) => {
      if (e.target.classList.contains('cat-pill')) {
        document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        this.activeCategory = e.target.dataset.cat;
        this.renderProducts();
      }
    });

    // Cart Discount & Tax Inputs
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

    // Cash Payment Trigger
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

    // E-Pay Payment Trigger
    document.getElementById('payEpayBtn').addEventListener('click', () => this.openEpayModal());
    document.querySelectorAll('.epay-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.epay-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.selectedEpayProvider = card.dataset.provider;
      });
    });
    document.getElementById('confirmEpayBtn').addEventListener('click', () => this.processEpayPayment());

    // Receipt Print Button
    document.getElementById('printReceiptBtn').addEventListener('click', () => {
      this.playInModalReceiptPrint('printableReceipt');
    });

    // Sticker Print Button
    document.getElementById('printStickersBtn').addEventListener('click', () => {
      window.print();
    });

    // Add Product Modal Trigger
    document.getElementById('addNewProductBtn').addEventListener('click', () => {
      document.getElementById('productForm').reset();
      document.getElementById('prodFormId').value = '';
      document.getElementById('productModalTitle').innerText = 'নতুন প্রোডাক্ট যোগ করুন';
      this.openModal('productModal');
    });

    // Auto Barcode Generator in Form
    document.getElementById('genRandomBarcodeBtn').addEventListener('click', () => {
      const randomEan = '894' + Math.floor(100000000 + Math.random() * 900000000);
      document.getElementById('prodFormBarcode').value = randomEan;
    });

    document.getElementById('productForm').addEventListener('submit', (e) => this.saveProductForm(e));

    // Sales Table Search
    document.getElementById('salesSearchInput').addEventListener('input', () => this.renderSalesHistory());

    // Modal Close Buttons (x and background clicks)
    document.querySelectorAll('.close-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) this.closeModal(modal.id);
      });
    });

    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal(modal.id);
      });
    });
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

    const duration = 2200;
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
        if (statusText) statusText.innerText = '✅ প্রিন্ট সম্পন্ন!';

        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }

        if (window.printHub && window.printHub.playSuccessBeep) {
          window.printHub.playSuccessBeep();
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

    const invId = document.getElementById('rcptInvId')?.innerText || 'INV-000';

    if (typeof JsBarcode !== 'undefined') {
      try {
        JsBarcode("#rcptBarcodeSvg", invId, { format: "CODE128", width: 1.8, height: 48, displayValue: true, fontSize: 13, fontOptions: "bold", font: "monospace", margin: 8, background: "#ffffff", lineColor: "#000000" });
      } catch(e) {}
    }

    const opt = {
      margin: [4, 4, 4, 4],
      filename: `Memo_${invId.replace(/[^a-zA-Z0-9_\-]/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: [80, 190], orientation: 'portrait' }
    };

    if (window.html2pdf) {
      window.html2pdf().set(opt).from(paperEl).save();
      this.showToast('PDF ইনভয়েস বারকোড সহ ডাউনলোড সম্পন্ন হয়েছে!');
    } else {
      window.print();
    }
  }
}

// Global App Instance
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new POSApp();
});
