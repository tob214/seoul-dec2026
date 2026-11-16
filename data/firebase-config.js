/*
 * 雲端同步設定（Firebase）。
 * - 改回 FIREBASE_CONFIG = null → 只用本機草稿（和以前一樣）。
 * - 填入 Firebase Console → Project settings → Your apps → Web app 的 firebaseConfig 即啟用同步。
 *   這段設定本來就是公開的，不是密碼；誰可以讀寫由 Firestore Rules 限定（見 README）。
 */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyAi_IJOaxo3REa2pEeT4118kapdzk5y4iI",
  authDomain: "seoul-dec2026.firebaseapp.com",
  projectId: "seoul-dec2026",
  storageBucket: "seoul-dec2026.firebasestorage.app",
  messagingSenderId: "315614562257",
  appId: "1:315614562257:web:c9507e803bbb5f226182f0"
};

window.FIREBASE_TRIP_ID = "seoul-dec2026";   // Firestore 文件：trips/seoul-dec2026
window.FIREBASE_SDK_VERSION = "12.18.0";     // 可改為 Firebase Console 範例碼中的版本
