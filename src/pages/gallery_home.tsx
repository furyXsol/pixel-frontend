import { memo, useState } from 'react'
import PixelItem from '../components/PixelItem'
import { useNavigate } from 'react-router-dom'
import { useBondingCurveTokens } from '../hooks'
const GalleryHome = () => {
  const navigate = useNavigate()
  const {data: tokens} = useBondingCurveTokens()

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
            className="text-[10px] text-white"
            style={{fontFamily: 'wf_56906c412d2a453f907c10dd5'}}
          >
            FILTER: MARKET CAP
          </p>
        </div>
        <div className="mt-[20px] grid grid-cols-1 xl:grid-cols-3">
          {tokens && tokens.map((token) => (
            <PixelItem token={token}/>
          ))}
        </div>
      </div>
    </div>
  )
}

export default memo(GalleryHome)