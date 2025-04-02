// src/components/ArtistDetail.jsx
import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../lib/firebase';
import supabase from '../lib/supabase';
import { addToFavorites, removeFromFavorites } from '../lib/data-service';
import EventMap from './EventMap';

export default function ArtistDetail({ artistId }) {
  const [artist, setArtist] = useState(null);
  const [events, setEvents] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // アーティスト情報とイベント情報を取得
  useEffect(() => {
    const fetchArtistData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 現在のユーザーを取得
        const currentUser = auth.currentUser;
        setUser(currentUser);

        // アーティスト情報を取得（SNSリンクを含む）
        const { data: artistData, error: artistError } = await supabase
          .from('artists')
          .select('*, twitter_url, instagram_url, youtube_url, tiktok_url, website_url') // SNS URLを明示的に指定
          .eq('id', artistId)
          .single();

        if (artistError) throw artistError;
        setArtist(artistData);

        // artist_eventsテーブルを介さずに直接eventsテーブルから取得（テスト用）
        // 実際の環境では適切な結合が必要です
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select(`
            id,
            title,
            start_date,
            venues(name, address)
          `)
          .gt('start_date', new Date().toISOString())
          .order('start_date', { ascending: true })
          .limit(5); // テスト用に少数のイベントを取得

        // エラーをスキップしてデータが取得できた場合のみ設定
        if (!eventsError && eventsData) {
          setEvents(eventsData);
        } else {
          console.log('イベント取得結果:', eventsError || 'データなし');
          setEvents([]); // 空の配列を設定
        }

        // フォロー状態を確認
        if (currentUser) {
          const { data: favorite, error: favoriteError } = await supabase
            .from('user_favorites')
            .select('id')
            .eq('user_id', currentUser.uid)
            .eq('artist_id', artistId)
            .single();

          if (!favoriteError && favorite) {
            setIsFollowing(true);
          }
        }
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('アーティスト情報の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();
  }, [artistId]);

  // フォロー状態の切り替え
  const toggleFollow = async () => {
    try {
      if (!user) {
        // ログインしていない場合はログインページへリダイレクト
        window.location.href = '/helloproject-event/login';
        return;
      }

      if (isFollowing) {
        // フォロー解除
        await removeFromFavorites(artistId);
        setIsFollowing(false);
      } else {
        // フォロー追加
        await addToFavorites(artistId);
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('フォロー処理エラー:', err);
      alert('フォロー状態の更新に失敗しました');
    }
  };

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
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-500">アーティスト情報が見つかりません。</p>
      </div>
    );
  }

  // 表示用のイベントデータ
  const displayEvents = events;

  return (
    <div>
      {/* アーティストヘッダー */}
      <div className="relative bg-gradient-to-r from-blue-900 to-purple-900 text-white">
        {/* 背景画像（ある場合） */}
        {artist.image_url && (
          <div className="absolute inset-0 opacity-30 bg-center bg-cover" style={{backgroundImage: `url(${artist.image_url})`}}></div>
        )}
        
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start">
            {/* アーティスト画像 */}
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 mb-4 md:mb-0 md:mr-6">
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
            
            {/* アーティスト情報 */}
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{artist.name}</h1>
              <div className="mb-4 flex flex-wrap gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                  フォロワー数: 計算中...
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${displayEvents.length > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  近日イベント: {displayEvents.length} 件
                </span>
              </div>
              
              <p className="mb-6 max-w-2xl">
  <>
    {`${artist.name}の最新イベント情報をチェック！`}
    <br />
    {`コンサート・ライブ・イベントの公演情報を受け取ることができます。`}
  </>
</p>
              
              <button 
                onClick={toggleFollow}
                className={`transition shadow-md flex items-center px-6 py-2 rounded-full ${
                  isFollowing 
                    ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill={isFollowing ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                </svg>
                {isFollowing ? 'フォロー中' : 'フォローする'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* コンテンツエリア */}
      <div className="container mx-auto px-4 py-8">
        {/* タブナビゲーション */}
        <div className="mb-8 border-b">
          <nav className="flex space-x-8">
            <a href="#events" className="border-b-2 border-blue-500 py-4 px-1 text-blue-500 font-medium">
              イベント
            </a>
            <a href="#about" className="border-b-2 border-transparent py-4 px-1 text-gray-500 hover:text-gray-700 font-medium">
              アーティスト情報
            </a>
            <a href="#map" className="border-b-2 border-transparent py-4 px-1 text-gray-500 hover:text-gray-700 font-medium">
              会場マップ
            </a>
          </nav>
        </div>
        
        {/* 近日のイベント */}
        <div id="events" className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">近日のイベント</h2>
            <a href={`/helloproject-event/events?artist=${artistId}`} className="text-blue-500 hover:underline">
              すべて表示 &rarr;
            </a>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {displayEvents.length > 0 ? (
              displayEvents.map(event => (
                <div key={event.id} className="border-b last:border-b-0 p-4 flex flex-wrap md:flex-nowrap items-center hover:bg-gray-50 transition">
                  {/* 日付 */}
                  <div className="w-full md:w-auto md:mr-6 mb-4 md:mb-0 text-center">
                    <div className="bg-gray-100 rounded p-2 inline-block">
                      <div className="text-sm text-gray-500">
                        {new Date(event.start_date).toLocaleDateString('ja-JP', {year: 'numeric', month: 'short'}).replace(/\s+/g, '年')}月
                      </div>
                      <div className="text-2xl font-bold">
                        {new Date(event.start_date).getDate()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(event.start_date).toLocaleDateString('ja-JP', {weekday: 'short'})}
                      </div>
                    </div>
                  </div>
                  
                  {/* イベント詳細 */}
                  <div className="flex-grow md:mr-4">
                    <h3 className="font-medium mb-1">{event.title || `${artist.name} コンサート`}</h3>
                    <div className="text-sm text-gray-600 mb-1">
                      {event.venues?.name || '会場未定'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {event.venues?.address || '住所情報なし'}
                    </div>
                  </div>
                  
                  {/* アクションボタン */}
                  <div className="w-full md:w-auto flex items-center space-x-2 mt-4 md:mt-0">
                    <button className="text-gray-400 hover:text-red-500 transition">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                      </svg>
                    </button>
                    <a 
                      href={`/helloproject-event/events/${event.id}`}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-4 rounded transition"
                    >
                      詳細
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gray-100 rounded-full">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{artist.name}の予定されたイベントはありません</h3>
                <p className="text-gray-500 mb-4">現在、公式に発表されているイベントはありません。</p>
                <button
                  onClick={toggleFollow}
                  className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium transition ${
                    isFollowing 
                      ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50' 
                      : 'border-blue-500 bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill={isFollowing ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                  </svg>
                  {isFollowing ? '通知設定済み' : 'イベントの通知を受け取る'}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* アーティスト情報 */}
        <div id="about" className="mb-12">
          <h2 className="text-2xl font-bold mb-6">アーティスト情報</h2>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="prose max-w-none">
              {artist.description ? (
                <p>{artist.description}</p>
              ) : (
                <p>アーティスト情報は準備中です。</p>
              )}
            </div>
            
            {/* SNSリンクなど */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium mb-3">公式リンク</h3>
              <div className="flex flex-wrap gap-4">
                {artist.website_url && (
                  <a 
                    href={artist.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gray-400 hover:text-gray-700 transition"
                    aria-label="公式サイト"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                    </svg>
                  </a>
                )}
                {artist.twitter_url && (
                  <a 
                    href={artist.twitter_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gray-400 hover:text-gray-700 transition"
                    aria-label="X（旧Twitter）"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
                {artist.instagram_url && (
                  <a 
                    href={artist.instagram_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gray-400 hover:text-gray-700 transition"
                    aria-label="Instagram"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                    </svg>
                  </a>
                )}
                {artist.youtube_url && (
                  <a 
                    href={artist.youtube_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gray-400 hover:text-gray-700 transition"
                    aria-label="YouTube"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                    </svg>
                  </a>
                )}
                {artist.tiktok_url && (
                  <a 
                    href={artist.tiktok_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gray-400 hover:text-gray-700 transition"
                    aria-label="TikTok"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                   </svg>
                 </a>
               )}
             </div>
           </div>
         </div>
       </div>
       
       {/* 会場マップ */}
       <div id="map" className="mb-12">
         <h2 className="text-2xl font-bold mb-6">会場マップ</h2>
         
         <EventMap artistId={artistId} />
       </div>
     </div>
   </div>
 );
}