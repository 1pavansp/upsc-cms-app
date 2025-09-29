import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const TestDataFetch = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const testCollections = async () => {
      const collections = ['daily-quiz', 'current-affairs', 'updates', 'articles'];
      const results = {};

      try {
        for (const collectionName of collections) {
          console.log(`Testing collection: ${collectionName}`);
          try {
            const querySnapshot = await getDocs(collection(db, collectionName));
            results[collectionName] = {
              success: true,
              count: querySnapshot.size,
              data: querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            };
            console.log(`✅ Successfully fetched ${querySnapshot.size} documents from ${collectionName}`);
          } catch (err) {
            console.error(`❌ Error fetching ${collectionName}:`, err);
            results[collectionName] = {
              success: false,
              error: err.message
            };
          }
        }
        setTestResults(results);
      } catch (err) {
        setError(err.message);
        console.error('Major error during testing:', err);
      } finally {
        setLoading(false);
      }
    };

    testCollections();
  }, []);

  if (loading) {
    return <div className="test-data-fetch">Testing Firebase connections...</div>;
  }

  if (error) {
    return <div className="test-data-fetch error">Error: {error}</div>;
  }

  return (
    <div className="test-data-fetch">
      <h2>Firebase Data Test Results</h2>
      {Object.entries(testResults).map(([collection, result]) => (
        <div key={collection} className="collection-result">
          <h3>{collection}</h3>
          {result.success ? (
            <>
              <p className="success">✅ Successfully connected</p>
              <p>Documents found: {result.count}</p>
              {result.count > 0 && (
                <div className="sample-data">
                  <p>Sample document:</p>
                  <pre>
                    {JSON.stringify(result.data[0], null, 2)}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <p className="error">❌ Error: {result.error}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default TestDataFetch;