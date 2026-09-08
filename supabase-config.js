// 繁星仙境模擬器｜Supabase 連線設定
// 1. 到 Supabase 專案：Settings → API
// 2. 貼上 Project URL 與 anon public key
// anon key 可放在前端；真正的寫入權限由 RLS + 管理員登入保護。
window.STARRO_SUPABASE = {
  url: "",
  anonKey: "",
  configRow: "main"
};
