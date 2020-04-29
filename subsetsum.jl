module SubsetSum

export subsetsum, subset_resistor

function maxsignif(A::Array{T}) where {T <: AbstractFloat}
    for X in 0:64
        rounded = [round(i, digits=X) for i in A]
        if rounded == A
            return X
        end
    end
    raise(ArgumentError, "way too precise!")
end

function subsetsum(A::Array{T, 1}, tgt::T1) where {T <: Real, T1 <: Real}
    n = length(A)
    dp = [Set{Real}() for _ in 1:n+1]
    X = maxsignif(A) + 1
    # @show X
    for k in 1:n+1
        push!(dp[k], 0)
    end
    for i in 2:n+1
        weight = A[i-1]
        push!(dp[i], round(weight, digits=X))
        for j in dp[i-1]
            push!(dp[i], round(j, digits=X))
            push!(dp[i], round(j+weight, digits=X))
        end
    end
    result = in(tgt, dp[n+1])
    soln = []
    # @show dp
    if result
        j = tgt
        for i′ in 0:n-1
            if j == 0
                break
            end
            i = n + 1 - i′ # i from n+1 to 2
            weight = A[i-1]
            if in(j, dp[i]) && !in(j, dp[i-1])
                prepend!(soln, weight)
                j = round(j - weight, digits=X)
            end
        end
    end
    return (result, soln)
end

function subset_resistor(A::Array{T, 1}, tgt::T1) where {T <: Real, T1 <: Real}
    n = length(A)
    X = maxsignif(A) + 1

    J = max(findmax(A)[1], tgt)

    dp = [Set() for _ in zeros(n+1, n+1)]
    # dp = zeros(n+1, J+1, n+1)
    push!(dp[1,1], 0)
    # dp[:, 1, 1] .= 1
    for l in 1:n+1
        if l >= 2
            for i in 1:n+1
                union!(dp[i, l], dp[i, l-1])
            end
        end
        if mod(l, 2) == 1
            for i in 2:n+1
                weight = A[i-1]
                for j in dp[i-1, l]
                    push!(dp[i, l], round(j, digits=X))
                    push!(dp[i, l], round(j+weight, digits=X))
                end
            end
        else
            for i in 2:n+1
                weight = A[i-1]
                for j in dp[i-1, l]
                    s = 1/(1/j + 1/weight)
                    push!(dp[i, l], round(j, digits=X))
                    push!(dp[i, l], round(s, digits=X))
                end
            end
        end
    end


    result = in(tgt, dp[n+1, n+1])

    if result
        soln = ""
        j = tgt
        l = n+1
        for i′ in 0:n
            i = n+1 - i′ # i from n+1 to 2
            # if in(j, dp[i, l]) && !in(j, dp[i, l-1])  break end
            #
            if j == 0
                soln = "0.0 $soln"
                break
            end
            l′ = l
            while l > 1 && in(j, dp[i, l]) && in(j, dp[i, l-1])
                l = l - 1
            end
            if l == l′
                soln = soln
            elseif mod(l, 2) == 1
                soln = "+ $soln"
            else
                soln = "|| $soln"
            end

            weight = A[i-1]
            if in(j, dp[i, l]) && !in(j, dp[i-1, l])
                s1 = soln
                soln = "$weight $soln"
                if s1 == ""
                    soln = "$weight"
                end
                if mod(l, 2) == 1
                    j = round(j-weight, digits=X)
                else 
                    j = round(1/(1/j - 1/weight), digits=X)
                end
            end
        end
        return (true, soln)
    else
        return (false, [])
    end
end


end
