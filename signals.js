// signals.js — motore segnali condiviso Nextrade
function ema(arr,period){
  const out=new Array(arr.length).fill(null);
  if(arr.length<period)return out;
  let sum=0,cnt=0,seed=-1;
  for(let i=0;i<arr.length&&cnt<period;i++){
    if(arr[i]!==null){sum+=arr[i];cnt++;if(cnt===period)seed=i;}
  }
  if(seed<0)return out;
  out[seed]=sum/period;
  const k=2/(period+1);
  for(let j=seed+1;j<arr.length;j++){
    if(arr[j]===null){out[j]=out[j-1];continue;}
    out[j]=arr[j]*k+out[j-1]*(1-k);
  }
  return out;
}
function rsi(close,period=14){
  const out=new Array(close.length).fill(null);
  if(close.length<period+1)return out;
  let ag=0,al=0;
  for(let i=1;i<=period;i++){const d=close[i]-close[i-1];if(d>0)ag+=d;else al-=d;}
  ag/=period;al/=period;
  out[period]=al===0?100:100-100/(1+ag/al);
  for(let i=period+1;i<close.length;i++){
    const d=close[i]-close[i-1];
    ag=(ag*(period-1)+Math.max(d,0))/period;
    al=(al*(period-1)+Math.max(-d,0))/period;
    out[i]=al===0?100:100-100/(1+ag/al);
  }
  return out;
}
function atr(high,low,close,period=14){
  const n=close.length,tr=[0];
  for(let i=1;i<n;i++)tr.push(Math.max(high[i]-low[i],Math.abs(high[i]-close[i-1]),Math.abs(low[i]-close[i-1])));
  const out=new Array(n).fill(null);
  let s=0;for(let i=1;i<=period;i++)s+=tr[i];
  out[period]=s/period;
  for(let i=period+1;i<n;i++)out[i]=(out[i-1]*(period-1)+tr[i])/period;
  return out;
}
function bollinger(close,period=20,mult=2.0){
  const n=close.length,up=new Array(n).fill(null),lo=new Array(n).fill(null);
  for(let i=period-1;i<n;i++){
    const sl=close.slice(i-period+1,i+1);
    const m=sl.reduce((a,b)=>a+b,0)/period;
    const std=Math.sqrt(sl.reduce((a,b)=>a+(b-m)**2,0)/period);
    up[i]=m+mult*std;lo[i]=m-mult*std;
  }
  return[up,lo];
}
function supertrend(high,low,close,period=10,mult=3.0){
  const n=close.length,atrV=atr(high,low,close,period),dir=new Array(n).fill(null);
  let st=null,pd=null;
  for(let i=period;i<n;i++){
    if(atrV[i]===null)continue;
    const hl2=(high[i]+low[i])/2,up=hl2+mult*atrV[i],lo=hl2-mult*atrV[i];
    if(pd===null){dir[i]=close[i]>lo?1:-1;st=dir[i]===1?lo:up;}
    else if(pd===1){const nst=Math.max(lo,st);if(close[i]<nst){dir[i]=-1;st=up;}else{dir[i]=1;st=nst;}}
    else{const nst=Math.min(up,st);if(close[i]>nst){dir[i]=1;st=lo;}else{dir[i]=-1;st=nst;}}
    pd=dir[i];
  }
  return dir;
}
function utbot(close,high,low,mult=2.0,period=10){
  const atrV=atr(high,low,close,period),n=close.length,trail=new Array(n).fill(null);
  for(let i=period+1;i<n;i++){
    if(atrV[i]===null){trail[i]=trail[i-1];continue;}
    const nL=mult*atrV[i],prev=trail[i-1]!==null?trail[i-1]:close[i];
    if(close[i]>prev)trail[i]=Math.max(prev,close[i]-nL);
    else if(close[i]<prev)trail[i]=Math.min(prev,close[i]+nL);
    else trail[i]=prev;
  }
  return trail;
}
function stoch(high,low,close,k=14){
  const n=close.length,K=new Array(n).fill(null);
  for(let i=k-1;i<n;i++){
    const hi=Math.max(...high.slice(i-k+1,i+1)),lo=Math.min(...low.slice(i-k+1,i+1));
    K[i]=hi===lo?50:100*(close[i]-lo)/(hi-lo);
  }
  return K;
}
function psar(high,low,af0=0.02,afMax=0.20){
  const n=high.length,dir=new Array(n).fill(1);
  if(n<3)return dir;
  let sar=low[0],ep=high[0],af=af0,tr=1;
  for(let i=1;i<n;i++){
    const ps=sar;
    if(tr===1){
      sar=ps+af*(ep-ps);sar=Math.min(sar,low[i-1],i>1?low[i-2]:low[i-1]);
      if(low[i]<sar){tr=-1;sar=ep;ep=low[i];af=af0;}
      else if(high[i]>ep){ep=high[i];af=Math.min(af+af0,afMax);}
    }else{
      sar=ps+af*(ep-ps);sar=Math.max(sar,high[i-1],i>1?high[i-2]:high[i-1]);
      if(high[i]>sar){tr=1;sar=ep;ep=high[i];af=af0;}
      else if(low[i]<ep){ep=low[i];af=Math.min(af+af0,afMax);}
    }
    dir[i]=tr;
  }
  return dir;
}
function adxdmi(high,low,close,period=14){
  const n=close.length,tr=[0],dmP=[0],dmM=[0];
  for(let i=1;i<n;i++){
    const up=high[i]-high[i-1],dn=low[i-1]-low[i];
    tr.push(Math.max(high[i]-low[i],Math.abs(high[i]-close[i-1]),Math.abs(low[i]-close[i-1])));
    dmP.push(up>dn&&up>0?up:0);dmM.push(dn>up&&dn>0?dn:0);
  }
  function ws(arr,p){const o=new Array(n).fill(null);let s=0;for(let i=1;i<=p;i++)s+=arr[i];o[p]=s;for(let i=p+1;i<n;i++)o[i]=o[i-1]-o[i-1]/p+arr[i];return o;}
  const AT=ws(tr,period),DP=ws(dmP,period),DM=ws(dmM,period);
  const dip=new Array(n).fill(null),dim=new Array(n).fill(null),dx=new Array(n).fill(null);
  for(let i=period;i<n;i++){if(!AT[i]||AT[i]===0)continue;dip[i]=100*DP[i]/AT[i];dim[i]=100*DM[i]/AT[i];const s2=dip[i]+dim[i];if(s2>0)dx[i]=100*Math.abs(dip[i]-dim[i])/s2;}
  const adx=new Array(n).fill(null);const st2=period*2;let s2=0,c2=0;
  for(let i=period;i<st2&&i<n;i++){if(dx[i]!==null){s2+=dx[i];c2++;}}
  if(c2>0&&st2-1<n)adx[st2-1]=s2/c2;
  for(let i=st2;i<n;i++){if(adx[i-1]===null||dx[i]===null)continue;adx[i]=(adx[i-1]*(period-1)+dx[i])/period;}
  return[adx,dip,dim];
}
function cci(high,low,close,period=20){
  const tp=high.map((h,i)=>(h+low[i]+close[i])/3),out=new Array(close.length).fill(null);
  for(let i=period-1;i<close.length;i++){const sl=tp.slice(i-period+1,i+1),m=sl.reduce((a,b)=>a+b,0)/period,md=sl.reduce((a,b)=>a+Math.abs(b-m),0)/period;out[i]=md===0?0:(tp[i]-m)/(0.015*md);}
  return out;
}
function williamsR(high,low,close,period=14){
  const out=new Array(close.length).fill(null);
  for(let i=period-1;i<close.length;i++){const hi=Math.max(...high.slice(i-period+1,i+1)),lo=Math.min(...low.slice(i-period+1,i+1));out[i]=hi===lo?-50:-100*(hi-close[i])/(hi-lo);}
  return out;
}
function stochRSI(close,rsiP=14,stP=14){
  const rA=rsi(close,rsiP),n=close.length,out=new Array(n).fill(null);
  for(let i=rsiP+stP-1;i<n;i++){const sl=rA.slice(i-stP+1,i+1).filter(v=>v!==null);if(sl.length<stP)continue;const hi=Math.max(...sl),lo=Math.min(...sl),curr=rA[i];if(curr===null)continue;out[i]=hi===lo?0.5:(curr-lo)/(hi-lo);}
  return out;
}
function keltner(close,high,low,ep=20,ap=10,mult=2.0){
  const mid=ema(close,ep),atrV=atr(high,low,close,ap);
  return[mid.map((v,i)=>v!==null&&atrV[i]!==null?v+mult*atrV[i]:null),mid.map((v,i)=>v!==null&&atrV[i]!==null?v-mult*atrV[i]:null)];
}
function mfi(high,low,close,volume,period=14){
  const n=close.length,tp=high.map((h,i)=>(h+low[i]+close[i])/3),out=new Array(n).fill(null);
  for(let i=period;i<n;i++){let pos=0,neg=0;for(let j=i-period+1;j<=i;j++){const f=tp[j]*volume[j];if(tp[j]>tp[j-1])pos+=f;else if(tp[j]<tp[j-1])neg+=f;}out[i]=neg===0?100:100-100/(1+pos/neg);}
  return out;
}
function obvEma(close,volume,emaPeriod=20){
  const n=close.length,o=[0];
  for(let i=1;i<n;i++){if(close[i]>close[i-1])o.push(o[i-1]+volume[i]);else if(close[i]<close[i-1])o.push(o[i-1]-volume[i]);else o.push(o[i-1]);}
  return[o,ema(o,emaPeriod)];
}
function trix(close,period=15){
  const e3=ema(ema(ema(close,period),period),period),out=new Array(close.length).fill(null);
  for(let i=1;i<close.length;i++){if(e3[i]!==null&&e3[i-1]!==null&&e3[i-1]!==0)out[i]=(e3[i]-e3[i-1])/e3[i-1]*100;}
  return out;
}
function roc(close,period=12){
  const out=new Array(close.length).fill(null);
  for(let i=period;i<close.length;i++){if(close[i-period]!==0)out[i]=(close[i]-close[i-period])/close[i-period]*100;}
  return out;
}
function smaVol(volume,period=20){
  const out=new Array(volume.length).fill(null);
  for(let i=period-1;i<volume.length;i++){const sl=volume.slice(i-period+1,i+1);out[i]=sl.reduce((a,b)=>a+b,0)/period;}
  return out;
}
function computeVotes(df){
  const n=df.c.length;
  if(n<30)return null;
  const i=n-2;
  const cv=df.c[i];
  const rsiA=rsi(df.c);
  const e9=ema(df.c,9),e21=ema(df.c,21),e50=ema(df.c,50),e200=ema(df.c,200);
  const e12=ema(df.c,12),e26=ema(df.c,26);
  const macdL=e12.map((v,j)=>v!==null&&e26[j]!==null?v-e26[j]:null);
  const sigL=ema(macdL,9);
  const[bUp,bLo]=bollinger(df.c);
  const stD=supertrend(df.h,df.l,df.c);
  const utT=utbot(df.c,df.h,df.l);
  const stK=stoch(df.h,df.l,df.c);
  const psD=psar(df.h,df.l);
  const v={};
  const rv=rsiA[i];
  if(rv!==null){if(rv<35)v.RSI={dir:'LONG'};else if(rv>65)v.RSI={dir:'SHORT'};else v.RSI={dir:'NEUTRAL'};}
  else v.RSI={dir:'NEUTRAL'};
  if(e9[i]&&e21[i])v.EMA_CROSS={dir:e9[i]>e21[i]?'LONG':'SHORT'};
  else v.EMA_CROSS={dir:'NEUTRAL'};
  if(e200[i]&&cv)v.EMA200={dir:cv>e200[i]?'LONG':'SHORT'};
  else v.EMA200={dir:'NEUTRAL'};
  if(macdL[i]!==null&&sigL[i]!==null)v.MACD={dir:macdL[i]>sigL[i]?'LONG':'SHORT'};
  else v.MACD={dir:'NEUTRAL'};
  if(cv&&bUp[i]&&bLo[i]){if(cv<bLo[i])v.BB={dir:'LONG'};else if(cv>bUp[i])v.BB={dir:'SHORT'};else v.BB={dir:'NEUTRAL'};}
  else v.BB={dir:'NEUTRAL'};
  if(stD[i]!==null)v.ST={dir:stD[i]===1?'LONG':'SHORT'};else v.ST={dir:'NEUTRAL'};
  if(utT[i]!==null&&cv)v.UT={dir:cv>utT[i]?'LONG':'SHORT'};else v.UT={dir:'NEUTRAL'};
  const kv=stK[i];
  if(kv!==null){if(kv<20)v.STOCH={dir:'LONG'};else if(kv>80)v.STOCH={dir:'SHORT'};else v.STOCH={dir:'NEUTRAL'};}
  else v.STOCH={dir:'NEUTRAL'};
  if(psD[i]!==null)v.PSAR={dir:psD[i]===1?'LONG':'SHORT'};else v.PSAR={dir:'NEUTRAL'};
  if(e50[i]&&e200[i])v.GDX={dir:e50[i]>e200[i]?'LONG':'SHORT'};else v.GDX={dir:'NEUTRAL'};
  const[adxA,dipA,dimA]=adxdmi(df.h,df.l,df.c);
  if(adxA[i]!==null&&dipA[i]!==null&&dimA[i]!==null){if(adxA[i]<20)v.ADX={dir:'NEUTRAL'};else v.ADX={dir:dipA[i]>dimA[i]?'LONG':'SHORT'};}
  else v.ADX={dir:'NEUTRAL'};
  const cciV=cci(df.h,df.l,df.c)[i];
  if(cciV!==null){if(cciV>100)v.CCI={dir:'LONG'};else if(cciV<-100)v.CCI={dir:'SHORT'};else v.CCI={dir:'NEUTRAL'};}
  else v.CCI={dir:'NEUTRAL'};
  const wrV=williamsR(df.h,df.l,df.c)[i];
  if(wrV!==null){if(wrV<-80)v.WR={dir:'LONG'};else if(wrV>-20)v.WR={dir:'SHORT'};else v.WR={dir:'NEUTRAL'};}
  else v.WR={dir:'NEUTRAL'};
  const srV=stochRSI(df.c)[i];
  if(srV!==null){if(srV<0.2)v.SRSI={dir:'LONG'};else if(srV>0.8)v.SRSI={dir:'SHORT'};else v.SRSI={dir:'NEUTRAL'};}
  else v.SRSI={dir:'NEUTRAL'};
  const[kUp,kLo]=keltner(df.c,df.h,df.l);
  if(cv&&kUp[i]&&kLo[i]){if(cv>kUp[i])v.KELT={dir:'LONG'};else if(cv<kLo[i])v.KELT={dir:'SHORT'};else v.KELT={dir:'NEUTRAL'};}
  else v.KELT={dir:'NEUTRAL'};
  const mfiV=mfi(df.h,df.l,df.c,df.v)[i];
  if(mfiV!==null){if(mfiV<30)v.MFI={dir:'LONG'};else if(mfiV>70)v.MFI={dir:'SHORT'};else v.MFI={dir:'NEUTRAL'};}
  else v.MFI={dir:'NEUTRAL'};
  const[obvA,obvE]=obvEma(df.c,df.v);
  if(obvE[i]!==null)v.OBV={dir:obvA[i]>obvE[i]?'LONG':'SHORT'};else v.OBV={dir:'NEUTRAL'};
  const trixV=trix(df.c)[i];
  if(trixV!==null)v.TRIX={dir:trixV>0?'LONG':'SHORT'};else v.TRIX={dir:'NEUTRAL'};
  const rocV=roc(df.c)[i];
  if(rocV!==null){if(rocV>2)v.ROC={dir:'LONG'};else if(rocV<-2)v.ROC={dir:'SHORT'};else v.ROC={dir:'NEUTRAL'};}
  else v.ROC={dir:'NEUTRAL'};
  const vmA=smaVol(df.v)[i],volV=df.v[i];
  if(vmA&&volV){const r=volV/vmA;v.VOL={dir:r>1.5?(df.c[i]>df.c[i-1]?'LONG':'SHORT'):'NEUTRAL'};}
  else v.VOL={dir:'NEUTRAL'};
  return v;
}
function hybrid(votes){
  let longs=0,shorts=0;
  for(const vv of Object.values(votes)){if(vv.dir==='LONG')longs++;else if(vv.dir==='SHORT')shorts++;}
  const active=longs+shorts;
  return{dir:longs>shorts?'LONG':shorts>longs?'SHORT':'NEUTRAL',score:active>0?Math.round(Math.max(longs,shorts)/active*100):0,longs,shorts};
}
function resampleOHLCV(df,n){
  const out={t:[],o:[],h:[],l:[],c:[],v:[]};
  for(let i=0;i+n-1<df.c.length;i+=n){
    out.t.push(df.t[i]);out.o.push(df.o[i]);
    out.h.push(Math.max(...df.h.slice(i,i+n)));
    out.l.push(Math.min(...df.l.slice(i,i+n)));
    out.c.push(df.c[i+n-1]);
    out.v.push(df.v.slice(i,i+n).reduce((a,b)=>a+(b||0),0));
  }
  return out;
}
function _parseYF(data,interval){
  if(!data.chart||!data.chart.result)throw new Error('YF no data');
  const res=data.chart.result[0];
  const ts=res.timestamp,q=res.indicators.quote[0];
  const valid=ts.map((_,i)=>q.close[i]!=null);
  const df={
    t:ts.filter((_,i)=>valid[i]).map(t=>t*1000),
    o:q.open.filter((_,i)=>valid[i]),
    h:q.high.filter((_,i)=>valid[i]),
    l:q.low.filter((_,i)=>valid[i]),
    c:q.close.filter((_,i)=>valid[i]),
    v:(q.volume||ts.map(()=>0)).filter((_,i)=>valid[i]),
  };
  if(interval==='4h')return resampleOHLCV(df,4);
  return df;
}
async function fetchYahoo(symbol,interval){
  const MAP={'5m':{yi:'5m',yr:'5d'},'15m':{yi:'15m',yr:'60d'},'1h':{yi:'60m',yr:'90d'},'4h':{yi:'60m',yr:'90d'},'1d':{yi:'1d',yr:'2y'}};
  const{yi,yr}=MAP[interval]||MAP['1h'];
  const base=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${yi}&range=${yr}`;
  const attempts=[
    base,
    base.replace('query1','query2'),
    `https://corsproxy.io/?${encodeURIComponent(base)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(base)}`,
  ];
  let lastErr;
  for(const url of attempts){
    try{
      const r=await fetch(url);
      if(!r.ok)throw new Error(`HTTP ${r.status}`);
      const data=await r.json();
      return _parseYF(data,interval);
    }catch(e){lastErr=e;}
  }
  throw lastErr;
}
function fmtP(p){
  if(p>=1000)return '$'+Math.round(p).toLocaleString('en-US');
  if(p>=100)return '$'+p.toFixed(2);
  if(p>=10)return '$'+p.toFixed(2);
  if(p>=1)return '$'+p.toFixed(3);
  return '$'+p.toFixed(5);
}
