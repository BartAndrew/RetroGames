(async () => {
  const paths = [
    './assets/dave-game-00.txt',
    './assets/dave-game-01.txt',
    './assets/dave-game-02.txt',
    './assets/dave-game-03.txt',
    './assets/dave-game-04.txt'
  ];
  const parts = [];
  for (const path of paths) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
    parts.push((await response.text()).trim());
  }
  (0, eval)(atob(parts.join('')));
})().catch(error => {
  console.error(error);
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas && canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#11131d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '18px monospace';
    ctx.fillText('Stereotype Fighters failed to load.', 30, 50);
  }
});
