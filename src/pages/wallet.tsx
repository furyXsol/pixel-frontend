import { memo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useBalance, useStakeTokenBalance } from '../hooks'
import { getSolAmount, numberWithCommas } from '../utils'
const WalletPage = () => {
  const { publicKey: address } = useWallet()
  const { data: stakTokenBalance } = useStakeTokenBalance()
  const { data: balance } = useBalance()
  return (
    <div className="mx-auto w-[750px] flex flex-col mt-[70px]">
      <h1 className="text-center text-white text-[30px] mt-[20px]">WALLET</h1>
      <div className="border-2 border-[#6e6e6e] flex justify-center p-2 mt-[20px]">
        <p className="text-white text-[19px]">{address?.toBase58()}</p>
      </div>
      <div className="flex flex-col mt-[30px]">
        <div className="flex justify-between border-b border-[#c2c2c2] py-2">
          <div className="flex gap-x-[10px]">
            <div className="flex">
              <img src="/imgs/logo.png" alt="coin-logo" width={52} height={52} />
            </div>
            <div className="flex flex-col justify-between">
              <p className="text-left text-white text-[19px]">PIXELPUMP</p>
              <p className="text-left text-[#c2c2c2] text-[19px]">PXP</p>
            </div>
          </div>
          <div className="flex flex-col justify-between">
            <p className="text-right text-white text-[19px]">{numberWithCommas(getSolAmount(stakTokenBalance?.balance??0))} PXP</p>
            <p className="text-right text-[#c2c2c2] text-[19px]">{ numberWithCommas(getSolAmount(balance??0))} SOL</p>
          </div>
        </div>
      </div>

    </div>
  )
}

export default memo(WalletPage)