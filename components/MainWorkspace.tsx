import React, { useState } from 'react';
import { useStory } from '../context/StoryContext';
import { Sidebar } from './Sidebar';
import { Editor } from './Editor';
import { StorySettingsModal } from './StorySettingsModal';
import { ApiSettingsModal } from './ApiSettingsModal';
import { ChapterRecapModal } from './ChapterRecapModal';
import { CharacterStatus } from '../types';

import { toast } from 'react-hot-toast';

export const MainWorkspace: React.FC = () => {
    const { 
        story, 
        generateContinue, 
        stopGeneration, 
        isGenerating, 
        generatingChapterId, 
        activeChapterId, 
        tokenStats, 
        userInstruction, 
        setUserInstruction, 
        analyzeCurrentChapter, 
        commitChapterState, 
        updateStorySettings 
    } = useStory();
    
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarTab, setSidebarTab] = useState<'chapters' | 'knowledge' | 'state' | 'horny'>('chapters');
    
    // Default open on desktop, collapsible side-by-side design
    const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);
    const [povSelect, setPovSelect] = useState("");

    // Recap Modal State
    const [showRecapModal, setShowRecapModal] = useState(false);
    const [recapData, setRecapData] = useState<{ summary: string, charStatus: { [key: string]: CharacterStatus } } | null>(null);

    const handleGenerate = async () => {
        try {
            const currentInstruction = userInstruction;
            const success = await generateContinue(currentInstruction, povSelect || undefined);
            if (success) {
                setUserInstruction('');
            }
        } catch (e: any) {
            console.error("Error in handleGenerate:", e);
            toast.error(e?.message || "Đã xảy ra lỗi khi tạo nội dung.");
        }
    };

    const openMenu = (tab: 'chapters' | 'knowledge' | 'horny') => {
        setSidebarTab(tab);
        setIsSidebarOpen(true);
    };

    const handleOpenRecap = async () => {
        const data = await analyzeCurrentChapter();
        if (data) {
            setRecapData(data);
            setShowRecapModal(true);
        }
    };

    const handleSaveRecap = (summary: string, charStatus: { [key: string]: CharacterStatus }) => {
        commitChapterState(summary, charStatus);
        setShowRecapModal(false);
    };

    const isGeneratingActiveCurrent = generatingChapterId === activeChapterId;

    return (
        <div className="flex flex-col h-[100svh] overflow-hidden bg-white dark:bg-[#09090b] text-slate-900 dark:text-slate-100 relative">
            
            {/* Timeline Header (Floating Status) */}
            <div className="absolute top-16 left-0 right-0 z-20 pointer-events-none flex flex-col items-center gap-2">
                <div className="pointer-events-auto flex gap-2">
                    {story && story.chapters.length > 0 && (
                        <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-lg shadow-black/5 backdrop-blur-md border flex items-center gap-2 bg-white/80 dark:bg-zinc-800/80 border-white/20 dark:border-white/5">
                             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                             <span className="text-zinc-500 dark:text-zinc-400">Timeline:</span> <span className="text-emerald-600 dark:text-emerald-400">Stable</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Recap Modal */}
            {showRecapModal && recapData && story && (
                <ChapterRecapModal 
                    summary={recapData.summary} 
                    charStatus={recapData.charStatus} 
                    characters={story.characters}
                    onSave={handleSaveRecap} 
                    onCancel={() => setShowRecapModal(false)} 
                />
            )}

            {/* MAIN COMPACT SPLIT WORKSPACE: "Trực quan hoá 2 bên Viết và Nhắc" */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 w-full overflow-hidden relative">
                
                {/* BÊN TRÁI: KHUNG VIẾT - CHIẾM FLEX-1 */}
                <div className="flex-1 min-w-0 h-full overflow-hidden relative flex flex-col">
                    <Editor />
                </div>

                {/* BÊN PHẢI/DƯỚI: KHUNG NHẮC & KỊCH BẢN (DIRECTOR) */}
                {isAiPanelOpen && (
                    <div className="w-full lg:w-[405px] xl:w-[445px] border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-[#09090b]/40 h-[38dvh] lg:h-full flex-shrink-0 flex flex-col overflow-hidden relative transition-all duration-300">
                        {/* Header Panel */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800/50 flex-shrink-0">
                            <h3 className="text-xs font-black text-zinc-800 dark:text-zinc-100 flex items-center gap-2 uppercase tracking-wide">
                                <span className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white w-5 h-5 rounded-md flex items-center justify-center text-[10px] shadow-sm font-black">AI</span>
                                Cảnh Huấn & Sáng Tạo
                            </h3>
                            <button 
                                onClick={() => setIsAiPanelOpen(false)} 
                                className="text-[10px] text-zinc-450 hover:text-zinc-850 dark:hover:text-zinc-200 font-bold px-2 py-1 rounded hover:bg-zinc-250/20 dark:hover:bg-zinc-800/80 transition-all border border-transparent hover:border-zinc-300/20"
                            >
                                Thu gọn ✕
                            </button>
                        </div>

                        {/* Content Area (Scrollable internally) */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-0 pb-20">
                            
                            {/* AI Viết Tiếp Input Box */}
                            <div className="space-y-2 flex flex-col">
                                <label className="text-[10px] font-black text-indigo-500 uppercase tracking-wider pl-1 font-mono flex items-center gap-1.5 h-4">
                                    <span>✍️</span> AI Viết Tiếp (Chỉ thị lượt này)
                                </label>
                                <div className="bg-white dark:bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 focus-within:border-indigo-400 dark:focus-within:border-indigo-500/50 transition-all flex flex-col">
                                    <textarea 
                                        value={userInstruction} 
                                        onChange={(e) => setUserInstruction(e.target.value)} 
                                        className="w-full h-20 bg-transparent p-0 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none resize-none placeholder-zinc-400 border-none flex-1 custom-scrollbar leading-relaxed" 
                                        placeholder="Nhập ý tưởng/chỉ dẫn cho AI thế vào lượt viết này... (Ví dụ: Ayn rụt rè cúi đầu bái tổ, Luna ho nhẹ ra hiệu)" 
                                    />
                                </div>
                                
                                <button 
                                    onClick={handleGenerate} 
                                    disabled={isGeneratingActiveCurrent} 
                                    className={`w-full py-2.5 text-white font-bold rounded-xl shadow-md text-xs transition-transform flex items-center justify-center gap-1.5 whitespace-nowrap overflow-hidden active:scale-[0.98] ${isGeneratingActiveCurrent ? 'bg-indigo-400 opacity-70' : isGenerating ? 'bg-indigo-500 shadow-indigo-500/10 cursor-pointer' : 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-500/10 hover:brightness-105'}`}
                                >
                                    {isGeneratingActiveCurrent ? (
                                        <>
                                            <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full flex-shrink-0"></span>
                                            <span className="truncate">Đang sáng tác...</span>
                                        </>
                                    ) : isGenerating ? (
                                        <span className="truncate">⏳ Lượt trong Queue (Hàng chờ)...</span>
                                    ) : (
                                        <span className="truncate">🚀 Ra lệnh AI tự viết tiếp</span>
                                    )}
                                </button>
                            </div>

                            {/* Pinned/Fixed Player Reminders */}
                            <div className="space-y-2 flex flex-col">
                                <label className="text-[10px] font-black text-amber-500 uppercase tracking-wider pl-1 font-mono flex items-center gap-1.5 h-4">
                                     <span>🧠</span> Nhắc Nhở Cố Định (AI không bao giờ quên)
                                </label>
                                <div className="bg-white dark:bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 focus-within:border-amber-400 dark:focus-within:border-amber-500/50 transition-all flex flex-col">
                                    <textarea 
                                        value={story?.playerReminders || ''} 
                                        onChange={(e) => updateStorySettings({ playerReminders: e.target.value })} 
                                        className="w-full h-24 bg-transparent p-0 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none resize-none placeholder-zinc-400 border-none flex-1 custom-scrollbar leading-relaxed" 
                                        placeholder="Nhập luật viết, bối cảnh, xưng hô, chi tiết cố định mà AI cần nhớ suốt cốt truyện... (Ví dụ: Ayn bị cụt tay trái, Luna xưng hô Ta - Ngươi với Ayn...)" 
                                    />
                                </div>
                                
                                <button 
                                    onClick={handleOpenRecap}
                                    disabled={isGenerating}
                                    className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-colors border border-zinc-300/20 active:scale-[0.98]"
                                >
                                     <span className="text-xs">🛑</span>
                                     <span>Chốt hồi ức Chương & Đồng bộ</span>
                                </button>
                            </div>

                            {/* Token usage stats block */}
                            <div className="flex items-center justify-between px-2 pt-2 border-t border-zinc-200 dark:border-zinc-800/40">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Dung lượng trí nhớ:</span>
                                <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 rounded text-[10px] font-black text-indigo-500 dark:text-indigo-400 font-mono">
                                    {tokenStats.current} Tokens
                                </span>
                            </div>

                        </div>
                    </div>
                )}
            </div>

            {/* Floating Dock Navigation - Toggle AI Panel, Sidebars, and Settings */}
            <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-[400px] transition-all duration-300 ${isAiPanelOpen ? 'opacity-0 pointer-events-none translate-y-10 lg:opacity-100 lg:pointer-events-auto lg:translate-y-0' : 'opacity-100 pointer-events-auto translate-y-0'}`}>
                 <div className="flex items-center justify-between p-2 rounded-[2rem] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl shadow-black/20">
                    
                    {/* Actions Left */}
                    <div className="flex items-center gap-1 flex-1 justify-evenly">
                        <button onClick={() => openMenu('chapters')} className="w-11 h-11 flex flex-col items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-450 hover:text-indigo-500" title="Chương truyện">
                            <span className="text-lg">📖</span>
                        </button>
                        <button onClick={() => openMenu('knowledge')} className="w-11 h-11 flex flex-col items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-450 hover:text-purple-500" title="Bách khoa toàn thư">
                            <span className="text-lg">📚</span>
                        </button>
                    </div>

                    {/* Quick AI Toggle & Stop Generation Center Button */}
                    <div className="mx-2 relative -top-5 flex-shrink-0">
                        <button 
                            onClick={isGeneratingActiveCurrent ? stopGeneration : () => setIsAiPanelOpen(!isAiPanelOpen)}
                            className={`w-15 h-15 rounded-[1.3rem] flex items-center justify-center shadow-lg transform transition-all active:scale-95 border-4 border-white dark:border-zinc-900 ${isGeneratingActiveCurrent ? 'bg-red-500 text-white animate-pulse shadow-red-500/30' : isAiPanelOpen ? 'bg-indigo-600 text-white shadow-indigo-500/30' : 'bg-gradient-to-br from-indigo-500 via-purple-550 to-pink-500 text-white shadow-purple-500/20 hover:brightness-105'}`}
                        >
                            {isGeneratingActiveCurrent ? (
                                <span className="text-lg font-black">⏹</span>
                            ) : (
                                <span className={`text-2xl filter drop-shadow transition-transform duration-300 ${isAiPanelOpen ? 'scale-90 rotate-45' : 'scale-100'}`}>✨</span>
                            )}
                        </button>
                    </div>

                    {/* Actions Right */}
                    <div className="flex items-center gap-1 flex-1 justify-evenly">
                        <button onClick={() => openMenu('horny')} className="w-11 h-11 flex flex-col items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-450 hover:text-orange-500" title="Phong cách 18+">
                            <span className="text-lg">😈</span>
                        </button>
                        <button onClick={() => setIsApiSettingsOpen(true)} className="w-11 h-11 flex flex-col items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-450 hover:text-blue-500" title="API Key & Proxy">
                            <span className="text-lg">🔑</span>
                        </button>
                        <button onClick={() => setIsSettingsOpen(true)} className="w-11 h-11 flex flex-col items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-450 hover:text-zinc-800 dark:hover:text-zinc-100" title="Cài đặt">
                            <span className="text-lg">⚙️</span>
                        </button>
                    </div>

                 </div>
            </div>

            <Sidebar onOpenSettings={() => setIsSettingsOpen(true)} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} initialTab={sidebarTab} />
            <StorySettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <ApiSettingsModal isOpen={isApiSettingsOpen} onClose={() => setIsApiSettingsOpen(false)} />
        </div>
    );
};
