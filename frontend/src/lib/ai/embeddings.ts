// Simplified client-side embeddings utility for the AI Q&A assistant
// Using a basic keyword matching approach instead of transformer.js to avoid build issues

// Predefined farm management knowledge base
export const FARM_KNOWLEDGE_BASE = [
  "Egg production can be maximized by ensuring proper nutrition, lighting, and temperature control for your hens.",
  "Feed your hens a balanced diet with adequate protein (16-18%) for optimal egg production.",
  "Provide 14-16 hours of light per day to maintain consistent egg laying.",
  "Keep coop temperatures between 65-75°F for maximum comfort and productivity.",
  "Collect eggs at least twice daily to ensure freshness and prevent breakage.",
  "Maintain proper ventilation in the coop to prevent respiratory issues.",
  "Implement a biosecurity protocol to prevent disease outbreaks.",
  "Vaccinate your flock according to a veterinarian-recommended schedule.",
  "Monitor hen health daily and isolate any birds showing signs of illness.",
  "Keep detailed records of egg production, feed consumption, and health issues.",
  "Control pests like rodents and insects that can spread disease and consume feed.",
  "Provide adequate nesting boxes (one box per 4-5 hens) in quiet, dark areas.",
  "Ensure access to fresh, clean water at all times - hens need water to produce eggs.",
  "Replace nest box bedding regularly to maintain hygiene and egg quality.",
  "Handle and store eggs properly to maintain freshness and prevent contamination.",
  "Market eggs within 30 days for best quality and consumer safety.",
  "Consider organic or free-range certification if it aligns with your business goals.",
  "Analyze production costs regularly to optimize profitability.",
  "Track mortality rates and investigate any increases above normal levels (1-2% per year)."
];

// Simple keyword matching function
export function findMostRelevantContent(query: string, texts: string[]): { text: string; score: number } | null {
  if (texts.length === 0) return null;

  // Convert query to lowercase and split into words
  const queryWords = query.toLowerCase().split(/\s+/);
  
  let bestMatch = '';
  let highestScore = 0;

  for (const text of texts) {
    // Convert text to lowercase and split into words
    const textWords = text.toLowerCase().split(/\s+/);
    
    // Count matching words
    let score = 0;
    for (const queryWord of queryWords) {
      for (const textWord of textWords) {
        // Simple fuzzy matching - check if words contain each other
        if (queryWord.includes(textWord) || textWord.includes(queryWord)) {
          score++;
        }
      }
    }
    
    // Normalize score by text length
    score = score / textWords.length;
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = text;
    }
  }

  return highestScore > 0 ? { text: bestMatch, score: highestScore } : null;
}