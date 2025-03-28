// src/components/Navigation.jsx
import React from 'react';

export default function Navigation() {
  const currentPath = window.location.pathname;

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex space-x-4">
            <a 
              href="/helloproject-event/" 
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                currentPath === '/helloproject-event/' 
                  ? 'border-blue-500 text-gray-900' 
                  : 'border-transparent text-gray-500 hover:border-gray-300'
              }`}
            >
              ホーム
            </a>
            <a 
              href="/helloproject-event/artists" 
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                currentPath === '/helloproject-event/artists' 
                  ? 'border-blue-500 text-gray-900' 
                  : 'border-transparent text-gray-500 hover:border-gray-300'
              }`}
            >
              アーティスト
            </a>
            <a 
              href="/helloproject-event/events" 
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                currentPath === '/helloproject-event/events' 
                  ? 'border-blue-500 text-gray-900' 
                  : 'border-transparent text-gray-500 hover:border-gray-300'
              }`}
            >
              イベント
            </a>
          </div>
          <div className="flex items-center">
            <a 
              href="/helloproject-event/profile" 
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                currentPath === '/helloproject-event/profile' 
                  ? 'border-blue-500 text-gray-900' 
                  : 'border-transparent text-gray-500 hover:border-gray-300'
              }`}
            >
              マイページ
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}