import { useState, useEffect } from 'react';
import { notificationService } from '../services/api.js';
import { db, auth } from '../config/firebase.js';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function NotificationsPage({ onNavigate, onBack }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    
    const q = query(collection(db, 'notifications'), where('userId', '==', uid));
    const unsub = onSnapshot(q, (snap) => {
      const notifs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                     .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(notifs);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await notificationService.markAsRead(notif.id);
    }
    if (notif.deliveryId) {
      onNavigate('tracking', { deliveryId: notif.deliveryId });
    }
  };

  if (loading) return <div className="page p-lg text-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  return (
    <div className="page animate-fadeIn" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ padding: '40px 24px', flexShrink: 0 }}>
         <button className="btn btn-ghost" onClick={onBack} style={{ padding: 0 }}>← DASHBOARD</button>
         <h1 className="text-3xl font-display" style={{ fontWeight: 900, marginTop: '12px' }}>ALERTS.</h1>
      </div>

      <div className="page-content" style={{ flex: 1, overflowY: 'auto', padding: '0 24px 100px 24px' }}>
         {notifications.length === 0 ? (
           <div className="text-center" style={{ padding: '60px 0', opacity: 0.3 }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
              <p className="text-sm">No new alerts.</p>
           </div>
         ) : (
           <div className="flex flex-col gap-md">
             {notifications.map((n, i) => (
               <div key={n.id} onClick={() => handleNotificationClick(n)}
                    className="glass-card animate-slideUp"
                    style={{ padding: '24px', cursor: 'pointer', border: n.isRead ? '1px solid transparent' : '1px solid var(--accent-primary)', opacity: n.isRead ? 0.6 : 1, animationDelay: `${i * 0.05}s` }}>
                 <div className="flex items-center gap-md" style={{ marginBottom: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.isRead ? 'transparent' : 'var(--accent-primary)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleDateString()}</span>
                 </div>
                 <h3 className="text-lg font-display" style={{ fontWeight: 800, marginBottom: '8px' }}>{n.title}</h3>
                 <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{n.body}</p>
               </div>
             ))}
           </div>
         )}
      </div>
    </div>
  );
}
