// สร้าง trip.ics จาก trip-data.js (รันใหม่ทุกครั้งที่แก้แผน): node tools/make-ics.js
// ใส่เฉพาะรายการสำคัญ: รถไฟ/เครื่องบิน (🚄 ✈️) รายการที่มี alert และรายการ "ตื่น"
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..');
const ctx={window:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'trip-data.js'),'utf8'),ctx);
const TRIP=ctx.window.TRIP;
const at=(d,t)=>new Date(d+'T'+t+':00+08:00');
const z=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
const esc=s=>String(s).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');
// พับบรรทัดที่ 75 ไบต์ (UTF-8) โดยไม่ตัดกลางตัวอักษร
function fold(line){
  const out=[];let cur='',len=0;
  for(const ch of line){const b=Buffer.byteLength(ch);if(len+b>(out.length?74:75)){out.push(cur);cur='';len=0}cur+=ch;len+=b}
  out.push(cur);return out.join('\r\n ');
}
const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//chengdu-timeline//TH','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:ทริปเฉิงตู 13–19 พ.ย.','X-WR-TIMEZONE:Asia/Shanghai'];
const stamp=z(new Date());
const alarm=(min,txt)=>['BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+esc(txt),'TRIGGER:'+(min?'-PT'+min+'M':'PT0M'),'END:VALARM'];
let n=0;
TRIP.forEach(day=>day.items.forEach((it,i)=>{
  const fixed=/🚄|✈️/.test(it.title), wake=/^ตื่น/.test(it.title);
  if(!fixed&&!it.alert&&!wake)return;
  const s=at(day.date,it.t), nx=day.items[i+1];
  const e=it.end?at(day.date,it.end):(nx?at(day.date,nx.t):new Date(+s+3600e3));
  const desc=[it.alert?'⚠️ '+it.alert:'',it.how||''].filter(Boolean).join('\n');
  const title=(it.alert&&!fixed?'⚠️ ':'')+it.title;
  L.push('BEGIN:VEVENT','UID:'+day.date+'-'+it.t.replace(':','')+'@chengdu-timeline','DTSTAMP:'+stamp,'DTSTART:'+z(s),'DTEND:'+z(e<=s?new Date(+s+1800e3):e),'SUMMARY:'+esc(title),'DESCRIPTION:'+esc(desc));
  if(fixed)L.push(...alarm(60,'อีก 1 ชม.: '+it.title),...alarm(20,'อีก 20 นาที: '+it.title));
  else if(wake)L.push(...alarm(0,it.title));
  else L.push(...alarm(15,'อีก 15 นาที: '+it.title),...alarm(0,it.title));
  L.push('END:VEVENT');n++;
}));
L.push('END:VCALENDAR');
fs.writeFileSync(path.join(root,'trip.ics'),L.map(fold).join('\r\n')+'\r\n');
console.log('trip.ics: '+n+' events');
