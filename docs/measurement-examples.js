// Additional lessons: synthetic examples and proposed acceptance criteria.
export function windowsCompilerSetup({code,link}) {
  return `<details><summary>還沒有 C 編譯器？Windows x64 的一條安裝路線</summary>
<p>若你使用 Intel／AMD 的 64 位元 Windows，可依 ${link('https://www.msys2.org/','MSYS2 官方安裝指南')} 安裝 MSYS2，再開啟 <b>MSYS2 UCRT64</b> 終端機，安裝 GCC：</p>
${code('pacman -S mingw-w64-ucrt-x86_64-gcc\ngcc --version','MSYS2 UCRT64 · 不是 PowerShell')}
<p>完成後回到執行 Python 測試的 <b>PowerShell</b>。以下假設安裝在預設的 <code>C:\\msys64</code>；若位置不同，先換成你的實際路徑。這些設定只影響目前的 PowerShell 視窗：</p>
${code('$env:Path = "C:\\msys64\\ucrt64\\bin;" + $env:Path\n$env:CC = "C:\\msys64\\ucrt64\\bin\\gcc.exe"\n& $env:CC --version','PowerShell · 目前視窗的工具設定')}
<p>保留這個視窗，回到韌體根目錄繼續下方檢查。ARM64 電腦請依官方支援環境另選工具鏈；已具備相容 GCC／Clang 的人可略過安裝。</p>
<p class="source-ref">工具安裝資訊核對於 2026-11-14：${link('https://www.msys2.org/docs/environments/','MSYS2 環境說明')}。安裝成功只表示工具可用，仍需實際編譯與執行專案測試。</p></details>`;
}

export function centeredTimingExample() {
  return `<section class="panel" id="timing-example"><div class="chapter-tags"><span class="tag demo">可手算的合成資料</span><span class="tag proposal">adapter 設計提案</span></div>
<h2>用三筆資料，算出「中間那一筆」</h2>
<p><b>Fs</b> 是取樣率：每秒 100,000 筆，所以相鄰兩筆相隔 <b>10 µs</b>。µ 表示百萬分之一，10 µs = 0.000010 秒。<b>G</b> 是電阻支路的電導，等於 1/R；本例 0.001 S（西門子）相當於 1000 Ω。<b>C</b> 是電容，1 µF = 0.000001 F。</p>
<p>n 是最新一筆的序號，n−1 是前一筆，n−2 是再前一筆。以下電壓已換成 V；數字都是教學假設，不能當成設備係數。並假定 shunt 量到同節點、同極性的「負載電流 + 內部 G/C 支路電流」。</p>
<ol class="sample-timeline" aria-label="三筆連續取樣的時間順序"><li><small>左邊 · n−2</small><strong>9.99 V</strong><span>t = 0 µs</span></li><li class="sample-center"><small>中間 · n−1</small><strong>10.00 V</strong><span>t = 10 µs</span><b>輸出屬於這個時刻</b></li><li><small>右邊 · n</small><strong>10.01 V</strong><span>t = 20 µs</span><b>收到後，才足夠計算</b></li></ol>
<div class="table-wrap"><table><caption>中間那筆 shunt 電流假設為 0.111 A</caption><thead><tr><th>步驟</th><th>代入數字</th><th>結果</th></tr></thead><tbody>
<tr><td>1 · 求中間斜率</td><td>(10.01 − 9.99) ÷ 0.000020<br>電壓差 ÷ 左右兩端相隔的秒數</td><td>1,000 V/s</td></tr>
<tr><td>2 · 電阻支路電流</td><td>G × v[n−1] = 0.001 × 10</td><td>0.010 A</td></tr>
<tr><td>3 · 電容支路電流</td><td>C × d[n−1] = 0.000001 × 1000</td><td>0.001 A</td></tr>
<tr><td>4 · 負載電流</td><td>0.111 − 0.010 − 0.001</td><td>0.100 A</td></tr>
<tr><td>5 · 同時刻電壓 × 電流</td><td>v[n−1] × i_load[n−1] = 10 × 0.100</td><td>瞬時功率 1 W</td></tr>
</tbody></table></div>
<p>左右兩端跨了 <b>兩個</b>取樣間隔：2/Fs = 20 µs。因此「除以 20 µs」也就是前面公式的「乘 Fs 再除以 2」。V/s 表示每秒變化多少伏特；d[n−1] 就是對中間時刻變化速度的估計。</p>
<div class="result-note"><b>最容易寫錯的地方：</b>收到 n 時才算得出來，但這一組 V、I、瞬時功率都屬於 <b>n−1</b>。不能把中間的電流和最新的 v[n] 相乘。1 W 是這一筆的瞬時功率；整窗的 P 還要對所有有效配對求平均。</div>
<details><summary>第一筆、第二筆與缺樣時，應該輸出什麼？</summary><p>提案需要三筆連續且身份一致的有效資料。前兩筆的「暖機（warmup）」是軟體等待資料湊齊，不是讓硬體加熱；這時不能捏造一筆「差分為 0」的有效結果。</p>
<div class="table-wrap"><table><thead><tr><th>依序收到</th><th>應有行為</th></tr></thead><tbody>
<tr><td>序號 10、11</td><td>只有兩筆，繼續暖機。</td></tr>
<tr><td>接著收到 13，缺了 12</td><td>宣告缺樣並清掉舊歷史；13 作為新連續序列的第一筆。</td></tr>
<tr><td>再收到 14</td><td>新序列第二筆，仍不輸出有效配對。</td></tr>
<tr><td>再收到 15</td><td>使用 13／14／15，輸出屬於 14 的配對。</td></tr>
</tbody></table></div><p>不能跨過缺口拿 11 和 13 做差分。切檔、飽和或校正 generation 改變時，也要依契約讓相關窗口失效、重建歷史，避免新舊資料混算。</p></details>
<p class="source-ref">依據：交接文件 §6.2–6.4 與 implementation plan「工作 2」。上述數字是依提案公式建立的教學例子；尚未證明板上補償精度。</p></section>`;
}

