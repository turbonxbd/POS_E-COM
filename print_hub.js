/**
 * SmartPOS Pro - Unified Digital Print & Export Studio (print_hub.js)
 * High-tech in-app thermal printer simulator with live paper ejection animation,
 * instant non-blocking document preview, custom printer/paper size settings,
 * PDF/PNG export, sound FX, and guaranteed crisp printing.
 */

class SmartPrintHub {
  constructor() {
    this.soundEnabled = true;
    this.audioCtx = null;
    this.currentTitle = 'প্রিন্ট ডকুমেন্ট';
    this.isAnimating = false;
    this.currentItems = [];
    this.printMode = 'barcode'; // Tracks current mode: 'barcode' | 'invoice'
    
    // Default printer settings (loaded from localStorage if available)
    this.settings = this.loadSettings();
    this.paperFormat = this.settings.paperFormat || '80mm';

    this.init();
  }

  loadSettings() {
    const saved = localStorage.getItem('smartpos_printer_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      paperFormat: '80mm', // '80mm', '58mm', '100mm', 'sticker_50x30', 'sticker_40x25', '2up_label', 'a4_grid', 'custom'
      customWidthMm: 80,
      customHeightMm: 30,
      scalePercent: 100,
      marginMm: 0,
      stickerCols: 'auto',
      autoFit: true,
      speed: 'instant' // 'instant' for direct instant printing without delays
    };
  }

  saveSettings() {
    localStorage.setItem('smartpos_printer_settings', JSON.stringify(this.settings));
    this.applySettingsToDOM();
    this.updateDynamicPrintStyles();
  }

