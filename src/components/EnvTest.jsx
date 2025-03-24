import React from 'react';

export default function EnvTest() {
  // 注意: 実際のプロジェクトでは機密性の高い環境変数を表示しないでください
  const firebaseConfigExists = import.meta.env.PUBLIC_FIREBASE_API_KEY ? 'あり' : 'なし';
  const supabaseConfigExists = import.meta.env.PUBLIC_SUPABASE_URL ? 'あり' : 'なし';

  return (
    <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-medium text-black">環境変数テスト</h2>
      <ul className="mt-4 space-y-2">
        <li>Firebase設定: <span className="font-semibold">{firebaseConfigExists}</span></li>
        <li>Supabase設定: <span className="font-semibold">{supabaseConfigExists}</span></li>
      </ul>
    </div>
  );
}