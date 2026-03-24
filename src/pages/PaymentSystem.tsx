import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Layout } from '../components/Layout';
import { cn } from '../lib/utils';

export function PaymentSystem() {
  const { profile } = useAuth();
  const [method, setMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [amount, setAmount] = useState('1000');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'payments'), where('studentId', '==', profile.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'payments'), {
        studentId: profile.uid,
        transactionId,
        method,
        amount: parseFloat(amount),
        status: 'pending',
        submittedAt: new Date().toISOString(),
      });
      setSuccess(true);
      setTransactionId('');
    } catch (error) {
      console.error("Error submitting payment:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Payment Portal</h2>
          <p className="text-slate-500">Securely pay your academy fees via bKash or Nagad</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-10 card-rounded shadow-xl shadow-brand-teal/5 border border-slate-100"
            >
              {success ? (
                <div className="text-center py-10">
                  <div className="bg-emerald-100 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-emerald-500 w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Submission Successful</h3>
                  <p className="text-slate-500 mb-8">Our team will verify your transaction within 24 hours.</p>
                  <button 
                    onClick={() => setSuccess(false)}
                    className="bg-brand-teal text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-brand-teal/20"
                  >
                    Submit Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-widest">Select Method</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setMethod('bkash')}
                        className={cn(
                          "p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                          method === 'bkash' ? "border-brand-teal bg-brand-teal/5" : "border-slate-100 hover:border-brand-teal/30"
                        )}
                      >
                        <img src="https://www.logo.wine/a/logo/BKash/BKash-Logo.wine.svg" alt="bKash" className="h-10" />
                        <span className={cn("font-bold", method === 'bkash' ? "text-brand-teal" : "text-slate-400")}>bKash</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMethod('nagad')}
                        className={cn(
                          "p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                          method === 'nagad' ? "border-brand-teal bg-brand-teal/5" : "border-slate-100 hover:border-brand-teal/30"
                        )}
                      >
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Nagad_Logo.svg/2560px-Nagad_Logo.svg.png" alt="Nagad" className="h-10" />
                        <span className={cn("font-bold", method === 'nagad' ? "text-brand-teal" : "text-slate-400")}>Nagad</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-widest">Transaction ID</label>
                      <input
                        type="text"
                        required
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-teal outline-none font-mono tracking-widest"
                        placeholder="e.g. 8K2M9L4P1"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-widest">Amount (BDT)</label>
                      <input
                        type="number"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-teal outline-none font-bold text-xl"
                        placeholder="1000"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-teal text-white py-5 rounded-2xl font-bold shadow-lg shadow-brand-teal/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? 'Submitting...' : 'Submit Transaction'}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              )}
            </motion.div>

            <div className="bg-amber-50 border border-amber-100 p-6 card-rounded flex gap-4">
              <AlertCircle className="text-amber-500 w-6 h-6 shrink-0" />
              <div>
                <h4 className="font-bold text-amber-800 mb-1">Payment Instructions</h4>
                <p className="text-sm text-amber-700 leading-relaxed">
                  Send the amount to <span className="font-bold">017XXXXXXXX</span> (Personal) via your preferred method. 
                  After successful payment, enter the Transaction ID above to verify your status.
                </p>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900">Payment History</h3>
            <div className="space-y-4">
              {payments.map((p) => (
                <div key={p.id} className="bg-white p-6 card-rounded border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">৳{p.amount}</p>
                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">{p.transactionId}</p>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      p.status === 'verified' ? "bg-emerald-100 text-emerald-600" : 
                      p.status === 'rejected' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                    )}>
                      {p.status}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(p.submittedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {payments.length === 0 && (
                <div className="p-10 text-center text-slate-400 bg-white card-rounded border border-dashed border-slate-200">
                  No history found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
