// components/DragOverlay.jsx
import React from "react";

const dragDirections = [
  { key: 'up', dx: 0, dy: -62, label: 3 },
  { key: 'right', dx: 62, dy: 0, label: 2 },
  { key: 'down', dx: 0, dy: 62, label: 1 },
  { key: 'left', dx: -62, dy: 0, label: 0 },
];

function getDirection(start, end) {
  if (!start || !end) return null;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 30) return 'right';
    if (dx < -30) return 'left';
  } else {
    if (dy > 30) return 'down';
    if (dy < -30) return 'up';
  }
  return null;
}

export default function DragOverlay({ visible, start, parentRect, kategori, dragPos, knappFarge, navnFarge }) {
  if (!visible || !start) return null;
  const svgSize = 240;
  const center = svgSize / 2;

  const top = (parentRect?.top ?? 0) + (parentRect?.height ?? 0) / 2 - center;
  const left = (parentRect?.left ?? 0) + (parentRect?.width ?? 0) / 2 - center;

  let highlight = null;
  if (dragPos && start) {
    highlight = getDirection(start, dragPos);
  }

  let handlingNavn = '';
  if (kategori === 'serve') handlingNavn = 'Serve';
  else if (kategori === 'pass') handlingNavn = 'Pass';
  else if (kategori === 'attack') handlingNavn = 'Attack';

  return (
    <div className="drag-overlay" style={{ top, left, width: svgSize, height: svgSize }}>
      <svg width={svgSize} height={svgSize} style={{ pointerEvents: 'none' }}>
        <g className="drag-anim">
          {dragDirections.map((dir) => (
            <g key={dir.key}>
              <line
                x1={center}
                y1={center}
                x2={center + dir.dx}
                y2={center + dir.dy}
                stroke={highlight === dir.key ? navnFarge : "#246c8e"}
                strokeWidth={highlight === dir.key ? 9 : 6}
                strokeLinecap="round"
                opacity={highlight === dir.key ? 1 : 0.8}
                style={{ transition: 'all 0.18s' }}
              />
              <circle
                cx={center + dir.dx}
                cy={center + dir.dy}
                r="24"
                fill={highlight === dir.key ? knappFarge : "#ffe066"}
                stroke={highlight === dir.key ? navnFarge : "#246c8e"}
                strokeWidth={highlight === dir.key ? 6 : 4}
                opacity="1"
                style={{ transition: 'all 0.18s' }}
              />
              <text
                x={center + dir.dx}
                y={center + dir.dy + 8}
                textAnchor="middle"
                fontSize="2rem"
                fontWeight="bold"
                fill="#246c8e"
              >
                {dir.label}
              </text>
            </g>
          ))}
          <text
            x={center}
            y={center + 10}
            textAnchor="middle"
            fontSize="1.35rem"
            fontWeight="bold"
            fill={navnFarge}
            opacity="0.88"
            style={{ letterSpacing: "0.08em", textShadow: "0 2px 6px #fff7" }}
          >
            {handlingNavn}
          </text>
        </g>
      </svg>
    </div>
  );
}
