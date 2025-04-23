
#include <bits/stdc++.h>

using namespace std;
                
## Enter Code Here ##

int main() {
    int size_arr;
cin>>size_arr;
vector<int> arr(size_arr);
for(int i=0;i<size_arr;i++){
 cin>>arr[i]; 
}
int target;
cin>>target;
    vector<int> num = twosum(arr,target);
    for(int i=0;i<num.size();i++){
 cout<<num[i]<<" "; 
 }
    return 0;
}
