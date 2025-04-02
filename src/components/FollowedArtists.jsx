// src/components/FollowedArtists.jsx
import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import supabase from '../lib/supabase';
import { addToFavorites, removeFromFavorites } from '../lib/data-service';

export default function FollowedArtists() {
  const [artists, setArtists] = useState([]);
  const [followedArtists, setFollowedArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmUnfollow, setConfirmUnfollow] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // 初期データ読み込み
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 現在のユーザーを取得
        const user = auth.currentUser;
        if (!user) {
          setError("ログインが必要です");
          setLoading(false);
          return;
        }
        
        // まずフォロー中のアーティストを取得
        const { data: favorites, error: favError } = await supabase
          .from('user_favorites')
          .select('artist_id')
          .eq('user_id', user.uid);
          
        if (favError) {
          throw favError;
        }
        
        // フォローされたアーティストIDのリストを作成
        const followedIds = favorites.map(fav => fav.artist_id);
        setFollowedArtists(followedIds);
        
        // 次にすべてのアーティストを取得
        const { data: allArtists, error: artistError } = await supabase
          .from('artists')
          .select('*')
          .order('name');
          
        if (artistError) {
          throw artistError;
        }
        
        setArtists(allArtists || []);
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('アーティスト情報の読み込みに失敗しました: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // フォロー追加処理
  const handleFollow = async (artistId) => {
    try {
      await addToFavorites(artistId);
      setFollowedArtists([...followedArtists, artistId]);
      setMessage(`アーティストをフォローしました`);
      
      // 3秒後にメッセージを消す
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('フォロー追加エラー:', err);
      setError('フォローの追加に失敗しました: ' + err.message);
    }
  };

  // フォロー解除処理
  const handleUnfollow = async (artistId) => {
    try {
      // 確認モーダルの表示
      if (confirmUnfollow !== artistId) {
        setConfirmUnfollow(artistId);
        return;
      }
      
      await removeFromFavorites(artistId);
      setFollowedArtists(followedArtists.filter(id => id !== artistId));
      setConfirmUnfollow(null);
      setMessage(`アーティストのフォローを解除しました`);
      
      // 3秒後にメッセージを消す
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('フォロー解除エラー:', err);
      setError('フォローの解除に失敗しました: ' + err.message);
    }
  };

  // アーティスト詳細ページへ移動
  const navigateToArtistDetail = (artistId, event) => {
    // クリックイベントが発生した要素がボタンでなければ遷移
    if (!event.target.closest('button')) {
      window.location.href = `/helloproject-event/artists/${artistId}`;
    }
  };

  // フォロー中のアーティストとフォローしていないアーティストに分ける
  const followedArtistsList = artists.filter(artist => 
    followedArtists.includes(artist.id)
  );
  
  const unfollowedArtistsList = artists.filter(artist => 
    !followedArtists.includes(artist.id)
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="spinner"></div>
        <span className="ml-2">読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* エラーメッセージ */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      {/* 成功メッセージ */}
      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md">
          <p>{message}</p>
        </div>
      )}
      
      {/* 検索バーを削除しました */}

      {/* フォロー中のアーティスト */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">フォロー中のグループ ({followedArtistsList.length})</h2>
        {followedArtistsList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {followedArtistsList.map(artist => (
              <div key={artist.id} className="bg-white rounded-lg border shadow-sm p-4 flex flex-col">
                <div 
                  className="flex items-center mb-3 cursor-pointer"
                  onClick={(e) => navigateToArtistDetail(artist.id, e)}
                >
                  {artist.image_url ? (
                    <img 
                      src={artist.image_url} 
                      alt={artist.name} 
                      className="w-12 h-12 rounded-full object-cover mr-3"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      <span className="text-gray-500 text-xl">🎤</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium hover:text-blue-500">{artist.name}</h3>
                    {artist.category && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        {artist.category}
                      </span>
                    )}
                  </div>
                </div>
                
                {confirmUnfollow === artist.id ? (
                  <div className="mt-auto">
                    <p className="text-sm text-red-600 mb-2">フォローを解除しますか？</p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUnfollow(artist.id)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-2 rounded"
                      >
                        はい
                      </button>
                      <button
                        onClick={() => setConfirmUnfollow(null)}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm py-1 px-2 rounded"
                      >
                        いいえ
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleUnfollow(artist.id)}
                    className="mt-auto w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-3 rounded flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    フォロー解除
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">フォロー中のアーティストはいません</p>
            <p className="text-sm text-gray-400 mt-1">下記からアーティストをフォローしてみましょう</p>
          </div>
        )}
      </div>

      {/* フォローできるアーティスト */}
      <div>
        <h2 className="text-xl font-bold mb-4">おすすめのグループ</h2>
        
        {unfollowedArtistsList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {unfollowedArtistsList.map(artist => (
              <div key={artist.id} className="bg-white rounded-lg border shadow-sm p-4 flex flex-col">
                <div 
                  className="flex items-center mb-3 cursor-pointer"
                  onClick={(e) => navigateToArtistDetail(artist.id, e)}
                >
                  {artist.image_url ? (
                    <img 
                      src={artist.image_url} 
                      alt={artist.name} 
                      className="w-12 h-12 rounded-full object-cover mr-3"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      <span className="text-gray-500 text-xl">🎤</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium hover:text-blue-500">{artist.name}</h3>
                    {artist.category && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        {artist.category}
                      </span>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => handleFollow(artist.id)}
                  className="mt-auto w-full bg-blue-100 hover:bg-blue-200 text-blue-800 py-1 px-3 rounded flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  フォローする
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">すべてのアーティストをフォロー済みです</p>
          </div>
        )}
      </div>
    </div>
  );
}