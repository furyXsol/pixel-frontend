import { memo } from 'react'
const StakingPage = () => {
  return (
    <div className="mx-auto w-[800px] flex flex-col mt-[70px]">
      <h1 className="text-center text-white text-[36px]">$PXP STAKING</h1>
      <div className="grid grid-cols-3 mt-[20px] border-2 border-[#6e6e6e] p-3">
        <div className="col-span-1 flex flex-col gap-y-[10px]">
          <p className="text-[#c2c2c2] text-[20px]">STAKERS</p>
          <p className="text-white text-[20px]">1400</p>
        </div>
        <div className="col-span-1 flex flex-col gap-y-[10px]">
          <p className="text-[#c2c2c2] text-[20px]">TOTAL $PXP STAKED</p>
          <p className="text-white text-[20px]">150,470,000 PXP</p>
        </div>
        <div className="col-span-1 flex flex-col gap-y-[10px]">
          <p className="text-[#c2c2c2] text-[20px]">TOTAL REWARDS</p>
          <p className="text-white text-[20px]">150,5 SOL</p>
        </div>
      </div>
      <div className="flex mt-[20px] border-2 border-[#6e6e6e] p-3">
        <div className="flex flex-col gap-y-[10px]">
          <p className="text-[#c2c2c2] text-[20px]">YOUR STAKED PXP</p>
          <p className="text-white text-[20px]">12,600,000 PXP</p>
        </div>
      </div>
      <div className="flex justify-between mt-[20px] border-2 border-[#6e6e6e] p-3">
        <div className="flex flex-col gap-y-[10px]">
          <p className="text-[#c2c2c2] text-[20px] text-left">YOUR REWARDS</p>
          <p className="text-white text-[20px] text-left">1,6 SOL</p>
        </div>
        <div className="flex items-center">
          <button
            className={`col-span-1 border-2 border-white text-white border-solid py-1 text-[10px] font-normal cursor-pointer w-[200px]`}
            style={{fontFamily:'wf_56906c412d2a453f907c10dd5'}}
          >
            CLAIM
          </button>
        </div>
      </div>
      <div className="flex justify-between mt-[20px] gap-x-[20px]">
        <button
          className={`flex-1 border-2 border-white text-white border-solid py-1 text-[10px] font-normal cursor-pointer w-[200px]`}
          style={{fontFamily:'wf_56906c412d2a453f907c10dd5'}}
        >
          STAKE
        </button>
        <button
          className={`flex-1 border-2 border-[#6e6e6e] text-[#6e6e6e] border-solid py-1 text-[10px] font-normal cursor-pointer w-[200px]`}
          style={{fontFamily:'wf_56906c412d2a453f907c10dd5'}}
        >
          UNSTAKE
        </button>
      </div>
      <div className="flex flex-col mt-[20px] border-2 border-[#6e6e6e] p-4">
        <div className="flex gap-x-[10px]">
          <p className="text-[#c2c2c2] text-[23px]">YOUR BALANCE:</p>
          <p className="text-white text-[22px]">10,000,000 PXP</p>
        </div>
        <div className="flex justify-between border border-[#6e6e6e] p-2 mt-[10px]">
          <input
            type="text"
            className="flex-1 outline-none text-white text-[27px] bg-transparent"
            value={'10,000,000'}
          />
          <p className="text-[#c2c2c2] text-[27px]">PXP</p>
        </div>
        <div className="flex justify-center mt-[20px]">
          <button
            className="border-2 border-[#EDFF02] text-[#EDFF02] cursor-pointer w-[300px] py-1 text-[10px]"
            style={{fontFamily:'wf_56906c412d2a453f907c10dd5'}}
          >
            STAKE
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(StakingPage)