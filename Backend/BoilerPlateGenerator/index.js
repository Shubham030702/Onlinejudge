const fs = require("fs");
const path = require("path");
const Generateboilerplate = require("./generateboilerplate.js")

const Generator1 = new Generateboilerplate();

const dirName = process.argv[2];
const filepath = path.join(dirName , "Structure.md");
const file = fs.readFileSync(filepath, "utf-8");

Generator1.parse(file);