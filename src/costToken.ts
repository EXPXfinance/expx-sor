import { BaseProvider } from '@ethersproject/providers';
import { BigNumber } from './utils/bignumber';
import { EONE } from './emath';
import fetch from 'isomorphic-fetch';

export async function getTokenWeiPrice(
    TokenSymbol: string,
    requestUrl: string
): Promise<BigNumber> {
    const priceWbnb = (
        await fetch(`${requestUrl}/token/prices/wbnb?tokens=${TokenSymbol}`)
    ).json()[TokenSymbol];
    return priceWbnb.times(EONE);
}

export function calculateTotalSwapCost(
    TokenPrice: BigNumber,
    SwapCost: BigNumber,
    GasPriceWei: BigNumber
): BigNumber {
    return GasPriceWei.times(SwapCost)
        .times(TokenPrice)
        .div(EONE);
}

export async function getCostOutputToken(
    TokenSymbol: string,
    GasPriceWei: BigNumber,
    SwapGasCost: BigNumber,
    Provider: BaseProvider,
    requestUrl: string
): Promise<BigNumber> {
    let tokenPrice = await getTokenWeiPrice(TokenSymbol, requestUrl);

    let costOutputToken = calculateTotalSwapCost(
        tokenPrice,
        SwapGasCost,
        GasPriceWei
    );

    return costOutputToken;
}
