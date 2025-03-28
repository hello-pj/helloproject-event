// src/components/FollowedArtists.jsx（シンプル版）
import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import supabase from '../lib/supabase';

export default function FollowedArtists() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

// FollowedArtists.jsx の useEffect 部分
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
        
        // ユーザーのお気に入り情報を取得
        const { data: favorites, error: favError } = await supabase
          .from('user_favorites')
          .select('artist_id')
          .eq('user_id', user.uid);
          
        if (favError) throw favError;
        
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
          
        if (artistsError) throw artistsError;
        
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

  if (loading) return <p>読み込み中...</p>;
  if (error) return <p>エラー: {error}</p>;
  if (artists.length === 0) return <p>フォロー中のアーティストがありません</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">アーティスト一覧（テスト表示）</h2>
      <ul className="space-y-2">
        {artists.map(artist => (
          <li key={artist.id} className="p-3 bg-white shadow rounded">
            {artist.name}
          </li>
        ))}
      </ul>
    </div>
  );
}