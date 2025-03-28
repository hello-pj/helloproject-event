// src/components/ProtectedRoute.jsx
import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase Authの状態監視
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      // ユーザーがログインしていない場合はログインページにリダイレクト
      if (!currentUser && !loading) {
        window.location.href = '/helloproject-event/login';
      }
    });

    // クリーンアップ
    return () => unsubscribe();
  }, [loading]);

  // ロード中は読み込み中表示
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="spinner mb-2"></div>
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  // ユーザーがログインしていない場合は何も表示しない（リダイレクト中）
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>ログインページにリダイレクトしています...</p>
      </div>
    );
  }

  // 認証済みの場合は子コンポーネントを表示
  return children;
}