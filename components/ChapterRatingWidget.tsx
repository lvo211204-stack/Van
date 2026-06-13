import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { useStory } from '../context/StoryContext';

export const ChapterRatingWidget: React.FC<{ chapterId: string }> = ({ chapterId }) => {
    const { story, updateChapterRating } = useStory();
    const chapter = story?.chapters.find(c => c.id === chapterId);
    
    const [hoveredStar, setHoveredStar] = useState<number | null>(null);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [feedbackText, setFeedbackText] = useState(chapter?.feedback || '');
    const [showSuccess, setShowSuccess] = useState(false);

    if (!chapter) return null;

    const currentRating = chapter.rating || 0;

    const handleRate = (rating: number) => {
        updateChapterRating(chapterId, rating, feedbackText);
        if (rating <= 3) {
            setIsFeedbackOpen(true);
        } else if (!isFeedbackOpen) {
            showSuccessMessage();
        }
    };

    const handleFeedbackSubmit = () => {
        updateChapterRating(chapterId, currentRating, feedbackText);
        setIsFeedbackOpen(false);
        showSuccessMessage();
    };

    const showSuccessMessage = () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    return (
        <div className="mt-12 pt-8 border-t border-zinc-100 dark:border-zinc-800/50 flex flex-col items-center max-w-lg mx-auto pointer-events-auto">
            <h4 className="text-sm font-semibold text-zinc-500 mb-4 tracking-wide">Bạn đánh giá chương này thế nào?</h4>
            
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => handleRate(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(null)}
                        className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    >
                        <Star 
                            className={`w-8 h-8 transition-colors ${
                                (hoveredStar !== null ? star <= hoveredStar : star <= currentRating)
                                    ? 'fill-amber-400 text-amber-400' 
                                    : 'text-zinc-300 dark:text-zinc-700'
                            }`} 
                        />
                    </button>
                ))}
            </div>

            <AnimatePresence>
                {currentRating > 0 && !isFeedbackOpen && !showSuccess && (
                    <motion.button
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onClick={() => setIsFeedbackOpen(true)}
                        className="mt-4 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 focus:outline-none"
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Đóng góp ý kiến cho AI
                    </motion.button>
                )}

                {isFeedbackOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: 10, height: 0 }}
                        className="w-full mt-6"
                    >
                        <div className="relative">
                            <textarea
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="Bạn thấy điều gì chưa tốt ở chương này? (AI sẽ học từ đây)"
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none h-24"
                            />
                            <button 
                                onClick={handleFeedbackSubmit}
                                disabled={!feedbackText.trim()}
                                className="absolute bottom-3 right-3 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="mt-4 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2 rounded-full border border-emerald-100 dark:border-emerald-900/50"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Cảm ơn đóng góp của bạn!
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
