// src/components/onboarding/Completion.jsx
import React from 'react';

export default function Completion({ userData }) {
  // ホームページへ移動
  const goToHome = () => {
    window.location.href = '/helloproject-event/';
  };

  // アカウント設定へ移動
  const goToAccount = () => {
    window.location.href = '/helloproject-event/profile';
  };

  return (
    <div className="p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-blue-100 rounded-full">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 className="text-3xl font-bold mb-2">おめでとうございます！</h2>
        <p className="text-gray-600">
          設定が完了しました。ホームページでイベントを見つけるか、アカウント設定で詳細を調整できます。
        </p>
      </div>

      {/* ユーザー設定サマリー */}
      <div className="mb-8 bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-3">設定の概要</h3>
        
        {/* お気に入りアーティスト */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">フォロー中のアーティスト</h4>
          <div className="flex flex-wrap gap-2">
            {userData.favoriteArtists && userData.favoriteArtists.length > 0 ? (
              userData.favoriteArtists.map((artistId, index) => (
                <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {artistId} {/* 実際にはアーティスト名を表示 */}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-500">フォロー中のアーティストはありません</span>
            )}
          </div>
        </div>
        
        {/* 位置情報 */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">位置情報</h4>
          <div className="flex items-center">
            <svg className="w-4 h-4 text-gray-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <span className="text-sm">{userData.location || '設定されていません'}</span>
          </div>
        </div>
        
        {/* 通知設定 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">通知設定</h4>
          <div className="flex items-center">
            <svg className="w-4 h-4 text-gray-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>
            <span className="text-sm">
              {userData.notificationsEnabled ? '通知オン' : '通知オフ'}
            </span>
          </div>
        </div>
      </div>

      {/* 次のステップオプション */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div 
          className="bg-white border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
          onClick={goToHome}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-md font-medium">イベントを探す</h3>
              <p className="text-sm text-gray-600">
                ホームページに移動して、イベント情報をチェックしましょう。
              </p>
            </div>
          </div>
        </div>
        
        <div 
          className="bg-white border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
          onClick={goToAccount}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-md font-medium">アカウント設定</h3>
              <p className="text-sm text-gray-600">
                プロフィールや通知設定をさらにカスタマイズしましょう。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* フッターボタン */}
      <div className="flex justify-center">
        <button
          onClick={goToHome}
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
        >
          始める
        </button>
      </div>
    </div>
  );
}