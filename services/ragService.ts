
import { VectorData } from '../types';

// Simple Cosine Similarity
// A . B / (|A| * |B|)
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const ragService = {
  // Hybrid Search: Vector Similarity + Lexical Boost (Re-ranking)
  search: (queryText: string, queryEmbedding: number[], vectors: VectorData[], topK: number = 3, threshold: number = 0.55): VectorData[] => {
    if (vectors.length === 0) return [];
    
    // Extract keywords from query for lexical boost (ignore common stopwords)
    const queryTokens = queryText.toLowerCase().split(/\s+/).filter(t => t.length > 2 && !['and', 'the', 'với', 'của', 'là', 'trong', 'context:', 'intent:', 'scene:'].includes(t));

    const scored = vectors.map(v => {
      // 1. Vector Score
      let score = cosineSimilarity(queryEmbedding, v.embedding);
      
      // 2. Lexical Boost (Keyword matching)
      let lexicalHits = 0;
      const docText = v.text.toLowerCase();
      for (const token of queryTokens) {
        if (docText.includes(token)) lexicalHits++;
      }
      
      // Boost Score: +0.02 for each keyword matched, max 0.08
      const boost = Math.min(0.08, lexicalHits * 0.02);
      score += boost;

      // 3. Recency / Metadata Boost
      if (v.metadata.type === 'memory_fact') score += 0.05; 
      
      return { item: v, score };
    });

    // Filter by threshold to remove noise
    const filtered = scored.filter(s => s.score >= threshold);

    // Sort descending (Re-ranking step)
    filtered.sort((a, b) => b.score - a.score);

    return filtered.slice(0, topK).map(s => s.item);
  },

  // Optimized Semantic Chunking with OVERLAP
  chunkText: (text: string, chunkSize: number = 800, overlap: number = 200): string[] => {
    if (!text) return [];
    if (text.length <= chunkSize) return [text];
    
    if (overlap >= chunkSize) {
        overlap = Math.floor(chunkSize / 4);
    }

    const chunks: string[] = [];
    
    // 1. Split into paragraphs first (Semantic boundary)
    const paragraphs = text.split(/\n\s*\n/);
    let currentChunk = "";

    for (const p of paragraphs) {
        if ((currentChunk.length + p.length) > chunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            // Carry over the last portion of currentChunk for overlap
            const words = currentChunk.split(/\s+/);
            const overlapWords = words.slice(-Math.floor(overlap / 5)); // approx words
            currentChunk = overlapWords.join(" ") + "\n\n" + p;
        } else {
            currentChunk += (currentChunk ? "\n\n" : "") + p;
        }
    }
    
    if (currentChunk.trim().length > 50) {
        chunks.push(currentChunk.trim());
    }

    // Fallback if paragraphs are too long: split by length
    if (chunks.length === 0) {
        let start = 0;
        while (start < text.length) {
            let end = Math.min(start + chunkSize, text.length);
            if (end < text.length) {
                const lastSentence = text.lastIndexOf('.', end);
                if (lastSentence > start + (chunkSize / 2)) {
                    end = lastSentence + 1;
                } else {
                    const lastSpace = text.lastIndexOf(' ', end);
                    if (lastSpace > start + (chunkSize / 2)) end = lastSpace;
                }
            }
            const chunk = text.slice(start, end).trim();
            if (chunk.length > 50) chunks.push(chunk);
            start += Math.max(10, end - start - overlap); 
        }
    }
    
    return chunks;
  }
};
