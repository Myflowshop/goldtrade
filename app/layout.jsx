import './globals.css'

export const metadata = {
  title: 'Gold Trade Journal',
  description: 'Track and analyze your XAUUSD trading performance',
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}

