var slotsList = [ 'head', 'body', 'arms', 'waist', 'legs' ];
var chestIndex = slotsList.indexOf('body');

var setLimit = 100;

function getCharmData() {

  var charmSkills = [];
  var charmSlots = +document.getElementById('slotsField').value;

  if (!charmSlots || charmSlots < 0) {
    charmSlots = 0;
  }

  var skillOne = +document.getElementById('skillOneField').value;

  if (skillOne) {
    charmSkills.push({
      points : skillOne,
      tree : fullData.trees[talismanOneCombo.selectedIndex]
    });
  }

  var skillTwo = +document.getElementById('skillTwoField').value;

  if (skillTwo) {
    charmSkills.push({
      points : skillTwo,
      tree : fullData.trees[talismanTwoCombo.selectedIndex]
    });
  }

  return {
    skills : charmSkills,
    slots : charmSlots
  };

}

function getSkillTargets() {

  var targets = {};

  for (var i = 0; i < selectedSkills.length; i++) {

    var skill = fullData.skills[selectedSkills[i]];

    if (skill.tree === 'Torso Up') {
      continue;
    }

    var target = targets[skill.tree];

    if (target) {

      if (target > 0 && target > skill.points || target < 0
          && target < skill.points) {
        continue;
      }

    }

    targets[skill.tree] = skill.points;

  }

  return targets;

}

function scoreArmor(piece, targets, scoreTable) {

  var score = 0;

  for (var i = 0; i < piece.skills.length; i++) {

    var skill = piece.skills[i];

    var target = targets[skill.tree];

    if (target) {

      var toAdd = skill.points;

      if (target < 0) {
        toAdd *= -1;
      } else {
        toAdd *= scoreTable[skill.tree];
      }

      score += toAdd;

    }

  }

  if (piece.slots) {
    score += piece.slots;
  }

  return score;

}

function getPieceCandidates(skillTargets, scoreTable) {

  var gender = document.getElementById('genderCombo').selectedIndex + 1;
  var weapon = document.getElementById('weaponCombo').selectedIndex + 1;

  var selectedParts = {};
  var torsoUpParts = {};

  for ( var key in fullData.armorPieces) {

    var slotEntries = [];
    var torsoUpEntries = [];

    var pieces = fullData.armorPieces[key];

    for (var i = 0; i < pieces.length; i++) {

      var piece = pieces[i];

      if ((piece.type && piece.type !== weapon)
          || (piece.gender && piece.gender !== gender)) {
        continue;
      }

      if (piece.skills.length && piece.skills[0].tree === 'Torso Up') {
        torsoUpEntries.push(piece);
      } else {

        slotEntries.push({
          piece : piece,
          score : scoreArmor(piece, skillTargets, scoreTable)
        });

      }

    }

    slotEntries.sort(function(a, b) {
      return b.score - a.score;
    });

    selectedParts[key] = slotEntries.splice(0, +candidateCountField.value
        || defaultCandidateCount);

    var finalTorsoEntry = {
      names : [],
      defense : 0,
      slots : 0
    };

    for (var i = 0; i < torsoUpEntries.length; i++) {

      var torsoUpEntry = torsoUpEntries[i];

      finalTorsoEntry.names.push(torsoUpEntry.name);

      finalTorsoEntry.defense = Math.max(torsoUpEntry.defense,
          finalTorsoEntry.defense);

      finalTorsoEntry.slots = Math.max(torsoUpEntry.slots,
          finalTorsoEntry.slots);

      if (!finalTorsoEntry.skills) {
        finalTorsoEntry.skills = torsoUpEntry.skills;
      }

    }

    if (torsoUpEntries.length) {
      torsoUpParts[key] = finalTorsoEntry;
    }
  }

  for ( var key in torsoUpParts) {

    var regularCandidates = selectedParts[key];

    regularCandidates.push({
      piece : torsoUpParts[key]
    });

  }

  return selectedParts;

}

function pushNewSlotData(list, amount, torso) {

  if (!amount) {
    return;
  }

  list.push({
    count : amount,
    torso : torso,
    free : amount,
    decorations : []
  });

}

function fetchSkills(relation, skillList) {

  for (var i = 0; i < skillList.length; i++) {

    var skill = skillList[i];

    var tree = skill.tree;

    var currentValue = relation[tree] || 0;
    currentValue += skill.points;
    relation[tree] = currentValue;

  }

}

function getMissing(targets, baseSkills) {

  var missing = {};

  for ( var key in targets) {

    var current = baseSkills[key] || 0;

    var delta = targets[key] - current;

    if ((targets[key] < 0 && delta < 0) || (targets[key] > 0 && delta > 0)) {
      missing[key] = delta;
    }

  }

  return missing;

}

