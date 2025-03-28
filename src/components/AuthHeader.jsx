// src/components/AuthHeader.jsx
import React, { useState, useEffect } from 'react';
import { auth, logOut } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function AuthHeader() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase Authの状態監視
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // クリーンアップ
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    logOut()
      .then(() => {
        console.log('ログアウト成功');
        window.location.reload();
      })
      .catch((error) => {
        console.error('ログアウトエラー:', error);
      });
  };

  // ローディング中は何も表示しない（またはローディングインジケータを表示）
  if (loading) {
    return (
      <header className="bg-white shadow p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">ハロプロイベント</h1>
          <div>読み込み中...</div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">ハロプロイベント</h1>
        
        {user ? (
          <div className="flex items-center space-x-4">
            <span className="text-sm">
              {user.displayName || user.email}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              ログアウト
            </button>
          </div>
        ) : (
          <a 
            href="/helloproject-event/login" 
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
          >
            ログイン
          </a>
        )}
      </div>
    </header>
  );
}