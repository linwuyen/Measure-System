export function firstTestPreparation({code,link,base,compilerSetup=''}) {
  return `
<section class="work-step"><h3>讓第一個測試找得到檔案，也找得到 C 編譯器</h3>
<p>這支 Python 腳本會產生一份 C 測試程式，連同專案真正使用的 <code>Measurement_module/measurement_core.c</code> 一起編譯，再執行產生的程式。因此只有 Python 還不夠；電腦也要有支援下列參數的 C 編譯器。</p>
<div class="formula">Python 腳本 → C 編譯器 → 測試程式 + 實際量測核心 → 檢查結果</div>
${compilerSetup}
<p><b>取得韌體資料夾後</b>，先在韌體根目錄做以下檢查。若尚未下載，先回到「取得韌體」完成準備；這些命令只查路徑與工具，不會執行韌體測試。</p>
${code('Get-Location\nTest-Path .\\tests\\measurement_core_test.py\nTest-Path .\\ASR5K_F28384D_CPU1\\Measurement_module\\measurement_core.c\nGet-Command python,gcc,clang,cc -ErrorAction SilentlyContinue | Select-Object Name,Source\n$env:CC')}
<div class="result-note"><b>檔案檢查：</b>兩個 <code>Test-Path</code> 都應是 <code>True</code>。若為 <code>False</code>，先看目前位置是否為 <code>ASR5K_v2_28384</code> 的根目錄，再確認這個版本是否有該檔案。不要在網站專案的 <code>docs</code> 資料夾執行韌體測試。</div>
<p>腳本依序用 Python 的 <code>shutil.which</code> 尋找 <b>環境變數 CC 指定的程式 → gcc → clang → cc</b>，選第一個找得到的。<code>$env:CC</code> 沒有輸出可以是正常情況；此時就往下找。<code>Get-Command</code> 是初步檢查，腳本最後仍以 <code>shutil.which</code> 的結果為準。</p>
<p>若已找到 <code>gcc</code>，用 <code>gcc --version</code> 確認它能啟動；使用 <code>clang</code> 就執行 <code>clang --version</code>。若 CC 指定的是完整路徑，可用 <code>&amp; $env:CC --version</code>。腳本傳入 <code>-std=c99 -Wall -Wextra -Werror</code>，需要接受這種 GCC 風格參數的工具；只有 CCS 的晶片編譯器或 MSVC 的 <code>cl</code> 並不足以符合這支腳本的需求。CC 應只填編譯器名稱或可執行檔路徑，不能附帶參數。</p>
<div class="table-wrap"><table><thead><tr><th>你看到什麼</th><th>先處理哪一層</th></tr></thead><tbody>
<tr><td><code>requires C compiler</code></td><td>還沒有找到編譯器。確認已安裝可用的 gcc 或 clang，並讓 PATH 或 CC 找得到它。若修改的是系統 PATH，重開終端機再查；若使用本頁的暫時 PATH／CC 設定，請保留同一視窗，或在新視窗重新設定。</td></tr>
<tr><td>不認得編譯參數、找不到標頭，或 C 編譯錯誤</td><td>已經找到編譯器，但建置未完成。保留第一個錯誤及編譯器版本；<code>-Werror</code> 也會把警告當成失敗，先釐清原因。</td></tr>
<tr><td>C 測試程式出現 <code>assertion failed</code> 等斷言訊息</td><td>程式已進入檢查，某個「實際值應符合預期」的條件不成立。記下檔名、行號、條件和當前 SHA，再追輸入、係數與結果。</td></tr>
<tr><td>Python 顯示 <code>CalledProcessError</code></td><td>代表它啟動的編譯器或測試程式以非零碼結束。這一行本身不能判斷是哪種失敗；往上找第一個編譯錯誤或 C 斷言訊息。</td></tr>
</tbody></table></div>
<p>來源：${link(base+'tests/measurement_core_test.py#L231-L248','編譯器搜尋、編譯與執行流程')}。完成這些準備後，再照「跑第一個最小測試」執行並記錄結果。</p></section>`;
}

