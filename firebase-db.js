// SmartPOS - Multi-Tenant Firebase Cloud Firestore Sync Engine
// Handles isolated store databases, store switching, and real-time cloud data synchronization

const firebaseConfig = {
  apiKey: "AIzaSyAafC8EolMwLwN6guJa8yDkNVLt9IAuizQ",
  authDomain: "pos-e-com-bd.firebaseapp.com",
  projectId: "pos-e-com-bd",
  storageBucket: "pos-e-com-bd.firebasestorage.app",
  messagingSenderId: "5077805615",
  appId: "1:5077805615:web:c13a1d497d41d3a66374da",
  measurementId: "G-REQMFSZ5KF"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
} else {
  console.warn('Firebase SDK compat scripts not loaded yet.');
}

class FirebasePOSSync {
  constructor() {
    this.db = typeof firebase !== 'undefined' ? firebase.firestore() : null;
    this.storeId = localStorage.getItem('pos_active_store_id') || 'default_store';
    this.keys = ['pos_products', 'pos_sales', 'pos_customers', 'pos_categories', 'pos_coupons', 'pos_settings', 'pos_payment_gateways'];
    this.isApplyingRemoteChange = false;
    this.unsubscribers = [];

    if (this.db) {
      this.initCloudSync();
      this.hookLocalStorage();
    }
  }

  // Set active tenant store and re-bind Firestore cloud listeners
  setStoreId(newStoreId) {
    if (!newStoreId || newStoreId === this.storeId) return;

    // Unsubscribe from previous store listeners
    this.unsubscribers.forEach(unsub => typeof unsub === 'function' && unsub());
    this.unsubscribers = [];

    this.storeId = newStoreId;
    localStorage.setItem('pos_active_store_id', newStoreId);

    console.log(`[Firebase Cloud] Switched active store to: ${newStoreId}`);
    this.initCloudSync();
  }

  // Hook into localStorage.setItem to auto-push local changes to isolated Cloud Firestore
  hookLocalStorage() {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    const self = this;

    localStorage.setItem = function (key, value) {
      originalSetItem(key, value);

      // If this change came from user action (not remote sync), push to Cloud
      if (self.keys.includes(key) && !self.isApplyingRemoteChange) {
        self.pushKeyToCloud(key, value);
      }
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

      await this.db.collection('stores').doc(this.storeId).collection('pos_data').doc(key).set({
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
          // If Firestore document doesn't exist yet, seed from localStorage if available
          const localVal = localStorage.getItem(key);
          if (localVal) {
            this.pushKeyToCloud(key, localVal);
          }
          return;
        }

        const remotePayload = doc.data();
        if (remotePayload && remotePayload.data !== undefined) {
          const remoteJson = JSON.stringify(remotePayload.data);
          const currentLocalJson = localStorage.getItem(key);

          // Update local cache if data has changed
          if (remoteJson !== currentLocalJson) {
            this.isApplyingRemoteChange = true;
            localStorage.setItem(key, remoteJson);
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
        data: data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    // Set local storage for this active store session
    this.isApplyingRemoteChange = true;
    localStorage.setItem('pos_active_store_id', storeId);
    localStorage.setItem('pos_products', JSON.stringify([]));
    localStorage.setItem('pos_sales', JSON.stringify([]));
    localStorage.setItem('pos_customers', JSON.stringify([]));
    localStorage.setItem('pos_categories', JSON.stringify([]));
    localStorage.setItem('pos_coupons', JSON.stringify([]));
    localStorage.setItem('pos_settings', JSON.stringify(freshSettings));
    this.isApplyingRemoteChange = false;

    this.setStoreId(storeId);
    console.log(`[Firebase Cloud] Successfully initialized fresh empty store [${storeId}]`);
  }
}

// Instantiate global sync engine
window.POS_FIREBASE = new FirebasePOSSync();
