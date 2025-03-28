// src/pages/api/favorites.js (Astroでのサーバーエンドポイント例)
import { createClient } from '@supabase/supabase-js';
import { verifyIdToken } from '../../lib/firebase-admin';

export async function post({ request }) {
    try {
        // リクエストからFirebaseトークンを取得
        const { idToken, favorites } = await request.json();

        // Firebaseトークンを検証してユーザーIDを取得
        const { uid } = await verifyIdToken(idToken);

        // Supabaseクライアントを作成（サービスロールキーを使用）
        const supabaseAdmin = createClient(
            import.meta.env.PUBLIC_SUPABASE_URL,
            import.meta.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // お気に入りデータを作成
        const favoriteEntries = favorites.map(artistId => ({
            user_id: uid,
            artist_id: artistId,
            notification_enabled: true,
            created_at: new Date().toISOString()
        }));

        // Supabaseにデータを挿入
        const { data, error } = await supabaseAdmin
            .from('user_favorites')
            .insert(favoriteEntries);

        if (error) throw error;

        return new Response(
            JSON.stringify({ success: true, data }), { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}