// Demo Warehouse Inventory & Store Product Catalog with Color, Size, Storage & Rich Category Images
const INITIAL_CATEGORIES = [
  { 
    id: 'CAT-1', 
    name: 'Bags', 
    bnName: 'ব্যাগ', 
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80',
    icon: 'fa-bag-shopping', 
    color: '#ec4899',
    description: 'লেদার ব্যাকপ্যাক, হ্যান্ডব্যাগ ও ট্রাভেল ব্যাগ'
  },
  { 
    id: 'CAT-2', 
    name: 'Shoes', 
    bnName: 'জুতা (Shoes)', 
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
    icon: 'fa-shoe-prints', 
    color: '#ef4444',
    description: 'স্পোর্টস স্নিকার্স, কেডস, হিল ও ফরমাল শু'
  },
  { 
    id: 'CAT-3', 
    name: 'Apparel', 
    bnName: 'পোশাক (Apparel)', 
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=400&q=80',
    icon: 'fa-shirt', 
    color: '#10b981',
    description: 'টি-শার্ট, প্যান্ট, ডে নিম জিন্স ও পাঞ্জাবি'
  },
  { 
    id: 'CAT-4', 
    name: 'Gadgets', 
    bnName: 'গ্যাজেট ও এয়ারপড', 
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
    icon: 'fa-headphones', 
    color: '#8b5cf6',
    description: 'স্মার্টওয়াচ, ওয়ারলেস হেডফোন ও এয়ারপড'
  },
  { 
    id: 'CAT-5', 
    name: 'Cosmetics', 
    bnName: 'কসমেটিকস', 
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=400&q=80',
    icon: 'fa-wand-magic-sparkles', 
    color: '#f43f5e',
    description: 'মেকআপ সেট, স্কিন কেয়ার ও লিপস্টিক'
  },
  { 
    id: 'CAT-6', 
    name: 'Phones', 
    bnName: 'স্মার্টফোন', 
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80',
    icon: 'fa-mobile-screen-button', 
    color: '#3b82f6',
    description: 'আইফোন, স্যামসাং ও মোবাইল গ্যাজেট'
  },
  { 
    id: 'CAT-7', 
    name: 'Electronics', 
    bnName: 'ইলেকট্রনিক্স', 
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80',
    icon: 'fa-laptop', 
    color: '#6366f1',
    description: 'ল্যাপটপ, মনিটর ও আইটি সামগ্রী'
  },
  { 
    id: 'CAT-8', 
    name: 'Snacks', 
    bnName: 'স্ন্যাক্স ও ফুড', 
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80',
    icon: 'fa-cookie-bite', 
    color: '#f59e0b',
    description: 'চিপস, চকলেট, কফি ও পানীয়'
  }
];

