
## Enter Code Here ##
const size_arr = parseInt(prompt()); 
            const arr = [];
            for (let i = 0; i < size_arr; i++) {
                arr.push(parseInt(prompt()));
            }
const target = parseInt(prompt());
const num = twosum(arr, target);
num.forEach(x => console.log(x));
