// SmartPOS - Multi-Tenant Firebase Cloud Firestore Sync & Data Security Engine
// v5.0.0 — Server-as-Source-of-Truth Architecture
// Handles 100% isolated merchant store databases, tenant namespacing, and data loss prevention

const firebaseConfig = {
  apiKey: "AIzaSyAafC8EolMwLwN6guJa8yDkNVLt9IAuizQ",
  authDomain: "pos-e-com-bd.firebaseapp.com",
  projectId: "pos-e-com-bd",
  storageBucket: "pos-e-com-bd.firebasestorage.app",
  messagingSenderId: "5077805615",
  appId: "1:5077805615:web:c13a1d497d41d3a66374da",
  measurementId: "G-REQMFSZ5KF"
};

// Initialize Firebase SDK
if (typeof firebase !== 'undefined') {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
} else {
  console.warn('[Firebase Cloud] SDK compat scripts not loaded yet.');
}

class FirebasePOSSync {
  constructor() {
    this.db = typeof firebase !== 'undefined' ? firebase.firestore() : null;
    this.storeId = localStorage.getItem('pos_active_store_id') || 'store_default';
    this.keys = ['pos_products', 'pos_sales', 'pos_customers', 'pos_categories', 'pos_coupons', 'pos_settings', 'pos_payment_gateways', 'pos_shift_sales'];
    this.globalKeys = ['pos_subscriptions', 'pos_subscription', 'pos_landing_cms', 'pos_active_store_id', 'pos_session_logged_in', 'pos_theme', 'pos_master_authenticated'];
    this.isApplyingRemoteChange = false;
    this.unsubscribers = [];
    // Per-key local write timestamps for conflict resolution
    this._localUpdatedAt = {};

    // Ensure tenant-isolated LocalStorage state is active
    this.syncTenantLocalStorageCache();

    if (this.db) {
      try {
        this.db.enablePersistence({ synchronizeTabs: true }).catch(err => {
          if (err.code === 'failed-precondition') {
            console.warn('[Firebase Cloud] Offline persistence: Multiple tabs open in browser');
          } else if (err.code === 'unimplemented') {
            console.warn('[Firebase Cloud] Offline persistence not supported in this browser');
          }
        });
      } catch (e) {}

      this.initCloudSync();
      this.hookLocalStorage();
    }

    // Auto-Sync offline data when Internet connection is restored
    window.addEventListener('online', async () => {
      console.log('[Firebase Cloud Sync] Internet reconnected! Auto-syncing offline data...');
      if (this.storeId && this.db) {
        try {
          for (const key of this.keys) {
            const tenantKey = this.getTenantStorageKey(key);
            const localVal = localStorage.getItem(tenantKey) || localStorage.getItem(key);
            if (localVal && localVal !== '[]' && localVal !== '{}') {
              await this.pushKeyToCloud(key, localVal);
            }
          }

          const activeSub = JSON.parse(localStorage.getItem('pos_subscription')) || {};
          const tenantSettings = JSON.parse(localStorage.getItem(`pos_tenant_${this.storeId}_pos_settings`)) || JSON.parse(localStorage.getItem('pos_settings')) || {};

          if (this.storeId && this.storeId !== 'store_demo_101') {
            await this.db.collection('subscriptions').doc(this.storeId).set({
              storeId: this.storeId,
              storeName: tenantSettings.storeName || activeSub.storeName || 'Merchant Store',
              adminPin: tenantSettings.adminPin || activeSub.adminPin || '1234',
              merchantPassword: tenantSettings.merchantPassword || tenantSettings.adminPin || activeSub.merchantPassword || '1234',
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }).catch(() => {});
          }

          console.log('[Firebase Cloud Sync] Offline sync completed!');
          window.dispatchEvent(new CustomEvent('pos_online_sync_completed', { detail: { storeId: this.storeId } }));
        } catch (err) {
          console.warn('[Firebase Cloud Sync Warning]:', err);
        }
      }
    });
  }

