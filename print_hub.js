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
                <option value="sticker_50x30">🏷️ 50mm × 30mm স্টিকার রোল (BD Standard 1-Up Roll)</option>
                <option value="sticker_38x25">🏷️ 38mm × 25mm কসমেটিকস ও পোশাক ১-আপ রোল (Small Roll)</option>
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

    paperTarget.className = `printed-paper-sheet paper-format-${this.paperFormat}`;

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
    paperTarget.style.padding = `${this.settings.marginMm !== undefined ? this.settings.marginMm : 0}mm`;

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

  updateDynamicPrintStyles() {
    let styleTag = document.getElementById('printHubDynamicStyles');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'printHubDynamicStyles';
      document.head.appendChild(styleTag);
    }

    let widthMm = '80mm';
    let heightMm = 'auto';
    let isStickerRoll = false;

    switch(this.paperFormat) {
      case '58mm':
        widthMm = '58mm';
        heightMm = 'auto';
        break;
      case '100mm':
        widthMm = '100mm';
        heightMm = 'auto';
        break;
      case 'sticker_50x30':
        widthMm = '50mm';
        heightMm = '30mm';
        isStickerRoll = true;
        break;
      case 'sticker_38x25':
        widthMm = '38mm';
        heightMm = '25mm';
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
        widthMm = `${this.settings.customWidthMm || 80}mm`;
        heightMm = this.settings.customHeightMm ? `${this.settings.customHeightMm}mm` : 'auto';
        break;
      case '80mm':
      default:
        widthMm = '80mm';
        heightMm = 'auto';
        break;
    }

    const scale = (this.settings.scalePercent || 100) / 100;
    const margin = isStickerRoll ? '0mm' : `${this.settings.marginMm !== undefined ? this.settings.marginMm : 0}mm`;

    let pageRule = heightMm !== 'auto'
      ? `@page { size: ${widthMm} ${heightMm}; margin: 0mm !important; }`
      : `@page { size: ${widthMm} auto; margin: 0mm !important; }`;

    styleTag.innerHTML = `
      @media print {
        ${pageRule}

        /* ABSOLUTE PRINT ISOLATION TO PREVENT GHOSTING / DOUBLE PRINTING OVERLAPS */
        body > *:not(#smartPrintHubModal) {
          display: none !important;
        }

        #smartPrintHubModal {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: ${widthMm} !important;
          height: auto !important;
          background: #ffffff !important;
          color: #000000 !important;
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
          box-shadow: none !important;
        }

        #smartPrintHubModal .print-hub-header,
        #smartPrintHubModal .print-hub-toolbar,
        #smartPrintHubModal .print-hub-settings-drawer,
        #smartPrintHubModal .printer-chassis,
        #smartPrintHubModal .print-progress-wrapper,
        #smartPrintHubModal .laser-scan-line,
        #smartPrintHubModal .print-hub-footer {
          display: none !important;
        }

        #smartPrintHubModal .modal-content,
        #smartPrintHubModal .print-hub-body,
        #smartPrintHubModal .paper-tray-viewport {
          background: #ffffff !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
          width: ${widthMm} !important;
          max-width: ${widthMm} !important;
          overflow: visible !important;
          display: block !important;
        }

        .printed-paper-sheet {
          width: ${widthMm} !important;
          max-width: ${widthMm} !important;
          box-shadow: none !important;
          border: none !important;
          margin: 0 !important;
          padding: ${margin} !important;
          font-size: ${scale * 100}% !important;
          transform: none !important;
          opacity: 1 !important;
          background: #ffffff !important;
          color: #000000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        ${isStickerRoll ? `
        .barcode-studio-header {
          display: none !important;
        }
        .barcode-hub-grid {
          display: block !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .barcode-sticker-card {
          width: ${widthMm} !important;
          max-width: ${widthMm} !important;
          height: ${heightMm} !important;
          max-height: ${heightMm} !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 2px 3px !important;
          page-break-before: auto !important;
          page-break-after: always !important;
          break-after: page !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          overflow: hidden !important;
          border: none !important;
          box-shadow: none !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: space-around !important;
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

      // Motor noise oscillator
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(90, now + totalSec);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.01, now + totalSec);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + totalSec);

      // Thermal head pulse clicks
      const clickCount = Math.floor(totalSec * 12);
      for (let i = 0; i < clickCount; i++) {
        const clickTime = now + (i * (totalSec / clickCount));
        const clickOsc = this.audioCtx.createOscillator();
        const clickGain = this.audioCtx.createGain();
        clickOsc.type = 'square';
        clickOsc.frequency.setValueAtTime(800 + (i % 3) * 200, clickTime);
        clickGain.gain.setValueAtTime(0.04, clickTime);
        clickGain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.03);
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
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch(e) {}
  }

  // --- PAPER EJECTION & SCANNER ANIMATION ENGINE ---
  // Triggered when printing or replaying paper ejection animation
  triggerPrintEjection() {
    this.playPrintAnimation();
  }

  playPrintAnimation() {
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

    let animDuration = 1500;
    if (speed === 'fast') animDuration = 600;
    if (speed === 'instant') animDuration = 50;

    this.isAnimating = true;

    // Lock viewport overflow during animation so paper emerges inside chassis frame
    if (paperTrayViewport) {
      paperTrayViewport.scrollTop = 0;
      paperTrayViewport.style.overflowY = 'hidden';
    }

    // Reset paper feed initial state (sliding UPWARD from bottom to top)
    paperTarget.style.transition = 'none';
    paperTarget.style.transform = 'translateY(100%)';
    paperTarget.style.opacity = '0.3';
    if (laserLine) {
      laserLine.style.display = 'block';
      laserLine.style.top = '0%';
    }

    if (statusLed) statusLed.className = 'led led-status printing';
    if (statusLedText) statusLedText.innerText = 'EJECTING...';

    if (progressWrapper) progressWrapper.style.display = 'flex';
    if (progressBar) progressBar.style.width = '0%';
    if (progressText) progressText.innerText = '🖨️ নিচ থেকে ওপরের দিকে বারকোড স্টিকার প্রিন্ট হয়ে বের হচ্ছে... 0%';

    // Play thermal printer motor audio sound
    if (speed !== 'instant') {
      this.playPrinterAudio(animDuration);
    }

    // Force layout reflow
    void paperTarget.offsetHeight;

    const startTime = performance.now();

    const animateStep = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / animDuration);

      const percent = Math.floor(progress * 100);
      if (progressBar) progressBar.style.width = `${percent}%`;
      if (progressText) progressText.innerText = `🖨️ নিচ থেকে ওপরের দিকে বারকোড স্টিকার প্রিন্ট হয়ে বের হচ্ছে... ${percent}%`;

      // Smooth realistic paper feeding animation sliding UPWARD from bottom to top out of slot
      const translateY = 100 - (progress * 100);
      paperTarget.style.transform = `translateY(${translateY}%)`;
      paperTarget.style.opacity = `${0.3 + (progress * 0.7)}`;

      if (laserLine) {
        laserLine.style.top = `${(1 - progress) * 100}%`;
      }

      if (progress < 1) {
        requestAnimationFrame(animateStep);
      } else {
        // Animation complete
        paperTarget.style.transform = 'translateY(0%)';
        paperTarget.style.opacity = '1';
        if (laserLine) laserLine.style.display = 'none';

        if (statusLed) statusLed.className = 'led led-status ready';
        if (statusLedText) statusLedText.innerText = 'PRINT COMPLETE';
        if (progressText) progressText.innerText = '✅ বারকোড স্টিকার প্রিন্ট সম্পন্ন!';

        // Unlock scroll after ejection completes so user can inspect roll
        if (paperTrayViewport) {
          paperTrayViewport.style.overflowY = 'auto';
        }

        this.playSuccessBeep();
        this.isAnimating = false;

        setTimeout(() => {
          if (progressWrapper) progressWrapper.style.display = 'none';
        }, 800);
      }
    };

    requestAnimationFrame(animateStep);
  }

  // Set instant visible state (no loading animation delay on modal open)
  setInstantVisible() {
    const paperTarget = document.getElementById('printablePrintHubTarget');
    const paperTrayViewport = document.getElementById('paperTrayViewport');
    const progressWrapper = document.getElementById('printProgressWrapper');
    const laserLine = document.getElementById('printerLaserLine');
    const statusLed = document.getElementById('printerStatusLed');
    const statusLedText = document.getElementById('printerLedText');

    if (paperTarget) {
      paperTarget.style.transition = 'none';
      paperTarget.style.transform = 'translateY(0%)';
      paperTarget.style.opacity = '1';
    }
    if (paperTrayViewport) {
      paperTrayViewport.style.overflowY = 'auto';
    }
    if (progressWrapper) progressWrapper.style.display = 'none';
    if (laserLine) laserLine.style.display = 'none';
    if (statusLed) statusLed.className = 'led led-status ready';
    if (statusLedText) statusLedText.innerText = 'READY';
  }

  // --- OPEN BARCODE STICKER PRINT STUDIO ---
  openBarcodeStudio({ title = 'বারকোড স্টিকার প্রিন্ট হাব', items = [], paperFormat = null }) {
    this.currentTitle = title;
    this.currentItems = items || [];
    if (paperFormat) {
      this.paperFormat = paperFormat;
      this.settings.paperFormat = paperFormat;
    } else {
      this.paperFormat = this.settings.paperFormat || 'sticker_50x30';
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
      <div class="barcode-studio-header text-center mb-3">
        <h4 style="margin:0; font-size:1.1rem; color:#111; font-weight:800;">SmartPOS Barcode Label Sheet</h4>
        <p style="margin:2px 0 0; font-size:0.75rem; color:#555;">তারিখ: ${new Date().toLocaleDateString('bn-BD')} | মোট স্টিকার: ${items.length} টি</p>
        <div style="border-bottom:2px dashed #333; margin:8px 0 14px;"></div>
      </div>
      <div class="barcode-hub-grid" id="barcodeHubGrid">
    `;

    items.forEach((item, idx) => {
      const mrpText = (item.mrp && item.mrp > item.price) ? `<del style="font-size:0.7rem; color:#777;">৳${item.mrp}</del> ` : '';
      const nameStr = item.name || '';
      const len = nameStr.trim().length;
      let fontStyling = 'font-size:0.78rem; font-weight:800; line-height:1.15;';
      if (len > 32) {
        fontStyling = 'font-size:0.64rem; font-weight:600; line-height:1.1;';
      } else if (len > 22) {
        fontStyling = 'font-size:0.70rem; font-weight:700; line-height:1.12;';
      }

      stickersHtml += `
        <div class="barcode-sticker-card hub-sticker" style="background:#fff; color:#000; padding:6px 5px; border:1px solid #000; border-radius:6px; text-align:center; box-shadow:0 2px 5px rgba(0,0,0,0.08); display:flex; flex-direction:column; align-items:center; justify-content:center; page-break-inside:avoid; break-inside:avoid;">
          <div style="${fontStyling} width:100%; text-align:center; color:#000; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; word-break:break-word; word-wrap:break-word;">${item.name}</div>
          <div style="font-size:0.68rem; font-weight:600; color:#333; margin-top:2px;">${item.variantDetails || ''}</div>
          <div style="width:100%; display:flex; justify-content:center; margin:3px 0;">
            <svg id="hubBcSvg_${idx}" style="max-width:100%; height:auto; display:block; margin:0 auto; shape-rendering:crispEdges;"></svg>
          </div>
          <div style="font-size:0.85rem; font-weight:800; color:#000; margin-top:1px;">
            মূল্য: ${mrpText}৳${item.price}
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

    let bcWidth = 1.4;
    let bcHeight = 40;
    let bcFontSize = 10;
    let bcMargin = 2;

    if (this.paperFormat === 'sticker_50x30') {
      bcWidth = 1.35;
      bcHeight = 36;
      bcFontSize = 10;
      bcMargin = 2;
    } else if (this.paperFormat === 'sticker_38x25') {
      bcWidth = 1.15;
      bcHeight = 28;
      bcFontSize = 9;
      bcMargin = 1;
    } else if (this.paperFormat === 'sticker_50x25') {
      bcWidth = 1.3;
      bcHeight = 30;
      bcFontSize = 9.5;
      bcMargin = 1;
    } else if (this.paperFormat === 'sticker_75x50') {
      bcWidth = 1.75;
      bcHeight = 55;
      bcFontSize = 12;
      bcMargin = 3;
    } else if (this.paperFormat === 'sticker_25x15') {
      bcWidth = 0.85;
      bcHeight = 18;
      bcFontSize = 8;
      bcMargin = 0;
    } else if (this.paperFormat === '2up_label') {
      bcWidth = 1.25;
      bcHeight = 32;
      bcFontSize = 10;
      bcMargin = 1;
    } else if (this.paperFormat === 'a4_grid') {
      bcWidth = 1.4;
      bcHeight = 40;
      bcFontSize = 11;
      bcMargin = 2;
    } else if (this.paperFormat === '58mm') {
      bcWidth = 1.25;
      bcHeight = 32;
      bcFontSize = 10;
      bcMargin = 1;
    }

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
            margin: bcMargin,
            background: "#ffffff",
            lineColor: "#000000",
            displayValue: true
          });
        }
      } catch (e) {
        console.error("Barcode re-render error:", e);
      }
    });
  }

  // --- OPEN THERMAL RECEIPT / MEMO PRINT STUDIO ---
  openReceiptStudio({ title = 'সেলস ইনভয়েস মেমো', receiptHtml, invoiceId = '' }) {
    this.currentTitle = invoiceId ? `Memo_${invoiceId}` : 'Sales_Receipt';
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

    if (window.html2pdf) {
      const opt = {
        margin: [2, 2, 2, 2],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: this.paperFormat === '80mm' ? [80, 297] : (this.paperFormat === '58mm' ? [58, 297] : 'a4'), orientation: 'portrait' }
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

    const renderCanvasAndDownload = () => {
      if (window.html2canvas) {
        window.html2canvas(paperTarget, { scale: 2, backgroundColor: '#ffffff', useCORS: true }).then(canvas => {
          const link = document.createElement('a');
          link.download = fileName;
          link.href = canvas.toDataURL('image/png');
          link.click();
        });
      } else {
        alert('PNG ডাউনলোড সেশনের জন্য html2canvas লাইব্রেরি লোড হচ্ছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
    };

    renderCanvasAndDownload();
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
