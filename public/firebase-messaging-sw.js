// public/firebase-messaging-sw.js
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// 設定情報はメインアプリから取得
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'INIT_FIREBASE') {
        // メインアプリから送られてきた設定情報を使用
        const firebaseConfig = event.data.config;

        // Firebase SDKのインポート
        importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
        importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

        // Firebaseの初期化
        firebase.initializeApp(firebaseConfig);
        const messaging = firebase.messaging();

        // バックグラウンドメッセージ処理
        messaging.onBackgroundMessage((payload) => {
            console.log('[firebase-messaging-sw.js] 受信したバックグラウンドメッセージ:', payload);

            const notificationTitle = payload.notification.title;
            const notificationOptions = {
                body: payload.notification.body,
                icon: '/favicon.svg'
            };

            self.registration.showNotification(notificationTitle, notificationOptions);
        });
    }
});