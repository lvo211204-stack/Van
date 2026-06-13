
import React, { useState } from 'react';
import { Character } from '../types';
import { useStory } from '../context/StoryContext';

interface Props {
  characters: Character[];
}

export const CharacterList: React.FC<Props> = ({ characters }) => {
  const { generateCharacterAvatar, updateStorySettings, story } = useStory();
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);

  const handleGenerateImage = async () => {
      if (!selectedChar) return;
      setIsGeneratingImg(true);
      await generateCharacterAvatar(selectedChar.id);
      setIsGeneratingImg(false);
  };

  const handleUpdateChar = (updates: Partial<Character>) => {
      if (!selectedChar || !story) return;
      const updatedChars = story.characters.map(c => c.id === selectedChar.id ? { ...c, ...updates } : c);
      updateStorySettings({ characters: updatedChars });
      setSelectedChar({ ...selectedChar, ...updates });
  };

  const activeCharData = characters.find(c => c.id === selectedChar?.id) || selectedChar;

  if (characters.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center py-10 opacity-50">
            <span className="text-4xl mb-2">👥</span>
            <div className="text-zinc-400 text-sm italic">Chưa có nhân vật</div>
        </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 p-1 pb-20">
        {characters.map(char => (
          <div 
            key={char.id} 
            onClick={() => setSelectedChar(char)}
            className="group relative bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 relative">
                {char.avatarUrl ? (
                    <img src={char.avatarUrl} alt={char.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300 font-black text-2xl">
                        {char.name.charAt(0)}
                    </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                     <h4 className="font-bold text-white truncate text-sm">{char.name}</h4>
                     <p className="text-[10px] text-zinc-300 truncate">{char.role}</p>
                </div>
                <div className="absolute top-2 right-2 bg-black/40 backdrop-blur rounded-full px-2 py-0.5 text-[9px] text-white font-bold border border-white/20">
                    Lvl.{char.hierarchyLevel || 5}
                </div>
            </div>
          </div>
        ))}
      </div>

      {activeCharData && (
        <div 
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={() => setSelectedChar(null)}
        >
            <div 
                className="bg-white dark:bg-[#121214] sm:rounded-[2rem] rounded-t-[2rem] w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative animate-slideUp"
                onClick={e => e.stopPropagation()}
            >
                {/* Header Image */}
                <div className="relative w-full h-64 bg-zinc-100 dark:bg-zinc-800">
                    {activeCharData.avatarUrl ? (
                         <img src={activeCharData.avatarUrl} alt={activeCharData.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center flex-col text-zinc-300">
                            <span className="text-6xl mb-2">👤</span>
                        </div>
                    )}
                    
                    <button 
                        onClick={() => setSelectedChar(null)} 
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 backdrop-blur text-white flex items-center justify-center"
                    >✕</button>

                    <div className="absolute bottom-4 right-4">
                        <button 
                            onClick={handleGenerateImage}
                            disabled={isGeneratingImg}
                            className="bg-white/90 dark:bg-zinc-800/90 backdrop-blur text-zinc-900 dark:text-white text-xs font-bold py-2 px-4 rounded-full shadow-lg"
                        >
                            {isGeneratingImg ? '✨ Đang vẽ...' : '🎨 Tạo ảnh AI'}
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1 bg-white dark:bg-[#121214]">
                    <div>
                        <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-1">{activeCharData.name}</h2>
                        <div className="flex gap-2">
                             <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 uppercase">{activeCharData.role}</span>
                             <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">Lvl.{activeCharData.hierarchyLevel || 5}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-white/5">
                            <label className="block text-[9px] font-black text-zinc-400 uppercase mb-1">Địa vị xã hội</label>
                            <input 
                                className="w-full bg-transparent text-sm font-bold text-zinc-800 dark:text-zinc-200 outline-none"
                                value={activeCharData.socialStatus || ''}
                                onChange={e => handleUpdateChar({ socialStatus: e.target.value })}
                                placeholder="..."
                            />
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-white/5">
                            <label className="block text-[9px] font-black text-zinc-400 uppercase mb-1">Cấp bậc (1-10)</label>
                            <input 
                                type="number" min="1" max="10"
                                className="w-full bg-transparent text-sm font-bold text-zinc-800 dark:text-zinc-200 outline-none"
                                value={activeCharData.hierarchyLevel || 5}
                                onChange={e => handleUpdateChar({ hierarchyLevel: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-white/5">
                            <label className="block text-[9px] font-black text-zinc-400 uppercase mb-2">Quan hệ cốt lõi</label>
                            <input 
                                className="w-full bg-transparent text-sm text-zinc-700 dark:text-zinc-300 outline-none border-b border-zinc-200 dark:border-zinc-700 pb-1"
                                value={activeCharData.relationships || ''}
                                onChange={e => handleUpdateChar({ relationships: e.target.value })}
                                placeholder="Nhập mối quan hệ..."
                            />
                        </div>

                        <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-white/5">
                            <label className="block text-[9px] font-black text-zinc-400 uppercase mb-2">Mô tả / Tiểu sử</label>
                            <textarea 
                                className="w-full h-24 bg-transparent text-sm text-zinc-700 dark:text-zinc-300 outline-none resize-none leading-relaxed"
                                value={activeCharData.description}
                                onChange={e => handleUpdateChar({ description: e.target.value })}
                            />
                        </div>

                        <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-white/5">
                            <label className="block text-[9px] font-black text-zinc-400 uppercase mb-2">Ngoại hình (Prompt vẽ ảnh)</label>
                            <textarea 
                                className="w-full h-20 bg-transparent text-sm text-zinc-700 dark:text-zinc-300 outline-none resize-none leading-relaxed"
                                value={activeCharData.appearance}
                                onChange={e => handleUpdateChar({ appearance: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </>
  );
};
