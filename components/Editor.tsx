
import React, { useState, useEffect, useRef } from 'react';
import { useStory } from '../context/StoryContext';
import { ChapterRatingWidget } from './ChapterRatingWidget';

export const Editor: React.FC = () => {
  const { 
    story, 
    activeChapterId, 
    updateChapterContent, 
    updateChapterTitle,
    generatingChapterId,
    currentReasoning,
    updateStorySettings,
    closeStory
  } = useStory();

  const [isEditMode, setIsEditMode] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const activeChapter = story?.chapters.find(c => c.id === activeChapterId);
  const isGeneratingThisChapter = generatingChapterId === activeChapterId;

  useEffect(() => {
    if (activeChapter) {
        setHistory([activeChapter.content]);
        setHistoryPointer(0);
        if (debounceRef.current) clearTimeout(debounceRef.current);
    }
  }, [activeChapterId]);

  // Auto-scroll effect
  useEffect(() => {
      if (isGeneratingThisChapter && scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          // Tăng khoảng cách nhận diện "gần cuối" lên 1000px để không bị trượt khi text dài ra nhanh
          const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 1000;
          
          if (isNearBottom) {
              // Dùng auto thay vì smooth để tránh giật lag khi state update liên tục
              container.scrollTo({
                  top: container.scrollHeight,
                  behavior: 'auto'
              });
          }
      }
  }, [activeChapter?.content, isGeneratingThisChapter]);

  if (!activeChapter) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-700 bg-white dark:bg-[#09090b] h-full">
            <div className="text-8xl mb-4 opacity-20 animate-pulse">✎</div>
            <p className="font-bold text-lg">Chọn chương để bắt đầu</p>
        </div>
    );
  }

  const toggleNsfw = () => { if (story) updateStorySettings({ nsfw: !story.nsfw }); };

  const pushToHistory = (newContent: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyPointer + 1);
            newHistory.push(newContent);
            return newHistory;
        });
        setHistoryPointer(prev => prev + 1);
    }, 700);
  };

  const handleUndo = () => {
    if (historyPointer > 0) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const newPointer = historyPointer - 1;
        const content = history[newPointer];
        setHistoryPointer(newPointer);
        updateChapterContent(activeChapter.id, content);
    }
  };

  const handleRedo = () => {
    if (historyPointer < history.length - 1) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const newPointer = historyPointer + 1;
        const content = history[newPointer];
        setHistoryPointer(newPointer);
        updateChapterContent(activeChapter.id, content);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      updateChapterContent(activeChapter.id, val);
      pushToHistory(val);
  };

  const isHornyActive = story?.isHornyActive && story?.hornyStyle?.isAnalyzed;



  return (
    <div className="flex-1 flex flex-col relative bg-white dark:bg-[#09090b] h-full">
      
      {/* Modern Compact Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-100 dark:border-white/5 px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden flex-1 mr-2">
              <button 
                  onClick={closeStory} 
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300 hover:bg-zinc-200"
              >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>

              <div className="flex flex-col overflow-hidden">
                   <input 
                        type="text" 
                        value={activeChapter.title} 
                        onChange={e => updateChapterTitle(activeChapter.id, e.target.value)}
                        className={`bg-transparent text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none w-full ${!isEditMode && 'pointer-events-none'}`}
                        readOnly={!isEditMode}
                    />
                    <span className="text-[10px] text-zinc-400 font-mono leading-none">{activeChapter.content.length} từ</span>
              </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
             <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                 <button onClick={handleUndo} disabled={historyPointer <= 0} className="w-7 h-7 flex items-center justify-center rounded text-zinc-500 hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-30 transition-all">↩</button>
                 <button onClick={handleRedo} disabled={historyPointer >= history.length - 1} className="w-7 h-7 flex items-center justify-center rounded text-zinc-500 hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-30 transition-all">↪</button>
             </div>
             
             <button 
                onClick={toggleNsfw}
                className={`h-9 px-3 rounded-lg text-[10px] font-black transition-colors border ${
                    story?.nsfw 
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-200 dark:border-red-900' 
                    : 'bg-transparent text-zinc-400 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
             >
                18+
             </button>

             <button 
                onClick={() => setIsEditMode(!isEditMode)}
                className={`h-9 w-9 flex items-center justify-center rounded-lg transition-colors ${isEditMode ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
             >
                {isEditMode ? '✍️' : '👁️'}
             </button>
          </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 relative overflow-y-auto custom-scrollbar" ref={scrollContainerRef}>
        <div className="max-w-3xl mx-auto px-5 py-8 min-h-full pb-32 relative">
            
            {/* The underlying div for read-only mode */}
            {!isEditMode && (
                <div 
                    className="whitespace-pre-wrap p-0 border-none m-0 w-full break-words text-[1.05rem] leading-[1.8] font-serif text-zinc-800 dark:text-zinc-300"
                >
                    {activeChapter.content + '\n '}
                    {activeChapter.content.length > 50 && !isGeneratingThisChapter && (
                        <div className="mt-8 pb-12 pointer-events-auto">
                            <ChapterRatingWidget chapterId={activeChapter.id} />
                        </div>
                    )}
                </div>
            )}

            {isEditMode && (
                <div className="relative min-h-full">
                    {/* The hidden div stretches the container accurately for the textarea to match its height */}
                    <div 
                        className="whitespace-pre-wrap p-0 border-none m-0 w-full break-words text-[1.05rem] leading-[1.8] font-serif invisible pointer-events-none"
                        aria-hidden="true"
                    >
                        {activeChapter.content + '\n '}
                    </div>
                    <textarea
                        value={activeChapter.content}
                        onChange={handleContentChange}
                        placeholder="Bắt đầu câu chuyện của bạn..."
                        className="absolute inset-0 bg-transparent text-[1.05rem] leading-[1.8] font-serif text-zinc-800 dark:text-zinc-300 focus:outline-none resize-none overflow-hidden placeholder-zinc-300 dark:placeholder-zinc-700 p-0 border-none m-0 break-words"
                        spellCheck={false}
                        readOnly={isGeneratingThisChapter}
                    />
                </div>
            )}
        </div>
      </div>

      {isGeneratingThisChapter && (
         <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-3 z-20 w-full max-w-md px-4">
            {currentReasoning && (
                <div className="w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                            Thought Process
                        </span>
                    </div>
                    <div className="p-4 max-h-40 overflow-y-auto custom-scrollbar">
                        <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400 font-mono italic whitespace-pre-wrap">
                            {currentReasoning}
                        </p>
                    </div>
                </div>
            )}
            
            <div className="bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-white/20 dark:border-white/10 text-indigo-600 dark:text-indigo-400 px-6 py-3 rounded-full shadow-2xl flex flex-col items-center gap-1 animate-bounce-slight">
                <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider">AI đang viết...</span>
                </div>
                {isHornyActive && (
                    <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800">
                        🧬 Horny Mode Active
                    </span>
                )}
            </div>
         </div>
      )}
    </div>
  );
};
