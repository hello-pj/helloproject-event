// src/components/onboarding/LocationSetup.jsx
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// マーカーアイコンの問題を修正
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
});

export default function LocationSetup({ nextStep, prevStep, userData }) {
  const [location, setLocation] = useState(userData.location || '');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [error, setError] = useState('');
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markerRef = useRef(null);

  // 地図の初期化
  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      // 地図を初期化（日本の中心あたりを初期表示）
      mapRef.current = L.map(mapContainerRef.current).setView([36.2048, 138.2529], 5);
      
      // OpenStreetMapのタイルレイヤーを追加
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
    }

    return () => {
      // コンポーネントのアンマウント時に地図を破棄
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 位置情報を検索
  const searchLocation = async () => {
    if (!location.trim()) return;
    
    setSearching(true);
    setError('');
    setSearchResults([]);
    
    try {
      // Nominatim APIを使用して位置検索
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&country=jp&limit=5&addressdetails=1`, {
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
    setSelectedLocation(location);
    setLocation(location.name);
    setSearchResults([]);
    
    // 地図を選択した位置に移動
    if (mapRef.current) {
      mapRef.current.setView([location.lat, location.lng], 12);
      
      // 既存のマーカーを削除
      if (markerRef.current) {
        markerRef.current.remove();
      }
      
      // 新しいマーカーを追加
      markerRef.current = L.marker([location.lat, location.lng])
        .addTo(mapRef.current)
        .bindPopup(location.name)
        .openPopup();
    }
  };

  // 現在位置を取得
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
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
          } catch (error) {
            console.error('逆ジオコーディングエラー:', error);
            
            // エラー時はシンプルな位置情報を使用
            selectLocation({
              name: '現在地',
              address: '現在地',
              lat: latitude,
              lng: longitude
            });
          }
        },
        (error) => {
          console.error('位置情報の取得に失敗しました:', error);
          setError('位置情報の取得に失敗しました。手動で入力してください。');
        }
      );
    } else {
      setError('お使いのブラウザは位置情報をサポートしていません。');
    }
  };

  // Enterキーでの検索
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchLocation();
    }
  };

  // 次へ進む
  const handleNext = () => {
    if (selectedLocation) {
      nextStep({ 
        location: selectedLocation.name,
        locationData: selectedLocation
      });
    } else if (location) {
      // 位置が選択されていない場合でもテキスト入力は許可
      nextStep({ location });
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-2">位置情報の設定</h2>
      <p className="text-gray-600 mb-6">
        お住まいの地域を設定して、近くで開催されるイベント情報を取得しましょう。
      </p>

      {/* 位置情報入力 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          お住まいの地域
        </label>
        <div className="flex">
          <input
            type="text"
            className="flex-grow p-2 border rounded-l-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="都市名や地域名を入力..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={searchLocation}
            className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 transition"
            disabled={searching || !location.trim()}
          >
            {searching ? '検索中...' : '検索'}
          </button>
        </div>
      </div>

      {/* 現在地ボタン */}
      <div className="mb-6">
        <button
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

      {/* エラーメッセージ */}
      {error && (
        <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* 検索結果 */}
      {searchResults.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">検索結果</h3>
          <div className="border rounded-md divide-y">
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
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-lg font-medium text-blue-800 mb-1">選択された位置</h3>
          <div className="text-blue-700">{selectedLocation.name}</div>
          <div className="text-sm text-blue-600">{selectedLocation.address}</div>
        </div>
      )}

      {/* 地図表示エリア */}
      <div className="mb-6 w-full h-64 bg-gray-200 rounded-md overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full"></div>
      </div>

      {/* フッターボタン */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={prevStep}
          className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
        >
          戻る
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
          disabled={!location.trim()}
        >
          次へ
        </button>
      </div>
    </div>
  );
}