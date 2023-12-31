'use strict'

var board

const EMPTY = ' '
const MINE = '💣'
const FLAG = '🚩'

const minesIdx = []

var gBoard
var gLevel = {
  boardSize: 8,
  MINES: 14,
}
var gGame = {
  isOn: false,
  shownCount: 0,
  markedCounter: 0,
  secsPassed: 0,
}
var gMinesCount = 0
var gMarkedCounter = 0
var gTimer
var gIsStart = false

var gLives

var gNumOfHints
var gIsHint = true

var bestTime4 = localStorage.getItem('4Time')
console.log('bestTime4:', bestTime4)
var bestTime8 = localStorage.getItem('8Time')
var bestTime12 = localStorage.getItem('12Time')

function init() {
  //   console.table(mat)
  gBoard = createBoard()
  renderBoard(gBoard)
  renderLives()
  setTimesLocalStorage()
}

function chooseBoardSize(size) {
  clearInterval(gTimer)
  gTime = 0
  var elTimer = document.querySelector('.stopwatch')
  var strHtml = `00:00:00`
  elTimer.innerText = strHtml
  var boardSize
  minesIdx.length = 0
  if (!size) {
    boardSize = '8X8'
  } else {
    boardSize = size.innerText
  }
  var rows
  switch (boardSize) {
    case '4X4':
      gLevel = {
        boardSize: 4,
        MINES: 2,
      }
      rows = 4
      gBoard = createBoard(rows)
      renderBoard(gBoard)

      break
    case '8X8':
      gLevel = {
        boardSize: 8,
        MINES: 14,
      }
      rows = 8
      gBoard = createBoard(rows)
      renderBoard(gBoard)
      if (gTime < bestTime4) bestTime4 = gTime
      break
    case '12X12':
      gLevel = {
        boardSize: 12,
        MINES: 32,
      }
      rows = 12
      gBoard = createBoard(rows)
      renderBoard(gBoard)
      break
  }
  console.log('gLevel:', gLevel)
  return gLevel
}

function createBoard(boardSize = 8) {
  const board = []
  gLives = 3
  gNumOfHints = 3
  gIsHint = false
  for (var i = 0; i < boardSize; i++) {
    board.push([])
    for (var j = 0; j < boardSize; j++) {
      board[i][j] = {
        content: EMPTY,
        isMarked: false,
        isShown: false,
      }
    }
  }

  return board
}

function setMines(board) {
  for (var i = 0; i < gLevel.MINES; i++) {
    var randomI = getEmptyCell(board).i
    var randomJ = getEmptyCell(board).j
    minesIdx.push({ randomI, randomJ })
    console.log('minesIdx:', minesIdx)
    board[randomI][randomJ].content = MINE
    const elSpan = document.querySelector(`.cell-${randomI}-${randomJ} span`)
    elSpan.innerText = MINE
    // console.log(
    //   'board[randomI][randomJ].content:',
    //   board[randomI][randomJ].content
    // )
  }
}

function onCellClicked(elCell, i, j) {
  if (!gGame.isOn) {
    startTimer()
    setMines(gBoard)
    gGame.isOn = true
  }
  if (gIsHint) {
    hint(i, j, gBoard)
  } else if (gIsHint === false) {
    if (gBoard[i][j].content === MINE) {
      var span = document.querySelector(`.cell-${i}-${j} span`)
      span.classList.remove('hide')
      gLives--
      renderLives()
      if (gLives === 0) {
        renderLives()
        lost()
      }
      // var cellContent = elCell.innerText
    } else {
      elCell.innerText = countNeighborsMines(i, j, gBoard)
      // gBoard[i][j].isShown = true
      gGame.shownCount++
      expandShown(gBoard, i, j)
    }
    console.log('isGameOver():', isGameOver())
    if (!isGameOver()) {
      setTimeout(() => {
        const elModal = document.querySelector('.modal')
        elModal.style.display = 'block'
      }, 1500)
    }
  }
  gBoard[i][j].isShown = true
  console.log('gBoard[i][j].isShown:', gBoard[i][j].isShown)
  // console.log('gLevel.boardSize ** 2:', gLevel.boardSize ** 2)
  // console.log('gLevel.MINES:', gLevel.MINES)
  // console.log('gGame.shownCount:', gGame.shownCount)
}

