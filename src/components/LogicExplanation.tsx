import React from 'react';

export const LogicExplanation: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">計算ロジック解説</h2>
        <p className="text-neutral-600">本システムで使用されている各種予測・計算ロジックの仕様について説明します。</p>
      </div>

      <div className="space-y-6">
        {/* TREND Prediction */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
          <h3 className="text-xl font-bold text-neutral-800 mb-4 border-b pb-2">1. TREND予測 (重回帰分析)</h3>
          <p className="text-neutral-700 mb-4">
            過去の月別平均客数を目的変数とし、外部要因（広告費、競合フラグ）を説明変数とした重回帰分析を用いてベースとなる客数を予測します。
          </p>
          <div className="bg-neutral-50 p-4 rounded-lg font-mono text-sm text-neutral-800 mb-4">
            Y = β0 + β1*X1 + β2*X2<br/>
            <br/>
            Y: 予測ベース客数<br/>
            X1: 広告費 (万円)<br/>
            X2: 競合フラグ (0 or 1)<br/>
            β0, β1, β2: 過去データから最小二乗法により算出された偏回帰係数
          </div>
          <p className="text-sm text-neutral-500">
            ※ 過去データが不足している場合や、行列の計算が不可能な場合（多重共線性など）は、単純な過去平均値がフォールバックとして使用されます。
          </p>
        </div>

        {/* FORECAST Prediction */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
          <h3 className="text-xl font-bold text-neutral-800 mb-4 border-b pb-2">2. FORECAST予測 (時系列単回帰分析)</h3>
          <p className="text-neutral-700 mb-4">
            時間の経過（月数）を説明変数とし、過去の月別平均客数を目的変数とした単回帰分析を用いて、時間的トレンドに基づいたベース客数を予測します。
          </p>
          <div className="bg-neutral-50 p-4 rounded-lg font-mono text-sm text-neutral-800 mb-4">
            Y = a + b*t<br/>
            <br/>
            Y: 予測ベース客数<br/>
            t: 基準月からの経過月数<br/>
            a: 切片<br/>
            b: 傾き（トレンド）
          </div>
          <p className="text-sm text-neutral-500">
            ※ ExcelのFORECAST関数と同等のロジックです。
          </p>
        </div>

        {/* Monthly Budget & Daily Prediction */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
          <h3 className="text-xl font-bold text-neutral-800 mb-4 border-b pb-2">3. 月間予算と1日あたりの客数予測（AIベース / 予算ベース）</h3>
          <p className="text-neutral-700 mb-4">
            稼働計画における「1日あたりの予測客数」および「月間予測客数」は、予算の入力状況に応じて以下の2つのベースのいずれかで計算されます。
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="font-bold text-blue-800 mb-2">【AIベース】 (予算未入力時)</h4>
              <p className="text-sm text-blue-900 mb-3">
                過去のデータからTREND予測・FORECAST予測を用いて算出した1日あたりの客数を使用します。
              </p>
              <div className="font-mono text-xs text-blue-800 bg-white p-2 rounded border border-blue-100">
                平日の予測客数 = AIが予測した平日客数<br/>
                休日の予測客数 = AIが予測した休日客数<br/>
                <br/>
                月間予測客数 = <br/>
                (平日予測客数 × 平日日数) + <br/>
                (休日予測客数 × 休日日数)
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h4 className="font-bold text-green-800 mb-2">【予算ベース】 (予算入力時)</h4>
              <p className="text-sm text-green-900 mb-3">
                入力された「月間予算(客数)」を、平日と休日の傾向(休日倍率: 1.25)に合わせて日割り計算し、1日あたりの客数を逆算します。
              </p>
              <div className="font-mono text-xs text-green-800 bg-white p-2 rounded border border-green-100">
                休日倍率 = 1.25<br/>
                総ウェイト = 平日日数 + (休日日数 × 1.25)<br/>
                <br/>
                平日の予測客数 = 月間予算 ÷ 総ウェイト<br/>
                休日の予測客数 = 平日の予測客数 × 1.25
              </div>
            </div>
          </div>
        </div>

        {/* Seasonal Index */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
          <h3 className="text-xl font-bold text-neutral-800 mb-4 border-b pb-2">4. 季節指数 (AI予測時)</h3>
          <p className="text-neutral-700 mb-4">
            年間を通じた月ごとの客数の変動（季節性）を捉えるための指数です。平日と休日それぞれで計算されます。
          </p>
          <div className="bg-neutral-50 p-4 rounded-lg font-mono text-sm text-neutral-800 mb-4">
            季節指数 = (対象月の過去平均客数) / (全期間の総平均客数)
          </div>
          <p className="text-neutral-700 mb-4">
            最終的な予測客数は、ベース予測値（TRENDまたはFORECAST）にこの季節指数を掛け合わせて算出されます。
          </p>
          <div className="bg-neutral-50 p-4 rounded-lg font-mono text-sm text-neutral-800">
            最終予測客数 = ベース予測値 × 季節指数
          </div>
        </div>

        {/* Required Staff */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
          <h3 className="text-xl font-bold text-neutral-800 mb-4 border-b pb-2">5. 必要人員枠の計算 (1日あたり)</h3>
          <p className="text-neutral-700 mb-4">
            上記で算出された「1日あたりの予測客数（AIベース または 予算ベース）」と、店舗の営業時間、スタッフの標準的な処理能力（1時間あたり2.5人）に基づいて、1日あたりに必要なスタッフ数（推奨人数）を算出します。
          </p>
          <div className="bg-neutral-50 p-4 rounded-lg font-mono text-sm text-neutral-800 mb-4">
            店舗の1日処理能力 = 営業時間 × 2.5人/時<br/>
            必要人員(理論値) = 1日の予測客数 / 店舗の1日処理能力<br/>
            <br/>
            最終必要人員 = 理論値を四捨五入し、以下の制約を適用<br/>
            ・最大値: 店舗の席数 (※席数を上限とします)<br/>
            ・最小値(平日): 2人<br/>
            ・最小値(休日): オープンから37ヶ月以内は3人、それ以降は2人
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-sm text-red-800">
            <strong>※なぜ席数を増やしても必要人数が増えないのか？</strong><br/>
            席数はあくまで「上限値」として機能します。例えば、1日の客数が100人で営業時間が10時間の場合、理論値は「100 ÷ (10 × 2.5) = 4人」となります。この時、席数を10000に設定して上限をなくしても、計算結果自体が4人であるため、最終必要人数は4人となります。<br/>
            人数を増やすには、<strong>「月間予算」に大きな数字を入力して予算ベースの客数を引き上げる</strong>か、システムの処理能力定数(2.5)を変更する必要があります。
          </div>
        </div>

        {/* Man-Days and Shortage */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
          <h3 className="text-xl font-bold text-neutral-800 mb-4 border-b pb-2">6. 人工数（確保・必要）と過不足の計算</h3>
          <p className="text-neutral-700 mb-4">
            稼働計画タブで表示される「確保人工数」「必要人工数」「過不足」は、以下のロジックで月間の総数として計算されます。
          </p>
          <div className="bg-neutral-50 p-4 rounded-lg font-mono text-sm text-neutral-800 mb-4">
            <strong>【確保人工数】 (使える人工数)</strong><br/>
            店舗に配属された全スタッフの「出勤可能日数」の合計です。<br/>
            出勤可能日数 = (その月の日数) - (スタッフの公休数)<br/>
            <br/>
            <strong>【必要人工数】 (推奨される人工数)</strong><br/>
            AI予測から算出された「1日あたりの必要人員枠」を、その月のカレンダー日数に掛け合わせた合計です。<br/>
            必要人工数 = (平日の必要人員 × その月の平日日数) + (休日の必要人員 × その月の休日日数)<br/>
            <br/>
            <strong>【過不足】</strong><br/>
            確保人工数から必要人工数を引いた値です。<br/>
            過不足 = 確保人工数 - 必要人工数<br/>
            ※ マイナス（赤字）の場合は、推奨される人数に対してシフトに入れるスタッフの総枠が足りていないことを示します。<br/>
            <br/>
            <strong>【応援必要数 (過不足)】</strong><br/>
            一番右の列に表示される最終的な過不足です。時短パートの出勤日数も加味して計算されます。<br/>
            応援必要数 = 過不足 + 時短パートの合計日数
          </div>
        </div>
        
        {/* Staff Capacity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
          <h3 className="text-xl font-bold text-neutral-800 mb-4 border-b pb-2">7. スタッフの1日能力計算</h3>
          <p className="text-neutral-700 mb-4">
            マスタ設定にて過去の対応人数データをペーストした際、自動的に以下の計算が行われ「1日能力」として設定されます。
          </p>
          <div className="bg-neutral-50 p-4 rounded-lg font-mono text-sm text-neutral-800">
            1日能力 = (ペーストされた全データの平均値) / 12<br/>
            ※ 小数第2位で四捨五入されます。
          </div>
        </div>

      </div>
    </div>
  );
};
