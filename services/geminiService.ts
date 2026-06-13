
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Character, PinnedMemory, LoreEntry, ItemEntry, StoryAttribute, HornyStyle, SegmentConfig, CharacterStatus, MemoryEntry, SceneState, VectorData } from "../types";
import { promptBuilderService } from "./promptBuilderService";
import { ragService } from "./ragService";

const savedKey = localStorage.getItem('gemini_api_key');
const savedProxy = localStorage.getItem('gemini_proxy_url');
const savedModel = localStorage.getItem('gemini_model');

const config: any = { apiKey: savedKey || process.env.API_KEY, httpOptions: { timeout: 300000 } };
if (savedProxy) config.baseUrl = savedProxy;

let ai = new GoogleGenAI(config);

let MODEL_PRO = savedModel || 'gemini-3.1-pro-preview';
let MODEL_EMBEDDING = 'text-embedding-004';
let MODEL_FLASH = savedModel || 'gemini-3.1-flash-preview'; 
let MODEL_IMAGE = 'gemini-2.5-flash-image';

if (!savedModel && savedProxy) {
    if (savedProxy.includes('openrouter.ai')) {
        MODEL_PRO = 'google/gemini-2.5-pro';
        MODEL_FLASH = 'google/gemini-2.5-flash';
    } else {
        MODEL_PRO = 'gpt-4o';
        MODEL_FLASH = 'gpt-4o-mini';
    }
}

const isUsingProxy = () => {
    const proxy = localStorage.getItem('gemini_proxy_url') || '';
    return proxy.trim().length > 0;
};

// ... replace isUsingProxy with isUsingProxy everywhere inside geminiService.ts

async function getMappedModel(model: string, proxyUrl: string): Promise<string> {
    let finalModel = model;
    if (proxyUrl.includes('openrouter.ai')) {
        if (finalModel.includes('gemini-3')) {
            finalModel = 'google/gemini-2.5-pro';
        } else if (!finalModel.includes('/') && finalModel.includes('gemini')) {
            finalModel = `google/${finalModel}`;
        } else if (!finalModel.includes('/') && finalModel.includes('claude')) {
            finalModel = `anthropic/${finalModel}`;
        }
    } else {
        // For non-OpenRouter proxies, pass through the model as-is, just strip provider prefixes if any
        if (finalModel.includes('/')) {
            finalModel = finalModel.split('/').pop() || finalModel;
        }
    }
    return finalModel;
}

function getNativeModel(model: string): string {
    let finalModel = model;
    if (finalModel.includes('/')) {
        finalModel = finalModel.split('/').pop() || finalModel;
    }
    if (finalModel.includes('gpt-') || finalModel.includes('claude')) {
        return 'gemini-3.1-pro-preview';
    }
    return finalModel;
}

async function generateContentOpenAI(model: string, contents: any, config?: any): Promise<any> {
    const key = localStorage.getItem('gemini_api_key') || '';
    let proxy = localStorage.getItem('gemini_proxy_url') || '';
    
    if (proxy.endsWith('/')) proxy = proxy.slice(0, -1);
    
    // Auto map base URLs (like gcli.ggchan.dev) to /v1
    if (!proxy.endsWith('/v1') && !proxy.includes('openrouter') && !proxy.includes('api')) {
        proxy += '/v1';
    }

    const mappedModel = await getMappedModel(model, proxy);

    let prompt = '';
    if (Array.isArray(contents)) {
        prompt = contents.map(c => c.parts.map((p: any) => p.text).join('\n')).join('\n');
    } else if (contents.parts) {
        prompt = contents.parts.map((p: any) => p.text).join('\n');
    }

    const messages = [];
    if (config?.systemInstruction) {
        messages.push({ role: "system", content: config.systemInstruction });
    }
    messages.push({ role: "user", content: prompt });

    const body: any = {
        model: mappedModel,
        messages: messages,
        max_tokens: config?.max_tokens !== undefined ? config.max_tokens : 8192
    };

    if (config?.temperature !== undefined) {
        body.temperature = config.temperature;
    }
    if (config?.top_p !== undefined) {
        body.top_p = config.top_p;
    }
    if (config?.top_k !== undefined) {
        body.top_k = config.top_k;
    }

    if (config?.isDeepThinkActive) {
        const savedReasoning = localStorage.getItem('gemini_reasoning_effort') || 'medium';
        if (proxy.includes('openrouter.ai') && (model.includes('claude-3-7') || model.includes('claude-opus-4-6'))) {
            let budget = 4000;
            if (savedReasoning === 'low') budget = 1024;
            else if (savedReasoning === 'high') budget = 16000;
            body.provider = {
                ...body.provider,
                thinking: { type: "enabled", budget_tokens: budget }
            };
        } else if (model.includes('o1') || model.includes('o3') || model.includes('deepseek-reasoner')) {
            body.reasoning_effort = savedReasoning;
        }
    }

    if (config?.responseMimeType === "application/json") {
        body.response_format = { type: "json_object" };
    }

    const headers: any = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
    };
    
    if (proxy.includes('openrouter.ai')) {
        headers['HTTP-Referer'] = window.location.href;
        headers['X-Title'] = 'AI Story Architect';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new Error("Request timed out after 300s")), 300000); // 300s timeout for background tasks

    try {
        const response = await fetch(`${proxy}/chat/completions`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body),
            signal: controller.signal
        });

        if (!response.ok) {
            const err = await response.text().catch(() => '');
            throw new Error(`OpenAI/OpenRouter error: ${response.status} ${err}`);
        }

        const data = await response.json();
        return { text: data.choices[0].message.content };
    } finally {
        clearTimeout(timeoutId);
    }
}

