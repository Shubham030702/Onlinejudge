const fs = require("fs");
const path = require("path");
const Generateboilerplate = require("./generateboilerplate.js")
const GenerateboilerplateFull = require("./FullBoilerplate.js")

const Generator1 = new Generateboilerplate();
const Generator2 = new GenerateboilerplateFull();

const dirName = process.argv[2];
const filepath = path.join(dirName , "Structure.md");
const file = fs.readFileSync(filepath, "utf-8");

Generator1.parse(file);
Generator2.parse(file);

const CppCode = Generator1.boilerPlatecpp();
const PythonCode = Generator1.boilerPlatepython();
const JavaCode = Generator1.boilerPlateJava();
const JsCode = Generator1.boilerPlatejs();

const outputDir = path.join(dirName, "BoilerPlate");
const outputDir2 = path.join(dirName, "BoilerPlateFull");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}
if (!fs.existsSync(outputDir2)) {
  fs.mkdirSync(outputDir2);
}

const CppCodeFull = Generator2.generateCpp();
const JsCodeFull = Generator2.generateJs();

const cppFilePath = path.join(outputDir, "boilerplate.cpp");
const pythonFilePath = path.join(outputDir, "boilerplate.py");
const javaFilePath = path.join(outputDir, "boilerplate.java");
const jsFilePath = path.join(outputDir, "boilerplate.js");
fs.writeFileSync(cppFilePath, CppCode);
fs.writeFileSync(pythonFilePath, PythonCode);
fs.writeFileSync(javaFilePath, JavaCode);
fs.writeFileSync(jsFilePath, JsCode);

const cppFilePathFull = path.join(outputDir2, "boilerplate.cpp");
const jsFilePathFull = path.join(outputDir2, "boilerplate.js");
fs.writeFileSync(cppFilePathFull, CppCodeFull);
fs.writeFileSync(jsFilePathFull, JsCodeFull);


console.log("Boilerplate files generated successfully!");
