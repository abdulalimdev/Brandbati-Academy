import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Award, CreditCard, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export function StudentDashboard() {
  const { profile } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const examsQuery = query(collection(db, 'exams'), where('published', '==', true));
    const unsubscribeExams = onSnapshot(examsQuery, (snapshot) => {
      setExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const attemptsQuery = query(collection(db, 'attempts'), where('studentId', '==', profile.uid));
    const unsubscribeAttempts = onSnapshot(attemptsQuery, (snapshot) => {
      setAttempts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubscribeExams();
      unsubscribeAttempts();
    };
  }, [profile]);

  const stats = [
    { name: 'Available Exams', value: exams.length, icon: BookOpen, color: 'bg-blue-500' },
    { name: 'Exams Passed', value: attempts.filter(a => (a.score / a.totalMarks) >= 0.4).length, icon: Award, color: 'bg-green-500' },
    { name: 'Payment Status', value: profile?.paidStatus || 'Unpaid', icon: CreditCard, color: profile?.paidStatus === 'paid' ? 'bg-emerald-500' : 'bg-amber-500' },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Hello, {profile?.displayName}!</h2>
        <p className="text-slate-500">Ready to test your knowledge today?</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-8 card-rounded shadow-sm border border-slate-100 flex items-center gap-6"
          >
            <div className={cn("p-4 rounded-2xl text-white shadow-lg", stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.name}</p>
              <p className="text-2xl font-bold text-slate-900 capitalize">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Available Exams */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Available Exams</h3>
          <Link to="/exams" className="text-brand-teal font-semibold text-sm hover:underline flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {exams.length > 0 ? (
            exams.slice(0, 4).map((exam, idx) => (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-6 card-rounded border border-slate-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-brand-teal/10 p-3 rounded-xl">
                    <BookOpen className="text-brand-teal w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    {exam.duration} mins
                  </div>
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-brand-teal transition-colors">{exam.title}</h4>
                <p className="text-slate-500 text-sm mb-6 line-clamp-2">{exam.description}</p>
                
                <Link 
                  to={`/exam/${exam.id}`}
                  className="w-full bg-slate-50 text-brand-teal py-3 rounded-2xl font-bold hover:bg-brand-teal hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  Take Exam
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full bg-white p-12 card-rounded border border-dashed border-slate-200 text-center">
              <p className="text-slate-400">No exams available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
