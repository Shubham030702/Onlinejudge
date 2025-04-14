const { faShield } = require("@fortawesome/free-solid-svg-icons");
const fs = require("fs");
const path = require("path");

class FullBoilerPlate{
    constructor(){
        this.functionName = "";
        this.inputFields = [];
        this.inputFieldsName = [];
        this.outputField = "";
        this.outputFieldName = "";
      }
    parse(file){
        const lines = file.split('\n');
        lines.forEach(line => {
        if (line.startsWith('Function Name :')) {
            this.functionName = line.replace('Function Name :', '').trim(); 
        } 
        else if (line.startsWith('Input Field:')) {
            const str = line.replace('Input Field:', '').trim().split(" ");
            this.inputFields.push(str[0]);
            this.inputFieldsName.push(str[1]);
        } 
        else if (line.startsWith('Output Field:')) {
            const str = line.replace('Output Field:', '').trim().split(" ");
            this.outputField = str[0];
            this.outputFieldName = str[1];
        }
        });
    }
    generateCpp(){
        const input = this.inputFields
    .map((field,i) => {
            if(field.startsWith("list<")) {
                return `int size_${this.inputFieldsName[i]};\ncin>>size_${this.inputFieldsName[i]};\n${this.mapTypeToCpp(field)} ${this.inputFieldsName[i]}(size_${this.inputFieldsName[i]});\nfor(int i=0;i<size_${this.inputFieldsName[i]};i++){\n cin>>${this.inputFieldsName[i]}[i]; \n}`;
            }
            else{
                return `${this.mapTypeToCpp(field)} ${this.inputFieldsName[i]};\ncin>>${this.inputFieldsName[i]};`;
            }
        }).join('\n')
        const functioncall = `${this.mapTypeToCpp(this.outputField)} ${this.outputFieldName} = ${this.functionName}(${this.inputFieldsName.join(",")});`
        const output = this.outputField.startsWith("list<") ? `for(int i=0;i<${this.outputFieldName}.size();i++){\n cout<<${this.outputFieldName}[i]<<" "; \n }` : `cout<<${this.outputFieldName}<<endl;`
        return `
#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <sstream>
#include <climits>

using namespace std;
                
## Enter Code Here ##

int main() {
    ${input}
    ${functioncall}
    ${output}
    return 0;
}
`
}

generateJs() {
    const input = this.inputFields.map((field, i) => {
        if (field.startsWith("list<")) {
            return `const size_${this.inputFieldsName[i]} = parseInt(prompt()); 
            const ${this.inputFieldsName[i]} = [];
            for (let i = 0; i < size_${this.inputFieldsName[i]}; i++) {
                ${this.inputFieldsName[i]}.push(parseInt(prompt()));
            }`;
        } else {
            return `const ${this.inputFieldsName[i]} = parseInt(prompt());`;
        }
    }).join('\n');

    const functioncall = `const ${this.outputFieldName} = ${this.functionName}(${this.inputFieldsName.join(", ")});`;

    const output = this.outputField.startsWith("list<")
        ? `${this.outputFieldName}.forEach(x => console.log(x));`
        : `console.log(${this.outputFieldName});`;

    return `
## Enter Code Here ##
${input}
${functioncall}
${output}
`;
}


    mapTypeToCpp(type) {
        switch (type) {
          case "int": return "int";
          case "float": return "float";
          case "string": return "string";
          case "bool": return "bool";
          case "list<int>": return "vector<int>";
          case "list<float>": return "vector<float>";
          case "list<string>": return "vector<string>";
          case "list<bool>": return "vector<bool>";
          default: return "unknown";
        }
      }
      mapTypeToJava(type) {
        switch (type) {
          case "int": return "int";
          case "float": return "float";
          case "string": return "String";
          case "bool": return "boolean";
          case "list<int>": return "List<Integer>";
          case "list<float>": return "List<Float>";
          case "list<string>": return "List<String>";
          case "list<bool>": return "List<Boolean>";
          default: return "Object";
        }
      }
}

module.exports = FullBoilerPlate