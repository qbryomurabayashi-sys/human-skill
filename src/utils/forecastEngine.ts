
/**
 * Advanced Sales/Visitor Forecast Engine
 * Pure TypeScript implementation of the requested forecasting logic.
 */

// --- Step 1: Preprocessing ---

/**
 * Hampel Filter (Automatic outlier correction)
 * Detects sudden anomalies (closures, bad weather, etc.) and replaces them with the median.
 */
export function hampelFilter(data: number[], win = 3, threshold = 3.0) {
  const out = [...data];
  const flags = new Array(data.length).fill(false);
  for (let i = 0; i < data.length; i++) {
    const lo = Math.max(0, i - win);
    const hi = Math.min(data.length - 1, i + win);
    const window = data.slice(lo, hi + 1).sort((a, b) => a - b);
    const median = window[Math.floor(window.length / 2)];
    const absDevs = window.map(x => Math.abs(x - median)).sort((a, b) => a - b);
    const mad = absDevs[Math.floor(absDevs.length / 2)];
    if (mad > 0 && Math.abs(data[i] - median) > threshold * mad) {
      out[i] = median;
      flags[i] = true;
    }
  }
  return { filtered: out, flags };
}

/**
 * Data Rescue (Restoring normal values after missing data)
 * If at least 6 months of normal data exist in the last 12 months,
 * and the value is within ±11% of the moving average, it's considered normal.
 */
export function dataRescue(data: (number | null)[]) {
  const result = [...data];
  const valid = data.filter((v): v is number => v !== null);
  if (valid.length < 6) return result as number[];
  const ma = valid.slice(-6).reduce((a, b) => a + b, 0) / 6;
  result.forEach((v, i) => {
    if (v !== null && Math.abs(v - ma) / ma <= 0.11) result[i] = v;
  });
  return result as number[];
}

// --- Step 2: Logistic Growth Model ---

/**
 * Basic Logistic Function
 * Calculates sales trend using an S-curve.
 */
export function logistic(t: number, base: number, L: number, k: number, t0: number) {
  return base + L / (1 + Math.exp(-k * (t - t0)));
}

/**
 * Huber Loss (Robust error function)
 * Less sensitive to outliers than squared error.
 */
export function huberLoss(actual: number[], predicted: number[], delta: number) {
  return actual.reduce((sum, v, i) => {
    const e = Math.abs(v - predicted[i]);
    return sum + (e <= delta ? 0.5 * e * e : delta * (e - 0.5 * delta));
  }, 0) / actual.length;
}
/**
 * Multi-start Nelder-Mead-like fitting
 * Finds optimal L, k, t0 values using 3 sets of initial parameters.
 * Guided by physical capacity.
 */
export function fitLogistic(data: number[], base: number, maxCapacity: number) {
  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  const delta = avg * 0.1;
  const predict = (L: number, k: number, t0: number) => data.map((_, i) => logistic(i, base, L, k, t0));

  // L (ceiling) should be around maxCapacity, but L in the formula is (Ceiling - Base)
  const theoreticalL = Math.max(0, maxCapacity - base);

  // 3 patterns of initial values (Standard / Conservative / Aggressive)
  const initSets = [
    [theoreticalL, 0.20, data.length / 2],
    [theoreticalL * 0.8, 0.10, data.length * 0.7],
    [theoreticalL * 1.2, 0.30, data.length * 0.3],
  ];

  let best: { L: number; k: number; t0: number } | null = null;
  let bestLoss = Infinity;

  initSets.forEach(([L, k, t0]) => {
    const loss = huberLoss(data, predict(L, k, t0), delta);
    if (loss < bestLoss) {
      bestLoss = loss;
      best = { L, k, t0 };
    }
  });

  return best || { L: theoreticalL, k: 0.2, t0: data.length / 2 };
}

// --- Step 3: Dynamic Seasonality ---

/**
 * Dynamic Seasonality Module
 * Updates seasonal indices using EMA, normalized to sum to 12.0.
 */
export function dynamicSeasonality(data: number[], trendFn: (i: number) => number, alpha = 0.3) {
  const seas = new Array(12).fill(1.0);
  data.forEach((v, i) => {
    const trend = trendFn(i) || 1;
    const ratio = v / trend;
    const m = i % 12;
    seas[m] = alpha * ratio + (1 - alpha) * seas[m];
  });
  const sum = seas.reduce((a, b) => a + b, 0);
  return seas.map(s => s * 12 / sum);
}

// --- Step 4: Shock Detection ---

/**
 * Shock Detector
 * Detects structural changes based on dynamic thresholds linked to volatility (CV).
 */
