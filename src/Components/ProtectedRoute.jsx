import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const ProtectedRoute = ({ children }) => {
    const [user, loading] = useAuthState(auth);
    const [isAdmin, setIsAdmin] = useState(null);
    const [adminError, setAdminError] = useState(null);

    useEffect(() => {
        let mounted = true;

        const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

        const checkAdmin = async () => {
            if (!user) {
                console.log('ProtectedRoute: No user found.');
                if (mounted) setIsAdmin(false);
                return;
            }
            console.log('ProtectedRoute: User found:', user.email);

            const envAdmins = (import.meta.env.VITE_ADMIN_EMAILS || '')
                .split(',')
                .map((e) => e.trim().toLowerCase())
                .filter(Boolean);

            if (envAdmins.length && user.email && envAdmins.includes(user.email.toLowerCase())) {
                console.log('ProtectedRoute: Admin allowlist matched for', user.email);
                if (mounted) setIsAdmin(true);
                return;
            }

            // Retry a few times for transient network issues
            let lastErr = null;
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    // First check admins collection by UID
                    const adminDocRef = doc(db, 'admins', user.uid);
                    const adminSnap = await getDoc(adminDocRef);

                    if (adminSnap.exists()) {
                        console.log('ProtectedRoute: Admin status confirmed by UID.');
                        if (mounted) setIsAdmin(true);
                        return;
                    }
                    console.log('ProtectedRoute: No admin document found for UID:', user.uid);

                    // Fallback: check by email field in admins collection
                    console.log('ProtectedRoute: Falling back to check by email.');
                    const q = query(collection(db, 'admins'), where('email', '==', user.email));
                    const qSnap = await getDocs(q);

                    if (!qSnap.empty) {
                        console.log('ProtectedRoute: Admin status confirmed by email.');
                        if (mounted) setIsAdmin(true);
                        return;
                    }
                    console.log('ProtectedRoute: No admin document found for email:', user.email);

                    if (mounted) setIsAdmin(false);
                    return;
                } catch (err) {
                    lastErr = err;
                    console.error(`ProtectedRoute: Attempt ${attempt + 1} failed checking admin status:`, err);
                    // If last attempt, surface the error
                    if (attempt < 2) {
                        // small backoff
                        // eslint-disable-next-line no-await-in-loop
                        await sleep(400 * (attempt + 1));
                        continue;
                    }
                }
            }

            // After retries, handle final error
            if (mounted) {
                setIsAdmin(false);
                const code = lastErr && (lastErr.code || lastErr?.message || String(lastErr));
                // Friendly messages for common cases
                if (typeof code === 'string' && code.includes('permission-denied')) {
                    setAdminError('Permission denied reading `admins` collection. Check Firestore rules to allow authenticated reads for `admins` or add the admin document via Firebase Console.');
                } else if (typeof code === 'string' && (code.includes('unavailable') || code.includes('ETIMEDOUT') || code.includes('timeout') || code.includes('network'))) {
                    setAdminError('Network error connecting to Firestore. Check your network, VPN, or firewall and ensure `firestore.googleapis.com` is reachable on port 443.');
                } else {
                    setAdminError(lastErr && (lastErr.message || String(lastErr)));
                }
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

    // Development bypass: allow any authenticated user when env var set
    if (import.meta.env.VITE_BYPASS_ADMIN === 'true') {
        return children;
    }

    if (!isAdmin) {
        const redirectState = {
            reason: adminError ? 'admin-error' : 'missing-admin-record',
            email: user?.email || '',
            adminError: adminError || undefined,
            attemptedPath: typeof window !== 'undefined' ? window.location.pathname : undefined,
        };
        // Optionally show debug info when env var enabled
        if (import.meta.env.VITE_SHOW_ADMIN_ERRORS === 'true' && adminError) {
            return (
                <div style={{ padding: 24 }}>
                    <h3>Admin access check failed</h3>
                    <pre style={{ whiteSpace: 'pre-wrap', color: '#b00020' }}>{adminError}</pre>
                    <p>If this is unexpected, verify Firestore `admins` documents and network connectivity.</p>
                </div>
            );
        }

        return <Navigate to="/admin/login" replace state={redirectState} />;
    }

    return children;
};

export default ProtectedRoute;
