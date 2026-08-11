// Smart POS - Merchant Admin & Warehouse Manager Logic

class AdminPanel {
  constructor() {
    this.products = JSON.parse(localStorage.getItem('pos_products')) || (typeof INITIAL_PRODUCTS !== 'undefined' ? INITIAL_PRODUCTS : []);
    this.sales = JSON.parse(localStorage.getItem('pos_sales')) || (typeof INITIAL_SALES !== 'undefined' ? INITIAL_SALES : []);
    this.settings = JSON.parse(localStorage.getItem('pos_settings')) || (typeof DEFAULT_SETTINGS !== 'undefined' ? DEFAULT_SETTINGS : {});
    if (this.settings) {
      if (!this.settings.storeName || /[\u0980-\u09FF]/.test(this.settings.storeName)) this.settings.storeName = 'Super Shop Dhaka';
      if (!this.settings.storeAddress || /[\u0980-\u09FF]/.test(this.settings.storeAddress)) this.settings.storeAddress = 'Mirpur 10, Dhaka - 1216';
      if (!this.settings.receiptFooterNote || /[\u0980-\u09FF]/.test(this.settings.receiptFooterNote)) this.settings.receiptFooterNote = 'Thank you! Come again.';
      localStorage.setItem('pos_settings', JSON.stringify(this.settings));
    }
    this.categories = JSON.parse(localStorage.getItem('pos_categories')) || (typeof INITIAL_CATEGORIES !== 'undefined' ? INITIAL_CATEGORIES : []);
    this.coupons = JSON.parse(localStorage.getItem('pos_coupons')) || (typeof INITIAL_COUPONS !== 'undefined' ? INITIAL_COUPONS : []);
    this.customers = JSON.parse(localStorage.getItem('pos_customers')) || (typeof INITIAL_CUSTOMERS !== 'undefined' ? INITIAL_CUSTOMERS : []);
    if (!localStorage.getItem('pos_coupons') && typeof INITIAL_COUPONS !== 'undefined') {
      localStorage.setItem('pos_coupons', JSON.stringify(INITIAL_COUPONS));
    }
    if (!localStorage.getItem('pos_customers') && typeof INITIAL_CUSTOMERS !== 'undefined') {
      localStorage.setItem('pos_customers', JSON.stringify(INITIAL_CUSTOMERS));
    }
    
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

    // Real-time storage sync across tabs/windows
    window.addEventListener('storage', () => {
      this.products = JSON.parse(localStorage.getItem('pos_products')) || (typeof INITIAL_PRODUCTS !== 'undefined' ? INITIAL_PRODUCTS : []);
      this.sales = JSON.parse(localStorage.getItem('pos_sales')) || (typeof INITIAL_SALES !== 'undefined' ? INITIAL_SALES : []);
      this.settings = JSON.parse(localStorage.getItem('pos_settings')) || (typeof DEFAULT_SETTINGS !== 'undefined' ? DEFAULT_SETTINGS : {});
      this.categories = JSON.parse(localStorage.getItem('pos_categories')) || (typeof INITIAL_CATEGORIES !== 'undefined' ? INITIAL_CATEGORIES : []);
      this.coupons = JSON.parse(localStorage.getItem('pos_coupons')) || (typeof INITIAL_COUPONS !== 'undefined' ? INITIAL_COUPONS : []);
      this.customers = JSON.parse(localStorage.getItem('pos_customers')) || (typeof INITIAL_CUSTOMERS !== 'undefined' ? INITIAL_CUSTOMERS : []);
      this.updateSidebarStoreProfile();
      this.populateCategoryDropdowns();
      this.renderCoupons();
      this.renderAdminCustomers();
      this.refreshCurrentView();
    });
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
      'adminCustomers': 'adminCustomers',
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

    const currentDayOfWeek = now.getDay(); // 0 = Sun
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

  // 1. DASHBOARD ANALYTICS (7 KPI METRICS IN EXACT ORDER)
  renderDashboard() {
    const filteredSales = this.getFilteredSales();
    const grossRevenue = filteredSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    const totalOrders = filteredSales.length;

    let cashTotal = 0;
    let epayTotal = 0;
    let totalItemsSold = 0;
    let totalNetProfit = 0;

    filteredSales.forEach(s => {
      // Payment Breakdown
      if (s.paymentMethod === 'epay' || (s.paymentDetails && s.paymentDetails.method === 'epay')) {
        epayTotal += (s.grandTotal || 0);
      } else {
        cashTotal += (s.grandTotal || 0);
      }

      // Items Sold & Profit Breakdown
      if (s.items && Array.isArray(s.items)) {
        s.items.forEach(item => {
          const qty = item.quantity || 1;
          const cost = item.cost !== undefined ? item.cost : (item.price * 0.8);
          const price = item.price || 0;
          
          totalItemsSold += qty;

          const itemRev = item.subtotal || (price * qty);
          const itemCostTotal = cost * qty;
          totalNetProfit += (itemRev - itemCostTotal);
        });
      }
    });

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
    const elRevenue = document.getElementById('statRevenue');
    const elProfit = document.getElementById('statNetProfit');
    const elBannerBadge = document.getElementById('bannerLowStockBadge');

    if (elGross) elGross.innerText = `৳${grossRevenue.toFixed(2)}`;
    if (elCash) elCash.innerText = `৳${cashTotal.toFixed(2)}`;
    if (elEpay) elEpay.innerText = `৳${epayTotal.toFixed(2)}`;
    if (elOrders) elOrders.innerText = `${totalOrders} টি`;
    if (elItem) elItem.innerText = `${totalItemsSold} টি`;
    if (elRevenue) elRevenue.innerText = `৳${grossRevenue.toFixed(2)}`;
    if (elProfit) elProfit.innerText = `৳${totalNetProfit.toFixed(2)}`;
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
      if (this.categoryChart) this.categoryChart.destroy();
      this.categoryChart = new Chart(catCanvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: catLabels.length > 0 ? catLabels : ['কোনো ডেটা নেই'],
          datasets: [{
            label: 'বিক্রি (৳)',
            data: catData.length > 0 ? catData : [0],
            backgroundColor: 'rgba(16, 185, 129, 0.75)',
            borderColor: '#10b981',
            borderWidth: 1,
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

    let cashTotal = 0;
    let epayTotal = 0;
    salesList.forEach(s => {
      if (s.paymentMethod === 'epay' || (s.paymentDetails && s.paymentDetails.method === 'epay')) {
        epayTotal += (s.grandTotal || 0);
      } else {
        cashTotal += (s.grandTotal || 0);
      }
    });

    const payCanvas = document.getElementById('adminPaymentChart');
    if (payCanvas) {
      if (this.paymentChart) this.paymentChart.destroy();
      this.paymentChart = new Chart(payCanvas.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['ক্যাশ পেমেন্ট', 'ডিজিটাল ই-পে'],
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
    const prod = this.products.find(p => p.id === prodId);
    if (!prod) return;
    const variant = (prod.variants || []).find(v => v.variantId === variantId);

    // 1. Switch to Barcode Generator tab in left-side menu
    this.switchTab('adminBarcodes');

    // 2. Select product & variant and set custom copy count
    setTimeout(() => {
      const prodSelect = document.getElementById('barcodeProdSelect');
      const variantSelect = document.getElementById('barcodeVariantSelect');
      const modeSelect = document.getElementById('barcodePrintModeSelect');
      const customGrp = document.getElementById('barcodeCustomCountGroup');
      const countInput = document.getElementById('barcodeBatchCount');

      if (prodSelect) {
        prodSelect.value = prodId;
        this.onBarcodeProductChange();

        if (variantSelect && variantId) {
          variantSelect.value = variantId;
        }

        if (modeSelect) {
          modeSelect.value = 'custom';
          if (customGrp) customGrp.style.display = 'block';
        }

        if (countInput) {
          countInput.value = variant ? Math.max(1, Math.min(variant.stock || 6, 50)) : 6;
          countInput.focus();
          countInput.select();
        }

        this.renderBarcodeBatchPreview();

        const vName = variant ? ` (${variant.color || ''} ${variant.size || ''})` : '';
        this.showToast(`'${prod.name}${vName}' বারকোড জেনারেটরে সেট হয়েছে! স্টিকার সংখ্যা কাস্টমাইজ করে প্রিন্ট বাটনে ক্লিক করুন।`);
      }
    }, 100);
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
      const imgUrl = c.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80';
      const desc = c.description || `${c.name} ক্যাটাগরির মানসম্মত পণ্যসমূহ`;

      html += `
        <div class="category-card-sq" onclick="admin.filterByVariantCategory('${c.name}')">
          <div class="category-card-sq-imgwrap">
            <img src="${imgUrl}" class="category-card-sq-img" alt="${c.bnName || c.name}" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'><rect width=\'100\' height=\'100\' fill=\'%231e293b\'/><text x=\'50%\' y=\'50%\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%2394a3b8\' font-family=\'sans-serif\' font-size=\'12\'>No Image</text></svg>'">
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
            <img src="${p.image}" alt="${p.name}" style="width:44px; height:44px; border-radius:10px; object-fit:cover;" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'><rect width=\'100\' height=\'100\' fill=\'%231e293b\'/><text x=\'50%\' y=\'50%\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%2394a3b8\' font-family=\'sans-serif\' font-size=\'12\'>No Image</text></svg>'">
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
    const image = document.getElementById('prodFormImage').value.trim() || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80';

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
        const prodSelect = document.getElementById('barcodeProdSelect');
        if (prodSelect) {
          prodSelect.value = targetProdId;
          this.renderBarcodeBatchPreview();
        }
      }, 200);
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
        cat.image = imgUrl || cat.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80';
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
        image: imgUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
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
        const prodSelect = document.getElementById('barcodeProdSelect');
        if (prodSelect) {
          prodSelect.value = prodId;
          this.onBarcodeProductChange(true);
        }
      }, 200);
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

    if (prodSelect) {
      prodSelect.addEventListener('change', () => {
        this.activeRestockContext = null;
        this.onBarcodeProductChange();
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
    if (paperFormatSelect) paperFormatSelect.addEventListener('change', () => this.renderBarcodeBatchPreview());
    if (modeSelect) {
      modeSelect.addEventListener('change', () => {
        const customGrp = document.getElementById('barcodeCustomCountGroup');
        if (customGrp) customGrp.style.display = modeSelect.value === 'custom' ? 'block' : 'none';
        this.renderBarcodeBatchPreview();
      });
    }
    if (customInput) customInput.addEventListener('input', () => this.renderBarcodeBatchPreview());
  }

  initBarcodeGeneratorOptions() {
    const prodSelect = document.getElementById('barcodeProdSelect');
    if (!prodSelect) return;

    prodSelect.innerHTML = this.products.map(p => `<option value="${p.id}">${p.name} (${p.category})</option>`).join('');
    this.onBarcodeProductChange();
  }

  onBarcodeProductChange(fromRestock = false) {
    const prodId = document.getElementById('barcodeProdSelect')?.value;
    const prod = this.products.find(p => p.id === prodId);
    const variantSelect = document.getElementById('barcodeVariantSelect');

    if (variantSelect && prod) {
      variantSelect.innerHTML = `<option value="ALL">সকল ভেরিয়েন্ট (All Variants)</option>` + 
        (prod.variants || []).map(v => `<option value="${v.variantId}">${v.color || 'Std'} - ${v.size || 'N/A'} (৳${v.price})</option>`).join('');

      if (fromRestock && this.activeRestockContext && this.activeRestockContext.prodId === prodId) {
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

    let html = '';
    let svgIndex = 0;

    targetVariants.forEach(v => {
      const copyCount = getCopyCount(v);
      const mrpText = (v.mrp && v.mrp > v.price) ? `<del style="font-size:0.75rem; color:#666;">৳${v.mrp}</del> ` : '';
      const nameStr = prod.name || '';
      const len = nameStr.trim().length;
      let fontStyling = 'font-size:0.8rem; font-weight:800; line-height:1.15;';
      if (len > 32) {
        fontStyling = 'font-size:0.64rem; font-weight:600; line-height:1.1;';
      } else if (len > 22) {
        fontStyling = 'font-size:0.71rem; font-weight:700; line-height:1.12;';
      }

      for (let i = 0; i < copyCount; i++) {
        html += `
          <div class="barcode-sticker-card" style="width:190px; max-width:100%; box-sizing:border-box; padding:10px 8px; background:#fff; color:#000; border-radius:10px; text-align:center; border:1px solid #d1d5db; box-shadow:0 3px 10px rgba(0,0,0,0.12); overflow:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center;">
            <div style="${fontStyling} width:100%; text-align:center; color:#111827; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; word-break:break-word; word-wrap:break-word;">${prod.name}</div>
            <div style="font-size:0.72rem; font-weight:600; color:#4b5563; margin-top:2px;">${v.color || ''} ${v.size ? '| ' + v.size : ''}</div>
            <div style="width:100%; overflow:hidden; display:flex; justify-content:center; margin:4px 0;">
              <svg id="bcSvg_${svgIndex}" style="max-width:100%; height:auto; display:block; margin:0 auto; shape-rendering:crispEdges;"></svg>
            </div>
            <div style="font-size:0.9rem; font-weight:800; color:#000; margin-top:2px;">
              মূল্য: ${mrpText}৳${v.price}
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
              width: 1.35,
              height: 38,
              fontSize: 10,
              fontOptions: "bold",
              font: "monospace",
              margin: 2,
              background: "#ffffff",
              lineColor: "#000000",
              displayValue: true
            });
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
    const selectedFormat = paperFormatSelect ? paperFormatSelect.value : 'sticker_50x30';

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

  // 8. SALES LOG & AUDIT REPORT
  renderSalesLog() {
    const tbody = document.getElementById('adminSalesTableBody');
    if (!tbody) return;

    if (this.sales.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center p-4">কোনো বিক্রি ইতিহাস রেকর্ড পাওয়া যায়নি</td></tr>`;
      return;
    }

    tbody.innerHTML = this.sales.map(s => `
      <tr>
        <td><strong>${s.id}</strong></td>
        <td>${new Date(s.timestamp).toLocaleString('bn-BD')}</td>
        <td>${s.customer}</td>
        <td>
          <span class="badge" style="background:${s.paymentMethod === 'CASH' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)'}; color:${s.paymentMethod === 'CASH' ? 'var(--accent-green)' : 'var(--accent-blue)'};">
            ${s.paymentMethod}
          </span>
        </td>
        <td><strong>৳${s.grandTotal.toFixed(2)}</strong></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="admin.showReceiptModalById('${s.id}')">
            <i class="fa-solid fa-receipt"></i> মেমো
          </button>
        </td>
      </tr>
    `).join('');
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
        format: "CODE128", width: 1.5, height: 40, displayValue: false, margin: 0
      });
    }

    this.openModal('adminReceiptModal');
  }

  saveProducts() {
    localStorage.setItem('pos_products', JSON.stringify(this.products));
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

    // Theme toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const html = document.documentElement;
        const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
      });
    }

