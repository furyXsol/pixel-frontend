import {
    HistoryCallback,
    IBasicDataFeed,
    LibrarySymbolInfo,
    PeriodParams,
    ResolutionString,
    ResolveCallback
} from '../../charting_library/charting_library'
import { BACKEND_URI } from '../../constants'
import { socket } from "../../hooks";

const configurationData = {
  // Represents the resolutions for bars supported by your datafeed
  supports_search: false,
  supported_resolutions: [
    '1' as ResolutionString,
    '5' as ResolutionString,
    '240' as ResolutionString,
    '1D' as ResolutionString
    // '60' as ResolutionString,
    // '1D' as ResolutionString,
    // '1W' as ResolutionString,
    // '1M' as ResolutionString,
  ],
  // The `exchanges` arguments are used for the `searchSymbols` method if a user selects the exchange
  // exchanges: [],
  // The `symbols_types` arguments are used for the `searchSymbols` method if a user selects this symbol type
  // symbols_types: []
};
var intervalId: any;
var currentResolution: number = 0;
var hasAnyUpdate = false;

const channelToSubscription = new Map();
const lastBarsCache = new Map();
var currentChannelString: string;

interface BarData {
	time?: number,
	open?: number,
	close?: number,
	high?: number,
	low?: number,
	volume?: number,
}

export function resolutionToSeconds(resolution: string) {
  if (resolution == '1D') {
    return 3600 * 24
  } else if (resolution == '1'){
    return 60
  } else if (resolution == '5') {
    return 5 * 60
  } else if (resolution == '240') {
    return 240
  }
  return 60
}

function getNextBarTime(barTime: number) {
	return barTime + currentResolution * 1000;
}

socket.on('chart_data', (data) => {
  const {mint, price, time} = data;
	const subscriptionItem = channelToSubscription.get(mint);
	if (subscriptionItem === undefined) {
		return;
	}
	const lastBar = subscriptionItem.lastBar;
	const nextBarTime = getNextBarTime(lastBar.time);

	let bar: BarData;
	if (time >= nextBarTime) {
		bar = {
			time: nextBarTime,
			open: price,
			high: price,
			low: price,
			close: price,
		};
		console.log('[socket] Generate new bar', bar);
	} else {
		bar = {
			...lastBar,
			high: Math.max(lastBar.high, price),
			low: Math.min(lastBar.low, price),
			close: price,
		};
	}
	subscriptionItem.lastBar = bar;
    hasAnyUpdate = true;

	// Send data to every subscriber of that symbol
	subscriptionItem.handlers.forEach((handler: any) => handler.callback(bar));

})

export function subscribeOnStream(
  tokenMint: any,
  resolution: any,
  onRealtimeCallback: any,
  subscriberUID: any,
  onResetCacheNeededCallback: any,
  lastBar: any
) {
  const handler = {
		id: subscriberUID,
		callback: onRealtimeCallback,
	};
  if (currentResolution !== resolutionToSeconds(resolution)) {
    if (intervalId) {
        clearInterval(intervalId);
    }
    intervalId = setInterval(() => {
        if (!hasAnyUpdate) {
            const subscriptionItem = channelToSubscription.get(currentChannelString);
            if (subscriptionItem === undefined) {
                return;
            }
            const itemLastBar = subscriptionItem.lastBar;
            const nextBarTime = getNextBarTime(itemLastBar.time);
            let bar: BarData;
            bar = {
                open: itemLastBar.close,
                high: itemLastBar.close,
                low: itemLastBar.close,
                close: itemLastBar.close,
                time: nextBarTime,
            };

            subscriptionItem.lastBar = bar;

            // Send data to every subscriber of that symbol
            subscriptionItem.handlers.forEach((handler: any) => handler.callback(bar));
        }
        hasAnyUpdate = false;
    }, resolutionToSeconds(resolution) * 1000);
  }
  currentResolution = resolutionToSeconds(resolution);

  let subscriptionItem = channelToSubscription.get(tokenMint);

  subscriptionItem = {
    subscriberUID,
    resolution,
    lastBar,
    handlers: [handler],
  };
  channelToSubscription.set(tokenMint, subscriptionItem);
  currentChannelString = tokenMint;
}

