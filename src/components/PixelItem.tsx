import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { TokenInfo } from '../types'
import { getTimeAgo, getBondingCurvePercent, getMarketCap } from '../utils'
import { useSolPrice } from '../hooks'
interface PixelItemProps {
  token: TokenInfo
  showProgress?: boolean
}
const PixelItem:React.FC<PixelItemProps> = ({
  token,
  showProgress = true
}) => {
  const navigate = useNavigate()
  const { data: solPrice } = useSolPrice()
  return (
    <div
      className="flex flex-col border-2 border-[#6e6e6e] p-2 cursor-pointer max-w-[482px]"
      onClick={() => {navigate(`/token/${token.mint}`)}}
    >
      <div className="flex">
        <div className="flex p-2 w-[100px] h-[100px] md:w-[133px] md:h-[133px] bg-white">
          <img src={`${token.imageUri}`} alt="img-logo" className="w-[100px] h-[100px] md:w-[133px] md:h-[133px]" />
        </div>
        <div className="flex flex-col flex-1">
          <div className="flex justify-between">
            <p className="text-white text-[21px]">{token.name.toUpperCase()}</p>
            <p className="text-[#c2c2c2] text-[19px]">{getTimeAgo((new Date().getTime() - token.createdAt)/1000)}</p>
          </div>
          <div className="flex">
            <p className="text-[#c2c2c2] text-[21px]">{token.symbol.toUpperCase()}</p>
          </div>
          <div className="flex-1"></div>
          <div className="flex justify-between">
            <p className="text-[#c2c2c2] text-[19px]">MCAP</p>
            <p className="text-[#c2c2c2] text-[19px]">PROGRESS</p>
          </div>
          <div className="flex justify-between">
            <p className="text-[#c2c2c2] text-[19px]">{solPrice && getMarketCap(token.solAmount, token.soldTokenAmount, solPrice)}</p>
            <p className="text-[#c2c2c2] text-[19px]">{getBondingCurvePercent(token.solAmount)}%</p>
          </div>
        </div>
      </div>
      {showProgress && <div className="border-2 border-[#6e6e6e] p-1 h-[25px] mt-2">
        <div
          className="w-[80%] bg-[#EDFF02] h-full"
          style={{width: `${getBondingCurvePercent(token.solAmount)}%`}}
        />
      </div>}
    </div>
  )
}

export default memo(PixelItem)