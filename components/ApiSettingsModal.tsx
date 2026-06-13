import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { motion } from 'motion/react';
import { Settings, X, ShieldCheck, AlertCircle, Save, KeyRound, Globe, Zap } from 'lucide-react';

interface ApiSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({ isOpen, onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [proxyUrl, setProxyUrl] = useState('');
    const [model, setModel] = useState('');
    const [reasoningEffort, setReasoningEffort] = useState<'low' | 'medium' | 'high'>('medium');
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [checkStatus, setCheckStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [isCustomModel, setIsCustomModel] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const savedKey = localStorage.getItem('gemini_api_key') || '';
            const savedProxy = localStorage.getItem('gemini_proxy_url') || '';
            const savedModel = localStorage.getItem('gemini_model') || '';
            const savedReasoning = localStorage.getItem('gemini_reasoning_effort') as any || 'medium';
            
            setApiKey(savedKey);
            setProxyUrl(savedProxy);
            setModel(savedModel);
            setReasoningEffort(savedReasoning);
            
            if (savedProxy && savedKey) {
                // Optionally auto-check or just leave it
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCheck = async () => {
        if (!apiKey) {
            setCheckStatus('error');
            setErrorMessage('Vui lòng nhập API Key.');
            return;
        }

        setIsChecking(true);
        setCheckStatus('idle');
        setErrorMessage('');

        try {
            // Remove trailing slash, default to official endpoint if empty
            const cleanProxyUrl = proxyUrl ? proxyUrl.replace(/\/$/, '') : 'https://generativelanguage.googleapis.com';
            
            // Helper to retry once to bypass stale browser TCP connections after waking from sleep
            const fetchWithRetry = async (url: string, options: any) => {
                try {
                    return await fetch(url, options);
                } catch (e: any) {
                    if (e.name === 'AbortError') throw e;
                    console.warn("Fetch failed, retrying to avoid stale connection...", e);
                    return await fetch(url, options);
                }
            };

            let response;
            let data;
            let modelNames: string[] = [];
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // Tăng timeout lên 15s

            try {
                // Heuristic detection
                if (cleanProxyUrl.includes('openrouter.ai')) {
                    // OpenRouter specific check
                    response = await fetchWithRetry(`${cleanProxyUrl}/auth/key`, {
                        headers: { 'Authorization': `Bearer ${apiKey}` },
                        signal: controller.signal
                    });
                    await response.text().catch(() => {});
                    
                    modelNames = [
                        'google/gemini-3.1-pro-preview',
                        'google/gemini-3.1-flash',
                        'google/gemini-2.5-pro',
                        'google/gemini-2.5-flash',
                        'anthropic/claude-3.7-sonnet',
                        'anthropic/claude-3.5-sonnet',
                        'anthropic/claude-opus-4-6',
                        'openai/gpt-4o',
                        'openai/gpt-4o-mini',
                        'meta-llama/llama-3.3-70b-instruct',
                        'deepseek/deepseek-chat',
                        'deepseek/deepseek-reasoner'
                    ];

                    // Async fetch full list
                    fetchWithRetry(`${cleanProxyUrl}/models`, {
                        headers: { 'Authorization': `Bearer ${apiKey}` }
                    }).then(async res => {
                        const json = await res.json();
                        if (json && json.data) {
                            setAvailableModels(json.data.map((m: any) => m.id));
                        }
                    }).catch(() => {});
                } else if (cleanProxyUrl.endsWith('/v1') || cleanProxyUrl.includes('api.') || cleanProxyUrl.includes('gcli')) {
                    // OpenAI-compatible detection (most custom proxies use this)
                    const baseUrl = cleanProxyUrl.endsWith('/v1') ? cleanProxyUrl : (cleanProxyUrl + (cleanProxyUrl.includes('v1') ? '' : '/v1'));
                    response = await fetchWithRetry(`${baseUrl}/models`, {
                        headers: { 'Authorization': `Bearer ${apiKey}` },
                        signal: controller.signal
                    });
                    if (!response.ok) {
                        await response.text().catch(() => {});
                        throw new Error(`OpenAI Proxy Error: ${response.status}`);
                    }
                    data = await response.json();
                    if (data && data.data && Array.isArray(data.data)) {
                        modelNames = data.data.map((m: any) => m.id);
                    }
                } else {
                    // Default Gemini API
                    response = await fetchWithRetry(`${cleanProxyUrl}/v1beta/models?key=${apiKey}`, {
                        signal: controller.signal
                    });
                    if (!response.ok) {
                        await response.text().catch(() => {});
                        throw new Error(`Gemini API Error: ${response.status}`);
                    }
                    data = await response.json();
                    if (data && data.models && Array.isArray(data.models)) {
                        modelNames = data.models
                            .map((m: any) => m.name.replace('models/', ''))
                            .filter((name: string) => name.includes('gemini'));
                    }
                }
            } finally {
                clearTimeout(timeoutId);
            }
            
            if (modelNames.length === 0) {
                throw new Error("Không thể trích xuất danh sách model. Vui lòng kiểm tra lại Proxy hoặc API Key.");
            }

            setAvailableModels(modelNames);
            setCheckStatus('success');
            
            if (modelNames.length > 0 && !modelNames.includes(model)) {
                setModel(modelNames[0]);
            }
        } catch (error: any) {
            console.error('Check proxy error:', error);
            setCheckStatus('error');
            setErrorMessage(error.message || 'Không thể kết nối đến Proxy.');
        } finally {
            setIsChecking(false);
        }
    };

    const handleSave = () => {
        const cleanProxyUrl = proxyUrl ? proxyUrl.replace(/\/$/, '') : '';
        
        if (apiKey) localStorage.setItem('gemini_api_key', apiKey);
        else localStorage.removeItem('gemini_api_key');
        
        if (cleanProxyUrl) localStorage.setItem('gemini_proxy_url', cleanProxyUrl);
        else localStorage.removeItem('gemini_proxy_url');
        
        if (model) localStorage.setItem('gemini_model', model);
        else localStorage.removeItem('gemini_model');

        localStorage.setItem('gemini_reasoning_effort', reasoningEffort);

        geminiService.setConfig(apiKey, cleanProxyUrl, model);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden"
            >
                <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-锌-50 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-indigo-500" />
                        Cấu hình API
                    </h2>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                            <Globe className="w-3.5 h-3.5" />
                            Proxy URL
                        </label>
                        <input 
                            type="text"
                            placeholder="https://gcli.ggchan.dev hoặc https://generativelanguage..."
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all" 
                            value={proxyUrl} 
                            onChange={e => setProxyUrl(e.target.value)} 
                        />
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                            <KeyRound className="w-3.5 h-3.5" />
                            API Key
                        </label>
                        <input 
                            type="password"
                            placeholder="AIzaSy..."
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all font-mono" 
                            value={apiKey} 
                            onChange={e => setApiKey(e.target.value)} 
                        />
                    </div>

                    {checkStatus === 'success' && availableModels.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="pt-4 mt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5" />
                                    Chọn Model
                                </label>
                                <button 
                                    onClick={() => setIsCustomModel(!isCustomModel)}
                                    className="text-[11px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded transition-colors"
                                >
                                    {isCustomModel ? 'Chọn từ danh sách' : 'Nhập tay'}
                                </button>
                            </div>
                            {isCustomModel ? (
                                <input 
                                    type="text"
                                    className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all font-mono" 
                                    value={model} 
                                    onChange={e => setModel(e.target.value)}
                                    placeholder="Nhập tên model (vd: claude-3-opus)..."
                                />
                            ) : (
                                <select 
                                    className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all appearance-none cursor-pointer" 
                                    value={model} 
                                    onChange={e => setModel(e.target.value)}
                                >
                                    {availableModels.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                    {!availableModels.includes(model) && model && (
                                        <option value={model}>{model}</option>
                                    )}
                                </select>
                            )}
                        </motion.div>
                    )}

                    {checkStatus === 'success' && availableModels.length > 0 && (model.includes('deepseek-reasoner') || model.includes('claude-3-7') || model.includes('claude-opus-4-6') || model.includes('o1') || model.includes('o3')) && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="pt-2"
                        >
                            <label className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                Reasoning Effort (Độ sâu suy luận)
                            </label>
                            <select 
                                className="w-full bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm transition-all appearance-none cursor-pointer" 
                                value={reasoningEffort} 
                                onChange={e => setReasoningEffort(e.target.value as any)}
                            >
                                <option value="low">Low (Nhanh, tiết kiệm)</option>
                                <option value="medium">Medium (Cân bằng)</option>
                                <option value="high">High (Chậm, sâu sắc)</option>
                            </select>
                        </motion.div>
                    )}

                    <button 
                        onClick={handleCheck} 
                        disabled={isChecking}
                        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                            isChecking 
                                ? 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 cursor-not-allowed' 
                                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                        }`}
                    >
                        {isChecking ? (
                            <>Đang kiểm tra kết nối...</>
                        ) : (
                            <>
                                <ShieldCheck className="w-4 h-4" />
                                Kiểm tra cấu hình
                            </>
                        )}
                    </button>

                    {checkStatus === 'error' && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-3"
                        >
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">
                                {errorMessage}
                            </p>
                        </motion.div>
                    )}
                </div>
                <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                        Hủy
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm flex items-center gap-2 transition-colors active:scale-95"
                    >
                        <Save className="w-4 h-4" />
                        Lưu thiết lập
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
