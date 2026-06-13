
import React, { useState } from 'react';
import { useStory } from '../context/StoryContext';
import { geminiService } from '../services/geminiService';
import { PRONOUN_STYLES, compilePronounStyle } from '../constants';

interface Props {
  mode: 'original' | 'fanfic';
  onCancel: () => void;
}

export const CreateWizard: React.FC<Props> = ({ mode, onCancel }) => {
  const { createStory } = useStory();
  const [isProcessing, setIsProcessing] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [storyElements, setStoryElements] = useState('');
  const [theme, setTheme] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [globalPlot, setGlobalPlot] = useState(''); // NEW: Dàn ý tổng thể
  
  // Fanfic specific
  const [fandom, setFandom] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [originalChars, setOriginalChars] = useState('');

  // Settings
  const [setting, setSetting] = useState('');
  const [writingStyle, setWritingStyle] = useState('');
  const [pov, setPov] = useState('Ngôi thứ 3 (Toàn tri)');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [nsfw, setNsfw] = useState(false);
  const [isDeepThinkActive, setIsDeepThinkActive] = useState(false);
  const [isGoogleSearchActive, setIsGoogleSearchActive] = useState(false);
  const [pronounStyleId, setPronounStyleId] = useState('custom');
  const [pronounStyleContent, setPronounStyleContent] = useState('');
  
  // AI Settings
  const [temperature, setTemperature] = useState(0.9);
  const [topP, setTopP] = useState(0.95);
  const [topK, setTopK] = useState(64);
  const [maxOutputTokens, setMaxOutputTokens] = useState(320000);
  const [thinkingLevel, setThinkingLevel] = useState<'HIGH'|'LOW'>('HIGH');

  // Memories
  const [characterInfo, setCharacterInfo] = useState('');
  const [worldInfo, setWorldInfo] = useState('');
  const [skillInfo, setSkillInfo] = useState('');

  // Horny DNA State
  const [isHornyActive, setIsHornyActive] = useState(false);
  const [hornyPacing, setHornyPacing] = useState('Hơi nhanh, dồn dập vào lúc cao trào');
  const [hornyNarrativeVoice, setHornyNarrativeVoice] = useState('Gợi cảm, sâu sắc, tập trung vào cảm xúc nội tâm nhân vật');
  const [hornyEmotionalTone, setHornyEmotionalTone] = useState('Ướt át, mê đắm, nồng nàn');
  const [hornyDescription, setHornyDescription] = useState('Mô tả chi tiết các tương tác thân mật, xúc cảm cơ thể và biến chuyển tâm lý tinh tế khi gần gũi.');
  const [hornyVocabularyComplexity, setHornyVocabularyComplexity] = useState('Kết hợp từ ngữ tinh tế, hoa mỹ, tả cảnh gợi hình gợi cảm cao.');
  const [hornyWritingSample, setHornyWritingSample] = useState('Nàng khẽ nâng mí mắt, hô hấp có chút dồn dập mà khẩn trương...');
  const [hornyStyleStrength, setHornyStyleStrength] = useState(100);

  // LED Border Configuration
  const [hornyAnalysisInput, setHornyAnalysisInput] = useState('');
  const [isAnalyzingHorny, setIsAnalyzingHorny] = useState(false);

  const handlePronounChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setPronounStyleId(id);
    if (id !== 'custom') {
        const s = PRONOUN_STYLES.find(x => x.id === id);
        if (s && s.config) {
            setPronounStyleContent(compilePronounStyle(s.label, s.config));
        }
    } 
  };

  const handleAnalyze = async () => {
    if (mode === 'fanfic' && !fandom) {
        console.error("Vui lòng nhập tên Fandom.");
        return;
    }
    setIsProcessing(true);
    try {
        if (mode === 'fanfic') {
            const result = await geminiService.analyzeFandom(
                fandom, 
                sourceUrl, 
                ["Tiên Hiệp", "Huyền Huyễn", "Đô Thị", "Đồng Nhân", "Khoa Huyễn", "Võng Du", "Sắc Hiệp"]
            );
            if (result) {
                if (result.genre) setGenre(result.genre);
                if (result.setting) setSetting(result.setting);
                if (result.writingStyle) setWritingStyle(result.writingStyle);
                if (result.pronouns) {
                    setPronounStyleContent(result.pronouns);
                    setPronounStyleId('custom');
                }
                if (result.originalCharacters) setOriginalChars(result.originalCharacters);
                if (!title) setTitle(`Đồng nhân ${fandom}: [Tên truyện]`);
            }
        }
    } catch (e) {
        console.error(e);
        console.error("Có lỗi khi phân tích. Vui lòng thử lại hoặc nhập thủ công.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleToggleHornyActive = (val: boolean) => {
    setIsHornyActive(val);
    if (val) {
      setNsfw(true);
    }
  };

  const handleAnalyzeHorny = async () => {
    if (!hornyAnalysisInput || hornyAnalysisInput.trim().length === 0) {
      console.error("Vui lòng nhập văn bản cần phân tích.");
      return;
    }
    setIsAnalyzingHorny(true);
    try {
      const result = await geminiService.analyzeHornyStyle(hornyAnalysisInput);
      if (result) {
        if (result.pacing) setHornyPacing(result.pacing);
        if (result.narrativeVoice) setHornyNarrativeVoice(result.narrativeVoice);
        if (result.emotionalTone) setHornyEmotionalTone(result.emotionalTone);
        if (result.description) setHornyDescription(result.description);
        if (result.vocabularyComplexity) setHornyVocabularyComplexity(result.vocabularyComplexity || '');
        if (result.writingSample) setHornyWritingSample(result.writingSample);
        if (result.styleStrength) setHornyStyleStrength(result.styleStrength);
      }
    } catch (err) {
      console.error("Phân tích lỗi:", err);
    } finally {
      setIsAnalyzingHorny(false);
    }
  };

  const handleSubmit = async () => {
      if (!title || !genre) {
          console.error("Vui lòng nhập Tiêu đề và Thể loại.");
          return;
      }
      setIsProcessing(true);
      try {
          let finalSetting = setting;
          if (originalChars) {
              const header = mode === 'fanfic' ? "NHÂN VẬT GỐC / CANON" : "DANH SÁCH NHÂN VẬT THẾ GIỚI GỐC";
              finalSetting += `\n\n[${header}]:\n${originalChars}`;
          }

        await createStory({
            title,
            genre,
            storyElements,
            theme,
            synopsis,
            globalPlot,
            setting: finalSetting,
            fandom: mode === 'fanfic' ? fandom : undefined,
            sourceUrl: mode === 'fanfic' ? sourceUrl : undefined,
            targetLength: 1000,
            writingStyle,
            pov,
            pronounStyle: pronounStyleContent,
            negativePrompt,
            nsfw,
            isDeepThinkActive,
            isGoogleSearchActive,
            temperature,
            topP,
            topK,
            maxOutputTokens,
            thinkingLevel,
            characterInfo,
            worldInfo,
            skillInfo,
            lore: [],
            items: [],
            isHornyActive,
            hornyStyle: isHornyActive ? {
              pacing: hornyPacing,
              narrativeVoice: hornyNarrativeVoice,
              emotionalTone: hornyEmotionalTone,
              description: hornyDescription,
              vocabularyComplexity: hornyVocabularyComplexity,
              writingSample: hornyWritingSample,
              styleStrength: hornyStyleStrength,
              isAnalyzed: true
            } : undefined
        });
      } catch (e) {
          console.error(e);
          console.error("Tạo truyện thất bại.");
      } finally {
          setIsProcessing(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-[#09090b] flex flex-col overflow-y-auto font-sans">
        {/* Header */}
        <div className="max-w-3xl mx-auto w-full p-6 flex justify-between items-center bg-white/80 dark:bg-[#09090b]/80 backdrop-blur sticky top-0 z-10">
            <div>
                <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                    {mode === 'fanfic' ? 'Khởi tạo Đồng Nhân' : 'Tạo Truyện Mới'}
                </h1>
            </div>
            <button onClick={onCancel} className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-3xl mx-auto w-full p-6 space-y-8 pb-32">
            
            {/* Step 1: Basic Info */}
            <section className="space-y-5 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="group">
                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Tiêu đề truyện</label>
                        <input 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border-b-2 border-zinc-200 dark:border-zinc-800 rounded-t-lg px-4 py-3 outline-none focus:border-indigo-500 dark:text-white transition-colors"
                            placeholder="Nhập tiêu đề..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Thể loại</label>
                        <input 
                            value={genre} 
                            onChange={e => setGenre(e.target.value)} 
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border-b-2 border-zinc-200 dark:border-zinc-800 rounded-t-lg px-4 py-3 outline-none focus:border-indigo-500 dark:text-white transition-colors"
                            placeholder="Tiên hiệp, Đô thị..."
                        />
                    </div>
                </div>

                 <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Yếu tố</label>
                    <input 
                        value={storyElements} 
                        onChange={e => setStoryElements(e.target.value)} 
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border-b-2 border-zinc-200 dark:border-zinc-800 rounded-t-lg px-4 py-3 outline-none focus:border-indigo-500 dark:text-white transition-colors"
                        placeholder="VD: Chiến đấu, đấu trí, chính trị..."
                    />
                </div>

                 <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Chủ đề</label>
                    <input 
                        value={theme} 
                        onChange={e => setTheme(e.target.value)} 
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border-b-2 border-zinc-200 dark:border-zinc-800 rounded-t-lg px-4 py-3 outline-none focus:border-indigo-500 dark:text-white transition-colors"
                        placeholder="Nhập chủ đề câu chuyện..."
                    />
                </div>

                {mode === 'fanfic' && (
                     <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/50 p-5 rounded-2xl space-y-4 shadow-sm">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-purple-600 dark:text-purple-400 uppercase mb-2">Tên Fandom</label>
                                <input 
                                    value={fandom} 
                                    onChange={e => setFandom(e.target.value)} 
                                    className="w-full bg-white dark:bg-zinc-800 border-2 border-transparent focus:border-purple-500 rounded-xl px-4 py-3 outline-none dark:text-white"
                                    placeholder="Naruto, Marvel..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Wiki URL (Tùy chọn)</label>
                                <input 
                                    value={sourceUrl} 
                                    onChange={e => setSourceUrl(e.target.value)} 
                                    className="w-full bg-white dark:bg-zinc-800 border-2 border-transparent focus:border-purple-500 rounded-xl px-4 py-3 outline-none dark:text-white"
                                    placeholder="https://..."
                                />
                            </div>
                         </div>
                         <button 
                            onClick={handleAnalyze}
                            disabled={isProcessing}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all flex justify-center items-center gap-2"
                        >
                            {isProcessing ? 'Đang phân tích...' : '🔮 Phân tích Fandom (Google AI)'}
                        </button>
                     </div>
                )}
                
                <div className="grid grid-cols-1 gap-5">
                    <div>
                         <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Tóm tắt (Synopsis) - Ngắn gọn</label>
                         <textarea 
                            value={synopsis} 
                            onChange={e => setSynopsis(e.target.value)} 
                            className="w-full h-24 bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent focus:border-indigo-500 rounded-xl px-4 py-3 outline-none resize-none dark:text-white"
                            placeholder="Giới thiệu chung về nội dung truyện..."
                         />
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-indigo-500 uppercase mb-2">Dàn ý tổng thể / Kế hoạch các chương</label>
                         <textarea 
                            value={globalPlot} 
                            onChange={e => setGlobalPlot(e.target.value)} 
                            className="w-full h-32 bg-indigo-50 dark:bg-indigo-900/10 border-2 border-indigo-100 dark:border-indigo-900/30 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none resize-none dark:text-white"
                            placeholder="VD: Chương 1: Main xuyên không, gặp hệ thống. Chương 2: Đánh quái đầu tiên. Chương 3: Gặp nữ chính..."
                         />
                         <p className="text-[10px] text-zinc-400 mt-1 italic">*Nhập kế hoạch chương tại đây để AI bám sát cốt truyện dài kỳ.</p>
                    </div>
                </div>
            </section>

            {/* Step 2: World & Style */}
            <section className="space-y-5 pt-6 border-t border-zinc-100 dark:border-zinc-800 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">Thiết lập Thế giới</h3>
                
                <div>
                    <label className={`block text-xs font-bold uppercase mb-2 ${mode === 'fanfic' ? 'text-purple-500' : 'text-indigo-500'}`}>
                        {mode === 'fanfic' ? 'Nhân vật Canon' : 'Nhân vật Quan trọng'}
                    </label>
                    <textarea 
                        value={originalChars} 
                        onChange={e => setOriginalChars(e.target.value)} 
                        className={`w-full h-32 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none border-2 border-transparent ${
                            mode === 'fanfic'
                            ? 'bg-purple-50 dark:bg-purple-900/20 focus:border-purple-500'
                            : 'bg-zinc-50 dark:bg-zinc-900 focus:border-indigo-500'
                        }`}
                    />
                </div>

                <div>
                     <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">World Bible (Bối cảnh)</label>
                     <textarea 
                        value={setting} 
                        onChange={e => setSetting(e.target.value)} 
                        className="w-full h-40 bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent focus:border-indigo-500 rounded-xl px-4 py-3 text-sm outline-none dark:text-white"
                     />
                </div>

                <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                     <label className="block text-xs font-bold text-indigo-500 uppercase mb-2">Văn phong (Writing Style)</label>
                     <input 
                         value={writingStyle} 
                         onChange={e => setWritingStyle(e.target.value)} 
                         className="w-full bg-indigo-50 dark:bg-indigo-900/10 border-2 border-indigo-100 dark:border-indigo-900/30 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none dark:text-white transition-colors"
                         placeholder="VD: Cổ trang trầm mặc, hài hước, dồn dập, ngôn tình mượt mà..."
                     />
                     <p className="text-[10px] text-zinc-400 mt-1 italic">*AI sẽ cố gắng viết theo phong cách này.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Góc nhìn (POV)</label>
                        <select 
                            value={pov} 
                            onChange={e => setPov(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border-r-[12px] border-transparent rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white appearance-none"
                        >
                            <option value="Ngôi thứ 3 (Toàn tri)">Ngôi thứ 3 (Toàn tri)</option>
                            <option value="Ngôi thứ 3 (Giới hạn)">Ngôi thứ 3 (Giới hạn)</option>
                            <option value="Ngôi thứ 1 (Tôi/Ta)">Ngôi thứ 1 (Tôi/Ta)</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Style Xưng hô</label>
                        <select 
                            value={pronounStyleId} 
                            onChange={handlePronounChange}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border-r-[12px] border-transparent rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white appearance-none"
                        >
                             {PRONOUN_STYLES.map(s => (
                                 <option key={s.id} value={s.id}>{s.label}</option>
                             ))}
                        </select>
                     </div>
                </div>

                {pronounStyleId === 'custom' && (
                    <div>
                        <textarea 
                            value={pronounStyleContent} 
                            onChange={e => setPronounStyleContent(e.target.value)} 
                            className="w-full h-24 bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent focus:border-indigo-500 rounded-xl px-4 py-3 text-sm outline-none dark:text-white"
                            placeholder="Nhập quy tắc xưng hô tùy chỉnh..."
                        />
                    </div>
                )}
            </section>

             {/* Step 3: Restrictions */}
             <section className="space-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-800 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                <div>
                     <label className="block text-xs font-bold text-red-500 uppercase mb-2">Điều cấm kỵ (Negative Prompt)</label>
                     <textarea 
                        value={negativePrompt} 
                        onChange={e => setNegativePrompt(e.target.value)} 
                        className="w-full h-16 bg-white dark:bg-zinc-900 border border-red-100 dark:border-red-900/50 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-500 dark:text-white"
                     />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/10 p-4 rounded-xl">
                        <input 
                            type="checkbox" 
                            id="nsfw-check" 
                            checked={nsfw} 
                            onChange={e => setNsfw(e.target.checked)}
                            className="w-5 h-5 rounded border-zinc-300 text-red-600 focus:ring-red-500 accent-red-600"
                        />
                        <label htmlFor="nsfw-check" className="text-sm font-bold text-zinc-700 dark:text-zinc-300 select-none">Bật chế độ NSFW (18+)</label>
                    </div>
                    <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100/30">
                        <input 
                            type="checkbox" 
                            id="horny-check" 
                            checked={isHornyActive} 
                            onChange={e => handleToggleHornyActive(e.target.checked)}
                            className="w-5 h-5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                        />
                        <label htmlFor="horny-check" className="text-sm font-bold text-indigo-700 dark:text-indigo-400 select-none">😈 Sử dụng Horny DNA (Tự động)</label>
                    </div>
                    <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl">
                        <input 
                            type="checkbox" 
                            id="deepthink-check" 
                            checked={isDeepThinkActive} 
                            onChange={e => setIsDeepThinkActive(e.target.checked)}
                            className="w-5 h-5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                        />
                        <label htmlFor="deepthink-check" className="text-sm font-bold text-emerald-700 dark:text-emerald-400 select-none">✨ Nghĩ sâu (Deep Think)</label>
                    </div>
                    <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl">
                        <input 
                            type="checkbox" 
                            id="googlesearch-check" 
                            checked={isGoogleSearchActive} 
                            onChange={e => setIsGoogleSearchActive(e.target.checked)}
                            className="w-5 h-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                        />
                        <label htmlFor="googlesearch-check" className="text-sm font-bold text-blue-700 dark:text-blue-400 select-none">🌐 Tra Google</label>
                    </div>
                </div>

                {/* Clean container for Horny DNA */}
                {isHornyActive && (
                    <div className="bg-white dark:bg-[#121214] border border-indigo-100 dark:border-indigo-900/40 rounded-3xl p-6 shadow-2xl shadow-indigo-500/5 mt-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🧬</span>
                                <div>
                                    <h4 className="text-sm font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">Cấu hình Horny DNA</h4>
                                    <p className="text-[10px] text-zinc-400 italic">Phong cách viết đồng bộ 18+ đã được tối ưu hóa</p>
                                </div>
                            </div>
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-350 text-[10px] font-bold rounded-lg uppercase">
                                Chế độ hâm nóng
                            </span>
                        </div>

                        {/* B. DNA AI Analyzer */}
                        <div className="space-y-3 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <div className="flex flex-col">
                                <h5 className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1">Công cụ Trích xuất / Phân tích DNA</h5>
                                    <p className="text-[10px] text-zinc-400">Dán đoạn văn mẫu hâm nóng của truyện để AI tự tách tự động nhịp điệu, tông kể truyền cảm xúc</p>
                                </div>
                                
                                <textarea
                                    value={hornyAnalysisInput}
                                    onChange={e => setHornyAnalysisInput(e.target.value)}
                                    className="w-full h-24 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 text-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs dark:text-white"
                                    placeholder="Dán đoạn văn mẫu 18+ vào đây để trích xuất DNA..."
                                />
                                
                                <button
                                    type="button"
                                    onClick={handleAnalyzeHorny}
                                    disabled={isAnalyzingHorny}
                                    className="w-full py-2.5 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-505 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-lg shadow-pink-500/15 transition-all flex items-center justify-center gap-1.5"
                                >
                                    {isAnalyzingHorny ? (
                                        <>
                                            <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                            Đang phân tích DNA viết...
                                        </>
                                    ) : (
                                        <>🔮 Phân tích Trích xuất DNA (Bằng AI)</>
                                    )}
                                </button>
                            </div>

                            {/* C. DNA attributes overrides */}
                            <div className="space-y-4">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block border-b border-zinc-100 dark:border-zinc-800 pb-1">Xem hoặc chỉnh sửa thủ công DNA</span>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1.5">Nhịp điệu kể (Pacing)</label>
                                        <input 
                                            value={hornyPacing} 
                                            onChange={e => setHornyPacing(e.target.value)} 
                                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-indigo-500 dark:text-white transition-colors"
                                            placeholder="VD: Dồn dập khi cao trào"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1.5">Giọng văn (Narrative Voice)</label>
                                        <input 
                                            value={hornyNarrativeVoice} 
                                            onChange={e => setHornyNarrativeVoice(e.target.value)} 
                                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-indigo-500 dark:text-white transition-colors"
                                            placeholder="VD: Gợi cảm, tinh tế"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1.5">Tone Cảm xúc (Emotional Tone)</label>
                                        <input 
                                            value={hornyEmotionalTone} 
                                            onChange={e => setHornyEmotionalTone(e.target.value)} 
                                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-indigo-500 dark:text-white transition-colors"
                                            placeholder="VD: Mê đắm, nồng nàn"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1.5">Từ vựng (Vocabulary style)</label>
                                        <input 
                                            value={hornyVocabularyComplexity} 
                                            onChange={e => setHornyVocabularyComplexity(e.target.value)} 
                                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-indigo-500 dark:text-white transition-colors"
                                            placeholder="VD: Từ ngữ hoa mỹ, chọn lọc"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1.5">Mô tả đặc trưng phong cách (Description)</label>
                                    <textarea 
                                        value={hornyDescription} 
                                        onChange={e => setHornyDescription(e.target.value)} 
                                        className="w-full h-16 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3.5 py-2 text-xs outline-none resize-none focus:border-indigo-500 dark:text-white transition-colors"
                                        placeholder="Mô tả ngắn gọn về đặc trưng phong cách..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1.5">Mẫu văn bản tiêu biểu nhất (Writing Sample)</label>
                                    <textarea 
                                        value={hornyWritingSample} 
                                        onChange={e => setHornyWritingSample(e.target.value)} 
                                        className="w-full h-24 bg-zinc-50 dark:bg-zinc-900 border border-zinc-205 dark:border-zinc-850 rounded-xl px-3.5 py-2 text-xs outline-none resize-none focus:border-indigo-500 dark:text-white transition-colors"
                                        placeholder="Trích dẫn văn mẫu tiêu biểu..."
                                    />
                                </div>
                            </div>
                    </div>
                )}
             </section>
        </div>

        {/* Footer */}
        <div className="fixed bottom-0 left-0 w-full bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md border-t border-zinc-100 dark:border-zinc-800 p-4 flex gap-4 z-10">
             <button onClick={onCancel} className="px-6 py-3 text-zinc-500 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">Hủy</button>
             <button 
                onClick={handleSubmit}
                disabled={isProcessing}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                {isProcessing ? 'Đang khởi tạo...' : 'Hoàn tất & Bắt đầu'}
             </button>
        </div>
    </div>
  );
};
