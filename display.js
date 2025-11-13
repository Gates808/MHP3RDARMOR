var resultBox = document.getElementById('setsArea');
var sortCombo = document.getElementById('sortCombo');

var sortFunctions = [ function(a, b) {
  return b.defense - a.defense;
}, function(a, b) {
  return b.freeSlots - a.freeSlots;
}, function(a, b) {
  a.decorationCount - b.decorationCount;
} ];

var sets;

sortCombo.onchange = function() {

  if (sets) {
    displayResults();
  }

};

function setResults(newResults) {

  sets = newResults;

  displayResults();

}

function displayResults() {

  sets.sort(sortFunctions[sortCombo.selectedIndex]);

  var resultString = 'Found ' + sets.length + ' results.\n\n';

  for (var i = 0; i < sets.length; i++) {

    var set = sets[i];

    var setString = i ? '\n----------------------\n\n' : '';

    setString += '#' + (i + 1) + ':\n\nItems:\n';

    for (var j = 0; j < set.items.length; j++) {
      setString += set.items[j] + '\n';
    }

    setString += '\nDecorations:\n';
    for ( var key in set.decorations) {
      setString += key + ': ' + set.decorations[key] + '\n';
    }

    setString += '\nSkills:\n';

    for (j = 0; j < set.skills.length; j++) {
      setString += set.skills[j] + '\n';
    }

    setString += '\nMisc:\nDefense: ' + set.defense + '\nFree slots: '
        + set.freeSlots + '\n';

    resultString += setString;

  }

  resultBox.innerHTML = resultString;

}