var savedTalismans;
var storageLabel = 'savedTalismans';

var savedTalismansCombo = document.getElementById('savedTalismansCombobox');

var noTalismansLabel = 'No saved talismans';

function initSavedTalismans() {

  savedTalismans = localStorage.getItem(storageLabel);

  try {
    savedTalismans = (savedTalismans && JSON.parse(savedTalismans)) || [];
  } catch (error) {
    savedTalismans = [];
  }

  if (!savedTalismans.length) {

    var option = document.createElement('option');
    option.innerHTML = noTalismansLabel;

    savedTalismansCombo.appendChild(option);

  } else {

    for (var i = 0; i < savedTalismans.length; i++) {
      addToSavedTalismans(savedTalismans[i]);
    }

  }

}

function addToSavedTalismans(info) {

  var label = '';

  for (var i = 0; i < info.skills.length; i++) {

    var skill = info.skills[i];

    if (i) {
      label += ', ';
    }

    label += skill.tree + '(' + skill.points + ')';

  }

  if (info.slots) {

    if (label) {
      label += ', ';
    }

    label += 'Slots: ' + info.slots;

  }

  var newOption;

  if (savedTalismans.length === 1 && savedTalismansCombo.children.length) {
    newOption = savedTalismansCombo.children[0];
  } else {
    newOption = document.createElement('option');
    savedTalismansCombo.appendChild(newOption);
  }

  newOption.innerHTML = label;

}

document.getElementById('deleteTalismanButton').onclick = function() {

  if (!savedTalismans.length) {
    return;
  }

  savedTalismans.splice(savedTalismansCombo.selectedIndex, 1);

  localStorage.setItem(storageLabel, JSON.stringify(savedTalismans));

  if (savedTalismans.length) {
    savedTalismansCombo.children[savedTalismansCombo.selectedIndex].remove();
  } else {
    savedTalismansCombo.children[0].innerHTML = noTalismansLabel;
  }

}

document.getElementById('selectTalismanButton').onclick = function() {

  if (!savedTalismans.length) {
    return;
  }

  var info = savedTalismans[savedTalismansCombo.selectedIndex];

  document.getElementById('slotsField').value = info.slots || 0;

  if (info.skills[0]) {
    document.getElementById('skillOneField').value = info.skills[0].points;

    talismanOneCombo.selectedIndex = fullData.trees
        .indexOf(info.skills[0].tree);

  } else {
    document.getElementById('skillOneField').value = '0';
  }

  if (info.skills[1]) {

    talismanTwoCombo.selectedIndex = fullData.trees
        .indexOf(info.skills[1].tree);
    document.getElementById('skillTwoField').value = info.skills[1].points;
  } else {
    document.getElementById('skillTwoField').value = '0';
  }

}

document.getElementById('saveTalismanButton').onclick = function() {

  var talismanInfo = getCharmData();

  savedTalismans.push(talismanInfo);

  addToSavedTalismans(talismanInfo);

  savedTalismansCombo.selectedIndex = savedTalismansCombo.options.length - 1;

  localStorage.setItem(storageLabel, JSON.stringify(savedTalismans));

};

initSavedTalismans();