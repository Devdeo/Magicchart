
'use client';
import React, { useEffect, useRef } from 'react';
import { init, dispose } from 'klinecharts';

/**
 * KLineCharts v10 alpha5 — OI overlay anchored to Y-axis (CE = green, PE = red)
 *
 * Important: uses chart.registerOverlay(...) (chart instance API in alpha5)
 */
export default function OIChartAlpha5() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    // 1) init chart instance
    const chart = init(ref.current);

    // 2) synthetic candles roughly spanning 100..1000
    const candles = Array.from({ length: 120 }, (_, i) => {
      const base = 100 + (i / 119) * 900; // linear from 100 to 1000
      const open = +(base + (Math.random() - 0.5) * 30).toFixed(2);
      const close = +(open + (Math.random() - 0.5) * 30).toFixed(2);
      const high = +Math.max(open, close) + +(Math.random() * 10).toFixed(2);
      const low = +Math.min(open, close) - +(Math.random() * 10).toFixed(2);
      const ts = Date.now() + i * 60 * 1000;
      return { timestamp: ts, open, high, low, close, volume: Math.round(Math.random() * 1000) };
    });
    chart.applyNewData(candles);

    // 3) build strike-level OI payload (100,200,...,1000)
    const oiList = Array.from({ length: 10 }, (_, idx) => {
      const price = 100 * (idx + 1);
      const ce = Math.round(Math.random() * 5000);
      const pe = Math.round(Math.random() * 5000);
      const changeInCE = Math.round((Math.random() - 0.5) * 500);
      const changeInPE = Math.round((Math.random() - 0.5) * 500);
      return { price, ce, pe, changeInCE, changeInPE };
    });

    // Debug: make sure values exist
    // console.log('candles range', candles[0], candles[candles.length - 1], 'oiList', oiList);

    // 4) register overlay on the chart instance (alpha5 style)
    try {
      // guard so we only register once when HMR/dev hot reloads
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (!window.__kline_alpha5_oi_registered) {
        chart.registerOverlay({
          name: 'oi_overlay_alpha5',
          totalStep: 0,
          // use createFigures / createYAxisFigures style — alpha5 varies; createFigures is safe
          createFigures: ({ overlay, coordinateSystem, bounding, yAxis }) => {
            // overlay.extendData.oiList is what we pass below
            const list = overlay?.extendData?.oiList;
            if (!Array.isArray(list) || list.length === 0) return [];

            const areaWidth = Math.max(60, bounding.width / 3); // reserve 1/3 width (min 60 px)
            const right = bounding.right;
            const maxVal = Math.max(...list.flatMap((o: any) => [Math.abs(o.ce || 0), Math.abs(o.pe || 0)]), 1);

            const BAR_H = 10;
            const GAP = 4;
            const outFigures: any[] = [];

            for (const item of list) {
              // convert strike price -> pixel y (use coordinateSystem API)
              let y: number | null = null;
              try {
                // alpha5 coordinateSystem.convertToPixel(price, 'yAxis') is available in many builds
                if (coordinateSystem && typeof (coordinateSystem as any).convertToPixel === 'function') {
                  // @ts-ignore
                  y = (coordinateSystem as any).convertToPixel(item.price, 'yAxis');
                } else if (yAxis && typeof (yAxis as any).convertToPixel === 'function') {
                  // fallback to yAxis if provided
                  // @ts-ignore
                  y = (yAxis as any).convertToPixel(item.price);
                }
              } catch (e) {
                // conversion failed: skip this strike
                // console.warn('convertToPixel failed', e);
                y = null;
              }

              if (y == null || Number.isNaN(y)) continue;

              const ceW = (Math.abs(item.ce || 0) / maxVal) * areaWidth;
              const peW = (Math.abs(item.pe || 0) / maxVal) * areaWidth;

              // CE bar (green), hugging right edge (closest to axis)
              outFigures.push({
                type: 'rect',
                attrs: {
                  x: right - ceW,
                  y: y - BAR_H - GAP,
                  width: ceW,
                  height: BAR_H,
                  rx: 2,
                  ry: 2,
                },
                styles: { style: 'fill', color: 'rgba(0,200,0,0.65)' },
              });

              // PE bar (red) left of CE
              outFigures.push({
                type: 'rect',
                attrs: {
                  x: right - ceW - GAP - peW,
                  y: y + GAP,
                  width: peW,
                  height: BAR_H,
                  rx: 2,
                  ry: 2,
                },
                styles: { style: 'fill', color: 'rgba(200,0,0,0.65)' },
              });

              // small dashed horizontal guide (very faint)
              outFigures.push({
                type: 'line',
                attrs: {
                  x1: right - areaWidth - 6,
                  y1: y,
                  x2: right,
                  y2: y,
                  lineWidth: 0.5,
                },
                styles: { color: 'rgba(150,150,150,0.07)' },
              });
            }

            return outFigures;
          },
        });

        // mark registered
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        window.__kline_alpha5_oi_registered = true;
      }
    } catch (err) {
      // fallback: some alpha builds may not expose chart.registerOverlay -> throw early
      // console.error('registerOverlay failed', err);
    }

    // 5) create overlay and pass our OI list under extendData.oiList
    try {
      chart.createOverlay({
        name: 'oi_overlay_alpha5',
        extendData: { oiList },
      });
    } catch (e) {
      // some builds use different createOverlay signature; log to help debug
      // console.error('createOverlay failed', e);
    }

    // cleanup
    return () => {
      try {
        dispose(ref.current as any);
      } catch (e) {
        // ignore
      }
    };
  }, []);

  return <div ref={ref} style={{ width: '100%', height: 680 }} />;
}
