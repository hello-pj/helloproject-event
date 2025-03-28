// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';
import { auth } from './firebase';

// 環境変数からSupabaseの接続情報を取得
const supabaseUrl =
    import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey =
    import.meta.env.PUBLIC_SUPABASE_KEY;

// Supabaseクライアントを初期化
const supabase = createClient(supabaseUrl, supabaseKey);

// Firebase認証に基づいてSupabaseリクエストを実行するラッパー関数
export async function withAuth(callback) {
    const user = auth.currentUser;

    if (!user) {
        throw new Error('認証が必要です');
    }

    try {
        return await callback(supabase, user.uid);
    } catch (error) {
        console.error('Supabaseリクエストエラー:', error);
        throw error;
    }
}

// 注: setAuth は非推奨・削除されたため、この関数の実装を変更
export async function setSupabaseAuthWithFirebase() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            return null;
        }

        // JWT認証を使用する場合は以下のように実装する必要があります
        // しかし現時点では簡略化のため、この機能を無効にします

        return {
            user_id: currentUser.uid,
            email: currentUser.email
        };
    } catch (error) {
        console.error('Supabase認証設定エラー:', error);
        return null;
    }
}

// Supabaseクライアントのインスタンスをエクスポート
export default supabase;