export function detectShift(data: number[]) {
  if (data.length < 12) return { idx: -1, delta: 0 };
  
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((s, v) => s + (v - mean) ** 2, 0) / data.length;
  const cv = mean !== 0 ? Math.sqrt(variance) / mean : 0;
  const threshold = Math.max(0.08, Math.min(0.25, cv)); // Dynamic threshold (8% to 25%)

  let best = { idx: -1, delta: 0 };
  for (let t = 6; t < data.length - 6; t++) {
    const before = data.slice(t - 6, t);
    const after = data.slice(t, t + 6);
    const mb = before.reduce((a, b) => a + b, 0) / before.length;
    const ma = after.reduce((a, b) => a + b, 0) / after.length;
    const changePct = mb !== 0 ? Math.abs(ma - mb) / mb : 0;
    if (changePct > threshold && changePct > Math.abs(best.delta)) {
      best = { idx: t, delta: mb !== 0 ? (ma - mb) / mb : 0 };
    }
  }
  return best;
}

// --- Step 6: Mode Selection ---

/**
 * Mode Selection
 * Automatically categorizes store status based on history and shock detection.
 */
export function selectMode(data: number[], shiftResult: { idx: number; delta: number }) {
  if (data.length < 13) return 'startup';
  if (shiftResult.idx > -1) {
    const v = data[shiftResult.idx];
    const after = data.slice(shiftResult.idx, shiftResult.idx + 4);
    const recovering = shiftResult.delta < -0.2 && after.length > 0 && after[after.length - 1] > v * 1.1;
    if (recovering) return 'recovery';
    return 'shift';
  }
  return 'standard';
}

// --- Step 7: Action Advisor ---

export interface ActionAdvice {
  type: 'A' | 'B' | 'C' | 'ok';
  title: string;
  message: string;
}

/**
 * Action Advisor
 * Provides business recommendations based on forecast parameters.
 */
export function evaluateActions(currentSales: number, fit: { L: number; k: number; t0: number }, nudge: { value: number; consistent: boolean }): ActionAdvice[] {
  const actions: ActionAdvice[] = [];
  const saturation = fit.L !== 0 ? currentSales / fit.L : 1;

  // A: Lack of awareness
  if (saturation < 0.7 && fit.k < 0.1) {
    actions.push({
      type: 'A',
      title: '認知不足・テコ入れ対象',
      message: 'ポテンシャルはあるが成長速度が鈍化。ポスティング・店頭サイネージ・初回割引を優先実施。'
    });
  }
  // B: Saturation
  if (saturation > 0.95) {
    actions.push({
      type: 'B',
      title: '飽和状態・キャパシティ拡張',
      message: '売上が理論上限の95%超。席数増設・スタッフ増員・ドミナント出店を検討。'
    });
  }
  // C: Operational anomaly
  if (nudge.value < -100 && nudge.consistent) {
    actions.push({
      type: 'C',
      title: '現場の異変検知',
      message: '3ヶ月以上連続で理論値を下回り中。競合出店・スタッフ退職・施設集客低下を確認してください。'
    });
  }
  if (actions.length === 0) {
    actions.push({ type: 'ok', title: '異常なし', message: '順調に推移しています。' });
  }
  return actions;
}

// --- Step 8: External Factors Correction ---

export interface ExternalParams {
  avgTemp: number;
  rainDays: number;
  holidayCount: number;
  weekendRatio: number;
  newCompetitors: number;
  reviewScore: number;
  cpiYoY: number;
  sentimentDI: number;
}

/**
 * Weather Effect
 */
function weatherEffect(avgTemp: number, rainDays: number) {
  let eff = 0;
  if (avgTemp < 5) eff -= 0.08;
  else if (avgTemp < 12) eff -= 0.03;
  else if (avgTemp >= 22 && avgTemp <= 28) eff += 0.06;
  else if (avgTemp > 32) eff -= 0.05;
  eff -= rainDays * 0.004;
  return eff;
}

/**
 * Calendar Effect
 */
function calendarEffect(holidayCount: number, weekendRatio: number) {
  const weekendEff = (weekendRatio - 40) * 0.004;
  const holidayEff = holidayCount * 0.025;
  return weekendEff + holidayEff;
}

/**
 * Competitor/Review Effect
 */
function competitorEffect(newCompetitors: number, reviewScore: number) {
  const compEff = -newCompetitors * 0.04;
  const reviewEff = (reviewScore - 3.5) * 0.06;
  return compEff + reviewEff;
}

/**
 * Economic Effect
 */
function econEffect(cpiYoY: number, sentimentDI: number) {
  const cpiEff = cpiYoY > 3 ? -(cpiYoY - 3) * 0.015 : cpiYoY * 0.005;
  const diEff = sentimentDI * 0.001;
  return cpiEff + diEff;
}

/**
 * Build External Multiplier
 */
