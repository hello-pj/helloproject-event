// src/components/OnboardingFlow.jsx
import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import ArtistSelection from './onboarding/ArtistSelection';
import LocationSetup from './onboarding/LocationSetup';
import NotificationSetup from './onboarding/NotificationSetup';
import Completion from './onboarding/Completion';
import supabase from '../lib/supabase';

export default function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({
    favoriteArtists: [],
    location: '',
    notificationsEnabled: false
  });
  const [loading, setLoading] = useState(false);

  // 次のステップに進む
const nextStep = async (data) => {
    console.log('現在のステップ:', step); // デバッグ用
    console.log('受け取ったデータ:', data); // デバッグ用
    
    setLoading(true);
    
    // 現在のステップのデータを保存
    const updatedUserData = { ...userData, ...data };
    setUserData(updatedUserData);
    
    console.log('更新後のユーザーデータ:', updatedUserData); // デバッグ用
    
    // 最後のステップの場合はデータをSupabaseに保存
    if (step === 3) {
      try {
        // Supabaseへの保存処理（変更なし）
      } catch (error) {
        console.error('データ保存エラー:', error);
      }
    }
    
    setLoading(false);
    // ステップを確実に増加させる
    setStep(prevStep => prevStep + 1);
  };

  // 前のステップに戻る
  const prevStep = () => {
    setStep(step - 1);
  };

  // 現在のステップに基づいてコンポーネントを表示
  const renderStep = () => {
    switch (step) {
      case 1:
        return <ArtistSelection nextStep={nextStep} userData={userData} />;
      case 2:
        return <LocationSetup nextStep={nextStep} prevStep={prevStep} userData={userData} />;
      case 3:
        return <NotificationSetup nextStep={nextStep} prevStep={prevStep} userData={userData} />;
      case 4:
        return <Completion userData={userData} />;
      default:
        return <ArtistSelection nextStep={nextStep} userData={userData} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <div className="spinner"></div>
          <span className="ml-2">処理中...</span>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          {/* プログレスバー */}
          <div className="w-full max-w-2xl mx-auto mb-8">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                    ステップ {step} / 4
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {Math.round((step / 4) * 100)}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                <div
                  style={{ width: `${(step / 4) * 100}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
                ></div>
              </div>
            </div>
          </div>

          {/* 現在のステップ */}
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md">
            {renderStep()}
          </div>
        </div>
      )}
    </div>
  );
}