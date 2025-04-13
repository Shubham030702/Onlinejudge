const fs = require("fs");
const path = require("path");

class Generateboilerplate{
    constructor(){
        this.functionName = "";
        this.inputFields = [];
        this.outputField = "";
    }

    parse(file){
        const lines = file.split('\n');
        lines.forEach(line => {
        if (line.startsWith('Function Name :')) {
            this.functionName = line.replace('Function Name :', '').trim(); 
        } 
        else if (line.startsWith('Input Field:')) {
            const input = line.replace('Input Field:', '').trim();
            if (input) this.inputFields.push(input);
        } 
        else if (line.startsWith('Output Field:')) {
            this.outputField = line.replace('Output Field:', '').trim();
        }
        });
        console.log(this.functionName)
        console.log(this.inputFields)
        console.log(this.outputField)    
    }    
    
    mapTypeToCpp(type) {
        switch (type) {
          case "int": return "int";
          case "float": return "float";
          case "string": return "std::string";
          case "bool": return "bool";
          case "list<int>": return "std::vector<int>";
          case "list<float>": return "std::vector<float>";
          case "list<string>": return "std::vector<std::string>";
          case "list<bool>": return "std::vector<bool>";
          default: return "unknown";
        }
      }
    
    mapTypeToPython(type) {
        switch (type) {
          case "int": return "int";
          case "float": return "float";
          case "string": return "str";
          case "bool": return "bool";
          case "list<int>": return "List[int]";
          case "list<float>": return "List[float]";
          case "list<string>": return "List[str]";
          case "list<bool>": return "List[bool]";
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
    
      mapTypeToJs(type) {
        switch (type) {
          case "int":
          case "float":
            return "number";
          case "string":
            return "string";
          case "bool":
            return "boolean";
          case "list<int>":
          case "list<float>":
            return "number[]";
          case "list<string>":
            return "string[]";
          case "list<bool>":
            return "boolean[]";
          default:
            return "any";
        }
      }
    }

module.exports = Generateboilerplate