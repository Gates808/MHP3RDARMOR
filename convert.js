#!/usr/bin/env node
var fs = require('fs');

// slots
var armorFilesToConvert = [ 'arms', 'body', 'head', 'legs', 'waist' ];
var decorationsFile = 'decorations';
var skillsFile = 'skills';

// parsed data
var armorPieces = {};
var decorations;
var skillList;
var decorationIndex = {};
var skillIndex = {};

var skillScore = {};

// these are helpers because of how the translation file is arranged
var treeIndex = -1;
var lastTree;
var translationContent;
var skillTranslationDictionary = {};

// paths
var pathBase = __dirname + '/../MHP3-ASS/Run/Data/';
var translationPiece = 'Languages/English (TMO)/';

// remove comment and trim the line
var filterLinesFunction = function(entry) {
  var trimmed = entry.trim();
  return trimmed && trimmed[0] !== '#';
};

var convertArmorFunction = function(line, index) {

  var parts = line.split(',');

  var skills = [];

  for (var i = 15; i < 25; i += 2) {

    if (!parts[i]) {
      continue;
    }

    var skillToPush = {
      tree : skillTranslationDictionary[parts[i]],
      points : +parts[i + 1]
    };

    skills.push(skillToPush);

    if (skillToPush.points > 0) {
      skillScore[skillToPush.tree] = (skillScore[skillToPush.tree] || 0)
          + skillToPush.points;
    }

  }

  return {
    name : translationContent[index],
    slots : +parts[5],
    gender : +parts[2],
    type : +parts[3],
    skills : skills,
    defense : +parts[9]
  };
};

var convertDecorationFunction = function(line, index) {

  var parts = line.split(',');

  var skills = [];

  for (var i = 6; i < 9; i += 2) {

    if (!parts[i]) {
      continue;
    }

    skills.push({
      tree : skillTranslationDictionary[parts[i]],
      points : +parts[i + 1]
    });
  }

  return {
    name : translationContent[index],
    slots : +parts[3],
    skills : skills
  };

};

// ASS repo is wrong when it comes to translations.
// horrible luck is replaced by carving pro, which doesn't exist.
var convertSkillFunction = function(line, index) {

  var parts = line.split(',');

  if (parts[2] !== lastTree) {
    lastTree = parts[2];
    treeIndex++;
  }

  // torso up doesn't have a tree, so we reuse the skill name
  skillTranslationDictionary[parts[2] || parts[0]] = translationContent[treeIndex];

  var skill = {
    name : translationContent[index + 101] || parts[0],
    points : +parts[4],
    type : +parts[5],
    tag : parts[6],
    tree : translationContent[treeIndex]
  };

  var indexList = skillIndex[skill.tree] || [];

  indexList.push({
    name : skill.name,
    points : skill.points
  });

  skillIndex[skill.tree] = indexList;

  return skill;

}

// parse skills
var fileContent = fs.readFileSync(pathBase + skillsFile + '.txt').toString()
    .split('\n').filter(filterLinesFunction);

translationContent = fs.readFileSync(
    pathBase + translationPiece + skillsFile + '.txt').toString().split('\n');

skillList = fileContent.map(convertSkillFunction);

var seenTrees = translationContent.splice(0, treeIndex + 1);

// parse armor
for (var i = 0; i < armorFilesToConvert.length; i++) {

  var slot = armorFilesToConvert[i];

  fileContent = fs.readFileSync(pathBase + slot + '.txt').toString()
      .split('\n').filter(filterLinesFunction);

  // translation content is in the global scope for the convert function
  var translationContent = fs.readFileSync(
      pathBase + translationPiece + slot + '.txt').toString().split('\n');

  armorPieces[slot] = fileContent.map(convertArmorFunction);
}

// parse decorations
fileContent = fs.readFileSync(pathBase + decorationsFile + '.txt').toString()
    .split('\n').filter(filterLinesFunction);

translationContent = fs.readFileSync(
    pathBase + translationPiece + decorationsFile + '.txt').toString().split(
    '\n');

decorations = fileContent.map(convertDecorationFunction);

for (var i = 0; i < decorations.length; i++) {

  var decoSkills = decorations[i].skills;

  for (var j = 0; j < decoSkills.length; j++) {

    // decorationIndex
    var decoSkill = decoSkills[j];

    var entry = decorationIndex[decoSkill.tree] || [];

    entry.push(i);

    decorationIndex[decoSkill.tree] = entry;
  }

}

var outputString = "var fullData = JSON.parse('" + JSON.stringify({
  decorations : decorations,
  armorPieces : armorPieces,
  skills : skillList,
  skillScore : skillScore,
  trees : seenTrees.sort(function(a, b) {
    return a.localeCompare(b);
  }),
  skillIndex : skillIndex,
  decorationIndex : decorationIndex
}).replace(/'/g, '\\\'') + "');";
// I don't like this sanitization here, but the dataset is small, so whatever.

fs.writeFileSync(__dirname + "/fullData.js", outputString);