function onRightClick(elBtn, i, j) {
  if (gBoard[i][j].content === MINE && gBoard[i][j].isMarked === false) {
    gGame.markedCounter++
    console.log('gGame.markedCounter:', gGame.markedCounter)
  }
  if (gBoard[i][j].content === MINE && gBoard[i][j].isMarked) {
    gGame.markedCounter--
    console.log('gGame.markedCounter:', gGame.markedCounter)
  }
  if (gBoard[i][j].isMarked) {
    gBoard[i][j].isMarked = false
    elBtn.classList.remove('marked')
  } else {
    gBoard[i][j].isMarked = true
    elBtn.classList.add('marked')
  }
  const cellContent = elBtn.innerText
  if (!isGameOver()) {
    setTimeout(() => {
      const elModal = document.querySelector('.modal')
      elModal.style.display = 'block'
    }, 1500)
  }
  console.log('gGame.isOn:', isGameOver())
  console.log('gLevel.boardSize ** 2:', gLevel.boardSize ** 2)
  console.log('gLevel.MINES:', gLevel.MINES)
  console.log('gGame.shownCount:', gGame.shownCount)
}

function isGameOver() {
  if (
    gGame.markedCounter === gLevel.MINES &&
    gGame.shownCount === gLevel.boardSize ** 2 - gLevel.MINES
  ) {
    clearInterval(gTimer)
    gGame.isOn = false
    const elModalText = document.querySelector('.modal-content')
    elModalText.innerHTML = `<h1>Game Over</h1>
    <h2>You have won!</h2>
    <h3>Time: ${gTime}</h3>
    <button class="again-btn" onclick="onPlayAgain()">Play again</button>`
    switch (gLevel.boardSize) {
      case 4:
        if (!bestTime4) {
          bestTime4 = gTime
          localStorage.setItem('4Time', bestTime4)
          elTimeScore4.innerText = `Best time:${bestTime4}`
        }
        if (gTime < bestTime4) {
          bestTime4 = gTime
          const elTimeScore4 = document.querySelector('.time-four')
          localStorage.setItem('4Time', bestTime4)
          elTimeScore4.innerText = `Best time:${bestTime4}`
        }
        break
      case 8:
        if (!bestTime8) {
          bestTime8 = gTime
          localStorage.removeItem('4Time')
          localStorage.setItem('8Time', bestTime8)
          elTimeScore8.innerText = `Best time:${bestTime8}`
        }
        if (gTime < bestTime8) {
          bestTime8 = gTime
          const elTimeScore8 = document.querySelector('.time-eight')
          elTimeScore8.innerText = `Best time:${bestTime8}`
          localStorage.removeItem('8Time')
          localStorage.setItem('8Time', bestTime8)
        }
        break
      case 12:
        if (!bestTime12) {
          bestTime12 = gTime
          localStorage.setItem('12Time', bestTime12)
          elTimeScore8.innerText = `Best time:${bestTime12}`
        }
        if (gTime < bestTime12) {
          bestTime12 = gTime
          const elTimeScore12 = document.querySelector('.time-twelve')
          elTimeScore12.innerText = `Best time:${bestTime12}`
          localStorage.removeItem('12Time')
          localStorage.setItem('12Time', bestTime12)
        }
        break
    }
  }

  return gGame.isOn
}

function onPlayAgain() {
  clearInterval(gTimer)
  gTime = 0
  gLives = 3
  gNumOfHints = 3
  gIsHint = false
  renderLives()
  renderHints()
  var strHtml
  var elTimer = document.querySelector('.stopwatch')
  strHtml = `00:00:00`
  elTimer.innerText = strHtml
  const elModal = document.querySelector('.modal')
  elModal.style.display = 'none'
  gGame = {
    isOn: false,
    shownCount: 0,
    markedCounter: 0,
    secsPassed: 0,
  }
  gLevel = {
    boardSize: 8,
    MINES: 14,
  }
  gBoard = createBoard()
  renderBoard(gBoard)
}

