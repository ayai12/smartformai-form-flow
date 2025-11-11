/**
 * Save AI Insights to Firestore
 * Cost-optimized: Only saves when significant changes occur
 */

import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { GlobalSummaryData } from './aiSummaryGenerator';

export interface InsightToSave {
  formId: string;
  summary: string;
  keyInsights: string[];
  responseCount: number;
  metrics: {
    completionRate: number;
    avgCompletionTime: number;
    totalResponses: number;
  };
}

/**
 * Save insight to database - only if significant change detected
 */
export async function saveInsightToDB(
  insight: InsightToSave,
  lastSavedCount?: number
): Promise<string | null> {
  try {
    // Cost optimization: Only save if response count increased by 5% or more
    if (lastSavedCount && insight.responseCount > 0) {
      const changePercent = ((insight.responseCount - lastSavedCount) / lastSavedCount) * 100;
      if (changePercent < 5) {
        console.log('⏭️ Skipping save - change < 5%');
        return null;
      }
    }

    const db = getFirestore();
    const insightsRef = collection(db, 'analyticsInsights');
    
    const docRef = await addDoc(insightsRef, {
      ...insight,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    });

    console.log('✅ Insight saved to database:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving insight to database:', error);
    return null;
  }
}

