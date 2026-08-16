// SmartPOS - Multi-Tenant Firebase Cloud Firestore Sync & Data Security Engine
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

    // Ensure tenant-isolated LocalStorage state is active
    this.syncTenantLocalStorageCache();

    if (this.db) {
      this.initCloudSync();
      this.hookLocalStorage();
    }
  }

  // Get tenant-namespaced LocalStorage key to prevent cross-merchant cache pollution
  getTenantStorageKey(key) {
    if (this.globalKeys.includes(key)) return key;
    return `pos_tenant_${this.storeId}_${key}`;
  }

  // Strict tenant data sanitizer: guarantees items belonging to other stores are NEVER leaked
  sanitizeTenantData(key, rawJsonString) {
    if (!rawJsonString) return null;
    try {
      const parsed = JSON.parse(rawJsonString);
      if (Array.isArray(parsed)) {
        // Filter array items: keep item if storeId matches current storeId OR is unassigned legacy
        const filtered = parsed.filter(item => !item.storeId || item.storeId === this.storeId);
        return JSON.stringify(filtered);
      }
      return rawJsonString;
    } catch (e) {
      return rawJsonString;
    }
  }

  // Synchronize local memory cache with active merchant store namespace & Auto-Migrate Legacy Data ONLY for Guest Store
  syncTenantLocalStorageCache() {
    this.isApplyingRemoteChange = true;
    const isGuestStore = !this.storeId || this.storeId === 'store_demo_101' || this.storeId === 'store_default';

    this.keys.forEach(key => {
      const tenantKey = this.getTenantStorageKey(key);
      let tenantData = localStorage.getItem(tenantKey);

      // Sanitize existing tenantData to eliminate any items from other stores
      if (tenantData) {
        tenantData = this.sanitizeTenantData(key, tenantData);
      }

      // AUTO-MIGRATION FALLBACK: Only for Guest Store (store_demo_101)!
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

    // Create cloud backup snapshot of current store before switching
    this.createBackupSnapshot();

    // Unsubscribe from previous store listeners
    this.unsubscribers.forEach(unsub => typeof unsub === 'function' && unsub());
    this.unsubscribers = [];

    this.storeId = newStoreId;
    localStorage.setItem('pos_active_store_id', newStoreId);

    // Switch tenant LocalStorage cache namespace
    this.syncTenantLocalStorageCache();

    console.log(`[Firebase Cloud] Switched active store to: ${newStoreId}`);
    this.initCloudSync();

    // Notify all UI components to re-render with new merchant's isolated data
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('pos_tenant_changed', { detail: { storeId: newStoreId } }));
  }

  // Hook into LocalStorage to auto-push local changes & prevent accidental deletion
  hookLocalStorage() {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    const originalGetItem = localStorage.getItem.bind(localStorage);
    const originalRemoveItem = localStorage.removeItem.bind(localStorage);
    const self = this;

    localStorage.setItem = function (key, value) {
      if (self.keys.includes(key) && !self.isApplyingRemoteChange) {
        const tenantKey = self.getTenantStorageKey(key);
        originalSetItem(tenantKey, value);
        originalSetItem(`${key}_raw_backup`, value);
      }

      originalSetItem(key, value);

      if (self.keys.includes(key) && !self.isApplyingRemoteChange) {
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
          console.warn(`[Data Safeguard] Preventing permanent deletion of ${key}. Creating safety backup.`);
          originalSetItem(`${key}_soft_deleted_backup_${Date.now()}`, currentVal);
        }
      }
      originalRemoveItem(key);
    };
  }

  // Push single key data to Firestore under isolated store document path
  async pushKeyToCloud(key, jsonStringValue) {
    if (!this.db || !this.storeId) return;
    try {
      let parsedData;
      try {
        parsedData = JSON.parse(jsonStringValue);
      } catch (e) {
        parsedData = jsonStringValue;
      }

      // Add merchant tenant scoping to products to prevent barcode collisions
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
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      console.log(`[Firebase Cloud] Synced ${key} for Store [${this.storeId}]`);
    } catch (error) {
      console.error(`[Firebase Cloud Error] Failed to push ${key}:`, error);
    }
  }

  // Listen to live Cloud changes via Firestore onSnapshot for active store
  initCloudSync() {
    if (!this.db || !this.storeId) return;

    this.keys.forEach(key => {
      const docRef = this.db.collection('stores').doc(this.storeId).collection('pos_data').doc(key);

      const unsub = docRef.onSnapshot(doc => {
        if (!doc.exists) {
          // If Firestore document doesn't exist yet, seed from LocalStorage if available
          const localVal = localStorage.getItem(key);
          if (localVal && localVal !== '[]') {
            this.pushKeyToCloud(key, localVal);
          }
          return;
        }

        const remotePayload = doc.data();
        if (remotePayload && remotePayload.data !== undefined) {
          const remoteJson = JSON.stringify(remotePayload.data);
          const currentLocalJson = localStorage.getItem(key);

          // PROTECT LOCAL MERCHANT DATA: Never overwrite local non-empty products with empty remote array!
          const isRemoteEmpty = !remotePayload.data || (Array.isArray(remotePayload.data) && remotePayload.data.length === 0);
          const isLocalNotEmpty = currentLocalJson && currentLocalJson !== '[]' && currentLocalJson !== '{}';

          if (isRemoteEmpty && isLocalNotEmpty) {
            console.log(`[Data Safeguard] Remote ${key} is empty, but local has data! Seeding local data to cloud...`);
            this.pushKeyToCloud(key, currentLocalJson);
            return;
          }

          // Update local cache if data has changed remotely
          if (remoteJson !== currentLocalJson) {
            this.isApplyingRemoteChange = true;
            const tenantKey = this.getTenantStorageKey(key);
            localStorage.setItem(tenantKey, remoteJson);
            localStorage.setItem(key, remoteJson);
            localStorage.setItem(`${key}_raw_backup`, remoteJson);
            this.isApplyingRemoteChange = false;

            // Trigger window storage & custom cloud update events to update UI
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new CustomEvent('pos_cloud_update', { detail: { key, data: remotePayload.data } }));
            console.log(`[Firebase Cloud] Live update for ${key} in Store [${this.storeId}]`);
          }
        }
      }, err => {
        console.error(`[Firebase Cloud Listener Error] ${key}:`, err);
      });

      this.unsubscribers.push(unsub);
    });
  }

  // Create automated cloud backup snapshot of current store data
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

    const freshSettings = {
      storeName: storeProfile.storeName || 'My New Shop',
      ownerName: storeProfile.ownerName || '',
      phone: storeProfile.phone || '',
      email: storeProfile.email || '',
      storeAddress: storeProfile.storeAddress || 'Dhaka, Bangladesh',
      storeLogo: storeProfile.storeLogo || '',
      adminPin: storeProfile.adminPin || '1234',
      receiptFooterNote: storeProfile.receiptFooterNote || 'ধন্যবাদ! আবার আসবেন।',
      defaultTaxMode: 'percent',
      defaultTax: 0,
      defaultDiscountMode: 'percent',
      defaultDiscountValue: 0
    };

    const freshDataMap = {
      pos_products: [],
      pos_sales: [],
      pos_customers: [],
      pos_categories: [],
      pos_coupons: [],
      pos_settings: freshSettings
    };

    // Save profile to master stores directory
    await this.db.collection('stores').doc(storeId).set({
      profile: storeProfile,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Seed empty arrays & settings to Firestore
    for (const [key, data] of Object.entries(freshDataMap)) {
      await this.db.collection('stores').doc(storeId).collection('pos_data').doc(key).set({
        storeId: storeId,
        data: data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    // Set local storage for this active store session
    this.isApplyingRemoteChange = true;
    localStorage.setItem('pos_active_store_id', storeId);
    
    this.storeId = storeId;
    this.keys.forEach(key => {
      const val = JSON.stringify(freshDataMap[key] !== undefined ? freshDataMap[key] : []);
      const tenantKey = this.getTenantStorageKey(key);
      localStorage.setItem(tenantKey, val);
      localStorage.setItem(key, val);
    });

    this.isApplyingRemoteChange = false;

    this.setStoreId(storeId);
    console.log(`[Firebase Cloud] Successfully initialized fresh empty store [${storeId}]`);
  }
}

// Instantiate global sync engine
window.POS_FIREBASE = new FirebasePOSSync();
