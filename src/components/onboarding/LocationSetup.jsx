// src/components/onboarding/LocationSetup.jsx
import React, { useState } from 'react';
import LocationSearch from '../common/LocationSearch';

export default function LocationSetup({ nextStep, prevStep, userData }) {
  const [location, setLocation] = useState(userData.location || '');
  const [selectedLocation, setSelectedLocation] = useState(null);

  // 位置情報が選択されたときのハンドラ
  const handleLocationSelect = (locationData) => {
    setSelectedLocation(locationData);
    setLocation(locationData.name);
  };

  // 次へ進む
  const handleNext = () => {
    console.log('Proceeding to next step with:', { location, selectedLocation });
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

      {/* 共通の位置検索コンポーネントを使用 */}
      <LocationSearch 
        initialLocation={location}
        onLocationSelect={handleLocationSelect}
        label="お住まいの地域"
      />

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