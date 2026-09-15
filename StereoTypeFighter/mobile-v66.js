const root=document.documentElement,match=document.getElementById('matchScreen'),touch=document.getElementById('touchControls'),start=document.getElementById('startButton');
const coarse=matchMedia('(pointer:coarse),(hover:none)');
function viewport(){const v=visualViewport;root.style.setProperty('--app-vh',`${v?.height||innerHeight}px`);root.style.setProperty('--app-vw',`${v?.width||innerWidth}px`)}
function syncMobile(){document.body.classList.toggle('touchDevice',coarse.matches);document.body.classList.toggle('mobileMatch',coarse.matches&&match?.classList.contains('active'));viewport()}
viewport();addEventListener('resize',viewport,{passive:true});addEventListener('orientationchange',()=>setTimeout(viewport,80),{passive:true});visualViewport?.addEventListener('resize',viewport,{passive:true});coarse.addEventListener?.('change',syncMobile);
new MutationObserver(syncMobile).observe(match,{attributes:true,attributeFilter:['class']});syncMobile();
for(const el of document.querySelectorAll('#touchControls button')){el.setAttribute('draggable','false');el.addEventListener('contextmenu',e=>e.preventDefault());el.addEventListener('pointerdown',()=>{try{navigator.vibrate?.(8)}catch{}},{passive:true})}
for(const el of [document.getElementById('gameWrap'),touch]){el?.addEventListener('touchmove',e=>{if(e.touches.length>1)e.preventDefault()},{passive:false});el?.addEventListener('gesturestart',e=>e.preventDefault(),{passive:false})}
document.addEventListener('contextmenu',e=>{if(e.target.closest?.('#gameWrap,#touchControls'))e.preventDefault()});
let lastTouch=0;touch?.addEventListener('touchend',e=>{const now=Date.now();if(now-lastTouch<280)e.preventDefault();lastTouch=now},{passive:false});
// Keep the existing retry path usable: app-v66 changes the Fight button into a retry CTA after an asset failure.
new MutationObserver(()=>{if(start?.textContent?.startsWith('Retry Fighter Asset'))start.disabled=false}).observe(start,{attributes:true,childList:true,subtree:true});
// iOS standalone mode benefits from preventing the page itself from rubber-banding while fighting.
document.addEventListener('touchmove',e=>{if(document.body.classList.contains('mobileMatch')&&e.target.closest?.('#gameWrap,#touchControls'))e.preventDefault()},{passive:false});
