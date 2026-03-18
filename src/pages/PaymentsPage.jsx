import { useState, useEffect } from 'react';
import { paymentService, deliveryService } from '../services/api.js';

export default function PaymentsPage({ onNavigate, onBack }) {
  const [tab, setTab] = useState('wallet');
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    setBalance(paymentService.getWalletBalance());
    setTransactions(paymentService.getTransactions());
  }, []);

  const handleAddMoney = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) return;
    setPayLoading(true);
    try {
      const order = await paymentService.createOrder(parseFloat(payAmount), null);
      paymentService.openPayment(
        order,
        async (response) => {
          await paymentService.recordTransaction({
            type: 'credit',
            amount: parseFloat(payAmount),
            description: 'Wallet top-up',
            razorpayPaymentId: response.razorpay_payment_id,
          });
          setBalance(paymentService.getWalletBalance());
          setTransactions(paymentService.getTransactions());
          setShowPayModal(false);
          setPayAmount('');
          setPayLoading(false);
        },
        () => { setPayLoading(false); }
      );
    } catch (err) {
      console.error(err);
      setPayLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title font-display">Payments</h1>
      </div>

      <div className="page-content">
        {/* Wallet Card */}
        <div className="wallet-card animate-fadeIn">
          <div className="wallet-card-bg" />
          <div className="wallet-content">
            <span className="text-sm" style={{ opacity: 0.8 }}>DELo Wallet</span>
            <div className="wallet-balance font-display">
              ₹{balance.toLocaleString()}
            </div>
            <div className="wallet-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowPayModal(true)} style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)' }}>
                + Add Money
              </button>
              <button className="btn btn-secondary btn-sm" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)' }}>
                Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-md animate-fadeIn stagger-2" style={{ marginTop: '24px', marginBottom: '24px' }}>
          <div className="stat-card" style={{ flex: 1, textAlign: 'center' }}>
            <div className="stat-value" style={{ color: 'var(--accent-green)', fontSize: '1.3rem' }}>
              ₹{transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0)}
            </div>
            <div className="stat-label">Total Earned</div>
          </div>
          <div className="stat-card" style={{ flex: 1, textAlign: 'center' }}>
            <div className="stat-value" style={{ color: 'var(--accent-pink)', fontSize: '1.3rem' }}>
              ₹{transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0)}
            </div>
            <div className="stat-label">Total Spent</div>
          </div>
          <div className="stat-card" style={{ flex: 1, textAlign: 'center' }}>
            <div className="stat-value" style={{ color: 'var(--accent-purple)', fontSize: '1.3rem' }}>
              {transactions.length}
            </div>
            <div className="stat-label">Transactions</div>
          </div>
        </div>

        {/* Transactions */}
        <div className="section animate-fadeIn stagger-3">
          <div className="section-header">
            <h2 className="section-title">Transaction History</h2>
          </div>

          {transactions.length > 0 ? (
            <div className="flex flex-col gap-sm">
              {transactions.map(tx => (
                <div key={tx.id} className="tx-item glass-card" style={{ padding: '16px' }}>
                  <div className="flex items-center gap-md">
                    <div className={`tx-icon ${tx.type === 'credit' ? 'credit' : 'debit'}`}>
                      {tx.type === 'credit' ? '↓' : '↑'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="text-sm truncate" style={{ fontWeight: 500 }}>{tx.description}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(tx.createdAt)} • {formatTime(tx.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-display" style={{
                        fontWeight: 700,
                        color: tx.type === 'credit' ? 'var(--accent-green)' : 'var(--accent-pink)'
                      }}>
                        {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">💳</div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No transactions yet</p>
            </div>
          )}
        </div>

        {/* Razorpay Badge */}
        <div className="text-center animate-fadeIn stagger-4" style={{ marginTop: '32px', opacity: 0.5 }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Powered by Razorpay • Secure Payments 🔒
          </p>
        </div>
      </div>

      {/* Add Money Modal */}
      {showPayModal && (
        <div className="otp-modal-overlay" onClick={() => !payLoading && setShowPayModal(false)}>
          <div className="otp-modal glass-card animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-display" style={{ fontWeight: 600, marginBottom: '4px' }}>
              Add Money
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Top up your DELo wallet via Razorpay
            </p>

            <div className="input-group" style={{ marginBottom: '16px' }}>
              <label className="input-label">Amount (₹)</label>
              <input
                type="number"
                className="input-field"
                placeholder="Enter amount"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                min="1"
                autoFocus
                style={{ fontSize: '1.3rem', textAlign: 'center', fontWeight: 600 }}
              />
            </div>

            <div className="flex gap-sm justify-center" style={{ marginBottom: '24px' }}>
              {[100, 250, 500, 1000].map(amt => (
                <button key={amt} className={`chip chip-purple ${parseInt(payAmount)===amt?'active':''}`} onClick={() => setPayAmount(String(amt))}
                  style={{ cursor: 'pointer', padding: '8px 16px', fontSize: '0.85rem' }}>
                  ₹{amt}
                </button>
              ))}
            </div>

            <button className="btn btn-primary btn-full btn-lg" onClick={handleAddMoney} disabled={payLoading || !payAmount}>
              {payLoading ? 'Processing...' : `Pay ₹${payAmount || '0'}`}
            </button>

            <button className="btn btn-ghost btn-full" onClick={() => setShowPayModal(false)} style={{ marginTop: '8px' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <style>{`
        .wallet-card {
          position: relative; border-radius: var(--radius-xl); overflow: hidden;
          padding: 28px; color: white;
        }
        .wallet-card-bg {
          position: absolute; inset: 0;
          background: linear-gradient(135deg, #7c3aed, #3b82f6, #06b6d4);
          background-size: 200% 200%;
          animation: gradient-shift 5s ease infinite;
        }
        .wallet-content { position: relative; z-index: 1; }
        .wallet-balance { font-size: 2.5rem; font-weight: 800; margin: 8px 0 20px; }
        .wallet-actions { display: flex; gap: 12px; }
        .tx-icon {
          width: 36px; height: 36px; border-radius: var(--radius-sm); display: flex;
          align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem;
          flex-shrink: 0;
        }
        .tx-icon.credit { background: rgba(16,185,129,0.12); color: var(--accent-green); }
        .tx-icon.debit { background: rgba(236,72,153,0.12); color: var(--accent-pink); }
        .otp-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 24px;
        }
        .otp-modal { width: 100%; max-width: 380px; padding: 32px; text-align: center; }
      `}</style>
    </div>
  );
}
