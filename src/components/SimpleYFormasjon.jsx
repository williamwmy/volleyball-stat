// components/SimpleYFormasjon.jsx
import React, { useRef, useState, useEffect } from "react";
import DragOverlay from "./DragOverlay";

const dragScoreMap = { up: 3, right: 2, down: 1, left: 0 };

export default function SimpleYFormasjon({ onScore, knappFarge, navnFarge }) {
  const [dragState, setDragState] = useState(null);
  const btnRefs = {
    serve: useRef(null),
    pass: useRef(null),
    attack: useRef(null),
  };

  function handleStart(e, kategori) {
    const evt = e.touches ? e.touches[0] : e;
    const rect = btnRefs[kategori].current.getBoundingClientRect();
    setDragState({
      kategori,
      start: { x: evt.clientX, y: evt.clientY },
      parentRect: rect,
      dragPos: null
    });
  }

  function handleMove(e) {
    if (!dragState) return;
    const evt = e.touches ? e.touches[0] : e;
    setDragState(ds => ds && { ...ds, dragPos: { x: evt.clientX, y: evt.clientY } });
  }

  function handleEnd(e) {
    if (!dragState) return;
    const evt = e.changedTouches ? e.changedTouches[0] : e;
    const dir = DragOverlay.getDirection(dragState.start, { x: evt.clientX, y: evt.clientY });
    if (dir && dragScoreMap.hasOwnProperty(dir) && dragState.kategori) {
      onScore(dragState.kategori, dragScoreMap[dir]);
    }
    setDragState(null);
  }

  function handleCancel() {
    setDragState(null);
  }

  useEffect(() => {
    if (dragState) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
      window.addEventListener('touchcancel', handleCancel);
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
        window.removeEventListener('touchcancel', handleCancel);
      };
    }
  });

  return (
    <div className="simple-y">
      <button
        className="simple-y-btn top"
        ref={btnRefs.serve}
        onMouseDown={e => handleStart(e, 'serve')}
        onTouchStart={e => handleStart(e, 'serve')}
        style={{
          background: knappFarge,
          color: '#194e62',
          borderColor: '#ffe066',
        }}
      >
        Serve
      </button>
      <div className="simple-y-bottom">
        <button
          className="simple-y-btn left"
          ref={btnRefs.pass}
          onMouseDown={e => handleStart(e, 'pass')}
          onTouchStart={e => handleStart(e, 'pass')}
          style={{
            background: knappFarge,
            color: '#194e62',
            borderColor: '#ffe066',
          }}
        >
          Pass
        </button>
        <button
          className="simple-y-btn right"
          ref={btnRefs.attack}
          onMouseDown={e => handleStart(e, 'attack')}
          onTouchStart={e => handleStart(e, 'attack')}
          style={{
            background: knappFarge,
            color: '#194e62',
            borderColor: '#ffe066',
          }}
        >
          Attack
        </button>
      </div>
      <DragOverlay
        visible={!!dragState}
        start={dragState?.start}
        parentRect={dragState?.parentRect}
        kategori={dragState?.kategori}
        dragPos={dragState?.dragPos}
        knappFarge={knappFarge}
        navnFarge={navnFarge}
      />
    </div>
  );
}
