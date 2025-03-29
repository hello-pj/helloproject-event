// src/hooks/useLocationSearch.js
import { useState, useEffect, useRef } from 'react';

// 遅延ロードのためにLeafletをグローバル変数にキャッシュ
let _leaflet = null;

export default function useLocationSearch(initialLocation = '') {
    const [location, setLocation] = useState(initialLocation);
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [error, setError] = useState('');
    const [showMap, setShowMap] = useState(false);
    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);
    const markerRef = useRef(null);
    const [leaflet, setLeaflet] = useState(null);

    // Leafletの読み込み
    useEffect(() => {
        // サーバーサイドレンダリング時はスキップ
        if (typeof window === 'undefined') return;

        // 既にロード済みならそれを使用
        if (_leaflet) {
            setLeaflet(_leaflet);
            return;
        }

        // 動的インポート
        import ('leaflet').then(L => {
            // マーカーアイコンの問題を修正
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
            });

            // グローバルキャッシュとローカル状態の両方に保存
            _leaflet = L;
            setLeaflet(L);
        }).catch(err => {
            console.error('Failed to load Leaflet:', err);
        });
    }, []);

    // 地図の初期化 - Leafletがロードされた後
    useEffect(() => {
        // Leafletがロードされていない、もしくはマップコンテナが準備できていない場合はスキップ
        if (!leaflet || !showMap || !mapContainerRef.current) return;

        // 既に地図が初期化されている場合はスキップ
        if (mapRef.current) return;

        try {
            // 地図を初期化（日本の中心あたりを初期表示）
            mapRef.current = leaflet.map(mapContainerRef.current).setView([36.2048, 138.2529], 5);

            // OpenStreetMapのタイルレイヤーを追加
            leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapRef.current);

            // すでに位置情報があれば、その位置にマーカーを表示
            if (selectedLocation) {
                markerRef.current = leaflet.marker([selectedLocation.lat, selectedLocation.lng])
                    .addTo(mapRef.current)
                    .bindPopup(selectedLocation.name)
                    .openPopup();
            }
        } catch (error) {
            console.error('地図初期化エラー:', error);
            setError('地図の初期化に失敗しました');
        }

        return () => {
            // コンポーネントのアンマウント時に地図を破棄
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [leaflet, showMap, selectedLocation]);

    // 位置情報を検索
    const searchLocation = async() => {
        if (!location.trim()) return;

        setSearching(true);
        setError('');
        setSearchResults([]);

        try {
            // Nominatim APIを使用して位置検索
            const query = encodeURIComponent(location.trim());
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5&addressdetails=1`;

            const response = await fetch(url, {
                headers: {
                    'Accept-Language': 'ja'
                }
            });

            if (!response.ok) {
                throw new Error('位置情報の検索に失敗しました');
            }

            const data = await response.json();

            if (data && data.length > 0) {
                // 検索結果を整形
                const results = data.map(item => ({
                    name: item.display_name.split(',')[0],
                    address: item.display_name,
                    lat: parseFloat(item.lat),
                    lng: parseFloat(item.lon)
                }));

                setSearchResults(results);
                // 地図を表示
                setShowMap(true);
            } else {
                setError('検索結果が見つかりませんでした。別の場所を試してください。');
            }
        } catch (error) {
            console.error('位置検索エラー:', error);
            setError('位置情報の検索中にエラーが発生しました。もう一度お試しください。');
        } finally {
            setSearching(false);
        }
    };

    // 位置を選択
    const selectLocation = (location) => {
        if (!location) return;

        setSelectedLocation(location);
        setLocation(location.name);
        setSearchResults([]);

        // 地図を選択した位置に移動 - leafletとmapRefが利用可能なときのみ
        if (leaflet && mapRef.current) {
            mapRef.current.setView([location.lat, location.lng], 12);

            // 既存のマーカーを削除
            if (markerRef.current) {
                markerRef.current.remove();
            }

            // 新しいマーカーを追加
            markerRef.current = leaflet.marker([location.lat, location.lng])
                .addTo(mapRef.current)
                .bindPopup(location.name)
                .openPopup();
        }
    };

    // 現在位置を取得
    const getCurrentLocation = () => {
        // サーバーサイドレンダリング時またはナビゲーターが利用できない場合はスキップ
        if (typeof window === 'undefined' || !navigator.geolocation) {
            setError('お使いのブラウザは位置情報をサポートしていません。');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async(position) => {
                const { latitude, longitude } = position.coords;

                try {
                    // 逆ジオコーディングで場所名を取得
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
                        headers: {
                            'Accept-Language': 'ja'
                        }
                    });

                    if (!response.ok) {
                        throw new Error('位置情報の変換に失敗しました');
                    }

                    const data = await response.json();
                    const locationName = data.display_name.split(',')[0];

                    const locationData = {
                        name: locationName,
                        address: data.display_name,
                        lat: latitude,
                        lng: longitude
                    };

                    selectLocation(locationData);
                    // 地図を表示
                    setShowMap(true);
                } catch (error) {
                    console.error('逆ジオコーディングエラー:', error);

                    // エラー時はシンプルな位置情報を使用
                    selectLocation({
                        name: '現在地',
                        address: '現在地',
                        lat: latitude,
                        lng: longitude
                    });
                    // 地図を表示
                    setShowMap(true);
                }
            },
            (error) => {
                console.error('位置情報の取得に失敗しました:', error);
                setError('位置情報の取得に失敗しました。手動で入力してください。');
            }
        );
    };

    return {
        location,
        setLocation,
        searching,
        searchResults,
        selectedLocation,
        error,
        showMap,
        mapContainerRef,
        searchLocation,
        selectLocation,
        getCurrentLocation
    };
}