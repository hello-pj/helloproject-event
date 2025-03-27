import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function FirebaseTest() {
  const [status, setStatus] = useState('確認中...');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setStatus('Firebase認証との接続は正常です');
          setCurrentUser(user);
        } else {
          setStatus('ユーザーは未ログイン状態です');
          setCurrentUser(null);
        }
      }, (error) => {
        setStatus(`エラー: ${error.message}`);
      });

      // クリーンアップ関数
      return () => unsubscribe();
    } catch (error) {
      setStatus(`エラー: ${error.message}`);
    }
  }, []);

  return (
    <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-medium text-black">Firebase認証テスト</h2>
      <p className="mt-2 text-gray-600">{status}</p>
      {currentUser && (
        <div className="mt-4">
          <p>ログイン中のユーザー:</p>
          <p>メールアドレス: {currentUser.email}</p>
          <p>表示名: {currentUser.displayName || '未設定'}</p>
        </div>
      )}
    </div>
  );
}