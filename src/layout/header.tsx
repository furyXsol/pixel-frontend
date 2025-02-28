import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { shortenAddress, getSolAmount } from '../utils'
import { socket } from '../hooks'
import { BuyTokenInfo } from '../types'
const Header = () => {
  const { connected, disconnect, publicKey: address } = useWallet()
  const { setVisible } = useWalletModal()
  const [buyToken, setBuyToken] = useState<BuyTokenInfo>()
  useEffect(() => {
    socket.on('buy_token', (value) => {
      setBuyToken(value)
    })
    return () => {
      socket.off('created_token_info')
      socket.off('buy_token')
    }
  },[])

  const showConnectionModal = () => {
    setVisible(true)
  }

  return (
    <header className="fixed top-0 right-0 left-0 bg-[#1A1C1F] border-b border-b-[#444444] z-[100]">
      <div className="flex p-4">
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
      {buyToken && <div className="flex items-center justify-center w-full h-[25px] bg-[#edff02] shaky">
        <p
          className="text-[15px] text-black"
        >
          {shortenAddress(buyToken.buyer)} bought {getSolAmount(buyToken.sol_amount).toString().replace('.', ',')} SOL of {buyToken.symbol}
        </p>
      </div>
      }

    </header>
  )
}

export default Header