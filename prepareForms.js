var skillSelectionBox = document.getElementById('skillSelectionBox');
var selectedSkillsDiv = document.getElementById('selectedSkillsDiv');
var selectedSkills = [];
var talismanOneCombo = document.getElementById('skillOneCombo');
var talismanTwoCombo = document.getElementById('skillTwoCombo');
var candidateCountField = document.getElementById('candidatesField');

var candidateCountLabel = 'candidateCount';

var defaultCandidateCount = 5;

candidateCountField.value = localStorage.getItem(candidateCountLabel)
    || defaultCandidateCount;

candidateCountField.addEventListener('input', function() {
  localStorage.setItem(candidateCountLabel, +candidateCountField.value
      || defaultCandidateCount);
});

var foundTags = {};

var treeTags = {};

function setAddButton(tag, button) {

  button.onclick = function() {
    addSkill(tag);
  }

}

function gatherTags() {

  for (var i = 0; i < fullData.skills.length; i++) {

    var skill = fullData.skills[i];

    var tag = skill.tag;

    if (!tag) {
      tag = treeTags[skill.tree] || 'Misc';
    } else {
      treeTags[skill.tree] = skill.tag;
    }

    var tagInfo = foundTags[tag];

    if (!tagInfo) {

      tagInfo = {
        list : []
      };

      var addBox = document.createElement('div');
      skillSelectionBox.appendChild(addBox);
      var addLabel = document.createElement('span');
      addLabel.innerHTML = tag + ': ';
      addBox.appendChild(addLabel);

      var skillCombo = document.createElement('select');
      addBox.appendChild(skillCombo);
      tagInfo.combobox = skillCombo;

      var skillAdd = document.createElement('input');
      skillAdd.type = 'button';
      skillAdd.value = 'Add';
      addBox.appendChild(skillAdd);
      setAddButton(tag, skillAdd);

    }

    tagInfo.list.push(i);
    foundTags[tag] = tagInfo;

  }

}

function fillComboBoxes() {

  gatherTags();

  for ( var key in foundTags) {

    var tagInfo = foundTags[key];

    tagInfo.list.sort(function(a, b) {
      return fullData.skills[a].name.localeCompare(fullData.skills[b].name);
    });

    tagInfo.list.forEach(function(entry) {

      var opt = document.createElement('option');
      opt.innerHTML = fullData.skills[entry].name;
      tagInfo.combobox.appendChild(opt);

    });

  }

  for (var i = 0; i < fullData.trees.length; i++) {

    var optOne = document.createElement('option');
    optOne.innerHTML = fullData.trees[i];
    talismanOneCombo.appendChild(optOne);

    var optTwo = document.createElement('option');
    optTwo.innerHTML = fullData.trees[i];
    talismanTwoCombo.appendChild(optTwo);

  }
}

function displayNewSkill(selectedIndex) {

  var skillSubDiv = document.createElement('div');

  var skillLabel = document.createElement('span');
  skillLabel.innerHTML = fullData.skills[selectedIndex].name;
  skillLabel.className = 'skillLabel';
  skillSubDiv.appendChild(skillLabel);

  var removeSkillButton = document.createElement('input');
  removeSkillButton.value = 'Remove';
  removeSkillButton.type = 'button';

  removeSkillButton.onclick = function() {
    selectedSkills.splice(selectedSkills.indexOf(selectedIndex), 1);
    skillSubDiv.remove();
  }

  skillSubDiv.appendChild(removeSkillButton);

  selectedSkillsDiv.appendChild(skillSubDiv);

}

function addSkill(tag) {

  var tagInfo = foundTags[tag];

  var selectedIndex = tagInfo.list[tagInfo.combobox.selectedIndex];

  var skill = fullData.skills[selectedIndex];

  for (var i = 0; i < selectedSkills.length; i++) {

    var current = fullData.skills[selectedSkills[i]];

    if (current.name === skill.name) {
      return;
    } else if (current.tree === skill.tree) {

      var currentPositive = current.points > 0;
      var newPositive = skill.points > 0;

      if (currentPositive !== newPositive) {
        return alert('Incompatible skill with ' + current.name + '.');
      }

    }
  }

  selectedSkills.push(selectedIndex);

  displayNewSkill(selectedIndex);

};

fillComboBoxes();
