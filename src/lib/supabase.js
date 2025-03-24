// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// 環境変数からSupabaseの接続情報を取得
const supabaseUrl =
    import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey =
    import.meta.env.PUBLIC_SUPABASE_KEY;

// Supabaseクライアントの初期化
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    }
});

// Supabaseクライアントのインスタンスをエクスポート
export default supabase;