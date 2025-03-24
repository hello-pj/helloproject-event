import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function FirebaseTest() {
  const [status, setStatus] = useState('確認中...');

  useEffect(() => {
    try {
      onAuthStateChanged(auth, () => {
        setStatus('Firebase認証との接続は正常です');
      });
    } catch (error) {
      setStatus(`エラー: ${error.message}`);
    }
  }, []);

  return (
    <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-medium text-black">Firebase接続テスト</h2>
      <p className="mt-2 text-gray-600">{status}</p>
    </div>
  );
}