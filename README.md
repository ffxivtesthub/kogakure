# 狐隱 KOGAKURE — 官方 RP 店網站

> 世有百鬼，夜有萬境。循狐而入，借湯忘憂。

## 專案架構

- React 19 + TypeScript + Vite 7：輕量且可靜態部署的前台、管理後台
- React Router HashRouter：GitHub Pages 子路徑友善
- Supabase Auth：管理者登入
- Supabase PostgreSQL + RLS：公開員工資料／管理者編修保護
- Supabase Storage：管理者上傳的照片
- Sharp：正式素材轉換 WebP，Logo 自動去除外圍背景；原始 PNG 不修改

## 開發進度

| 區塊 | 狀態 |
|---|---|
| 01 首頁 | 首頁視覺初版，可連到人員介紹 |
| 02 館內介紹 | 已保留路由，內容尚未開發 |
| 03 服務內容 | 已保留路由，內容尚未開發 |
| 04 人員介紹 | 御守卡、特效、搜尋、服務分類、詳情、社群連結 |
| 05 值班排班 | 已保留路由，內容尚未開發 |
| 06 點菜 | 已保留路由，內容尚未開發 |
| 07 預約 | 已保留路由，內容尚未開發 |
| 管理後台 | Supabase Auth、員工 CRUD、社群設定、圖片上傳 |

## 本機開始使用（PowerShell）

在 **D:\kogakure** 執行：

1. `npm install`
2. `npm run assets:build`（從三個原始素材資料夾產生壓縮圖，並自動為兩款 Logo 去背，不修改來源）
3. `npm run dev`
4. 開啟終端顯示的 Vite 網址，通常是 `http://localhost:5173/#/staff`

圖片已優化版本會輸出到 `public/images/`，由 GitHub 保存這些生成檔案。**不要將原始的「員工圖」、「場景照」、「狐隱LOGO」三個資料夾上傳至公開 GitHub。**

## Supabase 設定（管理後台正式啟用）

1. 新建 Supabase Project。
2. 將 `supabase/migrations/20261108_01_staff.sql` 貼到 SQL Editor 執行。
3. 至 Authentication → Users 建立管理者使用者（建議先關閉公開註冊）。
4. 複製該 User ID，在 SQL Editor 執行：

```sql
insert into public.admin_users(user_id) values ('YOUR_AUTH_USER_UUID');
```

5. 複製 `.env.example` 為 `.env.local`，填入 Supabase Project URL 和 Publishable Key。
6. 重啟 `npm run dev`；打開 `/#/admin` 登入。畫面由管理員管理員工的公開資訊。

**重要：** 絕不能把 `service_role` 或其他秘密金鑰放到 `VITE_*` 環境變數、JavaScript、GitHub 公開程式碼裡。所有修改權限由資料庫 RLS 實際攔截，前端隱藏按鈕不是安全措施。

未設定 Supabase 時，`/#/staff` 使用兩位示範員工資料；設定 Supabase 後改為讀取正式資料庫。初始正式資料庫沒有員工，請在管理後台新增並公開。

## 部署 GitHub Pages

1. 新建 GitHub repository，將本專案推上 `main`（包含 `public/images` 和 `package-lock.json`）。
2. GitHub repository → Settings → Pages → Source 設為 **GitHub Actions**。
3. Settings → Secrets and variables → Actions → **Variables** 新增：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Push 到 main 時，`.github/workflows/deploy.yml` 自動編譯發布。
5. 在 Supabase Auth URL Configuration 裡新增正式網域為允許的 Redirect URL（若日後啟用密碼重設或 Magic Link）。
6. 對外網站採用 URL hash，例如 `https://owner.github.io/repo/#/staff`。

此 workflow 只編譯已提交的網站素材，**不需要也不會把原始 PNG 推送到 GitHub Actions**。

## 速度、圖片品質與設計標準