  // Get tenant-namespaced LocalStorage key
  getTenantStorageKey(key) {
    if (this.globalKeys.includes(key)) return key;
    return `pos_tenant_${this.storeId}_${key}`;
  }

  // Strict tenant data sanitizer
  sanitizeTenantData(key, rawJsonString) {
    if (!rawJsonString) return null;
    try {
      const parsed = JSON.parse(rawJsonString);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter(item => !item.storeId || item.storeId === this.storeId);
        return JSON.stringify(filtered);
      }
      return rawJsonString;
    } catch (e) {
      return rawJsonString;
    }
  }

  // Synchronize local memory cache with active merchant store namespace
  syncTenantLocalStorageCache() {
    this.isApplyingRemoteChange = true;
    const isGuestStore = !this.storeId || this.storeId === 'store_demo_101' || this.storeId === 'store_default';

    this.keys.forEach(key => {
      const tenantKey = this.getTenantStorageKey(key);
      let tenantData = localStorage.getItem(tenantKey);

      if (tenantData) {
        tenantData = this.sanitizeTenantData(key, tenantData);
      }

      // AUTO-MIGRATION: Only for Guest Store!
      if (isGuestStore && (!tenantData || tenantData === '[]' || tenantData === '{}')) {
        const legacyData = localStorage.getItem(key) || localStorage.getItem(`${key}_raw_backup`);
        if (legacyData && legacyData !== '[]' && legacyData !== '{}') {
          const sanitizedLegacy = this.sanitizeTenantData(key, legacyData);
          if (sanitizedLegacy && sanitizedLegacy !== '[]') {
            tenantData = sanitizedLegacy;
            localStorage.setItem(tenantKey, sanitizedLegacy);
          }
        }
      }

      if (tenantData !== null) {
        localStorage.setItem(key, tenantData);
        localStorage.setItem(`${key}_raw_backup`, tenantData);
      } else {
        const emptyVal = key === 'pos_settings' ? '{}' : '[]';
        localStorage.setItem(tenantKey, emptyVal);
        localStorage.setItem(key, emptyVal);
      }
    });
    this.isApplyingRemoteChange = false;
  }

  // Set active merchant tenant store and re-bind Firestore cloud listeners
  setStoreId(newStoreId) {
    if (!newStoreId || newStoreId === this.storeId) return;

    this.createBackupSnapshot();

    this.unsubscribers.forEach(unsub => typeof unsub === 'function' && unsub());
    this.unsubscribers = [];

    // Clear global alias keys to prevent old store data bleeding into new store UI
    this.keys.forEach(key => {
      const emptyVal = key === 'pos_settings' ? '{}' : '[]';
      localStorage.setItem(key, emptyVal);
    });

    this.storeId = newStoreId;
    this._localUpdatedAt = {};
    localStorage.setItem('pos_active_store_id', newStoreId);

    this.syncTenantLocalStorageCache();

    console.log(`[Firebase Cloud] Switched active store to: ${newStoreId}`);
    this.initCloudSync();

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('pos_tenant_changed', { detail: { storeId: newStoreId } }));
  }

  // Hook into LocalStorage to auto-push local changes
  hookLocalStorage() {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    const originalGetItem = localStorage.getItem.bind(localStorage);
    const originalRemoveItem = localStorage.removeItem.bind(localStorage);
    const self = this;

    localStorage.setItem = function (key, value) {
      originalSetItem(key, value);

      if (self.keys.includes(key) && !self.isApplyingRemoteChange) {
        const tenantKey = self.getTenantStorageKey(key);
        originalSetItem(tenantKey, value);
        originalSetItem(`${key}_raw_backup`, value);
        // Track local write time for conflict resolution
        self._localUpdatedAt[key] = Date.now();
        self.pushKeyToCloud(key, value);
      }
    };

    localStorage.getItem = function (key) {
      if (self.keys.includes(key)) {
        const tenantKey = self.getTenantStorageKey(key);
        const tenantVal = originalGetItem(tenantKey);
        if (tenantVal !== null && tenantVal !== undefined) {
          return self.sanitizeTenantData(key, tenantVal);
        }
      }
      return originalGetItem(key);
    };

    localStorage.removeItem = function (key) {
      if (self.keys.includes(key)) {
        const currentVal = originalGetItem(key);
        if (currentVal && currentVal !== '[]') {
          originalSetItem(`${key}_soft_deleted_backup_${Date.now()}`, currentVal);
        }
      }
      originalRemoveItem(key);
    };
  }

  // Push single key data to Firestore with automatic chunking for unlimited products
  async pushKeyToCloud(key, jsonStringValue) {
    if (!this.db || !this.storeId || this.storeId === 'store_demo_101') return;

    try {
      let parsedData;
      try { parsedData = JSON.parse(jsonStringValue); } catch (e) { parsedData = jsonStringValue; }

      if (key === 'pos_products' && Array.isArray(parsedData)) {
        parsedData = parsedData.map(p => ({
          ...p,
          storeId: this.storeId,
          tenantSKU: p.barcode ? `${this.storeId}_${p.barcode}` : p.id
        }));

        const jsonStr = JSON.stringify(parsedData);
        const byteSize = new Blob([jsonStr]).size;

        // If products size exceeds 700KB, chunk into sub-documents for UNLIMITED products
        if (byteSize > 700000) {
          const chunkSize = 250;
          const chunks = [];
          for (let i = 0; i < parsedData.length; i += chunkSize) {
            chunks.push(parsedData.slice(i, i + chunkSize));
          }

          console.log(`[Firebase Cloud] Chunking ${parsedData.length} products into ${chunks.length} documents...`);
          const batch = this.db.batch();

          chunks.forEach((chunk, idx) => {
            const chunkRef = this.db.collection('stores').doc(this.storeId).collection('pos_data').doc(`pos_products_chunk_${idx}`);
            batch.set(chunkRef, {
              storeId: this.storeId,
              chunkIndex: idx,
              data: chunk,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
              clientUpdatedAt: Date.now()
            });
          });

          const mainRef = this.db.collection('stores').doc(this.storeId).collection('pos_data').doc('pos_products');
          batch.set(mainRef, {
            storeId: this.storeId,
            isChunked: true,
            chunksCount: chunks.length,
            totalProducts: parsedData.length,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            clientUpdatedAt: Date.now()
          });

          await batch.commit();
          console.log(`[Firebase Cloud] Successfully committed ${chunks.length} product chunks (${(byteSize / 1024).toFixed(1)}KB).`);
          return;
        }
      }

      const byteSize = new Blob([jsonStringValue]).size;
      await this.db.collection('stores').doc(this.storeId).collection('pos_data').doc(key).set({
        storeId: this.storeId,
        isChunked: false,
        data: parsedData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        clientUpdatedAt: Date.now()
      }, { merge: true });

      console.log(`[Firebase Cloud] Synced ${key} (${(byteSize / 1024).toFixed(1)}KB) for Store [${this.storeId}]`);
    } catch (error) {
      console.error(`[Firebase Cloud Error] Failed to push ${key}:`, error);
    }
  }

  // Listen to live Cloud changes via Firestore onSnapshot
  // *** SERVER IS THE SINGLE SOURCE OF TRUTH ***
  initCloudSync() {
    if (!this.db || !this.storeId) return;

    this.keys.forEach(key => {
      const docRef = this.db.collection('stores').doc(this.storeId).collection('pos_data').doc(key);

      const unsub = docRef.onSnapshot(async doc => {
        if (!doc.exists) {
          const localTs = this._localUpdatedAt[key] || 0;
          const isVeryRecentLocalWrite = (Date.now() - localTs) < 30000;
          if (isVeryRecentLocalWrite) {
            const tenantKey = this.getTenantStorageKey(key);
            const localVal = localStorage.getItem(tenantKey) || localStorage.getItem(key);
            if (localVal && localVal !== '[]' && localVal !== '{}') {
              console.log(`[Firebase Cloud] Seeding fresh local ${key} to new cloud document...`);
              this.pushKeyToCloud(key, localVal);
            }
          }
          return;
        }

        const remotePayload = doc.data();
        if (!remotePayload || (remotePayload.data === undefined && !remotePayload.isChunked)) return;

        const serverClientTs = remotePayload.clientUpdatedAt || 0;
        const localTs = this._localUpdatedAt[key] || 0;
        if (localTs > serverClientTs + 2000) {
          console.log(`[Firebase Cloud] Skipping stale snapshot for ${key} (local is ${localTs - serverClientTs}ms newer)`);
          return;
        }

        let finalData = remotePayload.data;

        // Reconstruct chunked product documents if dataset is large
        if (key === 'pos_products' && remotePayload.isChunked && remotePayload.chunksCount > 0) {
          try {
            const chunkPromises = [];
            for (let i = 0; i < remotePayload.chunksCount; i++) {
              chunkPromises.push(this.db.collection('stores').doc(this.storeId).collection('pos_data').doc(`pos_products_chunk_${i}`).get());
            }
            const chunkDocs = await Promise.all(chunkPromises);
            let combined = [];
            chunkDocs.forEach(cDoc => {
              if (cDoc.exists && cDoc.data() && Array.isArray(cDoc.data().data)) {
                combined = combined.concat(cDoc.data().data);
              }
            });
            if (combined.length > 0) {
              finalData = combined;
            }
          } catch (chunkErr) {
            console.error('[Firebase Cloud] Error fetching product chunks:', chunkErr);
          }
        }

        // Smart Stock Merger for pos_products using lastStockUpdatedAt timestamps
        if (key === 'pos_products' && Array.isArray(finalData)) {
          const tenantKey = this.getTenantStorageKey(key);
          let localProducts = [];
          try { localProducts = JSON.parse(localStorage.getItem(tenantKey) || localStorage.getItem(key) || '[]'); } catch (e) {}
          if (Array.isArray(localProducts) && localProducts.length > 0) {
            const localMap = new Map();
            localProducts.forEach(p => { if (p && p.id) localMap.set(p.id, p); });

            finalData = finalData.map(rp => {
              const lp = localMap.get(rp.id);
              if (!lp) return rp;

              if (Array.isArray(rp.variants) && Array.isArray(lp.variants)) {
                const mergedVariants = rp.variants.map(rv => {
                  const lv = lp.variants.find(v => v.variantId === rv.variantId);
                  if (lv && lv.lastStockUpdatedAt && (!rv.lastStockUpdatedAt || lv.lastStockUpdatedAt > rv.lastStockUpdatedAt)) {
                    return { ...rv, stock: lv.stock, lastStockUpdatedAt: lv.lastStockUpdatedAt };
                  }
                  return rv;
                });
                return { ...rp, variants: mergedVariants };
              } else if (lp.lastStockUpdatedAt && (!rp.lastStockUpdatedAt || lp.lastStockUpdatedAt > rp.lastStockUpdatedAt)) {
                return { ...rp, stock: lp.stock, lastStockUpdatedAt: lp.lastStockUpdatedAt };
              }
              return rp;
            });
          }
        }

        // Smart Sales Merger: preserve unsynced offline sales
        if (key === 'pos_sales' && Array.isArray(remotePayload.data)) {
          const tenantKey = this.getTenantStorageKey(key);
          let localSales = [];
          try { localSales = JSON.parse(localStorage.getItem(tenantKey) || localStorage.getItem(key) || '[]'); } catch (e) {}
          if (Array.isArray(localSales) && localSales.length > 0) {
            const salesMap = new Map();
            remotePayload.data.forEach(s => { if (s && (s.id || s.timestamp)) salesMap.set(s.id || s.timestamp, s); });
            localSales.forEach(s => {
              if (s && (s.id || s.timestamp) && !salesMap.has(s.id || s.timestamp)) {
                salesMap.set(s.id || s.timestamp, s);
              }
            });
            const merged = Array.from(salesMap.values()).sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
            if (merged.length > remotePayload.data.length) {
              console.log(`[Firebase Cloud] Merging ${merged.length - remotePayload.data.length} offline sales to server...`);
              this.pushKeyToCloud('pos_sales', JSON.stringify(merged));
            }
            finalData = merged;
          }
        }

        const finalJson = JSON.stringify(finalData);
        const tenantKey = this.getTenantStorageKey(key);
        const currentTenantJson = localStorage.getItem(tenantKey);

        if (finalJson !== currentTenantJson) {
          this.isApplyingRemoteChange = true;
          localStorage.setItem(tenantKey, finalJson);
          localStorage.setItem(key, finalJson);
          localStorage.setItem(`${key}_raw_backup`, finalJson);
          this.isApplyingRemoteChange = false;

          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new CustomEvent('pos_cloud_update', { detail: { key, data: finalData } }));
          console.log(`[Firebase Cloud] Live update applied for ${key} in Store [${this.storeId}]`);
        }
      }, err => {
        console.error(`[Firebase Cloud Listener Error] ${key}:`, err);
      });

      this.unsubscribers.push(unsub);
    });

    // CMS Sync
    try {
      const cmsDocRef = this.db.collection('landing_cms').doc('content');
      const cmsUnsub = cmsDocRef.onSnapshot(doc => {
        if (doc.exists && doc.data()) {
          const cloudCMS = doc.data();
          const existingCMS = JSON.parse(localStorage.getItem('pos_landing_cms')) || {};
          const mergedCMS = { ...existingCMS, ...cloudCMS };
          localStorage.setItem('pos_landing_cms', JSON.stringify(mergedCMS));
          window.dispatchEvent(new CustomEvent('pos_cms_cloud_update', { detail: mergedCMS }));
        }
      }, err => {
        console.warn('[Firebase Cloud Listener Warning] landing_cms:', err);
      });
      this.unsubscribers.push(cmsUnsub);
    } catch (e) {}

    // Subscriptions Sync
    try {
      const activeStoreId = this.storeId || localStorage.getItem('pos_active_store_id');
      const settings = JSON.parse(localStorage.getItem('pos_settings')) || {};

      const subUnsub = this.db.collection('subscriptions').onSnapshot(snapshot => {
        if (!snapshot.empty) {
          let allSubs = JSON.parse(localStorage.getItem('pos_subscriptions')) || [];
          snapshot.forEach(doc => {
            const data = { id: doc.id, storeId: doc.id, ...doc.data() };
            const idx = allSubs.findIndex(s => s.storeId === doc.id || s.id === doc.id);
            if (idx !== -1) {
              allSubs[idx] = { ...allSubs[idx], ...data };
            } else {
              allSubs.push(data);
            }

            if (doc.id === activeStoreId || doc.id === this.storeId || (settings.storeName && data.storeName === settings.storeName)) {
              let activeSub = JSON.parse(localStorage.getItem('pos_subscription')) || {};
              activeSub = { ...activeSub, ...data };
              localStorage.setItem('pos_subscription', JSON.stringify(activeSub));
            }
          });
          localStorage.setItem('pos_subscriptions', JSON.stringify(allSubs));
          window.dispatchEvent(new Event('storage'));

          if (window.location.pathname.includes('super-admin') && typeof window.loadSubscribers === 'function') {
            window.loadSubscribers();
          }
        }
      }, err => {
        console.warn('[Firebase Cloud Listener Warning] subscriptions collection:', err);
      });
      this.unsubscribers.push(subUnsub);
    } catch (e) {}
  }

  // Create automated cloud backup snapshot
  async createBackupSnapshot() {
    if (!this.db || !this.storeId) return;
    try {
      const currentProducts = JSON.parse(localStorage.getItem('pos_products')) || [];
      const currentSales = JSON.parse(localStorage.getItem('pos_sales')) || [];
      const currentSettings = JSON.parse(localStorage.getItem('pos_settings')) || {};

      const snapshotId = `snapshot_${Date.now()}`;
      await this.db.collection('stores').doc(this.storeId).collection('backups').doc(snapshotId).set({
        storeId: this.storeId,
        productsCount: currentProducts.length,
        salesCount: currentSales.length,
        settings: currentSettings,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      console.log(`[Firebase Cloud] Backup snapshot created for Store [${this.storeId}]`);
    } catch (e) {
      console.warn('[Firebase Cloud Backup Warning]:', e);
    }
  }

  // Initialize a 100% fresh empty store for new subscribers
  async initializeFreshStore(storeId, storeProfile) {
    if (!this.db) return;

    const ownerName = storeProfile.ownerName || storeProfile.storeOwner || '';
    const phone = storeProfile.phone || storeProfile.storePhone || storeProfile.senderPhone || '';
    const email = storeProfile.email || storeProfile.storeEmail || '';
    const storeAddress = storeProfile.storeAddress || 'Dhaka, Bangladesh';

    const freshSettings = {
      storeName: storeProfile.storeName || 'My New Shop',
      ownerName, storeOwner: ownerName,
      phone, storePhone: phone, personalPhone: phone,
      email, storeEmail: email, personalEmail: email,
      storeAddress,
      storeLogo: storeProfile.storeLogo || '',
      adminPin: storeProfile.adminPin || '1234',
      receiptHeaderNote: `${storeAddress} | Mobile: ${phone}`,
      receiptFooterNote: storeProfile.receiptFooterNote || 'ধন্যবাদ! আবার আসবেন।',
      defaultTaxMode: 'percent', defaultTax: 0,
      defaultDiscountMode: 'percent', defaultDiscountValue: 0
    };

    const freshDataMap = {
      pos_products: [], pos_sales: [], pos_customers: [],
      pos_categories: [], pos_coupons: [], pos_settings: freshSettings
    };

    await this.db.collection('stores').doc(storeId).set({
      profile: { ...storeProfile, storeId, ownerName, phone, email, isFreshSignup: true },
      storeId, storeName: storeProfile.storeName, ownerName, phone, email,
      isFreshSignup: true, createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    for (const [key, data] of Object.entries(freshDataMap)) {
      await this.db.collection('stores').doc(storeId).collection('pos_data').doc(key).set({
        storeId, data, updatedAt: firebase.firestore.FieldValue.serverTimestamp(), clientUpdatedAt: Date.now()
      }, { merge: true });
    }

    this.isApplyingRemoteChange = true;
    localStorage.setItem('pos_active_store_id', storeId);
    this.storeId = storeId;
    this.keys.forEach(key => {
      const val = JSON.stringify(freshDataMap[key] !== undefined ? freshDataMap[key] : (key === 'pos_settings' ? freshSettings : []));
      const tenantKey = this.getTenantStorageKey(key);
      localStorage.setItem(tenantKey, val);
      localStorage.setItem(key, val);
    });
    this.isApplyingRemoteChange = false;

    this.setStoreId(storeId);
    console.log(`[Firebase Cloud] Successfully initialized fresh empty store [${storeId}]`);
  }

  // Force-pull latest data from server for a specific key (bypass local cache)
  async forcePullFromServer(key) {
    if (!this.db || !this.storeId) return null;
    try {
      const doc = await this.db.collection('stores').doc(this.storeId).collection('pos_data').doc(key).get();
      if (doc.exists && doc.data() && doc.data().data !== undefined) {
        const remoteData = doc.data().data;
        const remoteJson = JSON.stringify(remoteData);
        const tenantKey = this.getTenantStorageKey(key);
        this.isApplyingRemoteChange = true;
        localStorage.setItem(tenantKey, remoteJson);
        localStorage.setItem(key, remoteJson);
        localStorage.setItem(`${key}_raw_backup`, remoteJson);
        this.isApplyingRemoteChange = false;
        window.dispatchEvent(new CustomEvent('pos_cloud_update', { detail: { key, data: remoteData } }));
        console.log(`[Firebase Cloud] Force-pulled fresh ${key} from server.`);
        return remoteData;
      }
    } catch (e) {
      console.warn(`[Firebase Cloud] Force-pull failed for ${key}:`, e);
    }
    return null;
  }

  // Compatibility alias for saveProducts() and other admin/cashier callers
  saveDoc(key, data) {
    return this.pushKeyToCloud(key, JSON.stringify(data));
  }
}

// Instantiate global sync engine — expose under BOTH names for full compatibility
window.POS_FIREBASE = new FirebasePOSSync();
window.posFirebase  = window.POS_FIREBASE;


// ============================================================
// FIREBASE STORAGE — Image Upload Engine
// Uploads product/category images to Firebase Storage CDN
// Returns a permanent public URL instead of base64 string
// This keeps Firestore documents tiny → unlimited products
// ============================================================

/**
 * Helper to convert base64 Data URL to Blob synchronously without fetch overhead
 */
function dataURLToBlob(dataUrl) {
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.error('[dataURLToBlob Error]', e);
    return null;
  }
}

/**
 * Upload a base64 dataURL image to Firebase Storage.
 * @param {string} dataUrl   - base64 data URL (data:image/...)
 * @param {string} storeId   - merchant store ID (for folder isolation)
 * @param {string} fileName  - unique filename (e.g. prod_123.webp)
 * @param {function} onProgress - optional progress callback (0-100)
 * @returns {Promise<string>} - resolves with public download URL or base64 fallback
 */
async function uploadImageToStorage(dataUrl, storeId, fileName, onProgress) {
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    if (typeof onProgress === 'function') onProgress(100);
    return dataUrl;
  }

  if (typeof firebase === 'undefined' || !firebase.storage) {
    console.warn('[Firebase Storage] SDK not loaded — storing as base64 fallback');
    if (typeof onProgress === 'function') onProgress(100);
    return dataUrl;
  }

  try {
    const storage = firebase.storage();
    const blob = dataURLToBlob(dataUrl);
    if (!blob) {
      if (typeof onProgress === 'function') onProgress(100);
      return dataUrl;
    }

    const mime = blob.type || 'image/jpeg';
    const ext  = mime.includes('webp') ? 'webp' : mime.includes('png') ? 'png' : 'jpg';
    const safeName = fileName ? fileName.replace(/[^a-zA-Z0-9_\-]/g, '_') : `img_${Date.now()}`;
    const storagePath = `merchant_images/${storeId || 'shared'}/${safeName}.${ext}`;

    const storageRef = storage.ref(storagePath);
    const uploadTask = storageRef.put(blob, { contentType: mime });

    return await new Promise((resolve) => {
      let isResolved = false;

      const finish = (resultUrl) => {
        if (isResolved) return;
        isResolved = true;
        if (typeof onProgress === 'function') onProgress(100);
        resolve(resultUrl);
      };

      // 6-second safety timeout: fallback to Base64 if Storage stalls or network hangs
      const timeoutTimer = setTimeout(() => {
        console.warn('[Firebase Storage] Upload timed out — falling back to compressed base64');
        try { uploadTask.cancel(); } catch (_) {}
        finish(dataUrl);
      }, 6000);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            if (typeof onProgress === 'function') onProgress(pct);
          }
        },
        (error) => {
          clearTimeout(timeoutTimer);
          console.warn('[Firebase Storage] Upload error, falling back to base64:', error.message || error);
          finish(dataUrl);
        },
        async () => {
          clearTimeout(timeoutTimer);
          try {
            const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
            console.log(`[Firebase Storage] ✅ Uploaded: ${storagePath} → ${downloadURL}`);
            finish(downloadURL);
          } catch (e) {
            console.error('[Firebase Storage] getDownloadURL error:', e);
            finish(dataUrl);
          }
        }
      );
    });

  } catch (err) {
    console.error('[Firebase Storage] uploadImageToStorage failed:', err);
    if (typeof onProgress === 'function') onProgress(100);
    return dataUrl; // Always fallback gracefully
  }
}

/**
 * Check if an image field value is a remote URL (Storage CDN)
 * or a local base64 string. Used for backward compat rendering.
 */
function isStorageUrl(value) {
  return typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
}

// Expose globally for admin.js and cashier.js usage
window.uploadImageToStorage = uploadImageToStorage;
window.isStorageUrl = isStorageUrl;


