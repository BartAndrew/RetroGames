// Shared, testable selection geometry for 20-player roster.
// All rectangles fit the 960x540 logical canvas (4 rows x 5 columns).
export const GRID_COLS = 5;
export const selectButtonRect = Object.freeze({x:611,y:474,w:300,h:40});
export function tileRect(index,count=20) {
  if (!Number.isInteger(index) || index < 0 || index >= count || count < 1)
    throw new RangeError('Invalid fighter index');
  const col = index % GRID_COLS, row = Math.floor(index / GRID_COLS);
  const x = 22 + col * 110, y = 108 + row * 96, w = 106, h = 88;
  return {x,y,w,h,cx:x+w/2};
}
export function moveSelection(index,key,count=20) {
  if (!Number.isInteger(index)||index<0||index>=count)throw new RangeError('Invalid selection');
  const byKey = {'ArrowLeft':-1,'KeyA':-1,'ArrowRight':1,'KeyD':1,
    'ArrowUp':-GRID_COLS,'KeyW':-GRID_COLS,
    'ArrowDown':GRID_COLS,'KeyS':GRID_COLS};
  const delta=byKey[key]??0;
  return (index + delta % count + count) % count;
}
