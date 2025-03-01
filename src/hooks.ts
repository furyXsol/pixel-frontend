import { PublicKey } from '@solana/web3.js'
import { PROGRAM_ID } from './constants'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'
import { getAnchorProgram } from './constants/anchor'
import { useEffect, useState } from 'react'
import { BN } from '@coral-xyz/anchor'
import { useQuery } from '@tanstack/react-query'
import { BACKEND_SOCKET, BACKEND_URI, IS_MAIN, SOLANA_DEV_RPC, SOLANA_MAIN_RPC, STAKING_TOKEN } from './constants'
import axios from 'axios'
import { TokenInfo, HolderInfo, StakerCount } from './types'
import { getAccount, getAssociatedTokenAddressSync } from '@solana/spl-token'
import { io } from 'socket.io-client'
import { useWallet } from '@solana/wallet-adapter-react'

export const socket = io(BACKEND_SOCKET, {
  autoConnect: true
})

export const useTokenInfo = (tokenMint: string) => {
  const { data, isLoading } = useQuery({
    queryKey: [
      'tokenInfo',
      tokenMint,
    ],
    queryFn: async () => {
      try {
        const res = await axios.get(`${BACKEND_URI}/tokens/${tokenMint}`)
        if (!res || !res.data) {
          return null
        }
        const resToken: TokenInfo = res.data
        return resToken
      } catch(e) {
        console.log(e)
        return null
      }
    },
  })
  return { data, isLoading}
}
export const useSolPrice = () => {
  const { data, isLoading } = useQuery({
    queryKey: [
      'sol-price',
    ],
    queryFn: async () => {
      try {
        const apiURL = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
        const res = await axios.get(apiURL)
        if (!res || !res.data) {
          return null
        }
        const solPrice = res.data.solana.usd;
        return Number(solPrice)
      } catch(e) {
        console.log(e)
        return null
      }
    },
    refetchInterval: 5000 // every 5 seconds
  })
  return { data, isLoading}
}

export const useBondingCurveTokens = () => {
  const { data, isLoading } = useQuery({
    queryKey: [
      'bonding-curves',
    ],
    queryFn: async () => {
      try {
        const res = await axios.get(`${BACKEND_URI}/tokens`)
        if (!res || !res.data) {
          return []
        }
        const resTokens: TokenInfo[] = res.data
        return resTokens
      } catch(e) {
        console.log(e)
        return []
      }
    },
    refetchInterval: 5000 // every 5 seconds
  })
  return { data, isLoading}
}

export const useLaunchedTokens = () => {
  const { data, isLoading } = useQuery({
    queryKey: [
      'launched-tokens',
    ],
    queryFn: async () => {
      try {
        const res = await axios.get(`${BACKEND_URI}/tokens/launched`)
        if (!res || !res.data) {
          return []
        }
        const resTokens: TokenInfo[] = res.data
        return resTokens
      } catch(e) {
        console.log(e)
        return []
      }
    },
    refetchInterval: 5000 // every 5 seconds
  })
  return { data, isLoading}
}

export const useStakerCount = () => {
  const { data, isLoading } = useQuery({
    queryKey: [
      'staker-count',
    ],
    queryFn: async () => {
      try {
        const res = await axios.get(`${BACKEND_URI}/tokens/staker_count`)
        if (!res || !res.data) {
          return undefined
        }
        const resCount: StakerCount = res.data
        return resCount.count
      } catch(e) {
        console.log(e)
        return undefined
      }
    },
    refetchInterval: 10000 // every 10 seconds
  })
  return { data, isLoading}
}

export const useBondingCurveInfo = (tokenMint: string | undefined) => {
  const [bondingCurveInfo, setBondingCurveInfo] = useState<{
    virtualTokenReserves: BN,
    virtualSolReserves: BN,
    realSolReserves: BN,
    realTokenReserves: BN,
  }>()
  const { connection } = useConnection()
  const wallet = useAnchorWallet()
  useEffect(()=>{
    const getBondingCurveInfo = async () => {
      if (!wallet || !tokenMint) return
      const tokenMintPulicKey = new PublicKey(tokenMint)
      const [ bonding_curve ]= PublicKey.findProgramAddressSync(
        [Buffer.from('bonding_curve'), tokenMintPulicKey.toBuffer()],
        new PublicKey(PROGRAM_ID)
      )
      try {
        const program = getAnchorProgram(connection, wallet)
        const info = await program.account.bondingCurve.fetch(bonding_curve)
        setBondingCurveInfo(info)
      } catch {
        return
      }
    }
    getBondingCurveInfo()
  }, [connection, wallet, tokenMint])
  return {
    bondingCurveInfo
  }
}

