// src/components/ProtectedRoute.jsx
import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Firebase Authの状態監視
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("ProtectedRoute: Auth状態変更", currentUser ? "ログイン中" : "未ログイン");
      setUser(currentUser);
      setLoading(false);
      
      // ユーザーがログインしていない場合はログインページにリダイレクト
      if (!currentUser) {
        console.log("ProtectedRoute: ログインページへリダイレクト");
        setRedirecting(true);
        setTimeout(() => {
          window.location.href = '/helloproject-event/login';
        }, 100);
      }
    });

    // クリーンアップ
    return () => unsubscribe();
  }, []);

  // ロード中は読み込み中表示
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="spinner mb-2"></div>
          <p>認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  // ユーザーがログインしていない場合は何も表示しない（リダイレクト中）
  if (!user || redirecting) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="spinner mb-2"></div>
          <p>ログインページにリダイレクトしています...</p>
        </div>
      </div>
    );
  }

  // 認証済みの場合は子コンポーネントを表示
  return children;
}