import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Headphones, 
  CheckCircle, 
  PenTool, 
  Clock, 
  AlertCircle,
  FileText,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  GraduationCap
} from 'lucide-react';
import { generateTOEFLMaterial, generateAudio } from './services/geminiService';
import { AudioPlayer } from './components/AudioPlayer';
import { AppState, ListeningType, TOEFLContent } from './types';

// Initial Topics
const TOPICS = [
  "Marine Biology",
  "Art History",
  "Anthropology",
  "Astronomy",
  "Campus Life - Housing",
  "Campus Life - Library",
  "Psychology",
  "Environmental Science"
];

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [selectedType, setSelectedType] = useState<ListeningType>(ListeningType.LECTURE);
  const [selectedTopic, setSelectedTopic] = useState<string>(TOPICS[0]);
  const [customTopic, setCustomTopic] = useState("");
  
  const [content, setContent] = useState<TOEFLContent | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>("");
  
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState("");
  const [showScript, setShowScript] = useState(false);
  const [score, setScore] = useState(0);

  // Generate content handler
  const handleStart = async () => {
    try {
      setAppState(AppState.GENERATING);
      const topicToUse = customTopic.trim() || selectedTopic;
      
      setLoadingStep("Drafting script and questions...");
      const generatedContent = await generateTOEFLMaterial(selectedType, topicToUse);
      setContent(generatedContent);

      setLoadingStep("Recording audio (this may take a moment)...");
      const audio = await generateAudio(generatedContent.script, selectedType);
      setAudioBase64(audio);

      // Reset session state
      setUserAnswers({});
      setNotes("");
      setShowScript(false);
      setScore(0);
      setAppState(AppState.LISTENING);
    } catch (error) {
      console.error(error);
      alert("Error generating content. Please try again.");
      setAppState(AppState.SETUP);
    }
  };

  const handleOptionSelect = (questionId: number, optionId: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const calculateScore = () => {
    if (!content) return;
    let correct = 0;
    content.questions.forEach(q => {
      if (userAnswers[q.id] === q.correctOptionId) correct++;
    });
    setScore(correct);
    setAppState(AppState.REVIEW);
  };

  // --- RENDERERS ---

  const renderSetup = () => (
    <div className="max-w-2xl mx-auto w-full px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-4 flex items-center justify-center gap-3">
          <GraduationCap className="text-blue-600 w-10 h-10" />
          TOEFL Listen Master
        </h1>
        <p className="text-slate-600 text-lg">Generate unlimited, realistic TOEFL listening practices powered by Gemini AI.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8 space-y-8">
          
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Listening Type</label>
            <div className="grid grid-cols-2 gap-4">
              {[ListeningType.CONVERSATION, ListeningType.LECTURE].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    selectedType === type
                      ? 'border-blue-600 bg-blue-50 text-blue-800'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  {type === ListeningType.CONVERSATION ? <PenTool className="w-6 h-6"/> : <BookOpen className="w-6 h-6"/>}
                  <span className="font-semibold">{type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Topic Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Topic</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {TOPICS.map(topic => (
                <button
                  key={topic}
                  onClick={() => { setSelectedTopic(topic); setCustomTopic(""); }}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    selectedTopic === topic && customTopic === ""
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
            <input 
              type="text" 
              placeholder="Or enter a custom topic (e.g., 'Quantum Physics')"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
            />
          </div>

          <button
            onClick={handleStart}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
          >
            Start Practice
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="mt-8 text-center text-slate-400 text-sm">
        <p>Uses Gemini 2.5 Flash for content & Gemini TTS for audio.</p>
      </div>
    </div>
  );

  const renderGenerating = () => (
    <div className="flex flex-col items-center justify-center h-96 gap-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Generating Material</h2>
        <p className="text-slate-500 animate-pulse">{loadingStep}</p>
      </div>
    </div>
  );

  const renderListening = () => (
    <div className="max-w-4xl mx-auto w-full px-4 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
      {/* Left Column: Audio & Instructions */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
           <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide">
                {selectedType}
              </span>
              <h2 className="text-xl font-bold text-slate-800 line-clamp-1">{content?.title}</h2>
           </div>
           
           <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 mb-6">
              <div className="flex items-center justify-center text-slate-400 mb-4">
                 <Headphones className="w-12 h-12 opacity-50" />
              </div>
              <AudioPlayer 
                base64Audio={audioBase64} 
                onEnded={() => {}} // Optional: Auto-advance to quiz
              />
              <p className="text-center text-xs text-slate-400 mt-4">
                Listen carefully. You can take notes on the right.
              </p>
           </div>

           <div className="flex justify-between items-center">
              <button 
                onClick={() => setShowScript(!showScript)}
                className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
              >
                {showScript ? "Hide Script" : "Show Script (Cheating!)"}
              </button>

              <button
                onClick={() => setAppState(AppState.QUIZ)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2"
              >
                Go to Questions
                <ChevronRight className="w-4 h-4" />
              </button>
           </div>

           {showScript && (
             <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm leading-relaxed text-slate-700 h-64 overflow-y-auto">
               {content?.script}
             </div>
           )}
        </div>
      </div>

      {/* Right Column: Note Taking */}
      <div className="flex flex-col h-full">
        <div className="bg-yellow-50 rounded-2xl shadow-sm border border-yellow-200 p-1 flex-1 flex flex-col relative">
          <div className="absolute top-0 left-0 right-0 h-8 bg-yellow-100/50 rounded-t-xl flex items-center px-4 border-b border-yellow-200">
             <span className="text-xs font-bold text-yellow-800 uppercase tracking-widest flex items-center gap-2">
               <PenTool className="w-3 h-3" /> Notes
             </span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Type your notes here..."
            className="w-full h-full pt-10 p-4 bg-transparent resize-none outline-none text-slate-800 font-mono text-sm leading-6"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );

  const renderQuiz = () => (
    <div className="max-w-3xl mx-auto w-full px-4 pb-24">
       <div className="flex items-center justify-between mb-8">
         <h2 className="text-2xl font-bold text-slate-800">Questions</h2>
         <div className="flex items-center gap-2 text-slate-500 text-sm">
           <Clock className="w-4 h-4" />
           <span>Take your time</span>
         </div>
       </div>

       <div className="space-y-12">
         {content?.questions.map((q, index) => (
           <div key={q.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 100}ms`}}>
              <div className="flex gap-4 mb-4">
                 <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-900 text-white rounded-full font-bold text-sm">
                   {index + 1}
                 </span>
                 <h3 className="text-lg font-medium text-slate-900 pt-1">{q.text}</h3>
              </div>
              
              <div className="pl-12 space-y-3">
                {q.options.map(opt => (
                  <label 
                    key={opt.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      userAnswers[q.id] === opt.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      checked={userAnswers[q.id] === opt.id}
                      onChange={() => handleOptionSelect(q.id, opt.id)}
                    />
                    <span className="text-slate-700">{opt.text}</span>
                  </label>
                ))}
              </div>
           </div>
         ))}
       </div>

       <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex justify-center gap-4 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => setAppState(AppState.LISTENING)}
            className="px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-lg shadow-sm transition-all flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Audio
          </button>

          <button
            onClick={calculateScore}
            disabled={Object.keys(userAnswers).length !== content?.questions.length}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex items-center gap-2"
          >
            Submit Answers
            <CheckCircle className="w-5 h-5" />
          </button>
       </div>
    </div>
  );

  const renderReview = () => {
     if (!content) return null;
     const percentage = Math.round((score / content.questions.length) * 100);
     
     return (
      <div className="max-w-4xl mx-auto w-full px-4 pb-20">
         <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-8 text-center">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Results</h2>
            <div className="flex items-center justify-center gap-4 mb-6">
               <div className="text-6xl font-black text-blue-600">
                 {score}<span className="text-3xl text-slate-400 font-normal">/{content.questions.length}</span>
               </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-4 mb-4 overflow-hidden">
               <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
            </div>
            <p className="text-slate-600">{percentage >= 80 ? "Excellent work!" : percentage >= 60 ? "Good job, keep practicing." : "Needs more practice."}</p>
         </div>

         <div className="space-y-8">
            {content.questions.map((q, index) => {
               const isCorrect = userAnswers[q.id] === q.correctOptionId;
               return (
                  <div key={q.id} className={`bg-white rounded-xl border-l-4 p-6 shadow-sm ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                     <div className="flex items-start justify-between mb-4">
                        <div className="flex gap-3">
                           <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold text-white ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                              {index + 1}
                           </span>
                           <h3 className="font-semibold text-slate-900">{q.text}</h3>
                        </div>
                        {isCorrect ? <CheckCircle className="text-green-500 w-5 h-5"/> : <AlertCircle className="text-red-500 w-5 h-5"/>}
                     </div>

                     <div className="pl-9 space-y-2 mb-4">
                        {q.options.map(opt => {
                           const isSelected = userAnswers[q.id] === opt.id;
                           const isKey = q.correctOptionId === opt.id;
                           let style = "text-slate-600 border-slate-100 bg-slate-50"; // Default
                           
                           if (isKey) style = "text-green-800 border-green-200 bg-green-50 font-medium";
                           else if (isSelected && !isKey) style = "text-red-800 border-red-200 bg-red-50 line-through decoration-red-400";

                           return (
                              <div key={opt.id} className={`p-3 rounded-lg border text-sm ${style}`}>
                                 {opt.id}. {opt.text}
                              </div>
                           );
                        })}
                     </div>

                     <div className="pl-9 bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                        <span className="font-bold">Explanation:</span> {q.explanation}
                     </div>
                  </div>
               );
            })}
         </div>

         <div className="flex justify-center mt-10 gap-4">
             <button 
                onClick={() => setAppState(AppState.SETUP)}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shadow-lg flex items-center gap-2"
             >
                <RefreshCw className="w-5 h-5" />
                Start New Practice
             </button>
             
             {/* Show transcript review option */}
             <button
                onClick={() => {
                   setAppState(AppState.LISTENING);
                   setShowScript(true);
                }}
                 className="px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold shadow-sm flex items-center gap-2"
             >
                <FileText className="w-5 h-5" />
                Review Transcript
             </button>
         </div>
      </div>
     );
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
           <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
               if(confirm("Return to home? Current progress will be lost.")) setAppState(AppState.SETUP);
           }}>
             <GraduationCap className="text-blue-600 w-6 h-6" />
             <span className="font-bold text-slate-900 text-lg">TOEFL Listen Master</span>
           </div>
           
           <div className="flex items-center gap-4">
              {appState !== AppState.SETUP && (
                <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">
                   {selectedType} • {selectedTopic}
                </div>
              )}
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8 bg-slate-50">
        {appState === AppState.SETUP && renderSetup()}
        {appState === AppState.GENERATING && renderGenerating()}
        {appState === AppState.LISTENING && renderListening()}
        {appState === AppState.QUIZ && renderQuiz()}
        {appState === AppState.REVIEW && renderReview()}
      </main>
    </div>
  );
}

export default App;