const INITIAL_PRODUCTS = [
  {
    id: "PROD-2001",
    name: "Men's Premium Cotton Polo T-Shirt",
    category: "Apparel",
    unit: "pcs",
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80",
    variants: [
      {
        variantId: "VAR-2001-RED-S",
        color: "Navy Red",
        size: "S",
        barcode: "8942001001",
        cost: 320,
        mrp: 650,
        price: 490,
        stock: 50
      },
      {
        variantId: "VAR-2001-BLUE-L",
        color: "Royal Blue",
        size: "L",
        barcode: "8942001002",
        cost: 380,
        mrp: 800,
        price: 590,
        stock: 50
      },
      {
        variantId: "VAR-2001-BLK-XL",
        color: "Black",
        size: "XL",
        barcode: "8942001003",
        cost: 420,
        mrp: 900,
        price: 650,
        stock: 30
      }
    ]
  },
  {
    id: "PROD-2002",
    name: "Leather Travel Laptop Backpack",
    category: "Bags",
    unit: "pcs",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=300&q=80",
    variants: [
      {
        variantId: "VAR-BAG-BLK",
        color: "Matte Black",
        size: "15.6 inch",
        barcode: "8942002001",
        cost: 1200,
        mrp: 2400,
        price: 1850,
        stock: 25
      },
      {
        variantId: "VAR-BAG-BRN",
        color: "Vintage Brown",
        size: "15.6 inch",
        barcode: "8942002002",
        cost: 1300,
        mrp: 2600,
        price: 1990,
        stock: 18
      }
    ]
  },
  {
    id: "PROD-2003",
    name: "Nike Air Max Sports Running Shoes",
    category: "Shoes",
    unit: "pair",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80",
    variants: [
      {
        variantId: "VAR-SHOE-RED-41",
        color: "Flame Red",
        size: "41",
        barcode: "8942003001",
        cost: 2500,
        mrp: 4500,
        price: 3600,
        stock: 20
      },
      {
        variantId: "VAR-SHOE-BLK-43",
        color: "Jet Black",
        size: "43",
        barcode: "8942003002",
        cost: 2600,
        mrp: 4800,
        price: 3800,
        stock: 15
      }
    ]
  },
  {
    id: "PROD-2004",
    name: "Velvet Matte Waterproof Lipstick Set",
    category: "Cosmetics",
    unit: "box",
    image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=300&q=80",
    variants: [
      {
        variantId: "VAR-COS-RED",
        color: "Ruby Red",
        size: "Set of 4",
        barcode: "8942004001",
        cost: 450,
        mrp: 950,
        price: 720,
        stock: 40
      },
      {
        variantId: "VAR-COS-PNK",
        color: "Rose Nude",
        size: "Set of 4",
        barcode: "8942004002",
        cost: 450,
        mrp: 950,
        price: 720,
        stock: 35
      }
    ]
  },
  {
    id: "PROD-2005",
    name: "iPhone 15 Pro Max 256GB",
    category: "Phones",
    unit: "pcs",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=300&q=80",
    variants: [
      {
        variantId: "VAR-PHN-NAT",
        color: "Natural Titanium",
        size: "256GB / 8GB RAM",
        barcode: "8942005001",
        cost: 125000,
        mrp: 145000,
        price: 138000,
        stock: 8
      },
      {
        variantId: "VAR-PHN-BLK",
        color: "Black Titanium",
        size: "256GB / 8GB RAM",
        barcode: "8942005002",
        cost: 125000,
        mrp: 145000,
        price: 138000,
        stock: 6
      }
    ]
  },
  {
    id: "PROD-2006",
    name: "Apple AirPods Pro 2nd Gen (Type-C)",
    category: "Gadgets",
    unit: "pcs",
    image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=300&q=80",
    variants: [
      {
        variantId: "VAR-POD-WHT",
        color: "Pure White",
        size: "MagSafe Case",
        barcode: "8942006001",
        cost: 21000,
        mrp: 27000,
        price: 24500,
        stock: 15
      }
    ]
  },
  {
    id: "PROD-2007",
    name: "Pran Potato Crackers 25g",
    category: "Snacks",
    unit: "pcs",
    image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=300&q=80",
    variants: [
      {
        variantId: "VAR-2007-DEF",
        color: "Standard",
        size: "25g Pack",
        barcode: "8901030882194",
        cost: 10,
        mrp: 20,
        price: 15,
        stock: 120
      }
    ]
  }
];

const _nowForDemo = new Date();
const _todayStartForDemo = new Date(_nowForDemo.getFullYear(), _nowForDemo.getMonth(), _nowForDemo.getDate(), 0, 0, 0, 0).getTime();

