// src/components/onboarding/LocationSetup.jsx
import React, { useState } from 'react';
import { geocode } from '../../lib/openrouteservice';

export default function LocationSetup({ nextStep, prevStep, userData }) {
  const [location, setLocation] = useState(userData.location || '');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [error, setError] = useState('');

  // 位置情報を検索
  const searchLocation = async () => {
    if (!location.trim()) return;
    
    setSearching(true);
    setError('');
    
    try {
      // OpenRouteService APIを使用して位置検索
      // 注: ここではシンプルな実装のためモックデータを使用
      // 実際の実装では適切なAPIコールに置き換える
      
      // モックデータの例
      setTimeout(() => {
        const mockResults = [
          { name: location + ' 市', address: '東京都' + location + '市', lat: 35.6894, lng: 139.6917 },
          { name: location + ' 区', address: '東京都' + location + '区', lat: 35.7090, lng: 139.7320 },
          { name: location + ' 町', address: '埼玉県' + location + '町', lat: 35.8585, lng: 139.6514 }
        ];
        setSearchResults(mockResults);
        setSearching(false);
      }, 1000);
      
      // 実際のAPIコールの例:
      // const results = await geocode(location);
      // setSearchResults(results);
      
    } catch (error) {
      console.error('位置検索エラー:', error);
      setError('位置情報の検索中にエラーが発生しました。もう一度お試しください。');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // 位置を選択
  const selectLocation = (location) => {
    setSelectedLocation(location);
    setLocation(location.name);
    setSearchResults([]);
  };

  // 現在位置を取得
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // ここでは、緯度・経度から場所名を取得する逆ジオコーディングは省略
          // 実際の実装では適切なAPIを使用してください
          
          setSelectedLocation({
            name: '現在地',
            address: '現在地を使用',
            lat: latitude,
            lng: longitude
          });
          
          setLocation('現在地');
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
            onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
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

      {/* 地図表示エリア (実際の実装ではここにLeafletマップを表示) */}
      <div className="mb-6 w-full h-64 bg-gray-200 rounded-md flex items-center justify-center">
        <span className="text-gray-500">ここに地図が表示されます</span>
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