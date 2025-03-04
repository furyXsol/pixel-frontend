export interface TokenInfo {
  mint: string
  name: string
  symbol: string
  uri: string
  imageUri: string
  desc: string
  telegram: string
  twitter: string
  website: string
  creator: string
  solAmount: number
  soldTokenAmount: number
  createdAt: number //seconds
}

export interface HolderInfo {
  address: string
  amount: string
}

export interface StakerCount {
  count: number
}

export interface BuyTokenInfo{
  buyer: string
  sol_amount: number
  symbol: string
}

export enum SortType {
  MARKET_CAP,
  PROGRESS,
  CREATION_TIME
}
