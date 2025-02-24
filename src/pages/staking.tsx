import { memo, useState } from 'react'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'
import {
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  Transaction,
  sendAndConfirmRawTransaction,
} from '@solana/web3.js'
import {
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import { BN } from '@coral-xyz/anchor'
import { useStakerCount, useStakeInfo, useStakeTokenBalance } from '../hooks'
import { numberWithCommas } from '../utils'
import { toast } from 'react-toastify'
import { STAKING_TOKEN, IS_MAIN } from '../constants'
import { getAnchorProgram } from '../constants/anchor'
import { getJitoTransferJito, sendTransactionWithJito } from '../utils/jito'

const StakingPage = () => {
  const [amount ,setAmount] = useState<string>('0')
  const [stakeTab, setStakeTab] = useState<boolean>(true)
  const wallet = useAnchorWallet()
  const { connection } = useConnection()
  const { data: stakerCount } = useStakerCount()
  const { data: stakeInfo} = useStakeInfo()
  const { data: stakTokenBalance } = useStakeTokenBalance()
  const stake = async () => {
    if (!wallet || !connection) {
      toast.error("Please connect wallet first.")
      return
    }
    try {
      const stakingToken = new PublicKey(STAKING_TOKEN)
      const program = getAnchorProgram(connection, wallet)

      const [ config ] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      )
      const [ stakingHolder ] = PublicKey.findProgramAddressSync(
        [Buffer.from("stake_holder"), stakingToken.toBuffer()],
        program.programId
      )
      const stakingHolderAta = getAssociatedTokenAddressSync(stakingToken, stakingHolder, true)
      const [ userStakeInfo ] = PublicKey.findProgramAddressSync(
        [Buffer.from("user_stake_info"),
         stakingToken.toBuffer(),
         wallet.publicKey.toBuffer(),
        ],
        program.programId
      )
      const userAta = getAssociatedTokenAddressSync(stakingToken, wallet.publicKey)

      const sellTokenIns = await program.methods.stake({
        amount: new BN(Number(amount) * 1000000000),
      }).accounts({
        user: wallet.publicKey,
        stakeTokenMint: stakingToken,
        config,
        stakeHolder: stakingHolder,
        userStakeInfo: userStakeInfo,
        userAta: userAta,
        stakeHolderAta: stakingHolderAta,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      }).instruction()
      let isSuccess = false
      if (IS_MAIN) {
        let latestBlockhash
        try {
          latestBlockhash = await program.provider.connection.getLatestBlockhash('confirmed')
        } catch(e) {
          toast.success(`Failed to get Latest blockhash from chain.`)
          return
        }
        const jitoTransferIns = getJitoTransferJito(wallet.publicKey)
        const messageV0 = new TransactionMessage({
          payerKey: wallet.publicKey,
          recentBlockhash: latestBlockhash.blockhash,
          instructions: [
                jitoTransferIns,
                sellTokenIns,
          ]
        }).compileToV0Message()
        const versionTx = new VersionedTransaction(messageV0)
        const signedVersionTransaction = await wallet.signTransaction(versionTx)
        isSuccess = await sendTransactionWithJito(program.provider.connection, signedVersionTransaction)
      } else {
        let latestBlockhash
        try{
          latestBlockhash = await program.provider.connection.getLatestBlockhash('confirmed')
        }catch(e) {
          toast.success(`Failed to get Latest blockhash from chain.`)
          return
        }
        const tx = new Transaction()
        tx.add(sellTokenIns)
        tx.recentBlockhash = latestBlockhash.blockhash
        tx.feePayer = wallet.publicKey
        const signedTx = await wallet.signTransaction(tx)
        try {
          await sendAndConfirmRawTransaction(
            program.provider.connection,
            signedTx.serialize(), {commitment :'confirmed'})
          isSuccess = true
        } catch (e) {
          console.log(e)
          isSuccess = false
        }
      }

      if (isSuccess){
        toast.success('Stake token successfully.')
      } else {
        toast.error(`Failed to stake token!`)
      }
    } catch (e) {
      toast.error(`Failed to stake token!`)
    }
  }

  const unstake = async () => {
    if (!wallet || !connection) {
      toast.error("Please connect wallet first.")
      return
    }
    try {
      const stakingToken = new PublicKey(STAKING_TOKEN)
      const program = getAnchorProgram(connection, wallet)

      const [ config ] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      )
      const [ stakingHolder ] = PublicKey.findProgramAddressSync(
        [Buffer.from("stake_holder"), stakingToken.toBuffer()],
        program.programId
      )
      const stakingHolderAta = getAssociatedTokenAddressSync(stakingToken, stakingHolder, true)
      const [ userStakeInfo ] = PublicKey.findProgramAddressSync(
        [Buffer.from("user_stake_info"),
         stakingToken.toBuffer(),
         wallet.publicKey.toBuffer(),
        ],
        program.programId
      )
      const userAta = getAssociatedTokenAddressSync(stakingToken, wallet.publicKey)

      const sellTokenIns = await program.methods.unstake({
        amount: new BN(Number(amount) * 1000000000),
      }).accounts({
        user: wallet.publicKey,
        stakeTokenMint: stakingToken,
        config,
        stakeHolder: stakingHolder,
        userStakeInfo: userStakeInfo,
        userAta: userAta,
        stakeHolderAta: stakingHolderAta,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      }).instruction()
      let isSuccess = false
      if (IS_MAIN) {
        let latestBlockhash
        try {
          latestBlockhash = await program.provider.connection.getLatestBlockhash('confirmed')
        } catch(e) {
          toast.success(`Failed to get Latest blockhash from chain.`)
          return
        }
        const jitoTransferIns = getJitoTransferJito(wallet.publicKey)
        const messageV0 = new TransactionMessage({
          payerKey: wallet.publicKey,
          recentBlockhash: latestBlockhash.blockhash,
          instructions: [
                jitoTransferIns,
                sellTokenIns,
          ]
        }).compileToV0Message()
        const versionTx = new VersionedTransaction(messageV0)
        const signedVersionTransaction = await wallet.signTransaction(versionTx)
        isSuccess = await sendTransactionWithJito(program.provider.connection, signedVersionTransaction)
      } else {
        let latestBlockhash
        try{
          latestBlockhash = await program.provider.connection.getLatestBlockhash('confirmed')
        }catch(e) {
          toast.success(`Failed to get Latest blockhash from chain.`)
          return
        }
        const tx = new Transaction()
        tx.add(sellTokenIns)
        tx.recentBlockhash = latestBlockhash.blockhash
        tx.feePayer = wallet.publicKey
        const signedTx = await wallet.signTransaction(tx)
        try {
          await sendAndConfirmRawTransaction(
            program.provider.connection,
            signedTx.serialize(), {commitment :'confirmed'})
          isSuccess = true
        } catch (e) {
          console.log(e)
          isSuccess = false
        }
      }

      if (isSuccess){
        toast.success('Unstaked token successfully.')
      } else {
        toast.error(`Failed to unstake token!`)
      }
    } catch (e) {
      toast.error(`Failed to unstake token!`)
    }
  }

  const claim = async () => {
    if (!wallet || !connection) {
      toast.error("Please connect wallet first.")
      return
    }
    try {
      const stakingToken = new PublicKey(STAKING_TOKEN)
      const program = getAnchorProgram(connection, wallet)

      const [ config ] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      )
      const [ stakingHolder ] = PublicKey.findProgramAddressSync(
        [Buffer.from("stake_holder"), stakingToken.toBuffer()],
        program.programId
      )
      const stakingHolderAta = getAssociatedTokenAddressSync(stakingToken, stakingHolder, true)
      const [ userStakeInfo ] = PublicKey.findProgramAddressSync(
        [Buffer.from("user_stake_info"),
         stakingToken.toBuffer(),
         wallet.publicKey.toBuffer(),
        ],
        program.programId
      )
      const userAta = getAssociatedTokenAddressSync(stakingToken, wallet.publicKey)

      const sellTokenIns = await program.methods.claim().accounts({
        user: wallet.publicKey,
        stakeTokenMint: stakingToken,
        config,
        stakeHolder: stakingHolder,
        userStakeInfo: userStakeInfo,
        userAta: userAta,
        stakeHolderAta: stakingHolderAta,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      }).instruction()
      let isSuccess = false
      if (IS_MAIN) {
        let latestBlockhash
        try {
          latestBlockhash = await program.provider.connection.getLatestBlockhash('confirmed')
        } catch(e) {
          toast.success(`Failed to get Latest blockhash from chain.`)
          return
        }
        const jitoTransferIns = getJitoTransferJito(wallet.publicKey)
        const messageV0 = new TransactionMessage({
          payerKey: wallet.publicKey,
          recentBlockhash: latestBlockhash.blockhash,
          instructions: [
                jitoTransferIns,
                sellTokenIns,
          ]
        }).compileToV0Message()
        const versionTx = new VersionedTransaction(messageV0)
        const signedVersionTransaction = await wallet.signTransaction(versionTx)
        isSuccess = await sendTransactionWithJito(program.provider.connection, signedVersionTransaction)
      } else {
        let latestBlockhash
        try{
          latestBlockhash = await program.provider.connection.getLatestBlockhash('confirmed')
        }catch(e) {
          toast.success(`Failed to get Latest blockhash from chain.`)
          return
        }
        const tx = new Transaction()
        tx.add(sellTokenIns)
        tx.recentBlockhash = latestBlockhash.blockhash
        tx.feePayer = wallet.publicKey
        const signedTx = await wallet.signTransaction(tx)
        try {
          await sendAndConfirmRawTransaction(
            program.provider.connection,
            signedTx.serialize(), {commitment :'confirmed'})
          isSuccess = true
        } catch (e) {
          console.log(e)
          isSuccess = false
        }
      }

      if (isSuccess){
        toast.success('Unstaked token successfully.')
      } else {
        toast.error(`Failed to unstake token!`)
      }
    } catch (e) {
      toast.error(`Failed to unstake token!`)
    }
  }


  return (
    <div className="mx-auto w-[800px] flex flex-col mt-[70px]">
      <h1 className="text-center text-white text-[36px]">$PXP STAKING</h1>
      <div className="grid grid-cols-3 mt-[20px] border-2 border-[#6e6e6e] p-3">
        <div className="col-span-1 flex flex-col gap-y-[10px]">
          <p className="text-[#c2c2c2] text-[20px]">STAKERS</p>
          <p className="text-white text-[20px]">{stakerCount ?? '0'}</p>
        </div>
        <div className="col-span-1 flex flex-col gap-y-[10px]">
          <p className="text-[#c2c2c2] text-[20px]">TOTAL $PXP STAKED</p>
          <p className="text-white text-[20px]">{numberWithCommas(stakeInfo?.totalStake ?? 0)} PXP</p>
        </div>
        <div className="col-span-1 flex flex-col gap-y-[10px]">
          <p className="text-[#c2c2c2] text-[20px]">TOTAL REWARDS</p>
          <p className="text-white text-[20px]">{numberWithCommas(stakeInfo?.rewardAmount ?? 0)} SOL</p>
        </div>
      </div>
      <div className="flex mt-[20px] border-2 border-[#6e6e6e] p-3">
        <div className="flex flex-col gap-y-[10px]">
          <p className="text-[#c2c2c2] text-[20px]">YOUR STAKED PXP</p>
          <p className="text-white text-[20px]">{numberWithCommas(stakTokenBalance?.stakeAmount??0)} PXP</p>
        </div>
      </div>
      <div className="flex justify-between mt-[20px] border-2 border-[#6e6e6e] p-3">
        <div className="flex flex-col gap-y-[10px]">
          <p className="text-[#c2c2c2] text-[20px] text-left">YOUR REWARDS</p>
          <p className="text-white text-[20px] text-left">- SOL</p>
        </div>
        <div className="flex items-center">
          <button
            className={`col-span-1 border-2 border-white text-white border-solid py-1 text-[10px] font-normal cursor-pointer w-[200px]`}
            style={{fontFamily:'wf_56906c412d2a453f907c10dd5'}}
            onClick={() => claim()}
          >
            CLAIM
          </button>
        </div>
      </div>
      <div className="flex justify-between mt-[20px] gap-x-[20px]">
        <button
          className={`flex-1 border-2 ${stakeTab ? 'border-white text-white' :'border-[#6e6e6e] text-[#6e6e6e]'} border-solid py-1 text-[10px] font-normal cursor-pointer w-[200px]`}
          style={{fontFamily:'wf_56906c412d2a453f907c10dd5'}}
          onClick={() => setStakeTab(true)}
        >
          STAKE
        </button>
        <button
          className={`flex-1 border-2 ${!stakeTab ? 'border-white text-white' :'border-[#6e6e6e] text-[#6e6e6e]'} border-solid py-1 text-[10px] font-normal cursor-pointer w-[200px]`}
          style={{fontFamily:'wf_56906c412d2a453f907c10dd5'}}
          onClick={() => setStakeTab(false)}
        >
          UNSTAKE
        </button>
      </div>
      <div className="flex flex-col mt-[20px] border-2 border-[#6e6e6e] p-4">
        <div className="flex gap-x-[10px]">
          <p className="text-[#c2c2c2] text-[23px]">YOUR BALANCE:</p>
          <p className="text-white text-[22px]">{numberWithCommas(stakTokenBalance?.balance??0)} PXP</p>
        </div>
        <div className="flex justify-between border border-[#6e6e6e] p-2 mt-[10px]">
          <input
            type="text"
            className="flex-1 outline-none text-white text-[27px] bg-transparent"
            value={amount}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g,'')
              setAmount(value)
            }}
          />
          <p className="text-[#c2c2c2] text-[27px]">PXP</p>
        </div>
        <div className="flex justify-center mt-[20px]">
          <button
            className="border-2 border-[#EDFF02] text-[#EDFF02] cursor-pointer w-[300px] py-1 text-[10px]"
            style={{fontFamily:'wf_56906c412d2a453f907c10dd5'}}
            onClick={() => {
              stakeTab ? stake() : unstake()
            }}
          >
            {stakeTab?'STAKE':'UNSTAKE'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(StakingPage)