export const useStakeInfo = () => {
  const { connection } = useConnection()
  const { data, isLoading } = useQuery({
    queryKey: [
      'stake-info',
    ],
    queryFn: async () => {
      if (!connection) return undefined
      try {
        const stakingToken = new PublicKey(STAKING_TOKEN)
        const [ stakingHolder ] = PublicKey.findProgramAddressSync(
          [Buffer.from("stake_holder"), stakingToken.toBuffer()],
          new PublicKey(PROGRAM_ID)
        )
        const program = getAnchorProgram(connection)
        const info = await program.account.stakeHolder.fetch(stakingHolder)
        const rewardAmount = await program.provider.connection.getBalance(stakingHolder, {commitment: 'confirmed'})
        return {
          totalStake: Number((BigInt(info.curentTotalStake.toString()) / BigInt(1000000000)).toString()),
          rewardAmount: Number((rewardAmount / 1000000000).toFixed(2))
        }
      } catch (e) {
        return undefined
      }
    },
    refetchInterval: 10000 // every 10 seconds
  })
  return { data, isLoading}
}

export const useStakeTokenBalance = () => {
  const wallet = useAnchorWallet()
  const { connection } = useConnection()
  const { data, isLoading } = useQuery({
    queryKey: [
      'stake-info',
      wallet,
    ],
    queryFn: async () => {
      if (!wallet || !connection) return undefined
      try {
        const stakingToken = new PublicKey(STAKING_TOKEN)
        const userAta = getAssociatedTokenAddressSync(stakingToken, wallet.publicKey)
        const account = await getAccount(connection, userAta)
        const program = getAnchorProgram(connection)
        const [ userStakeInfoPubkey ] = PublicKey.findProgramAddressSync(
          [Buffer.from("user_stake_info"),
           stakingToken.toBuffer(),
           wallet.publicKey.toBuffer(),
          ],
          program.programId
        )
        const userStakeInfo = await program.account.userStakeInfo.fetch(userStakeInfoPubkey)
        return {
          balance: Number((account.amount / BigInt(1000000000)).toString()),
          stakeAmount: Number((BigInt(userStakeInfo.stakeAmount.toString())/BigInt(1000000000)).toString()),
        }
      } catch (e) {
        return undefined
      }
    },
    refetchInterval: 10000 // every 10 seconds
  })
  return { data, isLoading}
}

export const useHolder = (tokenMint: string | undefined) => {
  const { data, isLoading } = useQuery({
    queryKey: [
      'holder-list',
      tokenMint,
    ],
    queryFn: async () => {
      try {
        if (!tokenMint) return []
        const res = await axios.post(IS_MAIN? SOLANA_MAIN_RPC : SOLANA_DEV_RPC, {
          jsonrpc: "2.0",
          id: 1,
          method: "getTokenLargestAccounts",
          params: [
            tokenMint
          ]
        })
        if(res && res.data && res.data.result){
          return res.data.result.value.map(( value: any) => {
            return {
              address: value.address,
              amount: value.amount
            }
          }) as HolderInfo[]
        }
        return []

      } catch(e) {
        console.log(e)
        return []
      }
    },
    refetchInterval: 5000 // every 5 seconds
  })
  return { data, isLoading}
}

export const useBalance = () => {
  const { connection } = useConnection()
  const { publicKey: address } = useWallet()

   const { data, isLoading } = useQuery({
    queryKey: [
      'sol-balance',
      address,
    ],
    queryFn: async () => {
      if (!address || !connection) return undefined
      try {
        const balance = await connection.getBalance(address)
        return balance
      } catch (e) {
        return undefined
      }
    },
    refetchInterval: 10000 // every 10 seconds
  })
  return { data, isLoading}
}