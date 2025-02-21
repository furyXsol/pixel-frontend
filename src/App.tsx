import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import Layout from './layout'
import DApp from './pages/dapp'
import GalleryHome from './pages/gallery_home'
import CreatePage from './pages/create'
import TradePage from './pages/trade'
import WalletPage from './pages/wallet'
import StakingPage from './pages/staking'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<GalleryHome />} />
          <Route path="/dapp" element={<DApp />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/token/:tokenMint" element={<TradePage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/staking" element={<StakingPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
