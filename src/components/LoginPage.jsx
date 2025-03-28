// src/components/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { signIn, signUp, resetPassword } from '../lib/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  
  const auth = useAuth();

  // 既にログインしている場合はホームにリダイレクト
  useEffect(() => {
    if (auth && auth.currentUser) {
      window.location.href = '/helloproject-event/';
    }
  }, [auth]);

  // ログイン状態が変わった場合もチェック
  useEffect(() => {
    if (success) {
      // ログイン/登録成功後、少し待ってからリダイレクト
      const timer = setTimeout(() => {
        window.location.href = '/helloproject-event/';
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
        setMessage('アカウントが作成されました！リダイレクトします...');
        setSuccess(true);
      } else {
        await signIn(email, password);
        setMessage('ログインしました！リダイレクトします...');
        setSuccess(true);
      }
    } catch (error) {
      setError(
        error.code === 'auth/user-not-found' ? 'メールアドレスが見つかりません' :
        error.code === 'auth/wrong-password' ? 'パスワードが間違っています' :
        error.code === 'auth/email-already-in-use' ? 'このメールアドレスは既に使用されています' :
        error.code === 'auth/weak-password' ? 'パスワードは6文字以上必要です' :
        '認証エラーが発生しました'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('パスワードリセットにはメールアドレスが必要です');
      return;
    }
    
    try {
      await resetPassword(email);
      setMessage('パスワードリセットの手順をメールで送信しました');
    } catch (error) {
      setError('パスワードリセットエラー: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isSignUp ? 'アカウント作成' : 'ログイン'}
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block mb-1">表示名</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="表示名"
              />
            </div>
          )}
          
          <div>
            <label className="block mb-1">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="example@mail.com"
              required
            />
          </div>
          
          <div>
            <label className="block mb-1">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="********"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition"
          >
            {loading ? '処理中...' : success ? 'リダイレクト中...' : isSignUp ? 'アカウント作成' : 'ログイン'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            disabled={loading || success}
            className="text-blue-500 hover:underline"
          >
            {isSignUp ? 'ログインへ戻る' : '新規アカウント作成'}
          </button>
        </div>
        
        {!isSignUp && (
          <div className="mt-2 text-center">
            <button
              onClick={handleResetPassword}
              disabled={loading || success}
              className="text-sm text-gray-600 hover:underline"
            >
              パスワードをお忘れですか？
            </button>
          </div>
        )}
      </div>
    </div>
  );
}