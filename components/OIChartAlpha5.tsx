'use client';
import React, { useState } from 'react';
import CandlestickChart from './CandlestickChart';
import OIOverlay from './OIOverlay';

/**
 * Combined chart with separated candlestick and OI overlay components
 */
export default function OIChartAlpha5() {
  const [chart, setChart] = useState<any>(null);

  // Strike OI data (include changeInCE/changeInPE)
  const strikeOIData = [
    { price: 24000, ce: 1500, pe: 2200, changeInCE: 120, changeInPE: -80 },
    { price: 24200, ce: 2800, pe: 1900, changeInCE: -220, changeInPE: 60 },
    { price: 24400, ce: 3200, pe: 1600, changeInCE: 300, changeInPE: -40 },
    { price: 24600, ce: 2900, pe: 1800, changeInCE: -90, changeInPE: 20 },
    { price: 24800, ce: 2100, pe: 2500, changeInCE: 45, changeInPE: -120 },
    { price: 25000, ce: 4500, pe: 4200, changeInCE: 200, changeInPE: -170 },
    { price: 25200, ce: 2600, pe: 2900, changeInCE: -10, changeInPE: 30 },
    { price: 25400, ce: 1800, pe: 3100, changeInCE: 50, changeInPE: 70 },
    { price: 25600, ce: 1400, pe: 3500, changeInCE: -40, changeInPE: 90 },
    { price: 25800, ce: 1100, pe: 3800, changeInCE: 10, changeInPE: -30 },
    { price: 26000, ce: 900, pe: 4100, changeInCE: -60, changeInPE: 120 },
  ];

  const handleChartReady = (chartInstance: any) => {
    setChart(chartInstance);
  };

  return (
    <div style={{ width: '100%', height: 680, position: 'relative' }}>
      <CandlestickChart onChartReady={handleChartReady} />
      {chart && <OIOverlay chart={chart} data={strikeOIData} />}
    </div>
  );
}