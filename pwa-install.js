// SmartPOS Direct PWA Installation & Standalone App Launcher (Windows & Android Focus)

let deferredPrompt = null;

// Register Service Worker for offline capability & PWA installability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('[PWA] Service Worker active:', reg.scope))
      .catch(err => console.warn('[PWA] Service Worker failed:', err));
  });
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
  console.log('[PWA] SmartPOS app installed successfully!');
  deferredPrompt = null;
  alert('🎉 অভিনন্দন! SmartPOS অ্যাপটি আপনার Windows PC / মোবাইলে ইনস্টল করা হয়েছে। এখন আপনার ডেসটপ বা মোবাইল হোম স্ক্রিন আইকন থেকে সরাসরি ওপেন করতে পারবেন।');
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
