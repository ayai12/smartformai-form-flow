import { db, auth } from './firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface SaveFormParams {
  formId: string;
  title: string;
  questions: any[];
  tone?: string;
  prompt?: string;
  publishedLink?: string;
  requireLogin?: boolean;
  showProgress?: boolean;
  customThankYou?: boolean;
  thankYouMessage?: string;
  published?: 'draft' | 'published';
  starred?: string;
}

function sanitizeQuestions(questions: any[]): any[] {
  return questions.map((q) => {
    // Remove any undefined properties from each question object
    const sanitized = Object.fromEntries(
      Object.entries(q).filter(([_, v]) => v !== undefined)
    );
    // If options is undefined, set to empty array for multiple choice
    if (sanitized.type === 'MULTIPLE_CHOICE' && !sanitized.options) {
      sanitized.options = [];
    }
    return sanitized;
  });
}

export const saveFormToFirestore = async ({ formId, title, questions, tone, prompt, publishedLink, requireLogin, showProgress, customThankYou, thankYouMessage, published, starred }: SaveFormParams) => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  const ownerId = user.uid;
  const formRef = doc(collection(db, 'forms'), formId);
  const formDoc = {
    formId: formId ?? '',
    ownerId,
    title: title ?? '',
    questions: sanitizeQuestions(questions ?? []),
    tone: tone ?? '',
    prompt: prompt ?? '',
    publishedLink: publishedLink ?? '',
    requireLogin: requireLogin ?? false,
    showProgress: showProgress ?? true,
    customThankYou: customThankYou ?? false,
    thankYouMessage: thankYouMessage ?? '',
    published: published ?? 'draft',
    starred: starred ?? '',
    createdAt: serverTimestamp(),
  };
  await setDoc(formRef, formDoc);
  return formId;
};