const INITIAL_SALES = [
  {
    id: "INV-20260810-001",
    timestamp: new Date(_todayStartForDemo + 3600000 * 2 + 1800000).toISOString(),
    customer: "Walk-in Customer",
    customerPhone: "",
    items: [
      { id: "PROD-2001", variantId: "VAR-2001-RED-S", barcode: "8942001001", name: "Men's Premium Cotton Polo T-Shirt", color: "Navy Red", size: "S", price: 490, cost: 320, quantity: 2, subtotal: 980 },
      { id: "PROD-2007", variantId: "VAR-2007-DEF", barcode: "8901030882194", name: "Pran Potato Crackers 25g", color: "Standard", size: "25g Pack", price: 15, cost: 10, quantity: 4, subtotal: 60 }
    ],
    subtotal: 1040,
    discount: 40,
    couponCode: "WELCOME10",
    couponDiscount: 40,
    manualDiscount: 0,
    tax: 50,
    taxType: "flat",
    taxValue: 50,
    discountType: "flat",
    discountValue: 40,
    grandTotal: 1050,
    paymentMethod: "CASH",
    paymentDetails: { cashReceived: 1200, changeGiven: 150, method: "CASH" }
  },
  {
    id: "INV-20260810-002",
    timestamp: new Date(_todayStartForDemo + 3600000 * 5 + 900000).toISOString(),
    customerId: "CUST-1001",
    customer: "রহিম আহমেদ (Rahim Ahmed)",
    customerPhone: "01711000000",
    items: [
      { id: "PROD-2002", variantId: "VAR-2002-BLK-M", barcode: "8942001002", name: "Casual Denim Jacket", color: "Black", size: "M", price: 1850, cost: 1200, quantity: 1, subtotal: 1850 },
      { id: "PROD-2003", variantId: "VAR-2003-WHT-9", barcode: "8942001003", name: "Running Sports Shoes", color: "White", size: "42", price: 3400, cost: 2500, quantity: 1, subtotal: 3400 }
    ],
    subtotal: 5250,
    discount: 250,
    couponCode: null,
    couponDiscount: 0,
    manualDiscount: 250,
    discountType: "percent",
    discountValue: 5,
    tax: 150,
    taxType: "percent",
    taxValue: 3,
    grandTotal: 5150,
    paymentMethod: "EPAY",
    paymentDetails: { provider: "bKash", trxId: "TRX8892102", method: "epay" }
  },
  {
    id: "INV-20260809-003",
    timestamp: new Date(_todayStartForDemo - 3600000 * 5).toISOString(),
    customerId: "CUST-1002",
    customer: "সুমাইয়া আক্তার (Sumaiya Akter)",
    customerPhone: "01822000000",
    items: [
      { id: "PROD-2004", variantId: "VAR-2004-BRN-DEF", barcode: "8942001004", name: "Leather Travel Backpack", color: "Brown", size: "Standard", price: 750, cost: 450, quantity: 2, subtotal: 1500 },
      { id: "PROD-2007", variantId: "VAR-2007-DEF", barcode: "8901030882194", name: "Pran Potato Crackers 25g", color: "Standard", size: "25g Pack", price: 15, cost: 10, quantity: 10, subtotal: 150 }
    ],
    subtotal: 1650,
    discount: 50,
    couponCode: "SAVE50",
    couponDiscount: 50,
    manualDiscount: 0,
    discountType: "flat",
    discountValue: 50,
    tax: 80,
    taxType: "percent",
    taxValue: 5,
    grandTotal: 1680,
    paymentMethod: "CASH",
    paymentDetails: { cashReceived: 2000, changeGiven: 320, method: "CASH" }
  },
  {
    id: "INV-20260807-004",
    timestamp: new Date(_todayStartForDemo - 86400000 * 3 + 3600000 * 2).toISOString(),
    customerId: "CUST-1003",
    customer: "তানভীর হাসান (Tanvir Hasan)",
    customerPhone: "01933000000",
    items: [
      { id: "PROD-2005", variantId: "VAR-2005-SLV-256", barcode: "8942001005", name: "Smart LED Android TV 43 Inch", color: "Silver", size: "43 Inch", price: 32000, cost: 21000, quantity: 1, subtotal: 32000 },
      { id: "PROD-2001", variantId: "VAR-2001-RED-S", barcode: "8942001001", name: "Men's Premium Cotton Polo T-Shirt", color: "Navy Red", size: "S", price: 490, cost: 320, quantity: 3, subtotal: 1470 }
    ],
    subtotal: 33470,
    discount: 470,
    couponCode: null,
    couponDiscount: 0,
    manualDiscount: 470,
    discountType: "flat",
    discountValue: 470,
    tax: 500,
    taxType: "flat",
    taxValue: 500,
    grandTotal: 33000,
    paymentMethod: "EPAY",
    paymentDetails: { provider: "Nagad", trxId: "NGD7739105", method: "epay" }
  }
];

