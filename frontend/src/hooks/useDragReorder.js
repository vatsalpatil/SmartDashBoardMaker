import { useRef, useCallback, useState } from 'react';

/**
 * Generic hook for HTML5 drag-and-drop reordering of list items.
 * 
 * Usage:
 *   const { dragIndex, overIndex, handleDragStart, handleDragOver, handleDragEnd, handleDrop } = useDragReorder(items, setItems);
 *
 *   On each row container:
 *     draggable
 *     onDragStart={(e) => handleDragStart(e, index)}
 *     onDragOver={(e) => handleDragOver(e, index)}
 *     onDragEnd={handleDragEnd}
 *     onDrop={(e) => handleDrop(e)}
 */
export default function useDragReorder(items, setItems) {
  const dragIdx = useRef(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const handleDragStart = useCallback((e, index) => {
    dragIdx.current = index;
    setDragIndex(index);
    // Create a minimal drag image so it doesn't look jarring
    e.dataTransfer.effectAllowed = 'move';
    // Use a transparent pixel so the default ghost doesn't show a big block
    const ghost = document.createElement('div');
    ghost.style.cssText = 'position:absolute;top:-9999px;width:200px;height:28px;background:var(--bg-card,#1e1e2e);border:1px solid var(--accent,#6366f1);border-radius:6px;opacity:0.85;display:flex;align-items:center;padding:0 10px;font-size:12px;color:#a5b4fc;';
    ghost.textContent = `Moving row ${index + 1}`;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 100, 14);
    setTimeout(() => document.body.removeChild(ghost), 0);
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIndex(index);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const from = dragIdx.current;
    const to = overIndex;
    if (from !== null && to !== null && from !== to) {
      setItems(prev => {
        const arr = Array.isArray(prev) ? [...prev] : [];
        const [moved] = arr.splice(from, 1);
        arr.splice(to, 0, moved);
        return arr;
      });
    }
    dragIdx.current = null;
    setDragIndex(null);
    setOverIndex(null);
  }, [overIndex, setItems]);

  const handleDragEnd = useCallback(() => {
    dragIdx.current = null;
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  return {
    dragIndex,
    overIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
  };
}
