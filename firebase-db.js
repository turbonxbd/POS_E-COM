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

  // Push single key data to Firestore with 1MB size guard
  async pushKeyToCloud(key, jsonStringValue) {
    if (!this.db || !this.storeId || this.storeId === 'store_demo_101') return;

    // Firestore document 1MB limit protection
    const byteSize = new Blob([jsonStringValue]).size;
    if (byteSize > 900000) {
      console.warn(`[Firebase Cloud] WARNING: ${key} data is ${(byteSize / 1024).toFixed(0)}KB — approaching 1MB Firestore limit! Compress product images.`);
      window.dispatchEvent(new CustomEvent('pos_storage_size_warning', { detail: { key, byteSize } }));
    }
    if (byteSize > 1048000) {
      console.error(`[Firebase Cloud] BLOCKED: ${key} (${(byteSize / 1024).toFixed(0)}KB) exceeds 1MB Firestore limit. Compress product images to fix.`);
      return;
    }

    try {
      let parsedData;
      try { parsedData = JSON.parse(jsonStringValue); } catch (e) { parsedData = jsonStringValue; }

      if (key === 'pos_products' && Array.isArray(parsedData)) {
        parsedData = parsedData.map(p => ({
          ...p,
          storeId: this.storeId,
          tenantSKU: p.barcode ? `${this.storeId}_${p.barcode}` : p.id
        }));
      }

      await this.db.collection('stores').doc(this.storeId).collection('pos_data').doc(key).set({
        storeId: this.storeId,
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

      const unsub = docRef.onSnapshot(doc => {
        if (!doc.exists) {
          // Document doesn't exist yet — only seed from local if this device JUST wrote (within 30 sec)
          // This prevents old stale device data from overwriting intentional empty state on server
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
          // DO NOT seed stale local data — server empty state is intentional (e.g., all products deleted)
          return;
        }

        const remotePayload = doc.data();
        if (!remotePayload || remotePayload.data === undefined) return;

        // Timestamp-based conflict resolution:
        // If THIS DEVICE wrote more recently than server ts, skip (our write is inflight to server)
        const serverClientTs = remotePayload.clientUpdatedAt || 0;
        const localTs = this._localUpdatedAt[key] || 0;
        if (localTs > serverClientTs + 2000) {
          console.log(`[Firebase Cloud] Skipping stale snapshot for ${key} (local is ${localTs - serverClientTs}ms newer)`);
          return;
        }

        // SERVER WINS — always apply server data to local cache
        let finalData = remotePayload.data;

        // Smart Sales Merger: preserve unsynced offline sales
        if (key === 'pos_sales' && Array.isArray(remotePayload.data)) {
          const tenantKey = this.getTenantStorageKey(key);
          let localSales = [];
          try { localSales = JSON.parse(localStorage.getItem(tenantKey) || localStorage.getItem(key) || '[]'); } catch (e) {}
          if (Array.isArray(localSales) && localSales.length > 0) {
            const salesMap = new Map();
            remotePayload.data.forEach(s => { if (s && (s.id || s.timestamp)) salesMap.set(s.id || s.timestamp, s); });
            // Only add local sales missing from server (unsynced offline)
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

