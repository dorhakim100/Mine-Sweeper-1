'use strict'

var gTime

function renderBoard(mat) {
  var strHtml = '<table><tbody>'
  for (var i = 0; i < mat.length; i++) {
    strHtml += '<tr>'
    for (var j = 0; j < mat[0].length; j++) {
      const cell = mat[i][j].content
      const className = `cell-${i}-${j}`

      strHtml += `<td class="${className}" oncontextmenu="onRightClick(this, ${i},${j})", onclick="onCellClicked(this, ${i},${j})"><span class="hide">${cell}</span> </td>`
    }
    strHtml += '</tr>'
  }
  strHtml += '</tbody></table>'
  const board = document.querySelector('.board')
  board.addEventListener('contextmenu', (e) => {
    e.preventDefault()
  })
  board.innerHTML = strHtml
}

// Random number
function getRandomIntInclusive(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1) + min) // The maximum is inclusive and the minimum is inclusive
}

// Random color
function getRandomColor() {
  var letters = '0123456789ABCDEF'
  var color = '#'
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

// Creates matrix
function createMat(size = 8) {
  const mat = []
  for (var i = 0; i < size; i++) {
    const row = []
    for (var j = 0; j < size; j++) {
      row.push('')
    }
    mat.push(row)
  }
  return mat
}

// Get random empty cell (board)
function getEmptyCells(board) {
  const emptyCells = []
  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board[0].length; j++) {
      const currCell = board[i][j]
      if (board[i][j].content === EMPTY) {
        emptyCells.push({ i, j })
      }
    }
  }
  if (!emptyCells.length) return null
  return emptyCells
}
function getEmptySafeCell(board) {
  const emptyCells = []
  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board[0].length; j++) {
      const currCell = board[i][j]
      if (board[i][j].content !== MINE && board[i][j].isShown === false) {
        emptyCells.push({ i, j })
      }
    }
  }
  if (!emptyCells.length) return null
  const randomIdx = getRandomIntInclusive(0, emptyCells.length - 1)
  const emptyCell = emptyCells[randomIdx]
  emptyCells.splice(randomIdx, 1)
  return emptyCell
}

function countNeighborsMines(rowIdx, colIdx, mat) {
  var minesAround = 0
  for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
    if (i < 0 || i >= mat.length) continue

    for (var j = colIdx - 1; j <= colIdx + 1; j++) {
      if (j < 0 || j >= mat[i].length) continue
      if (i === rowIdx && j === colIdx) continue
      if (mat[i][j].content === MINE) minesAround++
    }
  }
  return minesAround
}

function expandShown(board, rowIdx, colIdx) {
  for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
    if (i < 0 || i >= board.length) continue
    for (var j = colIdx - 1; j <= colIdx + 1; j++) {
      if (j < 0 || j >= board[rowIdx].length) continue
      if (i === rowIdx && j === colIdx) continue
      if (board[i][j].content === MINE) continue
      if (
        (i === rowIdx - 1 && j === colIdx - 1) ||
        (i === rowIdx + 1 && j === colIdx + 1) ||
        (i === rowIdx + 1 && j === colIdx - 1) ||
        (i === rowIdx - 1 && j === colIdx + 1)
      )
        continue
      if (board[i][j].isShown === true) continue
      var currElCell = document.querySelector(`.cell-${i}-${j}`)
      board[i][j].content = countNeighborsMines(i, j, board)
      currElCell.classList.add('shown')
      board[i][j].isShown = true
      if (board[i][j].content !== 0) {
        currElCell.innerText = board[i][j].content
        continue
      } else if (board[i][j].content === 0) {
        expandShown(board, i, j)
      }
    }
  }
}

function expend(rowIdx, colIdx, mat) {
  for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
    if (i < 0 || i >= mat.length) continue

    for (var j = colIdx - 1; j <= colIdx + 1; j++) {
      if (j < 0 || j >= mat[i].length) continue
      if (i === rowIdx && j === colIdx) continue
      console.log('mat[i][j].content:', mat[i][j].content)
      const elTd = document.querySelector(`.cell-${i}-${j}`)
      console.log('elTd:', elTd)
      console.log('elTd.innerText:', elTd.innerText)
      if (mat[i][j].content !== MINE) {
        onCellClicked(elTd, i, j)
      }
    }
  }
  return gNeighborsCount
}

function startTimer() {
  var startTime = Date.now()
  var strHtml
  var elTimer = document.querySelector('.stopwatch')
  gTimer = setInterval(() => {
    const elapsedTime = Date.now() - startTime
    const formattedTime = (elapsedTime / 1000).toFixed(1)
    elTimer.textContent = formattedTime
    strHtml = `<div class="stopwatch">${elapsedTime}</div>`
    gTime = formattedTime
  }, 37)
  elTimer.innerHTML = strHtml
  return
}

function resetStopwatch() {
  if (gIsOver !== true) {
    return
  }
  clearInterval(timer)
}
