const fs = require('fs');
const path = require('path');

const csvFilePath = 'c:\\Users\\dangw\\Downloads\\coding_questions_main_rows.csv';
const outputJsonPath = path.join(__dirname, 'Database', 'problems_seed.json');

// Quote-aware CSV parser
function parseCSV(text) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  let row = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(current);
      rows.push(row);
      row = [];
      current = '';
    } else {
      current += char;
    }
  }
  if (current || row.length > 0) {
    row.push(current);
    rows.push(row);
  }
  return rows;
}

function extractTopics(tagsStr, category) {
  try {
    if (tagsStr) {
      const tags = JSON.parse(tagsStr);
      if (Array.isArray(tags) && tags.length > 0) {
        return tags.map(t => t.toLowerCase());
      }
    }
  } catch (e) {}
  return category ? [category.toLowerCase()] : ['general'];
}

function processCSV() {
  console.log('Reading CSV file...');
  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
  console.log('Parsing CSV rows...');
  const allRows = parseCSV(fileContent);
  console.log(`Total parsed rows: ${allRows.length}`);

  if (allRows.length < 2) {
    console.error('CSV file has no data.');
    return;
  }

  const headers = allRows[0];
  const dataRows = allRows.slice(1);

  // Headers index lookup
  const idIdx = headers.indexOf('id');
  const titleIdx = headers.indexOf('title');
  const descIdx = headers.indexOf('description');
  const diffIdx = headers.indexOf('difficulty');
  const catIdx = headers.indexOf('category');
  const tagsIdx = headers.indexOf('tags');
  const constrIdx = headers.indexOf('constraints');
  const exIdx = headers.indexOf('examples');
  const starterCodeIdx = headers.indexOf('starter_code');
  const testCasesIdx = headers.indexOf('test_cases');
  const editorialIdx = headers.indexOf('editorial');
  const mainCodeIdx = headers.indexOf('main_code');

  // Group problems by primary topic to ensure variety
  const categoryGroups = {};

  dataRows.forEach(row => {
    if (row.length < 5) return; // skip malformed rows

    const category = (row[catIdx] || 'General').toLowerCase().trim();
    if (!categoryGroups[category]) {
      categoryGroups[category] = [];
    }
    categoryGroups[category].push(row);
  });

  const categories = Object.keys(categoryGroups);
  console.log(`Found ${categories.length} categories:`, categories);

  // Select 200 problems evenly from the categories
  const selectedRows = [];
  const targetTotal = 200;
  let added = true;
  const currentIndices = {};
  categories.forEach(cat => { currentIndices[cat] = 0; });

  while (selectedRows.length < targetTotal && added) {
    added = false;
    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      const list = categoryGroups[cat];
      const idx = currentIndices[cat];

      if (idx < list.length) {
        selectedRows.push(list[idx]);
        currentIndices[cat]++;
        added = true;
      }

      if (selectedRows.length >= targetTotal) break;
    }
  }

  console.log(`Selected ${selectedRows.length} problems for seeding.`);

  // Map to Mongoose Schema
  const mappedProblems = selectedRows.map((row, idx) => {
    const rawTitle = row[titleIdx] || `Problem ${idx + 1}`;
    const rawDiff = (row[diffIdx] || 'medium').toLowerCase().trim();
    let difficulty = 'Medium';
    let score = '4';
    if (rawDiff === 'easy') {
      difficulty = 'Easy';
      score = '3';
    } else if (rawDiff === 'hard') {
      difficulty = 'Hard';
      score = '6';
    }

    const topics = extractTopics(row[tagsIdx], row[catIdx]);

    // Format Statement
    let statement = row[descIdx] || '';
    const constraints = row[constrIdx];
    if (constraints && constraints.trim()) {
      statement += `\n\n### Constraints\n${constraints}`;
    }

    const examples = row[exIdx];
    if (examples && examples.trim()) {
      try {
        const parsedEx = JSON.parse(examples);
        if (Array.isArray(parsedEx)) {
          statement += `\n\n### Examples`;
          parsedEx.forEach((ex, exIdx) => {
            statement += `\n\n**Example ${exIdx + 1}**:\n`;
            statement += `* **Input**: \`${ex.input}\`\n`;
            statement += `* **Output**: \`${ex.output}\`\n`;
            if (ex.explanation) {
              statement += `* **Explanation**: ${ex.explanation}\n`;
            }
          });
        }
      } catch (e) {
        statement += `\n\n### Examples\n${examples}`;
      }
    }

    // Format testCases
    let testCases = [];
    const rawTestCases = row[testCasesIdx];
    if (rawTestCases && rawTestCases.trim()) {
      try {
        const parsedTC = JSON.parse(rawTestCases);
        if (Array.isArray(parsedTC)) {
          testCases = parsedTC.map(tc => ({
            input: tc.input || "",
            output: tc.expected_output || tc.output || ""
          }));
        }
      } catch (e) {}
    }
    // Fallback default testcases if empty
    if (testCases.length === 0) {
      testCases = [{ input: "default_input", output: "default_output" }];
    }

    // Format boilerplates
    let bpParsed = {};
    const rawStarter = row[starterCodeIdx];
    if (rawStarter && rawStarter.trim()) {
      try {
        bpParsed = JSON.parse(rawStarter);
      } catch (e) {}
    }

    const boilerplate = {
      cpp: bpParsed.cpp || bpParsed.c || "// Write C++ code here",
      python: bpParsed.python || "# Write Python code here",
      java: bpParsed.java || "/* Write Java code here */",
      js: bpParsed.javascript || bpParsed.typescript || "// Write JavaScript code here"
    };

    let mainParsed = {};
    const rawMain = row[mainCodeIdx];
    if (rawMain && rawMain.trim()) {
      try {
        mainParsed = JSON.parse(rawMain);
      } catch (e) {}
    }

    const boilerplateFull = {
      cpp: mainParsed.cpp || "#include <iostream>\n## Enter Code Here ##",
      python: mainParsed.python || "## Enter Code Here ##",
      java: mainParsed.java || "import java.util.*;\n## Enter Code Here ##",
      js: mainParsed.javascript || mainParsed.js || "## Enter Code Here ##"
    };

    return {
      problemName: rawTitle,
      difficulty,
      score,
      topics,
      statement,
      testCases,
      editorial: row[editorialIdx] || 'No editorial available yet.',
      users: [],
      boilerplate,
      boilerplateFull,
      contestOnly: false,
      prerequisites: [],
      coordinates: { x: 0, y: 0 }
    };
  });

  fs.writeFileSync(outputJsonPath, JSON.stringify(mappedProblems, null, 2));
  console.log(`Saved parsed seed data to ${outputJsonPath}`);
}

processCSV();
