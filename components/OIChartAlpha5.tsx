'use client';
import React, { useEffect, useRef } from 'react';
import { init, dispose, registerFigure, registerOverlay } from 'klinecharts';

export default function OIChartAlpha5() {
  const ref = useRef<HTMLDivElement | null>(null);
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!ref.current) return;

    if (!registeredRef.current) {
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

      // FIXED OVERLAY: Correct right-side positioning
      registerOverlay({
        name: 'oiOverlay',
        totalStep: 1,
        createPointFigures: ({ coordinates, overlay, bounding }) => {
          const figures: any[] = [];
          if (!overlay?.extendData || !coordinates?.length) return figures;

          const ce = Number(overlay.extendData.ce || 0);
          const pe = Number(overlay.extendData.pe || 0);
          const changeInCE = Number(overlay.extendData.changeInCE || 0);
          const changeInPE = Number(overlay.extendData.changeInPE || 0);
          const price = overlay.extendData.price;

          const coord = coordinates[0];
          const centerY = coord.y;

          // Corrected layout parameters
          const BAR_H = 6;
          const GAP = 2;
          const maxBarWidth = 80;
          const RIGHT_PADDING = 5;
          const rightEdge = bounding.width - RIGHT_PADDING; // FIX: Use full width

          const maxVal = Math.max(Math.abs(ce), Math.abs(pe), Math.abs(changeInCE), Math.abs(changeInPE), 1);

          const ceW = (Math.abs(ce) / maxVal) * maxBarWidth;
          const peW = (Math.abs(pe) / maxVal) * maxBarWidth;
          const chCeW = (Math.abs(changeInCE) / maxVal) * (maxBarWidth * 0.6);
          const chPeW = (Math.abs(changeInPE) / maxVal) * (maxBarWidth * 0.6);

          const totalHeight = BAR_H * 4 + GAP * 3;
          const topY = centerY - totalHeight / 2;

          // 1) CE bar - FIXED positioning
          const ceY = topY;
          if (ceW > 0) {
            figures.push({
              type: 'oiBar',
              // FIX: Proper right-aligned position
              attrs: { x: rightEdge - ceW, y: ceY, width: ceW, height: BAR_H },
              styles: { color: 'rgba(76,175,80,0.8)' }
            });
            figures.push({
              type: 'oiText',
              attrs: { 
                x: rightEdge - ceW - 5, 
                y: ceY + BAR_H / 2, 
                text: `${ce}` 
              },
              styles: { color: '#2e7d32', size: 9 }
            });
          }

          // 2) PE bar - FIXED positioning
          const peY = ceY + BAR_H + GAP;
          if (peW > 0) {
            figures.push({
              type: 'oiBar',
              attrs: { x: rightEdge - peW, y: peY, width: peW, height: BAR_H },
              styles: { color: 'rgba(244,67,54,0.8)' }
            });
            figures.push({
              type: 'oiText',
              attrs: { 
                x: rightEdge - peW - 5, 
                y: peY + BAR_H / 2, 
                text: `${pe}` 
              },
              styles: { color: '#b71c1c', size: 9 }
            });
          }

          // 3) changeInCE - FIXED positioning
          const chCeY = peY + BAR_H + GAP;
          if (chCeW > 0) {
            const color = changeInCE >= 0 ? 'rgba(146,208,80,0.7)' : 'rgba(255,193,7,0.7)';
            figures.push({
              type: 'oiBar',
              attrs: { x: rightEdge - chCeW, y: chCeY, width: chCeW, height: BAR_H },
              styles: { color }
            });
            figures.push({
              type: 'oiText',
              attrs: { 
                x: rightEdge - chCeW - 5, 
                y: chCeY + BAR_H / 2, 
                text: `${changeInCE}` 
              },
              styles: { color: '#666', size: 8 }
            });
          }

          // 4) changeInPE - FIXED positioning
          const chPeY = chCeY + BAR_H + GAP;
          if (chPeW > 0) {
            const color = changeInPE >= 0 ? 'rgba(255,150,150,0.7)' : 'rgba(255,102,0,0.7)';
            figures.push({
              type: 'oiBar',
              attrs: { x: rightEdge - chPeW, y: chPeY, width: chPeW, height: BAR_H },
              styles: { color }
            });
            figures.push({
              type: 'oiText',
              attrs: { 
                x: rightEdge - chPeW - 5, 
                y: chPeY + BAR_H / 2, 
                text: `${changeInPE}` 
              },
              styles: { color: '#666', size: 8 }
            });
          }

          // Strike guide line
          figures.push({
            type: 'strikeLine',
            attrs: {
              x1: 0,  // FIX: Start from left edge
              y: centerY,
              x2: bounding.width  // FIX: Extend to full width
            },
            styles: { color: 'rgba(120,120,120,0.1)', width: 0.5, dash: [2, 2] }
          });

          // Strike price label
          figures.push({
            type: 'oiText',
            attrs: { 
              x: 5,  // FIX: Left edge position
              y: centerY, 
              text: `${price}` 
            },
            styles: { color: '#888', size: 10 }
          });

          return figures;
        }
      });

      registeredRef.current = true;
    }

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