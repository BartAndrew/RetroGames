/* Ashen Realms 2 — story script for the in-game cutscenes.
 * Tokens: {hero} = the champion you picked, {ally} / {ally2} / {ally3} = the other three champions
 * (the fallen Dawn Order), KING VAEL = the Cinder King. Edit freely; see reference/STORY.md for the bible.
 * Shot fields: bg (stage art 0-2), cam [from,to] pan in world px, zoom [from,to], len (camera seconds),
 * grade, fx, card {big,small}, flash, chars [{who,x,y,scale,face,anim,p,ghost,dim}], speaker, text.
 */
window.ASHEN_STORY={scenes:{
 prologue:[
  {bg:0,cam:[0,420],zoom:[1.04,1.14],len:9,grade:'ember',fx:'embers',card:{big:'CROWN OF CINDERS',small:'A TALE OF THE ASHEN REALMS'},chars:[],text:''},
  {bg:0,cam:[420,160],zoom:[1.1,1.04],len:9,grade:'ember',fx:'embers',chars:[],speaker:'',text:'For a thousand years the Ember Crown burned above the Dawn Order\'s keep, and the ash-storms stayed beyond the mountains.'},
  {bg:0,cam:[300,380],zoom:[1.2,1.3],len:9,grade:'ash',fx:'ash',chars:[{who:'ally',x:330,y:452,scale:1.19,anim:'death',p:1,dim:1},{who:'ally2',x:610,y:452,scale:1.19,anim:'death',p:1,dim:1,face:-1},{who:'ally3',x:870,y:452,scale:1.19,anim:'death',p:1,dim:1}],text:'Then King Vael raised it to his own brow. The flame took him, and he took the realm. The Order\'s champions rode out to end him. Three never rode back.'},
  {bg:0,cam:[60,260],zoom:[1.1,1.1],len:10,grade:'ember',fx:'embers',chars:[{who:'hero',x:[160,520],y:474,scale:1.31,anim:'walk'}],speaker:'',text:'{hero} alone walked out of the Burning March. The crown still burns. So does the oath.'}
 ],
 stage1:[
  {bg:1,cam:[0,500],zoom:[1.05,1.15],len:9,grade:'cold',fx:'motes',card:{big:'THE FORGOTTEN WOODS',small:'THE OLD GODS ARE WATCHING'},chars:[],text:''},
  {bg:1,cam:[400,520],zoom:[1.15,1.25],len:8,grade:'cold',fx:'motes',chars:[{who:'hero',x:420,y:474,scale:1.39},{who:'ally',x:760,y:474,scale:1.39,face:-1,ghost:1}],speaker:'{ally}',text:'You walk where we fell, {hero}. Vael\'s warband hunts by the smell of smoke. Keep to the old roots.'},
  {bg:1,cam:[520,520],zoom:[1.25,1.38],len:8,grade:'cold',fx:'motes',chars:[{who:'hero',x:520,y:474,scale:1.72}],speaker:'{hero}',text:'Then rest, old friend. I will finish what we began.'}
 ],
 stage2:[
  {bg:2,cam:[900,0],zoom:[1.05,1.12],len:10,grade:'dusk',fx:'embers',card:{big:'THE CINDER THRONE',small:'THE FINAL RECKONING'},chars:[],text:''},
  {bg:2,cam:[0,300],zoom:[1.12,1.2],len:9,grade:'dusk',fx:'embers',chars:[],speaker:'',text:'The Cinder Throne rose from the ash plain, a keep of black glass lit from within by the crown.'},
  {bg:2,cam:[300,360],zoom:[1.2,1.32],len:9,grade:'dusk',fx:'motes',chars:[{who:'hero',x:520,y:474,scale:1.48},{who:'ally2',x:300,y:474,scale:1.39,ghost:1},{who:'ally3',x:790,y:474,scale:1.39,face:-1,ghost:1}],speaker:'{ally2}',text:'The crown feeds on every flame it touches. Break the king, and it breaks with him.'},
  {bg:2,cam:[360,360],zoom:[1.32,1.45],len:8,grade:'dusk',fx:'embers',chars:[{who:'hero',x:560,y:474,scale:1.80}],speaker:'{hero}',text:'Then let it burn out here.'}
 ],
 boss:[
  {bg:2,cam:[1150,1250],zoom:[1.15,1.3],len:9,grade:'inferno',fx:'embers',flash:0,chars:[{who:'hero',x:260,y:474,scale:1.31},{who:'king',x:780,y:482,scale:4.1,face:-1}],speaker:'KING VAEL',text:'Another candle come to my hall. How many has the Order sent? I stopped counting.'},
  {bg:2,cam:[1250,1250],zoom:[1.3,1.42],len:7,grade:'inferno',fx:'embers',chars:[{who:'hero',x:300,y:474,scale:1.72}],speaker:'{hero}',text:'The last one.'},
  {bg:2,cam:[1250,1250],zoom:[1.15,1.32],len:7,grade:'inferno',fx:'embers',flash:1,chars:[{who:'hero',x:260,y:474,scale:1.31},{who:'king',x:780,y:482,scale:4.3,face:-1}],speaker:'KING VAEL',text:'Then kneel, and be the last I burn.'}
 ],
 ending:[
  {bg:2,cam:[1348,1100],zoom:[1.1,1.2],len:9,grade:'dusk',fx:'ash',chars:[],speaker:'',text:'The crown\'s fire guttered, flared once, and went out.'},
  {bg:0,cam:[200,0],zoom:[1.12,1.04],len:10,grade:'dawn',fx:'dawn',chars:[{who:'hero',x:560,y:474,scale:1.48},{who:'ally',x:380,y:474,scale:1.35,ghost:1},{who:'ally2',x:760,y:474,scale:1.35,ghost:1,face:-1},{who:'ally3',x:900,y:474,scale:1.35,ghost:1,face:-1}],speaker:'{ally}',text:'It is done. The storms will ebb. You carried the Order further than any of us.'},
  {bg:0,cam:[0,300],zoom:[1.08,1.02],len:12,grade:'dawn',fx:'dawn',card:{big:'THE END',small:'THE REALM REMEMBERS ITS CHAMPIONS'},chars:[{who:'hero',x:[300,640],y:474,scale:1.31,anim:'walk'}],speaker:'',text:'Dawn crossed the Burning March for the first time in three winters. {hero}, last light of the Ashen Realms, walked home beneath it.'}
 ],
 fallen:[
  {bg:-1,cam:[500,600],zoom:[1.2,1.3],len:9,grade:'ash',fx:'ash',chars:[{who:'hero',x:560,y:474,scale:1.56,anim:'death',p:1,dim:1}],speaker:'',text:'The ash settles over {hero}. But the Order\'s oath does not die with its champions. Another will rise.'}
 ]
}};
