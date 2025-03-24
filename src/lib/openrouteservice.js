// src/lib/openrouteservice.js
// OpenRouteServiceのAPIクライアント設定

// 環境変数からAPIキーとURLを取得
const apiKey =
    import.meta.env.PUBLIC_OPENROUTESERVICE_API_KEY;
const baseUrl =
    import.meta.env.PUBLIC_OPENROUTESERVICE_API_URL || 'https://api.openrouteservice.org';

/**
 * 経路を計算する関数
 * @param {Array} start - 開始地点の座標 [経度, 緯度]
 * @param {Array} end - 終了地点の座標 [経度, 緯度]
 * @param {String} profile - 移動手段 (driving-car, foot-walking, cycling-regular など)
 * @returns {Promise} 経路計算の結果
 */
export async function getRoute(start, end, profile = 'foot-walking') {
    try {
        const response = await fetch(`${baseUrl}/v2/directions/${profile}`, {
            method: 'POST',
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                coordinates: [start, end],
                format: 'geojson'
            })
        });

        if (!response.ok) {
            throw new Error(`OpenRouteService API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching route:', error);
        throw error;
    }
}

/**
 * 位置検索（ジオコーディング）を行う関数
 * @param {String} query - 検索クエリ（場所の名前や住所）
 * @param {Number} limit - 返される結果の最大数
 * @returns {Promise} 検索結果
 */
export async function geocode(query, limit = 5) {
    try {
        const response = await fetch(`${baseUrl}/geocode/search`, {
            method: 'GET',
            headers: {
                'Authorization': apiKey
            },
            params: {
                text: query,
                size: limit,
                lang: 'ja'
            }
        });

        if (!response.ok) {
            throw new Error(`OpenRouteService API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error geocoding location:', error);
        throw error;
    }
}

// その他必要な機能をここに追加

export default {
    getRoute,
    geocode
};