  init() {
    if (document.getElementById('smartPrintHubModal')) return;

    const modalHtml = `
      <div class="modal print-hub-modal" id="smartPrintHubModal">
        <div class="modal-content print-hub-content">
          <!-- MODAL HEADER -->
          <div class="modal-header print-hub-header">
            <div class="print-hub-title-group">
              <div class="printer-icon-badge">
                <i class="fa-solid fa-print"></i>
              </div>
              <div>
                <h3 id="printHubMainTitle">স্মার্ট ডিজিটাল প্রিন্ট ও এক্সপোর্ট হাব</h3>
                <p id="printHubSubTitle">ইনস্ট্যান্ট মেমো প্রিভিউ, লাইভ প্রিন্টার থার্মাল এনিমেশন ও কাস্টম পেপার সেটিং</p>
              </div>
            </div>
            <div class="print-hub-header-actions">
              <button class="btn btn-sm btn-outline" id="printHubSettingsBtn" onclick="printHub.toggleSettingsDrawer()" title="প্রিন্টার ও পেপার সাইজ এডজাস্টমেন্ট সেটিং">
                <i class="fa-solid fa-sliders"></i> <span>প্রিন্টার ও পেপার সেটিং</span>
              </button>
              <button class="btn btn-sm btn-outline sound-toggle-btn" id="printHubSoundBtn" title="প্রিন্টিং সাউন্ড অন/অফ">
                <i class="fa-solid fa-volume-high"></i> <span id="printHubSoundStatus">সাউন্ড অন</span>
              </button>
              <button class="close-modal" id="closePrintHubBtn" onclick="printHub.closeModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
          </div>

          <!-- TOP CONTROL BAR -->
          <div class="print-hub-toolbar">
            <div class="toolbar-item">
              <label><i class="fa-solid fa-scroll"></i> পেপার ও স্টিকার ফরম্যাট:</label>
              <select id="printHubFormatSelect" class="form-control form-control-sm">
                <option value="sticker_38x25" selected>🏷️ 38mm × 25mm কসমেটিকস ও পোশাক ১-আপ রোল (Small Roll)</option>
                <option value="sticker_50x30">🏷️ 50mm × 30mm স্টিকার রোল (BD Standard 1-Up Roll)</option>
                <option value="sticker_50x25">🏷️ 50mm × 25mm গ্যাজেট ও জুয়েলারি ১-আপ রোল (Medium Roll)</option>
                <option value="sticker_75x50">🏷️ 75mm × 50mm কার্টন ও শিপিং লেবেল (Large Shipping Label)</option>
                <option value="sticker_25x15">🏷️ 25mm × 15mm ফার্মেসী ও অ্যাকসেসোরিজ ট্যাগ (Micro Tag)</option>
                <option value="2up_label">🏷️ 2-Up ডাবল কলাম স্টিকার (2 Labels Per Row)</option>
                <option value="a4_grid">📄 A4 বারকোড স্টিকার শিট (A4 Multi-Sticker Grid)</option>
                <option value="80mm">🧾 80mm POS থার্মাল রসিদ (Standard POS Receipt)</option>
                <option value="58mm">🧾 58mm মিনি থার্মাল রসিদ (Mini POS Receipt)</option>
                <option value="100mm">🧾 100mm লেবেল / ইনভয়েস রোল (100mm Wide Roll)</option>
                <option value="custom">⚙️ কাস্টম পেপার সাইজ (Custom Width/Height)</option>
              </select>
            </div>

            <div class="toolbar-item">
              <label><i class="fa-solid fa-gauge-high"></i> এনিমেশন স্পিড:</label>
              <select id="printHubSpeedSelect" class="form-control form-control-sm">
                <option value="normal">স্বাভাবিক (Normal 1.5s)</option>
                <option value="fast">দ্রুত (Fast 0.6s)</option>
                <option value="instant">ইনস্ট্যান্ট (No Animation)</option>
              </select>
            </div>

            <div class="toolbar-item">
              <button class="btn btn-sm btn-secondary" id="printHubReplayBtn" onclick="printHub.triggerPrintEjection()" title="প্রিন্টার দিয়ে পেপার বের হওয়ার লাইভ এনিমেশন প্লে করুন">
                <i class="fa-solid fa-play"></i> প্রিন্ট এনিমেশন প্লে
              </button>
            </div>
          </div>

          <!-- ADVANCED PRINTER & PAPER CUSTOM SIZE SETTINGS DRAWER -->
          <div class="print-hub-settings-drawer" id="printHubSettingsDrawer" style="display:none;">
            <div class="settings-drawer-header">
              <h4><i class="fa-solid fa-sliders"></i> কাস্টম প্রিন্টার ও পেপার সাইজ এডজাস্টমেন্ট</h4>
              <button class="btn btn-xs btn-outline" onclick="printHub.toggleSettingsDrawer()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="settings-drawer-grid">
              <div class="setting-field">
                <label><i class="fa-solid fa-ruler-horizontal"></i> কাস্টম পেপার উইডথ (mm):</label>
                <div class="input-group-inline">
                  <input type="number" id="printHubCustomWidthInput" class="form-control form-control-sm" min="30" max="220" value="${this.settings.customWidthMm || 80}">
                  <span class="unit-tag">mm</span>
                </div>
                <small style="color:#94a3b8; font-size:0.7rem;">যেকোনো প্রিন্টারের আসল পেপার উইডথ বসান (যেমন: 40, 50, 58, 80, 100)</small>
              </div>

              <div class="setting-field">
                <label><i class="fa-solid fa-ruler-vertical"></i> কাস্টম পেপার হাইট (mm):</label>
                <div class="input-group-inline">
                  <input type="number" id="printHubCustomHeightInput" class="form-control form-control-sm" min="0" max="300" value="${this.settings.customHeightMm || 30}">
                  <span class="unit-tag">mm</span>
                </div>
                <small style="color:#94a3b8; font-size:0.7rem;">স্টিকার হাইট (যেমন: 30, 25) অথবা মেমোর জন্য 0 (Auto Height)</small>
              </div>

              <div class="setting-field">
                <label><i class="fa-solid fa-magnifying-glass-plus"></i> প্রিন্ট জুম / ফন্ট স্কেল (%):</label>
                <div class="input-group-inline">
                  <input type="range" id="printHubScaleRange" class="form-range" min="50" max="150" value="${this.settings.scalePercent || 100}" oninput="document.getElementById('printHubScaleVal').innerText = this.value + '%'">
                  <span id="printHubScaleVal" class="unit-tag">${this.settings.scalePercent || 100}%</span>
                </div>
                <small style="color:#94a3b8; font-size:0.7rem;">লেখা বড়/ছোট করে প্রিন্টারে নিখুঁতভাবে ফিট করুন</small>
              </div>

              <div class="setting-field">
                <label><i class="fa-solid fa-border-all"></i> প্রিন্ট মার্জিন (Margin mm):</label>
                <select id="printHubMarginSelect" class="form-control form-control-sm">
                  <option value="0">0mm (জিরো মার্জিন - স্টিকারের জন্য)</option>
                  <option value="2">2mm (প্রিন্টার স্ট্যান্ডার্ড)</option>
                  <option value="5">5mm (মিডিয়াম)</option>
                  <option value="10">10mm (ওয়াইড)</option>
                </select>
              </div>

              <div class="setting-field">
                <label><i class="fa-solid fa-table-cells"></i> বারকোড স্টিকার কলাম (Grid):</label>
                <select id="printHubStickerColsSelect" class="form-control form-control-sm">
                  <option value="auto">অটো এডজাস্ট (Auto Layout)</option>
                  <option value="1">১ কলাম (1 Sticker Row)</option>
                  <option value="2">২ কলাম (2 Stickers Row)</option>
                  <option value="3">৩ কলাম (3 Stickers Row)</option>
                  <option value="4">৪ কলাম (4 Stickers Row)</option>
                </select>
              </div>

              <div class="setting-field full-width">
                <label class="checkbox-label" style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                  <input type="checkbox" id="printHubAutoFitCheck" ${this.settings.autoFit ? 'checked' : ''}>
                  <span><strong>অটো-ফিট মোড (Auto Content Adjustment):</strong> প্রিন্টারের পেপার সাইজ চেঞ্জ করলে লেখা ও বারকোড অটোমেটিক রেসপনসিভ হয়ে ফিট হবে।</span>
                </label>
              </div>
            </div>
            <div class="settings-drawer-footer">
              <button class="btn btn-sm btn-primary" onclick="printHub.applySettingsFromUI()">
                <i class="fa-solid fa-check"></i> সেটিং সেভ ও অ্যাপ্লাই করুন
              </button>
              <button class="btn btn-sm btn-outline" onclick="printHub.resetSettingsToDefault()">
                <i class="fa-solid fa-rotate-left"></i> রি-সেট ডিফল্ট
              </button>
            </div>
          </div>

          <!-- PRINTER FEED VIEWPORT -->
          <div class="print-hub-body">
            <!-- VIRTUAL PRINTER CHASSIS -->
            <div class="printer-chassis">
              <div class="printer-chassis-top">
                <div class="printer-brand"><i class="fa-solid fa-barcode"></i> SmartPOS Thermal Printer & Label Studio</div>
                <div class="printer-leds">
                  <span class="led led-power active" title="Power ON"></span>
                  <span class="led led-status ready" id="printerStatusLed" title="Printer Activity"></span>
                  <span class="led-label" id="printerLedText">READY</span>
                </div>
              </div>
              <div class="printer-slot">
                <div class="printer-slot-blade"></div>
              </div>
            </div>

            <!-- PROGRESS & SCANNER BANNER -->
            <div class="print-progress-wrapper" id="printProgressWrapper" style="display:none;">
              <div class="print-progress-bar" id="printProgressBar"></div>
              <span class="print-progress-text" id="printProgressText">🖨️ প্রিন্ট প্রসেসিং চলছে... 0%</span>
            </div>

            <!-- PAPER EJECTION TRAY / VIEWPORT -->
            <div class="paper-tray-viewport" id="paperTrayViewport">
              <!-- GLOWING LASER SCANLINE -->
              <div class="laser-scan-line" id="printerLaserLine"></div>

              <!-- PAPER FEED CARRIER -->
              <div class="printed-paper-sheet paper-format-80mm" id="printablePrintHubTarget">
                <!-- Content will be rendered dynamically here -->
              </div>
            </div>
          </div>

          <!-- ACTION BUTTON FOOTER -->
          <div class="modal-footer print-hub-footer">
            <button class="btn btn-sm btn-outline" onclick="printHub.copyContentText()" title="কন্টেন্ট টেক্সট কপি করুন">
              <i class="fa-solid fa-copy"></i> কপি
            </button>
            <button class="btn btn-sm btn-success" onclick="printHub.downloadPNG()" title="PNG ফাইল হিসেবে সেভ করুন">
              <i class="fa-solid fa-file-image"></i> PNG ডাউনলোড
            </button>
            <button class="btn btn-sm btn-primary" onclick="printHub.downloadPDF()" title="PDF ডকুমেন্ট সেভ করুন">
              <i class="fa-solid fa-file-pdf"></i> PDF ডাউনলোড
            </button>
            <button class="btn btn-sm btn-accent" onclick="printHub.triggerPrintEjection()" title="ইন-অ্যাপ প্রিন্ট এনিমেশন প্লে করুন">
              <i class="fa-solid fa-print"></i> প্রিন্ট
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Event listeners
    const formatSelect = document.getElementById('printHubFormatSelect');
    if (formatSelect) {
      formatSelect.value = this.settings.paperFormat || '80mm';
      formatSelect.addEventListener('change', (e) => {
        this.paperFormat = e.target.value;
        this.settings.paperFormat = e.target.value;
        if (e.target.value === 'custom') {
          this.toggleSettingsDrawer(true);
        }
        this.applySettingsToDOM();
        this.updateDynamicPrintStyles();
        this.reRenderBarcodes();
        this.saveSettings();
      });
    }

    const speedSelect = document.getElementById('printHubSpeedSelect');
    if (speedSelect) {
      speedSelect.value = this.settings.speed || 'normal';
      speedSelect.addEventListener('change', (e) => {
        this.settings.speed = e.target.value;
        this.saveSettings();
      });
    }

    const soundBtn = document.getElementById('printHubSoundBtn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        this.soundEnabled = !this.soundEnabled;
        const statusSpan = document.getElementById('printHubSoundStatus');
        const iconEl = document.querySelector('#printHubSoundBtn i');
        if (statusSpan) statusSpan.innerText = this.soundEnabled ? 'সাউন্ড অন' : 'মিউট';
        if (iconEl) iconEl.className = this.soundEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
      });
    }

    // Set initial values in Settings Drawer inputs
    const customWidthInput = document.getElementById('printHubCustomWidthInput');
    if (customWidthInput) customWidthInput.value = this.settings.customWidthMm || 80;

    const customHeightInput = document.getElementById('printHubCustomHeightInput');
    if (customHeightInput) customHeightInput.value = this.settings.customHeightMm !== undefined ? this.settings.customHeightMm : 30;

    const scaleRange = document.getElementById('printHubScaleRange');
    if (scaleRange) scaleRange.value = this.settings.scalePercent || 100;

    const marginSelect = document.getElementById('printHubMarginSelect');
    if (marginSelect) marginSelect.value = this.settings.marginMm !== undefined ? this.settings.marginMm : 0;

    const stickerColsSelect = document.getElementById('printHubStickerColsSelect');
    if (stickerColsSelect) stickerColsSelect.value = this.settings.stickerCols || 'auto';

    this.applySettingsToDOM();
    this.updateDynamicPrintStyles();
  }

  toggleSettingsDrawer(forceOpen = false) {
    const drawer = document.getElementById('printHubSettingsDrawer');
    if (!drawer) return;
    if (forceOpen) {
      drawer.style.display = 'block';
    } else {
      drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
    }
  }

  applySettingsFromUI() {
    const customWidth = parseInt(document.getElementById('printHubCustomWidthInput')?.value) || 80;
    const customHeight = parseInt(document.getElementById('printHubCustomHeightInput')?.value) || 0;
    const scale = parseInt(document.getElementById('printHubScaleRange')?.value) || 100;
    const margin = parseInt(document.getElementById('printHubMarginSelect')?.value) || 0;
    const cols = document.getElementById('printHubStickerColsSelect')?.value || 'auto';
    const autoFit = document.getElementById('printHubAutoFitCheck')?.checked ?? true;

    this.settings.customWidthMm = customWidth;
    this.settings.customHeightMm = customHeight;
    this.settings.scalePercent = scale;
    this.settings.marginMm = margin;
    this.settings.stickerCols = cols;
    this.settings.autoFit = autoFit;

    this.saveSettings();
    this.reRenderBarcodes();
    this.toggleSettingsDrawer(false);

    if (window.cashier && cashier.showToast) cashier.showToast('প্রিন্টার ও পেপার সেটিংস সফলভাবে আপডেট হয়েছে!');
  }

  resetSettingsToDefault() {
    this.settings = {
      paperFormat: '80mm',
      customWidthMm: 80,
      customHeightMm: 30,
      scalePercent: 100,
      marginMm: 0,
      stickerCols: 'auto',
      autoFit: true,
      speed: 'normal'
    };
    this.paperFormat = '80mm';

    const formatSelect = document.getElementById('printHubFormatSelect');
    if (formatSelect) formatSelect.value = '80mm';

    const customWidthInput = document.getElementById('printHubCustomWidthInput');
    if (customWidthInput) customWidthInput.value = 80;

    const customHeightInput = document.getElementById('printHubCustomHeightInput');
    if (customHeightInput) customHeightInput.value = 30;

    const scaleRange = document.getElementById('printHubScaleRange');
    if (scaleRange) scaleRange.value = 100;
    const scaleVal = document.getElementById('printHubScaleVal');
    if (scaleVal) scaleVal.innerText = '100%';

    const marginSelect = document.getElementById('printHubMarginSelect');
    if (marginSelect) marginSelect.value = 0;

    const stickerColsSelect = document.getElementById('printHubStickerColsSelect');
    if (stickerColsSelect) stickerColsSelect.value = 'auto';

    const autoFitCheck = document.getElementById('printHubAutoFitCheck');
    if (autoFitCheck) autoFitCheck.checked = true;

    this.saveSettings();
    this.reRenderBarcodes();
  }

  applySettingsToDOM() {
    const paperTarget = document.getElementById('printablePrintHubTarget');
    if (!paperTarget) return;

    const isSticker = this.paperFormat.startsWith('sticker_') || this.paperFormat === '2up_label' || this.paperFormat === 'a4_grid';

    paperTarget.className = `printed-paper-sheet paper-format-${this.paperFormat}${isSticker ? ' sticker-mode' : ''}`;

    // Width styling based on paperFormat
    if (this.paperFormat === 'custom') {
      paperTarget.style.width = `${this.settings.customWidthMm || 80}mm`;
    } else if (this.paperFormat === '58mm') {
      paperTarget.style.width = '240px';
    } else if (this.paperFormat === '80mm') {
      paperTarget.style.width = '320px';
    } else if (this.paperFormat === '100mm') {
      paperTarget.style.width = '400px';
    } else if (this.paperFormat === 'sticker_50x30') {
      paperTarget.style.width = '220px';
    } else if (this.paperFormat === 'sticker_38x25') {
      paperTarget.style.width = '175px';
    } else if (this.paperFormat === 'sticker_50x25') {
      paperTarget.style.width = '220px';
    } else if (this.paperFormat === 'sticker_75x50') {
      paperTarget.style.width = '330px';
    } else if (this.paperFormat === 'sticker_25x15') {
      paperTarget.style.width = '130px';
    } else if (this.paperFormat === '2up_label') {
      paperTarget.style.width = '360px';
    } else if (this.paperFormat === 'a4_grid') {
      paperTarget.style.width = '600px';
    }

    // Scale & padding
    const scale = (this.settings.scalePercent || 100) / 100;
    paperTarget.style.fontSize = `${scale * 100}%`;

    if (isSticker) {
      paperTarget.style.background = 'transparent';
      paperTarget.style.boxShadow = 'none';
      paperTarget.style.border = 'none';
      paperTarget.style.padding = '0';
    } else {
      paperTarget.style.background = '#ffffff';
      paperTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
      paperTarget.style.padding = `${this.settings.marginMm !== undefined ? this.settings.marginMm : 0}mm`;
    }

    // Sticker grid column layout
    const gridEl = document.getElementById('barcodeHubGrid');
    if (gridEl) {
      if (this.paperFormat === 'sticker_50x30' || this.paperFormat === 'sticker_38x25' || this.paperFormat === 'sticker_50x25' || this.paperFormat === 'sticker_75x50' || this.paperFormat === 'sticker_25x15') {
        gridEl.style.gridTemplateColumns = '1fr';
      } else if (this.paperFormat === '2up_label') {
        gridEl.style.gridTemplateColumns = 'repeat(2, 1fr)';
      } else if (this.settings.stickerCols && this.settings.stickerCols !== 'auto') {
        gridEl.style.gridTemplateColumns = `repeat(${this.settings.stickerCols}, 1fr)`;
      } else {
        gridEl.style.gridTemplateColumns = 'repeat(auto-fill, minmax(130px, 1fr))';
      }
    }
  }

  updateDynamicPrintStyles(mode = 'barcode') {
    let styleTag = document.getElementById('printHubDynamicStyles');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'printHubDynamicStyles';
      document.head.appendChild(styleTag);
    }

    let widthMm = '80mm';
    let heightMm = 'auto';
    let isStickerRoll = false;

    if (mode === 'invoice') {
      widthMm = '80mm';
      isStickerRoll = false;
      const receiptEl = document.getElementById('printableReceipt');
      if (receiptEl) {
        // Measure real unclipped scrollHeight of the invoice receipt element
        const pxHeight = Math.max(receiptEl.scrollHeight || 0, receiptEl.offsetHeight || 0);
        const baseMm = pxHeight * 0.2645833;
        // Proportional 6% buffer + 15mm base safety.
        // Guarantees 100% ONE SINGLE CONTINUOUS PAGE for any number of products (1 to 500+ items).
        // Completely eliminates Chrome page breaks and prevents footer/barcode from going to Page 2.
        const calculatedHeightMm = Math.ceil(baseMm * 1.06) + 15;
        heightMm = `${Math.max(70, calculatedHeightMm)}mm`;
      } else {
        heightMm = 'auto';
      }
    } else {
      // Default to 38x25 sticker format for barcode mode if non-sticker format passed
      if (!this.paperFormat || this.paperFormat === '80mm' || this.paperFormat === '58mm') {
        this.paperFormat = 'sticker_38x25';
      }
      switch(this.paperFormat) {
        case 'sticker_38x25':
          widthMm = '38mm';
          heightMm = '25mm';
          isStickerRoll = true;
          break;
        case 'sticker_50x30':
          widthMm = '50mm';
          heightMm = '30mm';
          isStickerRoll = true;
          break;
        case 'sticker_50x25':
          widthMm = '50mm';
          heightMm = '25mm';
          isStickerRoll = true;
          break;
        case 'sticker_75x50':
          widthMm = '75mm';
          heightMm = '50mm';
          isStickerRoll = true;
          break;
        case 'sticker_25x15':
          widthMm = '25mm';
          heightMm = '15mm';
          isStickerRoll = true;
          break;
        case '2up_label':
          widthMm = '76mm';
          heightMm = '25mm';
          isStickerRoll = true;
          break;
        case 'a4_grid':
          widthMm = '210mm';
          heightMm = '297mm';
          break;
        case 'custom':
          widthMm = `${this.settings.customWidthMm || 38}mm`;
          heightMm = `${this.settings.customHeightMm || 25}mm`;
          isStickerRoll = true;
          break;
        default:
          widthMm = '38mm';
          heightMm = '25mm';
          isStickerRoll = true;
          break;
      }
    }

    const scale = (this.settings.scalePercent || 100) / 100;
    const margin = isStickerRoll ? '0mm' : `${this.settings.marginMm !== undefined ? this.settings.marginMm : 0}mm`;

    let pageRule = '';
    // Valid CSS Paged Media Spec syntax
    if (mode === 'invoice' && heightMm !== 'auto') {
      pageRule = `@page { size: 80mm ${heightMm}; margin: 0; }`;
    } else if (mode === 'invoice') {
      pageRule = `@page { size: 80mm auto; margin: 0; }`;
    } else if (heightMm === 'auto') {
      pageRule = `@page { size: ${widthMm} auto; margin: 0; }`;
    } else {
      pageRule = `@page { size: ${widthMm} ${heightMm}; margin: 0; }`;
    }

    styleTag.innerHTML = `
      @media print {
        ${pageRule}

        html, body {
          direction: ltr !important;
          writing-mode: horizontal-tb !important;
          transform: none !important;
          rotate: 0deg !important;
          margin: 0 auto !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #000000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          width: ${mode === 'invoice' ? '80mm' : widthMm} !important;
          max-width: ${mode === 'invoice' ? '80mm' : widthMm} !important;
        }

        /* Expand scrollable receipt viewport to full content height in print */
        .receipt-feed-viewport, .receipt-feed-container {
          max-height: none !important;
          height: auto !important;
          min-height: 0 !important;
          overflow: visible !important;
          padding: 0 !important;
        }

        /* 1. BARCODE PRINTING ISOLATION MODE */
        body.printing-barcode > *:not(#smartPrintHubModal) {
          display: none !important;
        }
        body.printing-barcode #receiptModal,
        body.printing-barcode #adminReceiptModal {
          display: none !important;
        }

        /* 2. INVOICE PRINTING ISOLATION MODE */
        body.printing-invoice > *:not(#receiptModal):not(#adminReceiptModal) {
          display: none !important;
        }
        body.printing-invoice #smartPrintHubModal {
          display: none !important;
        }

