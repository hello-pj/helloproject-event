// src/components/onboarding/NotificationSetup.jsx
import React, { useState } from 'react';
import { requestNotificationPermission } from '../../lib/firebase';

export default function NotificationSetup({ nextStep, prevStep, userData }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    userData.notificationsEnabled || false
  );
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null);

  // 通知設定を有効化
  const enableNotifications = async () => {
    setLoading(true);
    
    try {
      const token = await requestNotificationPermission();
      if (token) {
        setNotificationsEnabled(true);
        setPermissionStatus('granted');
      } else {
        setPermissionStatus('denied');
      }
    } catch (error) {
      console.error('通知設定エラー:', error);
      setPermissionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // 次へ進む
  const handleNext = () => {
    nextStep({ notificationsEnabled });
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-2">通知設定</h2>
      <p className="text-gray-600 mb-6">
        お気に入りアーティストの新しいイベント情報をお知らせします。
      </p>

      {/* 通知説明 */}
      <div className="mb-8">
        <div className="bg-white border rounded-lg shadow-sm p-6 mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">通知を受け取る</h3>
              <p className="mt-1 text-sm text-gray-600">
                ブラウザ通知を有効にすると、以下の情報をお知らせします：
              </p>
              <ul className="mt-2 list-disc pl-5 text-sm text-gray-600 space-y-1">
                <li>お気に入りアーティストの新しいイベント</li>
                <li>チケット発売開始の通知</li>
                <li>参加予定のイベントのリマインダー</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 通知サンプル */}
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <div className="flex items-start max-w-md mx-auto bg-white shadow-md rounded-md p-3">
            <img
              src="https://placehold.co/80x80"
              alt="Artist"
              className="w-10 h-10 rounded-full"
            />
            <div className="ml-3">
              <div className="flex justify-between">
                <span className="text-sm font-semibold">イベント通知</span>
                <span className="text-xs text-gray-500">たった今</span>
              </div>
              <p className="text-sm">
                <span className="font-medium">モーニング娘。</span>のコンサートが発表されました！
              </p>
              <p className="text-xs text-gray-600 mt-1">12月25日 @ 東京ドーム</p>
            </div>
          </div>
        </div>
      </div>

      {/* 通知許可ボタン */}
      <div className="mb-8 text-center">
        {permissionStatus === 'granted' ? (
          <div className="inline-flex items-center px-6 py-3 bg-green-100 text-green-800 rounded-md">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            通知が有効になりました
          </div>
        ) : permissionStatus === 'denied' ? (
          <div className="inline-flex items-center px-6 py-3 bg-red-100 text-red-800 rounded-md">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            通知が拒否されました。ブラウザの設定から許可してください。
          </div>
        ) : (
          <button
            onClick={enableNotifications}
            className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner-sm mr-2"></div>
                処理中...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                通知を有効にする
              </>
            )}
          </button>
        )}
      </div>

      {/* 通知設定オプション */}
      <div className="mb-6">
        <div className="bg-white border rounded-lg p-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-blue-500"
              checked={notificationsEnabled}
              onChange={() => setNotificationsEnabled(!notificationsEnabled)}
            />
            <span className="ml-2 text-gray-700">イベント通知を受け取る</span>
            </label>
          <p className="text-sm text-gray-500 mt-1 ml-7">
            お気に入りアーティストの新規イベント、チケット発売情報、リマインダーなどの通知を受け取ります。
          </p>
        </div>
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
        >
          完了
        </button>
      </div>
    </div>
  );
}