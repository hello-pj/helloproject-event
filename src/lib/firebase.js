// src/lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
    authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
    measurementId: import.meta.env.PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Firebaseアプリの初期化
const app = initializeApp(firebaseConfig);

// 認証機能のエクスポート
export const auth = getAuth(app);

// メッセージング機能（サーバーサイドレンダリング対応）
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

// FCMトークンを取得する関数
export async function requestNotificationPermission() {
    if (!messaging) return null;

    try {
        // 通知の許可を要求
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('通知の許可が得られませんでした');
            return null;
        }

        // FCMトークンを取得
        const currentToken = await getToken(messaging, {
            vapidKey: import.meta.env.PUBLIC_FIREBASE_VAPID_KEY
        });

        if (currentToken) {
            console.log('FCMトークン:', currentToken);
            return currentToken;
        } else {
            console.log('FCMトークンを取得できませんでした');
            return null;
        }
    } catch (error) {
        console.error('FCMトークンの取得に失敗しました:', error);
        return null;
    }
}

// サービスワーカーの登録と初期化
export function initializeFirebaseMessaging() {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/firebase-messaging-sw.js')
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);

                // 登録されたサービスワーカーにFirebase設定を送信
                const sendConfig = (worker) => {
                    if (worker) {
                        worker.postMessage({
                            type: 'INIT_FIREBASE',
                            config: firebaseConfig
                        });
                    }
                };

                // アクティブなサービスワーカーがある場合
                if (registration.active) {
                    sendConfig(registration.active);
                }

                // 待機中のサービスワーカーがある場合
                if (registration.waiting) {
                    sendConfig(registration.waiting);
                }

                // インストール中のサービスワーカーがある場合
                if (registration.installing) {
                    registration.installing.addEventListener('statechange', (event) => {
                        if (event.target.state === 'activated') {
                            sendConfig(event.target);
                        }
                    });
                }

                // サービスワーカーの更新をリッスン
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    if (navigator.serviceWorker.controller) {
                        sendConfig(navigator.serviceWorker.controller);
                    }
                });
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    }
}

// Firebaseアプリのインスタンスをエクスポート
export default app;