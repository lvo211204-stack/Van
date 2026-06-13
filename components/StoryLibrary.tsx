
import React, { useRef, useState } from 'react';
import { useStory } from '../context/StoryContext';
import { PRONOUN_STYLES, compilePronounStyle } from '../constants';
import { ApiSettingsModal } from './ApiSettingsModal';

export const StoryLibrary: React.FC<{ onCreateNew: (type: 'original' | 'fanfic') => void }> = ({ onCreateNew }) => {
    const { storiesList, openStory, deleteStory, exportStory, importStory, theme, toggleTheme } = useStory();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            importStory(e.target.files[0]);
        }
        e.target.value = '';
    };

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeletingId(id);
    };

    const handleConfirmDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await deleteStory(id);
        } catch (error) {
            console.error("Failed to delete story:", error);
        } finally {
            setDeletingId(null);
        }
    };

    const getPronounLabel = (styleString: string) => {
        if (!styleString) return null;
        const matched = PRONOUN_STYLES.find(s => 
            s.id !== 'custom' && compilePronounStyle(s.label, s.config) === styleString
        );
        if (matched) return matched.label.split('(')[0].trim();
        return "Custom";
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] font-sans transition-colors relative overflow-hidden">
             
             {/* Abstract Background Blobs */}
             <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-500/20 blur-[100px] pointer-events-none"></div>
             <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/20 blur-[100px] pointer-events-none"></div>

             {/* Header */}
             <div className="sticky top-0 z-20 px-6 py-6 flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-lg border-b border-white/20 dark:border-white/5">
                <div>
                    <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                        Aetheria
                    </h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">AI Story Architect</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsApiSettingsOpen(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur shadow-sm active:scale-90 transition-transform text-xl"
                    >
                        🔑
                    </button>
                    <button 
                        onClick={toggleTheme}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur shadow-sm active:scale-90 transition-transform"
                    >
                        {theme === 'light' ? '🌑' : '☀️'}
                    </button>
                </div>
             </div>

             <div className="p-4 pb-32 max-w-2xl mx-auto relative z-10">
                {storiesList.length === 0 ? (
                    <div className="text-center py-32 flex flex-col items-center animate-fadeIn">
                        <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-purple-100 dark:from-zinc-800 dark:to-zinc-900 rounded-[2rem] flex items-center justify-center shadow-inner mb-6 text-4xl animate-float">📚</div>
                        <h3 className="text-xl text-slate-800 dark:text-slate-100 font-bold mb-2">Chưa có truyện nào</h3>
                        <p className="text-sm text-slate-500 max-w-[200px] mx-auto leading-relaxed">Hãy chạm vào nút bên dưới để khởi tạo thế giới đầu tiên của bạn.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {storiesList.map(story => {
                            const pronounLabel = getPronounLabel(story.pronounStyle);
                            
                            return (
                                <div 
                                    key={story.id} 
                                    onClick={() => openStory(story.id)}
                                    className={`group relative overflow-hidden rounded-[1.5rem] p-5 transition-all cursor-pointer active:scale-[0.98]
                                        ${story.nsfw 
                                            ? 'bg-gradient-to-br from-red-50/80 to-white dark:from-red-900/10 dark:to-zinc-900/60 border border-red-200/50 dark:border-red-900/30' 
                                            : 'bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/50 dark:border-white/5 shadow-sm hover:shadow-lg dark:shadow-none'
                                        }
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full uppercase tracking-wide">
                                                {story.genre}
                                            </span>
                                            {story.nsfw && <span className="text-[10px] font-bold text-white bg-red-500 px-2.5 py-1 rounded-full shadow-sm shadow-red-500/30">18+</span>}
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); exportStory(story.id); }}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-green-600 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            </button>
                                            <button 
                                                onClick={deletingId === story.id ? (e) => handleConfirmDelete(story.id, e) : (e) => handleDeleteClick(story.id, e)}
                                                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                                                    deletingId === story.id 
                                                    ? 'bg-red-500 text-white w-20' 
                                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-red-500'
                                                }`}
                                            >
                                                {deletingId === story.id ? <span className="text-xs font-bold">Xóa?</span> : (
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 leading-tight">
                                        {story.title}
                                    </h3>
                                    
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4 font-light leading-relaxed">
                                        {story.synopsis}
                                    </p>
                                    
                                    <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-white/5">
                                        <div className="flex items-center gap-2">
                                            {story.fandom && (
                                                <span className="text-[9px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded uppercase">
                                                    {story.fandom}
                                                </span>
                                            )}
                                            {pronounLabel && <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 px-2 py-0.5 rounded">{pronounLabel}</span>}
                                        </div>
                                        <span className="text-[10px] text-zinc-400 font-mono bg-zinc-50 dark:bg-zinc-900 px-2 py-1 rounded">
                                            {new Date(story.chapters?.[0]?.lastUpdated || story.createdAt).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
             </div>

             {/* Floating Navigation Dock */}
             <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-30">
                <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/20 dark:border-white/10 p-2 rounded-[1.5rem] shadow-2xl flex gap-2">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".json,application/json" 
                        onChange={handleImport} 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3.5 rounded-[1rem] bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                    
                    <button 
                        onClick={() => onCreateNew('original')}
                        className="flex-1 rounded-[1rem] bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-primary-500/30 active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                        <span>✨ Tạo Truyện Mới</span>
                    </button>
                    
                    <button 
                        onClick={() => onCreateNew('fanfic')}
                        className="p-3.5 rounded-[1rem] bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 font-bold shadow-sm hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    >
                        <span className="text-lg leading-none">∞</span>
                    </button>
                </div>
             </div>
             <ApiSettingsModal isOpen={isApiSettingsOpen} onClose={() => setIsApiSettingsOpen(false)} />
        </div>
    );
};