export function buildExternalMultiplier(params: ExternalParams) {
  const multiplier = 1
    + weatherEffect(params.avgTemp, params.rainDays)
    + calendarEffect(params.holidayCount, params.weekendRatio)
    + competitorEffect(params.newCompetitors, params.reviewScore)
    + econEffect(params.cpiYoY, params.sentimentDI);
  return Math.max(0.5, Math.min(1.5, multiplier));
}

/**
 * Explain Forecast (Waterfall decomposition)
 */
export function explainForecast(baseEnsemble: number, params: ExternalParams) {
  const factors = [
    { label: '天候・気温', eff: weatherEffect(params.avgTemp, params.rainDays) },
    { label: '曜日・祝日', eff: calendarEffect(params.holidayCount, params.weekendRatio) },
    { label: '競合・口コミ', eff: competitorEffect(params.newCompetitors, params.reviewScore) },
    { label: '経済指標', eff: econEffect(params.cpiYoY, params.sentimentDI) },
  ];

  return factors.map(f => ({
    label: f.label,
    delta: Math.round(baseEnsemble * f.eff),
    pct: parseFloat((f.eff * 100).toFixed(1)),
    direction: f.eff >= 0 ? 'up' : 'down',
  }));
}

/**
 * Ensemble Forecast
 * Combines Logistic (0.7) and EMA (0.3) models with 80% confidence intervals.
 * Now considers physical capacity.
 */
export function buildEnsemble(
  history: number[],
  forecastMonths: number,
  fit: { L: number; k: number; t0: number },
  seas: number[],
  base: number,
  maxCapacity: number
) {
  const n = history.length;
  const { L, k, t0 } = fit;

  // EMA calculation
  let emaVal = history[0] || 0;
  history.forEach(v => { emaVal = 0.3 * v + 0.7 * emaVal; });
  const emaSlope = n >= 2 ? (history[n - 1] - history[n - 2]) * 0.5 : 0; // Dampen slope

  // Nudge (Adaptive correction)
  const trendPred = history.map((_, i) => logistic(i, base, L, k, t0));
  const residuals = history.map((v, i) => v - trendPred[i]);
  const recent = residuals.slice(-6); // Shorter window for nudge
  const posCount = recent.filter(r => r > 0).length;
  const consistencyRatio = recent.length > 0 ? posCount / recent.length : 0.5;
  const avgResid = recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
  const isConsistent = consistencyRatio >= 0.8 || consistencyRatio <= 0.2;
  const nudge = { value: Math.round(avgResid * 0.5), consistent: isConsistent, ratio: consistencyRatio };

  // Residual sigma (for confidence intervals)
  const sigma = Math.sqrt(history.reduce((s, v, i) => s + (v - trendPred[i]) ** 2, 0) / n);

  // Generate predictions
  const ensemble: number[] = [], upper: number[] = [], lower: number[] = [];
  for (let i = 0; i < forecastMonths; i++) {
    const s = seas[(n + i) % 12];
    const logPred = (logistic(n + i, base, L, k, t0) + nudge.value);
    const emaPred = (emaVal + (i + 1) * emaSlope);
    
    // Weighted ensemble (0.7 Logistic + 0.3 EMA)
    let ens = (0.7 * logPred + 0.3 * emaPred) * s;
    
    // Hard cap at physical capacity
    ens = Math.min(maxCapacity, ens);
    
    ensemble.push(Math.round(ens));
    upper.push(Math.round(Math.min(maxCapacity * 1.1, ens + 1.28 * sigma))); 
    lower.push(Math.round(Math.max(0, ens - 1.28 * sigma)));
  }
  return { ensemble, upper, lower, nudge, sigma };
}

/**
 * Run Forecast Engine
 */
export function runForecastEngine(rawSalesData: number[], maxCapacity: number, forecastMonths = 6) {
  if (rawSalesData.length === 0) {
    return null;
  }

  // 1. Preprocessing
  const { filtered, flags } = hampelFilter(rawSalesData, 3, 3.0);
  const base = filtered[0] || 0;

  // 2. Parameter Fitting (Capacity-aware)
  const fit = fitLogistic(filtered, base, maxCapacity);

  // 3. Seasonality Extraction
  const trendFn = (i: number) => logistic(i, base, fit.L, fit.k, fit.t0);
  const seas = dynamicSeasonality(filtered, trendFn);

  // 4. Shock Detection
  const shift = detectShift(filtered);
  const mode = selectMode(filtered, shift);

  // 5. Ensemble Forecast (Capacity-aware)
  const { ensemble, upper, lower, nudge, sigma } = buildEnsemble(
    filtered, forecastMonths, fit, seas, base, maxCapacity
  );

  // 6. Action Advisor
  const actions = evaluateActions(filtered[filtered.length - 1] || 0, fit, nudge);

  return { 
    filtered, 
    flags, 
    fit, 
    seas, 
    shift, 
    mode, 
    ensemble, 
    upper, 
    lower, 
    nudge, 
    sigma, 
    actions 
  };
}
