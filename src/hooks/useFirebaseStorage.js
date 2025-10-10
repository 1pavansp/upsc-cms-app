import { useState, useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../firebase';

export const useFirebaseStorage = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const uploadFile = useCallback(async (file, path, onProgress) => {
    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      const storageRef = ref(storage, path);
      
      if (onProgress) {
        // Use uploadBytesResumable for progress tracking
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
              onProgress(progress);
            },
            (error) => {
              setError(error.message);
              setIsUploading(false);
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                setIsUploading(false);
                setUploadProgress(100);
                resolve(downloadURL);
              } catch (error) {
                setError(error.message);
                setIsUploading(false);
                reject(error);
              }
            }
          );
        });
      } else {
        // Use uploadBytes for simple upload
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        setIsUploading(false);
        setUploadProgress(100);
        return downloadURL;
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error.message);
      setIsUploading(false);
      throw error;
    }
  }, []);

  const deleteFile = useCallback(async (filePath) => {
    try {
      setError(null);
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      setError(error.message);
      throw error;
    }
  }, []);

  const resetState = useCallback(() => {
    setUploadProgress(0);
    setIsUploading(false);
    setError(null);
  }, []);

  return {
    uploadFile,
    deleteFile,
    uploadProgress,
    isUploading,
    error,
    resetState
  };
};

