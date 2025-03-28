// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

// 認証コンテキストを作成
const AuthContext = createContext();

// AuthProviderコンポーネント
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase Auth状態変更リスナー
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // クリーンアップ関数
    return unsubscribe;
  }, []);

  // コンテキストの値
  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// useAuthフック - 認証状態へのアクセスを簡素化
export function useAuth() {
  return useContext(AuthContext);
}