function lost() {
  gGame.isOn = false
  clearInterval(gTimer)
  var strHtml
  var elTimer = document.querySelector('.stopwatch')
  strHtml = `DEAD`
  elTimer.innerText = strHtml
  const elModalText = document.querySelector('.modal-content')
  elModalText.innerHTML = `<h1>Game Over</h1>
  <h2>You have lost</h2>
  <button class="again-btn" onclick="onPlayAgain()">Play again</button>`
  const elModal = document.querySelector('.modal')
  setTimeout(() => {
    elModal.style.display = 'block'
  }, 1500)
}

function renderLives() {
  const elLivesBar = document.querySelector('.lives-count')
  switch (gLives) {
    case 3:
      elLivesBar.innerHTML =
        '<img src="js/heart.gif"></img><img src="js/heart.gif"></img><img src="js/heart.gif"></img>'
      break
    case 2:
      elLivesBar.innerHTML =
        '<img src="js/heart.gif"></img><img src="js/heart.gif"></img>'
      break
    case 1:
      elLivesBar.innerHTML = '<img src="js/heart.gif"></img>'
      break
    case 0:
      elLivesBar.innerHTML = '<img src="js/broken-heart.gif"></img>'
      break
  }
}

function onHintClick() {
  if (gNumOfHints === 0 || gIsHint) return
  gIsHint = true
  gNumOfHints--
  console.log('gNumOfHints:', gNumOfHints)
  renderHints()
}
function renderHints() {
  const elHint = document.querySelector('.hint')
  switch (gNumOfHints) {
    case 3:
      elHint.innerHTML =
        '<img src="js/lamp.png"></img><img src="js/lamp.png"></img><img src="js/lamp.png"></img>'
      break
    case 2:
      elHint.innerHTML =
        '<img src="js/lamp.png"></img><img src="js/lamp.png"></img>'
      break
    case 1:
      elHint.innerHTML = '<img src="js/lamp.png"></img>'
      break
    case 0:
      elHint.style.filter = 'grayscale(100%)'
      break
  }
}
function hint(i, j, board) {
  var counter = 0
  var currElCell
  const elCells = []
  var span
  if (gIsHint) {
    for (var checkNeigI = i - 1; checkNeigI <= i + 1; checkNeigI++) {
      if (checkNeigI < 0 || checkNeigI >= board.length) continue
      for (var checkNeigJ = j - 1; checkNeigJ <= j + 1; checkNeigJ++) {
        if (checkNeigJ < 0 || checkNeigJ >= board[i].length) continue
        currElCell = {
          type: 'cell',
          content: document.querySelector(`.cell-${checkNeigI}-${checkNeigJ}`),
        }
        if (gBoard[checkNeigI][checkNeigJ].content === MINE) {
          span = {
            type: 'span',
            content: document.querySelector(
              `.cell-${checkNeigI}-${checkNeigJ} span`
            ),
          }
          span.content.classList.remove('hide')
          elCells.push(span)
        } else {
          currElCell.content.innerText = countNeighborsMines(
            checkNeigI,
            checkNeigJ,
            gBoard
          )
          elCells.push(currElCell)
        }
        setTimeout(() => {
          if (elCells[counter].type === 'span') {
            elCells[counter].content.classList.add('hide')
            counter++
            // console.log('counter:', counter)
          } else if (elCells[counter].type === 'cell') {
            console.log(
              'gBoard[checkNeigI][checkNeigJ].isShown:',
              gBoard[checkNeigI][checkNeigJ].isShown
            )
            elCells[counter].content.innerText = ''
            counter++
            // console.log('counter:', counter)
          }
        }, 1000)
      }
    }
  }
  gIsHint = false
}

function setTimesLocalStorage() {
  const elTimeScore4 = document.querySelector('.time-four')
  var fourTime = localStorage.getItem('4Time')
  elTimeScore4.innerText = `Best time:${fourTime}`
  const elTimeScore8 = document.querySelector('.time-eight')
  var eightTime = localStorage.getItem('8Time')
  elTimeScore8.innerText = `Best time:${eightTime}`
  const elTimeScore12 = document.querySelector('.time-twelve')
  var twelveTime = localStorage.getItem('12Time')
  elTimeScore12.innerText = `Best time:${twelveTime}`
}
