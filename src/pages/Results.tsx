import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Award, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Layout } from '../components/Layout';
import { cn } from '../lib/utils';

export function Results() {
  const { profile } = useAuth();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const q = query(collection(db, 'attempts'), where('studentId', '==', profile.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAttempts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  return (
    <Layout>
      <div className="space-y-10">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Your Performance</h2>
          <p className="text-slate-500">Track your progress and review your exam history</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {attempts.sort((a,b) => b.submittedAt.localeCompare(a.submittedAt)).map((attempt, idx) => {
            const percentage = (attempt.score / attempt.totalMarks) * 100;
            const passed = percentage >= 40;

            return (
              <motion.div 
                key={attempt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-8 card-rounded border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8 group hover:shadow-md transition-all"
              >
                <div className={cn(
                  "w-24 h-24 rounded-full flex flex-col items-center justify-center border-4",
                  passed ? "border-emerald-100 text-emerald-600" : "border-red-100 text-red-600"
                )}>
                  <span className="text-2xl font-bold">{Math.round(percentage)}%</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">{passed ? 'Pass' : 'Fail'}</span>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Exam Attempt #{attempt.id.slice(0, 8)}</h3>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-500 text-sm font-medium">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {attempt.totalMarks} Marks Total
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(attempt.submittedAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 px-8 py-4 rounded-2xl text-center min-w-[140px]">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Score</p>
                  <p className="text-2xl font-bold text-slate-900">{attempt.score} / {attempt.totalMarks}</p>
                </div>
              </motion.div>
            );
          })}

          {attempts.length === 0 && !loading && (
            <div className="p-20 text-center text-slate-400 bg-white card-rounded border border-dashed border-slate-200">
              <Award className="w-16 h-16 mx-auto mb-4 text-slate-200" />
              <p className="text-lg font-medium">No exam results found.</p>
              <p className="text-sm">Complete an exam to see your performance here.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
