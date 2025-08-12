
'use client';
import React, { useEffect, useRef } from 'react';
import { init, dispose } from 'klinecharts';

interface CandlestickChartProps {
  data?: Array<{
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  onChartReady?: (chart: any) => void;
  style?: React.CSSProperties;
}

export default function CandlestickChart({ data, onChartReady, style }: CandlestickChartProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Initialize chart
    chartRef.current = init(ref.current);

    // Apply data if provided
    if (data && data.length > 0) {
      chartRef.current.applyNewData(data);
    } else {
      // Generate synthetic candle data as fallback
      const candles = Array.from({ length: 50 }, (_, i) => {
        const base = 24000 + (i / 49) * 2000;
        const open = +(base + (Math.random() - 0.5) * 100).toFixed(2);
        const close = +(open + (Math.random() - 0.5) * 100).toFixed(2);
        const high = +Math.max(open, close) + +(Math.random() * 50).toFixed(2);
        const low = +Math.min(open, close) - +(Math.random() * 50).toFixed(2);
        const ts = Date.now() + i * 60 * 1000;
        return { timestamp: ts, open, high, low, close, volume: Math.round(Math.random() * 1000) };
      });
      chartRef.current.applyNewData(candles);
    }

    // Notify parent component that chart is ready
    if (onChartReady) {
      onChartReady(chartRef.current);
    }

    // cleanup
    return () => {
      try {
        dispose(ref.current as any);
      } catch (e) {}
    };
  }, [data, onChartReady]);

  return (
    <div 
      ref={ref} 
      style={{ 
        width: '100%', 
        height: 680, 
        ...style 
      }} 
    />
  );
}
