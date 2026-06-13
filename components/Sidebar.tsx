
import React, { useState, useEffect, useRef } from 'react';
import { useStory } from '../context/StoryContext';
import { CharacterList } from './CharacterList';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
    onOpenSettings: () => void;
    isOpen: boolean;    
    onClose: () => void;
    initialTab?: 'chapters' | 'horny' | 'state';
}

export const Sidebar: React.FC<Props> = ({ onOpenSettings, isOpen, onClose, initialTab }) => {
  const { 
    story, activeChapterId, selectChapter, addChapter, addSubChapter, deleteChapter, characters, closeStory, generateContinue, generatingChapterId, 
    analyzeHornyText, toggleHorny, resetHorny, updateSegmentConfig, deleteMemory, clearLedger, updateHornyStyle, 
    autoGenerateBeats, summarizeSpecificChapter, updateStorySettings
  } = useStory();
  
  const isGenerating = generatingChapterId !== null;
  
  const [tab, setTab] = useState<'chapters' | 'horny' | 'state'>('chapters');
  
  // Local state
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [showBeatSuggest, setShowBeatSuggest] = useState(false);
  const [chapterSummary, setChapterSummary] = useState('');
  const [chapterSearch, setChapterSearch] = useState('');

  // Ref input file
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if (isOpen && initialTab) {
          setTab(initialTab);
      }
  }, [isOpen, initialTab]);

  if (!story) return null;

  // --- LOGIC UPLOAD CƠ BẢN NHẤT (MOBILE FRIENDLY) ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsReadingFile(true);
      const reader = new FileReader();

      reader.onload = async (event) => {
          const content = event.target?.result;
          if (typeof content === 'string') {
              if (content.trim().length === 0) {
                  console.error("File này không có nội dung (Rỗng).");
              } else {
                  await analyzeHornyText(content);
              }
          } else {
              console.error("Lỗi: Không đọc được nội dung văn bản từ file này.");
          }
          
          setIsReadingFile(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      };

      reader.onerror = () => {
          console.error("Trình duyệt không thể đọc file này. Vui lòng thử copy nội dung và dùng tính năng 'Paste Text'.");
          setIsReadingFile(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      };

      try {
        reader.readAsText(file);
      } catch (err) {
        console.error("Lỗi khởi tạo bộ đọc file.");
        setIsReadingFile(false);
      }
  };

  const handlePasteSubmit = async () => {
      if (pastedText.trim().length > 0) {
          setShowPasteModal(false);
          await analyzeHornyText(pastedText);
          setPastedText('');
      } else {
          console.error("Vui lòng nhập nội dung.");
      }
  };
  
  // --- Helpers giữ nguyên ---
  const handleBeatSuggest = async () => {
      if (chapterSummary.trim()) {
          setShowBeatSuggest(false);
          await autoGenerateBeats(chapterSummary);
          setChapterSummary('');
      } else {
          console.error("Vui lòng nhập tóm tắt ý tưởng chương.");
      }
  };

  const handleStartSegmentGeneration = () => {
      onClose(); 
      generateContinue(); 
  };

  const handleDeleteChapter = (e: React.MouseEvent, chapterId: string, chapterTitle: string) => {
      e.stopPropagation(); 
      if (window.confirm(`Xóa "${chapterTitle}"?`)) {
          deleteChapter(chapterId);
      }
  };

  // --- ROBUST BEAT MANAGEMENT (SYNC LENGTHS) ---
  const getSafeConfigs = () => {
      const beats = [...(story.segmentConfig?.beats || [])];
      let lengths = [...(story.segmentConfig?.beatLengths || [])];
      
      // Sync length array to match beats array
      while (lengths.length < beats.length) {
          lengths.push(0);
      }
      if (lengths.length > beats.length) {
          lengths = lengths.slice(0, beats.length);
      }

      return { beats, lengths };
  };

  const updateBeatAt = (index: number, val: string) => {
      if (!story.segmentConfig) return;
      const { beats, lengths } = getSafeConfigs();
      
      if (index >= 0 && index < beats.length) {
          beats[index] = val;
          updateSegmentConfig({ beats: beats, beatLengths: lengths }); 
      }
  };

  const updateBeatLengthAt = (index: number, val: string) => {
      if (!story.segmentConfig) return;
      const { beats, lengths } = getSafeConfigs();
      
      const len = parseInt(val);
      
      if (index >= 0 && index < lengths.length) {
          lengths[index] = isNaN(len) ? 0 : len;
          updateSegmentConfig({ beats: beats, beatLengths: lengths });
      }
  };

  const addBeat = (index: number) => {
      const { beats, lengths } = getSafeConfigs();
      
      if (beats.length === 0) {
          beats.push('');
          lengths.push(0);
      } else {
          beats.splice(index + 1, 0, ""); 
          lengths.splice(index + 1, 0, 0); 
      }
      
      updateSegmentConfig({ beats: beats, beatLengths: lengths });
  };

  const removeBeat = (index: number) => {
      const { beats, lengths } = getSafeConfigs();
      
      if (index >= 0 && index < beats.length) {
          beats.splice(index, 1);
          lengths.splice(index, 1);
          
          let newIdx = story.segmentConfig?.currentBeatIndex || 0;
          if (newIdx >= beats.length) newIdx = Math.max(0, beats.length - 1);
          
          updateSegmentConfig({ 
              beats: beats, 
              beatLengths: lengths, 
              currentBeatIndex: newIdx 
          });
      }
  };

  const setBeatIndex = (idx: number) => {
      updateSegmentConfig({ currentBeatIndex: idx });
  };

  const toggleAutoMode = () => {
      updateSegmentConfig({ autoMode: !story.segmentConfig?.autoMode });
  };

  const safeBeats = story.segmentConfig?.beats || [];
  const currentBeatIdx = story.segmentConfig?.currentBeatIndex || 0;
  const currentStrength = story.hornyStyle?.styleStrength || 100;
  const isAutoMode = story.segmentConfig?.autoMode || false;
  const displayLengths = story.segmentConfig?.beatLengths || [];

  const handleUpdateDna = (field: string, val: string | number) => {
      updateHornyStyle({ [field]: val });
  };

  return (
    <>
        <div className={`fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity duration-300 ease-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />

        {/* Modal Paste Text */}
        {showPasteModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-fadeIn">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Nhập văn bản mẫu (Horny DNA)</h3>
                    <textarea className="w-full h-48 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none dark:text-zinc-200" placeholder="Paste đoạn văn mẫu vào đây..." value={pastedText} onChange={e => setPastedText(e.target.value)} />
                    <div className="flex gap-3 mt-4 justify-end">
                        <button onClick={() => setShowPasteModal(false)} className="px-4 py-2 text-zinc-500 font-bold text-sm">Hủy</button>
                        <button onClick={handlePasteSubmit} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold">Phân tích</button>
                    </div>
                </div>
            </div>
        )}
        
        {/* Modal Beat Suggest */}
        {showBeatSuggest && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-fadeIn">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">✨ AI Lập Dàn Ý</h3>
                    <textarea className="w-full h-32 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none dark:text-zinc-200" placeholder="VD: Main đi vào chợ đen..." value={chapterSummary} onChange={e => setChapterSummary(e.target.value)} />
                    <div className="flex gap-3 mt-4 justify-end">
                        <button onClick={() => setShowBeatSuggest(false)} className="px-4 py-2 text-zinc-500 font-bold text-sm">Hủy</button>
                        <button onClick={handleBeatSuggest} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold">Tạo Beats</button>
                    </div>
                </div>
            </div>
        )}

        <div className={`fixed inset-x-0 bottom-0 z-50 w-full h-[88vh] bg-white dark:bg-[#121214] rounded-t-[2.5rem] shadow-[0_-10px_60px_rgba(0,0,0,0.3)] transform transition-all duration-400 ease-out flex flex-col border-t border-zinc-100 dark:border-white/5 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-[15%] opacity-0 pointer-events-none'}`}>
            
            <div className="w-full h-8 flex items-center justify-center cursor-pointer" onClick={onClose}>
                 <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
            </div>

            <div className="px-6 pb-4 flex items-center justify-between border-b border-zinc-100 dark:border-white/5">
                <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                    {tab === 'chapters' && 'Danh sách chương'}
                    {tab === 'horny' && 'HORNY & TOOLS'}
                </h2>
                <div className="flex gap-2">
                    <button onClick={onOpenSettings} className="w-10 h-10 flex items-center justify-center bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full text-zinc-600 dark:text-zinc-400 transition-colors">⚙️</button>
                    <button onClick={closeStory} className="w-10 h-10 flex items-center justify-center bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-full text-red-500 transition-colors">✕</button>
                </div>
            </div>

            <div className="flex px-6 py-5 gap-3 overflow-x-auto no-scrollbar flex-shrink-0">
                {[
                    { id: 'chapters', label: 'Chương', icon: '📖' },
                    { id: 'horny', label: 'Horny', icon: '😈' },
                    { id: 'state', label: 'State', icon: '🌍' },
                ].map((item) => (
                    <button key={item.id} onClick={() => setTab(item.id as any)} className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all duration-300 flex items-center gap-2 ${tab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 -translate-y-0.5' : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:-translate-y-0.5'}`}>
                        <span className={tab === item.id ? "scale-110 transition-transform duration-300" : "transition-transform duration-300"}>{item.icon}</span> {item.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-32">
                {/* --- HORNY TAB --- */}
                {tab === 'horny' && (
                    <div className="space-y-6">
                         <div className="bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-800 p-5 rounded-[1.5rem] border border-zinc-100 dark:border-white/5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase flex items-center gap-2">
                                    <span className="bg-indigo-600 text-white w-6 h-6 rounded flex items-center justify-center text-[10px]">DNA</span>
                                    Horny Style
                                </h3>
                                {story.hornyStyle?.isAnalyzed && (
                                    <button onClick={resetHorny} className="text-[10px] text-red-500 font-bold uppercase">Reset</button>
                                )}
                            </div>
                            
                            <div className="space-y-3">
                                {/* Input File ẩn - Mở rộng accept cho mobile */}
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileSelect} 
                                    className="hidden" 
                                    accept=".txt,.md,.json,text/*,application/json" 
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => !isGenerating && !isReadingFile && fileInputRef.current?.click()} 
                                        className={`py-3 bg-white dark:bg-zinc-700 border border-zinc-200 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center ${isGenerating || isReadingFile ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-50 dark:hover:bg-zinc-600 active:scale-95'}`}
                                        disabled={isGenerating || isReadingFile}
                                    >
                                        <span className="text-lg">📁</span>
                                        {isReadingFile ? 'Đang đọc...' : 'Tải File TXT'}
                                    </button>

                                    <button 
                                        onClick={() => !isGenerating && !isReadingFile && setShowPasteModal(true)} 
                                        className={`py-3 bg-white dark:bg-zinc-700 border border-zinc-200 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center ${isGenerating || isReadingFile ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-50 dark:hover:bg-zinc-600 active:scale-95'}`}
                                        disabled={isGenerating || isReadingFile}
                                    >
                                        <span className="text-lg">📋</span>
                                        Paste Text
                                    </button>
                                </div>
                                
                                {isGenerating && !story.hornyStyle?.isAnalyzed && (
                                    <div className="text-center py-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                                        <div className="text-xs text-indigo-600 dark:text-indigo-400 font-bold animate-pulse">
                                            🧬 Đang phân tích DNA Horny...
                                        </div>
                                    </div>
                                )}

                                {story.hornyStyle?.isAnalyzed && (
                                     <div className="mt-4 space-y-4 animate-fadeIn">
                                        <div onClick={() => toggleHorny(!story.isHornyActive)} className={`flex items-center justify-between p-4 rounded-xl cursor-pointer ${story.isHornyActive ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-zinc-100 dark:bg-black/20'}`}>
                                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Kích hoạt Horny Mode</span>
                                            <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${story.isHornyActive ? 'bg-indigo-600' : 'bg-zinc-300'}`}>
                                                <div className={`bg-white w-4 h-4 rounded-full shadow transform duration-300 ${story.isHornyActive ? 'translate-x-4' : ''}`}></div>
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-200 dark:border-white/5">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[9px] font-bold text-zinc-400 uppercase">Kết quả phân tích</span>
                                                <span className="text-[9px] font-bold text-indigo-500">{currentStrength}% Match</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 mb-4">
                                                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-[8px] font-bold rounded uppercase">{story.hornyStyle.narrativeVoice}</span>
                                                <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 text-[8px] font-bold rounded uppercase">{story.hornyStyle.pacing}</span>
                                            </div>
                                            <p className="text-[10px] text-zinc-500 italic mb-3 line-clamp-3">"{story.hornyStyle.description}"</p>
                                            <div>
                                                <input type="range" min="10" max="100" step="10" value={currentStrength} onChange={(e) => handleUpdateDna('styleStrength', parseInt(e.target.value))} className="w-full h-1 bg-zinc-100 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                                            </div>
                                        </div>
                                     </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-800 p-5 rounded-[1.5rem] border border-zinc-100 dark:border-white/5 shadow-sm">
                            <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase mb-4">Scenario Builder</h3>
                            <div onClick={() => updateSegmentConfig({ isActive: !story.segmentConfig?.isActive })} className="flex items-center justify-between p-4 bg-zinc-100 dark:bg-black/20 rounded-xl cursor-pointer mb-4">
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Chế độ Dàn ý (Beat)</span>
                                <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${story.segmentConfig?.isActive ? 'bg-red-600' : 'bg-zinc-300'}`}>
                                    <div className={`bg-white w-4 h-4 rounded-full shadow transform duration-300 ${story.segmentConfig?.isActive ? 'translate-x-4' : ''}`}></div>
                                </div>
                            </div>
                            
                            {story.segmentConfig?.isActive && (
                                <div className="space-y-4">
                                    <button onClick={() => setShowBeatSuggest(true)} className="w-full py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-xl border border-red-100 dark:border-red-900/30">✨ AI Gợi ý Dàn ý chương</button>
                                    
                                    <div className="flex items-center justify-between px-2">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Cấu trúc chương</span>
                                        <div onClick={toggleAutoMode} className="flex items-center gap-2 cursor-pointer">
                                            <span className={`text-[9px] font-bold uppercase transition-colors ${isAutoMode ? 'text-emerald-500' : 'text-zinc-400'}`}>Auto-Next</span>
                                            <div className={`w-6 h-3 rounded-full flex items-center transition-colors px-0.5 ${isAutoMode ? 'bg-emerald-500' : 'bg-zinc-300'}`}>
                                                <div className={`w-2.5 h-2.5 bg-white rounded-full shadow transition-transform ${isAutoMode ? 'translate-x-3' : ''}`} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {safeBeats.length === 0 && (
                                            <div className="text-center py-4 text-xs text-zinc-400 italic bg-zinc-50 dark:bg-black/10 rounded-xl">
                                                Chưa có dàn ý. Bấm "Thêm" hoặc dùng AI Suggest.
                                            </div>
                                        )}
                                        {safeBeats.map((beat, idx) => {
                                            const beatLength = displayLengths[idx] || 0;
                                            return (
                                                <div key={idx} className={`p-3 rounded-xl border transition-all ${currentBeatIdx === idx ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black/20'}`}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[8px] font-black uppercase ${currentBeatIdx === idx ? 'text-red-600' : 'text-zinc-400'}`}>Beat {idx + 1}</span>
                                                            {/* INPUT SỐ TỪ MỤC TIÊU */}
                                                            <input 
                                                                type="number"
                                                                placeholder="Số từ..."
                                                                value={beatLength || ''}
                                                                onChange={(e) => updateBeatLengthAt(idx, e.target.value)}
                                                                className="w-12 bg-transparent text-[8px] font-bold text-zinc-500 border-b border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-red-500 text-center"
                                                            />
                                                            <span className="text-[8px] text-zinc-400">từ</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => addBeat(idx)} className="text-[8px] text-blue-500 font-bold">CHÈN</button>
                                                            <button onClick={() => removeBeat(idx)} className="text-[8px] text-red-500 font-bold">XÓA</button>
                                                        </div>
                                                    </div>
                                                    <textarea className="w-full h-12 text-xs bg-transparent border-none focus:ring-0 resize-none text-zinc-700 dark:text-zinc-200 p-0" placeholder="Nội dung beat..." value={beat} onChange={e => updateBeatAt(idx, e.target.value)} onClick={() => setBeatIndex(idx)} />
                                                </div>
                                            );
                                        })}
                                        {safeBeats.length === 0 && (
                                            <button onClick={() => addBeat(-1)} className="w-full py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-bold rounded-xl border border-zinc-200 dark:border-zinc-700">
                                                + Thêm Beat đầu tiên
                                            </button>
                                        )}
                                    </div>
                                    {safeBeats.length > 0 && (
                                        <button onClick={handleStartSegmentGeneration} disabled={isGenerating} className="w-full py-4 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/30">
                                            {isAutoMode && currentBeatIdx < safeBeats.length - 1 ? `🚀 Chạy Auto từ Beat ${currentBeatIdx + 1}` : `🚀 Chạy Beat ${currentBeatIdx + 1}`}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {tab !== 'state' && tab !== 'horny' && tab !== 'chapters' && null}
                
                {tab === 'state' && (
                    <div className="space-y-4">
                        <div className="bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-800 p-5 rounded-[1.5rem] border border-zinc-100 dark:border-white/5 shadow-sm">
                             <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase mb-4 flex items-center gap-2">
                                 <span className="bg-indigo-600 text-white w-6 h-6 rounded flex items-center justify-center text-[10px]">✨</span>
                                 Scene Mood Placeholder
                             </h3>
                             <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg border border-zinc-200 dark:border-white/5 bg-black">
                                 <img 
                                     src="/src/assets/images/scene_mood_placeholder_1780028287364.png" 
                                     alt="Scene Mood Placeholder" 
                                     referrerPolicy="no-referrer"
                                     className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" 
                                 />
                             </div>
                             <p className="text-[10px] text-zinc-500 mt-3 text-center italic">
                                 Hình ảnh đại diện cho cảm xúc và bối cảnh của chương truyện hiện tại.
                             </p>
                        </div>
                    </div>
                )}
                 {/* --- OTHER TABS (Code cũ giữ nguyên) --- */}
                {tab === 'chapters' && (
                <div className="space-y-3">
                    {story.chapters.length > 0 && (
                        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 mb-4">
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Lịch Sử Độ Dài Chương (Tokens ước tính)</h3>
                            <div className="h-32 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={story.chapters
                                        .slice()
                                        .sort((a, b) => a.order - b.order)
                                        .map(ch => ({ name: ch.title, tokens: Math.round((ch.content?.length || 0) / 4) }))}>
                                        <defs>
                                            <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#e4e4e7' }}
                                            itemStyle={{ color: '#818cf8' }}
                                        />
                                        <Area type="monotone" dataKey="tokens" name="Tokens" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorTokens)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                    <div className="relative mb-4">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                            🔍
                        </span>
                        <input
                            type="text"
                            placeholder="Tìm kiếm chương (ví dụ: 1, 2, Tiêu đề...)"
                            className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-zinc-200"
                            value={chapterSearch}
                            onChange={(e) => setChapterSearch(e.target.value)}
                        />
                    </div>
                    {[...story.chapters]
                        .sort((a, b) => a.order - b.order)
                        .filter(ch => {
                            if (!chapterSearch.trim()) return true;
                            const searchLower = chapterSearch.toLowerCase();
                            return ch.title.toLowerCase().includes(searchLower) || String(ch.order).includes(searchLower);
                        })
                        .map(ch => {
                        const isSubChapter = ch.order % 1 !== 0;
                        return (
                        <div key={ch.id} className={`w-full ${isSubChapter ? 'pl-6' : ''}`}>
                             <div className={`flex items-start gap-2 rounded-2xl border transition-all ${activeChapterId === ch.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'bg-zinc-50 dark:bg-zinc-900/50 border-transparent text-zinc-500'}`}>
                             <div className="flex-1">
                                <button onClick={() => { selectChapter(ch.id); onClose(); }} className="w-full text-left px-5 py-4">
                                    <div className="flex justify-between items-center">
                                        <span className={`font-bold text-sm ${activeChapterId === ch.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-zinc-600 dark:text-zinc-400'}`}>{ch.title}</span>
                                    </div>
                                    <div className="text-[10px] text-zinc-400 mt-1 truncate">{ch.content.slice(0, 50)}...</div>
                                </button>
                             </div>
                             <div className="flex flex-col border-l border-zinc-100 dark:border-white/5">
                                <button onClick={(e) => { e.stopPropagation(); addSubChapter(ch.id); }} className="w-12 h-16 flex items-center justify-center text-zinc-400 hover:text-indigo-500 transition-colors" title="Thêm tuyến phụ">
                                    +
                                </button>
                                <button onClick={(e) => handleDeleteChapter(e, ch.id, ch.title)} className="w-12 h-10 flex items-center justify-center text-zinc-300 hover:text-red-500 transition-colors">🗑️</button>
                             </div>
                        </div>
                        </div>
                        );
                    })}
                    <button onClick={() => addChapter()} className="w-full py-5 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl mt-4 text-zinc-400 font-bold text-sm">+ Thêm Chương Mới</button>
                </div>
                )}

                {tab !== 'horny' && tab !== 'chapters' && null}
            </div>
        </div>
    </>
  );
};
