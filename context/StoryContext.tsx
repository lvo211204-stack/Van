
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Story, Chapter, Character, PinnedMemory, LoreEntry, ItemEntry, StoryAttribute, HornyStyle, SegmentConfig, MemoryEntry, CharacterStatus, VectorData } from '../types';
import { storageService } from '../services/storage';
import { geminiService } from '../services/geminiService';
import { ragService } from '../services/ragService';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { toast } from 'react-hot-toast';

interface StoryContextType {
  story: Story | null;
  storiesList: Story[];
  activeChapterId: string | null;
  characters: Character[];
  isGenerating: boolean;
  generatingChapterId: string | null;
  tokenStats: { previous: number; current: number };
  userInstruction: string;
  setUserInstruction: (text: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  loadStories: () => Promise<void>;
  createStory: (...args: any[]) => Promise<void>;
  openStory: (id: string, restoreChapter?: boolean) => Promise<void>;
  closeStory: () => void;
  deleteStory: (id: string) => Promise<void>;
  updateStorySettings: (settings: Partial<Story>) => Promise<void>;
  selectChapter: (id: string) => void;
  addChapter: (e?: React.MouseEvent | string, title?: string) => Promise<void>;
  addSubChapter: (parentId: string) => Promise<void>;
  deleteChapter: (chapterId: string) => Promise<void>; 
  updateChapterContent: (id: string, content: string) => void;
  updateChapterTitle: (id: string, title: string) => void;
  updateChapterRating: (id: string, rating: number, feedback?: string) => void;
  generateContinue: (instructionOverride?: string, povName?: string, targetIdOverride?: string) => Promise<boolean>;
  stopGeneration: () => void;
  extractAndSyncCharacters: () => Promise<void>;
  addCharacter: (char: Character) => void;
  generateCharacterAvatar: (characterId: string) => Promise<void>; 
  addLore: (lore: LoreEntry) => void;
  deleteLore: (id: string) => void;
  addItem: (item: ItemEntry) => void;
  deleteItem: (id: string) => void;
  extractAndSyncWorldInfo: () => Promise<void>;
  syncActiveChapter: () => Promise<void>;
  updatePinnedMemory: (memory: PinnedMemory) => Promise<void>;
  updateStoryAttributes: (attributes: StoryAttribute[]) => Promise<void>; 
  saveProgress: () => Promise<void>;
  exportStory: (id?: string) => void;
  importStory: (file: File) => Promise<void>;
  
  // -- REPLACED --
  analyzeHornyText: (text: string) => Promise<void>;
  
  updateHornyStyle: (style: Partial<HornyStyle>) => Promise<void>; 
  toggleHorny: (active: boolean) => Promise<void>;
  resetHorny: () => Promise<void>;

  updateSegmentConfig: (config: Partial<SegmentConfig>) => Promise<void>;
  autoGenerateBeats: (summary: string) => Promise<void>;
  deleteMemory: (id: string) => void;
  clearLedger: () => void;
  analyzeCurrentChapter: () => Promise<{ summary: string, charStatus: { [key: string]: CharacterStatus } } | null>; 
  commitChapterState: (summary: string, charStatus: { [key: string]: CharacterStatus }) => void;
  summarizeSpecificChapter: (chapterId: string) => Promise<void>;
  currentReasoning: string;
  user: User | null;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

export const StoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [story, setStoryState] = useState<Story | null>(null);
  const storyRef = useRef<Story | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const setStory = (value: React.SetStateAction<Story | null>) => {
    const next = typeof value === 'function' ? (value as any)(storyRef.current) : value;
    if (next === null && storyRef.current !== null) {
        if (isGeneratingRef.current) {
            console.error("BLOCKED STORY SET TO NULL DURING GENERATION");
            return;
        }
    }
    storyRef.current = next;
    setStoryState(next);
  };

  const [storiesList, setStoriesList] = useState<Story[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(() => localStorage.getItem('activeChapterId'));
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingChapterId, setGeneratingChapterId] = useState<string | null>(null);
  const [tokenStats, setTokenStats] = useState({ previous: 0, current: 0 });
  const [userInstruction, setUserInstruction] = useState('');
  const [currentReasoning, setCurrentReasoning] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');
  
  const [cachedVectors, setCachedVectors] = useState<VectorData[]>([]);

  const isGeneratingRef = useRef(false);

  useEffect(() => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
      if (story) {
          localStorage.setItem('activeStoryId', story.id);
      } else {
          localStorage.removeItem('activeStoryId');
      }
  }, [story?.id]);

  useEffect(() => {
      if (activeChapterId) {
          localStorage.setItem('activeChapterId', activeChapterId);
      } else {
          localStorage.removeItem('activeChapterId');
      }
  }, [activeChapterId]);

  useEffect(() => { 
      const unsub = onAuthStateChanged(auth, (u) => {
          setUser(u);
          loadStories();
      });
      return unsub;
  }, []);

  useEffect(() => { 
      loadStories().then(() => {
          const savedStoryId = localStorage.getItem('activeStoryId');
          if (savedStoryId) {
              openStory(savedStoryId, true);
          }
      }); 
  }, []);

