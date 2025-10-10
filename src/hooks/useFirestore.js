import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, limit, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const useFirestore = (collectionName, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    query: customQuery,
    orderBy: orderByField,
    limit: limitCount,
    where: whereConditions,
    realtime = false
  } = options;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let firestoreQuery = collection(db, collectionName);

      // Apply query conditions
      if (customQuery) {
        firestoreQuery = customQuery;
      } else {
        if (whereConditions) {
          whereConditions.forEach(condition => {
            firestoreQuery = query(firestoreQuery, where(...condition));
          });
        }
        
        if (orderByField) {
          firestoreQuery = query(firestoreQuery, orderBy(orderByField.field, orderByField.direction || 'asc'));
        }
        
        if (limitCount) {
          firestoreQuery = query(firestoreQuery, limit(limitCount));
        }
      }

      const querySnapshot = await getDocs(firestoreQuery);
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setData(documents);
    } catch (err) {
      console.error(`Error fetching ${collectionName}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [collectionName, customQuery, orderByField, limitCount, whereConditions]);

  const addDocument = useCallback(async (documentData) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...documentData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (err) {
      console.error(`Error adding document to ${collectionName}:`, err);
      throw err;
    }
  }, [collectionName]);

  const updateDocument = useCallback(async (docId, updateData) => {
    try {
      await updateDoc(doc(db, collectionName, docId), {
        ...updateData,
        updatedAt: new Date()
      });
    } catch (err) {
      console.error(`Error updating document in ${collectionName}:`, err);
      throw err;
    }
  }, [collectionName]);

  const deleteDocument = useCallback(async (docId) => {
    try {
      await deleteDoc(doc(db, collectionName, docId));
    } catch (err) {
      console.error(`Error deleting document from ${collectionName}:`, err);
      throw err;
    }
  }, [collectionName]);

  // Set up real-time listener if enabled
  useEffect(() => {
    if (!realtime) {
      fetchData();
      return;
    }

    let firestoreQuery = collection(db, collectionName);
    
    if (whereConditions) {
      whereConditions.forEach(condition => {
        firestoreQuery = query(firestoreQuery, where(...condition));
      });
    }
    
    if (orderByField) {
      firestoreQuery = query(firestoreQuery, orderBy(orderByField.field, orderByField.direction || 'asc'));
    }
    
    if (limitCount) {
      firestoreQuery = query(firestoreQuery, limit(limitCount));
    }

    const unsubscribe = onSnapshot(
      firestoreQuery,
      (querySnapshot) => {
        const documents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(documents);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Error in real-time listener for ${collectionName}:`, err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, realtime, fetchData, whereConditions, orderByField, limitCount]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    addDocument,
    updateDocument,
    deleteDocument
  };
};

