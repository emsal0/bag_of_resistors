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

function subset_resistor(res_vals, tgt) {
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
