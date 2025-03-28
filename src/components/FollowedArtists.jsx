// src/components/FollowedArtists.jsx
import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import supabase from '../lib/supabase';

export default function FollowedArtists() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null); // デバッグ情報追加

  useEffect(() => {
    async function fetchArtists() {
      try {
        setLoading(true);
        console.log("フォロー中アーティストの取得を開始");
        
        // 現在のユーザーを取得
        const user = auth.currentUser;
        if (!user) {
          console.log("ユーザーがログインしていません");
          setError("ログインが必要です");
          setLoading(false);
          return;
        }
        
        console.log("ログインユーザー:", user.uid);
        
        // デバッグ情報：ユーザー情報をチェック
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', user.uid);
          
        if (userError) {
          console.error("ユーザー情報取得エラー:", userError);
        } else {
          console.log("ユーザー情報:", userData);
        }
        
        // user_favoritesテーブルの全データをデバッグのために取得
        const { data: allFavorites, error: allFavError } = await supabase
          .from('user_favorites')
          .select('*')
          .limit(10);
          
        if (allFavError) {
          console.error("全お気に入り取得エラー:", allFavError);
        } else {
          console.log("テーブル内のお気に入りデータ（最大10件）:", allFavorites);
          setDebugInfo({
            tableData: allFavorites,
            currentUserId: user.uid
          });
        }
        
        // ユーザーのお気に入り情報を取得 - 明示的に全フィールドを取得
        const { data: favorites, error: favError } = await supabase
          .from('user_favorites')
          .select('*')  // id, artist_id, notification_enabledなど全フィールド
          .eq('user_id', user.uid);
            
        if (favError) {
          console.error("お気に入り取得エラー:", favError);
          throw favError;
        }
        
        console.log("お気に入り情報:", favorites);
        
        if (!favorites || favorites.length === 0) {
          console.log("フォロー中のアーティストがありません");
          setArtists([]);
          setLoading(false);
          return;
        }
        
        // アーティストIDの配列を取得
        const artistIds = favorites.map(fav => fav.artist_id);
        console.log("アーティストID:", artistIds);
        
        // アーティスト情報を取得
        const { data: artistsData, error: artistsError } = await supabase
          .from('artists')
          .select('*')
          .in('id', artistIds);
            
        if (artistsError) {
          console.error("アーティスト取得エラー:", artistsError);
          throw artistsError;
        }
        
        console.log("取得したアーティスト:", artistsData);
        setArtists(artistsData || []);
        setLoading(false);
      } catch (err) {
        console.error("エラー発生:", err);
        setError("データの取得に失敗しました: " + err.message);
        setLoading(false);
      }
    }
    
    fetchArtists();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-40">
      <div className="spinner"></div>
      <span className="ml-2">読み込み中...</span>
    </div>
  );
  
  if (error) return (
    <div className="p-4 bg-red-50 text-red-600 rounded-md">
      <p>{error}</p>
    </div>
  );
  
  if (debugInfo && debugInfo.tableData && debugInfo.tableData.length === 0) {
    // データベース自体に何もデータがない場合
    return (
      <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md mb-4">
        <p>データベースにお気に入りデータが見つかりません。まずはアーティストをフォローしてみましょう。</p>
        <a href="/helloproject-event/artists" className="mt-2 inline-block text-blue-500 hover:underline">
          アーティスト一覧へ
        </a>
      </div>
    );
  }
  
  if (artists.length === 0) {
    // ログインユーザーのデータがない場合
    return (
      <div>
       
        <div className="p-4 bg-gray-50 rounded-md mb-4">
          <p>フォロー中のアーティストがありません。アーティスト一覧からフォローしてみましょう。</p>
          <a href="/helloproject-event/artists" className="mt-2 inline-block text-blue-500 hover:underline">
            アーティスト一覧へ
          </a>
        </div>
        
        {debugInfo && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <h3 className="font-medium mb-2">デバッグ情報</h3>
            <p>現在のユーザーID: {debugInfo.currentUserId}</p>
            <p>テーブルデータ: {debugInfo.tableData ? debugInfo.tableData.length : 0} 件</p>
            {debugInfo.tableData && debugInfo.tableData.length > 0 && (
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full border">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="px-2 py-1 border">user_id</th>
                      <th className="px-2 py-1 border">artist_id</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debugInfo.tableData.map((item, index) => (
                      <tr key={index} className={item.user_id === debugInfo.currentUserId ? "bg-green-50" : ""}>
                        <td className="px-2 py-1 border">{item.user_id}</td>
                        <td className="px-2 py-1 border">{item.artist_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {artists.map(artist => (
          <div key={artist.id} className="p-4 bg-white shadow rounded-lg hover:shadow-md transition">
            <div className="flex items-center">
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
                <h3 className="font-medium">{artist.name}</h3>
                {artist.category && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {artist.category}
                  </span>
                )}
              </div>
            </div>
            {artist.description && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">{artist.description}</p>
            )}
            <a 
              href={`/helloproject-event/artists/${artist.id}`} 
              className="mt-3 text-sm text-blue-500 hover:underline inline-block"
            >
              詳細を見る
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}