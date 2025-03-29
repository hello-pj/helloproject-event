// src/components/common/LocationSearch.jsx
import React, { useState, useEffect, useRef } from 'react';

export default function LocationSearch({ initialLocation = '', onLocationSelect, label = 'お住まいの地域' }) {
  // 各状態を直接コンポーネント内で定義
  const [location, setLocation] = useState(initialLocation);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [error, setError] = useState('');
  const [showMap, setShowMap] = useState(false);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markerRef = useRef(null);
  const [leaflet, setLeaflet] = useState(null);

  // Leafletの読み込み
  useEffect(() => {
    // サーバーサイドレンダリング時はスキップ
    if (typeof window === 'undefined') return;
    
    // Leafletを動的にインポート
    import('leaflet').then(L => {
      // マーカーアイコンの問題を修正
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
      });
      
      setLeaflet(L);
    }).catch(err => {
      console.error('Failed to load Leaflet:', err);
      setError('地図ライブラリの読み込みに失敗しました');
    });
  }, []);

  // 地図の初期化
  useEffect(() => {
    // Leafletがロードされていない、もしくはマップを表示しない場合はスキップ
    if (!leaflet || !showMap || !mapContainerRef.current) return;
    
    // 既に地図が初期化されている場合はスキップ
    if (mapRef.current) return;
    
    try {
      // 地図を初期化（日本の中心あたりを初期表示）
      mapRef.current = leaflet.map(mapContainerRef.current).setView([36.2048, 138.2529], 5);
      
      // OpenStreetMapのタイルレイヤーを追加
      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      // すでに位置情報があれば、その位置にマーカーを表示
      if (selectedLocation) {
        markerRef.current = leaflet.marker([selectedLocation.lat, selectedLocation.lng])
          .addTo(mapRef.current)
          .bindPopup(selectedLocation.name)
          .openPopup();
      }
    } catch (error) {
      console.error('地図初期化エラー:', error);
      setError('地図の初期化に失敗しました');
    }

    return () => {
      // コンポーネントのアンマウント時に地図を破棄
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [leaflet, showMap, selectedLocation]);

  // 位置情報を検索
  const searchLocation = async () => {
    if (!location.trim()) return;
    
    setSearching(true);
    setError('');
    setSearchResults([]);
    
    try {
      // Nominatim APIを使用して位置検索
      const query = encodeURIComponent(location.trim());
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'ja'
        }
      });
      
      if (!response.ok) {
        throw new Error('位置情報の検索に失敗しました');
      }

      const data = await response.json();

      if (data && data.length > 0) {
        // 検索結果を整形
        const results = data.map(item => ({
          name: item.display_name.split(',')[0],
          address: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        }));
        
        setSearchResults(results);
        // 地図を表示
        setShowMap(true);
      } else {
        setError('検索結果が見つかりませんでした。別の場所を試してください。');
      }
    } catch (error) {
      console.error('位置検索エラー:', error);
      setError('位置情報の検索中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setSearching(false);
    }
  };

  // 位置を選択
  const selectLocation = (location) => {
    if (!location) return;
    
    setSelectedLocation(location);
    setLocation(location.name);
    setSearchResults([]);
    
    // 地図を選択した位置に移動
    if (leaflet && mapRef.current) {
      mapRef.current.setView([location.lat, location.lng], 12);
      
      // 既存のマーカーを削除
      if (markerRef.current) {
        markerRef.current.remove();
      }
      
      // 新しいマーカーを追加
      markerRef.current = leaflet.marker([location.lat, location.lng])
        .addTo(mapRef.current)
        .bindPopup(location.name)
        .openPopup();
    }
    
    // 親コンポーネントに通知
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  // Enterキーでの検索
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchLocation();
    }
  };

  // 現在位置を取得
  const getCurrentLocation = () => {
    // サーバーサイドレンダリング時またはナビゲーターが利用できない場合はスキップ
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('お使いのブラウザは位置情報をサポートしていません。');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // 逆ジオコーディングで場所名を取得
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
            headers: {
              'Accept-Language': 'ja'
            }
          });
          
          if (!response.ok) {
            throw new Error('位置情報の変換に失敗しました');
          }
          
          const data = await response.json();
          const locationName = data.display_name.split(',')[0];
          
          const locationData = {
            name: locationName,
            address: data.display_name,
            lat: latitude,
            lng: longitude
          };
          
          selectLocation(locationData);
          // 地図を表示
          setShowMap(true);
        } catch (error) {
          console.error('逆ジオコーディングエラー:', error);
          
          // エラー時はシンプルな位置情報を使用
          selectLocation({
            name: '現在地',
            address: '現在地',
            lat: latitude,
            lng: longitude
          });
          // 地図を表示
          setShowMap(true);
        }
      },
      (error) => {
        console.error('位置情報の取得に失敗しました:', error);
        setError('位置情報の取得に失敗しました。手動で入力してください。');
      }
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block mb-1">{label}</label>
        <div className="flex">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-grow px-3 py-2 border rounded-l"
            placeholder="例: 東京都、大阪府"
          />
          <button
            type="button"
            onClick={searchLocation}
            className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 transition"
            disabled={searching || !location.trim()}
          >
            {searching ? '検索中...' : '検索'}
          </button>
        </div>
        
        {/* 現在地ボタン */}
        <div className="mt-2">
          <button
            type="button"
            onClick={getCurrentLocation}
            className="w-full flex items-center justify-center p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            現在地を使用
          </button>
        </div>
      </div>
      
      {/* エラーメッセージ */}
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {/* 検索結果 */}
      {searchResults.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-2">検索結果</h3>
          <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <div
                key={index}
                className="p-3 hover:bg-gray-50 cursor-pointer transition"
                onClick={() => selectLocation(result)}
              >
                <div className="font-medium">{result.name}</div>
                <div className="text-sm text-gray-600">{result.address}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 選択された位置を表示 */}
      {selectedLocation && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-lg font-medium text-blue-800 mb-1">選択された位置</h3>
          <div className="text-blue-700">{selectedLocation.name}</div>
          <div className="text-sm text-blue-600">{selectedLocation.address}</div>
        </div>
      )}
      
      {/* 地図表示エリア */}
      {showMap && (
        <div className="w-full h-64 bg-gray-200 rounded-md overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full"></div>
        </div>
      )}
    </div>
  );
}