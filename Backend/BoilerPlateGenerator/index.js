const fs = require("fs");
const path = require("path");
const Generateboilerplate = require("./generateboilerplate.js")

const Generator1 = new Generateboilerplate();

const dirName = process.argv[2];
const filepath = path.join(dirName , "Structure.md");
const file = fs.readFileSync(filepath, "utf-8");

Generator1.parse(file);
const CppCode = Generator1.boilerPlatecpp();
const PythonCode = Generator1.boilerPlatepython();
const JavaCode = Generator1.boilerPlateJava();
const JsCode = Generator1.boilerPlatejs();

const outputDir = path.join(dirName, "BoilerPlate");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}
const cppFilePath = path.join(outputDir, "boilerplate.cpp");
const pythonFilePath = path.join(outputDir, "boilerplate.py");
const javaFilePath = path.join(outputDir, "boilerplate.java");
const jsFilePath = path.join(outputDir, "boilerplate.js");
fs.writeFileSync(cppFilePath, CppCode);
fs.writeFileSync(pythonFilePath, PythonCode);
fs.writeFileSync(javaFilePath, JavaCode);
fs.writeFileSync(jsFilePath, JsCode);
console.log("Boilerplate files generated successfully!");