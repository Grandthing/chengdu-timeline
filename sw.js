// แก้ไฟล์ใดก็ตาม: เพิ่มเลขเวอร์ชันตรงนี้ และใน trip-data.js (window.SITE_VERSION) ให้ตรงกัน
const C='chengdu-words-v15';
const FILES=['./','index.html','words.html','full.html','help.html','docs.html','trip-data.js','trip-detail.js','words-data.js','pinyin-data.js','trip.ics','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
// เปิดจากเครื่องทันที (ไม่รอเน็ต ซึ่งในจีนอาจค้างนาน) แล้วค่อยโหลดของใหม่เก็บไว้เบื้องหลัง
self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==location.origin)return;
  const key=url.origin+url.pathname;
  e.respondWith(caches.open(C).then(async c=>{
    const hit=await c.match(key);
    const net=fetch(req).then(r=>{if(r&&r.ok)c.put(key,r.clone());return r}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}
    return (await net)||(await c.match(url.origin+url.pathname.replace(/[^/]*$/,'')+'index.html'))||Response.error();
  }));
});
