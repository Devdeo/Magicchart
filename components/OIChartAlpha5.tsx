// OIChartAlpha5.tsx
'use client';
import React, { useEffect, useRef } from 'react';
import { init, dispose } from 'klinecharts';
import { registerOIOverlay } from './OIOverlay';  // adjust relative path if needed

export default function OIChartAlpha5() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Register the overlay & figures only once
    registerOIOverlay();

    const chart = init(ref.current);

    const candles = Array.from({ length: 50 }, (_, i) => {
      const base = 24000 + (i / 49) * 2000;
      const open = +(base + (Math.random() - 0.5) * 100).toFixed(2);
      const close = +(open + (Math.random() - 0.5) * 100).toFixed(2);
      const high = +Math.max(open, close) + +(Math.random() * 50).toFixed(2);
      const low = +Math.min(open, close) - +(Math.random() * 50).toFixed(2);
      const ts = Date.now() + i * 60 * 1000;
      return { timestamp: ts, open, high, low, close, volume: Math.round(Math.random() * 1000) };
    });
    chart.applyNewData(candles);

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

    strikeOIData.forEach((strike) => {
      try {
        chart.createOverlay({
          name: 'oiOverlay',
          points: [{ timestamp: Date.now(), value: strike.price }],
          extendData: {
            price: strike.price,
            ce: strike.ce,
            pe: strike.pe,
            changeInCE: strike.changeInCE,
            changeInPE: strike.changeInPE
          },
          lock: true
        });
      } catch (e) {
        console.error('Overlay creation error:', e);
      }
    });

    return () => {
      try {
        dispose(ref.current as HTMLDivElement);
      } catch (e) {
        console.error('Dispose error:', e);
      }
    };
  }, []);

  return <div ref={ref} style={{ width: '100%', height: 680 }} />;
}
