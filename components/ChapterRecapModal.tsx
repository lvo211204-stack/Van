
import React, { useState } from 'react';
import { Character, CharacterStatus } from '../types';
import { motion } from 'motion/react';
import { X, Check, Save } from 'lucide-react';

interface Props {
  summary: string;
  charStatus: { [key: string]: CharacterStatus };
  characters: Character[];
  onSave: (summary: string, charStatus: { [key: string]: CharacterStatus }) => void;
  onCancel: () => void;
}

export const ChapterRecapModal: React.FC<Props> = ({ summary: initialSummary, charStatus: initialStatus, characters, onSave, onCancel }) => {
  const [summary, setSummary] = useState(initialSummary);
  const [statusMap, setStatusMap] = useState(initialStatus || {});

  const handleStatusChange = (charName: string, field: keyof CharacterStatus, value: string) => {
      setStatusMap(prev => ({
          ...prev,
          [charName]: {
              ...prev[charName],
              [field]: value
          }
      }));
  };

  const getCharName = (key: string) => {
      const found = characters.find(c => c.name.toLowerCase() === key.toLowerCase());
      return found ? found.name : key;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white dark:bg-zinc-950 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
      >
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 flex justify-between items-start">
            <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    <Check className="w-5 h-5 text-indigo-500" />
                    Đồng Bộ Trạng Thái
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Kiểm tra và cập nhật trạng thái cuối cùng của nhân vật để hệ thống chuẩn bị cho chương sau.
                </p>
            </div>
            <button onClick={onCancel} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto flex flex-col md:flex-row">
            
            {/* Left: Summary */}
            <div className="flex-1 p-6 border-r border-zinc-100 dark:border-zinc-800 flex flex-col gap-3">
                <label className="text-xs font-semibold text-indigo-500 uppercase tracking-widest">Tóm tắt sự kiện</label>
                <textarea 
                    className="flex-1 w-full bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-zinc-200 resize-none transition-all"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Chưa có nội dung tóm tắt..."
                />
            </div>

            {/* Right: Character States */}
            <div className="flex-1 p-6 bg-zinc-50/30 dark:bg-zinc-900/10 flex flex-col gap-4">
                <label className="text-xs font-semibold text-indigo-500 uppercase tracking-widest">Tình trạng nhân vật</label>
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                    {Object.keys(statusMap).length === 0 ? (
                        <div className="text-center py-12 text-zinc-400 text-sm">
                            Không có nhân vật nào tham gia scene này.
                        </div>
                    ) : (
                        Object.keys(statusMap).map(key => {
                            const s = statusMap[key];
                            return (
                                <div key={key} className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)]">
                                    <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center">
                                        <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
                                        {getCharName(key)}
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-red-500/80 uppercase tracking-wider block mb-1.5 flex justify-between">Vật lý / Vết thương</label>
                                            <input 
                                                className="w-full bg-red-50/50 dark:bg-red-950/10 border border-red-200/50 dark:border-red-900/30 rounded-lg px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                                                value={s.physicalCondition}
                                                onChange={(e) => handleStatusChange(key, 'physicalCondition', e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1.5">Tâm lý (Mental)</label>
                                                <input 
                                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs dark:text-zinc-300 outline-none focus:ring-2 focus:ring-zinc-500/20 transition-all"
                                                    value={s.mentalState || ''}
                                                    onChange={(e) => handleStatusChange(key, 'mentalState', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1.5">Cảm xúc hiện tại</label>
                                                <input 
                                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs dark:text-zinc-300 outline-none focus:ring-2 focus:ring-zinc-500/20 transition-all"
                                                    value={s.emotion}
                                                    onChange={(e) => handleStatusChange(key, 'emotion', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                         <div>
                                            <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1.5">Vị trí (Location)</label>
                                            <input 
                                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs dark:text-zinc-300 outline-none focus:ring-2 focus:ring-zinc-500/20 transition-all"
                                                value={s.location}
                                                onChange={(e) => handleStatusChange(key, 'location', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end gap-3 items-center">
             <button onClick={onCancel} className="px-5 py-2 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
                 Bỏ qua
             </button>
             <button 
                onClick={() => onSave(summary, statusMap)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-500/20 transition-colors"
             >
                 <Save className="w-4 h-4" />
                 Lưu Trạng Thái
             </button>
        </div>

      </motion.div>
    </div>
  );
};
