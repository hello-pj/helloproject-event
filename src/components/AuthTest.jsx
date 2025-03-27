import React, { useState } from 'react';
import { 
  signUp, 
  signIn, 
  logOut, 
  resetPassword 
} from '../lib/firebase';

export default function AuthTest() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const user = await signUp(email, password, displayName);
      setMessage(`新規登録成功: ${user.email}`);
    } catch (error) {
      setMessage(`新規登録エラー: ${error.message}`);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const user = await signIn(email, password);
      setMessage(`ログイン成功: ${user.email}`);
    } catch (error) {
      setMessage(`ログインエラー: ${error.message}`);
    }
  };

  const handleLogOut = async () => {
    try {
      await logOut();
      setMessage('ログアウト成功');
    } catch (error) {
      setMessage(`ログアウトエラー: ${error.message}`);
    }
  };

  const handleResetPassword = async () => {
    try {
      await resetPassword(email);
      setMessage('パスワードリセットメールを送信しました');
    } catch (error) {
      setMessage(`パスワードリセットエラー: ${error.message}`);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Firebase認証テスト</h2>
      
      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label className="block mb-2">表示名</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="表示名を入力"
          />
        </div>
        
        <div>
          <label className="block mb-2">メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="メールアドレスを入力"
            autoComplete="username"  // 修正
            required
        />
        </div>
        
        <div>
          <label className="block mb-2">パスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="パスワードを入力"
            autoComplete="current-password"
            required
          />
        </div>
        
        <div className="flex space-x-2">
          <button
            type="submit"
            className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            新規登録
          </button>
          
          <button
            type="button"
            onClick={handleSignIn}
            className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600"
          >
            ログイン
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={handleLogOut}
            className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600"
          >
            ログアウト
          </button>
          
          <button
            type="button"
            onClick={handleResetPassword}
            className="flex-1 bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600"
          >
            パスワードリセット
          </button>
        </div>
      </form>
      
      {message && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <p>{message}</p>
        </div>
      )}
    </div>
  );
}