function max_signif(arr) {
    for (let i = 0; i <= 64; i++) {
        let roundedEqs = arr.map(a => a.toFixed(i) == a).reduce(
            (a, b) => a && b);
        if (roundedEqs) {
            return i;
        }
    }
    throw new Error('Digits are too precise');
}

function setHasFloat(set, tgt, digits) {
    let tgtRounded = parseFloat(tgt.toFixed(digits));
    for (let obj of set) {
        let specRounded = parseFloat(obj.toFixed(digits));
        if (specRounded == tgtRounded) {
            return true;
        }
    }
    return false;
}

function processSteps(leftSteps, rightSteps, op) {
    let steps = [];
    let lastLeftStep = leftSteps[leftSteps.length - 1];
    let lastRightStep = rightSteps[rightSteps.length - 1];
    if (leftSteps.length == 1 && rightSteps.length == 1) {
        return [...leftSteps, ...rightSteps, op];
    } else if (leftSteps.length > 1 && rightSteps.length > 1) {
        if (lastLeftStep === lastRightStep && lastRightStep === op) {
            return [...leftSteps.splice(0, leftSteps.length - 1),
                    ...rightSteps.splice(0, rightSteps.length - 1), op];
        } else {
            return [leftSteps, rightSteps, op];
        }
    } else {
        if (leftSteps.length == 1) {
            if (lastRightStep === op) {
                return [...leftSteps,
                    ...(rightSteps.splice(0, rightSteps.length - 1)), op];
            } else {
                return [...leftSteps, rightSteps, op];
            }
        } else if (rightSteps.length == 1) {
            if (lastLeftStep === op) {
                return [...(leftSteps.splice(0, leftSteps.length - 1)),
                    ...rightSteps, op];
            } else {
                return [leftSteps, ...rightSteps, op];
            }
        }
    }
}

function subsetResistorMain(res_vals, tgt, visitedSolns, digits, debug=false) {
    let queue = [];
    queue.push(res_vals);

    let convertResistance = r => parseFloat(r.toFixed(digits));
    let approxEquals = (r,s) => convertResistance(r) == convertResistance(s);

    while (queue.length > 0) {
        let curVals = queue.splice(0,1)[0];
        let n = curVals.length;
        let values = curVals.map(item =>
            parseFloat(convertResistance(item['value'])));
        let key = values.slice(0).map(convertResistance).sort().join();
        if (debug) {
            console.log(key);
        }
        if (visitedSolns.has(key)) {
            continue;
        } else if (!!values.find(j => approxEquals(j,tgt))) {
            let soln = curVals.find(x => approxEquals(x['value'], tgt));
            return soln;
        } else if (n == 1) {
            continue;
        }

        for (let i = 0; i < n; i++) {
            let left = curVals[i];
            let localVals = curVals.slice(0);
            localVals.splice(i, 1);
            for (let j = 0; j < localVals.length; j++) {
                let right = localVals[j];
                localVals.splice(j, 1);

                let leftSteps = left['steps'].slice(0);
                let rightSteps = right['steps'].slice(0);

                let seriesSoln = {
                    'value': left['value'] + right['value'],
                    'steps': processSteps(leftSteps, rightSteps, '+')
                }

                leftSteps = left['steps'].slice(0);
                rightSteps = right['steps'].slice(0);

                let parallelSoln = {
                    'value': 1/(1/left['value'] + 1/right['value']),
                    'steps': processSteps(leftSteps, rightSteps, '||')
                }

                queue.push(localVals.concat(seriesSoln));
                queue.push(localVals.concat(parallelSoln));

                localVals.push(right);
            }
            localVals.push(left);
        }
        visitedSolns.add(key);
    }

    return false;
}

function subsetResistor(res_vals, tgt, debug=false) {

    let resValsFormatted = res_vals.map(v => {
        return {
            'value': v,
            'steps': [v]
        };
    });

    let X = max_signif(res_vals) + 5;
    //console.log(`X = ${X}`);
    let visitedSolns = new Set();
    return subsetResistorMain(resValsFormatted, tgt, visitedSolns, X,
                                        debug);
}

function subsetResistorDeprecated(res_vals, tgt) {
    let n = res_vals.length
    let X = max_signif(res_vals) + 1;

    let dp = []
    for (let i = 0; i <= n; i++) {
        dp.push([]);
        for (let j = 0; j <= n; j++) {
            dp[dp.length - 1].push(new Set());
        }
    }

    let convertResistance = r => parseFloat(r.toFixed(X));

    dp[0][0].add(0)

    for (let l = 0; l <= n; l++) {
        if (l >= 1) {
            for (let i = 0; i <= n; i++) {
                dp[i][l] = new Set([...dp[i][l-1]]);
            }
        }
        for (let i = 1; i <= n; i++) {
            let weight = res_vals[i-1];
            for (let j of dp[i-1][l]) {
                if (l % 2 == 0) {
                    dp[i][l].add(convertResistance(j));
                    dp[i][l].add(convertResistance(j + weight));
                } else {
                    s = 1/(1/j + 1/weight);
                    dp[i][l].add(convertResistance(j));
                    dp[i][l].add(convertResistance(s));
                }

            }
        }
    }
    result = dp[n][n].has(tgt);

    if (result) {
        let soln = [];
        let j = tgt;
        let l = n;
        let i = n;
        while (l >= 0) {
            if (i <= 0) {
                break;
            }
            if (j == 0) {
                break;
            }

            let l_ = l;
            while (l > 0 && dp[i][l].has(j) && dp[i][l-1].has(j)) {
                l = l - 1;
            }
            if (l != l_) {
                if (l % 2 == 0) {
                    soln = ["+", ...soln];
                } else {
                    soln = ["||", ...soln];
                }
            }

            let weight = res_vals[i-1];
            if (setHasFloat(dp[i][l], j, X) && !setHasFloat(dp[i-1][l], j, X)) {
                soln = [weight, ...soln]
                if (l % 2 == 0) {
                    j = convertResistance(j-weight);
                } else {
                    j = 1/(1/j - 1/weight);
                }
            }
            i--;
        }
        return { result: true, soln: soln };
    } else {
        return { result: false, soln: [] };
    }
}
