'use client';
import React, { useEffect, useRef } from 'react';
import { init, dispose } from 'klinecharts';

/**
 * KLineCharts v10 alpha5 — OI overlay with horizontal ray bars like Sensibull
 * CE = green bars, PE = red bars, with changes in lighter colors
 */
export default function OIChartAlpha5() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Initialize chart
    const chart = init(ref.current);

    // Generate synthetic candle data
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

    // Set candle data
    chart.applyNewData(candles);

    // OI data with changes (like Sensibull)
    const oiData = [
      { price: 24000, ce: 1500, pe: 2200, ceChange: 150, peChange: -200 },
      { price: 24200, ce: 2800, pe: 1900, ceChange: -280, peChange: 190 },
      { price: 24400, ce: 3200, pe: 1600, ceChange: 320, peChange: -160 },
      { price: 24600, ce: 2900, pe: 1800, ceChange: -145, peChange: 180 },
      { price: 24800, ce: 2100, pe: 2500, ceChange: 210, peChange: -250 },
      { price: 25000, ce: 4500, pe: 4200, ceChange: -450, peChange: 420 }, // ATM strike
      { price: 25200, ce: 2600, pe: 2900, ceChange: 260, peChange: -290 },
      { price: 25400, ce: 1800, pe: 3100, ceChange: -180, peChange: 310 },
      { price: 25600, ce: 1400, pe: 3500, ceChange: 140, peChange: -350 },
      { price: 25800, ce: 1100, pe: 3800, ceChange: -110, peChange: 380 },
      { price: 26000, ce: 900, pe: 4100, ceChange: 90, peChange: -410 },
    ];

    // Create custom indicator for horizontal ray overlay
    chart.createIndicator({
      name: 'oi-overlay',
      calc: () => [],
      draw: ({ ctx, yAxis, xAxis, bounding }) => {
        const chartWidth = bounding.width;
        const rightX = bounding.width - 60; // leave space for price axis

        // Calculate scale based on max values
        const maxVal = Math.max(
          ...oiData.flatMap(d => [
            Math.abs(d.ce), 
            Math.abs(d.pe), 
            Math.abs(d.ceChange), 
            Math.abs(d.peChange)
          ])
        );
        const scale = (chartWidth * 0.15) / maxVal; // 15% chart width max

        ctx.save();
        ctx.font = '10px Arial';

        oiData.forEach(d => {
          const y = yAxis.convertToPixel(d.price);

          // Strike price line (dashed)
          ctx.strokeStyle = 'rgba(150, 150, 150, 0.3)';
          ctx.setLineDash([3, 3]);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(50, y);
          ctx.lineTo(rightX + 50, y);
          ctx.stroke();
          ctx.setLineDash([]);

          // CE bar (green) - main value
          const ceLength = d.ce * scale;
          ctx.fillStyle = '#00b050';
          ctx.fillRect(rightX - ceLength, y - 8, ceLength, 4);

          // PE bar (red) - main value  
          const peLength = d.pe * scale;
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(rightX - peLength, y - 3, peLength, 4);

          // CE Change bar (lighter green/yellow)
          const ceChangeLength = Math.abs(d.ceChange) * scale;
          ctx.fillStyle = d.ceChange >= 0 ? '#92d050' : '#ffc000';
          ctx.fillRect(rightX - ceChangeLength, y + 2, ceChangeLength, 3);

          // PE Change bar (lighter red/orange)
          const peChangeLength = Math.abs(d.peChange) * scale;
          ctx.fillStyle = d.peChange >= 0 ? '#ff9999' : '#ff6600';
          ctx.fillRect(rightX - peChangeLength, y + 6, peChangeLength, 3);

          // Strike price label
          ctx.fillStyle = '#666';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${d.price}`, 45, y);

          // CE value text
          ctx.fillStyle = '#00b050';
          ctx.textAlign = 'left';
          ctx.fillText(`CE:${d.ce}`, rightX + 5, y - 6);

          // PE value text
          ctx.fillStyle = '#ff0000';
          ctx.fillText(`PE:${d.pe}`, rightX + 5, y + 2);

          // CE change text
          ctx.fillStyle = d.ceChange >= 0 ? '#92d050' : '#ffc000';
          ctx.fillText(`${d.ceChange > 0 ? '+' : ''}${d.ceChange}`, rightX + 60, y - 6);

          // PE change text
          ctx.fillStyle = d.peChange >= 0 ? '#ff9999' : '#ff6600';
          ctx.fillText(`${d.peChange > 0 ? '+' : ''}${d.peChange}`, rightX + 60, y + 2);
        });

        ctx.restore();
      }
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