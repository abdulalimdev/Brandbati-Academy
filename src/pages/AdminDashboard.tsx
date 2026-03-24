import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Users, CreditCard, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribePayments = onSnapshot(collection(db, 'payments'), (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribePayments();
    };
  }, []);

  const verifyPayment = async (paymentId: string, studentId: string, status: 'verified' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'payments', paymentId), { status });
      if (status === 'verified') {
        await updateDoc(doc(db, 'users', studentId), { paidStatus: 'paid' });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Control Panel</h2>
        <p className="text-slate-500">Manage users, verify payments, and monitor academy activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { name: 'Total Users', value: users.length, icon: Users, color: 'bg-blue-500' },
          { name: 'Students', value: users.filter(u => u.role === 'student').length, icon: Users, color: 'bg-emerald-500' },
          { name: 'Pending Payments', value: payments.filter(p => p.status === 'pending').length, icon: CreditCard, color: 'bg-amber-500' },
          { name: 'Verified', value: payments.filter(p => p.status === 'verified').length, icon: CheckCircle, color: 'bg-brand-teal' },
        ].map((stat, idx) => (
          <div key={stat.name} className="bg-white p-6 card-rounded shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={cn("p-3 rounded-xl text-white", stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.name}</p>
              <p className="text-xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Payment Verification */}
        <div className="bg-white card-rounded border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-xl font-bold text-slate-900">Payment Verification</h3>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.filter(p => p.status === 'pending').map((payment) => {
                  const student = users.find(u => u.uid === payment.studentId);
                  return (
                    <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 text-sm">{student?.displayName || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{payment.method.toUpperCase()}</p>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{payment.transactionId}</td>
                      <td className="px-6 py-4 font-bold text-brand-teal text-sm">৳{payment.amount}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => verifyPayment(payment.id, payment.studentId, 'verified')}
                            className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                            title="Verify"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => verifyPayment(payment.id, payment.studentId, 'rejected')}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Reject"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {payments.filter(p => p.status === 'pending').length === 0 && (
              <div className="p-12 text-center text-slate-400">
                No pending payments.
              </div>
            )}
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white card-rounded border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-slate-900">User Management</h3>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.slice(0, 10).map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 text-sm">{user.displayName}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                        user.paidStatus === 'paid' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                      )}>
                        {user.paidStatus || 'Unpaid'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