    // Product Image Device/Gallery File Upload Listener
    const prodUploadBtn = document.getElementById('prodFormUploadBtn');
    const prodFileInput = document.getElementById('prodFormFileInput');
    if (prodUploadBtn && prodFileInput) {
      prodUploadBtn.addEventListener('click', () => prodFileInput.click());
      prodFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const dataUrl = evt.target.result;
            document.getElementById('prodFormImage').value = dataUrl;
            document.getElementById('prodFormImgPreview').src = dataUrl;
            document.getElementById('prodImgFileName').innerText = file.name;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Category Image Device/Gallery File Upload Listener
    const catUploadBtn = document.getElementById('catFormUploadBtn');
    const catFileInput = document.getElementById('catFormFileInput');
    if (catUploadBtn && catFileInput) {
      catUploadBtn.addEventListener('click', () => catFileInput.click());
      catFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const dataUrl = evt.target.result;
            document.getElementById('catImgUrl').value = dataUrl;
            document.getElementById('catFormImgPreview').src = dataUrl;
            document.getElementById('catImgFileName').innerText = file.name;
          };
          reader.readAsDataURL(file);
        }
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
      adminPrintBtn.addEventListener('click', () => window.print());
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

    const cardRev = document.getElementById('adminCardRevenue');
    if (cardRev) cardRev.addEventListener('click', () => this.openGrossSalesModal());

