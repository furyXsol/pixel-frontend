import { Link } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { shortenAddress } from '../utils'

const Header = () => {
  const { connected, disconnect, publicKey: address } = useWallet()
  const { setVisible } = useWalletModal()

  const showConnectionModal = () => {
    setVisible(true)
  }

  return (
    <header className="fixed top-0 right-0 left-0 bg-[#1A1C1F] border-b border-b-[#444444] p-4">
      <div className="flex">
        <Link to="/" className="flex items-center gap-1">
          <img src="/imgs/logo.png" alt="pixelpump-logo" width={31} height={31} />
          <h2 className="text-[#EDFF02] text-[25px] font-normal">PIXELPUMP</h2>
        </Link>
        <div className="flex-1 flex items-center justify-end">
          <div className="flex-1 flex justify-center  text-white text-[10px] hidden md:flex md:gap-x-[20px] lg:gap-x-[100px]" style={{fontFamily:"wf_56906c412d2a453f907c10dd5"}}>
            <Link to="/">BUY $PXP</Link>
            <Link to="/staking">STAKE $PXP</Link>
            <Link to="/">PXP NFT'S (SOON)</Link>
          </div>
          {!connected && <button
            className="border-2 border-[#EDFF02] border-solid px-2 py-1 text-[#EDFF02] text-[10px] font-normal cursor-pointer md:min-w-[150px] lg:min-w-[200px]"
            style={{fontFamily:'wf_56906c412d2a453f907c10dd5'}}
            onClick={() => showConnectionModal()}
          >
            CONNECT WALLET
          </button>
          }
          {connected && address && <button
            className="border-2 border-[#EDFF02] border-solid px-2 py-1 text-[#EDFF02] text-[10px] font-normal cursor-pointer md:min-w-[150px] lg:min-w-[200px]"
            style={{fontFamily:'wf_56906c412d2a453f907c10dd5'}}
            onClick={disconnect}
          >
            {shortenAddress(address.toBase58())}
          </button>
          }
        </div>
      </div>
    </header>
  )
}

export default Header