- 首頁／人物卡使用 WebP，提供縮圖，較大的照片只在展開詳情時下載。
- Logo 透過 `scripts/logo-alpha.mjs` 去除外圍深色背景，保留圓章內部深色設計，裁切透明留白後以無損 WebP 輸出；員工照以高品質 WebP 輸出 2 種尺寸。來源 PNG 永不覆寫。
- 後台圖片上傳由瀏覽器產生高品質 WebP 與 760px 列表縮圖，存於 Supabase Storage。
- **高品質有損 WebP 並非逐像素無損**；以實際肉眼觀感優先，如需數學上的無損需另改用 lossless 來源。
- 桌面基本字體 >= 18px CSS，手機基本字體 17px；高解析度寬視窗再放大。避免深色背景使用灰到看不清的文案。
- 非必要動態以 CSS 為主，支援 prefers-reduced-motion；訪客入場動畫僅每個瀏覽分頁工作階段首次播放一次。
- 員工個人特效由後台 effect 欄位選擇，不需要為每個人寫新 CSS。
- 社群連結會驗證 http(s) URL，開啟新頁使用 noopener noreferrer。
- 服務、排班、餐點與預約的資料模型會在對應頁面開發時建立並加入權限政策，不會先上線空殼可送出的表單。

## 圖片對應

| 正式原始檔 | 網頁使用 |
|---|---|
| `員工圖/FBK2.png` | `public/images/staff-01.webp` |
| `員工圖/99.png` | `public/images/staff-02.webp` |
| `員工圖/hehe.png` | 尚未使用，保留備用 |
| `狐隱LOGO/狐隱金彩櫻花物語.png` | `public/images/logo-wide.webp` |
| `狐隱LOGO/狐隱之湯：金月白狐徽章.png` | `public/images/logo-mark.webp` |
| `場景照/*` | `public/images/scene-01.webp` ~ `scene-14.webp` |

員工姓名／簡介均為示範文字，後台正式建立後以資料庫為準。

## 預覽版本與正式移交

- 人員介紹頁已精簡文案；少於五位員工時不顯示搜尋篩選列，社群連結只有填寫後才顯示，名帖不包含預約按鈕。
- 公開頁尾不顯示管理入口；管理者仍可直接使用 `/#/admin` 登入，資料保護以 Supabase RLS 為準。
- `.gitignore` 已忽略 `*.tsbuildinfo`。如果歷史提交曾追蹤 `tsconfig.tsbuildinfo`，在 Git Bash 執行一次 `git rm --cached tsconfig.tsbuildinfo` 取消追蹤（不刪本機檔案）。
- 店長接手及測試帳號轉正式帳號的步驟見 `docs/HANDOFF.md`。

## 入場動畫（桌面與手機共用）

- 開場改為極簡和風旅宿視覺：深夜背景、金狐徽章、纖細金線及一句品牌標語。Logo 與標語先完整淡出，背景再淡出，避免主頁出現時開場裝飾仍在上層。
- 首次進站約 **2 秒**；沒有略過按鈕，也沒有影片或持續飄動的粒子，所有開場內容在揭露主頁前都已消失。
- 使用 `sessionStorage` 記錄已看過動畫，同分頁刷新或頁面切換不會重播；新分頁第一次造訪才播放。管理後台 `/#/admin` 永遠跳過。
- 若作業系統設定 **減少動態效果**，直接略過入場動畫。
- 預覽/測試用網址：`http://localhost:5173/?intro=1#/staff`；GitHub Pages 上為 `https://帳號.github.io/kogakure/?intro=1#/staff`，可強制重播以便驗收。
- 入場 Logo 為 `public/images/logo-intro.webp`（320px 高品質透明 WebP，約 32 KB）；原始 Logo 不變，執行 `npm run assets:build` 即可重新產生。
- 動畫元件與樣式位於 `src/components/EntryIntro.tsx` 和 `src/components/entry-intro.css`；不依賴影片、Canvas 或額外動畫框架。
