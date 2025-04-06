// src/components/ArtistDetail.jsx のイベント表示部分を修正

import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../lib/firebase';
import supabase from '../lib/supabase';
import { addToFavorites, removeFromFavorites } from '../lib/data-service';
import EventMap from './EventMap';


export default function ArtistDetail({ artistId }) {
  const [artist, setArtist] = useState(null);
  const [events, setEvents] = useState([]); // 予定イベント
  const [pastEvents, setPastEvents] = useState([]); // 過去イベント
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  // タブ切り替え用の状態
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' または 'past'


  // アーティスト情報とイベント情報を取得
// src/components/ArtistDetail.jsx のuseEffect部分

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
        .select('*')
        .eq('id', artistId)
        .single();

      if (artistError) throw artistError;
      setArtist(artistData);

      // イベント情報を取得（まずは単純なクエリで）
      console.log('イベント情報の取得開始');
      const { data: artistEventData, error: artistEventError } = await supabase
        .from('artist_events')
        .select('event_id')
        .eq('artist_id', artistId);

      if (artistEventError) {
        console.error('アーティストイベント関連取得エラー:', artistEventError);
        throw artistEventError;
      }
      
      console.log('アーティストイベント関連:', artistEventData);
      
      // イベントIDのみを抽出
      const eventIds = artistEventData ? artistEventData.map(item => item.event_id) : [];
      
      if (eventIds.length > 0) {
        // イベント詳細情報を取得（すべて取得し、後で分類）
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select(`
            id, 
            title, 
            description, 
            start_date, 
            end_date, 
            start_time, 
            end_time,
            venue_id,
            venue_prefecture,
            ticket_url,
            is_completed,
            event_type
          `)
          .in('id', eventIds)
          .order('start_date', { ascending: false }); // 日付の降順で取得
          
        if (eventsError) {
          console.error('イベント詳細取得エラー:', eventsError);
          throw eventsError;
        }
        
        console.log('取得したイベント情報:', eventsData);
        
        // 現在の日付
        const now = new Date();
        
        // 予定イベントと過去イベントを分類
        const upcomingEventsRaw = eventsData
          .filter(event => !event.is_completed && new Date(event.start_date) >= now)
          .sort((a, b) => new Date(a.start_date) - new Date(b.start_date)); // 昇順（近い順）
          
        const pastEventsRaw = eventsData
          .filter(event => event.is_completed || new Date(event.start_date) < now)
          .sort((a, b) => new Date(b.start_date) - new Date(a.start_date)); // 降順（新しい順）
        
        // 期間制限（オプション）- 現在は6ヶ月としています
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const sixMonthsLater = new Date();
        sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
        
        // 過去イベントは直近6ヶ月のみに制限（オプション）
        const limitedPastEvents = pastEventsRaw
          .filter(event => new Date(event.start_date) >= sixMonthsAgo)
          .slice(0, 5); // 最大5件まで表示
        
        // 予定イベントも6ヶ月先までに制限（オプション）
        const limitedUpcomingEvents = upcomingEventsRaw
          .filter(event => new Date(event.start_date) <= sixMonthsLater)
          .slice(0, 10); // 最大10件まで表示
        
        // イベントをグループ化する関数
        const groupEvents = (events) => {
          const groupedEvents = [];
          const eventGroups = {};
          
          events.forEach(event => {
            // グループキーを生成（日付+タイトル+会場）
            const groupKey = `${event.start_date}_${event.title || 'untitled'}_${event.venue_prefecture || 'unknown'}`;
            
            if (!eventGroups[groupKey]) {
              // 新しいグループを作成
              eventGroups[groupKey] = {
                ...event,
                groupedEvents: [event],
                times: event.start_time ? [formatTime(event.start_time)] : []
              };
              groupedEvents.push(eventGroups[groupKey]);
            } else {
              // 既存のグループに追加
              eventGroups[groupKey].groupedEvents.push(event);
              if (event.start_time) {
                eventGroups[groupKey].times.push(formatTime(event.start_time));
              }
            }
          });
          
          return groupedEvents;
        };
        
        // グループ化して状態を更新
        setEvents(groupEvents(limitedUpcomingEvents));
        setPastEvents(groupEvents(limitedPastEvents));
      } else {
        console.log('このアーティストのイベントは見つかりませんでした');
        setEvents([]);
        setPastEvents([]);
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

  // 時間を表示用にフォーマット
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    // HH:MM:SSの形式 -> HH:MM の形式に変換
    return timeStr.substring(0, 5);
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
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${events.length > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  近日イベント: {events.length} 件
                </span>
              </div>
              
              <p className="mb-6 max-w-2xl">
                {`${artist.name}の最新イベント情報をチェック！`}
                <br />
                {`コンサート・ライブ・イベントの公演情報を受け取ることができます。`}
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
        {/* コンテンツを中央揃えで幅を制限 */}
        <div className="max-w-4xl mx-auto">
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
          
{/* 近日のイベント → イベントに改名 */}
<div id="events" className="mb-12">
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-2xl font-bold">イベント</h2>
    <a href={`/helloproject-event/events?artist=${artistId}`} className="text-blue-500 hover:underline">
      すべて表示 &rarr;
    </a>
  </div>
  
  {/* イベントタブ */}
  <div className="flex border-b mb-4">
    <button
      onClick={() => setActiveTab('upcoming')}
      className={`py-2 px-4 font-medium ${activeTab === 'upcoming' 
        ? 'text-blue-500 border-b-2 border-blue-500' 
        : 'text-gray-500 hover:text-gray-700'}`}
    >
      予定
      {events.length > 0 && <span className="ml-2 bg-blue-100 text-blue-800 text-xs py-0.5 px-2 rounded-full">{events.length}</span>}
    </button>
    <button
      onClick={() => setActiveTab('past')}
      className={`py-2 px-4 font-medium ${activeTab === 'past' 
        ? 'text-blue-500 border-b-2 border-blue-500' 
        : 'text-gray-500 hover:text-gray-700'}`}
    >
      過去
      {pastEvents.length > 0 && <span className="ml-2 bg-gray-100 text-gray-800 text-xs py-0.5 px-2 rounded-full">{pastEvents.length}</span>}
    </button>
  </div>
  
  <div className="bg-white rounded-lg shadow overflow-hidden">
    {activeTab === 'upcoming' ? (
      events.length > 0 ? (
        events.map(event => (
          <div key={event.id} className="border-b last:border-b-0 p-4 flex items-start hover:bg-gray-50 transition">
            {/* 日付 - どのサイズでも左側に固定 */}
            <div className="w-16 mr-4 flex-shrink-0 text-center">
              <div className="text-sm text-gray-500">
                {new Date(event.start_date).toLocaleDateString('ja-JP', {month: 'short'}).replace(/\s+/g, '')}
              </div>
              <div className="text-2xl font-bold leading-tight">
                {new Date(event.start_date).getDate()}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(event.start_date).toLocaleDateString('ja-JP', {weekday: 'short'})}
              </div>
            </div>
            
            {/* イベント詳細 - 最大幅を制限 */}
            <div className="flex-1 flex justify-between items-center">
              <div className="mr-4">
                <h3 className="font-medium">{event.title || `${artist.name} コンサート`}</h3>
                
                <div className="flex flex-wrap items-center mt-1">
                  {event.event_type && (
                    <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded mr-2 mb-1">
                      {event.event_type}
                    </span>
                  )}
                  
                  <span className="text-sm text-gray-600 mb-1">
                    {event.venue_prefecture || '会場未定'}
                  </span>
                </div>
              </div>
              
              {/* アクションボタン - 常に右端に固定 */}
              <div className="flex-shrink-0 flex items-center">
                {/* チケットURLがある場合のボタン */}
                {event.ticket_url && (
                  <a 
                    href={event.ticket_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-green-500 transition mr-2 self-center"
                    title="チケット購入"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path>
                    </svg>
                  </a>
                )}
                
                {/* グループ化されたイベントボタンを縦に並べる */}
                <div className="flex flex-col space-y-2 justify-center">
                  {event.groupedEvents && event.groupedEvents.map((groupedEvent, index) => {
                    // 開演時間がある場合はその時間をボタンに表示、ない場合は「詳細」と表示
                    const buttonLabel = (event.times && event.times.length > 0 && event.times[index]) 
                      ? event.times[index] 
                      : '詳細';
                    
                    return (
                      <a 
                        key={`${groupedEvent.id}-${index}`}
                        href={`/helloproject-event/events/${groupedEvent.id}`}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-3 rounded transition text-center w-16"
                      >
                        {buttonLabel}
                      </a>
                    );
                  })}
                </div>
              </div>
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
      )
    ) : (
      // 過去のイベント表示
      pastEvents.length > 0 ? (
        pastEvents.map(event => (
          <div key={event.id} className="border-b last:border-b-0 p-4 flex items-start hover:bg-gray-50 transition">
            {/* 日付 - どのサイズでも左側に固定 */}
            <div className="w-16 mr-4 flex-shrink-0 text-center">
              <div className="text-sm text-gray-500">
                {new Date(event.start_date).toLocaleDateString('ja-JP', {month: 'short'}).replace(/\s+/g, '')}
              </div>
              <div className="text-2xl font-bold leading-tight">
                {new Date(event.start_date).getDate()}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(event.start_date).toLocaleDateString('ja-JP', {weekday: 'short'})}
              </div>
            </div>
            
            {/* イベント詳細 - 過去のイベントは少し色を変える */}
            <div className="flex-1 flex justify-between items-center opacity-80">
              <div className="mr-4">
                <h3 className="font-medium">{event.title || `${artist.name} コンサート`}</h3>
                
                <div className="flex flex-wrap items-center mt-1">
                  {event.event_type && (
                    <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded mr-2 mb-1">
                      {event.event_type}
                    </span>
                  )}
                  
                  <span className="text-sm text-gray-600 mb-1">
                    {event.venue_prefecture || '会場未定'}
                  </span>
                </div>
              </div>
              
              {/* 過去のイベントでも詳細ボタンは表示 */}
              <div className="flex-shrink-0 flex items-center">
                <div className="flex flex-col space-y-2 justify-center">
                  {event.groupedEvents && event.groupedEvents.map((groupedEvent, index) => (
                    <a 
                      key={`${groupedEvent.id}-${index}`}
                      href={`/helloproject-event/events/${groupedEvent.id}`}
                      className="bg-gray-500 hover:bg-gray-600 text-white text-xs py-1 px-3 rounded transition text-center w-16"
                    >
                      詳細
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gray-100 rounded-full">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">過去のイベント情報はありません</h3>
          <p className="text-gray-500 mb-4">過去6ヶ月以内に開催されたイベント記録はありません。</p>
        </div>
      )
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
                  {/* SNSリンク部分（既存のままで） */}
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
 </div>
);
}