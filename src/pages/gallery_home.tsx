import { memo, useState, useMemo } from 'react'
import PixelItem from '../components/PixelItem'
import { useNavigate } from 'react-router-dom'
import { useBondingCurveTokens } from '../hooks'
import Select from '../components/Select'
import { SortType } from '../types'

const GalleryHome = () => {
  const navigate = useNavigate()
  const {data: tokens} = useBondingCurveTokens()
  const [selectedFilter, setSelectedFilter] = useState<SortType>(SortType.MARKET_CAP)
  const filterItems = [
    {
      value: SortType.MARKET_CAP,
      label: 'Market cap'
    },
    {
      value: SortType.PROGRESS,
      label: 'Progress %'
    },
    {
      value:  SortType.CREATION_TIME,
      label: 'Creation time'
    },
  ]

  const filteredTokens = useMemo(() => {
    if (selectedFilter === SortType.MARKET_CAP) {
      return tokens?.sort((a, b) => {
        const aMarketCap = BigInt(1000000000 * ((Number(a.solAmount) / 1000000000) / (Number(a.soldTokenAmount) / 1000000)))
        const bMarketCap = BigInt(1000000000 * ((Number(b.solAmount) / 1000000000) / (Number(b.soldTokenAmount) / 1000000)))
        return Number(bMarketCap - aMarketCap)
      })
    }
    if (selectedFilter === SortType.PROGRESS) {
      return tokens?.sort((a, b) => b.solAmount - a.solAmount)
    }
    if (selectedFilter === SortType.CREATION_TIME) {
      return tokens?.sort((a, b) => b.createdAt - a.createdAt)
    }
    return []
  }, [tokens, selectedFilter])

  return (
    <div className="flex flex-col mt-[50px] mb-[100px]">
      <div className="flex justify-center items-center py-6 border-b border-b-[#444444]">
        <h2
          className="text-white text-[25px] cursor-pointer"
          onClick={() => {navigate('/create')}}
        >
          {`{ CREATE A PIXEL }`}
        </h2>
      </div>
      <div className="flex justify-center items-center gap-x-[30px] mt-4">
        <button
          className="border-2 border-[#EDFF02] text-[#EDFF02] text-[10px] min-w-[200px] py-1"
          style={{fontFamily: 'wf_56906c412d2a453f907c10dd5'}}
          onClick={() => {
            navigate('/')
          }}
        >
          PIXEL GALLERY
        </button>
        <button
          className="text-[#EDFF02] text-[10px] min-w-[200px] py-1"
          style={{fontFamily: 'wf_56906c412d2a453f907c10dd5'}}
          onClick={() => {
            navigate('/dapp')
          }}
        >
          LAUNCHED PIXELS
        </button>
      </div>
      <div className="md:mx-8 mt-8">
        <div className="flex mt-4">
          <p
            className="flex items-center text-[10px] text-white"
            style={{fontFamily: 'wf_56906c412d2a453f907c10dd5'}}
          >
            <span className="mr-2">FILTER:</span>
            <Select
              itemList={filterItems}
              selectedItem={selectedFilter}
              setSelectedItem={setSelectedFilter}
            />
          </p>
        </div>
        <div className="mt-[20px] grid grid-cols-1 xl:grid-cols-3">
          {filteredTokens && filteredTokens.map((token) => (
            <PixelItem token={token}/>
          ))}
        </div>
      </div>
    </div>
  )
}

export default memo(GalleryHome)