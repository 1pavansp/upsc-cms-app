import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const ProtectedRoute = ({ children }) => {
    const [user, loading] = useAuthState(auth);
    const [isAdmin, setIsAdmin] = useState(null);

    useEffect(() => {
        let mounted = true;

        const checkAdmin = async () => {
            if (!user) {
                if (mounted) setIsAdmin(false);
                return;
            }

            try {
                // First check admins collection by UID
                const adminDocRef = doc(db, 'admins', user.uid);
                const adminSnap = await getDoc(adminDocRef);

                if (adminSnap.exists()) {
                    if (mounted) setIsAdmin(true);
                    return;
                }

                // Fallback: check by email field in admins collection
                const q = query(collection(db, 'admins'), where('email', '==', user.email));
                const qSnap = await getDocs(q);
                if (mounted) setIsAdmin(!qSnap.empty);
            } catch (err) {
                console.error('Error checking admin status:', err);
                if (mounted) setIsAdmin(false);
            }
        };

        checkAdmin();

        return () => { mounted = false; };
    }, [user]);

    if (loading || isAdmin === null) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/admin/login" replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
};

export default ProtectedRoute;