import test from 'node:test';
import assert from 'node:assert/strict';
import {GRID_COLS,selectButtonRect,tileRect,moveSelection} from '../selection-grid-v7.js';
test('20 tiles form a bounded 5-by-4 character selection grid with no overlap',()=>{
  assert.equal(GRID_COLS,5);
  const tiles=Array.from({length:20},(_,i)=>tileRect(i,20));
  for(const a of tiles){
    assert.ok(a.x>=0&&a.y>=0&&a.x+a.w<=570&&a.y+a.h<=540);
    for(const b of tiles){if(a===b)continue;
      assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y);
    }
  }
  assert.ok(selectButtonRect.x>560&&selectButtonRect.x+selectButtonRect.w<=960);
  assert.ok(selectButtonRect.y+selectButtonRect.h<=540);
});
test('directional moves navigate rows and wrap without skipping playable fighters',()=>{
  assert.equal(moveSelection(0,'ArrowRight',20),1);
  assert.equal(moveSelection(0,'ArrowLeft',20),19);
  assert.equal(moveSelection(2,'ArrowDown',20),7);
  assert.equal(moveSelection(7,'ArrowUp',20),2);
  assert.equal(moveSelection(18,'ArrowDown',20),3);
  assert.equal(moveSelection(3,'KeyW',20),18);
  assert.equal(moveSelection(8,'Enter',20),8);
});
