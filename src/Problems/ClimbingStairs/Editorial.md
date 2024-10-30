## Problem Summary
You are climbing a staircase. It takes `n` steps to reach the top. Each time, you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?

---

## Approach 1: Recursive Solution (Exponential Time)

1. Use recursion to solve for `n`, where each call recursively calculates the number of ways to reach `n - 1` and `n - 2` steps.
2. The base cases are:
   - `n = 0`: 1 way (doing nothing)
   - `n = 1`: 1 way (1 step)

**Time Complexity**: \(O(2^n)\)  
**Space Complexity**: \(O(n)\) (call stack depth)

---

## Approach 2: Dynamic Programming (Optimal Solution)

1. Recognize that the problem is similar to the Fibonacci sequence: \( \text{ways}(n) = \text{ways}(n - 1) + \text{ways}(n - 2) \).
2. Use a bottom-up dynamic programming approach:
   - Initialize `dp[0] = 1` (1 way to stay at the ground) and `dp[1] = 1` (1 way to reach step 1).
   - For each step from 2 to `n`, calculate `dp[i] = dp[i - 1] + dp[i - 2]`.
3. The result will be `dp[n]`, the number of ways to reach the top.
