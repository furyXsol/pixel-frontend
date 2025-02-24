export const shortenAddress = (
  address: string,
  length = 6,
  rightLength = length,
) => {
  if (!address) return ''
  return [
    address.slice(0, length),
    rightLength > 0 ? address.slice(rightLength * -1) : '',
  ].join('...')
}

export const getTimeAgo = (passedTimestamp: number): string => {
  if (passedTimestamp < 60) {
    return `1MIN AGO`
  } else if (passedTimestamp < 3600) {
    return `${Math.trunc(passedTimestamp/60)}MIN AGO`
  } else if (passedTimestamp < 86400) {
    return `${Math.trunc(passedTimestamp/3600)}H AGO`
  } else {
    return `${Math.trunc(passedTimestamp/86400)}D AGO`
  }
}

export const getBondingCurvePercent = (solAmount: number): string => {
  if (solAmount >= 85000000000) {
    return '100'
  }
  return Number(((solAmount / 85000000000) * 100).toFixed(2)).toString()
}

export const getSolAmount = (solDecimalAmount: number): number => {
  return Number((solDecimalAmount / 1000000000).toFixed(2))
}

export const getMarketCap = (solAmount: number, soldTokenAmount: number, solPrice: number):string => {
  if (Number(soldTokenAmount) == 0 || soldTokenAmount == 0 || solPrice == 0){
    return "0";
  }
  // const marketCap = 1000000000 * ((Number(solAmount) / 1000000000) / (Number(soldTokenAmount) / 1000000)) * solPrice;
  const marketCap = (BigInt(1000000) * BigInt(solAmount) * BigInt(Math.floor(solPrice * 1000))) / (BigInt(soldTokenAmount) * BigInt(1000))
  const numMarketCap = Number(marketCap.toString())
  if (numMarketCap >= 1000000) {
    return `${Number((numMarketCap / 1000000).toFixed(2))}M`
  }else if ( marketCap >= 1000) {
    return `${Number((numMarketCap / 1000).toFixed(2))}K`
  } else {
    return `${Number(numMarketCap.toFixed(2))}`
  }
}

export const numberWithCommas = (x: number): string => {
  return x.toLocaleString('en-US')
}