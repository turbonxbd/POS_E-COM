// SmartPOS Direct PWA Installation & Standalone App Launcher & Live Auto-Update Engine (Windows & Android Focus)

let deferredPrompt = null;
let swRegistration = null;

// Register Service Worker & Listen for New Live Code Updates
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        swRegistration = reg;
        console.log('[PWA] Service Worker active:', reg.scope);

        // Force browser to check GitHub Pages for new SW version immediately on app launch!
        reg.update();

        // If a new Service Worker is waiting, force skipWaiting immediately
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING', action: 'skipWaiting' });
        }

        // Listen for new updates found
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New version installed! Activating immediately...');
                installingWorker.postMessage({ type: 'SKIP_WAITING', action: 'skipWaiting' });
              }
            };
          }
        };
      })
      .catch(err => console.warn('[PWA] Service Worker failed:', err));

    // Handle controllerchange event (when new SW takes control, reload app window automatically!)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

// BroadcastChannel for Live App Update Signals from Super Admin
if (typeof BroadcastChannel !== 'undefined') {
  try {
    const updateChannel = new BroadcastChannel('pos_app_update_channel');
    updateChannel.onmessage = (event) => {
      if (event.data && (event.data.type === 'APP_UPDATE_PUBLISHED' || event.data.type === 'global_app_update')) {
        console.log('[PWA] Live app update published by Super Admin!');
        showAppUpdateBanner(event.data.version || 'v5.0.0');
      }
    };
  } catch (e) {}
}

// Check if running inside installed App mode (standalone window)
function isStandaloneApp() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
}

// If launched from installed Desktop/Mobile app icon while on landing index.html, immediately jump to Retail Portal
if (isStandaloneApp() && (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/'))) {
  window.location.href = 'portal.html';
}

// Intercept browser's PWA install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Highlight all install buttons across the site
  document.querySelectorAll('.btn-install-pwa, #btnInstallApp, #btnInstallAppHero, .install-app-trigger').forEach(btn => {
    if (btn) {
      btn.style.display = 'inline-flex';
      btn.classList.add('pwa-ready');
    }
  });

  console.log('[PWA] Native Chrome / Edge installation prompt intercepted.');
});

// Triggered when App installation is completed by merchant
window.addEventListener('appinstalled', () => {
  console.log('[PWA] Smart POS BD app installed successfully!');
  deferredPrompt = null;
  alert('🎉 অভিনন্দন! Smart POS BD অ্যাপটি আপনার Windows PC / মোবাইলে ইনস্টল করা হয়েছে। এখন আপনার ডেসটপ বা মোবাইল হোম স্ক্রিন আইকন থেকে সরাসরি ওপেন করতে পারবেন।');
});

// Direct One-Click App Download/Installation Trigger
async function triggerPWAInstall() {
  if (deferredPrompt) {
    // Show Chrome / Edge native install dialog immediately
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      console.log('[PWA] Merchant installed the app!');
    } else {
      console.log('[PWA] Merchant canceled install prompt.');
    }
    deferredPrompt = null;
  } else {
    // Direct Chrome / Edge install guide
    showPWAInstallPromptNotice();
  }
}