export function unsubscribeFromStream(subscriberUID: any) {
  // Find a subscription with id === subscriberUID
	for (const channelString of channelToSubscription.keys()) {
		const subscriptionItem = channelToSubscription.get(channelString);
		const handlerIndex = subscriptionItem.handlers
			.findIndex((handler: any) => handler.id === subscriberUID);

		if (handlerIndex !== -1) {
			// Remove from handlers
			subscriptionItem.handlers.splice(handlerIndex, 1);

			if (subscriptionItem.handlers.length === 0) {
				// Unsubscribe from the channel if it was the last handler
				console.log('[unsubscribeBars]: Unsubscribe from streaming. Channel:', channelString);
				// socket.emit('SubRemove', { subs: [channelString] });
				channelToSubscription.delete(channelString);
				break;
			}
		}
	}

	if (intervalId) {
		clearInterval(intervalId);
	}
}

export async function makeApiRequest(
    tokenMint: string,
    resolution: string,
    from: number,
    to: number
) {
  try {
      const url = new URL(`${BACKEND_URI}/tokens/dataseed/${tokenMint}?resolution=${resolution}&from=${from}&to=${to}`);
      const response = await fetch(url.toString());
      return response.json();
  } catch (error: any) {
      throw new Error(`CryptoCompare request error: ${error.status}`);
  }
}


export default class DataFeed implements IBasicDataFeed {
  private tokenMint: string
  constructor(tokenMint: string) {
    this.tokenMint = tokenMint
  }
  onReady(callback: any) {
    console.log('[onReady]: Method call');
    setTimeout(() => callback(configurationData));
  }

  async searchSymbols(
    userInput: string,
    exchange: string,
    symbolType: string,
    onResultReadyCallback: any
  ) {
      console.log('[searchSymbols]: Method call');
  }

  async resolveSymbol(
    symbolName: string,
    onSymbolResolvedCallback: ResolveCallback,
  ) {
      console.log('[resolveSymbol]: Method call', symbolName);
      onSymbolResolvedCallback({
        ticker: symbolName,
        name: symbolName,
        description: symbolName,
        type: 'crypto',
        session: '24x7',
        timezone: 'Etc/UTC',
        exchange: "PIXEL",
        minmov: 1,
        pricescale: 1000000000,
        listed_exchange: 'Pixel',
        has_intraday: true,
        has_daily: true,
        has_weekly_and_monthly: false,
        visible_plots_set: 'ohlc',
        supported_resolutions: configurationData.supported_resolutions,
        volume_precision: 2,
        data_status: 'streaming',
        format: 'price'
      });
  }
  async getBars(
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    periodParams: PeriodParams,
    onHistoryCallback: HistoryCallback,
  ) {
    try {
      const { from, to, firstDataRequest } = periodParams;
      console.log('[getBars]: Method call', symbolInfo, resolution, from, to);

      if (to === 0){
        onHistoryCallback([], {noData: true})
        return
      }

      const data = await makeApiRequest(this.tokenMint, resolution, from, to,);
      if (!data ||  data.length === 0) {
        // "noData" should be set if there is no data in the requested period
        onHistoryCallback([], { noData: true });
        return;
      }
      let bars: any = [];
      data.forEach((bar: any) => {
          if (bar.timestamp >= from && bar.timestamp < to) {
              bars = [
                ...bars,
                {
                  time: bar.timestamp * 1000,
                  low: bar.low,
                  high: bar.high,
                  open: bar.open,
                  close: bar.close,
              }];
          }
      });
      if (firstDataRequest) {
        lastBarsCache.set(this.tokenMint, {
          ...bars[bars.length -1]
        })
      }
      onHistoryCallback(bars, { noData: false });
    } catch (error) {
      console.log('[getBars]: Get error', error);
      // await this.getBars(symbolInfo, resolution, periodParams, onHistoryCallback)
    }
  }
  subscribeBars(
    symbolInfo: any,
    resolution: any,
    onRealtimeCallback: any,
    subscriberUID: any,
    onResetCacheNeededCallback: any
  ) {
      console.log('[subscribeBars]: Method call with subscriberUID:', subscriberUID);
      subscribeOnStream(
        this.tokenMint,
        resolution,
        onRealtimeCallback,
        subscriberUID,
        onResetCacheNeededCallback,
        lastBarsCache.get(this.tokenMint)
      )
  }
  unsubscribeBars(subscriberUID: any) {
    console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID);
    unsubscribeFromStream(subscriberUID);
  }
}