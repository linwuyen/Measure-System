# Measure System｜從零讀懂量測

**教學網站：[https://linwuyen.github.io/Measure-System/](https://linwuyen.github.io/Measure-System/)**

繁體中文入門教材，著重實際開發與驗證。從專案與版本確認開始，依序解說 ADC 資料流、三點校正、功率、測試，以及開發順序。附互動波形、校正滑桿、名詞搜尋與本機學習進度。

本專案放的是教學網站，不是 ASR5K 韌體。網站不連接或控制設備；互動波形與校正係數均為示例。

## GitHub Pages 發布

- 發布來源：`main` 分支的 `/docs` 資料夾。
- GitHub 設定位置：**Settings → Pages → Deploy from a branch → main /docs**。
- 修改 `docs/` 中的檔案並推送到 `main`，GitHub Pages 會自動部署更新。
- `docs/.nojekyll` 讓 GitHub 直接發布靜態檔案，不經 Jekyll 轉換。
- 部署進度可在專案的 **Actions** 或 **Settings → Pages** 查看。

## 本機預覽

不需要 npm install 或前端建置。安裝 Python 後，在本專案根目錄執行：

```powershell
python -m http.server 4173 --bind 127.0.0.1 --directory docs
```

瀏覽 `http://127.0.0.1:4173`。網站使用 ES modules，請透過 HTTP 預覽，而非直接以檔案開啟 `docs/index.html`。字體來自 Google Fonts；無法載入時使用系統備用字體。

## 原始碼

| 檔案 | 用途 |
| --- | --- |
| `docs/index.html` | 頁面外框與導覽 |
| `docs/styles.css` | 桌面與手機版樣式 |
| `docs/app.js` | 六章教材、互動與導航 |
| `docs/math.js` | 教學用純數學函式 |
| `tests/math.test.mjs` | 獨立預期值的公式測試 |

## 驗證網站

使用 Node.js 22 或相容版本：

```powershell
node --check docs/app.js
node --test
```

17 項公式測試涵蓋零分母、signed P/PF、不同校正中央點與不等長窗口的 RMS 合併。這些測試驗證網站的教學計算，不是 ASR5K 韌體或硬體。

前一輪瀏覽器檢查涵蓋六章與來源頁、60° 與 180° 功率、零電流、校正端點、進度重載、搜尋、故障引導、複製命令、鍵盤 skip link 與手機選單。

## 資料依據與界線

內容依使用者提供的 ASR5K_384_Claude_Handoff.zip 中的 context handoff、implementation plan 與 evidence index 整理。原始附件不包含於本 repository。網站分別標示來源現況、提案和待驗證事項。

- ASR5K_v2_28384 baseline：`f0d6a6205482384a06d4371b5a5a4e230a8e83e8`
- ASR5K_Old baseline：`5262007b56d420c74ac892692ea4d3969a3e3992`
- ASR5K_AGENT baseline：`c930f3623255465b875c940775b7016b3093f5ca`

教材建立時直接核對了固定 SHA 的 calibration_runtime.c getter 與 measurement_mvp_runtime.c 設定；其他來源行為依交接整理。沒有執行韌體測試、C28 build、燒錄、上電或板上精度驗證。部分來源連結需要對應 GitHub 存取權限。
