
'use client';
import React, { useEffect, useRef } from 'react';
import { init, dispose } from 'klinecharts';

/**
 * KLineCharts v10 alpha5 — OI overlay using correct v10 API
 * CE = green bars (left), PE = red bars (right), like Sensibull
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
      needDefaultPointFigure: false,
      needDefaultXAxisFigure: false,
      needDefaultYAxisFigure: false,
      createPointFigures: ({ overlay, coordinates, bounding, yAxis }) => {
        const figures: any[] = [];
        
        if (!overlay.points || !coordinates) return figures;

        // Find max OI value for scaling
        const allOIValues = overlay.points.flatMap((p: any) => [Math.abs(p.ce || 0), Math.abs(p.pe || 0)]);
        const maxOI = Math.max(...allOIValues, 1);

        const barHeight = 8;
        const maxBarLength = 100; // max pixels for bars
        const priceAxisX = bounding.width - 60; // where price axis starts

        coordinates.forEach((coord: any, i: number) => {
          const dataPoint = overlay.points[i];
          if (!dataPoint || coord.y == null) return;

          const ceLength = (Math.abs(dataPoint.ce || 0) / maxOI) * maxBarLength;
          const peLength = (Math.abs(dataPoint.pe || 0) / maxOI) * maxBarLength;

          // CE Bar (green) - left side of price axis
          if (ceLength > 0) {
            figures.push({
              type: 'rect',
              attrs: {
                x: priceAxisX - ceLength - 5,
                y: coord.y - barHeight / 2,
                width: ceLength,
                height: barHeight,
              },
              styles: {
                style: 'fill',
                color: 'rgba(76, 175, 80, 0.8)' // green
              }
            });

            // CE text label
            figures.push({
              type: 'text',
              attrs: {
                x: priceAxisX - ceLength - 10,
                y: coord.y,
                text: `${dataPoint.ce}`
              },
              styles: {
                color: '#4caf50',
                size: 10,
                family: 'Arial',
                align: 'right',
                baseline: 'middle'
              }
            });
          }

          // PE Bar (red) - right side of price axis
          if (peLength > 0) {
            figures.push({
              type: 'rect',
              attrs: {
                x: priceAxisX + 5,
                y: coord.y - barHeight / 2,
                width: peLength,
                height: barHeight,
              },
              styles: {
                style: 'fill',
                color: 'rgba(244, 67, 54, 0.8)' // red
              }
            });

            // PE text label
            figures.push({
              type: 'text',
              attrs: {
                x: priceAxisX + peLength + 15,
                y: coord.y,
                text: `${dataPoint.pe}`
              },
              styles: {
                color: '#f44336',
                size: 10,
                family: 'Arial',
                align: 'left',
                baseline: 'middle'
              }
            });
          }

          // Strike price line and label
          figures.push({
            type: 'line',
            attrs: {
              coordinates: [
                { x: priceAxisX - maxBarLength - 20, y: coord.y },
                { x: priceAxisX + maxBarLength + 20, y: coord.y }
              ]
            },
            styles: {
              style: 'stroke',
              color: 'rgba(150, 150, 150, 0.3)',
              size: 1,
              dashedValue: [3, 3]
            }
          });

          // Strike price label
          figures.push({
            type: 'text',
            attrs: {
              x: priceAxisX - maxBarLength - 25,
              y: coord.y,
              text: `${dataPoint.price}`
            },
            styles: {
              color: '#666',
              size: 10,
              family: 'Arial',
              align: 'right',
              baseline: 'middle'
            }
          });
        });

        return figures;
      }
    });

    // 3) Generate synthetic candle data
    const candles = Array.from({ length: 50 }, (_, i) => {
      const base = 24000 + (i / 49) * 2000; // prices from 24000 to 26000
      const open = +(base + (Math.random() - 0.5) * 100).toFixed(2);
      const close = +(open + (Math.random() - 0.5) * 100).toFixed(2);
      const high = +Math.max(open, close) + +(Math.random() * 50).toFixed(2);
      const low = +Math.min(open, close) - +(Math.random() * 50).toFixed(2);
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

    // 5) Generate OI data for specific strike levels (like option strikes)
    const strikeOIData = [
      { price: 24000, ce: 1500, pe: 2200 },
      { price: 24200, ce: 2800, pe: 1900 },
      { price: 24400, ce: 3200, pe: 1600 },
      { price: 24600, ce: 2900, pe: 1800 },
      { price: 24800, ce: 2100, pe: 2500 },
      { price: 25000, ce: 4500, pe: 4200 }, // ATM strike
      { price: 25200, ce: 2600, pe: 2900 },
      { price: 25400, ce: 1800, pe: 3100 },
      { price: 25600, ce: 1400, pe: 3500 },
      { price: 25800, ce: 1100, pe: 3800 },
      { price: 26000, ce: 900, pe: 4100 },
    ];

    // 6) Add overlay with OI data mapped to price points
    chart.addOverlay({
      name: 'oi-bars',
      points: strikeOIData.map(strike => ({
        timestamp: Date.now(), // current time for all strikes
        value: strike.price, // this maps to the y-axis (price level)
        price: strike.price,
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