// Focused Clean Chrome/Edge Install Notice
function showPWAInstallPromptNotice() {
  let modal = document.getElementById('pwaInstallNoticeModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'pwaInstallNoticeModal';
    modal.className = 'modal-backdrop';
    modal.style.cssText = 'display:flex; align-items:center; justify-content:center; z-index:10000; padding:1rem;';
    modal.innerHTML = `
      <div style="background:#0f172a; border-radius:24px; border:1px solid rgba(16,185,129,0.3); width:100%; max-width:500px; padding:2rem; color:#fff; font-family:'Hind Siliguri', sans-serif; box-shadow:0 20px 50px rgba(0,0,0,0.6); position:relative;">
        <button id="closePwaNoticeBtn" style="position:absolute; top:1.25rem; right:1.25rem; background:none; border:none; color:#94a3b8; font-size:1.5rem; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
        
        <div style="width:64px; height:64px; background:linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05)); border:2px solid #10b981; border-radius:18px; display:flex; align-items:center; justify-content:center; font-size:2rem; color:#10b981; margin:0 auto 1.25rem;">
          <i class="fa-solid fa-download"></i>
        </div>

        <h3 style="margin:0 0 0.5rem; font-size:1.4rem; color:#fff; text-align:center; font-weight:700;">
          Chrome / Edge থেকে অ্যাপ ইনস্টল করুন
        </h3>
        
        <p style="color:#94a3b8; font-size:0.95rem; text-align:center; margin-bottom:1.5rem; line-height:1.6;">
          আপনার <strong>Windows PC বা Android মোবাইল</strong>-এ সরাসরি অ্যাপ ডেসটপ আইকন তৈরি করতে নিচের ২টি উপায়ের একটি ব্যবহার করুন:
        </p>

        <div style="background:rgba(30,41,59,0.7); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:1.25rem; margin-bottom:1.5rem; display:flex; flex-direction:column; gap:1rem;">
          <div style="display:flex; gap:0.75rem; align-items:flex-start;">
            <div style="background:#10b981; color:#000; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; flex-shrink:0; font-size:0.85rem;">১</div>
            <div style="color:#cbd5e1; font-size:0.92rem; line-height:1.5;">
              ব্রাউজারের অ্যাড্রেস বারের ডান পাশে থাকা <strong><i class="fa-solid fa-desktop text-success"></i> (Install SmartPOS App)</strong> বাটনে ক্লিক করুন।
            </div>
          </div>
          <div style="display:flex; gap:0.75rem; align-items:flex-start;">
            <div style="background:#3b82f6; color:#fff; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; flex-shrink:0; font-size:0.85rem;">২</div>
            <div style="color:#cbd5e1; font-size:0.92rem; line-height:1.5;">
              অথবা ব্রাউজারের উপরে ডান কোণায় <strong>৩-ডট (⋮)</strong> মেনুতে চাপ দিয়ে <strong>"Install App"</strong> অথবা <strong>"Add to Home screen"</strong> সিলেক্ট করুন।
            </div>
          </div>
        </div>

        <button id="gotItPwaNoticeBtn" style="width:100%; background:linear-gradient(135deg, #10b981, #059669); color:#fff; border:none; padding:0.85rem; border-radius:12px; font-weight:700; font-size:1rem; cursor:pointer; font-family:'Hind Siliguri', sans-serif;">
          <i class="fa-solid fa-check-circle"></i> বুঝেছি, ইনস্টল করবো
        </button>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('closePwaNoticeBtn').onclick = () => modal.style.display = 'none';
    document.getElementById('gotItPwaNoticeBtn').onclick = () => modal.style.display = 'none';
  } else {
    modal.style.display = 'flex';
  }
}

// Show Glassmorphism App Update Floating Banner
function showAppUpdateBanner(version = 'v5.0.0') {
  if (document.getElementById('pwaAppUpdateBanner')) return;

  const banner = document.createElement('div');
  banner.id = 'pwaAppUpdateBanner';
  banner.style.cssText = 'position:fixed; bottom:1.5rem; right:1.5rem; z-index:9999999; background:rgba(15,23,42,0.96); backdrop-filter:blur(16px); border:2px solid #10b981; border-radius:20px; padding:1.25rem 1.5rem; max-width:420px; width:calc(100% - 3rem); box-shadow:0 20px 50px rgba(0,0,0,0.6); color:#fff; font-family:"Hind Siliguri", sans-serif; animation:slideUpPwaBanner 0.4s ease-out;';
  
  banner.innerHTML = `
    <div style="display:flex; align-items:flex-start; gap:12px;">
      <div style="width:48px; height:48px; border-radius:14px; background:rgba(16,185,129,0.2); border:1px solid #10b981; color:#10b981; display:flex; align-items:center; justify-content:center; font-size:1.5rem; flex-shrink:0;">
        <i class="fa-solid fa-rocket"></i>
      </div>
      <div style="flex:1;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <h4 style="margin:0; font-size:1.05rem; font-weight:700; color:#10b981;">🚀 নতুন অ্যাপ আপডেট পাওয়া গেছে!</h4>
          <span style="background:rgba(16,185,129,0.2); color:#10b981; font-size:0.72rem; padding:2px 8px; border-radius:10px; font-weight:700;">${version}</span>
        </div>
        <p style="margin:0 0 10px; font-size:0.88rem; color:#cbd5e1; line-height:1.5;">
          নতুন ফিচার ও পারফরম্যান্স আপডেট প্রকাশ করা হয়েছে। নিরবচ্ছিন্ন সেরা অভিজ্ঞতার জন্য এখনই আপডেট করুন।
        </p>
        <div style="display:flex; gap:8px;">
          <button type="button" onclick="forceAppUpdate()" class="btn" style="flex:1; background:linear-gradient(135deg, #10b981, #059669); color:#fff; border:none; padding:0.65rem 1rem; border-radius:12px; font-weight:700; font-size:0.9rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 6px 18px rgba(16,185,129,0.3);">
            <i class="fa-solid fa-rotate"></i> 🔄 এখনই অ্যাপ আপডেট করুন
          </button>
          <button type="button" onclick="document.getElementById('pwaAppUpdateBanner').remove()" style="background:rgba(255,255,255,0.08); color:#cbd5e1; border:1px solid rgba(255,255,255,0.15); padding:0.6rem 0.85rem; border-radius:12px; font-weight:600; font-size:0.85rem; cursor:pointer;">
            পরে করবো
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(banner);
}

// Execute Force App Update: Purges caches, unregisters old service worker, and reloads clean latest code
async function forceAppUpdate() {
  const btn = document.querySelector('#pwaAppUpdateBanner button');
  if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> আপডেট হচ্ছে...';

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
    }

    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }

    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ action: 'skipWaiting' });
    }
  } catch (e) {
    console.warn('[PWA] Cache purge warning:', e);
  }

  setTimeout(() => {
    window.location.reload(true);
  }, 500);
}

// Manual Update Check Trigger for Merchants (from sidebar or footer)
window.checkAppUpdate = async function () {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        if (reg.waiting || reg.installing) {
          showAppUpdateBanner('v5.0.0');
          return;
        }
      }
    } catch (e) {}
  }
  alert('✅ আপনার অ্যাপটি সম্পূর্ণ আপ-টু-ডেট (v5.0.0) রয়েছে! কোনো নতুন আপডেট পেন্ডিং নেই।');
};

// Attach Event Listeners on Page Ready
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.btn-install-pwa, #btnInstallApp, #btnInstallAppHero, .install-app-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      triggerPWAInstall();
    });
  });

  // Apply Standalone Class to Body if launched as app
  if (isStandaloneApp()) {
    document.body.classList.add('is-standalone-app');
  }
});
