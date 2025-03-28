// src/lib/data-service.js を新規作成
import { withAuth } from './supabase';

// お気に入りアーティストの取得 - 認証済みユーザー専用
export async function getFollowedArtists() {
    return withAuth(async(supabase, userId) => {
        // ユーザーのお気に入り情報を取得
        const { data: favorites, error: favError } = await supabase
            .from('user_favorites')
            .select('artist_id')
            .eq('user_id', userId);

        if (favError) throw favError;

        if (!favorites || favorites.length === 0) {
            return [];
        }

        // アーティストIDの配列を取得
        const artistIds = favorites.map(fav => fav.artist_id);

        // アーティスト情報を取得
        const { data: artistsData, error: artistsError } = await supabase
            .from('artists')
            .select('*')
            .in('id', artistIds);

        if (artistsError) throw artistsError;

        return artistsData || [];
    });
}

// お気に入りの追加 - 認証済みユーザー専用
export async function addToFavorites(artistId) {
    return withAuth(async(supabase, userId) => {
        const newFavorite = {
            id: self.crypto.randomUUID(),
            user_id: userId,
            artist_id: artistId,
            notification_enabled: true,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('user_favorites')
            .insert(newFavorite);

        if (error) throw error;
        return data;
    });
}

// お気に入りの削除 - 認証済みユーザー専用
export async function removeFromFavorites(artistId) {
    return withAuth(async(supabase, userId) => {
        const { data, error } = await supabase
            .from('user_favorites')
            .delete()
            .eq('user_id', userId)
            .eq('artist_id', artistId);

        if (error) throw error;
        return data;
    });
}