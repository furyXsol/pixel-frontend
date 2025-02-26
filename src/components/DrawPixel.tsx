import { memo, useState, useRef } from 'react'
import Pencil from '../assets/pencil.svg?react'
import Designer from '../components/PixelDesign/Designer'

interface DrawPixelProps {
  setIsShowCreatePixel: (isShowCreatePixel: boolean) => void
  setPixelImageURI:( imageURI: string) => void
}
const DrawPixel: React.FC<DrawPixelProps> = ({
  setIsShowCreatePixel,
  setPixelImageURI,
}) => {
  const [color, setColor] = useState('#EDFF02')
  const [drawType, setDrawType] = useState<'draw' | 'paint'>('draw')
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  return (
    <div className="flex flex-col mt-[80px] mb-[100px]">
      <div className="flex flex-col sm:grid sm:grid-cols-8 md:grid-cols-8 lg:grid-cols-10">
        <div className="hidden lg:flex lg:col-span-2"></div>
        <div className="sm:col-span-6 md:col-span-6 lg:col-span-5 p-1">
            <Designer color={color} drawType={drawType} canvasRef = {canvasRef}/>
        </div>
        <div className="sm:col-span-2 md:col-span-2 lg:col-span-3 flex gap-x-4 sm:flex-col gap-y-[30px] flex-start pl-2 sm:pl-4 md:pl-8 lg:pl-[50px] mt-[40px]">
          <div className="flex flex-col">
            <p className="text-white text-[21px] text-left">TOOLS</p>
            <div className="flex sm:flex-col gap-x-4">
              <div className="flex">
                <div
                  className={`p-3 flex rounded-full cursor-pointer ${drawType ==='draw'?'bg-[#555555]':''}`}
                  onClick={() => {setDrawType('draw')}}
                >
                  <Pencil className="w-[30px] h-[30px] text-white"/>
                </div>
              </div>
              <div className="flex">
                <div
                  className={`p-3 flex rounded-full cursor-pointer ${drawType ==='paint'?'bg-[#555555]':''}`}
                  onClick={() => {setDrawType('paint')}}
                >
                  <img src="/imgs/flask.png" alt="paint" width={30} height={30} />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <p className="text-white text-[21px] text-left">COLOR</p>
            <div className="flex mt-[10px]">
              <label htmlFor="color-id" className="cursor-pointer mx-3 rounded-full w-[33px] h-[33px]" style={{background: color}}></label>
              <input
                id="color-id"
                type="color"
                value={color}
                className="opacity-0 rounded-full outline-none border-0 border-solid"
                style={{background: color}}
                onChange={(e) => {
                  setColor(e.target.value)
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center mt-5">
        <button
          className="border-2 border-[#EDFF02] border-solid px-12 py-1 text-[#EDFF02] text-[10px] font-normal cursor-pointer min-w-[300px]"
          style={{fontFamily:'wf_56906c412d2a453f907c10dd5'}}
          onClick={() => {
            const dataURL = canvasRef.current!.toDataURL('image/png')
            setPixelImageURI(dataURL)
            setIsShowCreatePixel(false)
          }}
        >
          CONTINUE
        </button>
      </div>
    </div>
  )
}

export default memo(DrawPixel)