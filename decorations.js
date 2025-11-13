function getDecorationCandidates(availableSlots, missing, target) {

  var largest = 0;

  for (var i = 0; i < availableSlots.length; i++) {
    if (availableSlots[i].count > largest) {
      largest = availableSlots[i].count;
    }
  }

  var candidates = {};

  for ( var key in missing) {

    var available = fullData.decorationIndex[key];

    for (var j = 0; j < available.length; j++) {

      var decoration = fullData.decorations[available[j]];

      if (decoration.slots > largest) {
        continue;
      }

      var skills = decoration.skills;

      var goal = missing[key];

      for (var i = 0; i < skills.length; i++) {

        var skill = skills[i];

        if (skill.tree != key) {
          continue;
        }

        if ((skill.points > 0 && goal > 0) || (skill.points < 0 && goal < 0)) {

          var subCandidates = candidates[skill.tree] || [];

          subCandidates.push({
            decoration : decoration,
            points : skill.points
          });

          candidates[skill.tree] = subCandidates;

        }
      }

    }

    if (candidates[key]) {
      candidates[key].sort(function(a, b) {
        return a.decoration.slots - b.decoration.slot;
      });
    }

  }

  return candidates;

}

function getCombinedSkills(availableSlots, baseSkills) {

  var decorationSkills = {};

  var chestSkills = [];

  for (var i = 0; i < availableSlots.length; i++) {

    var slot = availableSlots[i];

    for (var j = 0; j < slot.decorations.length; j++) {

      if (slot.torso) {
        chestSkills = chestSkills.concat(slot.decorations[j].skills);
      }

      fetchSkills(decorationSkills, slot.decorations[j].skills);
    }

  }

  accountTorsoUp(baseSkills, chestSkills, decorationSkills);

  for ( var key in baseSkills) {

    if (decorationSkills[key]) {
      decorationSkills[key] += baseSkills[key];
    } else {
      decorationSkills[key] = baseSkills[key];
    }

  }

  return decorationSkills;

}

function cleanSlots(slotData) {

  for (var i = 0; i < slotData.length; i++) {

    var slot = slotData[i];

    slot.free = slot.count;
    slot.decorations = [];

  }

}

function placeDecoration(decoration, availableSlots, torsoMultiplier) {

  var smallestSlot;

  for (var i = 0; i < availableSlots.length; i++) {

    var slot = availableSlots[i];

    if (slot.free === decoration.slots) {
      smallestSlot = slot;
      break;
    } else if (slot.free > decoration.slots
        && (!smallestSlot || slot.free < smallestSlot.free)) {
      smallestSlot = slot;
    }

  }

  if (smallestSlot) {
    smallestSlot.free -= decoration.slots;

    slot.decorations.push(decoration);

    return smallestSlot.torso ? torsoMultiplier : 1;
  }

}

function getPlacementOrder(candidateList) {

  var scores = {};

  for ( var skill in candidateList) {

    var candidates = candidateList[skill];

    var points = 0;
    var costs = 0;

    for (var i = 0; i < candidates.length; i++) {

      var decoration = candidates[i];

      var score = decoration.points;

      if (score < 0) {
        score *= -1;
      }

      points += score;
      costs += decoration.decoration.slots;

    }

    scores[skill] = points / costs;

  }

  return Object.keys(scores).sort(function(a, b) {
    return scores[a] - scores[b];
  });

}

// returns the dictionary with final skills if we fit all skills
function fillInDecorations(availableSlots, decorationCandidates, missing,
    targets, baseSkills, retry) {

  var torsoMultiplier = (baseSkills['Torso Up'] || 0) + 1;

  var addedSkills = {};

  var order = getPlacementOrder(decorationCandidates);

  var placement = function(key) {

    var targetValue = missing[key];

    var skillCandidates = decorationCandidates[key];

    var decorationIndex = skillCandidates.length - 1;

    while (true) {

      var decorationData = skillCandidates[decorationIndex];

      // the current decoration is overkill and we got smaller options, so
      // go to the next one
      if (((decorationData.points > targetValue && targetValue > 0) || (decorationData.points < targetValue && targetValue < 0))
          && decorationIndex) {
        decorationIndex--;
        continue;
      }

      var addedMultiplier = placeDecoration(decorationData.decoration,
          availableSlots, torsoMultiplier);

      if (addedMultiplier) {

        var delta = addedMultiplier * decorationData.points;

        // we reached the goal, stop filling for this skill
        if (targetValue > 0) {

          if (targetValue <= delta) {
            break;
          }

        } else {

          if (targetValue >= delta) {
            break;
          }
        }

        targetValue -= delta;
        // we did not reach the goal, decrease target and loop again

      } else if (!decorationIndex) {
        return false;
        // we could not fit the smallest decoration, give up on this skill

      } else {
        decorationIndex--;
        // we got smaller decorations to try
      }

    }

  };

  order.forEach(placement);

  var combinedSkills = getCombinedSkills(availableSlots, baseSkills);

  var finalMissing = getMissing(targets, combinedSkills);

  if (Object.keys(finalMissing).length) {

    if (retry) {
      return false;
    }

    for (key in targets) {

      if (finalMissing[key]) {
        finalMissing[key] += targets[key];
      } else {
        finalMissing[key] = targets[key];
      }

    }

    cleanSlots(availableSlots);

    return fillInDecorations(availableSlots, getDecorationCandidates(
        availableSlots, finalMissing, targets), finalMissing, targets,
        baseSkills, true);

  }

  return combinedSkills;

}