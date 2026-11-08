# 狐隱｜測試站轉正式 GitHub 帳號交接指引

## 目前階段

這個專案的展示版可直接以 GitHub Pages 公開；沒有設定 Supabase 也能看到首頁、兩張御守名帖、個人介紹、特效與行動版排版。

- **不是正式員工名單**：`src/data/demo.ts` 是兩筆示範資訊。
- **後台尚未啟用**：`/#/admin` 需要先建 Supabase、執行資料庫 migration、設定管理者。
- **不用上傳原始圖片**：`public/images/` 裡的 WebP 已經可直接部署。
- **目前的 Git remote**：推送前請用 `git remote -v` 檢查連到哪個帳號。

## 移交方式（擇一）

### A. 由店長在自己的 GitHub 帳號新建 Repository（簡單、推薦）

1. 店長在自己的帳號建立空白的 `kogakure` repository（不要勾 README）。
2. 在開發機執行：

```bash
cd /d/kogakure
git remote -v
git remote set-url origin https://github.com/店長帳號/kogakure.git
git push -u origin main
```

3. 店長進入 Repository → Settings → Pages → Source，選擇 **GitHub Actions**。
4. 成功後：`https://店長帳號.github.io/kogakure/#/staff`。
5. 若後來接 Supabase，必須在**新 Repository** 的 Settings → Secrets and variables → Actions → Variables 重新設定 `VITE_SUPABASE_URL`、`VITE_SUPABASE_PUBLISHABLE_KEY`。

注意：修改 Git remote 只是變更推送目標，不會刪掉舊測試帳號的 repository。確認正式站可用後，再由擁有人決定是否封存／刪除舊站。

### B. GitHub 原生 Repository Transfer

若想保留 issues、stars、提交與現有 repository 歷史，可由舊帳號在 Settings → General → Danger Zone → Transfer ownership，依 GitHub 顯示的接收程序操作。轉移後應重新檢查 Pages URL、Actions 設定、權限、環境變數及專案內外連結。

## 開發機上的內容

- `狐隱LOGO/`、`員工圖/`、`場景照/` 是**本機原始素材**，被 `.gitignore` 忽略，不在 GitHub。
- `npm run assets:build` 需要這三個本機資料夾才能重新產生圖片。
- **店長只從 GitHub Clone 也能**直接 `npm ci && npm run build`，不需要原始圖片，因為 `public/images/` 已提交。
- 未來要換照片可以由後台透過 Supabase Storage 上傳；啟用後台前則需在原開發機替換原始素材並重新執行圖片建置。

## 乾淨提交前

- 不要提交 `.env.local`、密碼、service_role keys、原始素材。
- 已設定 `*.tsbuildinfo` 忽略。如果早期已追蹤，執行一次：

```bash
git rm --cached tsconfig.tsbuildinfo
```

- 執行 `npm run build`，確認建置成功。
- 提交測試版修改後 `git push`，GitHub Actions 會更新已啟用的 Pages。
- 不要把 `dist`、`node_modules` 推到 GitHub。

## 使用者介面原則

- 深色頁面文字高對比，手機版優先觸控，桌面版留白整齊。
- 御守名帖固定格式；每位員工可選獨立狐火／落櫻／星光／金光／無特效。
- 員工頁是純個人介紹：照片、名稱、職稱、簡介、專長、社群連結；不包含預約按鈕。
- 未設定 Supabase 時以示範資料呈現，頁面底部以簡短文字標註。
