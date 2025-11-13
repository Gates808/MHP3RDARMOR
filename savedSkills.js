var savedSkills;
var skillsStorageLabel = 'savedSkills';
var newSetField = document.getElementById('skillsLabelField');
var savedSkillsCombo = document.getElementById('savedSkillsCombobox');

var noSkillsLabel = 'No saved skills';

function initSavedSkills() {

  savedSkills = localStorage.getItem(skillsStorageLabel);

  try {
    savedSkills = (savedSkills && JSON.parse(savedSkills)) || [];
  } catch (error) {
    savedSkills = [];
  }

  if (!savedSkills.length) {

    var option = document.createElement('option');
    option.innerHTML = noSkillsLabel;

    savedSkillsCombo.appendChild(option);

  } else {

    for (var i = 0; i < savedSkills.length; i++) {
      addToSavedSkills(savedSkills[i]);
    }

  }

}

function addToSavedSkills(info) {

  var newOption;

  if (savedSkills.length === 1 && savedSkillsCombo.children.length) {
    newOption = savedSkillsCombo.children[0];
  } else {
    newOption = document.createElement('option');
    savedSkillsCombo.appendChild(newOption);
  }

  newOption.innerHTML = info.label;

}

document.getElementById('deleteSkillsButton').onclick = function() {

  if (!savedSkills.length) {
    return;
  }

  savedSkills.splice(savedSkillsCombo.selectedIndex, 1);

  localStorage.setItem(skillsStorageLabel, JSON.stringify(savedSkills));

  if (savedSkills.length) {
    savedSkillsCombo.children[savedSkillsCombo.selectedIndex].remove();
  } else {
    savedSkillsCombo.children[0].innerHTML = noSkillsLabel;
  }

}

document.getElementById('selectSkillsButton').onclick = function() {

  if (!savedSkills.length) {
    return;
  }

  var info = savedSkills[savedSkillsCombo.selectedIndex];

  while (selectedSkills.length) {
    selectedSkillsDiv.children[selectedSkillsDiv.children.length - 1].remove();
    selectedSkills.pop();
  }

  selectedSkills = selectedSkills.concat(info.skills);

  for (var i = 0; i < selectedSkills.length; i++) {
    displayNewSkill(selectedSkills[i]);
  }

}

document.getElementById('saveSkillButton').onclick = function() {

  if (!selectedSkills.length) {
    return;
  }

  var entry = {
    label : newSetField.value || 'Unamed skillset',
    skills : JSON.parse(JSON.stringify(selectedSkills))
  };

  savedSkills.push(entry);

  addToSavedSkills(entry);

  savedSkillsCombo.selectedIndex = savedSkillsCombo.options.length - 1;

  localStorage.setItem(skillsStorageLabel, JSON.stringify(savedSkills));

};

initSavedSkills();