export function dcWalkthrough({code,link,base}) {
  const core=base+'ASR5K_F28384D_CPU1/Measurement_module/measurement_core.c';
  const fixture=base+'tests/measurement_core_test.py';
  const sampleRows=Array.from({length:8},(_,i)=>`<tr><td>${i+1}</td><td>4</td><td>4</td><td>2</td><td>1</td><td>4</td><td>1</td><td>2</td></tr>`).join('');
  return `
<section class="panel"><h3>親手算一次：8 筆不變的直流資料</h3>
<p>先挑一個可以用紙筆算完的既有案例。測試中的 <code>setup(&amp;c,1U)</code> 把取樣率設為 1000 Hz、一窗設為 8 筆、顯示平均設為 1 窗；接著依序送入第 1 到第 8 筆，每筆電壓與電流的 raw 都是 4。<b>這是測試專用設定</b>，不要和產品路徑的 100 kHz、2048 筆混在一起。</p>
<div class="callout"><b>這組係數是人工設定的測試條件。</b> 電壓 gain = 0.5、電流 gain = 0.25，兩個 offset 都是 0。以下依測試意義把結果標成 V、A、W；它不是從實際設備校正得到的係數，通過此案例也不能證明硬體量得準。</div>
<h4>1. 先寫出每筆資料代表的值</h4>
<div class="formula">v = 0.5 × 4 + 0 = 2 V<br>i = 0.25 × 4 + 0 = 1 A</div>
<p>下面的表格是方便手算的等效展開。每一列的 <code>v × i</code> 都使用同一筆配對資料；此處 8 筆完全一樣，所以每一欄都可以直接乘以 8。</p>
<div class="table-wrap"><table><thead><tr><th>序號</th><th>電壓 raw</th><th>電流 raw</th><th>v（V）</th><th>i（A）</th><th>v²（V²）</th><th>i²（A²）</th><th>v × i（W）</th></tr></thead><tbody>${sampleRows}<tr><th>合計 Σ</th><td>32</td><td>32</td><td>16</td><td>8</td><td>32</td><td>8</td><td>16</td></tr></tbody></table></div>
<h4>2. 從合計得到平均、有效值與功率</h4>
<p>Σ 是「全部加起來」，N 是筆數；這裡 N = 8。平均值先除以 N；RMS 則是「平方、平均、開根號」。</p>
<div class="split"><div>
<div class="formula">Vavg = Σv ÷ N = 16 ÷ 8 = 2 V<br>Iavg = Σi ÷ N = 8 ÷ 8 = 1 A</div>
<div class="formula">Vrms = √(Σv² ÷ N)<br>= √(32 ÷ 8) = 2 V<br>Irms = √(8 ÷ 8) = 1 A</div>
</div><div>
<div class="formula">P = Σ(v × i) ÷ N<br>= 16 ÷ 8 = 2 W</div>
<div class="formula">S = Vrms × Irms = 2 VA<br>PF = P ÷ S = 2 ÷ 2 = 1</div>
</div></div>
<p>純直流並不代表 RMS 是 0：2 V 不變的直流，其總 RMS 就是 2 V。扣掉平均值後，剩下的交流成分才是 0。</p>
<div class="formula">AC Vrms = √(Vrms² − Vavg²)<br>= √(2² − 2²) = 0 V<br>電流 CF = |Ipeak| ÷ Irms = 1 ÷ 1 = 1</div>
<p>這個案例的 Q 也應是 0。電壓始終為正，沒有用來估算週期的重複正向越零，所以 <b>frequency 的有效旗標應為無效</b>。不要把欄位裡的 0 當成「已成功量到 0 Hz」。這裡的 CF 特別指電流峰值因數。</p>
<h4>3. 對回真正的 C 實作</h4>
<p>基準版本的 <code>MeasurementCore_Push</code> 先累加 <b>raw 整數</b>，不是每筆都先換成 V、A。8 筆送完時，內部應有：</p>
<div class="formula">ΣrawV = ΣrawI = 8 × 4 = 32<br>ΣrawV² = ΣrawI² = Σ(rawV × rawI)<br>= 8 × 16 = 128</div>
<p>接著由 <code>MeasurementCore_Step</code> 分階段結算：raw 平均 = 32 ÷ 8 = 4；raw 變異數 = (8 × 128 − 32²) ÷ 8² = 0；raw 乘積平均 = 128 ÷ 8 = 16。套入同一組固定線性係數後：</p>
<div class="formula">Vavg = 0.5 × 4 = 2<br>Vrms = √(0.5² × 0 + 2²) = 2<br>Irms = √(0.25² × 0 + 1²) = 1<br>P = 0.5 × 0.25 × 16 = 2</div>
<div class="result-note">前面逐筆換算的手算，與目前「先累加 raw、結算時套用單組 gain / offset」在這個案例數學等價。它不表示目前已實作逐點分段校正；若係數會隨樣本區間改變，就不能直接沿用這個等價關係。</div>
<p>另外，送完第 8 筆不等於結果已發布。既有測試先確認此時尚無可讀結果，再由 <code>finish(&amp;c)</code> 重複呼叫 <code>MeasurementCore_Step</code> 完成結算，最後用 <code>MeasurementCore_GetResult(&amp;c,8U,0U,&amp;r)</code> 讀取最新結果。</p>
${code('setup(&c,1U);\nfor(j=0;j<8;++j) sample(&c,j+1U,4,4);\nassert(!MeasurementCore_GetResult(&c,8U,0U,&r));\nfinish(&c);\nassert(MeasurementCore_GetResult(&c,8U,0U,&r));','C · 既有測試節錄，供閱讀對照')}
<h4>4. 把預期結果變成可核對的清單</h4>
<div class="table-wrap"><table><thead><tr><th>欄位</th><th>本例預期</th><th>驗證重點</th></tr></thead><tbody>
<tr><td>Vavg、Vrms</td><td>都是 2 V</td><td>不變的正直流，平均與總 RMS 相同。</td></tr>
<tr><td>Irms、AC Vrms</td><td>1 A、0 V</td><td>電流有總有效值；電壓沒有交流成分。</td></tr>
<tr><td>P、S、Q</td><td>2 W、2 VA、0</td><td>單位分開看；P 與 S 的數字相同。</td></tr>
<tr><td>PF、電流 CF</td><td>都是 1</td><td>這些是比值，沒有 V 或 A 單位。</td></tr>
<tr><td>frequency validity</td><td>無效</td><td>要檢查旗標，不只讀頻率數字。</td></tr>
</tbody></table></div>
<p>既有 <code>near()</code> 用絕對誤差小於 0.002 檢查上述數值；這是這批測試的比較容差，並不是儀器精度規格。DC 案例只是整支腳本的一部分，腳本也會執行交流、反向電流、無效資料等案例。</p>
${code('MEASUREMENT_CORE_EXECUTABLE=PASS\n0','預期成功時的最後標記與 $LASTEXITCODE · 非實際執行紀錄')}
<p>上方第一行來自所有 C 測試通過後的 <code>puts</code>；第二行是執行腳本後查看 <code>$LASTEXITCODE</code> 時應見到的值。前面可能還有 Q 案例的診斷輸出。請保留你自己實際執行的完整輸出、編譯器版本與 SHA，才算取得這次環境的測試證據。</p>
<p>來源：${link(fixture+'#L19-L38','測試係數與初始化')}、${link(fixture+'#L113-L126','8 筆 DC 案例與斷言')}、${link(core+'#L127-L145','raw 累加與關窗')}、${link(core+'#L220-L284','結算公式、CF 與頻率有效性')}、${link(fixture+'#L226-L248','PASS 標記及腳本結束流程')}。</p>
</section>`;
}
