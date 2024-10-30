## Problem Summary
Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`. You may assume that each input has exactly one solution, and you cannot use the same element twice.

---

## Approach 1: Brute Force

1. Iterate through each pair of numbers in `nums`.
2. For each pair, check if their sum equals `target`.
3. If you find a pair that sums to `target`, return their indices.

**Time Complexity**: \(O(n^2)\)  
**Space Complexity**: \(O(1)\)  

---

## Approach 2: Hash Map (Optimal Solution)

1. Initialize an empty hash map to store numbers and their indices as you iterate through `nums`.
2. For each element `num` in `nums`, calculate the difference `diff = target - num`.
3. Check if `diff` is already in the hash map:
   - If yes, you’ve found the solution; return the current index and the index of `diff` from the hash map.
   - If no, add `num` to the hash map with its index.
4. Continue this until you find the two indices.
