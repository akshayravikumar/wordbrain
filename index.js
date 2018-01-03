function isAlpha(str) {
  return /^[a-zA-Z]+$/.test(str);
}

function updateMessage(message) {
  $("#message").html(message)
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function solve(grid, lengths) {
  var solutions = [];
  var winners = [];
  var check_index = function(i, j) {
    if (i >= 0 && i < grid.length) {
      if (j >= 0 && j < grid[i].length) {
        return true;
      }
    }
    return false;
  }

  var recurse = function(cur_words, cur_string, length_idx, word_idx, cur_indices) {
    // if we've finished the last word
    if (length_idx === lengths.length) {
      var cur_words_copy = cur_words.slice();
      cur_words_copy.sort();
      var exists = false;
      for (var i = 0; i < winners.length; i++) {
        if (arraysEqual(winners[i], cur_words_copy)) {
          exists = true;
        }
      }
      if (!exists) {
        winners.push(cur_words_copy);
        var score = 0;
        for (var i = 0; i < cur_words.length; i++) {
          score += FREQUENCY[cur_words[i]];
        }
        solutions.push({
          "words": cur_words.slice(),
          "score": score
        });
      }
      return;
    }

    // if we need to move onto the next word
    if (word_idx === lengths[length_idx]) {
      candidate = cur_string.join("");
      
      if (WORDS.has(candidate)) {
        var old_grid = new Array(grid.length)
        for (var i = 0; i < grid.length; i++) {
          old_grid[i] = grid[i].slice();
        }


        for (var i = 0; i < cur_indices.length; i++) {
          var ele = cur_indices[i];
          grid[ele[0]][ele[1]] = null;
        }

        for (var i = 0; i < grid.length; i++) {
          var newRow = [];
          for (var j = 0; j < grid[i].length; j++) {
            if (grid[i][j] !== null) {
              newRow.push(grid[i][j])
            }
          }
          grid[i] = newRow;
        }

        cur_words.push(candidate);
        recurse(cur_words, [], length_idx + 1, 0, []);

        for (var i = 0; i < grid.length; i++) {
          grid[i] = old_grid[i];
        }

        cur_words.pop();
      }
      return;
    }

    // start looking for a new word

    if (cur_indices.length === 0) {
      for (var i = 0; i < grid.length; i++) {
        for (var j = 0; j < grid[i].length; j++) {
          cur_indices.push([i, j]);
          cur_string.push(grid[i][j]);
          recurse(cur_words, cur_string, length_idx, word_idx + 1, cur_indices);
          cur_indices.pop();
          cur_string.pop();
        }
      }
      return;
    }

    var options = [[-1, -1], [-1, 0], [-1, 1], [0, 1], [0, -1], [1, -1], [1, 0], [1, 1]];
    for (var i = 0; i < options.length; i++) {
      var dx = options[i][0];
      var dy = options[i][1];
      var new_x = cur_indices[cur_indices.length - 1][0] + dx;
      var new_y = cur_indices[cur_indices.length - 1][1] + dy;
      if (check_index(new_x, new_y)) {
        var exists = false;
        for (var j = 0; j < cur_indices.length; j++) {
          if (arraysEqual([new_x, new_y], cur_indices[j])) {
            exists = true;
          }
        }
        if (!exists) {
          var letter = grid[new_x][new_y];
          var cand = cur_string.join("") + letter
          if (PREFIXES.has(cand)) {
            cur_string.push(letter)
            cur_indices.push([new_x, new_y])
            recurse(cur_words, cur_string, length_idx, word_idx + 1, cur_indices);
            cur_indices.pop();
            cur_string.pop();
          }
        }
      }
    }
  }

  recurse([], [], 0, 0, []);
  return solutions;

}


function submitSearch() {
  $("#results").empty();

  var raw_grid = $("#inputGrid").val().split("\n");
  var grid = [];
  for (var i = 0; i < raw_grid.length; i++) {
    if (raw_grid[i].length !== 0) {
      grid.push(raw_grid[i]);  
    }
  }

  for (var i = 0; i < grid.length; i++) {
    grid[i] = grid[i].replace(/\s+/g, '');
    grid[i] = grid[i].toLowerCase();
    if (!(isAlpha(grid[i]))) {
      updateMessage("Grid should consist only of letters.")
      return;
    }

    if (grid[i].length !== grid[0].length) {
      updateMessage("Grid should be rectangular.")
      return;
    }
  }

  var lengths = $("#inputLengths").val().trim().split(" ");
  var sum = 0;
  for (var i = 0; i < lengths.length; i++) {
    if (isNaN(lengths[i])) {
      updateMessage("Lengths should be integers.")
      return;
    }

    lengths[i] = parseInt(lengths[i]);
    sum += lengths[i];
  }

  if (isNaN(sum)) {
    updateMessage("Lengths should be integers.")
    return;
  }

  var gridLength = grid[0].length;
  var gridSize = grid.length * gridLength;
  if (sum !== gridSize) {
      updateMessage("Lengths sum to " + sum + ", but grid size is " + gridSize);
      return;
  }

  for (var i = 0; i < grid.length; i++) {
    grid[i] = grid[i].split("");
  }

  var new_grid = [];

  for (var j = 0; j < gridLength; j++) {
    var column = [];
    for (var i = 0; i < grid.length; i++) {
      column.push(grid[i][j]);
    }
    column.reverse();
    new_grid.push(column);
  }

  updateMessage("Solving...")
  var solutions = solve(new_grid, lengths);

  if (solutions.length === 0) {
    updateMessage("No solutions found. :(");
    return;
  }

  solutions.sort(function(a, b) {
    return - a["score"] + b["score"];
  });

  var message = " solutions!";
  if (solutions.length === 1) {
    message = " solution!";
  }
  updateMessage("Found " + solutions.length + message);

  var tableHead = "<thead><tr><th>Solution</th><th>Confidence</th></tr></thead>";
  $("#results").append(tableHead);
  for (var i = 0; i < solutions.length; i++) {
    var confidence = (solutions[i]["score"]/solutions[0]["score"] * 100).toFixed(2);
    var newTableRow = "<tr>";
    newTableRow += "<td>" + solutions[i]["words"].join(" ").toUpperCase().trim() + "</td> ";
    newTableRow += "<td>" + confidence + "%</td>";
    newTableRow += "</tr>";
    $("#results").append(newTableRow);
  }
}

// search on ENTER or click
$("#submitForm").click(function () {
  submitSearch();
});

$("#inputGrid").html("TUQHO\nNTCOR\nUSIER\nGWSUA\nOHSLF");

$("#inputLengths").val("6 6 5 3 5");


