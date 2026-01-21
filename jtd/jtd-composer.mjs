// compose-jtd.js
import fs, { existsSync } from "fs";
import path from "path";

// Read schema Directory
const schemaDir = path.resolve("./jtd/schemas");
const rootFile = path.join("./jtd/root.jtd.json");

if (!existsSync(rootFile)) {
  console.error(`\nRoot file ${rootFile} does not exist`);
  process.exit(1);
}

const files = fs.readdirSync(schemaDir);

if (files.length === 0) {
  console.error(`\nNo schema files found in directory ${schemaDir}`);
  process.exit(1);
} else {
  console.log(
    `\nFound ${files.length} schema files in directory \n${schemaDir}`,
  );
}

const rootFileContent = fs.readFileSync(rootFile, "utf-8");

let rootDefinitions;
try {
  rootDefinitions = JSON.parse(rootFileContent);
} catch (error) {
  console.error(`\nError parsing root file ${rootFile}: ${error?.message}`);
  process.exit(1);
}

// check for ref property in root file
if (!rootDefinitions.ref) {
  console.error(`\nRoot file ${rootFile} does not contain a ref property`);
  process.exit(1);
}

// Loop over all files in the schema directory
for (const file of files) {
  // read file content
  if (!file.includes(".jtd.json")) {
    console.log(`\nSkipping non-JTD file: ${file}`);
    continue;
  }
  console.log(`\nProcessing schema file: ${file.replace(".jtd.json", "")}`);
  let fileContent = fs.readFileSync(path.join(schemaDir, file), "utf-8");

  let schema;
  // parse JSON content
  try {
    schema = JSON.parse(fileContent);
  } catch (error) {
    console.error(`\nError parsing schema file ${file}: ${error?.message}`);
    process.exit(1);
  }

  // check for definitions
  if (!schema.definitions) {
    console.error(`\nSchema file ${file} does not contain definitions`);
    process.exit(1);
  } else {
    // feed definitions into the main definitions object
    rootDefinitions.definitions = {
      ...rootDefinitions.definitions,
      ...schema.definitions,
    };
  }
}

// Ensure the ref at the root points to an existing definition
const refDefintiionFound = Object.keys(rootDefinitions.definitions).includes(
  rootDefinitions.ref,
);

if (!refDefintiionFound) {
  console.error(`\nReference ${rootDefinitions.ref} not found in definitions`);
  process.exit(1);
}

fs.writeFileSync("composed.jtd.json", JSON.stringify(rootDefinitions, null, 2));
