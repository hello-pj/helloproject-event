// Firebase Cloud Messaging用サービスワーカー

// サービスワーカーのインストール時
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// サービスワーカーのアクティベート時
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// クライアントからの設定情報を待機
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'INIT_FIREBASE') {
        // Firebase SDKをインポート
        importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
        importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

        // クライアントから送られた設定情報を使用
        const firebaseConfig = event.data.config;

        // Firebaseの初期化
        firebase.initializeApp(firebaseConfig);
        const messaging = firebase.messaging();

        // バックグラウンドメッセージ処理
        messaging.onBackgroundMessage((payload) => {
            console.log('バックグラウンドメッセージ受信:', payload);

            const notificationTitle = payload.notification.title || 'デフォルトタイトル';
            const notificationOptions = {
                body: payload.notification.body || 'デフォルトメッセージ',
                icon: '/favicon.svg'
            };

            self.registration.showNotification(notificationTitle, notificationOptions);
        });
    }
});