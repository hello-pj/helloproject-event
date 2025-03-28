// src/components/ProtectedRoute.jsx
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  
  useEffect(() => {
    // ロード完了後にユーザーがログインしていない場合はログインページにリダイレクト
    if (!loading && !currentUser) {
      window.location.href = '/helloproject-event/login';
    }
  }, [currentUser, loading]);

  // ロード中は読み込み中の表示
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">読み込み中...</div>;
  }

  // 認証されていない場合は何も表示しない（リダイレクト中）
  if (!currentUser) {
    return <div className="flex justify-center items-center min-h-screen">リダイレクト中...</div>;
  }

  // 認証済みの場合は子コンポーネントを表示
  return children;
}