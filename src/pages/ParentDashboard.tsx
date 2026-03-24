import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Award, BookOpen, Clock, User, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export function ParentDashboard() {
  const { profile } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.studentId) {
      setLoading(false);
      return;
    }

    const fetchStudent = async () => {
      const studentDoc = await getDoc(doc(db, 'users', profile.studentId!));
      if (studentDoc.exists()) {
        setStudent({ id: studentDoc.id, ...studentDoc.data() });
      }
    };

    fetchStudent();

    const attemptsQuery = query(collection(db, 'attempts'), where('studentId', '==', profile.studentId));
    const unsubscribe = onSnapshot(attemptsQuery, (snapshot) => {
      setAttempts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  if (!profile?.studentId) {
    return (
      <div className="bg-white p-12 card-rounded border border-dashed border-slate-200 text-center">
        <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">No Student Linked</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          Please contact the administrator to link your account with your child's student ID.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Parent Portal</h2>
        <p className="text-slate-500">Monitoring progress for <span className="font-bold text-brand-teal">{student?.displayName}</span></p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 card-rounded shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="p-4 rounded-2xl bg-blue-500 text-white shadow-lg">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Exams Taken</p>
            <p className="text-2xl font-bold text-slate-900">{attempts.length}</p>
          </div>
        </div>
        <div className="bg-white p-8 card-rounded shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="p-4 rounded-2xl bg-emerald-500 text-white shadow-lg">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Average Score</p>
            <p className="text-2xl font-bold text-slate-900">
              {attempts.length > 0 
                ? Math.round(attempts.reduce((acc, curr) => acc + (curr.score / curr.totalMarks), 0) / attempts.length * 100)
                : 0}%
            </p>
          </div>
        </div>
        <div className="bg-white p-8 card-rounded shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="p-4 rounded-2xl bg-amber-500 text-white shadow-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Last Attempt</p>
            <p className="text-lg font-bold text-slate-900">
              {attempts.length > 0 
                ? new Date(attempts.sort((a,b) => b.submittedAt.localeCompare(a.submittedAt))[0].submittedAt).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white card-rounded border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900">Recent Exam Results</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Exam</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attempts.map((attempt) => (
                <tr key={attempt.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">Exam #{attempt.examId.slice(0, 8)}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-900">{attempt.score}</span>
                    <span className="text-slate-400 text-sm"> / {attempt.totalMarks}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {new Date(attempt.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      (attempt.score / attempt.totalMarks) >= 0.4 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                    )}>
                      {(attempt.score / attempt.totalMarks) >= 0.4 ? 'Passed' : 'Failed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {attempts.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              No exam attempts recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