    const cardNetProfit = document.getElementById('adminCardNetProfit');
    if (cardNetProfit) cardNetProfit.addEventListener('click', () => this.openNetProfitModal());

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
    const grossRevenue = this.sales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    const totalOrders = this.sales.length;
    const avgOrder = totalOrders > 0 ? grossRevenue / totalOrders : 0;

    let cashTotal = 0;
    let epayTotal = 0;

    this.sales.forEach(s => {
      if (s.paymentMethod === 'epay' || (s.paymentDetails && s.paymentDetails.method === 'epay')) {
        epayTotal += (s.grandTotal || 0);
      } else {
        cashTotal += (s.grandTotal || 0);
      }
    });

    const cashPct = grossRevenue > 0 ? Math.round((cashTotal / grossRevenue) * 100) : 0;
    const epayPct = grossRevenue > 0 ? Math.round((epayTotal / grossRevenue) * 100) : 0;

    const elTotal = document.getElementById('modalGrossSalesTotal');
    const elOrders = document.getElementById('modalGrossOrdersCount');
    const elAvg = document.getElementById('modalGrossAvgOrder');
    const elCash = document.getElementById('modalGrossCashTotal');
    const elCashPct = document.getElementById('modalGrossCashPct');
    const elEpay = document.getElementById('modalGrossEpayTotal');
    const elEpayPct = document.getElementById('modalGrossEpayPct');

