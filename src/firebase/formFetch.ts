import { db, auth } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export interface FormDoc {
  formId: string;
  ownerId: string;
  title: string;
  questions: any[];
  tone?: string;
  prompt?: string;
  publishedLink?: string;
  createdAt?: any;
  status?: string;
  starred?: boolean;
  requireLogin?: boolean;
  showProgress?: boolean;
  customThankYou?: boolean;
  thankYouMessage?: string;
}

export const fetchFormById = async (formId: string): Promise<FormDoc | null> => {
  try {
    // Ensure we have a valid formId
    if (!formId) {
      console.error("Invalid formId provided:", formId);
      return null;
    }

    console.log("Fetching form with ID:", formId);
    
    // Ensure Firebase is initialized
    if (!db) {
      console.error("Firestore database is not initialized");
      return null;
    }
    
    const formsRef = collection(db, 'forms');
    const q = query(formsRef, where('__name__', '==', formId));
    
    console.log("Executing Firestore query...");
    const querySnapshot = await getDocs(q);
    console.log("Query completed. Documents found:", !querySnapshot.empty);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { ...(doc.data() as FormDoc), formId: doc.id };
    }
    return null;
  } catch (error) {
    console.error("Error in fetchFormById:", error);
    throw error;
  }
};

export const fetchUserForms = async (): Promise<FormDoc[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  const formsRef = collection(db, 'forms');
  const q = query(formsRef, where('ownerId', '==', user.uid));
  const querySnapshot = await getDocs(q);
  const forms: FormDoc[] = [];
  querySnapshot.forEach((doc) => {
    forms.push({ ...(doc.data() as FormDoc), formId: doc.id });
  });
  return forms;
};
