import { useState, useEffect } from 'react';
import { paymentService } from '../services/api.js';

export default function PaymentsPage({ onNavigate, onBack }) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [bal, txs] = await Promise.all([
          paymentService.getWalletBalance(),
          paymentService.getTransactions()
        ]);
        setBalance(bal || 0);
        setTransactions(txs || []);
      } catch (e) { console.error(e); }
    }
    loadData();
  }, []);

  const handleAddMoney = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) return;
    setPayLoading(true);
    setError('');
    try {
      const order = await paymentService.createOrder(parseFloat(payAmount), null);
      paymentService.openPayment(
        order,
        async (response) => {
          try {
            await paymentService.recordTransaction({
              type: 'credit',
              amount: parseFloat(payAmount),
              description: 'Wallet top-up',
              razorpayPaymentId: response.razorpay_payment_id,
            });
            const bal = await paymentService.getWalletBalance();
            const txs = await paymentService.getTransactions();
            setBalance(bal || 0);
            setTransactions(txs || []);
            setShowPayModal(false);
            setPayAmount('');
          } catch (e) {
            setError("Database sync failed. Balance might update later.");
          } finally {
            setPayLoading(false);
          }
        },
        (err) => { 
          setError(err.message || 'Payment failed');
          setPayLoading(false); 
        }
      );
    } catch (err) {
      setError('Order creation failed');
      setPayLoading(false);
    }
  };

  return (
    <div className="page animate-fadeIn">
      <div className="page-header" style={{ marginBottom: '48px' }}>
        <h1 className="text-2xl font-display" style={{ fontWeight: 800 }}>Payments</h1>
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {/* Wallet Card */}
        <div className="wallet-card-neon" style={{ 
          background: 'var(--gradient-purple)', borderRadius: '32px', padding: '40px',
          position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(192, 132, 252, 0.3)'
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <p className="text-xs" style={{ fontWeight: 800, opacity: 0.8, letterSpacing: '0.1em', marginBottom: '8px' }}>PERSONAL WALLET</p>
            <div className="text-xl font-display" style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '32px' }}>
              ₹{balance.toLocaleString()}
            </div>
            <div className="flex gap-md">
              <button className="btn btn-primary" style={{ background: '#fff', color: '#000', padding: '12px 24px' }} onClick={() => setShowPayModal(true)}>
                + Add Funds
              </button>
              <button className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '12px 24px' }}>
                History
              </button>
            </div>
          </div>
          {/* Decorative Circle */}
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(40px)' }} />
        </div>

        {/* Transactions List */}
        <div className="section">
          <h2 className="text-lg font-display" style={{ marginBottom: '24px' }}>Activity</h2>
          {transactions.length > 0 ? (
            <div className="flex flex-col gap-md">
              {transactions.map(tx => (
                <div key={tx.id} className="glass-card" style={{ padding: '20px' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-md">
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '12px', background: tx.type === 'credit' ? 'rgba(52,211,153,0.1)' : 'rgba(244,114,182,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
                      }}>
                        {tx.type === 'credit' ? '↓' : '↑'}
                      </div>
                      <div>
                        <div className="text-sm" style={{ fontWeight: 700 }}>{tx.description}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(tx.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="font-display" style={{ fontWeight: 800, color: tx.type === 'credit' ? 'var(--accent-green)' : 'var(--accent-pink)' }}>
                      {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center" style={{ padding: '60px 0', opacity: 0.3 }}>
               <p className="text-sm">No transactions yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Money Modal */}
      {showPayModal && (
        <div className="modal-overlay" onClick={() => !payLoading && setShowPayModal(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
        }}>
          <div className="glass-card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', padding: '40px', textAlign: 'center' }}>
            <h3 className="text-xl font-display" style={{ marginBottom: '8px' }}>Add Funds</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Enter the amount you want to add to your DELo wallet.</p>
            
            <div className="input-group" style={{ marginBottom: '24px' }}>
              <input 
                type="number" className="input-field text-center" style={{ fontSize: '2rem', fontWeight: 800 }} 
                value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0" autoFocus
              />
            </div>

            <div className="flex gap-sm justify-center" style={{ marginBottom: '32px' }}>
              {[100, 500, 1000].map(amt => (
                <button key={amt} className="chip chip-purple" onClick={() => setPayAmount(String(amt))}>+₹{amt}</button>
              ))}
            </div>

            {error && <p style={{ color: 'var(--accent-pink)', fontSize: '0.8rem', marginBottom: '16px', fontWeight: 700 }}>{error}</p>}

            <button className="btn btn-primary btn-full" disabled={payLoading || !payAmount} onClick={handleAddMoney}>
               {payLoading ? 'Processing...' : `Confirm Payment`}
            </button>
            <button className="btn btn-ghost btn-full" style={{ marginTop: '12px', fontSize: '0.9rem' }} onClick={() => setShowPayModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
