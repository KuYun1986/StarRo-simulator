# 收藏專區 Google 登入與雲端儲存設定

前端已接上 OAuth、進度上傳／載入、勾選變動自動同步、衝突保護與錯誤訊息。
Google Provider 和 Supabase 資料表需要該專案的管理權限；GitHub Pages 無法直接建立。

## Google OAuth

1. Supabase Dashboard → Authentication → Sign In / Providers → Google：啟用，填入 Google Cloud OAuth Web Client ID 和 Secret。
2. Google Cloud OAuth Client → Authorized redirect URIs：
   https://xjcllclduebjjqmauqsh.supabase.co/auth/v1/callback
3. Supabase → Authentication → URL Configuration：
   Site URL = https://kuyun1986.github.io/StarRo-simulator/
   Redirect URLs 包含 https://kuyun1986.github.io/StarRo-simulator/collection.html

## 資料表

Supabase SQL Editor 執行專案內 collection_progress_setup.sql。
RLS 規則限定 authenticated 使用者只能讀寫自己的 collection_progress 資料。
切勿把 Google Secret 或 Supabase service_role key 放到 GitHub 前端檔案。

## 驗收流程

1. 在 Safari 或 Chrome 開啟收藏專區，先勾選幾項。
2. 使用 Google 登入、完成授權、回到收藏專區。
3. 若雲端尚無資料，按「儲存到雲端」，看到成功項目數。
4. 用另一個裝置同一帳號登入，應從雲端載入收藏。
5. 再次勾選時應自動同步；可手動按「載入雲端進度」。
6. 本機與雲端有衝突時會顯示選擇，不會自動互相覆蓋。

如顯示 Redirect URL、Provider 或資料表權限錯誤，請按上述相應步驟修正。