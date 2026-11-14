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
| `docs/first-test-guide.js` | 工具檢查與 8 筆 DC 演算教學 |
| `docs/measurement-examples.js` | 編譯器安裝、三筆時間對齊與校正驗收單 |
| `tests/math.test.mjs` | 獨立預期值的公式測試 |

## 驗證網站

使用 Node.js 22 或相容版本：

```powershell
node --check docs/app.js
node --check docs/first-test-guide.js
node --check docs/measurement-examples.js
node --test
```

17 項公式測試涵蓋零分母、signed P/PF、不同校正中央點與不等長窗口的 RMS 合併。這些測試驗證網站的教學計算，不是 ASR5K 韌體或硬體。

前一輪瀏覽器檢查涵蓋六章與來源頁、60° 與 180° 功率、零電流、校正端點、進度重載、搜尋、故障引導、複製命令、鍵盤 skip link 與手機選單。

## 資料依據與界線

內容依使用者提供的 ASR5K_384_Claude_Handoff.zip 中的 context handoff、implementation plan 與 evidence index 整理。原始附件不包含於本 repository。網站分別標示來源現況、提案和待驗證事項。

- ASR5K_v2_28384 baseline：`f0d6a6205482384a06d4371b5a5a4e230a8e83e8`
- ASR5K_Old baseline：`5262007b56d420c74ac892692ea4d3969a3e3992`
- ASR5K_AGENT baseline：`c930f3623255465b875c940775b7016b3093f5ca`

教材直接核對了固定 SHA 的 calibration_runtime.c getter 與 measurement_mvp_runtime.c 設定；2026-11-14 補充時另核對 measurement_core_test.py 的編譯方式、DC／反向電流案例及 measurement_core.c 的累加與結算。其他來源行為依交接整理。沒有執行韌體測試、C28 build、燒錄、上電或板上精度驗證。部分來源連結需要對應 GitHub 存取權限。

## 2026-11-14 內容補充

- 第一章：C 編譯器與路徑準備、Windows x64 的 MSYS2 安裝路線、常見錯誤判讀，以及 8 筆 DC 從 raw 到測試預期值的完整手算。
- 第三章：三筆取樣的中心差分、n−1 時刻對齊、G/C 扣除與缺樣重新暖機。
- 第四章：澄清 384 基準核心已支援 signed P/PF，與仍待完成的物理校正分開。
- 第六章：校正資料階段 A 的案例、回退、完整安裝、generation 與驗收條件。

所有合成數值、預期測試輸出與提案均有標示；新增教材不代表取得韌體 PASS 或板上精度證據。

本輪確認新增章節、展開說明、命令複製回饋與桌面／390 px 手機排版，未見瀏覽器 JavaScript 錯誤；另完成內容交叉審查、3 支教材 JS 語法檢查及既有 17 項公式測試。

## 內容二次審查修正

- 修正中心差分的交接章節引用為 §6.2–6.4。
- 階段 A 的測試命令改為遇錯停止；第 5 章也檢查 Python 無法啟動的情形，避免誤讀殘留的結束碼。
- 補上開啟 PowerShell、辨識根目錄、Git／Python 官方安裝入口及 `py -3` 的替代用法。
- 說明 DC 測資已在腳本內、實際成功輸出與手算表不同；C 對照改為選讀，閱讀節錄及預期輸出不提供命令複製按鈕。
- 在算例中解釋單位、符號、中心差分的兩個取樣間隔；區分校正 generation、現有內部快照與提案中的跨寄存器結果協定。

二次審查重新通過 17 項網站公式測試與 JS 語法檢查，並以獨立臨時測試資料驗證兩組 PowerShell 迴圈在「全部成功／第一支失敗／啟動程式不存在」的行為，共 6 種情境。這些命令流程檢查沒有執行 ASR5K 韌體測試。
