import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isResetMode, setIsResetMode] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/admin/dashboard'); // Redirect to admin dashboard after successful login
        } catch (error) {
            setError('Invalid email or password. Please try again.');
            console.error('Login error:', error);
        }
        setLoading(false);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email address.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await sendPasswordResetEmail(auth, email);
            setSuccessMessage('Password reset email sent. Please check your inbox.');
            setError('');
        } catch (error) {
            setError('Error sending password reset email. Please try again.');
            console.error('Reset password error:', error);
        }
        setLoading(false);
    };

    return (
        <div className="admin-login-container">
            <div className="login-box">
                <h2>{isResetMode ? 'Reset Password' : 'Admin Login'}</h2>
                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
                
                {isResetMode ? (
                    <form onSubmit={handleResetPassword}>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Enter your email"
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="login-button" 
                            disabled={loading}
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                        <button 
                            type="button" 
                            className="switch-mode-button"
                            onClick={() => {
                                setIsResetMode(false);
                                setError('');
                                setSuccessMessage('');
                            }}
                        >
                            Back to Login
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Enter your email"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Enter your password"
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="login-button"
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                        <button 
                            type="button" 
                            className="forgot-password-button"
                            onClick={() => {
                                setIsResetMode(true);
                                setError('');
                                setSuccessMessage('');
                                setPassword('');
                            }}
                        >
                            Forgot Password?
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AdminLogin;