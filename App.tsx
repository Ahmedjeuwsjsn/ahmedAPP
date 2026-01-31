
import React, { useState, useRef, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { analyzeFridgeImage, chatWithChef, generateSpeech } from './services/geminiService.ts';
import { playTtsAudio } from './services/audioService.ts';
import { AnalysisResponse, ChatMessage } from './types.ts';

const { 
  Camera, ChefHat, MessageSquare, BookOpen, Volume2, 
  Loader2, Send, Sparkles, Search, ChevronDown, 
  ChevronUp, Download 
} = Lucide;

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
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

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
    try {
      const botResponse = await chatWithChef(userMsg, []);
      setChatHistory(prev => [...prev, { role: 'model', text: botResponse || '' }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'model', text: "الشيف شوية انشغل، اعد المحاولة عيني." }]);
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
    { title: "دولمة بغدادية", desc: "سيدة المائدة العراقية، تمن ولحم ملفوف بصلق وبصل بتتبيلة حامضة." },
    { title: "سمك مسكوف", desc: "سمك الكطان المشوي على الحطب مع صلصة الطماطة والبصل والهيل." },
    { title: "برياني دجاج", desc: "أرز بسمتي مع الشعرية، البزاليا، اللوز، والبهارات السبعة." },
    { title: "قيمة نجفية", desc: "حمص ولحم غنم مهروس بعناية، تقدم مع تمن العنبر الفواح." }
  ];

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-orange-50/30 overflow-hidden shadow-2xl relative">
      <header className="bg-white px-5 py-4 border-b border-orange-100 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="bg-orange-600 p-1.5 rounded-lg text-white shadow-md">
            <ChefHat size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none">سفرة بغداد</h1>
            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mt-1">مطبخك الذكي</p>
          </div>
        </div>
        {showInstallBtn && (
          <button onClick={handleInstallClick} className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-full text-[10px] font-bold">
            <Download size={12} /> ثبت التطبيق
          </button>
        )}
      </header>

      <main className="flex-grow overflow-y-auto custom-scroll p-4 pb-24">
        {activeTab === 'scan' && (
          <div className="space-y-6">
            {showWelcome && (
              <div className="text-center py-10 space-y-6">
                <div className="relative inline-block">
                  <img src="https://cdn-icons-png.flaticon.com/512/1830/1830839.png" className="w-24 h-24 relative float-animation mx-auto" alt="Logo" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-gray-900">شكو ماكو بالمطبخ؟</h2>
                  <p className="text-gray-600">صور المواد اللي عندك وخلي الشيف العراقي يقترحلك أكلة معدلة.</p>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="w-full bg-orange-600 text-white font-bold py-5 rounded-2xl shadow-lg flex items-center justify-center gap-3 text-xl active:scale-95 transition-all"
                >
                  {loading ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                  <span>{loading ? "دا نحلل..." : "صور الثلاجة عيني"}</span>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>
            )}

            {analysis && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100">
                  <h3 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2">
                    <Search size={16} className="text-orange-500" /> لقينا هاي المواد:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.identifiedIngredients.map((ing, i) => (
                      <span key={i} className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-bold border border-orange-100">{ing}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {analysis.recipes.map((recipe, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-md border border-orange-50 overflow-hidden">
                      <button 
                        onClick={() => setExpandedRecipeIdx(expandedRecipeIdx === i ? null : i)}
                        className="w-full text-right p-4 flex justify-between items-center"
                      >
                        <h4 className="text-lg font-bold text-gray-900">{recipe.title}</h4>
                        <div className="text-orange-600">
                          {expandedRecipeIdx === i ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </button>
                      {expandedRecipeIdx === i && (
                        <div className="px-4 pb-4 space-y-4">
                          <button onClick={() => handleTts(recipe.instructions)} className="bg-orange-600 text-white flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold">
                            <Volume2 size={16} /> اسمع الوصفة
                          </button>
                          <div>
                            <p className="text-orange-600 font-bold text-xs mb-1">المكونات:</p>
                            <ul className="grid grid-cols-2 gap-1">
                              {recipe.ingredients.map((ing, j) => (
                                <li key={j} className="text-gray-700 text-sm flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full" /> {ing}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                            <p className="text-gray-800 leading-relaxed text-sm">{recipe.instructions}</p>
                          </div>
                          <div className="bg-yellow-50 p-3 rounded-xl flex gap-2 border border-yellow-100">
                            <Sparkles size={16} className="text-yellow-600 shrink-0" />
                            <p className="text-yellow-800 text-xs italic">{recipe.tips}</p>
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
          <div className="flex flex-col h-full space-y-4">
            <div className="flex-grow space-y-4 pb-20">
              {chatHistory.length === 0 && (
                <div className="text-center py-20">
                  <MessageSquare size={48} className="mx-auto text-orange-200 mb-4" />
                  <h3 className="text-xl font-bold text-gray-800">شيف بغداد بخدمتك</h3>
                  <p className="text-gray-500 text-sm">اسألني عن أي طبخة أو سر من أسرار المطبخ عيني.</p>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl ${
                    msg.role === 'user' ? 'bg-orange-600 text-white rounded-bl-none' : 'bg-white text-gray-800 rounded-tr-none border border-orange-100 shadow-sm'
                  }`}>
                    <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                    {msg.role === 'model' && (
                      <button onClick={() => handleTts(msg.text)} className="mt-2 text-orange-600 flex items-center gap-1 text-[10px] font-bold">
                        <Volume2 size={12} /> اسمع الرد
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="fixed bottom-20 left-4 right-4 max-w-2xl mx-auto flex gap-2 bg-white p-2 rounded-2xl shadow-xl border border-orange-100">
              <input 
                type="text" 
                value={inputMessage} 
                onChange={(e) => setInputMessage(e.target.value)} 
                placeholder="اسأل الشيف..." 
                className="flex-grow px-4 outline-none text-sm" 
              />
              <button type="submit" disabled={loading} className="bg-orange-600 text-white p-3 rounded-xl disabled:opacity-50">
                <Send size={20} />
              </button>
            </form>
          </div>
        )}

        {activeTab === 'discover' && (
          <div className="space-y-4">
            <h3 className="text-xl font-black text-gray-900">وصفاتنا التراثية</h3>
            <div className="grid gap-3">
              {featuredRecipes.map((r, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-orange-50 flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 font-black">{i+1}</div>
                  <div className="flex-grow">
                    <h4 className="font-bold text-gray-900">{r.title}</h4>
                    <p className="text-gray-500 text-xs">{r.desc}</p>
                  </div>
                  <button onClick={() => handleTts(r.desc)} className="text-orange-600 p-2"><Volume2 size={20} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <nav className="bg-white border-t border-orange-100 px-10 py-4 flex justify-between items-center fixed bottom-0 left-0 right-0 max-w-2xl mx-auto z-40">
        <button onClick={() => setActiveTab('scan')} className={`flex flex-col items-center gap-1 ${activeTab === 'scan' ? 'text-orange-600' : 'text-gray-400'}`}>
          <Camera size={22} /> <span className="text-[10px] font-bold">الماسح</span>
        </button>
        <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center gap-1 ${activeTab === 'chat' ? 'text-orange-600' : 'text-gray-400'}`}>
          <MessageSquare size={22} /> <span className="text-[10px] font-bold">الدردشة</span>
        </button>
        <button onClick={() => setActiveTab('discover')} className={`flex flex-col items-center gap-1 ${activeTab === 'discover' ? 'text-orange-600' : 'text-gray-400'}`}>
          <BookOpen size={22} /> <span className="text-[10px] font-bold">وصفاتنا</span>
        </button>
      </nav>

      {isTtsLoading && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white px-6 py-3 rounded-full flex items-center gap-3 z-50">
          <Loader2 size={16} className="animate-spin" /> <span className="text-sm font-bold">دا نجهز الصوت...</span>
        </div>
      )}
    </div>
  );
};

export default App;
