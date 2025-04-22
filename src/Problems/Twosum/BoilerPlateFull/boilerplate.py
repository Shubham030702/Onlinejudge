
## Enter Code Here ##   
size_arr = int(input())
arr = []
for i in range(size_arr):
	arr.append(int(input()))
target = int(input())
num = twosum(arr,target)
for i in range(len(num)):
    print(num[i], end=" ")
