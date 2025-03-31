// src/components/EventMap.jsx
import React, { useState, useEffect, useRef } from 'react';
import supabase from '../lib/supabase';

export default function EventMap({ artistId }) {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [showHotels, setShowHotels] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  // Leafletのロード
  useEffect(() => {
    // サーバーサイドレンダリング時は何もしない
    if (typeof window === 'undefined') return;

    const loadLeaflet = async () => {
      try {
        const L = await import('leaflet');
        // マーカーアイコンの問題を修正
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
        });
        
        window.L = L; // グローバルに設定して再利用できるようにする
        setLeafletLoaded(true);
      } catch (error) {
        console.error('Leafletのロードに失敗しました:', error);
        setError('地図ライブラリの読み込みに失敗しました');
      }
    };

    loadLeaflet();
  }, []);

  // イベント会場データの取得
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setLoading(true);
        
        // eventsテーブルから会場情報を取得（非結合）
        const { data, error } = await supabase
          .from('events')
          .select(`
            id,
            title,
            start_date,
            venues(id, name, address, lat, lng)
          `)
          .gt('start_date', new Date().toISOString())
          .order('start_date', { ascending: true });
        
        if (error) {
          console.error('会場情報取得エラー:', error);
          setVenues([]);
        } else if (data) {
          // 会場情報がある場合のみ追加
          const venuesWithCoords = data
            .filter(event => event.venues && event.venues.lat && event.venues.lng)
            .map(event => ({
              id: event.id,
              venueId: event.venues.id,
              title: event.title,
              name: event.venues.name,
              address: event.venues.address,
              lat: event.venues.lat,
              lng: event.venues.lng,
              date: new Date(event.start_date)
            }));
          
          setVenues(venuesWithCoords);
          
          // 最初のイベントの日付を選択
          if (venuesWithCoords.length > 0) {
            setSelectedDate(venuesWithCoords[0].date);
          }
        } else {
          setVenues([]);
        }
      } catch (err) {
        console.error('会場情報取得エラー:', err);
        setError('会場情報の取得に失敗しました');
        setVenues([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVenues();
  }, [artistId]);

  // 地図の初期化
  useEffect(() => {
    if (!leafletLoaded || venues.length === 0 || !mapContainerRef.current) return;
    
    const L = window.L;
    if (!L) return;
    
    try {
      // 既存の地図がある場合は削除
      if (mapRef.current) {
        mapRef.current.remove();
      }
      
      // マーカーリストをリセット
      markersRef.current = [];
      
      // 会場の座標を取得（最初の会場を中心にする）
      const defaultCenter = [venues[0].lat, venues[0].lng];
      
      // 地図の初期化
      mapRef.current = L.map(mapContainerRef.current).setView(defaultCenter, 12);
      
      // OpenStreetMapタイルレイヤーを追加
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
      
      // 選択された日付に基づいて表示するべき会場を決定
      const dateToShow = selectedDate ? selectedDate : venues[0].date;
      const venuesToShow = venues.filter(venue => 
        selectedDate ? venue.date.toDateString() === dateToShow.toDateString() : true
      );
      
      // 全会場にマーカーを配置
      venuesToShow.forEach(venue => {
        const marker = L.marker([venue.lat, venue.lng])
          .addTo(mapRef.current)
          .bindPopup(`
            <strong>${venue.title || 'イベント'}</strong><br>
            ${venue.name}<br>
            <small>${venue.address}</small><br>
            <small>${venue.date.toLocaleDateString('ja-JP')}</small>
          `);
        
        markersRef.current.push(marker);
      });
      
      // 地図を全てのマーカーが見えるように調整
      if (markersRef.current.length > 1) {
        const group = new L.featureGroup(markersRef.current);
        mapRef.current.fitBounds(group.getBounds().pad(0.1));
      }
      
      setMapInitialized(true);
    } catch (err) {
      console.error('地図初期化エラー:', err);
      setError('地図の初期化に失敗しました');
    }
  }, [leafletLoaded, venues, selectedDate]);

  // 宿泊施設表示の切り替え
  useEffect(() => {
    if (!mapInitialized || !showHotels) return;
    
    // TODO: 宿泊施設のデータを取得して表示する機能
    // この機能は将来的に実装する予定
  }, [mapInitialized, showHotels]);

  // 日付選択の変更
  const handleDateChange = (event) => {
    const dateString = event.target.value;
    if (dateString) {
      setSelectedDate(new Date(dateString));
    } else {
      setSelectedDate(null);
    }
  };

  // 宿泊施設表示の切り替え
  const toggleHotels = () => {
    setShowHotels(!showHotels);
  };

  // 利用可能な日付のリストを生成
  const uniqueDates = [...new Set(venues.map(venue => 
    venue.date.toISOString().split('T')[0]
  ))];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="spinner"></div>
          <span className="ml-2">地図を読み込み中...</span>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          <p>{error}</p>
        </div>
      ) : venues.length === 0 ? (
        <div className="bg-white border rounded-lg shadow p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gray-100 rounded-full">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">マップ情報はありません</h3>
          <p className="text-gray-500 mb-2">イベントが登録されていないか、会場情報が登録されていません。</p>
          <p className="text-sm text-gray-400">新しいイベントが発表されると、ここに会場の地図情報が表示されます。</p>
        </div>
      ) : (
        <>
          {/* 日付選択 */}
          <div className="mb-4 flex flex-wrap items-center justify-between">
            <div className="w-full md:w-auto mb-4 md:mb-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">日付で絞り込む</label>
              <select 
                value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                onChange={handleDateChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">すべての日程</option>
                {uniqueDates.map(date => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString('ja-JP')}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={toggleHotels}
              className={`${
                showHotels 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-white text-gray-700 border-gray-300 border'
              } px-4 py-2 rounded transition flex items-center text-sm`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
              周辺宿泊施設
            </button>
          </div>
          
          {/* 地図コンテナ */}
          <div 
            ref={mapContainerRef} 
            className="w-full h-96 rounded-lg border border-gray-200 overflow-hidden"
          ></div>
          
          {/* 凡例 */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">表示中の会場</h3>
            <div className="space-y-2">
              {venues.filter(venue => 
                selectedDate ? venue.date.toDateString() === selectedDate.toDateString() : true
              ).map(venue => (
                <div key={venue.id} className="flex items-start p-2 bg-gray-50 rounded">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">{venue.name}</div>
                    <div className="text-sm text-gray-500">{venue.address}</div>
                    <div className="text-xs text-gray-400">
                      {venue.date.toLocaleDateString('ja-JP', {year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'})}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}