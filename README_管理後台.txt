繁星仙境模擬器｜管理後台版

檔案：
- admin.html：管理後台登入 / 儀表板
- supabase-config.js：填 Supabase Project URL + anon key
- starro-config.js：前台設定讀取器（本機快取 + Supabase）
- supabase_setup.sql：Supabase 資料表與 RLS 安全規則
- index.html / enchant.html / identify.html / collection.html / equipment.html：已接管理設定

第一次設定：
1. 建立 Supabase 專案。
2. Authentication → Users 建立你的管理員 Email / 密碼。
3. SQL Editor 打開 supabase_setup.sql，把 YOUR_ADMIN_EMAIL 改成你的管理員 Email 後執行。
4. Settings → API，將 Project URL 與 anon public key 填入 supabase-config.js。
5. 把整包檔案上傳 / 覆蓋 GitHub Pages。
6. 開啟 admin.html 登入。

安全：
- 不要把 service_role key 放進網站。
- anon key 放前端是正常用法，真正寫入權限由 RLS 驗證登入者 Email。
- 建議 Supabase 關閉公開註冊，只保留你的管理員帳號。

管理功能：
- 華金鎧甲/鞋：成本、50/10 階段、最終詞權重
- 華金耳環/飾品：成本、50/10 階段、最終詞權重
- 競標針：成本、第2/第3詞、兩個特殊詞、三組完整詞池
- 龍甲：第四洞 / 第三洞各階段機率
- 善惡武器：LV1~5 四階段機率
- 時光靴：第四洞系列權重、第三洞詞、第四洞類型
- 收藏：搜尋、單筆展開編輯、新增、刪除、公告
- 裝備價格：搜尋材料、價格、價格單位、代敲材料預設價格
