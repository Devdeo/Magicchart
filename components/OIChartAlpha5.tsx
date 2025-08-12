
'use client';
import React, { useEffect, useRef } from 'react';
import { init, dispose, registerFigure, registerOverlay } from 'klinecharts';

/**
 * KLineCharts v10 alpha5 — OI overlay using registerFigure + registerOverlay
 * CE = green bars (left), PE = red bars (right), like Sensibull
 */
export default function OIChartAlpha5() {
  const ref = useRef<HTMLDivElement | null>(null);
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!ref.current) return;

    // Register figures and overlays only once
    if (!registeredRef.current) {
      // 1. Register horizontal ray figure for OI bars
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
          const { x: attrX, y: attrY, width, height } = attrs;
          return x >= attrX && x <= attrX + width && y >= attrY && y <= attrY + height;
        }
      });

      // 2. Register text figure for OI values
      registerFigure({
        name: 'oiText',
        draw: (ctx, attrs, styles) => {
          const { x, y, text } = attrs;
          const { color, size, family } = styles;
          
          ctx.fillStyle = color;
          ctx.font = `${size}px ${family}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, x, y);
        },
        checkEventOn: () => false
      });

      // 3. Register strike line figure
      registerFigure({
        name: 'strikeLine',
        draw: (ctx, attrs, styles) => {
          const { x1, y, x2 } = attrs;
          const { color, width, dash } = styles;
          
          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          if (dash) {
            ctx.setLineDash(dash);
          }
          ctx.beginPath();
          ctx.moveTo(x1, y);
          ctx.lineTo(x2, y);
          ctx.stroke();
          if (dash) {
            ctx.setLineDash([]);
          }
        },
        checkEventOn: () => false
      });

      // 4. Register OI overlay
      registerOverlay({
        name: 'oiOverlay',
        totalStep: 1,
        createPointFigures: ({ coordinates, overlay, bounding }) => {
          const figures: any[] = [];
          
          if (!overlay.extendData || !coordinates.length) return figures;

          const { ce, pe, price } = overlay.extendData;
          const coord = coordinates[0];
          
          // Calculate bar dimensions
          const maxOI = Math.max(ce, pe, 100);
          const barHeight = 8;
          const maxBarLength = 80;
          const priceAxisX = bounding.width - 60;
          
          const ceLength = (ce / maxOI) * maxBarLength;
          const peLength = (pe / maxOI) * maxBarLength;

          // Strike line
          figures.push({
            type: 'strikeLine',
            attrs: {
              x1: priceAxisX - maxBarLength - 20,
              y: coord.y,
              x2: priceAxisX + maxBarLength + 20
            },
            styles: {
              color: 'rgba(150, 150, 150, 0.3)',
              width: 1,
              dash: [3, 3]
            }
          });

          // CE Bar (green, left side)
          if (ceLength > 0) {
            figures.push({
              type: 'oiBar',
              attrs: {
                x: priceAxisX - ceLength - 5,
                y: coord.y - barHeight / 2,
                width: ceLength,
                height: barHeight
              },
              styles: {
                color: 'rgba(76, 175, 80, 0.8)'
              }
            });

            // CE text
            figures.push({
              type: 'oiText',
              attrs: {
                x: priceAxisX - ceLength - 15,
                y: coord.y,
                text: `${ce}`
              },
              styles: {
                color: '#4caf50',
                size: 10,
                family: 'Arial'
              }
            });
          }

          // PE Bar (red, right side)
          if (peLength > 0) {
            figures.push({
              type: 'oiBar',
              attrs: {
                x: priceAxisX + 5,
                y: coord.y - barHeight / 2,
                width: peLength,
                height: barHeight
              },
              styles: {
                color: 'rgba(244, 67, 54, 0.8)'
              }
            });

            // PE text
            figures.push({
              type: 'oiText',
              attrs: {
                x: priceAxisX + peLength + 20,
                y: coord.y,
                text: `${pe}`
              },
              styles: {
                color: '#f44336',
                size: 10,
                family: 'Arial'
              }
            });
          }

          // Strike price label
          figures.push({
            type: 'oiText',
            attrs: {
              x: priceAxisX - maxBarLength - 30,
              y: coord.y,
              text: `${price}`
            },
            styles: {
              color: '#666',
              size: 10,
              family: 'Arial'
            }
          });

          return figures;
        }
      });

      registeredRef.current = true;
    }

    // 5. Initialize chart
    const chart = init(ref.current);

    // 6. Generate synthetic candle data
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

    // 7. Set candle data
    chart.applyNewData(candles);

    // 8. Add OI overlays for each strike
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

    // 9. Create overlays for each strike
    strikeOIData.forEach((strike, index) => {
      chart.createOverlay({
        name: 'oiOverlay',
        points: [{
          timestamp: Date.now(),
          value: strike.price
        }],
        extendData: {
          price: strike.price,
          ce: strike.ce,
          pe: strike.pe
        }
      });
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
