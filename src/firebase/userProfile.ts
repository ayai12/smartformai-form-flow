import { db, auth } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// User profile data interface
export interface UserProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  website?: string;
  bio?: string;
  photoURL?: string;
}

// Function to get user profile data
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// Function to update user profile data
export const updateUserProfile = async (userId: string, profileData: UserProfile): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      await updateDoc(userRef, { ...profileData });
    } else {
      await setDoc(userRef, { ...profileData });
    }
    
    // Update display name in auth if firstName and lastName are provided
    if (profileData.firstName && profileData.lastName && auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: `${profileData.firstName} ${profileData.lastName}`
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
};

// Function to upload profile picture
export const uploadProfilePicture = async (userId: string, file: File): Promise<string | null> => {
  try {
    const storage = getStorage();
    const storageRef = ref(storage, `profilePictures/${userId}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Update user profile with new photo URL
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        photoURL: downloadURL
      });
      
      // Update Firestore document
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { photoURL: downloadURL });
    }
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return null;
  }
}; 