    if (elTotal) elTotal.innerText = `৳${grossRevenue.toFixed(2)}`;
    if (elOrders) elOrders.innerText = `${totalOrders} টি`;
    if (elAvg) elAvg.innerText = `৳${avgOrder.toFixed(2)}`;
    if (elCash) elCash.innerText = `৳${cashTotal.toFixed(2)}`;
    if (elCashPct) elCashPct.innerText = `${cashPct}%`;
    if (elEpay) elEpay.innerText = `৳${epayTotal.toFixed(2)}`;
    if (elEpayPct) elEpayPct.innerText = `${epayPct}%`;

    const recentBody = document.getElementById('modalGrossRecentInvoicesBody');
    if (recentBody) {
      const recentSales = [...this.sales].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
      if (recentSales.length === 0) {
        recentBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 1.5rem;">কোনো অর্ডারের ইতিহাস পাওয়া যায়নি।</td></tr>`;
      } else {
        recentBody.innerHTML = recentSales.map(s => `
          <tr>
            <td><strong>${s.id}</strong></td>
            <td><small>${new Date(s.timestamp).toLocaleString('bn-BD')}</small></td>
            <td>${s.customer || 'Walk-in Customer'}</td>
            <td><span class="badge" style="background: ${s.paymentMethod === 'epay' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)'}; color: ${s.paymentMethod === 'epay' ? '#3b82f6' : '#10b981'};">${s.paymentMethod === 'epay' ? 'ডিজিটাল ই-পে' : 'ক্যাশ'}</span></td>
            <td style="text-align: right; font-weight: 700; color: var(--accent-green);">৳${(s.grandTotal || 0).toFixed(2)}</td>
          </tr>
        `).join('');
      }
    }

