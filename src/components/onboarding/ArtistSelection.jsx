// src/components/onboarding/ArtistSelection.jsx
import React, { useState, useEffect } from 'react';
import supabase from '../../lib/supabase';

export default function ArtistSelection({ nextStep, userData }) {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtists, setSelectedArtists] = useState(userData.favoriteArtists || []);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // アーティスト一覧を取得
    const fetchArtists = async () => {
      try {
        const { data, error } = await supabase
          .from('artists')
          .select('id, name, image_url')
          .order('name');
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setArtists(data);
        } else {
          // データがない場合はダミーデータを使用
          console.warn('アーティストデータが取得できないため、ダミーデータを使用します');
          const dummyArtists = [
            { id: '1', name: 'モーニング娘。', image_url: 'https://placehold.co/200x200?text=モーニング娘。' },
            { id: '2', name: 'アンジュルム', image_url: 'https://placehold.co/200x200?text=アンジュルム' },
            { id: '3', name: 'Juice=Juice', image_url: 'https://placehold.co/200x200?text=Juice=Juice' },
            { id: '4', name: 'つばきファクトリー', image_url: 'https://placehold.co/200x200?text=つばきファクトリー' },
            { id: '5', name: 'BEYOOOOONDS', image_url: 'https://placehold.co/200x200?text=BEYOOOOONDS' }
          ];
          setArtists(dummyArtists);
        }
      } catch (error) {
        console.error('アーティスト取得エラー:', error);
        // エラー時もダミーデータを使用
        const dummyArtists = [
          { id: '1', name: 'モーニング娘。', image_url: 'https://placehold.co/200x200?text=モーニング娘。' },
          { id: '2', name: 'アンジュルム', image_url: 'https://placehold.co/200x200?text=アンジュルム' },
          { id: '3', name: 'Juice=Juice', image_url: 'https://placehold.co/200x200?text=Juice=Juice' },
          { id: '4', name: 'つばきファクトリー', image_url: 'https://placehold.co/200x200?text=つばきファクトリー' },
          { id: '5', name: 'BEYOOOOONDS', image_url: 'https://placehold.co/200x200?text=BEYOOOOONDS' }
        ];
        setArtists(dummyArtists);
      } finally {
        setLoading(false);
      }
    };
  
    fetchArtists();
  }, []);

  // アーティスト選択の切り替え
  const toggleArtistSelection = (artistId) => {
    if (selectedArtists.includes(artistId)) {
      setSelectedArtists(selectedArtists.filter(id => id !== artistId));
    } else {
      setSelectedArtists([...selectedArtists, artistId]);
    }
  };

  // 検索フィルター
  const filteredArtists = artists.filter(artist => 
    artist.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 次へ進む
  const handleNext = () => {
    console.log('選択されたアーティスト:', selectedArtists); // デバッグ用
    nextStep({ favoriteArtists: selectedArtists });
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-2">お気に入りアーティストをフォロー</h2>
      <p className="text-gray-600 mb-6">
        あなたが好きなアーティストを選択して、最新のイベント情報を受け取りましょう。
      </p>

      {/* 検索ボックス */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input
            type="search"
            className="block w-full p-4 pl-10 text-sm border rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
            placeholder="アーティストを検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* カテゴリータブ */}
      <div className="flex overflow-x-auto pb-2 mb-4 space-x-2">
        {['おすすめ', '人気', 'アイドル', '声優', 'バンド'].map((category) => (
          <button
            key={category}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 whitespace-nowrap"
            onClick={() => {/* カテゴリーフィルタリング */}}
          >
            {category}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center my-8">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {/* アーティスト一覧 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
            {filteredArtists.map((artist) => (
              <div
                key={artist.id}
                className={`relative flex flex-col items-center p-2 rounded-lg cursor-pointer transition-all ${
                  selectedArtists.includes(artist.id) ? 'bg-blue-100 border-2 border-blue-500' : 'bg-white border border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => toggleArtistSelection(artist.id)}
              >
                {/* アーティスト画像 */}
                <div className="w-full aspect-square rounded-full overflow-hidden mb-2 flex items-center justify-center bg-gray-100">
                  {artist.image_url ? (
                    <img src={artist.image_url} alt={artist.name} className="object-cover w-full h-full" />
                  ) : (
                    <div className="text-gray-400 text-4xl">🎤</div>
                  )}
                </div>
                
                {/* チェックマーク (選択時) */}
                {selectedArtists.includes(artist.id) && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                )}
                
                {/* アーティスト名 */}
                <span className="text-sm font-medium text-center truncate w-full">{artist.name}</span>
              </div>
            ))}
          </div>

          {/* マイアーティスト */}
          {selectedArtists.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">マイアーティスト ({selectedArtists.length})</h3>
              <div className="flex flex-wrap gap-2">
                {selectedArtists.map((artistId) => {
                  const artist = artists.find(a => a.id === artistId);
                  return artist ? (
                    <div key={artist.id} className="inline-flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1">
                      <span className="text-sm">{artist.name}</span>
                      <button
                        className="ml-1 text-blue-600 hover:text-blue-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleArtistSelection(artist.id);
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* フッターボタン */}
        <div className="mt-8 flex justify-between">
        <div></div>
        <button
            onClick={handleNext}
            className={`px-6 py-2 text-white rounded-md transition ${
            selectedArtists.length > 0
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            disabled={selectedArtists.length === 0}
        >
            次へ
        </button>
        </div>
    </div>
  );
}