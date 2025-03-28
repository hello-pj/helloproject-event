// 簡素化されたSideNavigation.jsx
import React from 'react';

export default function SideNavigation({ activePage }) {
  return (
    <div className="bg-gray-800 text-white w-64 min-h-screen">
      <div className="p-5">
        <h2 className="text-2xl font-bold">マイアカウント</h2>
      </div>
      
      <nav>
        <a 
          href="/helloproject-event/profile"
          className="block px-5 py-3 hover:bg-gray-700"
        >
          プロフィール
        </a>
        <a 
          href="/helloproject-event/followed-artists"
          className="block px-5 py-3 hover:bg-gray-700"
        >
          フォロー中のアーティスト
        </a>
      </nav>
    </div>
  );
}