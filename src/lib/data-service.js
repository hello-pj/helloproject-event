// src/lib/data-service.js - データ操作のための共通関数
import { withAuth } from './supabase';
import supabase from './supabase';
import { auth } from './firebase';

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
    // 未ログインの場合はエラー
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error('ログインが必要です');
    }

    try {
        // 既存のお気に入りをチェック
        const { data: existing, error: checkError } = await supabase
            .from('user_favorites')
            .select('id')
            .eq('user_id', currentUser.uid)
            .eq('artist_id', artistId)
            .maybeSingle();

        if (checkError) throw checkError;

        // 既に存在する場合は何もしない
        if (existing) {
            return existing;
        }

        // UUIDの生成（ブラウザ環境に応じて）
        const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ?
            crypto.randomUUID() :
            Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        // 新しいお気に入りを追加
        const newFavorite = {
            id: uuid,
            user_id: currentUser.uid,
            artist_id: artistId,
            notification_enabled: true,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('user_favorites')
            .insert(newFavorite);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('お気に入り追加エラー:', error);
        throw error;
    }
}

// お気に入りの削除 - 認証済みユーザー専用
export async function removeFromFavorites(artistId) {
    // 未ログインの場合はエラー
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error('ログインが必要です');
    }

    try {
        const { data, error } = await supabase
            .from('user_favorites')
            .delete()
            .eq('user_id', currentUser.uid)
            .eq('artist_id', artistId);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('お気に入り削除エラー:', error);
        throw error;
    }
}

// アーティストのフォロー状態をチェック
export async function checkIfFollowing(artistId) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        return false;
    }

    try {
        const { data, error } = await supabase
            .from('user_favorites')
            .select('id')
            .eq('user_id', currentUser.uid)
            .eq('artist_id', artistId)
            .maybeSingle();

        if (error) throw error;
        return !!data; // データがあればtrue、なければfalse
    } catch (error) {
        console.error('フォロー状態チェックエラー:', error);
        return false;
    }
}

// アーティスト一覧を取得
export async function getArtists(options = {}) {
    const {
        limit = 50,
            offset = 0,
            search = '',
            category = null,
            sortBy = 'name',
            sortOrder = 'asc'
    } = options;

    try {
        let query = supabase
            .from('artists')
            .select('*');

        // 検索条件がある場合
        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        // カテゴリーでフィルタリング
        if (category) {
            query = query.eq('category', category);
        }

        // ソート
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        // ページネーション
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        return { data, count };
    } catch (error) {
        console.error('アーティスト一覧取得エラー:', error);
        throw error;
    }
}

// アーティスト詳細を取得
export async function getArtistById(artistId) {
    try {
        const { data, error } = await supabase
            .from('artists')
            .select('*')
            .eq('id', artistId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('アーティスト詳細取得エラー:', error);
        throw error;
    }
}

// アーティストのイベント一覧を取得
export async function getArtistEvents(artistId, options = {}) {
    const { past = false } = options;
    const currentDate = new Date().toISOString();

    try {
        const query = supabase
            .from('events')
            .select(`
        id,
        title,
        description,
        start_date,
        end_date,
        image_url,
        ticket_url,
        venues(id, name, address, lat, lng)
      `)
            .eq('artist_events.artist_id', artistId);

        if (past) {
            // 過去のイベント
            query.lt('start_date', currentDate)
                .order('start_date', { ascending: false });
        } else {
            // 今後のイベント
            query.gte('start_date', currentDate)
                .order('start_date', { ascending: true });
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('アーティストイベント取得エラー:', error);
        throw error;
    }
}