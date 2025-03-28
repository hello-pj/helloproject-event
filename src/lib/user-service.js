// src/lib/user-service.js
import supabase from './supabase';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Firebaseのユーザー情報をSupabaseに同期する
export async function syncUserWithSupabase(user) {
    if (!user) return null;

    try {
        // Firebaseユーザー情報からSupabaseのusersテーブルに保存/更新するデータを準備
        // last_login カラムを削除
        const userData = {
            user_id: user.uid,
            email: user.email,
            display_name: user.displayName || '',
            // last_login: new Date().toISOString(), // このフィールドを削除
        };

        // Supabaseにユーザー情報をupsert (挿入または更新)
        const { data, error } = await supabase
            .from('users')
            .upsert(userData, {
                onConflict: 'user_id', // user_idが競合する場合は更新
                returning: 'minimal' // 返り値を最小限に
            });

        if (error) {
            console.error('Supabaseユーザー同期エラー:', error);
            return null;
        }

        // ユーザー設定も確認/作成
        await ensureUserSettings(user.uid);

        return userData;
    } catch (error) {
        console.error('ユーザー同期中にエラーが発生しました:', error);
        return null;
    }
}

// ユーザー設定が存在することを確認
async function ensureUserSettings(userId) {
    try {
        // 既存のユーザー設定を確認
        const { data, error } = await supabase
            .from('user_settings')
            .select('user_id')
            .eq('user_id', userId)
            .single();

        // 設定が存在しない場合は作成
        if (error || !data) {
            const { error: insertError } = await supabase
                .from('user_settings')
                .insert({
                    user_id: userId,
                    notification_enabled: true,
                    fcm_token: '', // 後で更新
                });

            if (insertError) {
                console.error('ユーザー設定作成エラー:', insertError);
            }
        }
    } catch (error) {
        console.error('ユーザー設定確認中にエラー:', error);
    }
}

// ログイン状態監視とユーザー同期を設定
export function setupUserSync() {
    return onAuthStateChanged(auth, async(user) => {
        if (user) {
            // ユーザーがログインしている場合、Supabaseと同期
            await syncUserWithSupabase(user);

            // 以下の行をコメントアウトして、エラーを防ぐ
            // await setSupabaseAuthWithFirebase();
        }
    });
}