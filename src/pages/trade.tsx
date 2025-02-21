import { memo, useState, useCallback, useEffect, useMemo } from 'react'
import { useBondingCurveInfo } from '../hooks'
import { useParams } from "react-router-dom"
import ArrowDown from '../assets/arrow-down.svg?react'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'
import { toast } from 'react-toastify'
import { getAnchorProgram } from '../constants/anchor'
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
  getAccount,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token'
import { BN } from '@coral-xyz/anchor'
import { FEE_RECIPIENT, IS_MAIN, PROGRAM_ID } from '../constants'
import { getJitoTransferJito, sendTransactionWithJito } from '../utils/jito'
import { useTokenInfo, useSolPrice, useHolder } from '../hooks'
import { getMarketCap, getBondingCurvePercent, getSolAmount, shortenAddress } from '../utils'

const Trade = () => {
  const { tokenMint } = useParams()
  const wallet = useAnchorWallet()
  const { connection } = useConnection()
  const [isBuy, setIsBuy] = useState(true)
  const [inputSol, setInputSol] = useState('0')
  const [inputToken, setInputToken] = useState('0')
  const [tokenAmount, setTokenAmount] = useState('0')
  const [tokenOutputAmount, setTokenOutputAmount] = useState('0')
  const [solOutputAmount, setSolOutputAmount] = useState('0')
  const [minSolOutputAmount, setMinSolOutputAmount] = useState('0')
  const { data: tokenInfo } = useTokenInfo(tokenMint!)
  const { data:holders } = useHolder(tokenMint!)
  const { data: solPrice } = useSolPrice()

  const handleAmountChange = useCallback((value: any) => {
    const regex = /^\d*[\.\,]?\d{0,8}$/
    if (regex.test(value) || value === '') {
      setInputSol(value)
    }
  }, [setInputSol])

  const handleTokenAmountChange = useCallback((value: any) => {
    const regex = /^\d*[\.\,]?\d{0,8}$/
    if (regex.test(value) || value === '') {
      setInputToken(value)
    }
  }, [setInputToken])

  const { bondingCurveInfo } = useBondingCurveInfo(tokenMint)
  useEffect(() => {
    if (!bondingCurveInfo) return
    const inputSolAmount = BigInt(Number(inputSol) * 1000000000)
    const virtualSolReserves = BigInt(bondingCurveInfo.virtualSolReserves.toString())
    const virtualTokenReserves = BigInt(bondingCurveInfo.virtualTokenReserves.toString())
    const realTokenReserves = BigInt(bondingCurveInfo.realTokenReserves.toString())
    const K = virtualSolReserves * virtualTokenReserves
    let tokenAmount = virtualTokenReserves - K / (virtualSolReserves + inputSolAmount) - BigInt(1)
    tokenAmount = tokenAmount > realTokenReserves ? realTokenReserves : tokenAmount
    setTokenOutputAmount(tokenAmount.toString())
    setTokenAmount((tokenAmount / BigInt(1000000)).toString())

  }, [ inputSol, bondingCurveInfo ])

  const bondingCurveAddr = useMemo(() => {
    if (!tokenMint) return ''
    const tokenMintPubkey = new PublicKey(tokenMint)
    const [ bondingCurve ]= PublicKey.findProgramAddressSync(
      [Buffer.from('bonding_curve'), tokenMintPubkey.toBuffer()],
      new PublicKey(PROGRAM_ID)
    )
    return getAssociatedTokenAddressSync(tokenMintPubkey, bondingCurve, true).toBase58()
  }, [tokenMint])

  useEffect(() => {
    if (!bondingCurveInfo) return
    const inputTokenAmount = BigInt(Number(inputToken) * 1000000)
    const virtualSolReserves = BigInt(bondingCurveInfo.virtualSolReserves.toString())
    const virtualTokenReserves = BigInt(bondingCurveInfo.virtualTokenReserves.toString())
    let outputSolAmount = inputTokenAmount * virtualSolReserves / (virtualTokenReserves + inputTokenAmount)
    outputSolAmount = outputSolAmount - outputSolAmount/BigInt(100)

    const minSolOutput = outputSolAmount * BigInt(90) / BigInt(100)
    setSolOutputAmount((Number(outputSolAmount.toString()) / Number(1000000000)).toFixed(3))
    setMinSolOutputAmount(minSolOutput.toString())

  }, [ inputToken, bondingCurveInfo ])

  const buyToken = async () => {
    if (!wallet || !tokenMint) {
      toast.error("Please connect wallet first.")
      return
    }
    try {
      const tokenMintPubkey = new PublicKey(tokenMint)
      const program = getAnchorProgram(connection, wallet)
      const [ config ] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      )
      const [ bonding_curve ]= PublicKey.findProgramAddressSync(
        [Buffer.from('bonding_curve'), tokenMintPubkey.toBuffer()],
        program.programId
      )
      const assiciated_bonding_curve = getAssociatedTokenAddressSync(tokenMintPubkey, bonding_curve, true)
      const inputSolAmount = BigInt(Number(inputSol) * 1000000000) * BigInt(110) / BigInt(100)

      const associatedUserToken = getAssociatedTokenAddressSync(tokenMintPubkey, wallet.publicKey)
      let createAssociatedUserTokenIns
      try {
        await getAccount(connection, associatedUserToken, 'confirmed', TOKEN_PROGRAM_ID)
      } catch(error: unknown) {
        if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
          createAssociatedUserTokenIns = createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            associatedUserToken,
            wallet.publicKey,
            tokenMintPubkey,
          )
        }
      }
      const feeRecipient = new PublicKey(FEE_RECIPIENT)
      const buyTokenIns = await program.methods.buy({
        amount: new BN(tokenOutputAmount.toString()),
        maxSolCost: new BN(inputSolAmount.toString())
      }).accounts({
        user: wallet.publicKey,
        tokenMint: tokenMintPubkey,
        config,
        feeRecipient,
        bondingCurve: bonding_curve,
        associtedBondingCurve: assiciated_bonding_curve,
        associtedUserTokenAccount: associatedUserToken,
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
          instructions:
          createAssociatedUserTokenIns
            ? [
                jitoTransferIns,
                createAssociatedUserTokenIns,
                buyTokenIns,
              ]
            : [
                jitoTransferIns,
                buyTokenIns,
              ]
        }).compileToV0Message()
        const versionTx = new VersionedTransaction(messageV0)
        const signedVersionTransaction = await wallet.signTransaction(versionTx)
        isSuccess = await sendTransactionWithJito(program.provider.connection, signedVersionTransaction)
      } else {
        let latestBlockhash
        try {
          latestBlockhash = await program.provider.connection.getLatestBlockhash('confirmed')
        } catch(e) {
          toast.success(`Failed to get Latest blockhash from chain.`)
          return
        }
        const tx = new Transaction()
        if (createAssociatedUserTokenIns) {
          tx.add(createAssociatedUserTokenIns, buyTokenIns)
        } else {
          tx.add(buyTokenIns)
        }
        tx.recentBlockhash = latestBlockhash.blockhash
        tx.feePayer = wallet.publicKey
        const signedTx = await wallet.signTransaction(tx)
        try {
          await sendAndConfirmRawTransaction(program.provider.connection, signedTx.serialize(), {commitment :'confirmed'})
          isSuccess = true
        } catch (e) {
          console.log(e)
          isSuccess = false
        }
      }

      if (isSuccess){
        toast.success('Bought token successfully.')
      } else {
        toast.error(`Failed to buy token!`)
      }
    } catch (e) {
      toast.error(`Failed to buy token!`)
    }
  }

  const sellToken = async () => {
    if (!wallet || !tokenMint) {
      toast.error("Please connect wallet first.")
      return
    }
    try {
      const tokenMintPubkey = new PublicKey(tokenMint)
      const program = getAnchorProgram(connection, wallet)
      const [ config ] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      )
      const [ bonding_curve ]= PublicKey.findProgramAddressSync(
        [Buffer.from('bonding_curve'), tokenMintPubkey.toBuffer()],
        program.programId
      )
      const assiciated_bonding_curve = getAssociatedTokenAddressSync(tokenMintPubkey, bonding_curve, true)
      const associatedUserToken = getAssociatedTokenAddressSync(tokenMintPubkey, wallet.publicKey)
      const feeRecipient = new PublicKey(FEE_RECIPIENT)
      const sellTokenIns = await program.methods.sell({
        amount: new BN(Number(inputToken) * 1000000),
        minSolOutput: new BN(minSolOutputAmount)
      }).accounts({
        user: wallet.publicKey,
        tokenMint: tokenMintPubkey,
        config,
        feeRecipient,
        bondingCurve: bonding_curve,
        associtedBondingCurve: assiciated_bonding_curve,
        associtedUserTokenAccount: associatedUserToken,
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
          await sendAndConfirmRawTransaction(program.provider.connection, signedTx.serialize(), {commitment :'confirmed'})
          isSuccess = true
        } catch (e) {
          console.log(e)
          isSuccess = false
        }
      }

      if (isSuccess){
        toast.success('Sold token successfully.')
      } else {
        toast.error(`Failed to sell token!`)
      }
    } catch (e) {
      toast.error(`Failed to sell token!`)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-[70px] mb-[100px] lg:mb-0">
      <div className="col-span-1">

      </div>
      <div className="flex flex-col col-span-1">
        <div className="flex border-2 border-[#6e6e6e] p-2 lg:h-[20vh] gap-x-3">
          <div className="h-full aspect-square bg-white">
            <img src={tokenInfo?.imageUri} width="100%" height="100%" />
          </div>
          <div className="flex flex-1 flex-col justify-between">
            <div className="flex justify-between">
              <div className="flex flex-col">
                <p className="text-white text-[25px] text-left">{tokenInfo?.name}</p>
                <p className="text-[25px] text-[#c2c2c2] text-left">{tokenInfo?.symbol}</p>
              </div>
              <div className="flex gap-3">
                {tokenInfo?.website &&
                <a
                  className="border-2 border-[#6e6e6e] w-[43px] h-[43px] flex items-center justify-center bg-transparent"
                  target="_blank"
                  href={tokenInfo.website}
                >
                  <img src="/imgs/globe-icon.png" width={24} height={24} alt="website-logo" />
                </a>
                }
                {tokenInfo?.twitter &&
                <a
                  className="border-2 border-[#6e6e6e] w-[43px] h-[43px] flex items-center justify-center bg-transparent"
                  target="_blank"
                  href={tokenInfo.twitter}
                >
                  <img src="/imgs/x-logo.webp" width={24} height={24} alt="twitter-logo" />
                </a>
                }
                {tokenInfo?.telegram &&
                <a
                  className="border-2 border-[#6e6e6e] w-[43px] h-[43px] flex items-center justify-center bg-transparent"
                  target="_blank"
                  href={tokenInfo.telegram}
                >
                  <img src="/imgs/telegram.png" width={24} height={24} alt="telegram-logo" />
                </a>
                }
              </div>
            </div>
            <div className="flex justify-between">
                <div className="flex flex-col">
                  <p className="text-[19px] text-[#c2c2c2]">MCAP</p>
                  <p className="text-white text-[23px]">{solPrice && getMarketCap(tokenInfo?.solAmount??0, tokenInfo?.soldTokenAmount??0, solPrice)}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-[19px] text-[#c2c2c2] text-right">LOCKED PIXELS</p>
                  <p className="text-white text-[19px] text-right">0/900</p>
                </div>
            </div>
          </div>
        </div>
        <div className="border-2 border-[#6e6e6e] p-1.5 h-[28px] mt-2">
          <div
            className="bg-[#EDFF02] h-full"
            style={{width: `${getBondingCurvePercent(tokenInfo?.solAmount??0)}%`}}
          />
        </div>
        <div className="flex justify-center">
          <p className="text-white text-[19px] my-2">{`${getSolAmount(tokenInfo?.solAmount??0)}/85 SOL { ${getBondingCurvePercent(tokenInfo?.solAmount??0)}% }`}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:h-[34vh]">
          <div className="flex flex-col col-span-1 border-2 border-[#6e6e6e] p-2">
            <div className="grid grid-cols-2 gap-x-3">
              <button
                className={`col-span-1 border-2 ${isBuy?'border-[#EDFF02] text-[#EDFF02]':'border-[#6e6e6e] text-white'} border-solid py-1 text-[10px] font-normal cursor-pointer`}
                style={{fontFamily:'wf_56906c412d2a453f907c10dd5'}}
                onClick={()=>setIsBuy(true)}
              >
                BUY
              </button>
              <button
                className={`col-span-1 border-2 ${!isBuy?'border-[#EDFF02] text-[#EDFF02]':'border-[#6e6e6e] text-white'} border-solid py-1 text-[10px] font-normal cursor-pointer`}
                style={{fontFamily:'wf_56906c412d2a453f907c10dd5'}}
                onClick={()=>setIsBuy(false)}
              >
                SELL
              </button>
            </div>
            <div className="flex mt-[20px] justify-between items-center border border-[#6e6e6e]">
              <div className="flex-1">
                {isBuy && <input
                  type="text"
                  className="w-full outline-none border-none bg-transparent py-2 px-4 text-white text-[22px]"
                  value={inputSol}
                  onChange={(e)=>handleAmountChange(e.target.value)}
                /> }
                {!isBuy && <input
                  type="text"
                  className="w-full outline-none border-none bg-transparent py-2 px-4 text-white text-[22px]"
                  value={inputToken}
                  onChange={(e)=>handleTokenAmountChange(e.target.value)}
                /> }
              </div>
              <div className="flex border border-[#6e6e6e] m-1 p-2 w-[43px] h-[43px]">
                {isBuy &&<img src="/imgs/solana.png" alt="solana-logo" width={24} height={24}/> }
                {!isBuy &&<img src="/imgs/logo.png" alt="token-logo" width={24} height={24}/> }
              </div>
            </div>
            <div className="flex justify-center my-[10px]">
              <ArrowDown className="w-[20px] h-[20px] text-white rotate-[270deg]" />
            </div>
            <div className="flex justify-between items-center border border-[#6e6e6e]">
              <div className="flex-1">
                {isBuy && <input
                  type="text"
                  className="w-full outline-none border-none bg-transparent py-2 px-4 text-white text-[22px]"
                  value={tokenAmount}
                />}
                {!isBuy && <input
                  type="text"
                  className="w-full outline-none border-none bg-transparent py-2 px-4 text-white text-[22px]"
                  value={solOutputAmount}
                />}
              </div>
              <div className="flex border border-[#6e6e6e] m-1 p-2 w-[43px] h-[43px]">
                {isBuy && <img src="/imgs/logo.png" alt="token-logo" width={24} height={24}/>}
                {!isBuy && <img src="/imgs/solana.png" alt="solana-logo" width={24} height={24}/>}
              </div>
            </div>
            <div className="flex w-full">
              <button
                className="w-full my-4 border-2 border-[#EDFF02] border-solid py-1 text-[#EDFF02] text-[10px] font-normal cursor-pointer"
                style={{fontFamily:'wf_56906c412d2a453f907c10dd5'}}
                onClick={()=> {
                  isBuy ? buyToken() : sellToken()
                }}
              >
                CONFIRM
              </button>
            </div>
          </div>
          <div className="flex flex-col col-span-1 border-2 border-[#6e6e6e] py-2 px-4">
            <div className="flex w-full">
              <button
                className="w-full border-2 border-[#c2c2c2] border-solid py-1 text-[#c2c2c2] text-[10px] font-normal cursor-pointer"
                style={{fontFamily:'wf_56906c412d2a453f907c10dd5'}}
              >
                TOP HOLDERS
              </button>
            </div>
            <div className="flex flex-col gap-y-[16px] mt-[25px]">
              {
                holders && holders.filter(holder => {
                  return Number(holder.amount) > 0
                }).map((holder, index) => (
                <div key={`holder-${index}`} className="flex justify-between">
                  <p className={`${bondingCurveAddr === holder.address ? 'text-[#EDFF02]': 'text-white'} text-[15px]`}>
                    {bondingCurveAddr === holder.address ? 'BONDING CURVE': shortenAddress(holder.address)}
                  </p>
                  <p className={`${bondingCurveAddr === holder.address ? 'text-[#EDFF02]': 'text-white'} text-[15px]`}>
                    {Number((Number(holder.amount)/10000000000000).toFixed(2))}%
                  </p>
                </div>
                ))
              }
            </div>
          </div>
        </div>
        <div className="flex flex-col border-2 border-[#6e6e6e] items-start p-4 mt-4 lg:h-[15vh]">
          <p className="text-[#c2c2c2] text-[15px]">CA:</p>
          <p className="text-white text-[15px]">{shortenAddress(tokenMint!)}</p>
          <p className="text-[#c2c2c2] text-[15px] mt-2">CREATOR:</p>
          <p className="text-white text-[15px]">{shortenAddress(tokenInfo?.creator!)}</p>
        </div>
      </div>
    </div>
  )
}

export default memo(Trade)