import React from 'react';

export default function BasePathTest() {
  // windowオブジェクトの存在をチェック
  const baseUrl = import.meta.env.BASE_URL;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'サーバーサイド';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : 'サーバーサイド';

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Base Path Test</h2>
      <div>
        <p>import.meta.env.BASE_URL: {baseUrl}</p>
        <p>window.location.origin: {origin}</p>
        <p>window.location.pathname: {pathname}</p>
      </div>
    </div>
  );
}