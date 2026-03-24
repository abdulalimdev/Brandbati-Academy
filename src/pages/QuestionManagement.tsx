import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, addDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Trash2, ChevronLeft, Save, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { Layout } from '../components/Layout';
import { cn } from '../lib/utils';

export function QuestionManagement() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0,
    marks: 1
  });

  useEffect(() => {
    if (!examId) return;

    const fetchExam = async () => {
      const examDoc = await getDoc(doc(db, 'exams', examId));
      if (examDoc.exists()) {
        setExam({ id: examDoc.id, ...examDoc.data() });
      }
    };
    fetchExam();

    const q = query(collection(db, `exams/${examId}/questions`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [examId]);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, `exams/${examId}/questions`), newQuestion);
      setShowAddForm(false);
      setNewQuestion({ text: '', options: ['', '', '', ''], correctOptionIndex: 0, marks: 1 });
    } catch (error) {
      console.error("Error adding question:", error);
    }
  };

  const deleteQuestion = async (qId: string) => {
    try {
      await deleteDoc(doc(db, `exams/${examId}/questions`, qId));
    } catch (error) {
      console.error("Error deleting question:", error);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{exam?.title}</h2>
            <p className="text-slate-500">Question Management</p>
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="ml-auto bg-brand-teal text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-brand-teal/20 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Question
          </button>
        </div>

        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 card-rounded border border-brand-teal/20 shadow-xl shadow-brand-teal/5"
          >
            <form onSubmit={handleAddQuestion} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Question Text</label>
                <textarea
                  required
                  value={newQuestion.text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-teal outline-none h-24 resize-none"
                  placeholder="Enter the question..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {newQuestion.options.map((opt, idx) => (
                  <div key={idx} className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                      Option {idx + 1}
                      <input 
                        type="radio" 
                        name="correct" 
                        checked={newQuestion.correctOptionIndex === idx}
                        onChange={() => setNewQuestion({ ...newQuestion, correctOptionIndex: idx })}
                        className="text-brand-teal focus:ring-brand-teal"
                      />
                    </label>
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...newQuestion.options];
                        newOpts[idx] = e.target.value;
                        setNewQuestion({ ...newQuestion, options: newOpts });
                      }}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-teal outline-none"
                      placeholder={`Option ${idx + 1}`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-6">
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-semibold text-slate-700">Marks</label>
                  <input
                    type="number"
                    required
                    value={newQuestion.marks}
                    onChange={(e) => setNewQuestion({ ...newQuestion, marks: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-teal outline-none"
                    min="1"
                  />
                </div>
                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-3 font-bold text-slate-500">Cancel</button>
                  <button type="submit" className="bg-brand-teal text-white px-10 py-3 rounded-2xl font-bold shadow-lg shadow-brand-teal/20">Save Question</button>
                </div>
              </div>
            </form>
          </motion.div>
        )}

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <motion.div 
              key={q.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-8 card-rounded border border-slate-100 shadow-sm group relative"
            >
              <button 
                onClick={() => deleteQuestion(q.id)}
                className="absolute top-6 right-6 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <div className="flex items-start gap-4 mb-6">
                <span className="bg-slate-100 text-slate-500 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">{idx + 1}</span>
                <div className="flex-1">
                  <p className="text-lg font-bold text-slate-900 mb-4">{q.text}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt: string, oIdx: number) => (
                      <div 
                        key={oIdx}
                        className={cn(
                          "p-4 rounded-2xl text-sm font-medium border-2",
                          q.correctOptionIndex === oIdx 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                            : "bg-slate-50 border-transparent text-slate-600"
                        )}
                      >
                        {opt}
                        {q.correctOptionIndex === oIdx && <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-emerald-500">(Correct)</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                <Award className="w-4 h-4" />
                {q.marks} Marks
              </div>
            </motion.div>
          ))}
          {questions.length === 0 && !loading && (
            <div className="p-20 text-center text-slate-400 bg-white card-rounded border border-dashed border-slate-200">
              No questions added yet.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
