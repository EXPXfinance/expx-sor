import { BigNumber } from './utils/bignumber';

export const EONE = new BigNumber(10).pow(18);
export const TWOEONE = EONE.times(new BigNumber(2));
const EPOW_PRECISION = EONE.idiv(new BigNumber(10).pow(10));

export const MAX_IN_RATIO = EONE.times(new BigNumber(0.499999999999999)); // Leave some room for bignumber rounding errors
export const MAX_OUT_RATIO = EONE.times(new BigNumber(0.333333333333333)); // Leave some room for bignumber rounding errors

export function scale(input: BigNumber, decimalPlaces: number): BigNumber {
    const scalePow = new BigNumber(decimalPlaces.toString());
    const scaleMul = new BigNumber(10).pow(scalePow);
    return input.times(scaleMul);
}

export function bnum(val: string | number | BigNumber): BigNumber {
    return new BigNumber(val.toString());
}

export function calcOutGivenIn(
    tokenBalanceIn: BigNumber,
    tokenWeightIn: BigNumber,
    tokenBalanceOut: BigNumber,
    tokenWeightOut: BigNumber,
    tokenAmountIn: BigNumber,
    swapFee: BigNumber
): BigNumber {
    let weightRatio = eDiv(tokenWeightIn, tokenWeightOut);
    let adjustedIn = EONE.minus(swapFee);
    adjustedIn = eMul(tokenAmountIn, adjustedIn);
    let y = eDiv(tokenBalanceIn, tokenBalanceIn.plus(adjustedIn));
    let foo = ePow(y, weightRatio);
    let bar = EONE.minus(foo);
    let tokenAmountOut = eMul(tokenBalanceOut, bar);
    return tokenAmountOut;
}

export function calcInGivenOut(
    tokenBalanceIn: BigNumber,
    tokenWeightIn: BigNumber,
    tokenBalanceOut: BigNumber,
    tokenWeightOut: BigNumber,
    tokenAmountOut: BigNumber,
    swapFee: BigNumber
) {
    let weightRatio = eDiv(tokenWeightOut, tokenWeightIn);
    let diff = tokenBalanceOut.minus(tokenAmountOut);
    let y = eDiv(tokenBalanceOut, diff);
    let foo = ePow(y, weightRatio);
    foo = foo.minus(EONE);
    let tokenAmountIn = EONE.minus(swapFee);
    tokenAmountIn = eDiv(eMul(tokenBalanceIn, foo), tokenAmountIn);
    return tokenAmountIn;
}

export function calcSpotPrice(
    tokenBalanceIn: BigNumber,
    tokenWeightIn: BigNumber,
    tokenBalanceOut: BigNumber,
    tokenWeightOut: BigNumber,
    swapFee: BigNumber
) {
    const numer = eDiv(tokenBalanceIn, tokenWeightIn);
    const denom = eDiv(tokenBalanceOut, tokenWeightOut);
    const ratio = eDiv(numer, denom);
    const scale = eDiv(EONE, eSubSign(EONE, swapFee).res);
    return eMul(ratio, scale);
}

export function eMul(a: BigNumber, b: BigNumber): BigNumber {
    let c0 = a.times(b);
    let c1 = c0.plus(EONE.div(new BigNumber(2)));
    let c2 = c1.idiv(EONE);
    return c2;
}

export function eDiv(a: BigNumber, b: BigNumber): BigNumber {
    let c0 = a.times(EONE);
    let c1 = c0.plus(b.div(new BigNumber(2)));
    let c2 = c1.idiv(b);
    return c2;
}

export function eToi(a: BigNumber): BigNumber {
    return a.idiv(EONE);
}

export function eFloor(a: BigNumber): BigNumber {
    return eToi(a).times(EONE);
}

export function eSubSign(
    a: BigNumber,
    b: BigNumber
): { res: BigNumber; bool: boolean } {
    if (a.gte(b)) {
        let res = a.minus(b);
        let bool = false;
        return { res, bool };
    } else {
        let res = b.minus(a);
        let bool = true;
        return { res, bool };
    }
}

function ePowi(a: BigNumber, n: BigNumber): BigNumber {
    let z = !n.modulo(new BigNumber(2)).eq(new BigNumber(0)) ? a : EONE;

    for (
        n = n.idiv(new BigNumber(2));
        !n.eq(new BigNumber(0));
        n = n.idiv(new BigNumber(2))
    ) {
        a = eMul(a, a);
        if (!n.modulo(new BigNumber(2)).eq(new BigNumber(0))) {
            z = eMul(z, a);
        }
    }
    return z;
}

export function ePow(base: BigNumber, exp: BigNumber): BigNumber {
    let whole = eFloor(exp);
    let remain = exp.minus(whole);
    let wholePow = ePowi(base, eToi(whole));
    if (remain.eq(new BigNumber(0))) {
        return wholePow;
    }

    let partialResult = ePowApprox(base, remain, EPOW_PRECISION);
    return eMul(wholePow, partialResult);
}

function ePowApprox(
    base: BigNumber,
    exp: BigNumber,
    precision: BigNumber
): BigNumber {
    let a = exp;
    let { res: x, bool: xneg } = eSubSign(base, EONE);
    let term = EONE;
    let sum = term;
    let negative = false;

    for (let i = 1; term.gte(precision); i++) {
        let bigK = new BigNumber(i).times(EONE);
        let { res: c, bool: cneg } = eSubSign(a, bigK.minus(EONE));
        term = eMul(term, eMul(c, x));
        term = eDiv(term, bigK);
        if (term.eq(new BigNumber(0))) break;

        if (xneg) negative = !negative;
        if (cneg) negative = !negative;
        if (negative) {
            sum = sum.minus(term);
        } else {
            sum = sum.plus(term);
        }
    }

    return sum;
}
