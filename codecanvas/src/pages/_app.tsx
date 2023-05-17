import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { usePageView } from "@/components/usePageView";

export default function App({ Component, pageProps }: AppProps) {
  // Google Analytics の PV をカウントするイベント
  usePageView();
  return <Component {...pageProps} />
}
