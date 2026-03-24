import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Clock, ChevronRight, ChevronLeft, Award, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  marks: number;
}

export function ExamEngine() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [totalMarks, setTotalMarks] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!examId || !profile) return;

    // Check if user is paid
    if (profile.paidStatus !== 'paid') {
      alert("Please complete your payment to take exams.");
      navigate('/dashboard');
      return;
    }

    const fetchData = async () => {
      const examDoc = await getDoc(doc(db, 'exams', examId));
      if (examDoc.exists()) {
        const examData = examDoc.data();
        setExam({ id: examDoc.id, ...examData });
        setTimeLeft(examData.duration * 60);
      }

      const q = query(collection(db, `exams/${examId}/questions`));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const qs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
        setQuestions(qs);
        setTotalMarks(qs.reduce((acc, curr) => acc + (curr.marks || 0), 0));
      });

      return () => unsubscribe();
    };

    fetchData();
  }, [examId, profile, navigate]);

  useEffect(() => {
    if (timeLeft > 0 && !isFinished) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isFinished) {
      handleSubmit();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, isFinished]);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    let finalScore = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctOptionIndex) {
        finalScore += q.marks;
      }
    });

    setScore(finalScore);

    try {
      await addDoc(collection(db, 'attempts'), {
        examId,
        studentId: profile?.uid,
        score: finalScore,
        totalMarks,
        answers,
        submittedAt: new Date().toISOString(),
      });
      setIsFinished(true);
    } catch (error) {
      console.error("Error submitting exam:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!exam || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-teal"></div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white w-full max-w-lg card-rounded p-12 shadow-2xl text-center"
        >
          <div className="bg-emerald-100 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="text-emerald-500 w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Exam Completed!</h2>
          <p className="text-slate-500 mb-10">Your results have been calculated and stored.</p>
          
          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="bg-slate-50 p-6 rounded-3xl">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Your Score</p>
              <p className="text-3xl font-bold text-brand-teal">{score}</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Marks</p>
              <p className="text-3xl font-bold text-slate-900">{totalMarks}</p>
            </div>
          </div>

          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full bg-brand-teal text-white py-4 rounded-2xl font-bold shadow-lg shadow-brand-teal/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIdx];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-brand-teal/10 p-2 rounded-xl">
            <Award className="text-brand-teal w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md">{exam.title}</h1>
        </div>
        
        <div className={cn(
          "flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all",
          timeLeft < 60 ? "bg-red-50 text-red-600 animate-pulse" : "bg-brand-teal/10 text-brand-teal"
        )}>
          <Clock className="w-5 h-5" />
          <span className="tabular-nums text-lg">{formatTime(timeLeft)}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-6 lg:p-12">
        <div className="mb-10 flex items-center justify-between">
          <div className="flex gap-2">
            {questions.map((_, idx) => (
              <div 
                key={idx}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  idx === currentQuestionIdx ? "w-8 bg-brand-teal" : 
                  answers[questions[idx].id] !== undefined ? "bg-brand-teal/30" : "bg-slate-200"
                )}
              />
            ))}
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Question {currentQuestionIdx + 1} of {questions.length}
          </p>
        </div>

        <motion.div 
          key={currentQuestionIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white card-rounded p-10 shadow-xl shadow-brand-teal/5 border border-slate-100"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-10 leading-relaxed">{currentQuestion.text}</h2>
          
          <div className="space-y-4">
            {currentQuestion.options.map((option: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setAnswers({ ...answers, [currentQuestion.id]: idx })}
                className={cn(
                  "w-full p-6 rounded-2xl text-left font-semibold transition-all border-2 flex items-center justify-between group",
                  answers[currentQuestion.id] === idx 
                    ? "bg-brand-teal text-white border-brand-teal shadow-lg shadow-brand-teal/20" 
                    : "bg-slate-50 border-transparent text-slate-600 hover:border-brand-teal/30"
                )}
              >
                <span className="flex items-center gap-4">
                  <span className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all",
                    answers[currentQuestion.id] === idx ? "bg-white/20" : "bg-white text-slate-400 group-hover:text-brand-teal"
                  )}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {option}
                </span>
                {answers[currentQuestion.id] === idx && <CheckCircle className="w-6 h-6" />}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="mt-10 flex items-center justify-between">
          <button
            disabled={currentQuestionIdx === 0}
            onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-slate-500 hover:bg-white transition-all disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {currentQuestionIdx === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-emerald-500 text-white px-12 py-4 rounded-2xl font-bold shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              {isSubmitting ? 'Submitting...' : 'Finish Exam'}
              <CheckCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
              className="bg-brand-teal text-white px-12 py-4 rounded-2xl font-bold shadow-lg shadow-brand-teal/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
