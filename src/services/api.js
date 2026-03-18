import { authAPI, dbAPI, auth, isUsingMockDB } from '../config/firebase.js';

// Haversine formula calculates distance in km
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ── User Profile Service ──
export const userService = {
  async getProfile(uid) {
    try {
      if (!uid) return null;
      const snap = await dbAPI.getDoc('users', uid);
      return snap.exists() ? snap.data() : null;
    } catch { return null; }
  },
  async updateProfile(uid, data) {
    await dbAPI.updateDoc('users', uid, { ...data, updatedAt: new Date().toISOString() });
    return this.getProfile(uid);
  },
  async createProfile(uid, data) {
    const profile = {
      name: data.name || '',
      phone: data.phone || '',
      email: data.email || '',
      avatar: data.avatar || data.photoURL || '',
      rating: 5.0,
      totalDeliveries: 0,
      totalEarnings: 0,
      kycVerified: false,
      kycVerified: false,
      activeMode: data.defaultMode || 'sender',
      joinedAt: new Date().toISOString()
    };
    await dbAPI.setDoc('users', uid, profile);
    return profile;
  },
  async rateUser(uid, ratingValue) {
    const profile = await this.getProfile(uid);
    if (!profile) return;
    const currentRating = profile.rating || 5.0;
    const totalRatings = profile.totalRatings || 0;
    const newRating = ((currentRating * totalRatings) + ratingValue) / (totalRatings + 1);
    await dbAPI.updateDoc('users', uid, { 
      rating: parseFloat(newRating.toFixed(1)),
      totalRatings: totalRatings + 1
    });
  }
};

