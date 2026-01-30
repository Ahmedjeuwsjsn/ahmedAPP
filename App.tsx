
import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  ChefHat, 
  MessageSquare, 
  BookOpen, 
  Volume2, 
  Loader2, 
  Send, 
  Sparkles,
  Search,
  ArrowRight,
  Utensils,
  Download,
  ChevronDown,
  ChevronUp,
  Clock,
  Award
} from 'lucide-react';
import { analyzeFridgeImage, chatWithChef, generateSpeech } from './services/geminiService';
import { playTtsAudio } from './services/audioService';
import { Recipe, AnalysisResponse, ChatMessage } from './types';

type Tab = 'scan' | 'chat' | 'discover';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('scan');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [expandedRecipeIdx, setExpandedRecipeIdx] = useState<number | null>(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    });
    window.addEventListener('appinstalled', () => {
      setShowInstallBtn(false);
      setDeferredPrompt(null);
    });
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages or loading state changes
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading, activeTab]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBtn(false);
    setDeferredPrompt(null);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setShowWelcome(false);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await analyzeFridgeImage(base64);
        setAnalysis(result);
        setExpandedRecipeIdx(0);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setLoading(false);
      alert("عذراً عيني، صار خلل بسيط. جرب مرة ثانية.");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;
    const userMsg = inputMessage;
    setInputMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const botResponse = await chatWithChef(userMsg, []);
      setChatHistory(prev => [...prev, { role: 'model', text: botResponse || '' }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'model', text: "الشيف شوية انشغل، اعد المحاولة عيني." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleTts = async (text: string) => {
    if (isTtsLoading) return;
    setIsTtsLoading(true);
    try {
      const audioBase64 = await generateSpeech(text);
      if (audioBase64) await playTtsAudio(audioBase64);
    } catch (error) {
      console.error("TTS Error:", error);
    } finally {
      setIsTtsLoading(false);
    }
  };

  const featuredRecipes = [
    { title: "دولمة بغدادية", time: "ساعة ونصف", level: "متوسط", desc: "سيدة المائدة، تمن ولحم ملفوف بصلق وبصل بتتبيلة حامضة وشكراً." },
    { title: "سمك مسكوف", time: "45 دقيقة", level: "محترف", desc: "سمك الكطان المشوي على الحطب مع صلصة الطماطة والبصل والهيل." },
    { title: "برياني دجاج", time: "ساعة", level: "سهل", desc: "أرز بسمتي مع الشعرية، البزاليا، اللوز، والبهارات السبعة الأصلية." },
    { title: "قيمة نجفية", time: "3 ساعات", level: "متوسط", desc: "حمص ولحم غنم مهروس بعناية، تقدم مع تمن العنبر الفواح." },
    { title: "كليجة عراقية", time: "ساعة", level: "متوسط", desc: "عطر العيد، محشوة بالتمر أو الجوز مع الهيل والسمسم المحمص." },
    { title: "بامية باللحم", time: "ساعة", level: "سهل", desc: "بامية عراقية صغيرة (قلم) مع لحم الغنم والدهن الحر." },
    { title: "مقلوبة عراقية", time: "ساعة", level: "متوسط", desc: "طبقات من الباذنجان والبطاطا والطماطة مع اللحم والتمن المبهر." },
    { title: "كبة حلب (رز)", time: "ساعة", level: "محترف", desc: "كبة مقرمشة مصنوعة من الرز والكركم، محشوة باللحم والكرفس." }
  ];

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-orange-50/30 overflow-hidden shadow-2xl relative">
      
      {/* Header */}
      <header className="bg-white px-5 py-3 border-b border-orange-100 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="bg-orange-600 p-1.5 rounded-lg text-white shadow-md">
            <ChefHat size={18} />
          </div>
          <div>
            <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">سفرة بغداد</h1>
            <p className="text-[8px] font-bold text-orange-600 uppercase tracking-widest mt-0.5">مطبخك العراقي الذكي</p>
          </div>
        </div>
        
        {showInstallBtn && (
          <button 
            onClick={handleInstallClick}
            className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm"
          >
            <Download size={10} />
            <span>ثبت APK</span>
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-grow overflow-y-auto custom-scroll p-4 pb-32">
        
        {activeTab === 'scan' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {showWelcome && !analysis && (
              <div className="text-center py-6 space-y-4">
                <div className="relative inline-block">
                  <div className="absolute -inset-1 bg-orange-400 rounded-full blur opacity-25 animate-pulse"></div>
                  <img src="https://cdn-icons-png.flaticon.com/512/1830/1830839.png" className="w-20 h-20 relative float-animation mx-auto" alt="Logo" />
                </div>
                <div className="space-y-1 px-4">
                  <h2 className="text-xl font-black text-gray-900">شكو ماكو بالمطبخ؟</h2>
                  <p className="text-gray-600 text-sm leading-relaxed">صور المواد اللي عندك وخلي الشيف العراقي يقترحلك أكلة معدلة.</p>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-3 text-lg active:scale-95 transition-transform"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={22} />}
                  <span>{loading ? "دا نحلل..." : "صور الثلاجة عيني"}</span>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 size={40} className="text-orange-600 animate-spin" />
                <p className="text-orange-800 font-bold text-lg text-center">دا نجهز الوصفات.. ثواني</p>
              </div>
            )}

            {analysis && (
              <div className="space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100">
                  <h3 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-1">
                    <Search size={14} className="text-orange-500" /> لقينا هاي المواد:
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.identifiedIngredients.map((ing, i) => (
                      <span key={i} className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-orange-100">{ing}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {analysis.recipes.map((recipe, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-md border border-white overflow-hidden transition-all">
                      <button 
                        onClick={() => setExpandedRecipeIdx(expandedRecipeIdx === i ? null : i)}
                        className="w-full text-right p-4 flex justify-between items-center"
                      >
                        <h4 className={`text-lg font-bold ${expandedRecipeIdx === i ? 'text-orange-700' : 'text-gray-900'}`}>{recipe.title}</h4>
                        <div className="bg-orange-50 p-1 rounded-full text-orange-600">
                          {expandedRecipeIdx === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </button>
                      
                      {expandedRecipeIdx === i && (
                        <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleTts(`${recipe.title}. المقادير: ${recipe.ingredients.join(', ')}. الطريقة: ${recipe.instructions}`); }}
                            className="bg-orange-600 text-white flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold shadow-md mb-3"
                          >
                            <Volume2 size={12} /> اسمع الوصفة
                          </button>
                          <div className="mb-3">
                            <h5 className="text-[10px] font-black text-orange-600 mb-1 uppercase tracking-wider">المقادير:</h5>
                            <ul className="space-y-0.5">
                              {recipe.ingredients.map((ing, j) => (
                                <li key={j} className="text-gray-700 text-sm flex items-center gap-1.5">
                                  <div className="w-1 h-1 bg-orange-400 rounded-full"></div> {ing}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="mb-3 p-3 bg-orange-50/50 rounded-xl border border-orange-100">
                            <h5 className="text-[10px] font-black text-orange-600 mb-0.5 uppercase tracking-wider">التحضير:</h5>
                            <p className="text-gray-800 text-base leading-relaxed">{recipe.instructions}</p>
                          </div>
                          <div className="bg-yellow-100/40 p-2.5 rounded-xl flex gap-1.5 items-start">
                            <Sparkles className="text-yellow-600 shrink-0 mt-0.5" size={14} />
                            <p className="text-yellow-900 text-xs font-medium">{recipe.tips}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex-grow space-y-4 mb-4">
              {chatHistory.length === 0 && (
                <div className="text-center py-8">
                  <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-orange-50">
                    <MessageSquare size={28} className="text-orange-500" />
                  </div>
                  <h3 className="text-lg font-black text-gray-800">شيف بغداد بخدمتك</h3>
                  <p className="text-gray-500 text-sm px-10">اسألني عن بهاراتنا أو أي طبخة ببالك عيني.</p>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] p-4 rounded-2xl shadow-sm ${
                    msg.role === 'user' ? 'bg-orange-600 text-white rounded-bl-none' : 'bg-white text-gray-800 rounded-tr-none border border-orange-100'
                  }`}>
                    <p className={`font-medium leading-relaxed ${msg.role === 'model' ? 'text-lg' : 'text-base'}`}>
                      {msg.text}
                    </p>
                    {msg.role === 'model' && (
                      <button onClick={() => handleTts(msg.text)} className="mt-3 bg-orange-50 text-orange-600 px-3 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-bold active:scale-95 transition-transform">
                        <Volume2 size={12} /> اسمع الرد
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-orange-100 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-orange-500" />
                    <span className="text-xs font-bold text-gray-500">دا أكتبلك...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} className="h-4" />
            </div>

            {/* Input area - fixed font visibility */}
            <form onSubmit={handleSendMessage} className="bg-white p-1.5 rounded-xl shadow-lg border border-orange-200 flex items-center gap-2 sticky bottom-2 mx-1 z-50">
              <input 
                type="text" 
                value={inputMessage} 
                onChange={(e) => setInputMessage(e.target.value)} 
                placeholder="اسألني أي شي عيني..." 
                className="flex-grow bg-white text-gray-900 px-4 py-2.5 outline-none rounded-lg text-base font-medium placeholder:text-gray-400" 
              />
              <button 
                type="submit" 
                disabled={loading || !inputMessage.trim()} 
                className="bg-orange-600 text-white p-2.5 rounded-lg shadow-md active:scale-90 transition-transform disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        )}

        {activeTab === 'discover' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="text-xl font-black text-gray-900 px-1">أكلاتنا التراثية</h3>
            <div className="grid grid-cols-1 gap-3">
              {featuredRecipes.map((recipe, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-orange-50 shadow-sm flex items-center gap-3 group">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 font-black shrink-0 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    {i + 1}
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-bold text-gray-900 text-base">{recipe.title}</h4>
                    <p className="text-gray-500 text-xs line-clamp-1">{recipe.desc}</p>
                  </div>
                  <button 
                    onClick={() => handleTts(`${recipe.title}. ${recipe.desc}`)}
                    className="bg-orange-100 text-orange-600 p-2 rounded-full active:scale-95 transition-transform"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="bg-orange-600 p-5 rounded-3xl text-white shadow-xl relative overflow-hidden mt-4">
               <ChefHat size={60} className="absolute -top-2 -right-2 opacity-10 rotate-12" />
               <h4 className="text-lg font-bold mb-1">أسرار الطبخ البغدادي؟</h4>
               <p className="text-orange-50 text-sm mb-3">اسأل الشيف بالدردشة عن أي شي ببالك.</p>
               <button onClick={() => setActiveTab('chat')} className="bg-white text-orange-600 px-5 py-1.5 rounded-lg font-black text-xs shadow-md">ابدأ الدردشة</button>
            </div>
          </div>
        )}
      </main>

      {/* Navigation Bar */}
      <nav className="bg-white/95 backdrop-blur-md border-t border-orange-100 px-8 py-3 flex justify-between items-center fixed bottom-0 left-0 right-0 max-w-2xl mx-auto z-40 shadow-lg">
        <button onClick={() => setActiveTab('scan')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'scan' ? 'text-orange-600 scale-110' : 'text-gray-400'}`}>
          <Camera size={20} fill={activeTab === 'scan' ? 'currentColor' : 'none'} strokeWidth={2.5} />
          <span className="text-[9px] font-black">الماسح</span>
        </button>
        <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'chat' ? 'text-orange-600 scale-110' : 'text-gray-400'}`}>
          <MessageSquare size={20} fill={activeTab === 'chat' ? 'currentColor' : 'none'} strokeWidth={2.5} />
          <span className="text-[9px] font-black">الدردشة</span>
        </button>
        <button onClick={() => setActiveTab('discover')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'discover' ? 'text-orange-600 scale-110' : 'text-gray-400'}`}>
          <BookOpen size={20} fill={activeTab === 'discover' ? 'currentColor' : 'none'} strokeWidth={2.5} />
          <span className="text-[9px] font-black">وصفاتنا</span>
        </button>
      </nav>

      {/* Audio Loading Overlay */}
      {isTtsLoading && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white px-4 py-2 rounded-full text-[10px] font-bold flex items-center gap-2 z-50 shadow-2xl animate-in fade-in zoom-in">
          <Loader2 size={12} className="animate-spin text-orange-400" />
          <span>دا نجهز الصوت..</span>
        </div>
      )}
    </div>
  );
};

export default App;
