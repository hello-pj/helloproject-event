// src/components/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import supabase from '../lib/supabase';

export default function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        // 現在のFirebaseユーザーを取得
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setError('ユーザーがログインしていません');
          setLoading(false);
          return;
        }

        // ユーザーIDでクエリを確実に絞り込む
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', currentUser.uid);

        if (error) {
          throw error;
        }

        // データが存在しない場合は、新規作成
        if (!data || data.length === 0) {
          // 基本プロフィールを作成
          const newProfile = {
            user_id: currentUser.uid,
            email: currentUser.email,
            display_name: currentUser.displayName || '',
            location: ''
          };

          const { error: insertError } = await supabase
            .from('users')
            .insert(newProfile);

          if (insertError) {
            throw insertError;
          }

          setProfile(newProfile);
          setDisplayName(newProfile.display_name);
          setLocation('');
        } else {
          // 既存のプロフィールを設定
          const userProfile = data[0];
          setProfile(userProfile);
          setDisplayName(userProfile.display_name || '');
          setLocation(userProfile.location || '');
        }
      } catch (err) {
        console.error('プロフィール取得エラー:', err);
        setError('プロフィールの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      setUpdating(true);
      setUpdateMessage('');
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('ユーザーがログインしていません');
      }

      // Supabaseプロフィールを更新
      const { error } = await supabase
        .from('users')
        .update({
          display_name: displayName,
          location: location,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', currentUser.uid);

      if (error) {
        throw error;
      }

      setUpdateMessage('プロフィールを更新しました');
    } catch (err) {
      console.error('プロフィール更新エラー:', err);
      setUpdateMessage('更新に失敗しました: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="text-center p-4">読み込み中...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">プロフィール設定</h2>
      
      {updateMessage && (
        <div className={`p-3 mb-4 rounded ${updateMessage.includes('失敗') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {updateMessage}
        </div>
      )}
      
      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <div>
          <label className="block mb-1">メールアドレス</label>
          <input
            type="email"
            value={profile?.email || ''}
            disabled
            className="w-full px-3 py-2 border rounded bg-gray-100"
          />
          <p className="text-xs text-gray-500 mt-1">メールアドレスは変更できません</p>
        </div>
        
        <div>
          <label className="block mb-1">表示名</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block mb-1">お住まいの地域</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="例: 東京都、大阪府"
          />
        </div>
        
        <button
          type="submit"
          disabled={updating}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition"
        >
          {updating ? '更新中...' : 'プロフィールを更新'}
        </button>
      </form>
    </div>
  );
}