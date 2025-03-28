// src/lib/firebase.js
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile
} from 'firebase/auth';
import { getMessaging, getToken } from 'firebase/messaging';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

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

// Google認証プロバイダの作成
const googleProvider = new GoogleAuthProvider();

// 認証機能のエクスポート
export const auth = getAuth(app);

// メッセージング機能（サーバーサイドレンダリング対応）
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

// ユーザー新規登録
export async function signUp(email, password, displayName) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // ディスプレイ名の設定
        await updateProfile(user, { displayName });

        return user;
    } catch (error) {
        console.error('新規登録エラー:', error);
        throw error;
    }
}

// ログイン
export async function signIn(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error('ログインエラー:', error);
        throw error;
    }
}

// Googleでサインイン
export async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        // Google アカウントからの情報が返される
        const user = result.user;
        return user;
    } catch (error) {
        console.error('Google認証エラー:', error);
        throw error;
    }
}

// ログアウト
export async function logOut() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('ログアウトエラー:', error);
        throw error;
    }
}

// パスワードリセットメール送信
export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error) {
        console.error('パスワードリセットエラー:', error);
        throw error;
    }
}

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

    // ベースパスを正確に処理
    const basePath =
        import.meta.env.BASE_URL || '/';

    // パスの末尾にスラッシュがない場合は追加
    const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;

    // パスを正しく構築
    const serviceWorkerPath = `${normalizedBasePath}firebase-messaging-sw.js`;

    console.log('Base Path:', basePath);
    console.log('Normalized Base Path:', normalizedBasePath);
    console.log('Service Worker Full Path:', serviceWorkerPath);

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register(serviceWorkerPath, {
                // scopeを正規化されたパスに変更
                scope: normalizedBasePath
            })
            .then((registration) => {
                console.log('Service Worker registered successfully');
                console.log('Scope:', registration.scope);
                console.log('Active worker:', registration.active);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
                console.error('Error details:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                });
            });
    }
}

// Firebaseアプリのインスタンスをエクスポートする
export default app;