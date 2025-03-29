// src/components/onboarding/ArtistSelection.jsx
import React, { useState, useEffect } from 'react';
import supabase from '../../lib/supabase';

export default function ArtistSelection({ nextStep, userData }) {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtists, setSelectedArtists] = useState(userData.favoriteArtists || []);

  useEffect(() => {
    // アーティスト一覧を取得
    const fetchArtists = async () => {
      try {
        // アーティスト一覧を取得
        const { data, error } = await supabase
          .from('artists')
          .select('id, name, image_url, sort_order')
          .order('sort_order');
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setArtists(data);
        } else {
          // データがない場合はダミーデータを使用
          console.warn('アーティストデータが取得できないため、ダミーデータを使用します');
          const dummyArtists = [
            { id: 'c1c3ccef-504b-4ae9-9b4a-3cdfd3ba795f', name: 'モーニング娘。\'25', image_url: 'https://hello-pj.github.io/img/morning_musume_image.jpg', sort_order: 1 },
            { id: '0d9d488d-dc9b-4626-99d2-45211db87d5c', name: 'アンジュルム', image_url: 'https://hello-pj.github.io/img/angerme_image.jpg', sort_order: 2 },
            { id: '84d0bbd4-b3d3-4ed8-8e9e-91c7667a3e11', name: 'Juice=Juice', image_url: 'https://hello-pj.github.io/img/juice_juice_image.jpg', sort_order: 3 },
            { id: '67c0b98b-35c6-4dc6-891d-a1b3b550068d', name: 'つばきファクトリー', image_url: 'https://hello-pj.github.io/img/tsubaki_factory_image.jpg', sort_order: 4 },
            { id: 'c724e3f5-e91d-4852-930a-77957bc472db', name: 'BEYOOOOONDS', image_url: 'https://hello-pj.github.io/img/beyooooonds_image.jpg', sort_order: 5 },
            { id: 'e4f7af6f-8a7d-49eb-ae4f-2a3972da83a5', name: 'OCHA NORMA', image_url: 'https://hello-pj.github.io/img/ocha_norma_image.jpg', sort_order: 6 },
            { id: 'b1fc0cd3-9eed-4761-8436-173fb515d056', name: 'ロージークロニクル', image_url: 'https://hello-pj.github.io/img/rosy_chronicle_image.jpg', sort_order: 7 }
          ];
          setArtists(dummyArtists);
        }
      } catch (error) {
        console.error('アーティスト取得エラー:', error);
        // エラー時もダミーデータを使用
        const dummyArtists = [
          { id: 'c1c3ccef-504b-4ae9-9b4a-3cdfd3ba795f', name: 'モーニング娘。\'25', image_url: 'https://hello-pj.github.io/img/morning_musume_image.jpg', sort_order: 1 },
          { id: '0d9d488d-dc9b-4626-99d2-45211db87d5c', name: 'アンジュルム', image_url: 'https://hello-pj.github.io/img/angerme_image.jpg', sort_order: 2 },
          { id: '84d0bbd4-b3d3-4ed8-8e9e-91c7667a3e11', name: 'Juice=Juice', image_url: 'https://hello-pj.github.io/img/juice_juice_image.jpg', sort_order: 3 },
          { id: '67c0b98b-35c6-4dc6-891d-a1b3b550068d', name: 'つばきファクトリー', image_url: 'https://hello-pj.github.io/img/tsubaki_factory_image.jpg', sort_order: 4 },
          { id: 'c724e3f5-e91d-4852-930a-77957bc472db', name: 'BEYOOOOONDS', image_url: 'https://hello-pj.github.io/img/beyooooonds_image.jpg', sort_order: 5 },
          { id: 'e4f7af6f-8a7d-49eb-ae4f-2a3972da83a5', name: 'OCHA NORMA', image_url: 'https://hello-pj.github.io/img/ocha_norma_image.jpg', sort_order: 6 },
          { id: 'b1fc0cd3-9eed-4761-8436-173fb515d056', name: 'ロージークロニクル', image_url: 'https://hello-pj.github.io/img/rosy_chronicle_image.jpg', sort_order: 7 }
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

      {/* 検索ボックスと絞り込みボタンを削除 */}

      {loading ? (
        <div className="flex justify-center my-8">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {/* アーティスト一覧 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
            {artists.map((artist) => (
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