export function phaseACriteria({code}) {
  return `<section class="panel" id="phase-a-acceptance"><div class="chapter-tags"><span class="tag proposal">階段 A 的建議驗收單</span><span class="tag verify">尚非已完成報告</span></div>
<h2>階段 A：具體驗什麼，才算能交付？</h2>
<p>這一關的成果，是一組可以完整驗證、一次安裝的 <b>RAM 校正快照</b>。請把下面每個情境變成案例，保存輸入、預期值與失敗原因；勾選學習進度不能代替測試結果。</p>
<p>這裡的「安裝」是把一整組係數交給程式放進記憶體使用；RAM 快照就是這組暫存在記憶體的完整資料。<b>generation</b> 是它的版本代號；<b>getter</b> 是查詢這組資料的函式；<b>fit（擬合）</b> 是從原始資料與外部參考估算係數。</p>
<div class="table-wrap"><table><thead><tr><th>案例</th><th>如何準備輸入</th><th>通過條件</th></tr></thead><tbody>
<tr><td>三點能重建參考值</td><td>沿用第 3 章的 −10000→−100、0→0、10000→102；正負斜率不同。</td><td>三點分別回到 −100／0／102 V，兩段在中央連續。另加中央 raw 與參考值皆非零的案例，避免程式偷偷假設 r₀=y₀=0。</td></tr>
<tr><td>不合法資料不能安裝</td><td>重複 raw、NaN／非有限值、錯誤的 model／topology／range／ADC span。</td><td>拒絕並提供明確失敗原因；不得只驗證「有填係數」。</td></tr>
<tr><td>求不出的參數不能硬湊</td><td>例如只給固定 DC 電壓，dv/dt=0，無法從這批資料辨識 C。</td><td>離線 fit 回報不可辨識；不能把任意 C 當成求解成功。</td></tr>
<tr><td>失敗不破壞上一代</td><td>先安裝有效組 A，再嘗試安裝錯誤組 B。</td><td>A 的完整內容與 generation 保留；若 A 不適用目前檔位／身份，量測仍須 invalid，不能因有舊值就算有效。</td></tr>
<tr><td>完整安裝，不混新舊</td><td>準備兩組明顯不同的係數，在更新交界查詢。</td><td>讀者只能得到完整 A 或完整 B；不得看到新電壓係數搭配舊電流係數。成功安裝 B 後，ADC generation 應可區別於 A；安裝成功不等於已通過板上精度資格。</td></tr>
<tr><td>查詢失敗不留下殘值</td><td>先讓查詢用輸出結構有舊值，再觸發 getter 失敗。</td><td>getter 回傳 0，且完整清零呼叫者的輸出結構，避免誤讀殘值。這不等於清掉內部已安裝的上一代快照。</td></tr>
<tr><td>ADC 與 DDS 各管各的版本</td><td>分別更換量測 ADC 係數、DDS 輸出端校正；再測量測係數缺失。</td><td>ADC generation 獨立；缺量測係數保持 unqualified，且不偷偷改變既有 OutputAllowed 授權規則。</td></tr>
<tr><td>離線擬合資料可追溯</td><td>保留原始 raw、sample rate、sequence、機板／檔位身份與獨立外部參考。</td><td>求係數前沒有先套用待求係數或待求補償，避免循環校正；輸出可追回原始資料。</td></tr>
</tbody></table></div>
<p>浮點容許誤差、最低有效訊號與可辨識條件，應在測試前依數值設計明訂。通過這些軟體案例，仍不能取代產品精度驗收。</p>
<details><summary>開發者：如何把這張清單接到測試？</summary><ol><li>先確認目前 repo（專案）的檔案與 owner（負責的模組）。交接提到的 <code>measurement_calibration.h/.c</code> 與 fit 工具是提案，名稱不是已完成的證據。</li><li>先建立需要的新案例，確認基準版本因缺少預期能力而失敗；不能用只回傳標準答案的 stub（替身程式）製造通過。</li><li>實作後，新增 fit 案例與既有 runtime／lifecycle／startup 回歸（確認舊功能仍正常的測試）都要通過，並保存版本及輸出。</li></ol>
<p>先確認這四支測試都已存在，再於韌體根目錄使用下方命令。它會印出目前執行的檔名，遇到第一個啟動失敗或非零結束碼就停止；修正後請重新跑完整組。</p>
${code(`$calibrationTests = @(
  'tests/measurement_calibration_fit_test.py'
  'tests/calibration_runtime_host_test.py'
  'tests/calibration_lifecycle_host_test.py'
  'tests/calibration_startup_host_test.py'
)
foreach ($calibrationTest in $calibrationTests) {
  Write-Host "Running $calibrationTest"
  python $calibrationTest
  if (-not $? -or $LASTEXITCODE -ne 0) {
    throw "Test failed: $calibrationTest"
  }
}`, 'PowerShell · 階段 A 實作後，在韌體根目錄執行')}
<p>第一支 fit 測試是交接規劃的驗收入口；若當前版本尚無此檔，應先完成對應測試工作。其餘回歸名稱也需核對目前版本。任何一項失敗都不能算整關通過；本教材沒有執行以上韌體測試。</p></details>
<div class="callout"><b>RAM 安裝完成 ≠ 斷電仍會保存。</b> NVM 後端、掉電恢復與持久化驗證是另外的工作；這一關不能宣稱已完成耐久保存。</div>
<p class="source-ref">依據：ASR5K_384_measurement_implementation_plan.md「工作 1 量測校正資料與獨立 generation」；案例表將交接要求轉成可操作的檢查方式。</p></section>`;
}