    this.openModal('grossSalesModal');
  }

  openTotalOrdersModal() {
    const filteredSales = this.getFilteredSales();
    const totalRev = filteredSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);

    const elBadgeCount = document.getElementById('modalOrdersCountBadge');
    const elBadgeTotal = document.getElementById('modalOrdersTotalAmountBadge');
    if (elBadgeCount) elBadgeCount.innerText = `${filteredSales.length} টি মেমো`;
    if (elBadgeTotal) elBadgeTotal.innerText = `৳${totalRev.toFixed(2)}`;

    const tbody = document.getElementById('modalOrdersTableBody');
    if (tbody) {
      if (filteredSales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding: 1.5rem;">নির্বাচন করা সময়কালে কোনো মেমো পাওয়া যায়নি।</td></tr>`;
      } else {
        tbody.innerHTML = filteredSales.slice(-25).reverse().map(s => `
          <tr>
            <td><strong>${s.id}</strong></td>
            <td><small>${new Date(s.timestamp).toLocaleString('bn-BD')}</small></td>
            <td>${s.customer || 'Walk-in Customer'}</td>
            <td><span class="badge" style="background: ${s.paymentMethod === 'epay' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)'}; color: ${s.paymentMethod === 'epay' ? '#3b82f6' : '#10b981'};">${s.paymentMethod === 'epay' ? 'ডিজিটাল ই-পে' : 'ক্যাশ'}</span></td>
            <td>${(s.items || []).length} টি আইটেম</td>
            <td style="text-align: right; font-weight: 700; color: var(--accent-green);">৳${(s.grandTotal || 0).toFixed(2)}</td>
          </tr>
        `).join('');
      }
    }

    this.openModal('totalOrdersModal');
  }

  openCashPaymentModalDetails() {
    const filteredSales = this.getFilteredSales();
    const cashSales = filteredSales.filter(s => s.paymentMethod !== 'epay' && (!s.paymentDetails || s.paymentDetails.method !== 'epay'));
    const totalCash = cashSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);

    const elTotal = document.getElementById('modalCashTotalAmount');
    const elOrders = document.getElementById('modalCashOrdersCount');
    if (elTotal) elTotal.innerText = `৳${totalCash.toFixed(2)}`;
    if (elOrders) elOrders.innerText = `${cashSales.length} টি`;

    const tbody = document.getElementById('modalCashTableBody');
    if (tbody) {
      if (cashSales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted" style="padding: 1.5rem;">কোনো ক্যাশ পেমেন্ট ইনভয়েস পাওয়া যায়নি।</td></tr>`;
      } else {
        tbody.innerHTML = cashSales.slice(-25).reverse().map(s => `
          <tr>
            <td><strong>${s.id}</strong></td>
            <td><small>${new Date(s.timestamp).toLocaleString('bn-BD')}</small></td>
            <td>${s.customer || 'Walk-in Customer'}</td>
            <td style="text-align: right; font-weight: 700; color: var(--accent-purple);">৳${(s.grandTotal || 0).toFixed(2)}</td>
          </tr>
        `).join('');
      }
    }

    this.openModal('cashPaymentModalDetails');
  }

  openEpayPaymentModalDetails() {
    const filteredSales = this.getFilteredSales();
    const epaySales = filteredSales.filter(s => s.paymentMethod === 'epay' || (s.paymentDetails && s.paymentDetails.method === 'epay'));
    const totalEpay = epaySales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);

    const elTotal = document.getElementById('modalEpayTotalAmount');
    const elOrders = document.getElementById('modalEpayOrdersCount');
    if (elTotal) elTotal.innerText = `৳${totalEpay.toFixed(2)}`;
    if (elOrders) elOrders.innerText = `${epaySales.length} টি`;

    const tbody = document.getElementById('modalEpayTableBody');
    if (tbody) {
      if (epaySales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 1.5rem;">কোনো ডিজিটাল ই-পে ইনভয়েস পাওয়া যায়নি।</td></tr>`;
      } else {
        tbody.innerHTML = epaySales.slice(-25).reverse().map(s => {
          const provider = (s.paymentDetails && s.paymentDetails.provider) ? s.paymentDetails.provider.toUpperCase() : 'DIGITAL E-PAY';
          return `
            <tr>
              <td><strong>${s.id}</strong></td>
              <td><small>${new Date(s.timestamp).toLocaleString('bn-BD')}</small></td>
              <td><span class="badge" style="background: rgba(59,130,246,0.15); color: #3b82f6; font-weight: 700;"><i class="fa-solid fa-mobile-screen-button"></i> ${provider}</span></td>
              <td>${s.customer || 'Walk-in Customer'}</td>
              <td style="text-align: right; font-weight: 700; color: var(--accent-orange);">৳${(s.grandTotal || 0).toFixed(2)}</td>
            </tr>
          `;
        }).join('');
      }
    }

    this.openModal('epayPaymentModalDetails');
  }

  openTotalItemsSoldModal() {
    const filteredSales = this.getFilteredSales();
    const itemMap = {};
    let totalUnitsSold = 0;

    filteredSales.forEach(s => {
      if (s.items && Array.isArray(s.items)) {
        s.items.forEach(item => {
          const qty = item.quantity || 1;
          totalUnitsSold += qty;
          const key = item.id || item.name;

          if (!itemMap[key]) {
            const prod = this.products.find(p => p.id === item.id);
            itemMap[key] = {
              name: item.name,
              variant: (item.color || item.size) ? `${item.color || ''} ${item.size || ''}`.trim() : 'Standard',
              category: (prod && prod.category) ? prod.category : (item.category || 'অন্যান্য'),
              price: item.price || 0,
              quantity: 0,
              totalSubtotal: 0
            };
          }
          itemMap[key].quantity += qty;
          itemMap[key].totalSubtotal += (item.subtotal || (item.price * qty));
        });
      }
    });

    const itemsList = Object.values(itemMap);

    const elTotalUnits = document.getElementById('modalItemsSoldTotalCount');
    const elUniqueProds = document.getElementById('modalItemsSoldUniqueProducts');
    if (elTotalUnits) elTotalUnits.innerText = `${totalUnitsSold} টি`;
    if (elUniqueProds) elUniqueProds.innerText = `${itemsList.length} টি`;

    const renderTable = (query = '') => {
      const tbody = document.getElementById('modalItemsSoldTableBody');
      if (!tbody) return;

      const filtered = itemsList.filter(i => 
        !query || 
        i.name.toLowerCase().includes(query) || 
        i.category.toLowerCase().includes(query) ||
        i.variant.toLowerCase().includes(query)
      );

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 1.5rem;">কোনো বিক্রিত আইটেম ডাটা পাওয়া যায়নি।</td></tr>`;
      } else {
        tbody.innerHTML = filtered.sort((a, b) => b.quantity - a.quantity).map(item => `
          <tr>
            <td>
              <strong>${item.name}</strong><br>
              <small class="text-muted">(${item.variant})</small>
            </td>
            <td><span class="badge" style="background: rgba(59,130,246,0.15); color: #3b82f6;">${item.category}</span></td>
            <td><strong style="color: var(--accent-cyan); font-size: 1rem;">${item.quantity} টি</strong></td>
            <td>৳${item.price.toFixed(2)}</td>
            <td style="text-align: right; font-weight: 700; color: var(--accent-green);">৳${item.totalSubtotal.toFixed(2)}</td>
          </tr>
        `).join('');
      }
    };

    renderTable();

    const searchInput = document.getElementById('modalItemsSearchInput');
    if (searchInput) {
      searchInput.value = '';
      searchInput.oninput = (e) => renderTable(e.target.value.toLowerCase().trim());
    }

    this.openModal('totalItemsSoldModal');
  }

  openNetProfitModal() {
    const filteredSales = this.getFilteredSales();
    let totalSales = 0;
    let totalCost = 0;
    const itemProfits = {};

    filteredSales.forEach(sale => {
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

          const prod = this.products.find(p => p.id === item.id);
          const key = item.id || item.name;

          if (!itemProfits[key]) {
            itemProfits[key] = {
              name: item.name,
              variant: (item.color || item.size) ? `${item.color || ''} ${item.size || ''}`.trim() : 'Standard',
              category: (prod && prod.category) ? prod.category : (item.category || 'অন্যান্য'),
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

    const elSales = document.getElementById('modalProfitTotalSales');
    const elCost = document.getElementById('modalProfitTotalCost');
    const elNet = document.getElementById('modalProfitNetTotal');
    const elMargin = document.getElementById('modalProfitMarginPercent');

    if (elSales) elSales.innerText = `৳${totalSales.toFixed(2)}`;
    if (elCost) elCost.innerText = `৳${totalCost.toFixed(2)}`;
    if (elNet) elNet.innerText = `৳${netProfit.toFixed(2)}`;
    if (elMargin) elMargin.innerText = `${marginPct}%`;

    const statusBadge = document.getElementById('modalProfitStatusBadge');
    if (statusBadge) {
      if (marginPct >= 20) {
        statusBadge.className = 'badge bg-green';
        statusBadge.innerText = 'চমৎকার প্রফিট মার্জিন (> 20%)';
      } else if (marginPct >= 10) {
        statusBadge.className = 'badge bg-blue';
        statusBadge.innerText = 'সন্তোষজনক মার্জিন (10%-20%)';
      } else {
        statusBadge.className = 'badge bg-orange';
        statusBadge.innerText = 'স্বল্প মার্জিন (< 10%)';
      }
    }

    const itemsList = Object.values(itemProfits);

    const renderTable = () => {
      const tbody = document.getElementById('modalProfitTopItemsBody');
      if (!tbody) return;

      const query = (document.getElementById('modalProfitSearchInput')?.value || '').toLowerCase().trim();
      const sortMode = document.getElementById('modalProfitSortSelect')?.value || 'highest_profit';

      let list = itemsList.filter(i => 
        !query || 
        i.name.toLowerCase().includes(query) || 
        i.category.toLowerCase().includes(query) ||
        i.variant.toLowerCase().includes(query)
      );

      if (sortMode === 'highest_profit') {
        list.sort((a, b) => b.totalProfit - a.totalProfit);
      } else if (sortMode === 'highest_qty') {
        list.sort((a, b) => b.quantity - a.quantity);
      } else if (sortMode === 'lowest_profit') {
        list.sort((a, b) => a.totalProfit - b.totalProfit);
      }

      if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding: 1.5rem;">কোনো প্রোডাক্টের প্রফিট রেকর্ড পাওয়া যায়নি।</td></tr>`;
      } else {
        tbody.innerHTML = list.map(item => {
          const itemMargin = item.totalSales > 0 ? ((item.totalProfit / item.totalSales) * 100).toFixed(1) : 0;
          return `
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
                <br><small style="color: var(--text-muted);">${itemMargin}% মার্জিন</small>
              </td>
            </tr>
          `;
        }).join('');
      }
    };

    renderTable();

    const searchInput = document.getElementById('modalProfitSearchInput');
    const sortSelect = document.getElementById('modalProfitSortSelect');
    if (searchInput) {
      searchInput.value = '';
      searchInput.oninput = () => renderTable();
    }
    if (sortSelect) {
      sortSelect.onchange = () => renderTable();
    }

    this.openModal('netProfitModal');
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

  showReceiptModalById(id) {
    const sale = this.sales.find(s => s.id === id);
    if (!sale) return;

    const sym = (this.settings && this.settings.currencySymbol) || '৳';
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

    if (typeof JsBarcode !== 'undefined') {
      try {
        JsBarcode("#rcptBarcodeSvg", sale.id, { format: "CODE128", width: 1.8, height: 45, displayValue: false, margin: 0, background: "#ffffff", lineColor: "#000000" });
      } catch(e) {}
    }

    this.openModal('adminReceiptModal');

    setTimeout(() => {
      this.playInModalReceiptPrint('printableReceipt', false);
    }, 200);
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

    const pdfBtn = document.getElementById('adminRcptDownloadPdfBtn');
    if (pdfBtn) {
      pdfBtn.disabled = true;
      pdfBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Downloading PDF...';
    }

    const invId = document.getElementById('rcptInvId')?.innerText || 'INV-000';

    if (typeof JsBarcode !== 'undefined') {
      try {
        JsBarcode("#rcptBarcodeSvg", invId, { format: "CODE128", width: 1.8, height: 45, displayValue: false, margin: 0, background: "#ffffff", lineColor: "#000000" });
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

  updateSidebarStoreProfile() {
    const profileDiv = document.querySelector('.sidebar-footer .store-profile div');
    if (profileDiv && this.settings) {
      profileDiv.innerHTML = `
        <strong>${this.settings.storeName || 'Super Shop & Warehouse'}</strong>
        <small>Owner: ${this.settings.storeOwner || 'Md. Abdul Baqui'}</small>
      `;
    }
  }

  renderSettingsForm() {
    const s = this.settings || (typeof DEFAULT_SETTINGS !== 'undefined' ? DEFAULT_SETTINGS : {});
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined ? val : '';
    };

    setVal('settingStoreName', s.storeName || 'Super Shop Dhaka');
    setVal('settingStoreOwner', s.storeOwner || 'Md. Abdul Baqui');
    setVal('settingStorePhone', s.storePhone || '+880 1700-000000');
    setVal('settingStoreEmail', s.storeEmail || 'dhaka.supershop@gmail.com');
    setVal('settingStoreAddress', s.storeAddress || 'Mirpur 10, Dhaka - 1216');
    setVal('settingStoreLogo', s.storeLogo || '');
    setVal('settingDefaultDiscountMode', s.defaultDiscountMode || 'percent');
    setVal('settingDefaultDiscountValue', s.defaultDiscountValue !== undefined ? s.defaultDiscountValue : 0);
    setVal('settingDefaultTaxMode', s.defaultTaxMode || 'percent');
    setVal('settingDefaultTax', s.defaultTax !== undefined ? s.defaultTax : 0);
    setVal('settingCurrencySymbol', s.currencySymbol || '৳');
    setVal('settingReceiptHeader', s.receiptHeaderNote || 'Mirpur 10, Dhaka - 1216');
    setVal('settingReceiptFooter', s.receiptFooterNote || 'Thank you! Come again.');
    setVal('settingAdminPin', s.adminPin || '1234');
    setVal('settingDefaultTheme', s.defaultTheme || 'dark');

    // Load payment gateways settings
    const gateways = JSON.parse(localStorage.getItem('pos_payment_gateways')) || (typeof DEFAULT_PAYMENT_GATEWAYS !== 'undefined' ? DEFAULT_PAYMENT_GATEWAYS : {});
    
    const setChk = (id, checked) => {
      const el = document.getElementById(id);
      if (el) el.checked = !!checked;
    };

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

    const updatedSettings = {
      storeName: getVal('settingStoreName') || 'Super Shop Dhaka',
      storeOwner: getVal('settingStoreOwner') || 'Md. Abdul Baqui',
      storePhone: getVal('settingStorePhone') || '+880 1700-000000',
      storeEmail: getVal('settingStoreEmail'),
      storeAddress: getVal('settingStoreAddress') || 'Mirpur 10, Dhaka - 1216',
      storeLogo: getVal('settingStoreLogo'),
      defaultDiscountMode: getVal('settingDefaultDiscountMode') || 'percent',
      defaultDiscountValue: parseFloat(getVal('settingDefaultDiscountValue')) || 0,
      defaultTaxMode: getVal('settingDefaultTaxMode') || 'percent',
      defaultTax: parseFloat(getVal('settingDefaultTax')) || 0,
      currencySymbol: getVal('settingCurrencySymbol') || '৳',
      currencyCode: 'BDT',
      receiptHeaderNote: getVal('settingReceiptHeader'),
      receiptFooterNote: getVal('settingReceiptFooter') || 'Thank you! Come again.',
      adminPin: getVal('settingAdminPin') || '1234',
      defaultTheme: getVal('settingDefaultTheme') || 'dark'
    };

    this.settings = updatedSettings;
    localStorage.setItem('pos_settings', JSON.stringify(updatedSettings));

    const getChk = (id) => {
      const el = document.getElementById(id);
      return el ? el.checked : false;
    };

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
    this.showToast('দোকানের সেটিংস ও পেমেন্ট গেটওয়ে সফলভাবে সেভ হয়েছে!');
  }

  restoreDemoData() {
    if (confirm('আপনি কি নিশ্চিত যে ডেমো ডেটা রিস্টোর করতে চান? আপনার বর্তমান সমস্ত পরিবর্তন রিসেট হয়ে যাবে!')) {
      localStorage.removeItem('pos_products');
      localStorage.removeItem('pos_sales');
      localStorage.removeItem('pos_settings');
      localStorage.removeItem('pos_categories');
      localStorage.removeItem('pos_coupons');
      localStorage.removeItem('pos_payment_gateways');
      location.reload();
    }
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

    if (badgeEl) badgeEl.innerText = `মোট ${filtered.length} জন কাস্টমার`;

    if (!tbody) return;
    if (filtered.length === 0) {
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

    tbody.innerHTML = filtered.map(c => `
      <tr>
        <td><strong style="color: var(--accent-blue);">${c.id || 'CUST'}</strong></td>
        <td><strong style="color: var(--text-main);">${c.name}</strong></td>
        <td><span class="badge" style="background: rgba(59, 130, 246, 0.15); color: var(--accent-blue);"><i class="fa-solid fa-phone"></i> ${c.phone}</span></td>
        <td>${c.email || '<span class="text-muted">N/A</span>'}</td>
        <td>${c.address || '<span class="text-muted">N/A</span>'}</td>
        <td><span class="badge" style="background: rgba(139, 92, 246, 0.15); color: var(--accent-purple);">${c.totalOrders || 0} টি অর্ডার</span></td>
        <td><strong style="color: var(--accent-green);">৳${(c.totalSpent || 0).toFixed(2)}</strong></td>
        <td><small class="text-muted">${c.createdAt || 'N/A'}</small></td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 4px;">
            <button type="button" class="btn btn-sm btn-outline" onclick="adminApp.viewCustomerOrders('${c.phone}')" title="কেনাকাটার ইতিহাস">
              <i class="fa-solid fa-receipt"></i>
            </button>
            <button type="button" class="btn btn-sm btn-primary" onclick="adminApp.openCustomerModal('${c.id}')" title="এডিট">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button type="button" class="btn btn-sm btn-danger" onclick="adminApp.deleteCustomer('${c.id}')" title="ডিলিট">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
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
      }
    } else {
      if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-user-plus"></i> নতুন কাস্টমার প্রোফাইল এন্ট্রি`;
      if (formId) formId.value = '';
      if (firstNameInput) firstNameInput.value = '';
      if (lastNameInput) lastNameInput.value = '';
      if (phoneInput) phoneInput.value = '';
      if (emailInput) emailInput.value = '';
      if (addressInput) addressInput.value = '';
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
        totalOrders: 0,
        totalSpent: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };
      this.customers.unshift(newCust);
    }

    localStorage.setItem('pos_customers', JSON.stringify(this.customers));
    document.getElementById('customerModal')?.classList.remove('active');
    this.renderAdminCustomers();
    this.showToast('কাস্টমার প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে!');
  }

  deleteCustomer(id) {
    const c = this.customers.find(x => x.id === id);
    if (!c) return;
    if (confirm(`আপনি কি নিশ্চিত যে কাস্টমার '${c.name}' এর প্রোফাইল ডিলিট করতে চান?`)) {
      this.customers = this.customers.filter(x => x.id !== id);
      localStorage.setItem('pos_customers', JSON.stringify(this.customers));
      this.renderAdminCustomers();
      this.showToast('কাস্টমার প্রোফাইল রিমুভ করা হয়েছে!', 'error');
    }
  }

  viewCustomerOrders(phoneOrName) {
    const modal = document.getElementById('customerOrdersModal');
    const headerInfo = document.getElementById('custOrdersModalHeaderInfo');
    const tbody = document.getElementById('custOrdersTableBody');
    if (!modal) return;

    this.sales = JSON.parse(localStorage.getItem('pos_sales')) || (typeof INITIAL_SALES !== 'undefined' ? INITIAL_SALES : []);
    const c = this.customers.find(x => x.phone === phoneOrName || x.name === phoneOrName);

    const custSales = this.sales.filter(s => 
      (s.customerPhone && s.customerPhone === phoneOrName) ||
      (s.customer && s.customer.toLowerCase().includes((c ? c.name : phoneOrName).toLowerCase()))
    );

    if (headerInfo) {
      headerInfo.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="color: var(--accent-blue); font-size: 1.05rem;">${c ? c.name : phoneOrName}</strong>
            <div style="font-size: 0.85rem; color: var(--text-muted);"><i class="fa-solid fa-phone"></i> ${c ? c.phone : 'N/A'} | ${c ? c.address || 'ঠিকানা নেই' : ''}</div>
          </div>
          <div style="text-align: right;">
            <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-green); font-size: 0.85rem;">
              মোট ${custSales.length} টি কেনাকাটা (৳${custSales.reduce((sum, s) => sum + s.grandTotal, 0).toFixed(2)})
            </span>
          </div>
        </div>
      `;
    }

    if (tbody) {
      if (custSales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">এই কাস্টমারের কোনো কেনাকাটার ইতিহাস পাওয়া যায়নি</td></tr>`;
      } else {
        tbody.innerHTML = custSales.map(s => `
          <tr>
            <td><strong>${s.id}</strong></td>
            <td><small>${s.date}</small></td>
            <td><span class="badge" style="background: rgba(59, 130, 246, 0.15); color: var(--accent-blue);">${s.paymentMethod}</span></td>
            <td><strong style="color: var(--accent-green);">৳${s.grandTotal.toFixed(2)}</strong></td>
            <td style="text-align: right;">
              <button type="button" class="btn btn-sm btn-outline" onclick="adminApp.viewSaleDetails('${s.id}')">
                <i class="fa-solid fa-file-invoice"></i> মেমো দেখুন
              </button>
            </td>
          </tr>
        `).join('');
      }
    }

    modal.classList.add('active');
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
document.addEventListener('DOMContentLoaded', () => {
  adminApp = new AdminPanel();
  admin = adminApp;
  window.adminApp = adminApp;
  window.admin = adminApp;

  // Global listener for Customer Forms and Actions
  document.getElementById('adminAddNewCustomerBtn')?.addEventListener('click', () => adminApp.openCustomerModal());
  document.getElementById('customerForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    adminApp.saveCustomerFromForm();
  });
  document.getElementById('custSearchInput')?.addEventListener('input', () => adminApp.renderAdminCustomers());
});