function accountTorsoUp(base, torsoSkills, addedSkills) {

  var multiplier = base['Torso Up'];

  if (!multiplier) {
    return;
  }

  for (var i = 0; i < torsoSkills.length; i++) {

    var skill = torsoSkills[i];
    (addedSkills || base)[skill.tree] += skill.points;
  }

}

function rateSet(targets, charmData, weaponSlots, set, availableSlots) {

  var baseSkills = {};

  pushNewSlotData(availableSlots, charmData.slots);
  pushNewSlotData(availableSlots, weaponSlots);

  for (var i = 0; i < set.length; i++) {

    fetchSkills(baseSkills, set[i].skills);
    pushNewSlotData(availableSlots, set[i].slots, i === chestIndex);
  }

  fetchSkills(baseSkills, charmData.skills);

  accountTorsoUp(baseSkills, set[chestIndex].skills);

  var missing = getMissing(targets, baseSkills);

  var decorationCandidates = getDecorationCandidates(availableSlots, missing,
      targets);

  return fillInDecorations(availableSlots, decorationCandidates, missing,
      targets, baseSkills);

}

function condensateSet(set, slotData, finalSkills) {

  var info = {
    items : [],
    decorations : {},
    decorationCount : 0,
    skills : [],
    freeSlots : 0,
    defense : 0
  };

  for ( var key in finalSkills) {

    var skillList = fullData.skillIndex[key];

    var top = 0;

    for (var i = 0; i < skillList.length; i++) {

      var skill = skillList[i];

      if ((skill.points < 0 && finalSkills[key] > 0)
          || (skill.points > 0 && finalSkills[key] < 0)) {
        continue;
      } else if (top
          && ((top.points < 0 && top.points < skill.points) || (top.points > 0 && top.points > skill.points))) {
        continue;
      }

      if ((finalSkills[key] < 0 && finalSkills[key] <= skill.points)
          || (finalSkills[key] > 0 && finalSkills[key] >= skill.points)) {
        top = skillList[i];
      }

    }

    if (top) {
      info.skills.push(top.name);
    }

  }

  for (i = 0; i < set.length; i++) {
    info.items.push(set[i].name || set[i].names.join('/'));
    info.defense += set[i].defense;
  }

  for (i = 0; i < slotData.length; i++) {

    var data = slotData[i];

    var decos = data.decorations;

    info.freeSlots += data.free;

    for (var j = 0; j < decos.length; j++) {

      var deco = decos[j];

      info.decorationCount++;

      if (info.decorations[deco.name]) {
        info.decorations[deco.name]++;
      } else {
        info.decorations[deco.name] = 1;
      }

    }

  }

  return info;

}

function iterateSlot(targets, charmData, weaponSlots, toFill, parts, index, set) {

  index = index || 0;

  var listToUse = parts[slotsList[index]];

  for (var i = 0; i < listToUse.length; i++) {

    if (toFill.length >= setLimit) {
      return;
    }

    var setToFill = set || [];

    setToFill = setToFill.concat(listToUse[i].piece);

    if (index + 1 >= slotsList.length) {

      var availableSlots = [];

      var combinedSkills = rateSet(targets, charmData, weaponSlots, setToFill,
          availableSlots);

      if (combinedSkills) {
        toFill.push(condensateSet(setToFill, availableSlots, combinedSkills))
      }

    } else {
      iterateSlot(targets, charmData, weaponSlots, toFill, parts, index + 1,
          setToFill);
    }

  }

}

function getScoreTable(skillTargets, charmData) {

  var scores = {};

  var charmSkills = {};
  fetchSkills(charmSkills, charmData.skills);

  var highestScore = 0;
  var highestRequirement = 0;
  for ( var key in skillTargets) {

    var value = fullData.skillScore[key];

    highestRequirement = Math.max(highestRequirement, skillTargets[key]
        - (charmSkills[key] || 0));
    highestScore = Math.max(highestScore, value);

    scores[key] = value;
  }

  for (key in scores) {

    var requirementScore = (skillTargets[key] - (charmSkills[key] || 0))
        / highestRequirement;

    var rawScore = highestScore / scores[key];

    scores[key] = rawScore * requirementScore;

  }

  return scores;

}

document.getElementById('searchButton').onclick = function() {

  if (!selectedSkills.length) {
    return alert('No skills selected.');
  }

  var skillTargets = getSkillTargets();

  if (!Object.keys(skillTargets).length) {
    return alert('No valid skills selected.');
  }

  var sets = [];

  var weaponSlots = +document.getElementById('weaponSlots').value;

  if (weaponSlots < 0) {
    weaponSlots = 0;
  }

  var charmData = getCharmData();

  var scoreTable = getScoreTable(skillTargets, charmData);

  var pieceCandidates = getPieceCandidates(skillTargets, scoreTable);

  iterateSlot(skillTargets, charmData, weaponSlots, sets, pieceCandidates);

  setResults(sets);

};