        /* DEFAULT FALLBACK */
        body:not(.printing-barcode):not(.printing-invoice) > *:not(#smartPrintHubModal):not(#receiptModal):not(#adminReceiptModal) {
          display: none !important;
        }

        #smartPrintHubModal, #receiptModal, #adminReceiptModal {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: ${mode === 'invoice' ? '80mm' : widthMm} !important;
          max-width: ${mode === 'invoice' ? '80mm' : widthMm} !important;
          height: auto !important;
          background: #ffffff !important;
          color: #000000 !important;
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
          margin: 0 auto !important;
          padding: 0 !important;
          border: none !important;
          box-shadow: none !important;
        }

        #smartPrintHubModal .print-hub-header, #smartPrintHubModal .print-hub-toolbar, #smartPrintHubModal .print-hub-settings-drawer, #smartPrintHubModal .printer-chassis, #smartPrintHubModal .print-progress-wrapper, #smartPrintHubModal .laser-scan-line, #smartPrintHubModal .print-hub-footer,
        #receiptModal .modal-header, #receiptModal .modal-footer, #receiptModal .close-modal, #receiptModal .thermal-slot-header, #receiptModal .thermal-paper-slot-mouth, #receiptModal .thermal-feed-scanline,
        #adminReceiptModal .modal-header, #adminReceiptModal .modal-footer, #adminReceiptModal .close-modal, #adminReceiptModal .thermal-slot-header, #adminReceiptModal .thermal-paper-slot-mouth, #adminReceiptModal .thermal-feed-scanline {
          display: none !important;
        }

        #smartPrintHubModal .modal-content, #smartPrintHubModal .print-hub-body, #smartPrintHubModal .paper-tray-viewport, #smartPrintHubModal .printed-paper-sheet, #printablePrintHubTarget, #barcodeHubGrid,
        #receiptModal .modal-content, #receiptModal .modal-body, #receiptModal .receipt-feed-container, #receiptModal .receipt-feed-viewport,
        #adminReceiptModal .modal-content, #adminReceiptModal .modal-body, #adminReceiptModal .receipt-feed-container, #adminReceiptModal .receipt-feed-viewport {
          background: transparent !important;
          color: #000000 !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
          min-height: 0 !important;
          height: auto !important;
          max-height: none !important;
          width: ${mode === 'invoice' ? '80mm' : widthMm} !important;
          max-width: ${mode === 'invoice' ? '80mm' : widthMm} !important;
          overflow: visible !important;
          display: block !important;
        }

        #printableReceipt {
          position: relative !important;
          left: 0 !important;
          top: 0 !important;
          width: 80mm !important;
          max-width: 80mm !important;
          min-width: 80mm !important;
          height: auto !important;
          margin: 0 auto !important;
          padding: 2mm 2mm !important;
          box-sizing: border-box !important;
          background: #ffffff !important;
          color: #000000 !important;
          transform: none !important;
          opacity: 1 !important;
          display: block !important;
          visibility: visible !important;
          writing-mode: horizontal-tb !important;
          direction: ltr !important;
          page-break-before: avoid !important;
          page-break-after: avoid !important;
          page-break-inside: avoid !important;
          break-before: avoid !important;
          break-after: avoid !important;
          break-inside: avoid !important;
        }

        #printableReceipt *,
        .receipt-table, .receipt-totals-table, .receipt-header, .receipt-footer, .receipt-info-grid,
        .receipt-table tr, .receipt-table td, .receipt-table th,
        .receipt-totals-table tr, .receipt-totals-table td {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-before: avoid !important;
          page-break-after: avoid !important;
          writing-mode: horizontal-tb !important;
          direction: ltr !important;
        }

        /* Keep barcode + footer block together — never split to a 2nd page */
        .receipt-footer {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-before: avoid !important;
          break-before: avoid !important;
        }
        #rcptBarcodeSvg {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-before: avoid !important;
          break-before: avoid !important;
          display: block !important;
        }

        ${isStickerRoll && mode !== 'invoice' ? `
        .barcode-studio-header {
          display: none !important;
        }
        .barcode-hub-grid {
          display: block !important;
          margin: 0 auto !important;
          padding: 0 !important;
          width: ${widthMm} !important;
          max-width: ${widthMm} !important;
        }
        .barcode-sticker-card {
          width: ${widthMm} !important;
          max-width: ${widthMm} !important;
          height: ${heightMm} !important;
          max-height: ${heightMm} !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 0 !important;
          page-break-before: auto !important;
          page-break-after: always !important;
          break-after: page !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          overflow: hidden !important;
          border: none !important;
          box-shadow: none !important;
          display: block !important;
          transform: none !important;
        }
        .barcode-sticker-card .sticker-rotate-wrap {
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: space-between !important;
          box-sizing: border-box !important;
          padding: 2px 3px !important;
          transform: rotate(180deg) !important;
          transform-origin: center center !important;
        }
        .barcode-sticker-card:last-child,
        .barcode-sticker-card:last-of-type {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        ` : `
        .barcode-sticker-card {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        `}
      }
    `;
  }

  openModal() {
    const modal = document.getElementById('smartPrintHubModal');
    if (modal) modal.classList.add('active');
  }

  closeModal() {
    const modal = document.getElementById('smartPrintHubModal');
    if (modal) modal.classList.remove('active');
  }

  // --- AUDIO SYNTHESIZER FOR REALISTIC THERMAL PRINTER MOTOR ---
  playPrinterAudio(durationMs = 1500) {
    if (!this.soundEnabled) return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const totalSec = Math.max(0.3, durationMs / 1000);

      // Motor noise oscillator (subtle soft hum)
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(90, now + totalSec);

      gain.gain.setValueAtTime(0.025, now);
      gain.gain.linearRampToValueAtTime(0.005, now + totalSec);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + totalSec);

      // Thermal head pulse clicks (soft click FX)
      const clickCount = Math.floor(totalSec * 12);
      for (let i = 0; i < clickCount; i++) {
        const clickTime = now + (i * (totalSec / clickCount));
        const clickOsc = this.audioCtx.createOscillator();
        const clickGain = this.audioCtx.createGain();
        clickOsc.type = 'square';
        clickOsc.frequency.setValueAtTime(800 + (i % 3) * 200, clickTime);
        clickGain.gain.setValueAtTime(0.012, clickTime);
        clickGain.gain.exponentialRampToValueAtTime(0.0005, clickTime + 0.03);
        clickOsc.connect(clickGain);
        clickGain.connect(this.audioCtx.destination);
        clickOsc.start(clickTime);
        clickOsc.stop(clickTime + 0.03);
      }
    } catch (e) {
      console.warn("WebAudio printer sound playback error:", e);
    }
  }

  playSuccessBeep() {
    if (!this.soundEnabled) return;
    try {
      if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch(e) {}
  }

  // --- HARDWARE PRINTER DISPATCH & STATUS MONITOR ENGINE ---
  executeHardwarePrint(mode = 'barcode', onStart, onSuccess, onError) {
    if (typeof mode === 'function') {
      onError = onSuccess;
      onSuccess = onStart;
      onStart = mode;
      mode = 'barcode';
    }

    if (mode === 'invoice') {
      document.body.classList.add('printing-invoice');
      document.body.classList.remove('printing-barcode');
    } else {
      document.body.classList.add('printing-barcode');
      document.body.classList.remove('printing-invoice');
    }

    let printDispatched = false;
    let printCompleted = false;

    const mediaQueryList = window.matchMedia ? window.matchMedia('print') : null;

    const cleanup = () => {
      document.body.classList.remove('printing-barcode');
      document.body.classList.remove('printing-invoice');
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      if (mediaQueryList && mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', mqlListener);
      }
    };

    const handleBeforePrint = () => {
      printDispatched = true;
      if (typeof onStart === 'function') onStart();
    };

    const handleAfterPrint = () => {
      printCompleted = true;
      if (typeof onSuccess === 'function') onSuccess();
      cleanup();
    };

    const mqlListener = (mql) => {
      if (mql.matches) {
        handleBeforePrint();
      } else {
        handleAfterPrint();
      }
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    if (mediaQueryList && mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', mqlListener);
    }

    try {
      this.updateDynamicPrintStyles(mode);
      window.print();

      setTimeout(() => {
        if (!printDispatched && !printCompleted) {
          cleanup();
          if (typeof onSuccess === 'function') onSuccess(); // Auto-fallback for silent print drivers
        }
      }, 1500);
    } catch (err) {
      cleanup();
      if (typeof onError === 'function') onError(err.message || 'Printer Connection Failed');
    }
  }

  // --- PAPER EJECTION & SCANNER ANIMATION ENGINE ---
  triggerPrintEjection(autoDispatchHardware = true) {
    this.playPrintAnimation(autoDispatchHardware);
  }

  playPrintAnimation(autoDispatchHardware = true) {
    const paperTarget = document.getElementById('printablePrintHubTarget');
    const paperTrayViewport = document.getElementById('paperTrayViewport');
    const progressWrapper = document.getElementById('printProgressWrapper');
    const progressBar = document.getElementById('printProgressBar');
    const progressText = document.getElementById('printProgressText');
    const laserLine = document.getElementById('printerLaserLine');
    const statusLed = document.getElementById('printerStatusLed');
    const statusLedText = document.getElementById('printerLedText');
    const speed = this.settings.speed || document.getElementById('printHubSpeedSelect')?.value || 'normal';

    if (!paperTarget) return;

    const itemCount = (this.currentItems && this.currentItems.length > 0) ? this.currentItems.length : 1;
    let baseTime = Math.max(400, Math.min(1000, itemCount * 100 + 250));
    let animDuration = baseTime;
    if (speed === 'fast') animDuration = Math.max(250, Math.round(baseTime * 0.45));
    if (speed === 'instant') animDuration = 40;

    this.isAnimating = true;

    if (paperTrayViewport) {
      paperTrayViewport.scrollTop = 0;
      paperTrayViewport.style.overflowY = 'auto';
    }

    paperTarget.style.transition = 'none';
    paperTarget.style.transform = 'translateY(30px)';
    paperTarget.style.opacity = '0.4';
    if (laserLine) {
      laserLine.style.display = 'block';
      laserLine.style.top = '0%';
    }

    if (statusLed) statusLed.className = 'led led-status printing';
    if (statusLedText) statusLedText.innerText = 'PRINTING...';

    if (progressWrapper) progressWrapper.style.display = 'flex';
    if (progressBar) progressBar.style.width = '0%';
    if (progressText) progressText.innerText = `🖨️ প্রিন্টারে প্রিন্টিং প্রসেস শুরু হয়েছে (১/${itemCount})... 0%`;

    if (speed !== 'instant') {
      this.playPrinterAudio(animDuration);
    }

    void paperTarget.offsetHeight;

    const startTime = performance.now();

    const animateStep = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / animDuration);

      const percent = Math.floor(progress * 100);
      const processedCount = Math.min(itemCount, Math.max(1, Math.ceil(progress * itemCount)));

      if (progressBar) progressBar.style.width = `${percent}%`;
      if (progressText) progressText.innerText = `🖨️ প্রিন্টারে স্টিকার প্রিন্ট হয়ে বের হচ্ছে (${processedCount}/${itemCount})... ${percent}%`;

      const initialEntryRatio = Math.min(1, progress * 4);
      const translateY = Math.round((1 - initialEntryRatio) * 30);
      paperTarget.style.transform = `translateY(${translateY}px)`;
      paperTarget.style.opacity = `${0.4 + (progress * 0.6)}`;

      if (paperTrayViewport) {
        const maxScroll = Math.max(0, paperTarget.scrollHeight - paperTrayViewport.clientHeight + 10);
        if (maxScroll > 0) {
          paperTrayViewport.scrollTop = Math.round(progress * maxScroll);
        }
      }

      if (laserLine) {
        laserLine.style.top = `${(1 - progress) * 100}%`;
      }

      if (progress < 1) {
        requestAnimationFrame(animateStep);
      } else {
        paperTarget.style.transform = 'translateY(0px)';
        paperTarget.style.opacity = '1';
        if (laserLine) laserLine.style.display = 'none';

        if (statusLed) statusLed.className = 'led led-status ready';
        if (statusLedText) statusLedText.innerText = 'PRINT COMPLETE';
        if (progressText) progressText.innerText = `✅ মোট ${itemCount} টি বারকোড স্টিকার প্রিন্ট সফলভাবে সম্পন্ন হয়েছে!`;

        if (paperTrayViewport) {
          paperTrayViewport.style.overflowY = 'auto';
        }

        this.playSuccessBeep();
        this.isAnimating = false;

        setTimeout(() => {
          if (progressWrapper) progressWrapper.style.display = 'none';
        }, 1200);

        if (autoDispatchHardware) {
          this.executeHardwarePrint(this.printMode, null, null, (errMsg) => {
            if (statusLed) statusLed.className = 'led led-status error';
            if (statusLedText) statusLedText.innerText = 'PRINT FAILED';
            if (progressText) progressText.innerText = `❌ প্রিন্টার কানেক্টেড নেই বা প্রিন্ট ব্যর্থ হয়েছে! (${errMsg})`;
            if (window.cashier && cashier.showToast) cashier.showToast(`❌ প্রিন্টার কানেকশন ব্যর্থ: ${errMsg}`, 'error');
            else if (window.admin && admin.showToast) admin.showToast(`❌ প্রিন্টার কানেকশন ব্যর্থ: ${errMsg}`, 'error');
          });
        }
      }
    };

    requestAnimationFrame(animateStep);
  }

  // Set instant visible state (no loading animation delay on modal open)
  setInstantVisible() {
    const paperTarget = document.getElementById('printablePrintHubTarget');
    const progressWrapper = document.getElementById('printProgressWrapper');
    const laserLine = document.getElementById('printerLaserLine');
    const statusLed = document.getElementById('printerStatusLed');
    const statusLedText = document.getElementById('printerLedText');

    if (!paperTarget) return;

    paperTarget.style.transition = 'none';
    paperTarget.style.transform = 'translateY(0%)';
    paperTarget.style.opacity = '1';

    if (laserLine) laserLine.style.display = 'none';
    if (progressWrapper) progressWrapper.style.display = 'none';
    if (statusLed) statusLed.className = 'led led-status ready';
    if (statusLedText) statusLedText.innerText = 'READY';

    this.isAnimating = false;
  }

  // --- OPEN BARCODE STICKER PRINT STUDIO ---
  openBarcodeStudio({ title = 'বারকোড স্টিকার প্রিন্ট হাব', items = [], paperFormat = null }) {
    this.currentTitle = title;
    this.currentItems = items || [];
    this.printMode = 'barcode'; // *** Set mode before hardware print dispatch ***
    const posSettings = JSON.parse(localStorage.getItem('pos_settings')) || {};
    const showName = true;
    const showVariant = true;
    const showPrice = true;

    if (paperFormat) {
      this.paperFormat = paperFormat;
      this.settings.paperFormat = paperFormat;
    } else {
      this.paperFormat = localStorage.getItem('pos_barcode_paper_format') || posSettings.barcodePaperFormat || this.settings.paperFormat || 'sticker_38x25';
    }

    // Hide top toolbar & settings drawer button for clean centered viewport view
    const toolbarEl = document.querySelector('.print-hub-toolbar');
    if (toolbarEl) toolbarEl.style.display = 'none';
    const settingsBtn = document.getElementById('printHubSettingsBtn');
    if (settingsBtn) settingsBtn.style.display = 'none';

    const mainTitleEl = document.getElementById('printHubMainTitle');
    const subTitleEl = document.getElementById('printHubSubTitle');
    const formatSelect = document.getElementById('printHubFormatSelect');

    if (mainTitleEl) mainTitleEl.innerText = title;
    if (subTitleEl) subTitleEl.innerText = `মোট ${items.length} টি বারকোড স্টিকার প্রিন্ট ও ডাউনলোডের জন্য রেডি`;
    if (formatSelect) formatSelect.value = this.paperFormat;

    const paperTarget = document.getElementById('printablePrintHubTarget');
    if (!paperTarget) return;

    let stickersHtml = `
      <div class="barcode-hub-grid" id="barcodeHubGrid">
    `;

    items.forEach((item, idx) => {
      let priceFormatted = '';
      if (item.mrp && parseFloat(item.mrp) > parseFloat(item.price)) {
        priceFormatted = `Price:&nbsp;<span style="position: relative; display: inline-block; vertical-align: baseline; color: #333333 !important; font-weight: 700; font-size: 0.88em; margin-right: 5px; line-height: 1.1;">৳${parseFloat(item.mrp).toFixed(0)}<span style="position: absolute; left: -2px; right: -2px; top: 52%; height: 1.2px; background: #000000 !important; background-color: #000000 !important; display: block; transform: translateY(-50%) rotate(-7deg); transform-origin: center; pointer-events: none; z-index: 10;"></span></span>&nbsp;<strong style="color: #000000 !important; font-weight: 900; font-size: 1.05em; display: inline-block; vertical-align: baseline; line-height: 1.1;">৳${parseFloat(item.price).toFixed(0)}</strong>`;
      } else {
        priceFormatted = `Price:&nbsp;<strong style="color: #000000 !important; font-weight: 900; font-size: 1.05em; display: inline-block; vertical-align: baseline; line-height: 1.1;">৳${parseFloat(item.price).toFixed(0)}</strong>`;
      }

      const nameStr = item.name || '';
      const len = nameStr.trim().length;
      let fontStyling = 'font-size:0.56rem; font-weight:700; line-height:1.08; margin-top:2px; margin-bottom:1px; padding:1px 0 0 0;';
      if (len > 32) {
        fontStyling = 'font-size:0.48rem; font-weight:600; line-height:1.05; margin-top:2px; margin-bottom:1px; padding:1px 0 0 0;';
      } else if (len > 22) {
        fontStyling = 'font-size:0.52rem; font-weight:700; line-height:1.06; margin-top:2px; margin-bottom:1px; padding:1px 0 0 0;';
      }

      const nameHtml = showName ? `<div style="${fontStyling} width:100%; text-align:center; color:#000; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; word-break:break-word;">${item.name}</div>` : '';
      const variantHtml = (showVariant && item.variantDetails) ? `<div style="font-size:0.50rem; font-weight:600; color:#333; margin-top:1px; margin-bottom:1px; line-height:1.05;">${item.variantDetails}</div>` : '';
      const priceHtml = showPrice ? `<div style="font-size:0.66rem; font-weight:800; color:#000; margin-top:1px; margin-bottom:2px; padding-bottom:1px; line-height:1.05;">${priceFormatted}</div>` : '';

      stickersHtml += `
        <div class="barcode-sticker-card hub-sticker" style="background:#fff; color:#000; border:1px solid #ddd; border-radius:4px; text-align:center; box-shadow:0 1px 3px rgba(0,0,0,0.06); page-break-inside:avoid; break-inside:avoid; box-sizing:border-box; overflow:hidden;">
          <div class="sticker-rotate-wrap" style="width:100%; display:flex; flex-direction:column; align-items:center; justify-content:space-between; padding:2px 3px; box-sizing:border-box;">
            ${nameHtml}
            ${variantHtml}
            <div style="width:100%; display:flex; justify-content:center; margin:1px 0;">
              <svg id="hubBcSvg_${idx}" style="max-width:100%; height:auto; display:block; margin:0 auto; shape-rendering:crispEdges; image-rendering:pixelated;"></svg>
            </div>
            ${priceHtml}
          </div>
        </div>
      `;
    });

    stickersHtml += `</div>`;
    paperTarget.innerHTML = stickersHtml;

    this.applySettingsToDOM();
    this.updateDynamicPrintStyles();

    // Render Barcodes
    setTimeout(() => {
      this.reRenderBarcodes();
    }, 50);

    this.openModal();
    // Play realistic thermal paper ejection animation with audio sound
    this.playPrintAnimation();
  }

  // --- RE-RENDER BARCODES FOR CURRENT PAPER FORMAT ---
  reRenderBarcodes() {
    if (!this.currentItems || this.currentItems.length === 0) return;
    if (typeof JsBarcode === 'undefined') return;

    let bcWidth = 1.05;
    let bcHeight = 22;
    let bcFontSize = 8.5;
    let bcMargin = 0;

    if (this.paperFormat === 'sticker_38x25') {
      bcWidth = 1.05;
      bcHeight = 18;
      bcFontSize = 8.0;
      bcMargin = 0;
    } else if (this.paperFormat === 'sticker_50x30') {
      bcWidth = 1.25;
      bcHeight = 32;
      bcFontSize = 9.0;
      bcMargin = 1;
    } else if (this.paperFormat === 'sticker_50x25') {
      bcWidth = 1.15;
      bcHeight = 24;
      bcFontSize = 8.0;
      bcMargin = 0;
    } else if (this.paperFormat === 'sticker_75x50') {
      bcWidth = 1.6;
      bcHeight = 48;
      bcFontSize = 10.5;
      bcMargin = 2;
    } else if (this.paperFormat === 'sticker_25x15') {
      bcWidth = 0.8;
      bcHeight = 15;
      bcFontSize = 7.0;
      bcMargin = 0;
    } else if (this.paperFormat === '2up_label') {
      bcWidth = 1.15;
      bcHeight = 24;
      bcFontSize = 8.0;
      bcMargin = 0;
    } else if (this.paperFormat === 'a4_grid') {
      bcWidth = 1.15;
      bcHeight = 24;
      bcFontSize = 8.5;
      bcMargin = 0;
    } else if (this.paperFormat === '58mm') {
      bcWidth = 1.15;
      bcHeight = 24;
      bcFontSize = 8.0;
      bcMargin = 0;
    }

    const posSettings = JSON.parse(localStorage.getItem('pos_settings')) || {};
    const scale = posSettings.barcodeScale || 'normal';
    let scaleMult = 1.0;
    if (scale === 'compact') scaleMult = 0.85;
    if (scale === 'large') scaleMult = 1.25;

    bcWidth = parseFloat((bcWidth * scaleMult).toFixed(2));
    bcHeight = Math.round(bcHeight * scaleMult);

    this.currentItems.forEach((item, idx) => {
      try {
        const svgEl = document.getElementById(`hubBcSvg_${idx}`);
        if (svgEl) {
          JsBarcode(`#hubBcSvg_${idx}`, item.barcode.toString().trim(), {
            format: "CODE128",
            width: bcWidth,
            height: bcHeight,
            fontSize: bcFontSize,
            fontOptions: "bold",
            font: "monospace",
            marginTop: 0,
            marginBottom: 2,
            textMargin: 1,
            background: "#ffffff",
            lineColor: "#000000",
            displayValue: true
          });
          svgEl.setAttribute('shape-rendering', 'crispEdges');
        }
      } catch (e) {
        console.error("Barcode re-render error:", e);
      }
    });
  }

  // --- OPEN THERMAL RECEIPT / MEMO PRINT STUDIO ---
  openReceiptStudio({ title = 'সেলস ইনভয়েস মেমো', receiptHtml, invoiceId = '' }) {
    this.currentTitle = invoiceId ? `Memo_${invoiceId}` : 'Sales_Receipt';
    this.printMode = 'invoice'; // *** Set mode before hardware print dispatch ***
    this.paperFormat = this.settings.paperFormat || '80mm';

    // Hide top toolbar & settings drawer button for clean centered viewport view
    const toolbarEl = document.querySelector('.print-hub-toolbar');
    if (toolbarEl) toolbarEl.style.display = 'none';
    const settingsBtn = document.getElementById('printHubSettingsBtn');
    if (settingsBtn) settingsBtn.style.display = 'none';

    const mainTitleEl = document.getElementById('printHubMainTitle');
    const subTitleEl = document.getElementById('printHubSubTitle');
    const formatSelect = document.getElementById('printHubFormatSelect');

    if (mainTitleEl) mainTitleEl.innerText = title;
    if (subTitleEl) subTitleEl.innerText = invoiceId ? `ইনভয়েস #${invoiceId} এর ডিজিটাল মেমো প্রিন্ট ও ডাউনলোড` : `ক্যাশিয়ার মেমো ডিজিটাল প্রিন্ট হাব`;
    if (formatSelect) formatSelect.value = this.paperFormat;

    const paperTarget = document.getElementById('printablePrintHubTarget');
    if (!paperTarget) return;

    paperTarget.innerHTML = `
      <div class="receipt-hub-wrapper">
        ${receiptHtml}
      </div>
    `;

    this.applySettingsToDOM();
    this.openModal();
    // Play realistic thermal paper ejection animation with audio sound
    this.playPrintAnimation();
  }

  // --- SYSTEM DIRECT PRINT (window.print) ---
  systemPrint() {
    this.updateDynamicPrintStyles();
    this.setInstantVisible();
    window.print();
  }

  // --- DOWNLOAD PDF USING HTML2PDF / CANVAS ---
  downloadPDF() {
    const paperTarget = document.getElementById('printablePrintHubTarget');
    if (!paperTarget) {
      alert('ডাউনলোডের জন্য কোনো প্রিন্ট কন্টেন্ট পাওয়া যায়নি।');
      return;
    }

    const fileName = `${this.currentTitle.replace(/[^a-zA-Z0-9_\-]/g, '_')}_${Date.now()}.pdf`;

    const pxHeight = Math.max(paperTarget.offsetHeight || 0, paperTarget.getBoundingClientRect().height || 0);
    const calculatedHeightMm = Math.ceil(pxHeight * 0.2645833) + 4;

    let targetWidthMm = 38;
    let targetHeightMm = 25;

    if (this.paperFormat === '80mm') {
      targetWidthMm = 80;
      targetHeightMm = Math.max(50, calculatedHeightMm);
    } else if (this.paperFormat === '58mm') {
      targetWidthMm = 58;
      targetHeightMm = Math.max(50, calculatedHeightMm);
    } else if (this.paperFormat === '100mm') {
      targetWidthMm = 100;
      targetHeightMm = Math.max(50, calculatedHeightMm);
    } else if (this.paperFormat === 'sticker_38x25') {
      targetWidthMm = 38;
      targetHeightMm = 25;
    } else if (this.paperFormat === 'sticker_50x30') {
      targetWidthMm = 50;
      targetHeightMm = 30;
    } else if (this.paperFormat === 'sticker_50x25') {
      targetWidthMm = 50;
      targetHeightMm = 25;
    } else if (this.paperFormat === 'sticker_75x50') {
      targetWidthMm = 75;
      targetHeightMm = 50;
    } else if (this.paperFormat === 'sticker_25x15') {
      targetWidthMm = 25;
      targetHeightMm = 15;
    } else if (this.paperFormat === '2up_label') {
      targetWidthMm = 76;
      targetHeightMm = 25;
    }

    const isSticker = this.paperFormat.startsWith('sticker_') || this.paperFormat === '2up_label';
    const cards = paperTarget.querySelectorAll('.barcode-sticker-card');

    const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : window.jsPDF;

    if (window.html2canvas && jsPDFClass) {
      if (isSticker && cards.length > 0) {
        // Multi-sticker card PDF export (1 page per sticker, exact dimensions matching format)
        const pageW = targetWidthMm;
        const pageH = targetHeightMm;
        const orientation = pageW >= pageH ? 'l' : 'p';
        const pdfFormat = [pageW, pageH];

        const doc = new jsPDFClass({
          unit: 'mm',
          format: pdfFormat,
          orientation: orientation,
          compress: true
        });

        let chain = Promise.resolve();
        cards.forEach((card, idx) => {
          chain = chain.then(() => {
            // Temporarily strip border & shadow to prevent canvas overflow artifacts
            const origBorder = card.style.border;
            const origShadow = card.style.boxShadow;
            card.style.border = 'none';
            card.style.boxShadow = 'none';

            return window.html2canvas(card, {
              scale: 3,
              backgroundColor: '#ffffff',
              useCORS: true,
              logging: false,
              scrollX: 0,
              scrollY: 0
            }).then(canvas => {
              card.style.border = origBorder;
              card.style.boxShadow = origShadow;

              const imgData = canvas.toDataURL('image/jpeg', 0.98);
              if (idx > 0) {
                doc.addPage(pdfFormat, orientation);
              }
              doc.addImage(imgData, 'JPEG', 0, 0, pageW, pageH, undefined, 'FAST');
            });
          });
        });

        chain.then(() => {
          doc.save(fileName);
        }).catch(err => {
          console.error("PDF multi-card render error:", err);
          this.systemPrint();
        });

      } else {
        // Single invoice or document PDF export
        window.html2canvas(paperTarget, {
          scale: 3,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: 0
        }).then(canvas => {
          const imgData = canvas.toDataURL('image/jpeg', 0.98);
          const formatArg = targetWidthMm > targetHeightMm ? [targetHeightMm, targetWidthMm] : [targetWidthMm, targetHeightMm];
          const orientationArg = targetWidthMm > targetHeightMm ? 'l' : 'p';
          const doc = new jsPDFClass({
            unit: 'mm',
            format: formatArg,
            orientation: orientationArg,
            compress: true
          });
          doc.addImage(imgData, 'JPEG', 0, 0, targetWidthMm, targetHeightMm, undefined, 'FAST');
          doc.save(fileName);
        }).catch(err => {
          console.error("PDF single render error:", err);
          window.print();
        });
      }
    } else if (window.html2pdf) {
      const formatArg = targetWidthMm > targetHeightMm ? [targetHeightMm, targetWidthMm] : [targetWidthMm, targetHeightMm];
      const orientationArg = targetWidthMm > targetHeightMm ? 'l' : 'p';
      const opt = {
        margin: [0, 0, 0, 0],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 3, useCORS: true, logging: false, scrollX: 0, scrollY: 0 },
        jsPDF: { unit: 'mm', format: formatArg, orientation: orientationArg }
      };
      window.html2pdf().set(opt).from(paperTarget).save();
    } else {
      window.print();
    }
  }

  // --- DOWNLOAD PNG IMAGE USING HTML2CANVAS ---
  downloadPNG() {
    const paperTarget = document.getElementById('printablePrintHubTarget');
    if (!paperTarget) return;

    const fileName = `${this.currentTitle.replace(/[^a-zA-Z0-9_\-]/g, '_')}_${Date.now()}.png`;

    if (window.html2canvas) {
      const prevTransform = paperTarget.style.transform;
      paperTarget.style.transform = 'none';

      window.html2canvas(paperTarget, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: 0
      }).then(canvas => {
        paperTarget.style.transform = prevTransform;
        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }).catch(err => {
        paperTarget.style.transform = prevTransform;
        console.error("PNG download error:", err);
      });
    } else {
      alert('PNG ডাউনলোড প্রক্রিয়ার জন্য html2canvas লোড হচ্ছে, অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  }

  // --- COPY CONTENT TEXT TO CLIPBOARD ---
  copyContentText() {
    const paperTarget = document.getElementById('printablePrintHubTarget');
    if (!paperTarget) return;

    const text = paperTarget.innerText || paperTarget.textContent;
    navigator.clipboard.writeText(text).then(() => {
      if (window.cashier && cashier.showToast) cashier.showToast('মেমোর তথ্য ক্লিপবোর্ডে কপি হয়েছে!');
      else alert('প্রিন্ট ডকুমেন্টের সকল তথ্য ও বারকোড টেক্সট ক্লিপবোর্ডে কপি হয়েছে!');
    }).catch(err => {
      console.error("Clipboard copy error:", err);
    });
  }
}

// Global Singleton Instance
const printHub = new SmartPrintHub();
window.printHub = printHub;
