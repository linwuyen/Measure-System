// 教學用數學模型：正弦穩態、分段線性校正與視窗 RMS 合併。
// 不存取裝置、ADC、韌體或任何外部狀態。
const RATIO_EPSILON = 1e-12;

function requireFinite(value, label) {
  if (!Number.isFinite(value)) throw new RangeError(`${label} 必須是有限數值。`);
}

/** 完整週期、同頻正弦波的解析值；phaseDegrees 為相位差（度）。 */
export function sineMetrics(voltagePeak, currentPeak, phaseDegrees) {
  requireFinite(voltagePeak, '電壓峰值');
  requireFinite(currentPeak, '電流峰值');
  requireFinite(phaseDegrees, '相位差');
  if (voltagePeak < 0 || currentPeak < 0) {
    throw new RangeError('電壓與電流峰值不得小於零。');
  }

  const vrms = voltagePeak / Math.SQRT2;
  const irms = currentPeak / Math.SQRT2;
  const s = vrms * irms;
  const phaseRadians = (phaseDegrees % 360) * Math.PI / 180;
  const p = s * Math.cos(phaseRadians);
  return {
    vrms,
    irms,
    p,
    s,
    pf: s <= RATIO_EPSILON ? null : p / s,
    cf: irms <= RATIO_EPSILON ? null : currentPeak / irms,
  };
}

/** 兩段直線共同通過 (r0, y0)；中心本身採用正側斜率。 */
export function threePoint(raw, points) {
  requireFinite(raw, '原始值');
  if (!points || typeof points !== 'object') {
    throw new RangeError('請提供三個校正點。');
  }
  for (const key of ['rNeg', 'r0', 'rPos', 'yNeg', 'y0', 'yPos']) {
    requireFinite(points[key], key);
  }
  const { rNeg, r0, rPos, yNeg, y0, yPos } = points;
  if (!(rNeg < r0 && r0 < rPos)) {
    throw new RangeError('原始校正點必須滿足 rNeg < r0 < rPos。');
  }
  const side = raw < r0 ? 'negative' : 'positive';
  const gain = side === 'negative'
    ? (y0 - yNeg) / (r0 - rNeg)
    : (yPos - y0) / (rPos - r0);
  return { value: y0 + gain * (raw - r0), gain, side };
}

/** 以樣本數加權各視窗的均方值，再取平方根；不可直接平均 RMS。 */
export function mergedRms(windows) {
  if (!Array.isArray(windows) || windows.length === 0) {
    throw new RangeError('至少需要一個 RMS 視窗。');
  }
  let sumSquares = 0;
  let sampleCount = 0;
  for (const window of windows) {
    if (!window || typeof window !== 'object') {
      throw new RangeError('每個視窗都必須提供 rms 與 n。');
    }
    const { rms, n } = window;
    requireFinite(rms, '視窗 RMS');
    requireFinite(n, '樣本數');
    if (rms < 0 || n <= 0 || !Number.isInteger(n)) {
      throw new RangeError('RMS 必須非負，樣本數必須是正整數。');
    }
    sumSquares += rms * rms * n;
    sampleCount += n;
  }
  return Math.sqrt(sumSquares / sampleCount);
}
