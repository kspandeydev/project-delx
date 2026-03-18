import { db, auth } from '../config/firebase.js';

// ── User Profile Service ──
export const userService = {
  async getProfile(uid) {
    try {
      const saved = localStorage.getItem('delo_profile');
      if (saved) return JSON.parse(saved);
      return null;
    } catch { return null; }
  },

  async updateProfile(uid, data) {
    const profile = { ...data, uid, updatedAt: new Date().toISOString() };
    localStorage.setItem('delo_profile', JSON.stringify(profile));
    return profile;
  },

  async createProfile(uid, data) {
    const profile = {
      uid,
      name: data.name || '',
      phone: data.phone || '',
      email: data.email || '',
      avatar: data.avatar || null,
      rating: 5.0,
      totalDeliveries: 0,
      totalEarnings: 0,
      kycVerified: false,
      activeMode: 'sender', // 'sender' or 'commuter'
      joinedAt: new Date().toISOString(),
      ...data
    };
    localStorage.setItem('delo_profile', JSON.stringify(profile));
    return profile;
  }
};

// ── Route Service ──
export const routeService = {
  async createRoute(routeData) {
    const route = {
      id: 'route_' + Date.now(),
      ...routeData,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    const routes = this.getRoutes();
    routes.push(route);
    localStorage.setItem('delo_routes', JSON.stringify(routes));
    return route;
  },

  getRoutes() {
    try {
      return JSON.parse(localStorage.getItem('delo_routes') || '[]');
    } catch { return []; }
  },

  async toggleRoute(routeId) {
    const routes = this.getRoutes();
    const route = routes.find(r => r.id === routeId);
    if (route) {
      route.status = route.status === 'active' ? 'paused' : 'active';
      localStorage.setItem('delo_routes', JSON.stringify(routes));
    }
    return route;
  },

  async deleteRoute(routeId) {
    let routes = this.getRoutes();
    routes = routes.filter(r => r.id !== routeId);
    localStorage.setItem('delo_routes', JSON.stringify(routes));
  }
};

// ── Delivery Service ──
export const deliveryService = {
  async createDelivery(deliveryData) {
    const delivery = {
      id: 'del_' + Date.now(),
      ...deliveryData,
      status: 'requested',
      createdAt: new Date().toISOString()
    };
    const deliveries = this.getDeliveries();
    deliveries.push(delivery);
    localStorage.setItem('delo_deliveries', JSON.stringify(deliveries));
    return delivery;
  },

  getDeliveries() {
    try {
      return JSON.parse(localStorage.getItem('delo_deliveries') || '[]');
    } catch { return []; }
  },

  async updateDeliveryStatus(deliveryId, status) {
    const deliveries = this.getDeliveries();
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (delivery) {
      delivery.status = status;
      delivery.updatedAt = new Date().toISOString();
      localStorage.setItem('delo_deliveries', JSON.stringify(deliveries));
    }
    return delivery;
  },

  async matchDelivery(deliveryId, commuterId) {
    const deliveries = this.getDeliveries();
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (delivery) {
      delivery.commuterId = commuterId;
      delivery.status = 'matched';
      delivery.matchedAt = new Date().toISOString();
      delivery.pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
      delivery.deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
      localStorage.setItem('delo_deliveries', JSON.stringify(deliveries));
    }
    return delivery;
  },

  // Simulate matching algorithm
  findMatches(deliveryRequest) {
    const routes = routeService.getRoutes().filter(r => r.status === 'active');
    // In a real app, this would use distance/geometry calculations
    return routes.map(route => ({
      route,
      matchScore: Math.floor(70 + Math.random() * 30),
      estimatedDetour: Math.floor(1 + Math.random() * 15) + ' min',
      estimatedPrice: Math.floor(20 + Math.random() * 80)
    })).sort((a, b) => b.matchScore - a.matchScore);
  }
};

// ── Payment Service ──
export const paymentService = {
  RAZORPAY_KEY: 'rzp_test_SRiDAd68HzrHBw',

  async createOrder(amount, deliveryId) {
    // In prod, this would hit your backend to create a Razorpay order
    return {
      id: 'order_' + Date.now(),
      amount: amount * 100, // Razorpay uses paise
      currency: 'INR',
      deliveryId
    };
  },

  openPayment(order, onSuccess, onFailure) {
    if (typeof window.Razorpay === 'undefined') {
      console.warn('Razorpay SDK not loaded');
      // Simulate payment for demo
      setTimeout(() => {
        onSuccess({
          razorpay_payment_id: 'pay_demo_' + Date.now(),
          razorpay_order_id: order.id
        });
      }, 1500);
      return;
    }

    const options = {
      key: this.RAZORPAY_KEY,
      amount: order.amount,
      currency: order.currency,
      name: 'DELo',
      description: 'Delivery Payment',
      order_id: order.id,
      handler: onSuccess,
      prefill: {
        name: auth.currentUser?.displayName || '',
        email: auth.currentUser?.email || '',
        contact: auth.currentUser?.phone || ''
      },
      theme: { color: '#a855f7' },
      modal: {
        ondismiss: () => onFailure && onFailure('Payment cancelled')
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  },

  getTransactions() {
    try {
      return JSON.parse(localStorage.getItem('delo_transactions') || '[]');
    } catch { return []; }
  },

  async recordTransaction(data) {
    const tx = {
      id: 'tx_' + Date.now(),
      ...data,
      createdAt: new Date().toISOString()
    };
    const transactions = this.getTransactions();
    transactions.unshift(tx);
    localStorage.setItem('delo_transactions', JSON.stringify(transactions));
    return tx;
  },

  getWalletBalance() {
    const transactions = this.getTransactions();
    return transactions.reduce((bal, tx) => {
      if (tx.type === 'credit') return bal + tx.amount;
      if (tx.type === 'debit') return bal - tx.amount;
      return bal;
    }, 0);
  }
};

// ── Notification Service ──
export const notificationService = {
  getNotifications() {
    try {
      return JSON.parse(localStorage.getItem('delo_notifications') || '[]');
    } catch { return []; }
  },

  async addNotification(notification) {
    const notif = {
      id: 'notif_' + Date.now(),
      ...notification,
      read: false,
      createdAt: new Date().toISOString()
    };
    const notifications = this.getNotifications();
    notifications.unshift(notif);
    if (notifications.length > 50) notifications.pop();
    localStorage.setItem('delo_notifications', JSON.stringify(notifications));
    return notif;
  },

  async markAsRead(notifId) {
    const notifications = this.getNotifications();
    const notif = notifications.find(n => n.id === notifId);
    if (notif) {
      notif.read = true;
      localStorage.setItem('delo_notifications', JSON.stringify(notifications));
    }
  },

  getUnreadCount() {
    return this.getNotifications().filter(n => !n.read).length;
  }
};

// ── Demo Data Seeding ──
export function seedDemoData() {
  if (localStorage.getItem('delo_seeded')) return;

  // Seed some demo routes
  const demoRoutes = [
    {
      id: 'route_demo_1',
      commuterId: 'demo_user_1',
      commuterName: 'Arjun K.',
      commuterRating: 4.8,
      startLocation: { lat: 12.9716, lng: 77.5946, address: 'Koramangala, Bangalore' },
      endLocation: { lat: 12.9352, lng: 77.6245, address: 'HSR Layout, Bangalore' },
      startTime: '09:00',
      endTime: '09:45',
      recurringDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      maxPackageWeight: 3,
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'route_demo_2',
      commuterId: 'demo_user_2',
      commuterName: 'Priya S.',
      commuterRating: 4.9,
      startLocation: { lat: 12.9698, lng: 77.7500, address: 'Whitefield, Bangalore' },
      endLocation: { lat: 12.9279, lng: 77.6271, address: 'BTM Layout, Bangalore' },
      startTime: '08:30',
      endTime: '09:30',
      recurringDays: ['Mon', 'Wed', 'Fri'],
      maxPackageWeight: 5,
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'route_demo_3',
      commuterId: 'demo_user_3',
      commuterName: 'Ravi M.',
      commuterRating: 4.6,
      startLocation: { lat: 13.0358, lng: 77.5970, address: 'Manyata Tech Park' },
      endLocation: { lat: 12.9716, lng: 77.5946, address: 'Koramangala, Bangalore' },
      startTime: '18:00',
      endTime: '19:00',
      recurringDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      maxPackageWeight: 2,
      status: 'active',
      createdAt: new Date().toISOString()
    }
  ];

  const demoDeliveries = [
    {
      id: 'del_demo_1',
      senderId: 'current_user',
      senderName: 'You',
      commuterId: 'demo_user_1',
      commuterName: 'Arjun K.',
      pickupLocation: { lat: 12.9716, lng: 77.5946, address: 'Koramangala 5th Block' },
      dropoffLocation: { lat: 12.9352, lng: 77.6245, address: 'HSR Layout Sector 2' },
      packageDescription: 'Documents & laptop charger',
      weight: 0.5,
      status: 'in_transit',
      price: 45,
      paymentStatus: 'completed',
      pickupOtp: '4832',
      deliveryOtp: '7291',
      matchedAt: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'del_demo_2',
      senderId: 'demo_user_4',
      senderName: 'Sneha R.',
      commuterId: 'current_user',
      commuterName: 'You',
      pickupLocation: { lat: 12.9698, lng: 77.7500, address: 'Whitefield Main Road' },
      dropoffLocation: { lat: 12.9279, lng: 77.6271, address: 'BTM 2nd Stage' },
      packageDescription: 'Birthday gift box',
      weight: 1.2,
      status: 'matched',
      price: 65,
      paymentStatus: 'completed',
      pickupOtp: '5517',
      deliveryOtp: '3384',
      matchedAt: new Date(Date.now() - 1800000).toISOString(),
      createdAt: new Date(Date.now() - 5400000).toISOString()
    }
  ];

  const demoTransactions = [
    { id: 'tx_demo_1', type: 'credit', amount: 65, description: 'Delivery earning — Birthday gift box', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'tx_demo_2', type: 'credit', amount: 42, description: 'Delivery earning — Books', createdAt: new Date(Date.now() - 172800000).toISOString() },
    { id: 'tx_demo_3', type: 'debit', amount: 45, description: 'Payment — Documents delivery', createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 'tx_demo_4', type: 'credit', amount: 55, description: 'Delivery earning — Electronics', createdAt: new Date(Date.now() - 259200000).toISOString() },
  ];

  const demoNotifications = [
    { id: 'notif_demo_1', type: 'match', title: 'New Match!', message: 'Arjun K. matched for your document delivery', read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'notif_demo_2', type: 'pickup', title: 'Package Picked Up', message: 'Your package has been picked up from Koramangala', read: true, createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 'notif_demo_3', type: 'delivery', title: 'Delivery Request', message: 'Sneha R. wants to send a package along your route', read: false, createdAt: new Date(Date.now() - 1800000).toISOString() },
  ];

  localStorage.setItem('delo_routes', JSON.stringify(demoRoutes));
  localStorage.setItem('delo_deliveries', JSON.stringify(demoDeliveries));
  localStorage.setItem('delo_transactions', JSON.stringify(demoTransactions));
  localStorage.setItem('delo_notifications', JSON.stringify(demoNotifications));
  localStorage.setItem('delo_seeded', 'true');
}
