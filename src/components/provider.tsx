import { useMemo, FC, ReactNode } from 'react'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TrustWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { IS_MAIN, SOLANA_DEV_RPC, SOLANA_MAIN_RPC } from '../constants'
import { ToastContainer } from 'react-toastify'
import "@solana/wallet-adapter-react-ui/styles.css";
import 'react-toastify/dist/ReactToastify.css'
import {
  QueryClientProvider,
  QueryClient,
} from '@tanstack/react-query'

interface ProviderProps {
  children: ReactNode
}
const queryClient = new QueryClient()

export const Provider:FC<ProviderProps> = ({children}) => {
  const wallets = useMemo(
    () => [
        new PhantomWalletAdapter(),
        new TrustWalletAdapter(),
        new SolflareWalletAdapter(),
    ],
    [],
)
  return (
    <ConnectionProvider endpoint={IS_MAIN ? SOLANA_MAIN_RPC : SOLANA_DEV_RPC}>
      <QueryClientProvider client={queryClient}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            {children}
          </WalletModalProvider>
        </WalletProvider>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          closeOnClick={true}
          pauseOnHover={true}
        />
      </QueryClientProvider>
    </ConnectionProvider>
  )
}