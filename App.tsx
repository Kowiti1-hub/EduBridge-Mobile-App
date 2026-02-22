import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Mic, 
  Paperclip, 
  Send, 
  Sparkles, 
  Share2, 
  X, 
  Check,
  FileText, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Palette, 
  MoreVertical,
  Wifi,
  Zap,
  HelpCircle
} from 'lucide-react';
import { Message, MessageType, Subject, LearningStage, Test } from './types';
import { USSD_MENU, SUBJECTS, HELP_MESSAGE } from './constants';
import { LESSON_DATA } from './lessons';
import ChatBubble from './components/ChatBubble';
import SubjectGrid from './components/SubjectGrid';
import { generateEducationalResponse, generateEducationalImage, summarizeTheory } from './services/geminiService';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const TOTAL_LESSONS = 5;

const StageSelection: React.FC<{ onSelect: (stage: LearningStage) => void }> = ({ onSelect }) => {
  const stages = Object.values(LearningStage);
  return (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-[#075e54]">Choose Your Stage</h2>
        <p className="text-sm text-gray-500">Select your current level of study to begin.</p>
      </div>
      <div className="grid gap-4">
        {stages.map((stage) => (
          <button
            key={stage}
            onClick={() => onSelect(stage)}
            className="w-full p-5 rounded-2xl bg-white border-2 border-emerald-50 hover:border-emerald-500 hover:shadow-xl transition-all flex items-center justify-between group active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {stage === LearningStage.PRE_SCHOOL ? '👶' : 
                 stage === LearningStage.ELEMENTARY ? '🎒' :
                 stage === LearningStage.PRIMARY ? '🏫' :
                 stage === LearningStage.SECONDARY ? '📚' : '🎓'}
              </div>
              <span className="font-bold text-gray-800">{stage}</span>
            </div>
            <ChevronRight className="text-emerald-200 group-hover:text-emerald-500" />
          </button>
        ))}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<'stage' | 'home' | 'chat'>('stage');
  const [selectedStage, setSelectedStage] = useState<LearningStage | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [currentLesson, setCurrentLesson] = useState(1);
  const [isCourseCompleted, setIsCourseCompleted] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [isDataSaver, setIsDataSaver] = useState(true);
  const [dataUsed, setDataUsed] = useState(1.2); // in MB
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [attachmentMode, setAttachmentMode] = useState<'menu' | 'note' | 'audio' | 'image' | 'generate_image' | 'link'>('menu');
  const [imageQuality, setImageQuality] = useState<'low' | 'high'>('low');
  const [noteInput, setNoteInput] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isOptimizingImage, setIsOptimizingImage] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDataUsageModalOpen, setIsDataUsageModalOpen] = useState(false);
  const [sharingMessage, setSharingMessage] = useState<Message | null>(null);
  
  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Audio Feedback Implementation
  const playTone = (freq: number, duration: number, type: 'sine' | 'triangle' | 'square' = 'sine', volume = 0.05) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) { console.warn("Audio Context Error", e); }
  };

  const playSuccessSound = () => playTone(880, 0.1, 'sine');
  const playErrorSound = () => playTone(220, 0.2, 'triangle', 0.1);
  const playNavigationSound = () => playTone(440, 0.05, 'sine');

  const addMessage = (content: string, type: MessageType, isUssd: boolean = false, metadata?: any) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      type,
      content,
      timestamp: new Date(),
      isUssd,
      metadata
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const deliverLesson = (subjectId: string, lessonNum: number) => {
    const lesson = LESSON_DATA[subjectId]?.[lessonNum];
    if (lesson) {
      const content = `${lesson.title}\n\n${lesson.theory}\n\nQuestion: ${lesson.question}`;
      addMessage(content, MessageType.BOT, false, { lessonNum, totalLessons: TOTAL_LESSONS });
      
      if (lesson.test) {
        setTimeout(() => {
          addMessage("Ready for a quick test?", MessageType.TEST, false, { test: lesson.test });
        }, 1500);
      }
      
      speakFeedback(lesson.title);
    }
  };

  const handleTestAnswer = (answerIndex: number) => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.type !== MessageType.TEST || !lastMessage.metadata?.test) return;
    
    const test = lastMessage.metadata.test;
    const isCorrect = answerIndex === test.correctAnswer;
    
    addMessage(test.options[answerIndex], MessageType.USER);
    
    setTimeout(() => {
      if (isCorrect) {
        addMessage("✅ Correct! Well done.", MessageType.BOT);
        playSuccessSound();
      } else {
        addMessage(`❌ Not quite. The correct answer was: ${test.options[test.correctAnswer]}`, MessageType.BOT);
        playErrorSound();
      }
    }, 800);
  };

  const speakFeedback = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.3;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setInput('');
            handleUssdInput(transcript);
            setIsListening(false);
          } else {
            interimTranscript += transcript;
            setInput(interimTranscript);
          }
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert("Microphone access denied. Please enable it in your browser settings.");
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    } else {
      setIsSpeechSupported(false);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const toggleListening = () => {
    if (!isSpeechSupported) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        setIsListening(true);
        recognitionRef.current.start();
        playNavigationSound();
      } catch (e) {
        console.error("Failed to start recognition", e);
        setIsListening(false);
      }
    }
  };

  const handleSummarize = async () => {
    if (!currentSubject || isThinking) return;
    const theory = LESSON_DATA[currentSubject.id]?.[currentLesson]?.theory;
    if (!theory) return;
    setIsThinking(true);
    const summary = await summarizeTheory(theory);
    setIsThinking(false);
    addMessage(`Summarize Lesson ${currentLesson}`, MessageType.USER);
    addMessage(`📝 *Recap:* ${summary}`, MessageType.BOT);
    playSuccessSound();
  };

  const shareViaSms = () => {
    if (!sharingMessage) return;
    const context = currentSubject ? ` [${currentSubject.title} L${currentLesson}]` : "";
    const body = `EduBridge Lesson${context}: ${sharingMessage.content.slice(0, 100)}... Learn more at edubridge.org`;
    window.location.href = `sms:?body=${encodeURIComponent(body)}`;
    setSharingMessage(null);
    playSuccessSound();
  };

  const shareViaWhatsApp = () => {
    if (!sharingMessage) return;
    const context = currentSubject ? ` *[${currentSubject.title} - L${currentLesson}]*` : "";
    const body = `📚 *EduBridge*${context}\n\n${sharingMessage.content.slice(0, 200)}...\n\n🔗 edubridge.org`;
    window.location.href = `https://wa.me/?text=${encodeURIComponent(body)}`;
    setSharingMessage(null);
    playSuccessSound();
  };

  const compressImage = (base64Str: string, quality: 'low' | 'high'): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = quality === 'high' ? 1200 : 600;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; }
        } else {
          if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality === 'high' ? 0.8 : 0.4));
      };
    });
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsOptimizingImage(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const optimizedImage = await compressImage(reader.result as string, imageQuality);
        addMessage("Image Attachment", MessageType.IMAGE, false, { imageData: optimizedImage, isHighQuality: imageQuality === 'high' });
        addMessage(`Shared image in ${imageQuality === 'high' ? 'High Quality' : 'Data-Saver'} mode.`, MessageType.BOT);
        setIsOptimizingImage(false);
        setIsAttachmentMenuOpen(false);
        setAttachmentMode('menu');
        playSuccessSound();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiImageGeneration = async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImage(true);
    speakFeedback("Generating educational graphic...");
    const base64Image = await generateEducationalImage(imagePrompt, currentSubject?.title || null, isDataSaver);
    setIsGeneratingImage(false);
    
    if (base64Image) {
      addMessage(`Educational Graphic: ${imagePrompt}`, MessageType.IMAGE, false, { imageData: base64Image, isHighQuality: false });
      addMessage(`AI generated a low-bandwidth graphic for "${imagePrompt}" 🎨`, MessageType.BOT);
      setIsAttachmentMenuOpen(false);
      setAttachmentMode('menu');
      setImagePrompt('');
      playSuccessSound();
    } else {
      playErrorSound();
      addMessage("Sorry, I couldn't generate that image. Please try a different description.", MessageType.BOT);
    }
  };

  const handleSendLink = () => {
    if (!linkInput.trim()) return;
    addMessage("Educational Resource", MessageType.LINK, false, { url: linkInput.trim() });
    setLinkInput('');
    setAttachmentMode('menu');
    setIsAttachmentMenuOpen(false);
    playSuccessSound();
  };

  const handleUssdInput = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput('');
    const command = trimmed.toLowerCase();

    if (trimmed === '*5#') {
      setIsAttachmentMenuOpen(true);
      setAttachmentMode('menu');
      playSuccessSound();
      return;
    }

    if (command === 'next' || command === 'next lesson' || command.includes('next')) {
      if (isCourseCompleted) return;
      const nextLesson = currentLesson + 1;
      if (nextLesson <= TOTAL_LESSONS && currentSubject) {
        addMessage('Next Lesson', MessageType.USER);
        setCurrentLesson(nextLesson);
        deliverLesson(currentSubject.id, nextLesson);
        playSuccessSound();
        return;
      } else if (nextLesson > TOTAL_LESSONS && currentSubject) {
        setIsCourseCompleted(true);
        setShowConfetti(true);
        addMessage(`🎓 Course Complete! Great job with ${currentSubject.title}.`, MessageType.BOT, false, { lessonNum: TOTAL_LESSONS, totalLessons: TOTAL_LESSONS, isComplete: true });
        playSuccessSound();
        setTimeout(() => setShowConfetti(false), 5000);
        return;
      }
    }

    // Handle Previous Lesson navigation via command or USSD codes *2# and *99#
    if (command === 'previous' || command === 'back' || trimmed === '*99#' || trimmed === '*2#') {
      if (currentSubject && currentLesson > 1) {
        const prevLesson = currentLesson - 1;
        setCurrentLesson(prevLesson);
        deliverLesson(currentSubject.id, prevLesson);
        playNavigationSound();
        return;
      }
    }

    if (command === 'menu') { setView('home'); playNavigationSound(); return; }
    if (trimmed === '0' || trimmed === '*0#') {
      if (view === 'home') {
        setView('stage');
        playNavigationSound();
        return;
      }
      addMessage(trimmed, MessageType.USER, true);
      addMessage(HELP_MESSAGE, MessageType.BOT, true);
      playSuccessSound();
      return;
    }

    const num = parseInt(trimmed);
    if (!isNaN(num) && num >= 1) {
      if (view === 'stage') {
        const stages = Object.values(LearningStage);
        if (num <= stages.length) {
          setSelectedStage(stages[num - 1]);
          setView('home');
          playSuccessSound();
          return;
        }
      } else if (view === 'home' && selectedStage) {
        const stageSubjects = SUBJECTS.filter(s => s.stage === selectedStage);
        if (num <= stageSubjects.length) {
          const sub = stageSubjects[num - 1];
          setCurrentSubject(sub);
          setCurrentLesson(1);
          setIsCourseCompleted(false);
          setView('chat');
          deliverLesson(sub.id, 1);
          playSuccessSound();
          return;
        }
      }
    }

    if (view === 'chat' && !isAttachmentMenuOpen) {
      handleSend(trimmed);
    } else if (isAttachmentMenuOpen && attachmentMode === 'menu') {
      const menuMap: Record<string, 'menu' | 'note' | 'audio' | 'image' | 'generate_image' | 'link'> = { 
        '1': 'note', 
        '2': 'link', 
        '3': 'audio', 
        '4': 'image',
        '5': 'generate_image'
      };
      if (menuMap[trimmed]) {
        setAttachmentMode(menuMap[trimmed]);
        playSuccessSound();
      } else {
        playErrorSound();
      }
    } else {
      playErrorSound();
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    addMessage(text, MessageType.USER);
    setIsThinking(true);
    const response = await generateEducationalResponse(text, messages, currentSubject?.title || null, isDataSaver);
    setIsThinking(false);
    addMessage(response, MessageType.BOT);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          addMessage("Voice Note", MessageType.AUDIO, false, { audioData: reader.result as string, duration: recordingTime });
          addMessage("Voice note received. 🎙️", MessageType.BOT);
          setIsAttachmentMenuOpen(false);
          setAttachmentMode('menu');
          playSuccessSound();
        };
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => setRecordingTime(p => p + 1), 1000);
    } catch (e) { playErrorSound(); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const triggerUssd = () => {
    addMessage("*123#", MessageType.USER, true);
    if (view === 'stage') {
      const stages = Object.values(LearningStage);
      const menu = `CHOOSE STAGE:\n${stages.map((s, i) => `${i+1}. ${s}`).join('\n')}`;
      addMessage(menu, MessageType.BOT, true);
    } else if (view === 'home' && selectedStage) {
      const stageSubjects = SUBJECTS.filter(s => s.stage === selectedStage);
      const menu = `${selectedStage.toUpperCase()} SUBJECTS:\n${stageSubjects.map((s, i) => `${i+1}. ${s.title}`).join('\n')}\n0. Back to Stages`;
      addMessage(menu, MessageType.BOT, true);
    } else {
      addMessage(USSD_MENU, MessageType.BOT, true);
    }
    playSuccessSound();
  };

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto bg-gray-50 border-x border-gray-200 shadow-2xl relative overflow-hidden">
      {showConfetti && Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="confetti" style={{ left: `${Math.random() * 100}%`, backgroundColor: ['#10b981', '#fbbf24', '#3b82f6', '#ef4444'][Math.floor(Math.random() * 4)], animationDelay: `${Math.random() * 2}s` }} />
      ))}
      <header className="bg-[#075e54] text-white p-4 pt-8 shadow-md flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {view === 'chat' && (
            <button onClick={() => setView('home')} className="p-1 hover:bg-black/10 rounded-full transition-colors">
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl overflow-hidden border border-white/30">
              {view === 'chat' && currentSubject ? currentSubject.icon : '🎓'}
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">
                {view === 'chat' && currentSubject ? currentSubject.title : 'EduBridge'}
              </h1>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <p className="text-[10px] opacity-90 uppercase tracking-tighter">Online • {isDataSaver ? 'Data Saver On' : 'Full Data'}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsDataUsageModalOpen(true)} 
            className={`text-[9px] px-2 py-1 rounded border font-bold transition-colors ${isDataSaver ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white/10 border-white/30 text-white'}`}
          >
            {isDataSaver ? 'SAVER' : 'NORMAL'}
          </button>
          <button onClick={triggerUssd} className="text-[10px] bg-white/20 px-2 py-1 rounded border border-white/30 font-mono active:bg-white/40">*123#</button>
        </div>
      </header>

      {view === 'chat' && currentSubject && (
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-200 px-3 py-2 flex items-center justify-between shadow-sm">
          <button onClick={() => handleUssdInput('Previous')} disabled={currentLesson === 1} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentLesson === 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100 active:scale-95'}`}>
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest leading-none text-emerald-800">
              {isCourseCompleted ? 'Done' : `Lesson ${currentLesson} / ${TOTAL_LESSONS}`}
            </span>
            {!isCourseCompleted && (
              <button onClick={handleSummarize} disabled={isThinking} className="mt-1 px-3 py-1 bg-emerald-500 text-white rounded-lg text-[9px] font-bold hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1 shadow-sm transition-transform active:scale-95">
                <Sparkles className="h-2.5 w-2.5" /> Summarize Lesson
              </button>
            )}
          </div>
          <button onClick={() => handleUssdInput('Next')} disabled={isCourseCompleted} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isCourseCompleted ? 'text-gray-300' : 'text-emerald-600 hover:bg-emerald-50 active:scale-95'}`}>
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto whatsapp-bg relative" ref={scrollRef}>
        {view === 'stage' ? (
          <StageSelection onSelect={(stage) => {
            setSelectedStage(stage);
            setView('home');
            playSuccessSound();
          }} />
        ) : view === 'home' ? (
          <div className="pb-20">
            <div className="bg-white m-4 p-5 rounded-2xl shadow-sm border border-emerald-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 opacity-50" />
              <h2 className="text-xl font-bold text-[#075e54] mb-1 relative z-10">Welcome back! 📖</h2>
              <p className="text-xs text-gray-500 mb-4 relative z-10">You've saved <span className="text-emerald-600 font-bold">{dataUsed.toFixed(1)}MB</span> of data today.</p>
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 font-medium italic text-[11px] text-emerald-900 relative z-10">
                "Education is the most powerful weapon which you can use to change the world."
              </div>
              <div className="mt-4 flex gap-2">
                <div className="flex-1 bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <span className="block text-[8px] text-gray-400 uppercase font-bold">Stage</span>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    {selectedStage}
                  </span>
                </div>
                <div className="flex-1 bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <span className="block text-[8px] text-gray-400 uppercase font-bold">Lessons Today</span>
                  <span className="text-[10px] text-indigo-600 font-bold">3 Completed</span>
                </div>
              </div>
              <button 
                onClick={() => setView('stage')}
                className="mt-4 w-full py-2 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
              >
                Change Learning Stage
              </button>
            </div>
            {selectedStage && (
              <SubjectGrid 
                stage={selectedStage}
                onSelect={(s) => { 
                  const stageSubjects = SUBJECTS.filter(x => x.stage === selectedStage);
                  const num = stageSubjects.findIndex(x => x.id === s.id) + 1;
                  handleUssdInput(num.toString());
                }} 
              />
            )}
          </div>
        ) : (
          <div className="p-4 pb-32">
            {messages.map((msg) => (
              <ChatBubble 
                key={msg.id} 
                message={msg} 
                onShare={(m) => { setSharingMessage(m); playNavigationSound(); }} 
                onTestAnswer={handleTestAnswer}
              />
            ))}
            {(isThinking || isGeneratingImage) && (
              <div className="flex flex-col gap-1 p-3 bg-white rounded-xl w-fit ml-2 shadow-sm animate-pulse border border-gray-100">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                </div>
                {isGeneratingImage && <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">AI Drawing...</span>}
              </div>
            )}
          </div>
        )}
      </main>

      {isDataUsageModalOpen && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden p-6 space-y-6"
          >
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-500" />
                Data Optimization
              </h3>
              <button onClick={() => setIsDataUsageModalOpen(false)} className="text-gray-400"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Daily Usage</span>
                  <span className="text-2xl font-black text-emerald-600">{dataUsed.toFixed(1)}MB</span>
                </div>
                <div className="w-full bg-emerald-200/50 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[12%]" />
                </div>
                <p className="text-[10px] text-emerald-700 mt-2 italic">You're using 88% less data than standard educational apps.</p>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => { setIsDataSaver(true); playSuccessSound(); }}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${isDataSaver ? 'bg-emerald-50 border-emerald-500 ring-4 ring-emerald-50' : 'bg-white border-gray-100'}`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><Zap className="h-5 w-5" /></div>
                    <div>
                      <span className="block font-bold text-sm text-gray-800">Data Saver Mode</span>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase">Active • 2G/3G Optimized</span>
                    </div>
                  </div>
                  {isDataSaver && <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white"><Check className="h-4 w-4" /></div>}
                </button>

                <button 
                  onClick={() => { setIsDataSaver(false); playSuccessSound(); }}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${!isDataSaver ? 'bg-blue-50 border-blue-500 ring-4 ring-blue-50' : 'bg-white border-gray-100'}`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Wifi className="h-5 w-5" /></div>
                    <div>
                      <span className="block font-bold text-sm text-gray-800">Standard Mode</span>
                      <span className="text-[10px] text-blue-600 font-bold uppercase">4G/WiFi • High-Res Graphics</span>
                    </div>
                  </div>
                  {!isDataSaver && <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white"><Check className="h-4 w-4" /></div>}
                </button>
              </div>
            </div>

            <button onClick={() => setIsDataUsageModalOpen(false)} className="w-full bg-[#075e54] text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-transform">Save Preferences</button>
          </motion.div>
        </div>
      )}

      {sharingMessage && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden p-5 space-y-4"
          >
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Share2 className="h-5 w-5 text-emerald-600" />
              Share Lesson
            </h3>
            <button onClick={shareViaWhatsApp} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-100 active:scale-95 transition-transform">
              <span className="text-xl">💬</span> WhatsApp
            </button>
            <button onClick={shareViaSms} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-indigo-50 text-indigo-800 font-bold border border-indigo-100 active:scale-95 transition-transform">
              <span className="text-xl">📱</span> Share via SMS
            </button>
            <button onClick={() => setSharingMessage(null)} className="w-full py-3 text-gray-400 font-bold text-sm">Cancel</button>
          </motion.div>
        </div>
      )}

      {isAttachmentMenuOpen && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30 flex items-end justify-center p-4">
          <div className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center"><h3 className="font-bold text-gray-800">Learning Tools</h3><button onClick={() => { setIsAttachmentMenuOpen(false); setAttachmentMode('menu'); }} className="text-gray-400">✕</button></div>
            <div className="p-4 min-h-[220px]">
              {attachmentMode === 'menu' ? (
                <div className="grid grid-cols-3 gap-4 py-4">
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={() => { setAttachmentMode('note'); playSuccessSound(); }} className="w-14 h-14 rounded-full bg-amber-400 text-white shadow-lg flex items-center justify-center text-2xl active:scale-90 transition-transform">📌</button>
                    <span className="text-[10px] font-medium text-gray-600">Note</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={() => { setAttachmentMode('link'); playSuccessSound(); }} className="w-14 h-14 rounded-full bg-blue-500 text-white shadow-lg flex items-center justify-center text-2xl active:scale-90 transition-transform">🔗</button>
                    <span className="text-[10px] font-medium text-gray-600">Link</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={() => { setAttachmentMode('audio'); playSuccessSound(); }} className="w-14 h-14 rounded-full bg-orange-500 text-white shadow-lg flex items-center justify-center text-2xl active:scale-90 transition-transform">🎙️</button>
                    <span className="text-[10px] font-medium text-gray-600">Audio</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={() => { setAttachmentMode('image'); playSuccessSound(); }} className="w-14 h-14 rounded-full bg-purple-500 text-white shadow-lg flex items-center justify-center text-2xl active:scale-90 transition-transform">🖼️</button>
                    <span className="text-[10px] font-medium text-gray-600">Image</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={() => { setAttachmentMode('generate_image'); playSuccessSound(); }} className="w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center text-2xl active:scale-90 transition-transform">🎨</button>
                    <span className="text-[10px] font-medium text-gray-600">AI Graphic</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={() => { setIsAttachmentMenuOpen(false); playNavigationSound(); }} className="w-14 h-14 rounded-full bg-gray-200 text-gray-500 shadow-lg flex items-center justify-center text-2xl active:scale-90 transition-transform">✕</button>
                    <span className="text-[10px] font-medium text-gray-600">Close</span>
                  </div>
                </div>
              ) : attachmentMode === 'generate_image' ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <h4 className="font-bold text-indigo-800">AI Graphic Generator</h4>
                    <p className="text-[10px] text-gray-500 uppercase">Describe an educational image to create</p>
                  </div>
                  <input 
                    type="text" 
                    autoFocus 
                    value={imagePrompt} 
                    onChange={e => setImagePrompt(e.target.value)} 
                    placeholder="e.g. Parts of a flower diagram..." 
                    className="w-full p-3 bg-indigo-50/50 border-2 border-indigo-100 rounded-xl outline-none text-sm" 
                  />
                  <div className="bg-emerald-50 p-2 rounded-lg text-[10px] text-emerald-800 font-medium">✨ Optimized for low data. Graphics are simple and clear.</div>
                  <button 
                    onClick={handleAiImageGeneration} 
                    disabled={!imagePrompt.trim() || isGeneratingImage} 
                    className="w-full bg-indigo-500 text-white py-3 rounded-xl font-bold shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {isGeneratingImage ? 'Generating...' : 'Create & Attach Graphic'}
                  </button>
                  <button onClick={() => setAttachmentMode('menu')} className="w-full py-2 text-gray-400 text-sm">Back</button>
                </div>
              ) : attachmentMode === 'image' ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <h4 className="font-bold text-purple-800">Choose Quality</h4>
                    <p className="text-[10px] text-gray-500 uppercase">Save data or send high-res</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => { setImageQuality('low'); playNavigationSound(); }} className={`p-3 rounded-xl border-2 flex justify-between items-center ${imageQuality === 'low' ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-100' : 'bg-white border-gray-100'}`}><div><span className="block font-bold text-sm">Low Data</span><span className="text-[10px] text-emerald-600 font-bold">~20KB • Recommended</span></div>{imageQuality === 'low' && '✓'}</button>
                    <button onClick={() => { setImageQuality('high'); playNavigationSound(); }} className={`p-3 rounded-xl border-2 flex justify-between items-center ${imageQuality === 'high' ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-100' : 'bg-white border-gray-100'}`}><div><span className="block font-bold text-sm">High Quality</span><span className="text-[10px] text-indigo-600 font-bold">~150KB • Uses more data</span></div>{imageQuality === 'high' && '✓'}</button>
                  </div>
                  {imageQuality === 'high' && <div className="bg-amber-50 border border-amber-100 p-2 rounded-lg text-[10px] text-amber-800 font-medium">⚠️ Warning: Increased data usage on weak signals.</div>}
                  <button onClick={() => fileInputRef.current?.click()} className="w-full bg-purple-500 text-white py-3 rounded-xl font-bold shadow-md active:scale-95">Select & Send Image</button>
                  <button onClick={() => setAttachmentMode('menu')} className="w-full py-2 text-gray-400 text-sm">Back</button>
                </div>
              ) : attachmentMode === 'link' ? (
                <div className="space-y-4">
                  <input type="url" autoFocus value={linkInput} onChange={e => setLinkInput(e.target.value)} placeholder="https://..." className="w-full p-3 bg-blue-50/50 border-2 border-blue-100 rounded-xl outline-none text-sm" />
                  <button onClick={handleSendLink} disabled={!linkInput.trim()} className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold shadow-md active:scale-95 disabled:opacity-50">Share Resource</button>
                  <button onClick={() => setAttachmentMode('menu')} className="w-full py-2 text-gray-400 text-sm">Back</button>
                </div>
              ) : attachmentMode === 'audio' ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <button onPointerDown={startRecording} onPointerUp={stopRecording} onPointerLeave={stopRecording} className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-xl transition-all active:scale-90 ${isRecording ? 'bg-red-500' : 'bg-emerald-500 text-white'}`}>{isRecording ? '⏺️' : '🎙️'}</button>
                  <span className={`font-mono text-xl ${isRecording ? 'text-red-500 animate-pulse' : 'text-emerald-800'}`}>0:{recordingTime.toString().padStart(2, '0')}</span>
                  <button onClick={() => setAttachmentMode('menu')} className="text-xs text-gray-400">Back</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea autoFocus value={noteInput} onChange={e => setNoteInput(e.target.value)} placeholder="Type a study note..." className="w-full h-24 p-3 bg-amber-50/50 border-2 border-amber-100 rounded-xl outline-none text-sm" />
                  <button onClick={() => { addMessage(noteInput, MessageType.NOTE); setNoteInput(''); setAttachmentMode('menu'); setIsAttachmentMenuOpen(false); playSuccessSound(); }} disabled={!noteInput.trim()} className="w-full bg-amber-400 text-white py-3 rounded-xl font-bold shadow-md active:scale-95 disabled:opacity-50">Save Note</button>
                  <button onClick={() => setAttachmentMode('menu')} className="w-full py-2 text-gray-400 text-sm">Back</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {view === 'chat' && (
        <div className="p-3 bg-gray-50/90 backdrop-blur-sm border-t border-gray-200">
          <form onSubmit={e => { e.preventDefault(); handleUssdInput(input); }} className="flex gap-2">
            <div className="flex-1 bg-white rounded-full px-3 py-2 border border-gray-200 flex items-center gap-1.5">
              <button type="button" onClick={toggleListening} className={`p-1.5 rounded-full transition-all ${isListening ? 'bg-red-500 text-white' : 'text-gray-400'}`}>
                <Mic className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => { setIsAttachmentMenuOpen(true); playNavigationSound(); }} className="p-1.5 text-gray-400">
                <Paperclip className="h-5 w-5 rotate-45" />
              </button>
              <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder={isListening ? "Listening..." : "Type or *123#..."} className="flex-1 outline-none text-sm" />
            </div>
            <button type="submit" className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform">
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      )}
      <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
    </div>
  );
};

export default App;