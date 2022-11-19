const fs = require("fs");
const path = require("path");
const glob = require("glob");
const { exit } = require("process");

function loadJSONFile(file) {
  const configPath = path.resolve(__dirname, file);
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(JSON.stringify(require(configPath)));
    return config;
  } else {
    return {};
  }
}

function saveJSONFile(content, filePath) {
  try{
    const data = JSON.stringify(content, null, 4);
    fs.writeFileSync(filePath, data);
    console.log(`JSON file saved to ${filePath}`);
  } catch (error) {
    console.error(error);
  }
}

function loadSceneFiles(filePath) {
  let scenesData = [];
  const jsonFiles = path.join(filePath, "ddb-enhanced-scene-*.json");

  glob.sync(jsonFiles).forEach((sceneDataFile) => {
    console.log(`Loading ${sceneDataFile}`);
    const sceneDataPath = path.resolve(__dirname, sceneDataFile);
    if (fs.existsSync(sceneDataPath)){
      scenesData = scenesData.concat(loadJSONFile(sceneDataPath));
    }
  });

  return scenesData;
}

if (!process.argv[2] || process.argv[2] == "" ) {
  console.log("Please enter a path to a module directory");
  exit();
}

const modulesPath = path.resolve(__dirname, "modules.json");
let modulesFile = loadJSONFile(modulesPath);

if (!fs.existsSync(modulesPath)) {
  console.log("Could not find modules.json file");
  exit();
}

const directoryPath = path.resolve(__dirname, process.argv[2]);

if (!fs.existsSync(directoryPath)) {
  console.log("Could not find module directory");
  exit();
}

const modulePath = path.resolve(directoryPath, "module.json");
let moduleFile = loadJSONFile(modulePath);
const scenesData = loadSceneFiles(directoryPath);

if (!moduleFile.name) moduleFile.name = directoryPath.split("/").pop();
if (!moduleFile.description) moduleFile.description = "";
if (!moduleFile.path) moduleFile.path = path.relative(process.cwd(), directoryPath);

moduleFile.scenes = scenesData;

saveJSONFile(moduleFile, modulePath);

// {
//   "name": "Steve's Scenes: The House of Lament",
//   "path": "modules/steves-scenes/lament",
//   "module": "steves-scenes",
//   "scenes": []
// }
modulesFile.packages[moduleFile.path] = {
  "name": moduleFile.name,
  "description": moduleFile.description,
  "path": moduleFile.path,
  "module": moduleFile.module,
  "released": moduleFile.released,
  "folder": moduleFile.folder,
  "books": [...new Set(moduleFile.scenes.map((scene) => scene.flags.ddb.bookCode))],
  "scenes": moduleFile.scenes.map((scene) => {
    return {
      "name": scene.name,
      "description": scene.flags.ddbimporter.export.description,
      "book": scene.flags.ddb.bookCode,
    };
  }),
};
console.warn(modulesFile);
saveJSONFile(modulesFile, modulesPath);
