// สร้าง pinyin-data.js (window.PY = {คำจีน: pinyin}) จากคำจีนทุกคำในเว็บ
// ต้องมี pinyin-pro (ใช้ตอนสร้างไฟล์เท่านั้น เว็บไม่ได้โหลด library นี้):
//   npm i --no-save pinyin-pro@3.26.0 && node tools/make-pinyin.js
// รันใหม่ทุกครั้งที่เพิ่ม/แก้คำจีนใน words-data.js, trip-data.js หรือ help.html
const fs=require('fs'),path=require('path'),vm=require('vm');
const {pinyin,customPinyin}=require(process.env.PINYIN_PRO||'pinyin-pro');
// คำที่ library อ่านผิด (ตรวจด้วยคนแล้ว)
customPinyin({'藏餐吧':'zàng cān bā','毛肚':'máo dǔ','担担面':'dàn dàn miàn','饺子':'jiǎo zi','肚子':'dù zi'});
const root=path.join(__dirname,'..');
const load=f=>{const c={window:{}};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);return c.window};
const set=new Set();
load('words-data.js').WORDS.forEach(([, ,rows])=>rows.forEach(([,zh])=>set.add(zh)));
load('trip-data.js').TRIP.forEach(d=>d.items.forEach(it=>(it.zh||[]).forEach(([,zh])=>set.add(zh))));
const help=fs.readFileSync(path.join(root,'help.html'),'utf8');
for(const m of help.matchAll(/data-zh="[^"|]*\|([^"]+)"/g))set.add(m[1]);
for(const m of help.matchAll(/\['[^']*','([^']+)'\]/g))set.add(m[1]);
// อ่านผิดจาก library → แก้ตรงนี้ (คำทั้งวลี: pinyin ที่ถูก)
const FIX={
  '自提':'zì tí',
};
const P={'，':',','。':'.','？':'?','！':'!','：':':','、':',','（':'(','）':')','·':'·'};
function py(s){
  if(FIX[s])return FIX[s];
  let t=pinyin(s,{nonZh:'consecutive',toneSandhi:true});
  t=t.replace(/[，。？！：、（）]/g,c=>P[c]);
  t=t.replace(/\s+([,.?!:)])/g,'$1').replace(/([,.?!:])(?=[^\s,.?!:)])/g,'$1 ').replace(/\(\s+/g,'(').replace(/\s{2,}/g,' ').trim();
  return t;
}
const out={};[...set].sort().forEach(s=>{if(/[一-鿿]/.test(s))out[s]=py(s)});
fs.writeFileSync(path.join(root,'pinyin-data.js'),'// สร้างอัตโนมัติด้วย node tools/make-pinyin.js ห้ามแก้มือ (แก้คำอ่านที่ FIX ในไฟล์นั้น)\nwindow.PY='+JSON.stringify(out,null,0).replace(/","/g,'",\n"')+';\n');
console.log('pinyin entries:',Object.keys(out).length);
