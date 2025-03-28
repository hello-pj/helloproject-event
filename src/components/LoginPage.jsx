// src/components/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { signIn, signUp, resetPassword, signInWithGoogle } from '../lib/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  
  // ログイン状態が変わった場合もチェック
  useEffect(() => {
    if (success) {
      // ログイン/登録成功後、少し待ってからリダイレクト
      const timer = setTimeout(() => {
        window.location.href = '/helloproject-event/onboarding';
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

  // Google認証処理を追加
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    
    try {
      await signInWithGoogle();
      setMessage('Googleアカウントでログインしました！リダイレクトします...');
      setSuccess(true);
    } catch (error) {
      setError('Google認証エラー: ' + (error.message || '認証に失敗しました'));
    } finally {
      setLoading(false);
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

        {/* Google認証ボタンを上部に移動 */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading || success}
          className="w-full flex items-center justify-center bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 mb-4"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
            </g>
          </svg>
          Googleでログイン
        </button>
        
        {/* 区切り線 */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">または</span>
          </div>
        </div>
        
        {/* メールアドレス認証フォーム */}
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
            {loading ? '処理中...' : success ? 'リダイレクト中...' : isSignUp ? 'アカウント作成' : 'メールアドレスでログイン'}
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