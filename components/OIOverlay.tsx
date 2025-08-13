// OIOverlay.ts
import { registerFigure, registerOverlay } from 'klinecharts';

let registered = false;

export function registerOIOverlay() {
  if (registered) return;
  registered = true;

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

      const BAR_H = 6;
      const GAP = 2;
      const maxBarWidth = 80;
      const RIGHT_PADDING = 5;
      const rightEdge = bounding.width - RIGHT_PADDING;

      const maxVal = Math.max(Math.abs(ce), Math.abs(pe), Math.abs(changeInCE), Math.abs(changeInPE), 1);

      const ceW = (Math.abs(ce) / maxVal) * maxBarWidth;
      const peW = (Math.abs(pe) / maxVal) * maxBarWidth;
      const chCeW = (Math.abs(changeInCE) / maxVal) * (maxBarWidth * 0.6);
      const chPeW = (Math.abs(changeInPE) / maxVal) * (maxBarWidth * 0.6);

      const totalHeight = BAR_H * 4 + GAP * 3;
      const topY = centerY - totalHeight / 2;

      const ceY = topY;
      if (ceW > 0) {
        figures.push({
          type: 'oiBar',
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

      figures.push({
        type: 'strikeLine',
        attrs: {
          x1: 0,
          y: centerY,
          x2: bounding.width
        },
        styles: { color: 'rgba(120,120,120,0.1)', width: 0.5, dash: [2, 2] }
      });

      figures.push({
        type: 'oiText',
        attrs: {
          x: 5,
          y: centerY,
          text: ``
        },
        styles: { color: '#888', size: 10 }
      });

      return figures;
    }
  });
}
