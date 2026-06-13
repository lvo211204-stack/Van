
import React, { useState, useEffect } from 'react';
import { useStory } from '../context/StoryContext';
import { PRONOUN_STYLES, compilePronounStyle } from '../constants';
import { motion } from 'motion/react';
import { Settings, X, Save, Zap, AlertTriangle, Shield, ShieldOff, BrainCircuit, Globe } from 'lucide-react';

export const StorySettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { story, updateStorySettings } = useStory();
    const [formData, setFormData] = useState({
        title: '', 
        genre: '', 
        theme: '',
        storyElements: '',
        fandom: '', 
        sourceUrl: '',
        targetLength: 1000,
        writingStyle: '', 
        pov: '', 
        pronounStyle: '', 
        setting: '', 
        negativePrompt: '', 
        nsfw: false,
        isDeepThinkActive: false,
        isGoogleSearchActive: false,
        autoNewChapter: false,
        temperature: 0.7,
        maxOutputTokens: 320000,
        topP: 0.95,
        topK: 64,
        thinkingLevel: 'HIGH' as 'HIGH'|'LOW',
        characterInfo: '',
        worldInfo: '',
        skillInfo: '',
        globalPlot: '',
        playerReminders: ''
    });
    
    const [pronounStyleId, setPronounStyleId] = useState<string>('custom');

    useEffect(() => {
        if (story && isOpen) {
            setFormData({
                title: story.title,
                genre: story.genre,
                theme: story.theme || (story as any).subGenre || '',
                storyElements: story.storyElements || (story as any).locationElements || '',
                fandom: story.fandom || '',
                sourceUrl: story.sourceUrl || '',
                targetLength: typeof story.targetLength === 'number' ? story.targetLength : 1000,
                writingStyle: story.writingStyle || '',
                pov: story.pov || '',
                pronounStyle: story.pronounStyle || '',
                setting: story.setting || '',
                negativePrompt: story.negativePrompt || '',
                nsfw: story.nsfw || false,
                isDeepThinkActive: story.isDeepThinkActive || false,
                isGoogleSearchActive: story.isGoogleSearchActive || false,
                autoNewChapter: story.autoNewChapter || false,
                temperature: story.temperature !== undefined ? story.temperature : 0.7,
                maxOutputTokens: story.maxOutputTokens !== undefined ? story.maxOutputTokens : 320000,
                topP: story.topP !== undefined ? story.topP : 0.95,
                topK: story.topK !== undefined ? story.topK : 64,
                thinkingLevel: story.thinkingLevel || 'HIGH',
                characterInfo: story.characterInfo || '',
                worldInfo: story.worldInfo || '',
                skillInfo: story.skillInfo || '',
                globalPlot: story.globalPlot || '',
                playerReminders: story.playerReminders || ''
            });

            const matchedStyle = PRONOUN_STYLES.find(s => {
                if (s.id === 'custom') return false;
                const compiled = compilePronounStyle(s.label, s.config).trim();
                const current = (story.pronounStyle || '').trim();
                return compiled === current;
            });

            if (matchedStyle) {
                setPronounStyleId(matchedStyle.id);
            } else {
                setPronounStyleId('custom');
            }
        }
    }, [story, isOpen]);

    const handlePronounIdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setPronounStyleId(id);
        
        if (id !== 'custom') {
            const style = PRONOUN_STYLES.find(s => s.id === id);
            if (style && style.config) {
                const compiledPrompt = compilePronounStyle(style.label, style.config);
                setFormData(prev => ({ ...prev, pronounStyle: compiledPrompt }));
            }
        } 
    };

    if (!isOpen || !story) return null;

    const handleSave = async () => {
        await updateStorySettings(formData);
        onClose();
    };

    const getSystemPreview = () => {
        const parts = [];
        if (formData.fandom) parts.push(`[CHẾ ĐỘ FANFIC]: ${formData.fandom.toUpperCase()}`);
        parts.push(`📝 ĐỘ DÀI: ~${formData.targetLength} từ.`);
        parts.push(formData.nsfw ? "🔞 NSFW: BẬT" : "🛡️ NSFW: TẮT");
        parts.push("\n" + formData.pronounStyle);
        return parts.join('\n');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
                <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 flex justify-between items-center">
                    <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-indigo-500" />
                        Cài đặt Câu chuyện
                    </h2>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar bg-white dark:bg-zinc-950">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Tiêu đề</label>
                            <input className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Thể loại</label>
                            <input className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all" value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Yếu tố</label>
                            <input className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all" value={formData.storyElements} onChange={e => setFormData({...formData, storyElements: e.target.value})} placeholder="VD: Chiến đấu, đấu trí..." />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Chủ đề</label>
                            <input className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all" value={formData.theme} onChange={e => setFormData({...formData, theme: e.target.value})} placeholder="Nhập chủ đề..." />
                        </div>
                    </div>
                    
                    <div className="bg-zinc-50/50 dark:bg-zinc-900/30 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 space-y-5">
                        <div className="grid grid-cols-2 gap-5">
                             <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Fandom</label>
                                <input className="w-full bg-white dark:bg-zinc-950 border border-purple-200 dark:border-purple-900/40 rounded-xl px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-sm transition-all" value={formData.fandom} onChange={e => setFormData({...formData, fandom: e.target.value})} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Link Wiki</label>
                                <input className="w-full bg-white dark:bg-zinc-950 border border-indigo-200 dark:border-indigo-900/40 rounded-xl px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all" value={formData.sourceUrl} onChange={e => setFormData({...formData, sourceUrl: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="flex justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
                                <span>Độ dài mục tiêu</span>
                                <span className="text-indigo-600 dark:text-indigo-400">{formData.targetLength} từ</span>
                            </label>
                            <input 
                                type="range" 
                                min="500" 
                                max="10000" 
                                step="500" 
                                value={formData.targetLength} 
                                onChange={(e) => setFormData({...formData, targetLength: Number(e.target.value)})} 
                                className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>
                        <div className="pt-5 border-t border-zinc-200/50 dark:border-zinc-800/50">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                                <BrainCircuit className="w-4 h-4 text-emerald-500" />
                                Nâng cao (Tawa Process)
                            </h4>
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="flex justify-between text-[11px] uppercase font-bold text-zinc-500">
                                        <span>Temperature</span>
                                        <span className="text-zinc-900 dark:text-zinc-300">{formData.temperature}</span>
                                    </label>
                                    <input 
                                        type="range" 
                                        min="0.0" 
                                        max="2.0" 
                                        step="0.1" 
                                        value={formData.temperature} 
                                        onChange={(e) => setFormData({...formData, temperature: Number(e.target.value)})} 
                                        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-zinc-200 dark:bg-zinc-800 accent-blue-500"
                                    />
                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 leading-relaxed">Độ sáng tạo (0 - 2.0). Càng cao càng bay bổng, mặc kệ logic.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="flex justify-between text-[11px] uppercase font-bold text-zinc-500">
                                        <span>Top P</span>
                                        <span className="text-zinc-900 dark:text-zinc-300">{formData.topP}</span>
                                    </label>
                                    <input 
                                        type="range" 
                                        min="0.0" 
                                        max="1.0" 
                                        step="0.05" 
                                        value={formData.topP} 
                                        onChange={(e) => setFormData({...formData, topP: Number(e.target.value)})} 
                                        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-zinc-200 dark:bg-zinc-800 accent-blue-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] uppercase font-bold text-zinc-500">Top K</label>
                                    <input 
                                        type="number" 
                                        value={formData.topK} 
                                        onChange={(e) => setFormData({...formData, topK: Number(e.target.value)})} 
                                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                        min={1} max={100}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] uppercase font-bold text-zinc-500">Max Tokens</label>
                                    <input 
                                        type="number" 
                                        value={formData.maxOutputTokens} 
                                        onChange={(e) => setFormData({...formData, maxOutputTokens: Number(e.target.value)})} 
                                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-[11px] uppercase font-bold text-zinc-500">Thinking Level</label>
                                    <select 
                                        value={formData.thinkingLevel} 
                                        onChange={(e) => setFormData({...formData, thinkingLevel: e.target.value as 'HIGH'|'LOW'})} 
                                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                    >
                                        <option value="HIGH">HIGH (Suy nghĩ sâu)</option>
                                        <option value="LOW">LOW (Tốc độ cao)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Dàn ý Tổng thể (Global Plot)</label>
                        <textarea 
                            className="w-full h-24 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm resize-none custom-scrollbar" 
                            value={formData.globalPlot} 
                            onChange={e => setFormData({...formData, globalPlot: e.target.value})}
                            placeholder="Nhập kế hoạch các chương (Chương 1, Chương 2...)"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">🧠 Nhắc nhở của bạn (Chi tiết AI quên hoặc viết sai ý)</label>
                        <textarea 
                            className="w-full h-24 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm resize-none custom-scrollbar" 
                            value={formData.playerReminders} 
                            onChange={e => setFormData({...formData, playerReminders: e.target.value})}
                            placeholder="Nhập các chi tiết cố định cần nhắc nhở AI (VD: Ayn mất tay trái, Luna mang tóc đen, không dùng thương...)"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Văn phong (Writing Style)</label>
                        <input 
                            className="w-full bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 rounded-xl px-4 py-2.5 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" 
                            value={formData.writingStyle} 
                            onChange={e => setFormData({...formData, writingStyle: e.target.value})}
                            placeholder="VD: Cổ trang trầm mặc, hài hước, dồn dập..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                         <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Góc nhìn</label>
                            <select className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm appearance-none" value={formData.pov} onChange={e => setFormData({...formData, pov: e.target.value})}>
                                <option value="Ngôi thứ 3 (Toàn tri)">Ngôi thứ 3 (Toàn tri)</option>
                                <option value="Ngôi thứ 3 (Giới hạn)">Ngôi thứ 3 (Giới hạn)</option>
                                <option value="Ngôi thứ 1 (Tôi/Ta)">Ngôi thứ 1 (Tôi / Ta)</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Kiểu Xưng hô</label>
                            <select 
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm appearance-none" 
                                value={pronounStyleId} 
                                onChange={handlePronounIdChange}
                            >
                                {PRONOUN_STYLES.map(opt => (
                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="bg-zinc-50/50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        {pronounStyleId === 'custom' ? (
                             <div className="p-4">
                                <label className="block text-[11px] uppercase font-bold text-indigo-600 mb-2">Xưng hô tùy chỉnh:</label>
                                <textarea 
                                    className="w-full h-32 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-800 dark:text-zinc-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none custom-scrollbar" 
                                    value={formData.pronounStyle} 
                                    onChange={e => setFormData({...formData, pronounStyle: e.target.value})} 
                                />
                            </div>
                        ) : (
                            <div className="p-4">
                                <pre className="w-full h-24 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap overflow-y-auto custom-scrollbar">
                                    {getSystemPreview()}
                                </pre>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Thiết lập thế giới</label>
                        <textarea className="w-full h-20 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm resize-none custom-scrollbar" value={formData.setting} onChange={e => setFormData({...formData, setting: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Điều cấm kỵ (Negative Prompt)
                        </label>
                        <textarea className="w-full h-16 bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm resize-none custom-scrollbar" value={formData.negativePrompt} onChange={e => setFormData({...formData, negativePrompt: e.target.value})} />
                    </div>
                    
                    {/* Toggles */}
                    <div className="flex flex-wrap items-center gap-3 pt-3">
                        <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer border-zinc-200 dark:border-zinc-800 ${formData.nsfw ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30' : 'bg-transparent'}`}>
                            <input type="checkbox" className="w-4 h-4 rounded border-zinc-300 text-red-600 focus:ring-red-600" checked={formData.nsfw} onChange={e => setFormData({...formData, nsfw: e.target.checked})} />
                            {formData.nsfw ? <ShieldOff className="w-4 h-4 text-red-500" /> : <Shield className="w-4 h-4 text-zinc-400" />}
                            <span className={`text-sm font-semibold select-none ${formData.nsfw ? 'text-red-700 dark:text-red-400' : 'text-zinc-600 dark:text-zinc-400'}`}>Bật NSFW (18+)</span>
                        </label>
                        
                        <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer border-zinc-200 dark:border-zinc-800 ${formData.isDeepThinkActive ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30' : 'bg-transparent'}`}>
                            <input type="checkbox" className="w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-600" checked={formData.isDeepThinkActive} onChange={e => setFormData({...formData, isDeepThinkActive: e.target.checked})} />
                            <Zap className={`w-4 h-4 ${formData.isDeepThinkActive ? 'text-emerald-500' : 'text-zinc-400'}`} />
                            <span className={`text-sm font-semibold select-none ${formData.isDeepThinkActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400'}`}>Nghĩ sâu (Deep Think)</span>
                        </label>
                        
                        <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer border-zinc-200 dark:border-zinc-800 ${formData.isGoogleSearchActive ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30' : 'bg-transparent'}`}>
                            <input type="checkbox" className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-600" checked={formData.isGoogleSearchActive} onChange={e => setFormData({...formData, isGoogleSearchActive: e.target.checked})} />
                            <Globe className={`w-4 h-4 ${formData.isGoogleSearchActive ? 'text-blue-500' : 'text-zinc-400'}`} />
                            <span className={`text-sm font-semibold select-none ${formData.isGoogleSearchActive ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400'}`}>Tra Google</span>
                        </label>
                    </div>
                </div>
                
                <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 flex justify-end gap-3 items-center">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                        Hủy
                    </button>
                    <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition-colors active:scale-95">
                        <Save className="w-4 h-4" />
                        Lưu thiết lập
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
