import {swapHandler} from "./xyk.js";
import {formatAccount, formatAmount, formatUsdValue, isWhale, usdValue} from "../currencies.js";
import {broadcast} from "../discord.js";
import {usdCurrencyId} from "../config.js";
import {emojify} from "../utils/emojify.js";
import {notInRouter} from "./router.js";

export default function omnipoolHandler(events) {
  events
    .onFilter('omnipool', 'SellExecuted', notInRouter, sellHandler)
    .onFilter('omnipool', 'BuyExecuted', notInRouter, buyHandler)
    .on('omnipool', 'LiquidityAdded', liquidityAddedHandler)
    .on('omnipool', 'LiquidityRemoved', liquidityRemovedHandler);
}

export async function sellHandler({event}) {
  const {who, assetIn, assetOut, amountIn, amountOut} = event.data;
  return swapHandler({who, assetIn, assetOut, amountIn, amountOut}, emojify(who));
}

export async function buyHandler({event}) {
  const {who, assetIn, assetOut, amountIn, amountOut} = event.data;
  return swapHandler({who, assetIn, assetOut, amountIn, amountOut}, emojify(who));
}

async function liquidityAddedHandler({event}) {
  const {who, assetId: currencyId, amount} = event.data;
  const added = {currencyId, amount};
  const value = currencyId.toString() !== usdCurrencyId ? usdValue(added) : null;
  const message = `💦 omnipool hydrated with **${formatAmount(added)}**${formatUsdValue(value)} by ${formatAccount(who, isWhale(value), emojify(who))}`;
  broadcast(message);
}

async function liquidityRemovedHandler({event, siblings}) {
  const {who, assetId: currencyId} = event.data;
  const transfers = siblings
    .slice(0, siblings.indexOf(event))
    .reverse()
    .filter(({method, data: {to}}) => method === 'Transferred' && to.toString() === who.toString());
  let asset = transfers[0].data;
  let lrna = '';
  if (asset.currencyId.toNumber() === 1) {
    lrna = ' + ' + formatAmount(asset);
    asset = transfers[1].data;
  }
  const value = currencyId.toString() !== usdCurrencyId ? usdValue(asset) : null;
  const message = `🚰 omnipool dehydrated of **${formatAmount(asset)}**${formatUsdValue(value)}${lrna} by ${formatAccount(who, isWhale(value), emojify(who))}`;
  broadcast(message);
}
