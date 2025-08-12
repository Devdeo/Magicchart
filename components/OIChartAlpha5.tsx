
'use client';
import React, { useEffect, useRef } from 'react';
import { init, dispose } from 'klinecharts';

/**
 * KLineCharts v10 alpha5 — OI overlay using correct v10 API
 * CE = green bars, PE = red bars, aligned on right side price axis
 */
export default function OIChartAlpha5() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    // 1) init chart instance
    const chart = init(ref.current);

    // 2) Register custom overlay template for OI bars BEFORE adding data
    chart.createOverlayTemplate({
      name: 'oi-bars',
      totalStep: 1,
      createPointFigures: ({ overlay, coordinates, bounding, yAxis }) => {
        const figures: any[] = [];
        
        if (!overlay.points || !coordinates) return figures;

        // Find max OI value for scaling
        const maxOI = Math.max(
          ...overlay.points.flatMap((p: any) => [Math.abs(p.ce || 0), Math.abs(p.pe || 0)]),
          1
        );

        const barWidth = 6;
        const maxBarLength = 80; // max pixels for bars
        const rightEdge = bounding.right - 10; // leave some margin from edge

        coordinates.forEach((coord: any, i: number) => {
          const dataPoint = overlay.points[i];
          if (!dataPoint || coord.y == null) return;

          const ceLength = (Math.abs(dataPoint.ce || 0) / maxOI) * maxBarLength;
          const peLength = (Math.abs(dataPoint.pe || 0) / maxOI) * maxBarLength;

          // CE Bar (green) - rightmost
          if (ceLength > 0) {
            figures.push({
              type: 'rect',
              attrs: {
                x: rightEdge - ceLength,
                y: coord.y - barWidth / 2,
                width: ceLength,
                height: barWidth,
              },
              styles: {
                style: 'fill',
                color: 'rgba(76, 175, 80, 0.8)' // green
              }
            });
          }

          // PE Bar (red) - left of CE bar with small gap
          if (peLength > 0) {
            figures.push({
              type: 'rect',
              attrs: {
                x: rightEdge - ceLength - peLength - 4,
                y: coord.y - barWidth / 2,
                width: peLength,
                height: barWidth,
              },
              styles: {
                style: 'fill',
                color: 'rgba(244, 67, 54, 0.8)' // red
              }
            });
          }

          // Faint price level line
          figures.push({
            type: 'line',
            attrs: {
              coordinates: [
                { x: rightEdge - maxBarLength - 10, y: coord.y },
                { x: rightEdge, y: coord.y }
              ]
            },
            styles: {
              style: 'stroke',
              color: 'rgba(150, 150, 150, 0.15)',
              size: 1,
              dashedValue: [2, 2]
            }
          });
        });

        return figures;
      }
    });

    // 3) synthetic candles roughly spanning 100..1000
    const candles = Array.from({ length: 120 }, (_, i) => {
      const base = 100 + (i / 119) * 900; // linear from 100 to 1000
      const open = +(base + (Math.random() - 0.5) * 30).toFixed(2);
      const close = +(open + (Math.random() - 0.5) * 30).toFixed(2);
      const high = +Math.max(open, close) + +(Math.random() * 10).toFixed(2);
      const low = +Math.min(open, close) - +(Math.random() * 10).toFixed(2);
      const ts = Date.now() + i * 60 * 1000;
      return { 
        timestamp: ts, 
        open, 
        high, 
        low, 
        close, 
        volume: Math.round(Math.random() * 1000)
      };
    });

    // 4) Set candle data
    chart.applyNewData(candles);

    // 5) Generate OI data for specific strike levels
    const strikeOIData = Array.from({ length: 10 }, (_, idx) => {
      const price = 100 + (idx * 100); // strikes at 100, 200, 300, ..., 1000
      const ce = Math.round(Math.random() * 5000);
      const pe = Math.round(Math.random() * 5000);
      
      return {
        timestamp: Date.now(), // all strikes at current time
        price,
        ce,
        pe
      };
    });

    // 6) Add overlay with OI data mapped to price points
    chart.addOverlay({
      name: 'oi-bars',
      points: strikeOIData.map(strike => ({
        timestamp: strike.timestamp,
        value: strike.price, // this maps to the price axis
        ce: strike.ce,
        pe: strike.pe
      }))
    });

    // cleanup
    return () => {
      try {
        dispose(ref.current as any);
      } catch (e) {
        // ignore cleanup errors
      }
    };
  }, []);

  return <div ref={ref} style={{ width: '100%', height: 680 }} />;
}
