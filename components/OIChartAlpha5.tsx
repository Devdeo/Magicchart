'use client';
import React, { useEffect, useRef } from 'react';
import { init, dispose, registerFigure, registerOverlay } from 'klinecharts';

/**
 * KLineCharts v10 alpha5 — OI overlay using registerFigure + registerOverlay
 * Draws FOUR stacked bars per strike:
 *  - CE (green)
 *  - PE (red)
 *  - changeInCE (lighter green / yellow)
 *  - changeInPE (lighter red / orange)
 */
export default function OIChartAlpha5() {
  const ref = useRef<HTMLDivElement | null>(null);
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!ref.current) return;

    // Register figures and overlay only once
    if (!registeredRef.current) {
      // oiBar rectangle
      registerFigure({
        name: 'oiBar',
        draw: (ctx, attrs, styles) => {
          const { x, y, width, height } = attrs;
          const { color } = styles;
          ctx.fillStyle = color;
          ctx.fillRect(x, y, width, height);
        },
        checkEventOn: (coordinate, attrs) => {
          const { x, y } = coordinate;
          const { x: ax, y: ay, width, height } = attrs;
          return x >= ax && x <= ax + width && y >= ay && y <= ay + height;
        }
      });

      // text label
      registerFigure({
        name: 'oiText',
        draw: (ctx, attrs, styles) => {
          const { x, y, text } = attrs;
          const { color, size = 10, family = 'Arial' } = styles;
          ctx.fillStyle = color || '#000';
          ctx.font = `${size}px ${family}`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(text), x, y);
        },
        checkEventOn: () => false
      });

      // strike guide line
      registerFigure({
        name: 'strikeLine',
        draw: (ctx, attrs, styles) => {
          const { x1, y, x2 } = attrs;
          const { color = 'rgba(150,150,150,0.08)', width = 0.6, dash } = styles;
          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          if (dash) ctx.setLineDash(dash);
          ctx.beginPath();
          ctx.moveTo(x1, y);
          ctx.lineTo(x2, y);
          ctx.stroke();
          if (dash) ctx.setLineDash([]);
        },
        checkEventOn: () => false
      });

      // overlay that creates the figures for a single strike (uses overlay.extendData fields)
      registerOverlay({
        name: 'oiOverlay',
        totalStep: 1,
        createPointFigures: ({ coordinates, overlay, bounding }) => {
          const figures: any[] = [];
          if (!overlay?.extendData || !coordinates?.length) return figures;

          // get values from extendData (expect ce, pe, changeInCE, changeInPE, price)
          const ce = Number(overlay.extendData.ce || 0);
          const pe = Number(overlay.extendData.pe || 0);
          const changeInCE = Number(overlay.extendData.changeInCE || 0);
          const changeInPE = Number(overlay.extendData.changeInPE || 0);
          const price = overlay.extendData.price;

          // pixel coord of this strike (first coordinate) - this is aligned with price axis
          const coord = coordinates[0];
          const centerY = coord.y;

          // layout params - position bars hugging the Y-axis (left side)
          const BAR_H = 6;
          const GAP = 2;
          const maxBarWidth = 80; // maximum bar width
          const yAxisX = bounding.left + 5; // start from Y-axis with small padding

          // scale relative to the max among the 4 values (so stacked bars are proportionate)
          const maxVal = Math.max(Math.abs(ce), Math.abs(pe), Math.abs(changeInCE), Math.abs(changeInPE), 1);

          // compute widths
          const ceW = (Math.abs(ce) / maxVal) * maxBarWidth;
          const peW = (Math.abs(pe) / maxVal) * maxBarWidth;
          const chCeW = (Math.abs(changeInCE) / maxVal) * (maxBarWidth * 0.6); // change bars slightly shorter
          const chPeW = (Math.abs(changeInPE) / maxVal) * (maxBarWidth * 0.6);

          // vertical stacking: top to bottom, centered on the strike price line
          const totalHeight = BAR_H * 4 + GAP * 3;
          const topY = centerY - totalHeight / 2;

          // 1) CE bar (green) - top, extends right from Y-axis
          const ceY = topY;
          if (ceW > 0) {
            figures.push({
              type: 'oiBar',
              attrs: { x: yAxisX, y: ceY, width: ceW, height: BAR_H },
              styles: { color: 'rgba(76,175,80,0.8)' }
            });
            // CE value text to right of bar
            figures.push({
              type: 'oiText',
              attrs: { x: yAxisX + ceW + 5, y: ceY + BAR_H / 2, text: `${ce}` },
              styles: { color: '#2e7d32', size: 9 }
            });
          }

          // 2) PE bar (red) - just below CE, extends right from Y-axis
          const peY = ceY + BAR_H + GAP;
          if (peW > 0) {
            figures.push({
              type: 'oiBar',
              attrs: { x: yAxisX, y: peY, width: peW, height: BAR_H },
              styles: { color: 'rgba(244,67,54,0.8)' }
            });
            figures.push({
              type: 'oiText',
              attrs: { x: yAxisX + peW + 5, y: peY + BAR_H / 2, text: `${pe}` },
              styles: { color: '#b71c1c', size: 9 }
            });
          }

          // 3) changeInCE (lighter green / yellow) - below PE, extends right from Y-axis
          const chCeY = peY + BAR_H + GAP;
          if (chCeW > 0) {
            const color = changeInCE >= 0 ? 'rgba(146,208,80,0.7)' : 'rgba(255,193,7,0.7)';
            figures.push({
              type: 'oiBar',
              attrs: { x: yAxisX, y: chCeY, width: chCeW, height: BAR_H },
              styles: { color }
            });
            figures.push({
              type: 'oiText',
              attrs: { x: yAxisX + chCeW + 5, y: chCeY + BAR_H / 2, text: `${changeInCE}` },
              styles: { color: '#666', size: 8 }
            });
          }

          // 4) changeInPE (lighter red / orange) - bottom, extends right from Y-axis
          const chPeY = chCeY + BAR_H + GAP;
          if (chPeW > 0) {
            const color = changeInPE >= 0 ? 'rgba(255,150,150,0.7)' : 'rgba(255,102,0,0.7)';
            figures.push({
              type: 'oiBar',
              attrs: { x: yAxisX, y: chPeY, width: chPeW, height: BAR_H },
              styles: { color }
            });
            figures.push({
              type: 'oiText',
              attrs: { x: yAxisX + chPeW + 5, y: chPeY + BAR_H / 2, text: `${changeInPE}` },
              styles: { color: '#666', size: 8 }
            });
          }

          // Strike price guide line - extends across chart at the exact price level
          figures.push({
            type: 'strikeLine',
            attrs: {
              x1: bounding.left,
              y: centerY,
              x2: bounding.right
            },
            styles: { color: 'rgba(120,120,120,0.1)', width: 0.5, dash: [2, 2] }
          });

          // strike label (price) - positioned at right edge of chart
          figures.push({
            type: 'oiText',
            attrs: { x: bounding.right - 45, y: centerY, text: `${price}` },
            styles: { color: '#888', size: 10 }
          });

          return figures;
        }
      });

      registeredRef.current = true;
    }

    // Initialize chart
    const chart = init(ref.current);

    // Synthetic candles roughly 24000..26000
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

    // Create an overlay per strike and pass all four values via extendData
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
        // some alpha builds differ in API — log if needed
        // console.error('createOverlay error', e);
      }
    });

    // cleanup
    return () => {
      try {
        dispose(ref.current as any);
      } catch (e) {}
    };
  }, []);

  return <div ref={ref} style={{ width: '100%', height: 680 }} />;
}