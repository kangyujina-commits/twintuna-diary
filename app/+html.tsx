import { ScrollViewStyleReset } from 'expo-router/html'

// 캔버스로 PNG 아이콘 생성 후 apple-touch-icon에 주입
const iconScript = `(function(){try{
  var c=document.createElement('canvas');
  c.width=c.height=512;
  var x=c.getContext('2d');
  // 둥근 배경
  var r=112;
  x.beginPath();
  x.moveTo(r,0);x.lineTo(512-r,0);
  x.arcTo(512,0,512,r,r);x.lineTo(512,512-r);
  x.arcTo(512,512,512-r,512,r);x.lineTo(r,512);
  x.arcTo(0,512,0,512-r,r);x.lineTo(0,r);
  x.arcTo(0,0,r,0,r);x.closePath();
  x.fillStyle='#fff4ec';x.fill();
  x.strokeStyle='#e8d0b8';x.lineWidth=14;x.stroke();
  // 두 이모지를 하나의 문자열로 가운데 렌더링
  x.font='180px serif';
  x.textAlign='center';x.textBaseline='middle';
  x.fillText('\\uD83D\\uDC36\\uD83D\\uDC31',256,272);
  var d=c.toDataURL('image/png');
  var l=document.querySelector('link[rel="apple-touch-icon"]');
  if(!l){l=document.createElement('link');l.rel='apple-touch-icon';document.head.appendChild(l);}
  l.href=d;
  var f=document.querySelector('link[rel="icon"]');
  if(f)f.href=d;
}catch(e){}})()`

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/* 아이콘을 캔버스로 생성해서 주입 (iOS PNG 대응) */}
        <script dangerouslySetInnerHTML={{ __html: iconScript }} />

        {/* PWA 공통 */}
        <meta name="application-name" content="TwinTuna" />
        <meta name="description" content="커플 공유 일기장 🐶🐱" />
        <meta name="theme-color" content="#c9a882" />

        {/* iOS Safari — 홈 화면에 추가 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TwinTuna" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />

        {/* 스플래시 배경색 */}
        <meta name="msapplication-TileColor" content="#c9a882" />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  )
}
