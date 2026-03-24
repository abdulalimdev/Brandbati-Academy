import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit2, Trash2, Eye, EyeOff, BookOpen, Users, Award, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export function TeacherDashboard() {
  const { profile } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newExam, setNewExam] = useState({ title: '', description: '', duration: 30 });

  useEffect(() => {
    if (!profile) return;

    const examsQuery = query(collection(db, 'exams'), where('teacherId', '==', profile.uid));
    const unsubscribe = onSnapshot(examsQuery, (snapshot) => {
      setExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      await addDoc(collection(db, 'exams'), {
        ...newExam,
        teacherId: profile.uid,
        published: false,
        createdAt: new Date().toISOString(),
      });
      setShowCreateModal(false);
      setNewExam({ title: '', description: '', duration: 30 });
    } catch (error) {
      console.error("Error creating exam:", error);
    }
  };

  const togglePublish = async (examId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'exams', examId), { published: !currentStatus });
    } catch (error) {
      console.error("Error toggling publish:", error);
    }
  };

  const deleteExam = async (examId: string) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        await deleteDoc(doc(db, 'exams', examId));
      } catch (error) {
        console.error("Error deleting exam:", error);
      }
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Teacher Dashboard</h2>
          <p className="text-slate-500">Manage your exams and student progress</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-brand-teal text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-brand-teal/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Exam
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 card-rounded shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="p-4 rounded-2xl bg-blue-500 text-white shadow-lg">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Exams</p>
            <p className="text-2xl font-bold text-slate-900">{exams.length}</p>
          </div>
        </div>
        <div className="bg-white p-8 card-rounded shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="p-4 rounded-2xl bg-emerald-500 text-white shadow-lg">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Published</p>
            <p className="text-2xl font-bold text-slate-900">{exams.filter(e => e.published).length}</p>
          </div>
        </div>
        <div className="bg-white p-8 card-rounded shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="p-4 rounded-2xl bg-amber-500 text-white shadow-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Submissions</p>
            <p className="text-2xl font-bold text-slate-900">--</p>
          </div>
        </div>
      </div>

      {/* Exam List */}
      <div className="bg-white card-rounded border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Your Exams</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exams.map((exam) => (
                <tr key={exam.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{exam.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{exam.description}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{exam.duration}m</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      exam.published ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                    )}>
                      {exam.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {new Date(exam.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => togglePublish(exam.id, exam.published)}
                        className={cn(
                          "p-2 rounded-xl transition-all",
                          exam.published ? "text-amber-500 hover:bg-amber-50" : "text-emerald-500 hover:bg-emerald-50"
                        )}
                        title={exam.published ? 'Unpublish' : 'Publish'}
                      >
                        {exam.published ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      <Link 
                        to={`/teacher/exam/${exam.id}/questions`}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                        title="Edit Questions"
                      >
                        <Edit2 className="w-5 h-5" />
                      </Link>
                      <button 
                        onClick={() => deleteExam(exam.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {exams.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              No exams created yet. Click "Create Exam" to get started.
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-lg card-rounded p-10 shadow-2xl"
          >
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Create New Exam</h3>
            <form onSubmit={handleCreateExam} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Exam Title</label>
                <input
                  type="text"
                  required
                  value={newExam.title}
                  onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-teal outline-none"
                  placeholder="e.g. Mathematics Midterm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  required
                  value={newExam.description}
                  onChange={(e) => setNewExam({ ...newExam, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-teal outline-none h-24 resize-none"
                  placeholder="Enter exam instructions or details..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Duration (Minutes)</label>
                <input
                  type="number"
                  required
                  value={newExam.duration}
                  onChange={(e) => setNewExam({ ...newExam, duration: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-teal outline-none"
                  min="1"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-teal text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-brand-teal/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