async function* generateContentStreamOpenAI(model: string, contents: any, config?: any) {
    const key = localStorage.getItem('gemini_api_key') || '';
    let proxy = localStorage.getItem('gemini_proxy_url') || '';
    
    if (proxy.endsWith('/')) proxy = proxy.slice(0, -1);
    // Auto map base URLs (like gcli.ggchan.dev) to /v1
    if (!proxy.endsWith('/v1') && !proxy.includes('openrouter') && !proxy.includes('api')) {
        proxy += '/v1';
    }
    
    const mappedModel = await getMappedModel(model, proxy);

    let prompt = '';
    if (Array.isArray(contents)) {
        prompt = contents.map(c => c.parts.map((p: any) => p.text).join('\n')).join('\n');
    } else if (contents.parts) {
        prompt = contents.parts.map((p: any) => p.text).join('\n');
    }

    const messages = [];
    if (config?.systemInstruction) {
        messages.push({ role: "system", content: config.systemInstruction });
    }
    messages.push({ role: "user", content: prompt });

    const body: any = {
        model: mappedModel,
        messages: messages,
        stream: true,
        max_tokens: config?.max_tokens !== undefined ? config.max_tokens : 8192
    };

    if (config?.temperature !== undefined) {
        body.temperature = config.temperature;
    }
    if (config?.top_p !== undefined) {
        body.top_p = config.top_p;
    }
    if (config?.top_k !== undefined) {
        body.top_k = config.top_k;
    }

    if (config?.isDeepThinkActive) {
        const savedReasoning = localStorage.getItem('gemini_reasoning_effort') || 'medium';
        if (proxy.includes('openrouter.ai') && (model.includes('claude-3-7') || model.includes('claude-opus-4-6'))) {
            let budget = 4000;
            if (savedReasoning === 'low') budget = 1024;
            else if (savedReasoning === 'high') budget = 16000;
            body.provider = {
                ...body.provider,
                thinking: { type: "enabled", budget_tokens: budget }
            };
        } else if (model.includes('o1') || model.includes('o3') || model.includes('deepseek-reasoner')) {
            body.reasoning_effort = savedReasoning;
        }
    }

    const headers: any = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
    };
    
    if (proxy.includes('openrouter.ai')) {
        headers['HTTP-Referer'] = window.location.href;
        headers['X-Title'] = 'AI Story Architect';
    }

    const controller = new AbortController();
    geminiService.streamController = controller;

    try {
        const response = await fetch(`${proxy}/chat/completions`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body),
            signal: controller.signal
        });

        if (!response.ok) {
            const err = await response.text().catch(() => '');
            throw new Error(`OpenAI/OpenRouter error: ${response.status} ${err}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error("No reader");

        try {
            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const data = JSON.parse(line.slice(6));
                            const delta = data.choices?.[0]?.delta;
                            if (delta) {
                                if (delta.content) {
                                    yield { text: delta.content };
                                }
                                if (delta.reasoning_content) {
                                    yield { reasoning: delta.reasoning_content };
                                }
                            }
                        } catch (e) {}
                    }
                }
            }
        } finally {
            reader.cancel().catch(() => {});
        }
    } finally {
        if (geminiService.streamController === controller) {
            geminiService.streamController = null;
        }
    }
}

// Bỏ chặn toàn bộ Safety Settings
const SAFETY_SETTINGS_BLOCK_NONE: any = [
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function cleanJson(text: string): string {
    if (!text) return "{}";
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
        return codeBlockMatch[1].trim();
    }
    const firstOpenBrace = text.indexOf('{');
    const lastCloseBrace = text.lastIndexOf('}');
    if (firstOpenBrace !== -1 && lastCloseBrace !== -1 && lastCloseBrace > firstOpenBrace) {
        return text.substring(firstOpenBrace, lastCloseBrace + 1).trim();
    }
    return text.trim();
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, initialDelay = 3000): Promise<T> {
    let currentDelay = initialDelay;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            const isRateLimit = error?.status === 429 || error?.code === 429 || (error?.message && error.message.includes('429')) || (error?.message && error.message.includes('quota')) || error?.status === 'RESOURCE_EXHAUSTED';
            const isNetworkError = error?.name === 'TypeError' || error?.message?.includes('Failed to fetch') || error?.message?.includes('network error') || error?.message?.includes('Load failed') || error?.message?.includes('timed out') || error?.name === 'AbortError';

            if (isRateLimit || isNetworkError) {
                if (i === retries - 1) throw error;
                await delay(isNetworkError ? 1000 : currentDelay); // Shorter delay for socket/network errors
                if (isRateLimit) currentDelay *= 2; 
                continue;
            }
            throw error;
        }
    }
    throw new Error("Request failed after retries");
}

export const geminiService = {
  streamController: null as AbortController | null,
  
  abortStream() {
      if (this.streamController) {
          this.streamController.abort();
          this.streamController = null;
      }
  },

  setConfig(apiKey: string, baseUrl?: string, model?: string) {
    const newConfig: any = { apiKey: apiKey || process.env.API_KEY, httpOptions: { timeout: 300000 } };
    if (baseUrl) newConfig.baseUrl = baseUrl;
    ai = new GoogleGenAI(newConfig);
    if (model) {
       MODEL_PRO = model;
       MODEL_FLASH = model;
    } else {
       if (baseUrl?.includes('openrouter.ai')) {
           MODEL_PRO = 'google/gemini-2.5-pro';
           MODEL_FLASH = 'google/gemini-2.5-flash';
       } else if (baseUrl) {
           MODEL_PRO = 'gpt-4o';
           MODEL_FLASH = 'gpt-4o-mini';
       } else {
           MODEL_PRO = 'gemini-3.1-pro-preview';
           MODEL_FLASH = 'gemini-3.1-flash-preview';
       }
    }
  },
  
  async embedText(text: string): Promise<number[]> {
    if (!text || typeof text !== 'string') return [];
    
    const key = localStorage.getItem('gemini_api_key') || process.env.API_KEY || '';
    let proxy = localStorage.getItem('gemini_proxy_url') || '';
    
    if (isUsingProxy() && proxy) {
        if (proxy.endsWith('/')) proxy = proxy.slice(0, -1);
        if (!proxy.endsWith('/v1') && !proxy.includes('openrouter') && !proxy.includes('api')) {
            proxy += '/v1';
        }
        
        let embeddingModel = 'text-embedding-3-small';
        if (proxy.includes('openrouter.ai')) {
            embeddingModel = 'google/text-embedding-004';
        }
        
        const headers: any = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
        };
        
        try {
            const response = await fetch(`${proxy}/embeddings`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    model: embeddingModel,
                    input: text.trim()
                })
            });
            if (response.ok) {
                const data = await response.json();
                if (data.data && data.data[0] && Array.isArray(data.data[0].embedding)) {
                    return data.data[0].embedding;
                }
            } else {
                console.warn(`[Proxy Embedding] failed with status ${response.status}`);
            }
        } catch (err) {
            console.error("[Proxy Embedding] fetch error:", err);
        }
        return [];
    }
    
    try {
      const response = await withRetry(() => ai.models.embedContent({
        model: getNativeModel(MODEL_EMBEDDING), 
        contents: text.trim()
      })) as any;
      return response.embedding?.values || [];
    } catch (e) { return []; }
  },

  async indexMemoryEntry(memory: MemoryEntry): Promise<VectorData | null> {
      if (!memory.content) return null;
      const richText = `[FACT] Entities: ${memory.entities?.join(', ') || 'None'}. Content: ${memory.content}`;
      const embedding = await this.embedText(richText);
      if (embedding.length > 0) {
          return {
              id: `mem_vec_${memory.id}`,
              text: memory.content,
              embedding: embedding,
              metadata: { 
                  type: 'memory_fact', 
                  referenceId: memory.id,
                  importance: memory.importance,
                  entities: memory.entities
              }
          };
      }
      return null;
  },

  async indexChapterSummary(chapterId: string, summary: string, title: string): Promise<VectorData | null> {
      if (!summary) return null;
      const richText = `[PLOT NODE] Chapter: ${title}. Summary: ${summary}`;
      const embedding = await this.embedText(richText);
      if (embedding.length > 0) {
          return {
              id: `plot_vec_${chapterId}`,
              text: summary,
              embedding: embedding,
              metadata: { 
                  type: 'plot_node', 
                  referenceId: chapterId 
              }
          };
      }
      return null;
  },

  async indexChapterContent(chapterId: string, content: string): Promise<VectorData[]> {
      const chunks = ragService.chunkText(content, 1000, 200); 
      const vectors: VectorData[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          if (chunk.length < 50) continue;
          const embedding = await this.embedText(chunk);
          if (embedding.length > 0) {
              vectors.push({
                  id: `${chapterId}_chunk_${i}`,
                  text: chunk,
                  embedding: embedding,
                  metadata: { type: 'chapter', referenceId: chapterId }
              });
          }
      }
      return vectors;
  },
  
  async indexLoreEntry(lore: LoreEntry): Promise<VectorData | null> {
      if (!lore.content) return null;
      const embedding = await this.embedText(`[LORE] ${lore.name}: ${lore.content}`);
      if (embedding.length > 0) {
          return {
              id: `lore_vec_${lore.id}`,
              text: lore.content,
              embedding: embedding,
              metadata: { type: 'lore', referenceId: lore.id, entities: [lore.name] }
          };
      }
      return null;
  },

  async indexItemEntry(item: ItemEntry): Promise<VectorData | null> {
      if (!item.description) return null;
      const embedding = await this.embedText(`[ITEM] ${item.name} (${item.type}): ${item.description}`);
      if (embedding.length > 0) {
          return {
              id: `item_vec_${item.id}`,
              text: item.description,
              embedding: embedding,
              metadata: { type: 'item', referenceId: item.id, entities: [item.name] }
          };
      }
      return null;
  },

  async scanStoryState(text: string, characters: Character[]): Promise<{ charStatus: { [key: string]: CharacterStatus }, scene: SceneState }> {
       return { charStatus: {}, scene: { time: "Không rõ", weather: "Không rõ", location: "Không rõ", timeline: "present" } }; 
  },

  async analyzeChapterEvents(content: string, characters: Character[]): Promise<{ summary: string, charStatus: { [key: string]: CharacterStatus } }> {
      const charNames = characters.map(c => c.name).join(", ");
      const prompt = `Đọc chương truyện vừa viết và thực hiện 2 nhiệm vụ:
      1. TÓM TẮT BIÊN NIÊN SỬ (Chronicle Summary): Tóm tắt ngắn gọn các sự kiện chính ảnh hưởng đến cốt truyện dài hạn.
      2. TRẠNG THÁI (State): Trả về mảng trạng thái cuối cùng của các nhân vật: ${charNames}.
      `;
      
      try {
          let response;
          if (isUsingProxy()) {
              response = await withRetry(() => generateContentOpenAI(MODEL_FLASH, { parts: [{ text: prompt }, { text: `NỘI DUNG CHƯƠNG:\n${content.slice(-50000000)}` }] }, { responseMimeType: "application/json" }));
          } else {
              response = await withRetry(() => ai.models.generateContent({
                  model: getNativeModel(MODEL_FLASH), 
                  contents: { parts: [{ text: prompt }, { text: `NỘI DUNG CHƯƠNG:\n${content.slice(-50000000)}` }] },
                  config: { 
                      responseMimeType: "application/json",
                      safetySettings: SAFETY_SETTINGS_BLOCK_NONE,
                      responseSchema: {
                          type: Type.OBJECT,
                          properties: {
                              summary: { type: Type.STRING },
                              characterStates: {
                                  type: Type.ARRAY,
                                  items: {
                                      type: Type.OBJECT,
                                      properties: {
                                          name: { type: Type.STRING },
                                          emotion: { type: Type.STRING },
                                          mentalState: { type: Type.STRING },
                                          physicalCondition: { type: Type.STRING },
                                          location: { type: Type.STRING },
                                          immediateGoal: { type: Type.STRING }
                                      },
                                      required: ["name", "emotion", "physicalCondition", "location"]
                                  }
                              }
                          },
                          required: ["summary", "characterStates"]
                      }
                  }
              })) as GenerateContentResponse;
          }
          
          const rawText = response.text || "{}";
          const data = JSON.parse(cleanJson(rawText));
          
          const charStatusMap: { [key: string]: CharacterStatus } = {};
          if (data.characterStates && Array.isArray(data.characterStates)) {
              data.characterStates.forEach((state: any) => {
                  if (state.name) {
                      charStatusMap[state.name] = {
                          emotion: state.emotion || "Không rõ",
                          mentalState: state.mentalState || "Bình thường",
                          physicalCondition: state.physicalCondition || "Khỏe mạnh",
                          location: state.location || "Không rõ",
                          immediateGoal: state.immediateGoal || ""
                      };
                  }
              });
          }

          return {
              summary: data.summary || "Không có tóm tắt.",
              charStatus: charStatusMap
          };
      } catch (e: any) {
          console.error("Analyze Error:", e);
          return { summary: `Lỗi phân tích: ${e.message || "Unknown error"}`, charStatus: {} };
      }
  },

  async analyzeHornyStyle(fullText: string): Promise<HornyStyle> {
      const MAX_LENGTH = 30000;
      let processedText = fullText.replace(/\r\n/g, "\n").replace(/\x00/g, "");

      if (processedText.length > MAX_LENGTH) {
          const start = processedText.slice(0, 10000);
          const middle = processedText.slice(Math.floor(processedText.length / 2) - 5000, Math.floor(processedText.length / 2) + 5000);
          const end = processedText.slice(processedText.length - 10000);
          processedText = `${start}\n\n[...OMITTED...]\n\n${middle}\n\n[...OMITTED...]\n\n${end}`;
      }

      const prompt = `System Task: Literary Style Analysis (DNA Extraction).
      
      Phân tích phong cách văn học (Writing Style DNA) từ đoạn văn mẫu dưới đây.
      Hãy trích xuất các đặc điểm cốt lõi để AI có thể bắt chước (mimic) phong cách này.
      
      OUTPUT FORMAT: JSON ONLY.
      {
        "pacing": "Nhịp điệu kể chuyện (Nhanh/Chậm/Dồn dập/Từ tốn)",
        "narrativeVoice": "Giọng văn (Ngôi kể, thái độ người kể)",
        "emotionalTone": "Tone cảm xúc chủ đạo (Lạnh lùng, Ướt át, Hài hước...)",
        "description": "Mô tả ngắn gọn về đặc trưng văn phong này (khoảng 1-2 câu)",
        "vocabularyComplexity": "Đặc trưng từ vựng (Dùng nhiều từ Hán Việt, hay từ lóng, từ hoa mỹ...)",
        "writingSample": "Trích dẫn lại một đoạn ngắn tiêu biểu nhất (khoảng 300-500 ký tự) từ văn bản gốc để làm mẫu."
      }

      INPUT TEXT:
      """
      ${processedText}
      """`;

      try {
          let response;
          if (isUsingProxy()) {
              response = await withRetry(() => generateContentOpenAI(MODEL_FLASH, { parts: [{ text: prompt }] }, { temperature: 0.1, responseMimeType: "application/json" }));
          } else {
              response = await withRetry(() => ai.models.generateContent({
                  model: getNativeModel(MODEL_FLASH), 
                  contents: { parts: [{ text: prompt }] },
                  config: { 
                      temperature: 0.1, 
                      responseMimeType: "application/json",
                      safetySettings: SAFETY_SETTINGS_BLOCK_NONE, 
                      responseSchema: {
                          type: Type.OBJECT,
                          properties: {
                              pacing: { type: Type.STRING },
                              narrativeVoice: { type: Type.STRING },
                              emotionalTone: { type: Type.STRING },
                              description: { type: Type.STRING },
                              writingSample: { type: Type.STRING },
                              vocabularyComplexity: { type: Type.STRING }
                          },
                          required: ["pacing", "narrativeVoice", "description", "writingSample", "emotionalTone"] 
                      }
                  }
              })) as GenerateContentResponse;
          }
          
          const rawText = response.text || "{}";
          const raw = JSON.parse(cleanJson(rawText));
          
          return {
              pacing: raw.pacing || "Bình thường",
              narrativeVoice: raw.narrativeVoice || "Ngôi thứ 3",
              emotionalTone: raw.emotionalTone || "Tự nhiên",
              description: raw.description || "Không xác định được phong cách.",
              writingSample: raw.writingSample || processedText.slice(0, 500),
              vocabularyComplexity: raw.vocabularyComplexity || "Thông dụng",
              styleStrength: 100,
              isAnalyzed: true
          };

      } catch (e: any) {
          console.error("Horny Analysis Failed:", e);
          throw new Error(`Lỗi AI: ${e.message || "Không thể phân tích văn bản"}`);
      }
  },

  async *generateStoryStream(
    immediateContext: string,
    rollingSummaries: string,
    worldBible: string,
    augmentedContext: string,
    synopsis: string,
    characters: Character[],
    pinnedMemory: PinnedMemory | undefined,
    genre: string,
    storyElements: string | undefined,
    theme: string | undefined,
    writingStyle: string,
    pov: string,
    pronounStyle: string,
    negativePrompt: string,
    nsfw: boolean,
    userInstruction: string,
    fandom?: string,
    targetLength: number = 1000,
    attributes: StoryAttribute[] = [],
    povCharacter?: string,
    hornyStyle?: HornyStyle,
    isHornyActive?: boolean,
    segmentConfig?: SegmentConfig,
    sceneState?: SceneState,
    previousChapterContent?: string,
    relevantContext?: string,
    relevantLore?: LoreEntry[],
    relevantItems?: ItemEntry[],
    globalPlot?: string,
    currentChapterTitle?: string,
    isDeepThinkActive?: boolean,
    temperature?: number,
    maxOutputTokens?: number,
    topP?: number,
    topK?: number,
    thinkingLevel?: 'HIGH'|'LOW',
    hiddenMemory?: string,
    isGoogleSearchActive?: boolean,
    playerReminders?: string
  ) {
    const prompt = promptBuilderService.buildContinuePrompt(
      immediateContext, rollingSummaries, worldBible, augmentedContext, synopsis, characters, pinnedMemory, userInstruction, pronounStyle, fandom, targetLength, attributes, povCharacter, hornyStyle, isHornyActive, segmentConfig, sceneState, previousChapterContent, relevantContext, relevantLore, relevantItems, globalPlot, currentChapterTitle, isDeepThinkActive, hiddenMemory, playerReminders
    );
    const systemInstruction = promptBuilderService.buildSystemInstruction(
        genre, storyElements, theme, worldBible, pov, pronounStyle, writingStyle, negativePrompt, nsfw, fandom, targetLength, hornyStyle, isHornyActive, isDeepThinkActive
    );
    
    // ADJUST TEMPERATURE:
    // User value if supplied, otherwise defaults:
    // Normal: 0.7 (Safe, Stable)
    // Horny Mode: 0.85 (Slightly reduced from 0.9 to prevent logic drift)
    const activeTemperature = temperature !== undefined ? temperature : ((isHornyActive || nsfw) ? 0.85 : 0.7);

    // AUTO MODEL ROUTING ("tự động chọn mô hình phù hợp dựa trên yêu cầu của người dùng")
    let activeModel = MODEL_PRO;
    
    if (!isUsingProxy()) {
        // Native Gemini API - strip prefixes if any
        if (activeModel.includes('/')) {
            activeModel = activeModel.split('/').pop() || activeModel;
        }
    }

    const instructionLower = userInstruction?.toLowerCase() || "";
    
    // Auto-Routing Rules removed to respect user's selected explicit model.
    try {
      if (isUsingProxy()) {
          const proxyConfig: any = { systemInstruction: systemInstruction, temperature: activeTemperature, isDeepThinkActive };
          if (topP !== undefined) proxyConfig.top_p = topP;
          if (topK !== undefined) proxyConfig.top_k = topK;
          if (maxOutputTokens !== undefined) proxyConfig.max_tokens = Math.min(8192, maxOutputTokens);

          const responseStream = (await withRetry(() => generateContentStreamOpenAI(activeModel, [{ parts: [{ text: prompt }] }], proxyConfig) as any)) as AsyncGenerator<any, void, unknown>;
          for await (const chunk of responseStream) {
              yield { text: chunk.text, reasoning: chunk.reasoning, usageMetadata: null };
          }
      } else {
          const configObj: any = {
              systemInstruction: systemInstruction,
              temperature: activeTemperature, 
              maxOutputTokens: maxOutputTokens !== undefined ? Math.min(8192, maxOutputTokens) : 8192,
              safetySettings: SAFETY_SETTINGS_BLOCK_NONE,
          };
          if (topP !== undefined) configObj.topP = topP;
          if (topK !== undefined) configObj.topK = topK;

          if (isGoogleSearchActive) {
              configObj.tools = [{ googleSearch: {} }];
          }

          if (isDeepThinkActive && (activeModel.includes('gemini-3') || activeModel.includes('gemini-2.5-pro'))) {
              configObj.thinkingConfig = { 
                  thinkingLevel: thinkingLevel === 'LOW' ? "STANDARD" : "HIGH"
              };
              if (maxOutputTokens && maxOutputTokens > 1024) {
                  configObj.thinkingConfig.thinkingBudget = Math.min(300000, maxOutputTokens - 1024);
              }
              // Set the thinking budget if High
          }
          const responseStream = await withRetry(() => ai.models.generateContentStream({
            model: getNativeModel(activeModel),
            contents: [{ parts: [{ text: prompt }] }],
            config: configObj
          })) as any;
          for await (const chunk of responseStream) {
            const c = chunk as any;
            
            let chunkText = "";
            let chunkThought = "";
            
            try { chunkText = c.text || ""; } catch (e) {}
            try { chunkThought = c.thought || ""; } catch (e) {}

            yield { 
                text: chunkText, 
                reasoning: chunkThought, // Capture Gemini's thought process
                usageMetadata: c.usageMetadata 
            };
          }
      }
    } catch (e: any) { throw e; }
  },

  async suggestBeats(summary: string): Promise<string[]> {
    const prompt = `Dựa vào tóm tắt sau, hãy lập một Dàn ý Chương (Outline) gồm 5-8 bước (Beats) để viết truyện.
    TÓM TẮT: "${summary}"
    TRẢ VỀ JSON ARRAY STRING: ["Beat 1...", "Beat 2...", ...]`;

    try {
      let response;
      if (isUsingProxy()) {
          response = await withRetry(() => generateContentOpenAI(MODEL_FLASH, { parts: [{ text: prompt }] }, { responseMimeType: "application/json" }));
      } else {
          response = await withRetry(() => ai.models.generateContent({
            model: getNativeModel(MODEL_FLASH),
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS_BLOCK_NONE,
            }
          })) as GenerateContentResponse;
      }
      
      const beats = JSON.parse(cleanJson(response.text || "[]"));
      return Array.isArray(beats) ? beats : [];
    } catch (e) {
      return [];
    }
  },

  async extractCharacters(text: string): Promise<Character[]> {
    const prompt = `Trích xuất nhân vật chi tiết. TRẢ VỀ JSON ARRAY.`;
    try {
      let response;
      if (isUsingProxy()) {
          response = await withRetry(() => generateContentOpenAI(MODEL_PRO, { parts: [{ text: prompt }, { text: `Văn bản:\n${text}` }] }, { responseMimeType: "application/json" }));
      } else {
          response = await withRetry(() => ai.models.generateContent({
            model: getNativeModel(MODEL_PRO),
            contents: { parts: [{ text: prompt }, { text: `Văn bản:\n${text}` }] },
            config: { 
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS_BLOCK_NONE
            }
          })) as GenerateContentResponse;
      }
      return JSON.parse(cleanJson(response.text || "[]")).map((c: any, i: number) => ({ ...c, id: `char_${Date.now()}_${i}` }));
    } catch (e) { return []; }
  },

  async extractWorldInfo(text: string): Promise<{ lore: LoreEntry[], items: ItemEntry[] }> {
    const prompt = `Trích xuất Lore và Items. Trả về JSON { "lore": [], "items": [] }.`;
    try {
      let response;
      if (isUsingProxy()) {
          response = await withRetry(() => generateContentOpenAI(MODEL_PRO, { parts: [{ text: prompt }, { text: `Văn bản:\n${text}` }] }, { responseMimeType: "application/json" }));
      } else {
          response = await withRetry(() => ai.models.generateContent({
            model: getNativeModel(MODEL_PRO),
            contents: { parts: [{ text: prompt }, { text: `Văn bản:\n${text}` }] },
            config: { 
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS_BLOCK_NONE
            }
          })) as GenerateContentResponse;
      }
      const data = JSON.parse(cleanJson(response.text || "{}"));
      return { 
          lore: (data.lore || []).map((l: any, i: any) => ({ ...l, id: `lore_auto_${Date.now()}_${i}` })), 
          items: (data.items || []).map((it: any, i: any) => ({ ...it, id: `item_auto_${Date.now()}_${i}` })) 
      };
    } catch (e) { return { lore: [], items: [] }; }
  },

  async compileHiddenMemory(previousMemory: string | undefined, newText: string, userInstruction?: string, playerReminders?: string): Promise<string> {
    const prompt = `Đây là giao thức Cập Nhật Trí Nhớ ẨN (Hidden Memory Protocol) của AI.
Bạn là trung tâm lưu trữ logic hệ thống. Nhiệm vụ của bạn là đọc phần Trí nhớ cũ, Chỉ thị của người dùng ở lượt vừa đánh, và Văn bản mới viết thêm, sau đó HỢP NHẤT, LOẠI BỎ TRÙNG LẶP, CẬP NHẬT để tạo ra một Bản tóm lược logic toàn thư (AI Ledger).
Bản tóm lược này là "não bộ" của AI để KHÔNG BAO GIỜ QUÊN sự kiện, quy tắc, thiết lập đặc biệt, chi tiết cá nhân nhân vật, trạng thái quan hệ hay mạch truyện dù bị đổi model.

Trí nhớ cũ:
"""
${previousMemory || "Chưa có trí nhớ cũ."}
"""

Chỉ thị của người dùng (từ lượt viết vừa rồi):
"""
${userInstruction || "Không có chỉ thị đặc biệt."}
"""

Nhắc nhở cố định/Cảnh báo từ người chơi (Các điểm AI từng quên hoặc viết sai ý):
"""
${playerReminders || "Không có nhắc nhở cố định nào."}
"""

Văn bản viết thêm:
"""
${newText}
"""

YÊU CẦU QUAN TRỌNG NHẤT:
1. GHI ĐÈ / SỬA ĐỔI: Nếu Văn bản viết thêm hoặc Nhắc nhở của người chơi có tình tiết làm thay đổi trạng thái từ Trí nhớ cũ (vd: nhân vật chuyển từ buồn sang vui, chuyển từ nơi này sang nơi khác), hãy cập nhật trạng thái mới nhất và XÓA trạng thái lỗi thời.
2. THÊM MỚI TÍCH LŨY: Thêm các sự kiện, quy tắc, tài sản, mối quan hệ mới xuất hiện. Giữ lại các sự kiện cũ vẫn còn giá trị lịch sử. ĐẶC BIỆT: Đọc kỹ "Chỉ thị của người dùng" và "Nhắc nhở từ người chơi", nếu trong đó có các QUY ĐỊNH, LUẬT LỆ MỚI, YÊU CẦU DÀI HẠN, hay THIẾT LẬP NHÂN VẬT mới (vd: "từ nay nhân vật bị câm", "hãy xưng hô là..."), bạn BẮT BUỘC phải lưu nó vào mục [QUY TẮC & LƯU Ý ĐẶC BIỆT] để các lượt sinh sau không bị quên.
3. KHÔNG TRÙNG LẶP: Nếu một sự kiện hoặc trạng thái trong Văn bản viết thêm đã được ghi nhận trong Trí nhớ cũ, tuyệt đối KHÔNG ghi lại lần 2.
4. NGẮN GỌN & MANG TÍNH DỮ LIỆU: Việc này máy đọc, không phải người đọc. Viết như một bản ghi cơ sở dữ liệu (Database Record), sử dụng gạch đầu dòng, từ khóa chính. 
5. GIỚI HẠN ĐỘ DÀI: Đảm bảo toàn bộ kết quả phải ngắn gọn dưới 2000 từ. Hãy cô đọng tối đa.

Trả về DUY NHẤT nội dung trí nhớ đã cập nhật (KHÔNG MỞ ĐẦU, KHÔNG KẾT LUẬN, KHÔNG FORMAT THEO MARKDOWN NẾU KHÔNG CẦN THIẾT HOẶC CỨ TRẢ LUÔN). Hãy chia làm các mục rõ ràng:
[QUY TẮC & LƯU Ý ĐẶC BIỆT]: (Các yêu cầu định dạng, luật lệ từ người dùng cần phải nhớ dài hạn)
[BIÊN NIÊN SỬ - CÁC SỰ KIỆN CHÍNH]: (Liệt kê theo trình tự thời gian, nguyên nhân - kết quả)
[TRẠNG THÁI NHÂN VẬT]: (Vị trí hiện tại, thể trạng thực tế, vết thương, tâm lý, động cơ của từng người xuất hiện)
[SỞ HỮU & VẬT PHẨM]: (Ai đang giữ item gì quan trọng)
[QUAN HỆ & THÁI ĐỘ]: (Các nhân vật nghĩ gì về nhau, tiến triển tình cảm/thù hận)
[PLOT ĐANG MỞ & BÍ ẨN]: (Xung đột chưa giải quyết, dự định sắp tới)
[THẾ GIỚI & LORE ĐƯỢC HÉ LỘ]: (Những chi tiết mới về bối cảnh, luật lệ thế giới vừa xuất hiện)`;

    try {
        let response;
        if (isUsingProxy()) {
            response = await withRetry(() => generateContentOpenAI(MODEL_PRO, [{ parts: [{ text: prompt }] }]));
        } else {
            response = await withRetry(() => ai.models.generateContent({ 
                model: getNativeModel(MODEL_PRO), 
                contents: [{ parts: [{ text: prompt }] }],
                config: { safetySettings: SAFETY_SETTINGS_BLOCK_NONE }
            })) as GenerateContentResponse;
        }
        return response.text || previousMemory || "";
    } catch (e) { 
        console.error("compileHiddenMemory failed", e);
        return previousMemory || ""; 
    }
  },

  async summarize(text: string): Promise<string> {
    const prompt = promptBuilderService.buildSummaryPrompt(text);
    try {
        let response;
        if (isUsingProxy()) {
            response = await withRetry(() => generateContentOpenAI(MODEL_PRO, [{ parts: [{ text: prompt }] }]));
        } else {
            response = await withRetry(() => ai.models.generateContent({ 
                model: getNativeModel(MODEL_PRO), 
                contents: [{ parts: [{ text: prompt }] }],
                config: { safetySettings: SAFETY_SETTINGS_BLOCK_NONE }
            })) as GenerateContentResponse;
        }
        return response.text || "";
    } catch (e) { return ""; }
  },

  async consolidateMemories(text: string): Promise<any[]> {
    const prompt = `Bạn là "Memory Encoder". Hãy trích xuất các sự kiện/thông tin quan trọng từ đoạn văn.
    YÊU CẦU:
    1. Chỉ trích xuất SỰ KIỆN MỚI hoặc THÔNG TIN MỚI.
    2. Chấm điểm Importance (1-10). 10 = Cực quan trọng (Chết người, Bí mật lộ ra). 1 = Vặt vãnh.
    3. Entities: Liệt kê tên Nhân vật hoặc Địa danh liên quan đến sự kiện này.
    
    TRẢ VỀ JSON ARRAY.`;
    try {
      let response;
      if (isUsingProxy()) {
          response = await withRetry(() => generateContentOpenAI(MODEL_FLASH, { parts: [{ text: prompt }, { text: `Văn bản:\n${text}` }] }, { responseMimeType: "application/json" }));
      } else {
          response = await withRetry(() => ai.models.generateContent({
            model: getNativeModel(MODEL_FLASH),
            contents: { parts: [{ text: prompt }, { text: `Văn bản:\n${text}` }] },
            config: { 
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS_BLOCK_NONE,
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            content: { type: Type.STRING },
                            category: { type: Type.STRING },
                            importance: { type: Type.INTEGER },
                            entities: { type: Type.ARRAY, items: { type: Type.STRING } } 
                        },
                        required: ["content", "category", "importance"]
                    }
                }
            }
          })) as GenerateContentResponse;
      }
      return JSON.parse(cleanJson(response.text || "[]"));
    } catch (e) { return []; }
  },

  async generateCharacterImage(character: Character, genre: string): Promise<string | null> {
    const key = localStorage.getItem('gemini_api_key') || process.env.API_KEY || '';
    let proxy = localStorage.getItem('gemini_proxy_url') || '';
    const prompt = `Portrait: ${character.name}, ${character.appearance}. ${genre}. High detail.`;
    
    if (isUsingProxy() && proxy) {
        if (proxy.endsWith('/')) proxy = proxy.slice(0, -1);
        if (!proxy.endsWith('/v1') && !proxy.includes('openrouter') && !proxy.includes('api')) {
            proxy += '/v1';
        }
        
        let imageModel = 'stabilityai/stable-diffusion-xl';
        if (!proxy.includes('openrouter.ai')) {
            imageModel = 'dall-e-3';
        }
        
        const headers: any = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
        };
        
        try {
            const response = await fetch(`${proxy}/images/generations`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    model: imageModel,
                    prompt: prompt,
                    n: 1,
                    size: "1024x1024"
                })
            });
            if (response.ok) {
                const data = await response.json();
                if (data.data && data.data[0]) {
                    if (data.data[0].b64_json) {
                        return `data:image/png;base64,${data.data[0].b64_json}`;
                    } else if (data.data[0].url) {
                        return data.data[0].url;
                    }
                }
            } else {
                console.warn(`[Proxy Image Gen] failed with status ${response.status}`);
            }
        } catch (err) {
            console.error("[Proxy Image Gen] fetch error:", err);
        }
        return null;
    }

    try {
        const response = await withRetry(() => ai.models.generateContent({ 
            model: getNativeModel(MODEL_IMAGE), 
            contents: { parts: [{ text: prompt }] }, 
        })) as GenerateContentResponse;
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
        return null;
    } catch (e) { return null; }
  },

  async analyzeFandom(fandom: string, sourceUrl: string, genres: string[]): Promise<any> {
    const prompt = `Phân tích fandom "${fandom}" (${sourceUrl}). Cung cấp thiết lập thế giới, xưng hô và nhân vật canon. Trả về JSON.`;
    try {
      let response;
      if (isUsingProxy()) {
          response = await withRetry(() => generateContentOpenAI(MODEL_PRO, [{ parts: [{ text: prompt }] }]));
      } else {
          response = await withRetry(() => ai.models.generateContent({
            model: getNativeModel(MODEL_PRO),
            contents: [{ parts: [{ text: prompt }] }],
            config: { tools: [{ googleSearch: {} }] }
          })) as GenerateContentResponse;
      }
      return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
  }
};
