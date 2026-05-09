import { ScrollViewStyleReset } from 'expo-router/html'

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