  useEffect(() => {
      if (!story) return;
      const timeoutId = setTimeout(() => { storageService.saveStory(story).catch(console.error); }, 2000);
      return () => clearTimeout(timeoutId);
  }, [story]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && storyRef.current) {
        storageService.saveStory(storyRef.current).catch(console.error);
      }
    };

    const handlePageHide = () => {
      if (storyRef.current) {
        storageService.saveStory(storyRef.current).catch(console.error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const loadStories = async () => {
    const list = await storageService.getAllStories() || [];
    const sanitizedList = list.map(s => ({
      ...s,
      chapters: s.chapters || []
    }));
    sanitizedList.sort((a, b) => {
        const getLastUpdate = (s: Story) => {
            const chapterMax = s.chapters && s.chapters.length > 0 ? Math.max(...s.chapters.map(c => c.lastUpdated)) : 0;
            return Math.max(s.createdAt, chapterMax);
        };
        return getLastUpdate(b) - getLastUpdate(a);
    });
    setStoriesList(sanitizedList);
  };

  const createStory = async (payload: Partial<Story> & {title: string, genre: string, synopsis: string}) => {
    setIsGenerating(true); 
    const newStory: Story = {
      id: crypto.randomUUID(), 
      title: payload.title, 
      genre: payload.genre, 
      storyElements: payload.storyElements || '', 
      theme: payload.theme || '', 
      synopsis: payload.synopsis, 
      globalPlot: payload.globalPlot || '', 
      setting: payload.setting || '', 
      fandom: payload.fandom, 
      sourceUrl: payload.sourceUrl, 
      targetLength: payload.targetLength || 1000, 
      autoNewChapter: true, 
      writingStyle: payload.writingStyle || '', 
      pov: payload.pov || '', 
      pronounStyle: payload.pronounStyle || '', 
      negativePrompt: payload.negativePrompt || '', 
      nsfw: payload.nsfw || false, 
      isDeepThinkActive: payload.isDeepThinkActive, 
      temperature: payload.temperature || 0.7, 
      maxOutputTokens: payload.maxOutputTokens || 320000,
      topP: payload.topP,
      topK: payload.topK,
      thinkingLevel: payload.thinkingLevel,
      pinnedMemory: { physical: [], emotional: [], relational: [], world: [], inventory: [], ledger: [] },
      attributes: [], 
      characters: [], 
      lore: payload.lore || [], 
      items: payload.items || [], 
      playerReminders: payload.playerReminders || '',
      isHornyActive: payload.isHornyActive || false,
      hornyStyle: payload.hornyStyle,
      createdAt: Date.now(),
      chapters: [{ id: crypto.randomUUID(), title: 'Chương 1', content: '', summary: '', order: 1, lastUpdated: Date.now() }],
      segmentConfig: { isActive: false, beats: [], beatLengths: [], currentBeatIndex: 0, autoMode: false } 
    };
    await storageService.saveStory(newStory);
    await loadStories();
    setStory(newStory);
    setActiveChapterId(newStory.chapters[0].id);
    setCachedVectors([]);
    setIsGenerating(false);
  };

  const openStory = async (id: string, restoreChapter: boolean = false) => {
    const found = await storageService.getStory(id);
    if (found) {
        const safeStory = {
            ...found,
            chapters: found.chapters || [],
            theme: found.theme || (found as any).subGenre || '',
            storyElements: found.storyElements || (found as any).locationElements || '',
            globalPlot: found.globalPlot || '',
            temperature: found.temperature !== undefined ? found.temperature : 0.7,
            maxOutputTokens: found.maxOutputTokens !== undefined ? found.maxOutputTokens : 2048,
            segmentConfig: found.segmentConfig || { isActive: false, beats: [], beatLengths: [], currentBeatIndex: 0, autoMode: false },
            pinnedMemory: {
                physical: found.pinnedMemory?.physical || [],
                emotional: found.pinnedMemory?.emotional || [],
                relational: found.pinnedMemory?.relational || [],
                world: found.pinnedMemory?.world || [],
                inventory: found.pinnedMemory?.inventory || [],
                ledger: found.pinnedMemory?.ledger || [],
                lastChapterSummary: found.pinnedMemory?.lastChapterSummary 
            }
        };
        setStory(safeStory);
        
        const chapters = found.chapters || [];
        if (restoreChapter) {
            const savedChapterId = localStorage.getItem('activeChapterId');
            if (savedChapterId && chapters.some(c => c.id === savedChapterId)) {
                setActiveChapterId(savedChapterId);
            } else if (chapters.length > 0) {
                setActiveChapterId(chapters[chapters.length-1].id);
            } else {
                setActiveChapterId(null);
            }
        } else {
            if (chapters.length > 0) {
                setActiveChapterId(chapters[chapters.length-1].id);
            } else {
                setActiveChapterId(null);
            }
        }
        
        const allVectors = await storageService.getAllVectors();
        setCachedVectors(allVectors);
    }
  };

  const closeStory = (e?: React.MouseEvent) => { 
      if (e && e.preventDefault) e.preventDefault();
      // DEFENSE: Prevent jumping out while generating unless explicitly forced.
      if (isGeneratingRef.current) {
          console.warn("Attempted to close story while generating");
          return;
      }
      if (storyRef.current) {
          storageService.saveStory(storyRef.current).catch(console.error);
      }
      setStory(null); 
      setActiveChapterId(null); 
      setCachedVectors([]);
      isGeneratingRef.current = false;
      setIsGenerating(false);
      loadStories();
  };

  const stopGeneration = () => {
      geminiService.abortStream();
      isGeneratingRef.current = false;
      setIsGenerating(false);
      setGeneratingChapterId(null);
      setGenerationQueue([]);
      queueRef.current = [];
  };

  const deleteStory = async (id: string) => {
    await storageService.deleteStory(id);
    await loadStories();
    if (story?.id === id) closeStory();
  };

  const updateStorySettings = async (settings: Partial<Story>) => {
    if (!story) return;
    setStory(prev => prev ? { ...prev, ...settings } : null);
  };

  const selectChapter = (id: string) => {
      setStory(prev => {
          if (!prev) return null;
          return { 
              ...prev, 
              segmentConfig: prev.segmentConfig ? { ...prev.segmentConfig, isActive: false } : undefined
          };
      });
      setActiveChapterId(id);
  };

  const addChapter = async (e?: React.MouseEvent | string, title?: string) => {
    if (!story) return;
    const maxMainOrder = story.chapters.length > 0 ? Math.max(...story.chapters.map(c => Math.floor(c.order))) : 0;
    const order = maxMainOrder + 1;
    const chapterTitle = typeof e === 'string' ? e : (title || `Chương ${order}`);
    const newChapter: Chapter = { 
        id: crypto.randomUUID(), 
        title: chapterTitle, 
        content: '', 
        summary: '', 
        order: order, 
        lastUpdated: Date.now() 
    };
    const updated = { ...story, chapters: [...story.chapters, newChapter] };
    setStory(updated);
    setActiveChapterId(newChapter.id);
  };

  const addSubChapter = async (parentId: string) => {
    if (!story) return;
    const parentChapter = story.chapters.find(c => c.id === parentId);
    if (!parentChapter) return;
    
    const parentBaseOrder = Math.floor(parentChapter.order);
    const subChapters = story.chapters.filter(c => Math.floor(c.order) === parentBaseOrder && c.order > parentBaseOrder);
    
    const maxSubOrder = subChapters.length > 0 ? Math.max(...subChapters.map(c => c.order)) : parentBaseOrder;
    const nextSubOrder = Math.round((maxSubOrder + 0.001) * 1000) / 1000;
    
    const subIndex = subChapters.length + 1;
    const chapterTitle = `Chương ${parentBaseOrder}.${subIndex}`;
    
    const newChapter: Chapter = { 
        id: crypto.randomUUID(), 
        title: chapterTitle, 
        content: '', 
        summary: '', 
        order: nextSubOrder, 
        lastUpdated: Date.now() 
    };
    const updated = { ...story, chapters: [...story.chapters, newChapter] };
    setStory(updated);
    setActiveChapterId(newChapter.id);
  };

  const deleteChapter = async (chapterId: string) => {
    if (!story) return;
    const updatedChapters = story.chapters.filter(c => c.id !== chapterId);
    const updated = { ...story, chapters: updatedChapters };
    setStory(updated);
    await storageService.saveStory(updated);
    if (activeChapterId === chapterId) {
        if (updatedChapters.length > 0) setActiveChapterId(updatedChapters[updatedChapters.length - 1].id);
        else setActiveChapterId(null);
    }
  };

  const updateChapterContent = (id: string, content: string) => {
    setStory(prev => {
        if (!prev) return null;
        const index = prev.chapters.findIndex(c => c.id === id);
        if (index === -1) return prev;
        const newChapters = [...prev.chapters];
        newChapters[index] = { ...newChapters[index], content, lastUpdated: Date.now() };
        return { ...prev, chapters: newChapters };
    });
  };

  const updateChapterTitle = (id: string, title: string) => {
    setStory(prev => {
        if (!prev) return null;
        const index = prev.chapters.findIndex(c => c.id === id);
        if (index === -1) return prev;
        const newChapters = [...prev.chapters];
        newChapters[index] = { ...newChapters[index], title, lastUpdated: Date.now() };
        return { ...prev, chapters: newChapters };
    });
  };

  const updateChapterRating = (id: string, rating: number, feedback?: string) => {
    setStory(prev => {
        if (!prev) return null;
        const index = prev.chapters.findIndex(c => c.id === id);
        if (index === -1) return prev;
        const newChapters = [...prev.chapters];
        newChapters[index] = { ...newChapters[index], rating, feedback, lastUpdated: Date.now() };
        return { ...prev, chapters: newChapters };
    });
  };

  interface GenTask {
      chapterId: string;
      instructionOverride?: string;
      povName?: string;
  }
  const [generationQueue, setGenerationQueue] = useState<GenTask[]>([]);
  const queueRef = useRef<GenTask[]>([]);

  const generateContinue = async (instructionOverride?: string, povName?: string, targetIdOverride?: string): Promise<boolean> => {
    const currentStory = storyRef.current;
    
    // Nếu không chỉ định id cụ thể, dùng id hiện tại
    const targetId = targetIdOverride || activeChapterId;
    if (!currentStory || !targetId) return false;

    if (isGeneratingRef.current) {
        // Đưa vào hàng chờ (Queue) nếu AI đang bận
        console.log(`Đã đưa chapter ${targetId} vào hàng chờ.`);
        if (!queueRef.current.some(t => t.chapterId === targetId)) {
            queueRef.current.push({ chapterId: targetId, instructionOverride, povName });
            setGenerationQueue([...queueRef.current]);
        }
        return true;
    }

    const chapter = currentStory.chapters.find(c => c.id === targetId);
    if (!chapter) return false;
    
    // Nếu chưa ở trạng thái generating, thiết lập checkpoint và bật cờ
    if (!isGeneratingRef.current) {
        const checkpoint = { 
            contentLength: chapter.content.length, 
            pinnedMemory: currentStory.pinnedMemory ? JSON.parse(JSON.stringify(currentStory.pinnedMemory)) : undefined, 
            timestamp: Date.now() 
        };
        setStory(prev => prev ? { ...prev, lastCheckpoint: checkpoint } : null);
    }
    
    setIsGenerating(true);
    setGeneratingChapterId(chapter.id);
    isGeneratingRef.current = true;
    const targetChapterId = chapter.id;

    let accumulatedContent = chapter.content;
    let accumulatedReasoning = "";
    setCurrentReasoning("");
    const initialContentLength = accumulatedContent.length;
    let activeInput = "";
    let isSuccess = true;

    try {
        const currentContext = accumulatedContent.slice(-1000);
        let relevantContext = "";
        let relevantLore: LoreEntry[] = [];
        let relevantItems: ItemEntry[] = [];
        
        if (cachedVectors.length > 0) {
            const activeIntent = instructionOverride || userInstruction || "Tiếp tục diễn biến câu chuyện";
            const storyContext = `Story: ${currentStory.title} (${currentStory.genre})`;
            const smartQuery = `CONTEXT: ${storyContext}. INTENT: ${activeIntent}. CURRENT SCENE: ${currentContext}`;
            const queryEmbedding = await geminiService.embedText(smartQuery);

            if (queryEmbedding.length > 0) {
                 const hits = ragService.search(smartQuery, queryEmbedding, cachedVectors, 15, 0.50);
                 
                 const plotHits = hits.filter(h => h.metadata.type === 'chapter' || h.metadata.type === 'memory_fact' || h.metadata.type === 'plot_node').filter(h => h.metadata.referenceId !== activeChapterId);
                 const loreHits = hits.filter(h => h.metadata.type === 'lore');
                 const itemHits = hits.filter(h => h.metadata.type === 'item');

                 if (plotHits.length > 0) {
                     const facts = plotHits.filter(h => h.metadata.type === 'memory_fact');
                     const nodes = plotHits.filter(h => h.metadata.type === 'plot_node');
                     const scenes = plotHits.filter(h => h.metadata.type === 'chapter');
                     
                     relevantContext = [
                         nodes.map(h => `- [BIÊN NIÊN SỬ]: ${h.text}`).join("\n"),
                         facts.map(h => `- [SỰ THẬT]: ${h.text}`).join("\n"),
                         scenes.slice(0, 3).map(h => `- [TRÍCH ĐOẠN QUÁ KHỨ]: ${h.text}`).join("\n")
                     ].filter(t => t).join("\n\n");
                 }
                 if (loreHits.length > 0) {
                     const loreIds = new Set(loreHits.map(h => h.metadata.referenceId));
                     relevantLore = currentStory.lore.filter(l => loreIds.has(l.id));
                 }
                 if (itemHits.length > 0) {
                     const itemIds = new Set(itemHits.map(h => h.metadata.referenceId));
                     relevantItems = currentStory.items.filter(i => itemIds.has(i.id));
                 }
            }
        }

        const summaries = currentStory.chapters.filter(c => c.order < chapter.order).map(c => `Ch ${c.order}: ${c.summary}`).join('\n');
        
        const sortedChapters = [...currentStory.chapters].sort((a, b) => a.order - b.order);
        const currentChapterIndex = sortedChapters.findIndex(c => c.id === activeChapterId);
        
        let previousChapterContent = "";
        if (currentChapterIndex > 0) {
            const prevChapters = sortedChapters.slice(0, currentChapterIndex);
            previousChapterContent = prevChapters.map(c => `[Chương ${c.order} - ${c.title}]:\n${c.content}`).join('\n\n');
            
            // Cân bằng ngữ cảnh: Giữ trí nhớ ở mức an toàn
            // Nếu dùng Proxy (OpenRouter/OpenAI), giới hạn ở 400.000 ký tự (~100k tokens) để tránh vượt quá context limit hoặc cắt xén mất world_bible.
            // Nếu dùng Gemini chính chủ, có thể giữ đến 2M ký tự (~500k tokens)
            const proxy = localStorage.getItem('gemini_proxy_url');
            const isUsingProxy = !!proxy && proxy.trim().length > 0;
            const maxContextLength = isUsingProxy ? 400000 : 2000000;
            
            if (previousChapterContent.length > maxContextLength) {
                // Lấy phần cuối truyện để đảm bảo mạch truyện gần liền mạch
                previousChapterContent = previousChapterContent.slice(-maxContextLength);
            }
        }

        let effectiveTargetLength = currentStory.targetLength || 1000;
        
        activeInput = instructionOverride || userInstruction || "";
        const isStrictInput = activeInput.length > 100;
        const shouldDisableSegment = isStrictInput;

        const effectiveSegmentConfig = shouldDisableSegment 
            ? { ...currentStory.segmentConfig, isActive: false } as SegmentConfig 
            : currentStory.segmentConfig;

        if (effectiveSegmentConfig?.isActive) {
            const specificBeatLength = effectiveSegmentConfig.beatLengths?.[effectiveSegmentConfig.currentBeatIndex];
            
            // LOGIC FIX: Luôn ưu tiên độ dài của beat nếu có, kể cả khi nó lớn
            if (specificBeatLength && specificBeatLength > 0) {
                effectiveTargetLength = specificBeatLength;
            }
        }

        const generator = geminiService.generateStoryStream(
            // Tăng giới hạn trí nhớ lên 10 triệu từ (Tương đương khoảng 50,000,000 ký tự)
            accumulatedContent.slice(-50000000), summaries, currentStory.setting, "", currentStory.synopsis, currentStory.characters, currentStory.pinnedMemory, currentStory.genre, currentStory.storyElements, currentStory.theme, currentStory.writingStyle || "", currentStory.pov, currentStory.pronounStyle, currentStory.negativePrompt, currentStory.nsfw || false, instructionOverride || userInstruction, currentStory.fandom, effectiveTargetLength, currentStory.attributes, povName, currentStory.hornyStyle, currentStory.isHornyActive, effectiveSegmentConfig, undefined, previousChapterContent, relevantContext, relevantLore, relevantItems, currentStory.globalPlot, 
            chapter.title, currentStory.isDeepThinkActive,
            currentStory.temperature, currentStory.maxOutputTokens, currentStory.topP, currentStory.topK, currentStory.thinkingLevel, currentStory.hiddenMemory, currentStory.isGoogleSearchActive,
            currentStory.playerReminders
        );
        
        let lastUpdateTime = Date.now();
        let pendingTextUpdate = false;
        let pendingReasoningUpdate = false;
        
        for await (const chunk of generator) {
            if (!isGeneratingRef.current) break;
            
            if (chunk.reasoning) {
                accumulatedReasoning += chunk.reasoning;
                pendingReasoningUpdate = true;
            }
            if (chunk.text) {
                accumulatedContent += chunk.text;
                pendingTextUpdate = true;
            }
            
            const now = Date.now();
            // Cập nhật giao diện siêu mượt (30ms ~ 33 FPS) để chữ trôi xuống tự nhiên hơn
            if (now - lastUpdateTime > 30) {
                lastUpdateTime = now;
                
                if (pendingReasoningUpdate) {
                    setCurrentReasoning(accumulatedReasoning);
                    pendingReasoningUpdate = false;
                }
                
                if (pendingTextUpdate) {
                    setStory(prev => {
                        if (!prev) return null;
                        const idx = prev.chapters.findIndex(c => c.id === targetChapterId);
                        if (idx === -1) return prev;
                        const newChapters = [...prev.chapters];
                        newChapters[idx] = { ...newChapters[idx], content: accumulatedContent };
                        return { ...prev, chapters: newChapters };
                    });
                    pendingTextUpdate = false;
                }
            }
            if (chunk.usageMetadata) { setTokenStats({ previous: tokenStats.current, current: chunk.usageMetadata.totalTokenCount || 0 }); }
        }

        if (!storyRef.current || !isGeneratingRef.current) return;

        // --- AUTO NEXT BEAT LOGIC (Tính toán ngay để quyết định scheduleNextRun) ---
        let newSegmentConfig = storyRef.current.segmentConfig;
        let shouldAutoTrigger = false;
        
        if (newSegmentConfig?.isActive && !shouldDisableSegment) {
            const currentIdx = newSegmentConfig.currentBeatIndex;
            const totalBeats = newSegmentConfig.beats.length;
            
            if (currentIdx < totalBeats - 1) {
                if (newSegmentConfig.autoMode) shouldAutoTrigger = true;
                newSegmentConfig = { ...newSegmentConfig, currentBeatIndex: currentIdx + 1 };
            } else {
                shouldAutoTrigger = false;
                newSegmentConfig = { ...newSegmentConfig, autoMode: false };
            }
        }

        // Cập nhật cấu hình segment ngay lập tức
        if (newSegmentConfig) {
            setStory(prev => prev ? { ...prev, segmentConfig: newSegmentConfig } : null);
        }

        // --- TRIGGER NEXT RUN ---
        if (shouldAutoTrigger) {
             // Queues the next task sequentially through the queueRef
             if (!queueRef.current.some(t => t.chapterId === targetId)) {
                 queueRef.current.push({ chapterId: targetId, instructionOverride: undefined, povName });
                 setGenerationQueue([...queueRef.current]);
             }
        }

    } catch (e: any) {
        isSuccess = false;
        if (e?.name !== 'AbortError' && !e?.message?.includes('network error') && !e?.message?.includes('aborted')) {
            console.error("Generation error:", e.message || e);
            toast.error("Lỗi AI: " + (e.message || "Xảy ra lỗi không xác định"));
        }
    } finally {
        // Cập nhật giá trị cuối cùng, đảm bảo text không bị mất kể cả khi có lỗi giữa chừng
        setCurrentReasoning(accumulatedReasoning);
        setStory(prev => {
            if (!prev) return null;
            const idx = prev.chapters.findIndex(c => c.id === targetChapterId);
            if (idx === -1) return prev;
            const newChapters = [...prev.chapters];
            newChapters[idx] = { ...newChapters[idx], content: accumulatedContent };
            return { ...prev, chapters: newChapters };
        });

        if (storyRef.current) storageService.saveStory(storyRef.current).catch(console.error);
        
        // Nếu user nhấn Stop thì cờ này đã bị chuyển sang false
        if (!isGeneratingRef.current) {
             isSuccess = false;
             setIsGenerating(false);
             setGeneratingChapterId(null);
             queueRef.current = [];
             setGenerationQueue([]);
        } else if (queueRef.current.length > 0) {
            const nextTask = queueRef.current.shift()!;
            setGenerationQueue([...queueRef.current]);
            console.log(`Bắt đầu chạy chapter queued: ${nextTask.chapterId}`);
            
            // Wait slightly before calling next to allow UI to breathe
            setTimeout(() => {
                // Chúng ta sẽ đặt cờ isGeneratingRef ở false trước để không bị block ở đầu function
                setIsGenerating(false);
                setGeneratingChapterId(null);
                isGeneratingRef.current = false;
                
                generateContinue(nextTask.instructionOverride, nextTask.povName, nextTask.chapterId);
            }, 100);
        } else {
            setIsGenerating(false);
            setGeneratingChapterId(null);
            isGeneratingRef.current = false;
            
            // Background Auto Memory Compiler
            if (storyRef.current) {
                const currentMemory = storyRef.current.hiddenMemory;
                const newContent = accumulatedContent.slice(initialContentLength);
                
                // Chỉ tổng hợp nếu có text mới được sinh ra (ít nhất 50 ký tự để tránh các đoạn text quá ngắn)
                if (newContent.trim().length > 50) {
                    geminiService.compileHiddenMemory(currentMemory, newContent, activeInput, storyRef.current.playerReminders).then(newMemory => {
                        if (newMemory) {
                            setStory(prev => prev ? { ...prev, hiddenMemory: newMemory } : null);
                            if (storyRef.current) storageService.saveStory(storyRef.current);
                        }
                    }).catch(console.error);
                }
            }
        }
    }
    
    return isSuccess;
  };

  const analyzeCurrentChapter = async () => {
      const currentStory = storyRef.current;
      if (!currentStory || !activeChapterId) return null;
      const chapter = currentStory.chapters.find(c => c.id === activeChapterId);
      if (!chapter) return null;

      setIsGenerating(true);
      try {
          const result = await geminiService.analyzeChapterEvents(chapter.content, currentStory.characters);
          return result;
      } catch (e) {
          console.error(e);
          return null;
      } finally {
          setIsGenerating(false);
      }
  };
  
  const summarizeSpecificChapter = async (chapterId: string) => {
      const currentStory = storyRef.current;
      if (!currentStory) return;
      const chapter = currentStory.chapters.find(c => c.id === chapterId);
      if (!chapter || !chapter.content) return;
      
      setIsGenerating(true);
      try {
          const summary = await geminiService.summarize(chapter.content);
          if (summary) {
               setStory(prev => {
                  if (!prev) return null;
                  const newChapters = prev.chapters.map(c => c.id === chapterId ? { ...c, summary: summary } : c);
                  const updatedStory = { ...prev, chapters: newChapters };
                  storyRef.current = updatedStory; 
                  return updatedStory;
              });
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsGenerating(false);
      }
  };

  const commitChapterState = async (summary: string, charStatus: { [key: string]: CharacterStatus }) => {
      if (!storyRef.current) return;
      
      const currentStory = storyRef.current;
      const activeChapter = currentStory.chapters.find(c => c.id === activeChapterId);
      if (!activeChapter) return;

      setIsGenerating(true);
      try {
          const plotNodeVector = await geminiService.indexChapterSummary(activeChapter.id, summary, activeChapter.title);
          if (plotNodeVector) {
              setCachedVectors(prev => [...prev, plotNodeVector]);
              await storageService.saveVectors([plotNodeVector]);
          }

          const updatedChars = currentStory.characters.map(c => {
              const statusKey = Object.keys(charStatus).find(k => k.toLowerCase() === c.name.toLowerCase());
              if (statusKey) {
                  return { ...c, status: { ...c.status, ...charStatus[statusKey] } };
              }
              return c;
          });

          const updatedPinnedMemory = {
              ...currentStory.pinnedMemory || { physical: [], emotional: [], relational: [], world: [], inventory: [] },
              lastChapterSummary: summary
          };
          
          const updatedChapters = currentStory.chapters.map(c => 
              c.id === activeChapterId ? { ...c, summary: summary, isSummaryIndexed: true } : c
          );

          let compiledHiddenMemory = currentStory.hiddenMemory;
          try {
              const finalCompileText = `${activeChapter.title}:\n${activeChapter.content}\nTóm tắt chương: ${summary}`;
              compiledHiddenMemory = await geminiService.compileHiddenMemory(
                  currentStory.hiddenMemory,
                  finalCompileText,
                  "Người chơi đã chốt chương và đồng bộ hóa cốt truyện.",
                  currentStory.playerReminders
              );
          } catch (memErr) {
              console.error("Co-compiling memory failed in commitChapterState:", memErr);
          }
          
          const newStory = {
              ...currentStory,
              chapters: updatedChapters,
              characters: updatedChars,
              pinnedMemory: updatedPinnedMemory,
              hiddenMemory: compiledHiddenMemory
          };

          storyRef.current = newStory;
          setStory(newStory);
          await storageService.saveStory(newStory);
      } catch (e) {
          console.error("State Commit Error:", e);
      } finally {
          setIsGenerating(false);
      }
  };

  const deleteMemory = (id: string) => {
      setStory(prev => {
          if (!prev || !prev.pinnedMemory) return prev;
          return { ...prev, pinnedMemory: { ...prev.pinnedMemory, ledger: prev.pinnedMemory.ledger?.filter(m => m.id !== id) } };
      });
  };

  const clearLedger = () => {
    setStory(prev => { if (!prev || !prev.pinnedMemory) return prev; return { ...prev, pinnedMemory: { ...prev.pinnedMemory, ledger: [] } }; });
  };

  const extractAndSyncCharacters = async () => {
    const currentStory = storyRef.current;
    if (!currentStory || !activeChapterId) return;
    const chapter = currentStory.chapters.find(c => c.id === activeChapterId);
    if (!chapter || chapter.content.length < 100) return;
    setIsGenerating(true);
    try {
        const newChars = await geminiService.extractCharacters(chapter.content);
        const existingNames = new Set(currentStory.characters.map(c => c.name.toLowerCase()));
        const toAdd = newChars.filter(c => !existingNames.has(c.name.toLowerCase()));
        if (toAdd.length > 0) { setStory({ ...currentStory, characters: [...currentStory.characters, ...toAdd] }); }
    } catch (e) { console.error(e); } finally { setIsGenerating(false); }
  };

  const addCharacter = (char: Character) => { if (story) setStory({ ...story, characters: [...story.characters, char] }); };

  const generateCharacterAvatar = async (characterId: string) => {
      if (!story) return;
      const char = story.characters.find(c => c.id === characterId);
      if (!char) return;
      const imageUrl = await geminiService.generateCharacterImage(char, story.genre);
      if (imageUrl) {
          const updatedChars = story.characters.map(c => c.id === characterId ? { ...c, avatarUrl: imageUrl } : c);
          setStory({ ...story, characters: updatedChars });
      }
  };

  const addLore = (lore: LoreEntry) => { if (story) setStory({ ...story, lore: [...story.lore, lore] }); };
  const deleteLore = (id: string) => { if (story) setStory({ ...story, lore: story.lore.filter(l => l.id !== id) }); };
  const addItem = (item: ItemEntry) => { if (story) setStory({ ...story, items: [...story.items, item] }); };
  const deleteItem = (id: string) => { if (story) setStory({ ...story, items: story.items.filter(i => i.id !== id) }); };

  const extractAndSyncWorldInfo = async () => {
      if (!story || !activeChapterId) return;
      const chapter = story.chapters.find(c => c.id === activeChapterId);
      if (!chapter) return;
      setIsGenerating(true);
      try {
          const info = await geminiService.extractWorldInfo(chapter.content);
          setStory({ ...story, lore: [...story.lore, ...info.lore], items: [...story.items, ...info.items] });
      } catch (e) { console.error(e); } finally { setIsGenerating(false); }
  };

  const syncActiveChapter = async () => { if (story) await storageService.saveStory(story); };
  const updatePinnedMemory = async (memory: PinnedMemory) => { if (story) setStory({ ...story, pinnedMemory: memory }); };
  const updateStoryAttributes = async (attributes: StoryAttribute[]) => { if (story) setStory({ ...story, attributes }); };

  // --- REWRITTEN: ANALYZE HORNY TEXT (STRING ONLY) ---
  // Hàm này KHÔNG xử lý File object nữa, chỉ nhận String
  const analyzeHornyText = async (text: string) => {
      if (!story) return;
      
      if (!text || text.trim().length === 0) {
          console.error("Nội dung rỗng, không thể phân tích.");
          return;
      }

      setIsGenerating(true);
      
      try {
          // Chỉ gửi text thuần túy sang service
          const hornyStyle = await geminiService.analyzeHornyStyle(text);
          
          setStory(prev => {
              if (!prev) return null;
              const updatedStory = { ...prev, hornyStyle, isHornyActive: true };
              storageService.saveStory(updatedStory).catch(console.error);
              return updatedStory;
          });
          
      } catch (e: any) { 
          console.error("Critical Analysis Error:", e); 
          console.error("Lỗi AI Phân tích:", e); 
      } finally { 
          setIsGenerating(false); 
      }
  };

  const updateHornyStyle = async (style: Partial<HornyStyle>) => {
      if (!story || !story.hornyStyle) return;
      setStory(prev => {
          if (!prev) return null;
          return {
              ...prev,
              hornyStyle: { ...prev.hornyStyle!, ...style }
          };
      });
  };

  const toggleHorny = async (active: boolean) => { setStory(prev => prev ? { ...prev, isHornyActive: active } : null); };
  
  const resetHorny = async () => {
      setStory(prev => prev ? { ...prev, hornyStyle: undefined, isHornyActive: false } : null);
  };

  const updateSegmentConfig = async (config: Partial<SegmentConfig>) => { 
      if (!story) return;
      const currentConfig = story.segmentConfig || { isActive: false, beats: [], beatLengths: [], currentBeatIndex: 0, autoMode: false };
      setStory({ ...story, segmentConfig: { ...currentConfig, ...config } }); 
  };
  
  const autoGenerateBeats = async (summary: string) => {
      if (!story) return;
      setIsGenerating(true);
      try {
          const beats = await geminiService.suggestBeats(summary);
          if (beats.length > 0) {
              updateSegmentConfig({ beats: beats, beatLengths: new Array(beats.length).fill(0), currentBeatIndex: 0 });
          }
      } catch (e: any) {
          console.error(e);
      } finally {
          setIsGenerating(false);
      }
  };

  const saveProgress = async () => { if (story) await storageService.saveStory(story); };

  const exportStory = (id?: string) => {
      const target = id ? storiesList.find(s => s.id === id) : story;
      if (!target) return;
      try {
          const jsonString = JSON.stringify(target);
          const blob = new Blob([jsonString], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const downloadAnchorNode = document.createElement('a');
          downloadAnchorNode.setAttribute("href", url);
          downloadAnchorNode.setAttribute("download", `${target.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`);
          document.body.appendChild(downloadAnchorNode);
          downloadAnchorNode.click();
          downloadAnchorNode.remove();
          URL.revokeObjectURL(url);
      } catch (e) { console.error("Export failed:", e); }
  };

  const importStory = async (file: File) => {
      try {
          const text = await file.text();
          let rawData;
          try {
              rawData = JSON.parse(text);
          } catch (err) {
              try {
                  // Attempt to fix unescaped newlines inside strings.
                  // A simple heuristic: replace actual newlines with \n, 
                  // but we must not touch newlines outside of string literals.
                  // Since full parsing is complex, we'll try a rough fallback: 
                  // replace invisible control chars except newlines and tabs
                  let sanitizedText = text.replace(/[\u0000-\u0008\u000B-\u001F]+/g, ""); 
                  // Fix missing quotes on keys (naive approach, handles simple cases)
                  sanitizedText = sanitizedText.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
                  // Remove trailing commas
                  sanitizedText = sanitizedText.replace(/,\s*([}\]])/g, '$1');
                  
                  rawData = JSON.parse(sanitizedText);
              } catch (e2) {
                  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
                  if (codeBlockMatch && codeBlockMatch[1]) {
                      let block = codeBlockMatch[1].trim();
                      try {
                          rawData = JSON.parse(block);
                      } catch(e3) {
                          block = block.replace(/[\u0000-\u0008\u000B-\u001F]+/g, "");
                          block = block.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
                          block = block.replace(/,\s*([}\]])/g, '$1');
                          rawData = JSON.parse(block);
                      }
                  } else {
                      // One last desperate attempt: if there are literal unescaped newlines in a single-line string exported from AI
                      // We can try to use eval or Function to parse JS objects if JSON5 still fails, but since this is client-side 
                      // and runs in an iframe, let's just throw original.
                      throw err; 
                  }
              }
          }
          
          const safeStory: Story = { ...rawData, id: rawData.id || crypto.randomUUID(), createdAt: rawData.createdAt || Date.now() };
          await storageService.saveStory(safeStory);
          await loadStories();
          alert('Nhập dữ liệu thành công!');
      } catch (e) {
          console.error("Import failed:", e);
          const errMsg = e instanceof Error ? e.message : String(e);
          alert(`Lỗi khi nhập truyện: File JSON không hợp lệ hoặc bị hỏng.\nChi tiết: ${errMsg}`);
      }
  };

  const value = {
      story, storiesList, activeChapterId, characters: story?.characters || [], isGenerating, generatingChapterId, tokenStats, userInstruction, setUserInstruction, theme, toggleTheme, currentReasoning,
      loadStories, createStory, openStory, closeStory, deleteStory, updateStorySettings, selectChapter, addChapter, addSubChapter, deleteChapter, updateChapterContent, updateChapterTitle, updateChapterRating, generateContinue, stopGeneration,
      extractAndSyncCharacters, addCharacter, generateCharacterAvatar, addLore, deleteLore, addItem, deleteItem, extractAndSyncWorldInfo, syncActiveChapter,
      updatePinnedMemory, updateStoryAttributes, analyzeHornyText, updateHornyStyle, toggleHorny, resetHorny, updateSegmentConfig, autoGenerateBeats, saveProgress, exportStory, importStory, deleteMemory, clearLedger,
      analyzeCurrentChapter, commitChapterState, summarizeSpecificChapter, user
  };

  return <StoryContext.Provider value={value as any}>{children}</StoryContext.Provider>;
};

export const useStory = () => {
  const context = useContext(StoryContext);
  if (context === undefined) throw new Error('useStory must be used within a StoryProvider');
  return context;
};
