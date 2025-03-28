// src/components/ArtistList.jsx
import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import supabase from '../lib/supabase';
import { addToFavorites, removeFromFavorites } from '../lib/data-service';

export default function ArtistList() {
  const [artists, setArtists] = useState([]);
  const [userFavorites, setUserFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('すべて');
  
  // 初期データ読み込み
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // アーティスト一覧を取得
        const { data: artistData, error: artistError } = await supabase
          .from('artists')
          .select('*')
          .order('name');
          
        if (artistError) throw artistError;
        
        // ログインユーザーのお気に入りを取得
        const user = auth.currentUser;
        if (user) {
          const { data: favoritesData, error: favoritesError } = await supabase
            .from('user_favorites')
            .select('artist_id')
            .eq('user_id', user.uid);
            
          if (favoritesError) throw favoritesError;
          
          // お気に入りのアーティストIDを配列にセット
          setUserFavorites(favoritesData.map(item => item.artist_id));
        }
        
        setArtists(artistData || []);
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('アーティスト情報の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // アーティストのお気に入り登録・解除
  const toggleFavorite = async (artistId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        // 未ログイン時はログインページへリダイレクト
        window.location.href = '/helloproject-event/login';
        return;
      }
      
      if (userFavorites.includes(artistId)) {
        // お気に入り解除 - サービス関数を使用
        await removeFromFavorites(artistId);
        setUserFavorites(userFavorites.filter(id => id !== artistId));
      } else {
        // お気に入り登録 - サービス関数を使用
        await addToFavorites(artistId);
        setUserFavorites([...userFavorites, artistId]);
      }
    } catch (err) {
      console.error('お気に入り処理エラー:', err);
      alert('お気に入りの更新に失敗しました: ' + err.message);
    }
  };
  
  // 検索とフィルタリング
  const filteredArtists = artists.filter(artist => {
    const matchesSearch = artist.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'すべて' || (artist.category && artist.category === categoryFilter);
    return matchesSearch && matchesCategory;
  });
  
  // カテゴリーリスト（アーティストデータから動的に生成）
  const categories = ['すべて', ...new Set(artists.filter(a => a.category).map(a => a.category))];
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner"></div>
        <span className="ml-2">読み込み中...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center p-8 text-red-500">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          再読み込み
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">アーティスト一覧</h1>
      
      {/* 検索バー */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input
            type="search"
            className="block w-full p-4 pl-10 text-sm border rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
            placeholder="アーティスト名で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* カテゴリーフィルター */}
      <div className="flex overflow-x-auto pb-2 mb-6 space-x-2">
        {categories.map((category) => (
          <button
            key={category}
            className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap ${
              categoryFilter === category
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setCategoryFilter(category)}
          >
            {category}
          </button>
        ))}
      </div>
      
      {/* アーティスト一覧 */}
      {filteredArtists.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredArtists.map((artist) => (
            <div
              key={artist.id}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition"
            >
              <a href={`/helloproject-event/artists/${artist.id}`} className="block">
                {/* アーティスト画像 */}
                <div className="w-full aspect-square bg-gray-100 overflow-hidden">
                  {artist.image_url ? (
                    <img
                      src={artist.image_url}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-5xl">
                      🎤
                    </div>
                  )}
                </div>
              </a>
              
              {/* アーティスト情報 */}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1 truncate">{artist.name}</h3>
                {artist.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {artist.description}
                  </p>
                )}
                
                {/* お気に入りボタン */}
                <button
                  onClick={() => toggleFavorite(artist.id)}
                  className={`w-full flex items-center justify-center py-2 px-3 rounded text-sm font-medium ${
                    userFavorites.includes(artist.id)
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <svg
                    className={`w-5 h-5 mr-1 ${userFavorites.includes(artist.id) ? 'text-blue-500' : 'text-gray-400'}`}
                    fill={userFavorites.includes(artist.id) ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    ></path>
                  </svg>
                  {userFavorites.includes(artist.id) ? 'フォロー中' : 'フォローする'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">検索条件に一致するアーティストがありません</p>
        </div>
      )}
    </div>
  );
}