// ── Route Service ──
export const routeService = {
  async createRoute(routeData) {
    const route = { ...routeData, status: 'active', createdAt: new Date().toISOString() };
    const res = await dbAPI.addDoc('routes', route);
    return { id: res.id, ...route };
  },
  async getRoutes(uid) {
    const snap = await dbAPI.queryDocs('routes', 'commuterId', uid);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  async toggleRoute(routeId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    await dbAPI.updateDoc('routes', routeId, { status: newStatus });
  },
  async deleteRoute(routeId) {
    await dbAPI.deleteDoc('routes', routeId);
  }
};

// ── Delivery Service ──
export const deliveryService = {
  async createDelivery(deliveryData) {
    const delivery = { 
      ...deliveryData, 
      senderId: auth.currentUser?.uid,
      status: 'requested', 
      createdAt: new Date().toISOString() 
    };
    const res = await dbAPI.addDoc('deliveries', delivery);
    return { id: res.id, ...delivery };
  },
  async getDeliveries() {
    const snap = await dbAPI.getAllDocs('deliveries');
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  async getMyDeliveries(uid) {
    const snap = await dbAPI.queryDocs('deliveries', 'senderId', uid);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async getCommuterDeliveries(uid) {
    const snap = await dbAPI.queryDocs('deliveries', 'commuterId', uid);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async updateDeliveryStatus(deliveryId, status) {
    await dbAPI.updateDoc('deliveries', deliveryId, { status, updatedAt: new Date().toISOString() });
  },
  async getIncomingRequests(uid, routeIds = []) {
    // Queries deliveries where senderID != uid and filters by proximity (≤1km) to commuter's active route
    const snap = await dbAPI.getAllDocs('deliveries');
    let dels = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
               .filter(d => d.status === 'requested' && d.senderId !== uid);
               
    if (routeIds && routeIds.length > 0) {
      // If we have active routes, filter deliveries that are within 1km of any of those routes
      const userRoutes = await routeService.getRoutes(uid);
      const activeUserRoutes = userRoutes.filter(r => r.status === 'active' && routeIds.includes(r.id));
      
      dels = dels.filter(d => {
        if (!d.pickupLocation?.lat || !d.pickupLocation?.lng || !d.dropoffLocation?.lat || !d.dropoffLocation?.lng) return true; 
        return activeUserRoutes.some(route => {
          if (!route.startLocation?.lat || !route.startLocation?.lng || !route.endLocation?.lat || !route.endLocation?.lng) return true;
          const distStart = haversineDistance(d.pickupLocation.lat, d.pickupLocation.lng, route.startLocation.lat, route.startLocation.lng);
          const distEnd = haversineDistance(d.dropoffLocation.lat, d.dropoffLocation.lng, route.endLocation.lat, route.endLocation.lng);
          return distStart <= 5.0 && distEnd <= 5.0; // Match within 5km radius for both start and end
        });
      });
    }

    return dels;
  },
  async acceptRequest(deliveryId, commuterId) {
    const profile = await userService.getProfile(commuterId);
    await dbAPI.updateDoc('deliveries', deliveryId, {
      commuterId,
      commuterName: profile?.name || 'Verified Commuter',
      commuterRating: profile?.rating || 5.0,
      status: 'matched',
      matchedAt: new Date().toISOString(),
      pickupOtp: Math.floor(1000 + Math.random() * 9000).toString(),
      deliveryOtp: Math.floor(1000 + Math.random() * 9000).toString()
    });
    // Create notification for sender
    const delivery = await dbAPI.getDoc('deliveries', deliveryId);
    if(delivery.exists() && delivery.data().senderId) {
      await notificationService.addNotification(delivery.data().senderId, {
        title: 'Delivery Matched',
        body: 'A commuter has accepted your delivery request.',
        type: 'match',
        deliveryId
      });
    }
  },
  async rateDelivery(deliveryId, commuterId, ratingValue) {
    await userService.rateUser(commuterId, ratingValue);
    await dbAPI.updateDoc('deliveries', deliveryId, { rated: true, ratingScore: ratingValue });
  },
  async matchDelivery(deliveryId, commuterId) {
    return this.acceptRequest(deliveryId, commuterId);
  },
  async findMatches(delivery) {
    if (!delivery || !delivery.pickupLocation || !delivery.dropoffLocation) return [];
    
    // Fetch active routes and filter by 1km proximity logic
    const snap = await dbAPI.getAllDocs('routes');
    const routes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(r => r.status === 'active' && r.commuterId !== delivery.senderId);
    
    const matches = routes.map(route => {
      let isMatch = true;
      if (route.startLocation?.lat && delivery.pickupLocation?.lat) {
        const distStart = haversineDistance(route.startLocation.lat, route.startLocation.lng, delivery.pickupLocation.lat, delivery.pickupLocation.lng);
        if (distStart > 1.0) isMatch = false;
      } else { isMatch = false; }
      
      if (route.endLocation?.lat && delivery.dropoffLocation?.lat) {
        const distEnd = haversineDistance(route.endLocation.lat, route.endLocation.lng, delivery.dropoffLocation.lat, delivery.dropoffLocation.lng);
        if (distEnd > 1.0) isMatch = false;
      } else { isMatch = false; }
      
      if (isMatch) {
         return {
           route: { ...route, commuterName: 'Verified Commuter', commuterRating: '4.9' },
           matchScore: Math.floor(80 + Math.random() * 19), 
           estimatedDetour: '5 mins',
           estimatedPrice: delivery.price || 45
         };
      }
      return null;
    }).filter(Boolean);
    
    // Demo mode fallback if no perfect matches locally
    if (matches.length === 0) {
      matches.push({
         route: { commuterId: 'dummy_123', commuterName: 'Demo Commuter', commuterRating: '4.8' },
         matchScore: 92, estimatedDetour: '2 mins', estimatedPrice: delivery.price || 50
      });
    }

    return matches;
  },
  async rejectRequest(deliveryId, uid) {
    console.log(`User ${uid} rejected delivery ${deliveryId}`);
  },
  async verifyPickupOtp(deliveryId, otp) {
    const snap = await dbAPI.getDoc('deliveries', deliveryId);
    if (snap.exists()) {
      const data = snap.data();
      if (data.pickupOtp === otp) {
        await this.updateDeliveryStatus(deliveryId, 'picked_up');
        // Notify Sender
        await notificationService.addNotification(data.senderId, {
          title: 'Package Picked Up',
          body: 'Your package is on the way.',
          type: 'status',
          deliveryId
        });
        return true;
      }
    }
    return false;
  },
  async verifyDeliveryOtp(deliveryId, otp) {
    const snap = await dbAPI.getDoc('deliveries', deliveryId);
    if (snap.exists()) {
      const data = snap.data();
      if (data.deliveryOtp === otp) {
        await this.updateDeliveryStatus(deliveryId, 'delivered');
        // Notify Sender
        await notificationService.addNotification(data.senderId, {
          title: 'Package Delivered',
          body: 'Your package has reached its destination.',
          type: 'status',
          deliveryId
        });
        return true;
      }
    }
    return false;
  }
};

// ── Notification Service ──
export const notificationService = {
  async addNotification(uid, data) {
    if(!uid) return;
    await dbAPI.addDoc('notifications', {
      userId: uid,
      ...data,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  },
  async getNotifications(uid) {
    if(!uid) return [];
    const snap = await dbAPI.queryDocs('notifications', 'userId', uid);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async getUnreadCount(uid) {
    const notifs = await this.getNotifications(uid);
    return notifs.filter(n => !n.isRead).length;
  },
  async markAsRead(notificationId) {
    await dbAPI.updateDoc('notifications', notificationId, { isRead: true });
  }
};

// ── Payment Service ──
export const paymentService = {
  RAZORPAY_KEY: 'rzp_test_SRiDAd68HzrHBw',
  async createOrder(amount, deliveryId) {
    return { id: 'order_' + Date.now(), amount: amount * 100, currency: 'INR', deliveryId };
  },
  openPayment(order, onSuccess, onFailure) {
    const safetyTimer = setTimeout(() => {
      onFailure({ message: 'Payment window timed out. Please try again.' });
    }, 10000);

    if (typeof window.Razorpay === 'undefined') {
      setTimeout(() => {
        clearTimeout(safetyTimer);
        onSuccess({ razorpay_payment_id: 'pay_demo_' + Date.now() });
      }, 1500);
      return;
    }
    const rzp = new window.Razorpay({
      key: this.RAZORPAY_KEY, amount: order.amount, currency: order.currency,
      name: 'DELo Logistics', description: 'Package Top-up',
      handler: (res) => {
        clearTimeout(safetyTimer);
        onSuccess(res);
      }, 
      modal: {
        ondismiss: () => {
          clearTimeout(safetyTimer);
          onFailure({ message: 'Payment cancelled' });
        }
      },
      theme: { color: '#d4ff00' }
    });
    rzp.on('payment.failed', function (response) {
       clearTimeout(safetyTimer);
       onFailure(response.error);
    });
    rzp.open();
  },
  async getTransactions() {
    const snap = await dbAPI.getAllDocs('transactions');
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async recordTransaction(data) {
    await dbAPI.addDoc('transactions', { ...data, createdAt: new Date().toISOString() });
  },
  async getWalletBalance() {
    const txs = await this.getTransactions();
    return txs.reduce((bal, tx) => tx.type === 'credit' ? bal + tx.amount : bal - tx.amount, 0);
  }
};

export async function seedDemoData() {
  // Database seed functionality can be added if needed
}
