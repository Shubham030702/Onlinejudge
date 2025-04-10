const fs = require("fs");
const path = require("path");

const dirName = process.argv[2];
const filepath = path.join(dirName , "Structure.md");
const file = fs.readFileSync(filepath, "utf-8");

let functionName = "";
const inputFields = [];
let outputField = "";

const lines = file.split('\n');

lines.forEach(line => {
  if (line.startsWith('Function Name :')) {
    functionName = line.replace('Function Name :', '').trim(); 
  } 
  else if (line.startsWith('Input Field:')) {
    const input = line.replace('Input Field:', '').trim();
    if (input) inputFields.push(input);
  } 
  else if (line.startsWith('Output Field:')) {
    outputField = line.replace('Output Field:', '').trim();
  }
});

console.log("Function Name:", functionName);
console.log("Input Fields:", inputFields);
console.log("Output Field:", outputField);
