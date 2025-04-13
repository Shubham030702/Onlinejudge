const fs = require("fs");
const path = require("path");

class Generateboilerplate{
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

    boilerPlatecpp(){
        const inputs = this.inputFields
        .map((field,i) => `${this.mapTypeToCpp(field)} ${this.inputFieldsName[i]}`)
        .join(", ");
        return `${this.mapTypeToCpp(this.outputField)} ${this.functionName}(${inputs}) {\n //Write your code here \n}`
    }

    boilerPlatejs(){
        const inputs = this.inputFields
        .map((field,i) => `${this.inputFieldsName[i]}`)
        .join(", ");
        return `function ${this.functionName}(${inputs}) {\n //Write your code here \n}`
    }

    boilerPlatepython(){
        const inputs = this.inputFields
        .map((field,i) => `${this.inputFieldsName[i]}`)
        .join(", ");
        return `def ${this.functionName}(${inputs}) : \n \t #Write your code here \n `
    }

    boilerPlateJava(){
        const inputs = this.inputFields
        .map((field,i) => `${this.mapTypeToJava(field)} ${this.inputFieldsName[i]}`)
        .join(", ");
        return `public static ${this.mapTypeToJava(this.outputFields)} ${this.functionName}(${inputs}) {\n    // Implementation goes here\n  \n}`
    }

    mapTypeToCpp(type) {
        switch (type) {
          case "int": return "int";
          case "float": return "float";
          case "string": return "std::string";
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

module.exports = Generateboilerplate