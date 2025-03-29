// src/components/ProtectedRoute.jsx
import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import supabase from '../lib/supabase';

export default function ProtectedRoute({ children, requireOnboarding = false }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(null);

  useEffect(() => {
    // Firebase Authの状態監視
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("ProtectedRoute: Auth状態変更", currentUser ? "ログイン中" : "未ログイン");
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // ユーザーのオンボーディング状態をチェック
          const { data, error } = await supabase
            .from('users')
            .select('onboarding_completed')
            .eq('user_id', currentUser.uid)
            .single();
          
          if (error) {
            console.error("オンボーディング状態チェックエラー:", error);
            setOnboardingCompleted(false);
          } else {
            // Boolean値として厳密に比較
            const completed = data && data.onboarding_completed === true;
            setOnboardingCompleted(completed);
            
            // オンボーディングが必要なページで、未完了の場合はオンボーディングにリダイレクト
            if (requireOnboarding && !completed) {
              console.log("ProtectedRoute: オンボーディングへリダイレクト");
              setRedirecting(true);
              window.location.href = '/helloproject-event/onboarding';
              return;
            }
            
            // オンボーディングページで、既に完了済みの場合はホームにリダイレクト
            if (!requireOnboarding && completed && window.location.pathname.includes('/onboarding')) {
              console.log("ProtectedRoute: オンボーディング完了済み、ホームへリダイレクト");
              setRedirecting(true);
              window.location.href = '/helloproject-event/';
              return;
            }
          }
        } catch (error) {
          console.error("オンボーディング状態チェックエラー:", error);
          setOnboardingCompleted(false);
        }
      } else {
        // ユーザーがログインしていない場合はログインページにリダイレクト
        console.log("ProtectedRoute: ログインページへリダイレクト");
        setRedirecting(true);
        window.location.href = '/helloproject-event/login';
        return;
      }
      
      setLoading(false);
    });

    // クリーンアップ
    return () => unsubscribe();
  }, [requireOnboarding]);

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

  // リダイレクト中は何も表示しない
  if (redirecting) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="spinner mb-2"></div>
          <p>リダイレクト中...</p>
        </div>
      </div>
    );
  }

  // 認証済みの場合は子コンポーネントを表示
  return children;
}