const DEFAULT_SETTINGS = {
  storeName: "Super Shop Dhaka",
  storeOwner: "Md. Abdul Baqui",
  storePhone: "+880 1700-000000",
  storeEmail: "dhaka.supershop@gmail.com",
  storeAddress: "Mirpur 10, Dhaka - 1216",
  storeLogo: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=150&q=80",
  currencySymbol: "৳",
  currencyCode: "BDT",
  defaultTax: 0,
  receiptHeaderNote: "Mirpur 10, Dhaka - 1216 | Mobile: +880 1700-000000",
  receiptFooterNote: "Thank you! Come again.",
  adminPin: "1234",
  defaultTheme: "dark"
};

const INITIAL_COUPONS = [
  {
    id: "CPN-1001",
    code: "SAVE10",
    discountType: "percent",
    discountValue: 10,
    minOrder: 300,
    status: "active",
    note: "১০% বিশেষ ছাড় (সর্বনিম্ন ৳৩০০ কেনাকাটায়)"
  },
  {
    id: "CPN-1002",
    code: "EID50",
    discountType: "flat",
    discountValue: 50,
    minOrder: 500,
    status: "active",
    note: "৳৫০ ফ্লাট ছাড় (সর্বনিম্ন ৳৫০০ কেনাকাটায়)"
  },
  {
    id: "CPN-1003",
    code: "WELCOME",
    discountType: "percent",
    discountValue: 5,
    minOrder: 0,
    status: "active",
    note: "৫% ওয়েলকাম কুপন"
  }
];

const DEFAULT_PAYMENT_GATEWAYS = {
  bKash: {
    enabled: true,
    accountNumber: "01700-000000",
    instructions: "bKash মার্চেন্ট বা পার্সোনাল নম্বরে পেমেন্ট করুন এবং TrxID দিন।"
  },
  Nagad: {
    enabled: true,
    accountNumber: "01800-000000",
    instructions: "Nagad নম্বরে ক্যাশইন/পেমেন্ট করুন এবং TrxID দিন।"
  },
  QR: {
    enabled: true,
    accountNumber: "SuperShop-BanglaQR",
    instructions: "কাউন্টারে টানানো বাংলা QR কোড স্ক্যান করে পেমেন্ট করুন।"
  },
  Card: {
    enabled: true,
    accountNumber: "POS Terminal #1",
    instructions: "কাউন্টার POS মেশিনে ডেবিট/ক্রেডিট কার্ড সোয়াইপ/ট্যাপ করুন।"
  }
};

const INITIAL_CUSTOMERS = [
  {
    id: "CUST-1001",
    name: "রহিম আহমেদ (Rahim Ahmed)",
    phone: "01711000000",
    email: "rahim@gmail.com",
    address: "মিরপুর ১০, ঢাকা",
    totalOrders: 3,
    totalSpent: 4500,
    createdAt: "2026-08-01"
  },
  {
    id: "CUST-1002",
    name: "সুমাইয়া আক্তার (Sumaiya Akter)",
    phone: "01822000000",
    email: "sumaiya@yahoo.com",
    address: "ধানমন্ডি ২৭, ঢাকা",
    totalOrders: 2,
    totalSpent: 2800,
    createdAt: "2026-08-03"
  },
  {
    id: "CUST-1003",
    name: "তানভীর হাসান (Tanvir Hasan)",
    phone: "01933000000",
    email: "tanvir@gmail.com",
    address: "উত্তরা সেক্টর ৭, ঢাকা",
    totalOrders: 5,
    totalSpent: 12400,
    createdAt: "2026-08-05"
  }
];


