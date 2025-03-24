// src/components/SupabaseTest.jsx を修正
import React, { useState, useEffect } from 'react';
import supabase from '../lib/supabase';  // デフォルトエクスポートなので名前変更

export default function SupabaseTest() {
  const [status, setStatus] = useState('確認中...');
  const [error, setError] = useState(null);

  useEffect(() => {
    async function testSupabase() {
      try {
        // 基本的な接続テスト
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        setStatus('Supabaseとの接続は正常です');
      } catch (error) {
        console.error("Supabase接続エラー:", error);
        setStatus(`エラー：${error.message || 'Unknown error'}`);
      }
    }
    
    testSupabase();
  }, []);

  return (
    <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-medium text-black">Supabase接続テスト</h2>
      <p className="mt-2 text-gray-600">{status}</p>
      
      {error && (
        <div className="mt-2 p-2 bg-red-50 text-red-500 text-sm rounded">
          <p className="font-medium">エラー詳細:</p>
          <pre className="whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Supabase URL: {import.meta.env.PUBLIC_SUPABASE_URL ? '設定あり' : '未設定'}</p>
        <p>Supabase Key: {import.meta.env.PUBLIC_SUPABASE_KEY ? '設定あり' : '未設定'}</p>
      </div>
    </div>
  );
}