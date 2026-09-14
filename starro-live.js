/*
 * StarRo shared live-report module.
 * Network features are optional: simulator pages remain usable when Firebase/counter is offline.
 */
let currentUser = null;
let displayName = localStorage.getItem("starro_display_name") || "";
let firestoreApi = null;

function esc(s){
  return String(s ?? "").replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}
function updateNameUI(){
  const e=document.getElementById("fbNameLabel");
  if(e)e.textContent=displayName || "設定暱稱";
}
function askName(force=false){
  if(!force && displayName) return displayName;
  let n=prompt("請輸入你在全服戰報顯示的暱稱：",displayName||"");
  if(n!==null){
    n=n.trim().slice(0,20);
    if(n){displayName=n;localStorage.setItem("starro_display_name",n);}
  }
  updateNameUI();
  return displayName;
}
window.changeStarroName=()=>askName(true);

// Safe no-op first. It is upgraded after Firebase connects.
window.starroBroadcast=async()=>{};

function setStatus(text){const e=document.getElementById("fbStatus");if(e)e.textContent=text;}
function starroFeedText(v){return String(v??"").replaceAll("賽高🎉","最頂").replaceAll("賽高","最頂");}
function starroFeedHtml(v){
  const safe=esc(starroFeedText(v));
  return safe
    .replaceAll("頂級（0.36%）",'<span class="tier-top-red">頂級（0.36%）</span>')
    .replaceAll("頂級 0.36%",'<span class="tier-top-red">頂級 0.36%</span>')
    .replaceAll("頂級（0.36％）",'<span class="tier-top-red">頂級（0.36％）</span>');
}
function renderFeed(rows){
  const ticker=document.getElementById("jackpotTicker"),feed=document.getElementById("jackpotFeed");
  if(!ticker||!feed)return;
  if(!rows.length){ticker.textContent="尚無大獎紀錄";feed.innerHTML="";return;}
  const top=rows[0];
  ticker.innerHTML=`🔥 ${esc(top.name)}｜${starroFeedHtml(top.type)}｜${starroFeedHtml(top.result)}`;
  feed.innerHTML=rows.map(x=>{
    let time="";
    if(x.createdAt?.toDate)time=x.createdAt.toDate().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"});
    return `<div class="stat" style="margin-top:6px;padding:8px 10px"><div><b>${esc(x.name)}</b>｜${starroFeedHtml(x.type)}｜<b>${starroFeedHtml(x.result)}</b></div><div class="tiny">${time}${x.detail?`｜${starroFeedHtml(x.detail)}`:""}</div></div>`;
  }).join("");
}
function taipeiDateKey(){
  return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Taipei",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
}
async function registerDailyPageView(){
  const el=document.getElementById("dailyPageViewCount");
  if(!el)return;
  if(!navigator.onLine){el.textContent="👁 今日瀏覽：離線";return;}
  try{
    const key=`pageviews-${taipeiDateKey()}`;
    const url=`https://abacus.jasoncameron.dev/hit/${encodeURIComponent("starro-simulator-v777")}/${encodeURIComponent(key)}`;
    const response=await fetch(url,{cache:"no-store"});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const data=await response.json(),value=Number(data?.value??0);
    if(!Number.isFinite(value))throw new Error("invalid counter response");
    el.textContent=`👁 今日瀏覽：${value.toLocaleString()} 次`;
  }catch(err){console.warn("每日 Page View 統計不可用，不影響模擬器",err);el.textContent="👁 今日瀏覽：暫時無法讀取";}
}

async function initLive(){
  updateNameUI();
  registerDailyPageView();
  if(!navigator.onLine){setStatus("⚪ 離線模式");return;}
  try{
    const [appMod,authMod,fsMod]=await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js")
    ]);
    const firebaseConfig={
      apiKey:"AIzaSyDSHPDv4u7-mMhbuUzzMSDGxljAWTNLJys",
      authDomain:"starro-16e01.firebaseapp.com",
      projectId:"starro-16e01",
      storageBucket:"starro-16e01.firebasestorage.app",
      messagingSenderId:"900308579725",
      appId:"1:900308579725:web:0df09367c95ac826b779c4",
      measurementId:"G-ZTM1PL8L8B"
    };
    const app=appMod.initializeApp(firebaseConfig),auth=authMod.getAuth(app),db=fsMod.getFirestore(app);
    firestoreApi={db,collection:fsMod.collection,addDoc:fsMod.addDoc,serverTimestamp:fsMod.serverTimestamp};
    window.starroBroadcast=async(type,result,detail="")=>{
      try{
        if(!currentUser)return;
        if(!displayName&&!askName())return;
        await firestoreApi.addDoc(firestoreApi.collection(db,"jackpots"),{
          uid:currentUser.uid,name:displayName,type:String(type).slice(0,40),result:String(result).slice(0,80),detail:String(detail).slice(0,160),createdAt:firestoreApi.serverTimestamp()
        });
      }catch(err){console.warn("戰報送出失敗，不影響模擬器",err);}
    };
    authMod.signInAnonymously(auth).catch(err=>{console.warn("Firebase 匿名登入失敗",err);setStatus("⚪ 離線模式");});
    authMod.onAuthStateChanged(auth,user=>{
      currentUser=user;setStatus(user?"🟢 已連線":"⚪ 離線模式");updateNameUI();
      if(user&&!displayName)setTimeout(()=>askName(),250);
    });
    const q=fsMod.query(fsMod.collection(db,"jackpots"),fsMod.orderBy("createdAt","desc"),fsMod.limit(200));
    fsMod.onSnapshot(q,snap=>{
      const sevenDaysAgo=Date.now()-7*24*60*60*1000;
      renderFeed(snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>!x.createdAt?.toDate||x.createdAt.toDate().getTime()>=sevenDaysAgo));
    },err=>{console.warn("戰報讀取失敗，不影響模擬器",err);setStatus("⚪ 戰報離線");});
  }catch(err){
    console.warn("Firebase 模組載入失敗，已切換離線模式；模擬功能仍可使用。",err);
    setStatus("⚪ 離線模式");
  }
}
initLive();
