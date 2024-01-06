'use strict'

var board

const EMPTY = ' '
var MINE = '💣'
const FLAG = '🚩'

const Mines = []

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

var gTime
var bestTime4 = localStorage.getItem('4Time')
// console.log('bestTime4:', bestTime4)
var bestTime8 = localStorage.getItem('8Time')
// console.log('bestTime8:', bestTime8)
var bestTime12 = localStorage.getItem('12Time')
// console.log('bestTime12:', bestTime12)

var gSafeClicks

var gIsManualMode = false
var gRemainingMines = 0
var isFirstClick

var gPreBoard = []
var undoCounter = 0
var desiredTurn
var gIsMine
var mineCell

var isDarkMode = false

var gIsMegaHint = false
var megaFirst
var megaSecond
var firstCell
var secondCell
var gRemainingMegaHint

const shownCells = []

function init() {
  gBoard = createBoard()
  renderBoard(gBoard)

  renderLives()
  setTimesLocalStorage()
  gRemainingMegaHint = 1
}

function chooseBoardSize(size) {
  onPlayAgain()
  var boardSize
  Mines.length = 0
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
  window.scrollTo({
    top: 1000,
    left: 100,
    behavior: 'smooth',
  })

  return gLevel
}

function createBoard(boardSize = gLevel.boardSize) {
  const board = []

  gLives = 3
  gNumOfHints = 3
  gSafeClicks = 3
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

function setMines(board, clickedI, clickedJ) {
  const emptyCells = getEmptyCells(board)
  for (var i = 0; i < gLevel.MINES; i++) {
    const randomIdx = getRandomIntInclusive(0, emptyCells.length - 1)
    const randomEmptyCell = emptyCells[randomIdx]
    emptyCells.splice(randomIdx, 1)
    const randomI = randomEmptyCell.i
    const randomJ = randomEmptyCell.j

    Mines.push({ randomI, randomJ })
    board[randomI][randomJ].content = MINE
    const elSpan = document.querySelector(`.cell-${randomI}-${randomJ} span`)
    elSpan.innerText = MINE
  }
}

function setMinesManually(elCell, i, j) {
  if (gBoard[i][j].content === MINE) {
    const audio = new Audio('js/wrong-mine-spot.mp3')
    audio.play()
    return
  }
  const audio = new Audio('js/mine-loaded.mp3')
  audio.play()
  gBoard[i][j].content = MINE
  var elSpan = document.querySelector(`.cell-${i}-${j} span`)
  elSpan.innerText = MINE
  gRemainingMines--
  const elManualRemains = document.querySelector('.manual-remains')
  elManualRemains.innerHTML = `<div class="manual-remains"><h2>mines remain: ${gRemainingMines}</h2></div>`
  elSpan.classList.remove('hide')
  elSpan.classList.add('mine')
  if (gRemainingMines === 0) {
    const elMinesCells = document.querySelectorAll('.mine')
    setTimeout(() => {
      for (var i = 0; i < elMinesCells.length; i++) {
        elMinesCells[i].classList.add('hide')
      }
    }, 2000)
  }
  Mines.push({ i, j })
}

function game(elCell, i, j) {
  if (isFirstClick === true) {
    startTimer()
    gBoard[i][j].isShown = true
    isFirstClick = false
  }
  if (gGame.isOn === true) {
    if (gIsHint && gIsMegaHint === false) {
      hint(i, j, gBoard)
      const sound = new Audio('js/hintSound.mp3')
      sound.play()
    } else if (gIsHint === false && gIsMegaHint === false) {
      if (gBoard[i][j].content === MINE) {
        var span = document.querySelector(`.cell-${i}-${j} span`)
        span.classList.remove('hide')
        setTimeout(() => {
          span.classList.add('hide')
        }, 2000)
        gLives--
        mineCell = { i, j }
        const sound = new Audio('js/explosion.mp3')
        sound.play()
        renderLives()
        if (gLives === 0) {
          renderLives()
          const elRestartBtn = document.querySelector('.restart-btn')
          elRestartBtn.style.backgroundImage = 'url(js/alien-lose.png)'
          lost()
          gIsManualMode = false
        }
      } else {
        gBoard[i][j].content = countNeighborsMines(i, j, gBoard)
        gBoard[i][j].isShown = true
        if (gBoard[i][j].content !== 0) {
          elCell.innerText = gBoard[i][j].content
          elCell.classList.add('shown')
          gBoard[i][j].isShown = true
          const currBoard = createBoardCopy(gBoard)
          gPreBoard.push(currBoard)
          console.log('gPreBoard:', gPreBoard)
        } else if (gBoard[i][j].content === 0) {
          elCell.classList.add('shown')
          expandShown(gBoard, i, j)
          const currBoard = createBoardCopy(gBoard)
          gPreBoard.push(currBoard)
          console.log('gPreBoard:', gPreBoard)
        }
      }
      const elShownCells = document.querySelectorAll('.shown')
      gGame.shownCount = elShownCells.length
      if (!isGameOver()) {
        const elRestartBtn = document.querySelector('.restart-btn')
        elRestartBtn.style.backgroundImage = 'url(js/smile.png)'
        gIsManualMode = false
        setTimeout(() => {
          const elModal = document.querySelector('.modal')
          elModal.style.display = 'block'
        }, 1500)
      }
    }
    if (gIsMegaHint && gIsHint === false) {
      if (megaFirst && megaSecond === false) {
        firstCell = { i, j }
        elCell.style.backgroundColor = 'green'
        if (isDarkMode) {
          setTimeout(() => {
            elCell.style.backgroundColor = 'rgb(45, 45, 45)'
          }, 3000)
        } else {
          setTimeout(() => {
            elCell.style.backgroundColor = 'rgb(197, 172, 205)'
          }, 3000)
        }
      }
      if (megaSecond && megaFirst === false) {
        var firstCellI = firstCell.i
        var firstCellJ = firstCell.j
        secondCell = { i, j }
        var secondCellI = secondCell.i
        var secondCellJ = secondCell.j
        megaSecond = false
        megaHint(firstCellI, firstCellJ, secondCellI, secondCellJ)
        const sound = new Audio('js/hintSound.mp3')
        sound.play()
      }

      megaFirst = false
      megaSecond = true
    }
  }
}

function onCellClicked(elCell, i, j) {
  if (gIsManualMode === false) {
    if (!gGame.isOn) {
      startTimer()
      gBoard[i][j].content = countNeighborsMines(i, j, gBoard)
      setMines(gBoard, i, j)
      elCell.classList.add('shown')
      gBoard[i][j].isShown = true
      gBoard[i][j].content = countNeighborsMines(i, j, gBoard)
      elCell.innerText = gBoard[i][j].content
      if (gBoard[i][j].content === 0) {
        expandShown(gBoard, i, j)
        elCell.innerText = ''
      }
      const currBoard = createBoardCopy(gBoard)
      gPreBoard[0] = currBoard
    }
    if (gGame.isOn === true) {
      game(elCell, i, j)
    } else {
      gGame.isOn = true
    }
  } else {
    if (gGame.isOn === true) {
      game(elCell, i, j)
    } else {
      setMinesManually(elCell, i, j)
      if (gRemainingMines === 0) {
        gGame.isOn = true
      }
      isFirstClick = true
    }
  }
}

function onRightClick(elBtn, i, j) {
  if (gBoard[i][j].content === MINE && gBoard[i][j].isMarked === false) {
    gGame.markedCounter++
  }
  if (gBoard[i][j].content === MINE && gBoard[i][j].isMarked) {
    gGame.markedCounter--
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
    const elRestartBtn = document.querySelector('.restart-btn')
    elRestartBtn.style.backgroundImage = 'url(js/alien-win.png)'
    setTimeout(() => {
      const elModal = document.querySelector('.modal')
      elModal.style.display = 'block'
    }, 1500)
  }
}

function isGameOver() {
  if (
    gGame.markedCounter === gLevel.MINES &&
    gGame.shownCount === gLevel.boardSize ** 2 - gLevel.MINES
  ) {
    clearInterval(gTimer)
    gGame.isOn = false
    const elModalText = document.querySelector('.modal-content')
    elModalText.innerHTML = `<h1>You have won!</h1>
    <h2>well done!</h2>
    <h3>Time: ${gTime}</h3>
    <button class="again-btn" onclick="onPlayAgain()">Play again</button>`
    switch (gLevel.boardSize) {
      case 4:
        if (!bestTime4) {
          bestTime4 = gTime
          const elTimeScore4 = document.querySelector('.time-four')
          localStorage.setItem('4Time', bestTime4)
          elTimeScore4.innerText = `Best time:${bestTime4}`
        } else if (gTime < bestTime4) {
          bestTime4 = gTime
          const elTimeScore4 = document.querySelector('.time-four')
          localStorage.removeItem('4Time')
          localStorage.setItem('4Time', bestTime4)
          elTimeScore4.innerText = `Best time:${bestTime4}`
        }
        break
      case 8:
        if (!bestTime8) {
          bestTime8 = gTime
          localStorage.setItem('8Time', bestTime8)
          const elTimeScore8 = document.querySelector('.time-eight')
          elTimeScore8.innerText = `Best time:${bestTime8}`
        } else if (gTime < bestTime8) {
          bestTime8 = gTime
          const elTimeScore8 = document.querySelector('.time-eight')
          localStorage.removeItem('8Time')
          localStorage.setItem('8Time', bestTime8)
          elTimeScore8.innerText = `Best time:${bestTime8}`
        }
        break
      case 12:
        if (!bestTime12) {
          bestTime12 = gTime
          localStorage.setItem('12Time', bestTime12)
          const elTimeScore12 = document.querySelector('.time-twelve')
          elTimeScore12.innerText = `Best time:${bestTime12}`
        } else if (gTime < bestTime12) {
          bestTime12 = gTime
          localStorage.removeItem('12Time')
          localStorage.setItem('12Time', bestTime12)
          const elTimeScore12 = document.querySelector('.time-twelve')
          elTimeScore12.innerText = `Best time:${bestTime12}`
        }
        break
    }
  }

  return gGame.isOn
}

function resetBtns() {
  gLives = 3
  gNumOfHints = 3
  gSafeClicks = 3
  gIsHint = false
  gIsManualMode = false
  renderLives()
  renderHints()
  renderSafeClick()
  gPreBoard.length = 0
  gRemainingMegaHint = 1
}

function onPlayAgain() {
  clearInterval(gTimer)
  gTime = 0
  switch (gLevel.boardSize) {
    case 4:
      originalMinesNum = 2
      break
    case 8:
      originalMinesNum = 14
      break
    case 12:
      originalMinesNum = 32
      break
  }
  gLevel.MINES = originalMinesNum
  gGame = {
    isOn: false,
    shownCount: 0,
    markedCounter: 0,
    secsPassed: 0,
  }

  gBoard = createBoard()
  renderBoard(gBoard)
  resetHTML()
  resetBtns()
  var originalMinesNum
  Mines.length = 0
}

function resetHTML() {
  var strHtml
  var elTimer = document.querySelector('.stopwatch')
  strHtml = `00:00:00`
  elTimer.innerText = strHtml
  const elRestartBtn = document.querySelector('.restart-btn')
  elRestartBtn.style.backgroundImage = 'url(js/smile.png)'
  const elModal = document.querySelector('.modal')
  elModal.style.display = 'none'
  const elManualRemains = document.querySelector('.manual-remains')
  elManualRemains.innerHTML = ''
  const elMegaBtn = document.querySelector('.mega')
  if (isDarkMode) {
    elMegaBtn.style.backgroundColor = 'rgb(45, 45, 45)'
    const elTds = document.querySelectorAll('td')
    for (var i = 0; i < elTds.length; i++) {
      elTds[i].style.backgroundColor = 'rgb(45, 45, 45)'
      elTds[i].style.color = 'antiquewhite'
    }
  } else {
    elMegaBtn.style.backgroundColor = 'aqua'
    elMegaBtn.addEventListener(
      'mouseenter',
      () => (elMegaBtn.style.backgroundColor = 'rgb(147, 66, 223)')
    )
    elMegaBtn.addEventListener(
      'mouseleave',
      () => (elMegaBtn.style.backgroundColor = 'aqua')
    )
  }
  elMegaBtn.addEventListener(
    'mouseenter',
    () => (elMegaBtn.style.cursor = 'pointer')
  )
  elMegaBtn.addEventListener(
    'mouseleave',
    () => (elMegaBtn.style.cursor = 'auto')
  )
}

function replaceAlienToCuriosity() {
  const elRestartBtn = document.querySelector('.restart-btn')
  elRestartBtn.style.backgroundImage = 'url(js/restart.png)'
}

function replaceAlienToSmiley() {
  const elRestartBtn = document.querySelector('.restart-btn')
  elRestartBtn.style.backgroundImage = 'url(js/smile.png)'
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
  const sound = new Audio('js/lose.mp3')
  sound.play()
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
  renderHints()
}
function renderHints() {
  const elHint = document.querySelector('.hint')
  switch (gNumOfHints) {
    case 3:
      elHint.innerHTML =
        '<img src="js/lamp.png"></img><img src="js/lamp.png"></img><img src="js/lamp.png"></img>'
      elHint.style.filter = 'none'
      elHint.addEventListener(
        'mouseenter',
        () => (elHint.style.cursor = 'pointer')
      )
      break
    case 2:
      elHint.innerHTML =
        '<img src="js/lamp.png"></img><img src="js/lamp.png"></img>'
      elHint.style.filter = 'none'
      break
    case 1:
      elHint.innerHTML = '<img src="js/lamp.png"></img>'
      elHint.style.filter = 'none'
      break
    case 0:
      elHint.style.filter = 'grayscale(100%)'
      elHint.addEventListener(
        'mouseenter',
        () => (elHint.style.cursor = 'auto')
      )
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
          } else if (elCells[counter].type === 'cell') {
            elCells[counter].content.innerText = ''
            counter++
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

function onSafeClick() {
  if (Mines.length === 0 || gSafeClicks === 0) return
  gSafeClicks--
  const safeCell = getEmptySafeCell(gBoard)
  const i = safeCell.i
  const j = safeCell.j
  const elSafeBtn = document.querySelector('.safe')
  elSafeBtn.innerText = `Safe click: ${gSafeClicks}`
  const safeElCell = document.querySelector(`.cell-${i}-${j}`)
  safeElCell.classList.add('safe-cell')
  setTimeout(() => {
    safeElCell.classList.remove('safe-cell')
  }, 2000)
}

function renderSafeClick() {
  const elSafeBtn = document.querySelector('.safe')
  elSafeBtn.innerText = `Safe click: ${gSafeClicks}`
}

function toManualMode() {
  if (gIsManualMode === false) {
    clearInterval(gTimer)
    onPlayAgain()
    const elManualRemains = document.querySelector('.manual-remains')
    switch (gLevel.boardSize) {
      case 4:
        gRemainingMines = 2

        break
      case 8:
        gRemainingMines = 14

        break
      case 12:
        gRemainingMines = 32

        break
    }
    elManualRemains.innerHTML = `<div class="manual-remains"><h2>mines remain: ${gRemainingMines}</h2></div>`
    gIsManualMode = true
    const elManualBtn = document.querySelector('.manual-btn')
    elManualBtn.innerText = 'MANUAL MODE'
    elManualBtn.style.backgroundColor = 'rgb(147, 66, 223)'
  } else {
    gIsManualMode = false
    clearInterval(gTimer)
    onPlayAgain()
    const elManualBtn = document.querySelector('.manual-btn')
    elManualBtn.innerText = 'Switch to manually mode'
    elManualBtn.style.backgroundColor = 'aqua'
  }
}

function onUndoClick() {
  if (gPreBoard.length === 0) {
    const audio = new Audio('js/wrong-mine-spot.mp3')
    audio.play()
    return
  }

  desiredTurn = gPreBoard.length - 2
  gPreBoard.pop()
  board = gPreBoard[desiredTurn]

  const elBoard = document.querySelector('.board')
  elBoard.innerHTML = ''
  var strHtml = '<table><tbody>'
  for (var i = 0; i < board.length; i++) {
    strHtml += '<tr>'
    for (var j = 0; j < board[0].length; j++) {
      const cell = board[i][j].content
      const className = `cell-${i}-${j}`
      if (board[i][j].isShown === false) {
        strHtml += `<td class="${className}" oncontextmenu="onRightClick(this, ${i},${j})", onclick="onCellClicked(this, ${i},${j})"><span class="hide">${cell}</span> </td>`
      } else {
        strHtml += `<td class="${className} shown" oncontextmenu="onRightClick(this, ${i},${j})", onclick="onCellClicked(this, ${i},${j})"><span class="hide">${cell}</span> </td>`
      }
    }
    strHtml += '</tr>'
  }
  strHtml += '</tbody></table>'
  elBoard.innerHTML = strHtml

  // fillBoard(board)
  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board[i].length; j++) {
      const currCell = document.querySelector(`.cell-${i}-${j}`)
      if (board[i][j].isShown === true) {
        board[i][j].content = countNeighborsMines(i, j, board)
        if (board[i][j].content === 0) {
          currCell.innerText = ''
        } else if (board[i][j].content > 0) {
          currCell.innerText = countNeighborsMines(i, j, board)
        }
      }
    }
  }
}

function createBoardCopy(gBoard) {
  const boardCopy = []
  for (var i = 0; i < gLevel.boardSize; i++) {
    boardCopy[i] = []
    for (var j = 0; j < gLevel.boardSize; j++) {
      boardCopy[i][j] = {
        content: gBoard[i][j].content,
        isMarked: gBoard[i][j].isMarked,
        isShown: gBoard[i][j].isShown,
      }
    }
  }
  return boardCopy
}

function onDarkModeClick(elDarkBtn) {
  if (!isDarkMode) {
    MINE = '🧨'

    const elTds = document.querySelectorAll('td')
    for (var i = 0; i < elTds.length; i++) {
      elTds[i].style.backgroundColor = 'rgb(45, 45, 45)'
      elTds[i].style.color = 'antiquewhite'
    }
    const elBtns = []
    const elBtnManual = document.querySelector('.manual-btn')
    elBtns.push(elBtnManual)
    const elBtnHint = document.querySelector('.hint')
    elBtns.push(elBtnHint)
    const elBtnSafe = document.querySelector('.safe')
    elBtns.push(elBtnSafe)
    const elBtnMega = document.querySelector('.mega')
    elBtns.push(elBtnMega)
    const elBtnExterminator = document.querySelector('.exterminator')
    elBtns.push(elBtnExterminator)
    const elBtnUndo = document.querySelector('.undo')
    elBtns.push(elBtnUndo)
    for (var i = 0; i < elBtns.length; i++) {
      elBtns[i].style.backgroundColor = 'rgb(45, 45, 45)'
      elBtns[i].style.color = 'antiquewhite'
    }
    elBtns[0].addEventListener(
      'mouseenter',
      () => (elBtns[0].style.backgroundColor = 'rgb(45, 45, 45)')
    )
    elBtns[0].addEventListener(
      'mouseleave',
      () => (elBtns[0].style.backgroundColor = 'rgb(45, 45, 45)')
    )
    elBtns[1].addEventListener(
      'mouseenter',
      () => (elBtns[1].style.backgroundColor = 'rgb(45, 45, 45)')
    )
    elBtns[1].addEventListener(
      'mouseleave',
      () => (elBtns[1].style.backgroundColor = 'rgb(45, 45, 45)')
    )
    elBtns[2].addEventListener(
      'mouseenter',
      () => (elBtns[2].style.backgroundColor = 'rgb(45, 45, 45)')
    )
    elBtns[2].addEventListener(
      'mouseleave',
      () => (elBtns[2].style.backgroundColor = 'rgb(45, 45, 45)')
    )
    elBtns[3].addEventListener(
      'mouseenter',
      () => (elBtns[3].style.backgroundColor = 'rgb(45, 45, 45)')
    )
    elBtns[3].addEventListener(
      'mouseleave',
      () => (elBtns[3].style.backgroundColor = 'rgb(45, 45, 45)')
    )
    elBtns[4].addEventListener(
      'mouseenter',
      () => (elBtns[4].style.backgroundColor = 'rgb(45, 45, 45)')
    )
    elBtns[4].addEventListener(
      'mouseleave',
      () => (elBtns[4].style.backgroundColor = 'rgb(45, 45, 45)')
    )
    elBtns[5].addEventListener(
      'mouseenter',
      () => (elBtns[5].style.backgroundColor = 'rgb(45, 45, 45)')
    )
    elBtns[5].addEventListener(
      'mouseleave',
      () => (elBtns[5].style.backgroundColor = 'rgb(45, 45, 45)')
    )
    const elHs = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
    for (var i = 0; i < elHs.length; i++) {
      elHs[i].style.color = 'rgb(45, 45, 45)'
      elHs[i].style.backgroundColor = 'rgba(255, 75, 75, 0.55)'
      elHs[i].style.boxShadow = '0px 0px 105px 45px rgba(255, 75, 75, 0.682)'
    }
    const elModal = document.querySelector('.modal-content')
    elModal.style.backgroundColor = 'rgb(45, 45, 45)'
    elModal.style.color = 'crimson'
    elDarkBtn.style.backgroundColor = 'aqua'
    elDarkBtn.style.color = 'black'
    elDarkBtn.innerText = 'Switch to Light mode'
    isDarkMode = true
  } else {
    MINE = '💣'
    const elTds = document.querySelectorAll('td')
    for (var i = 0; i < elTds.length; i++) {
      elTds[i].style.backgroundColor = 'rgb(197, 172, 205)'
      elTds[i].style.color = 'darkslategray'
    }
    const elBtns = []
    const elBtnManual = document.querySelector('.manual-btn')
    elBtns.push(elBtnManual)
    const elBtnHint = document.querySelector('.hint')
    elBtns.push(elBtnHint)
    const elBtnSafe = document.querySelector('.safe')
    elBtns.push(elBtnSafe)
    const elBtnMega = document.querySelector('.mega')
    elBtns.push(elBtnMega)
    const elBtnExterminator = document.querySelector('.exterminator')
    elBtns.push(elBtnExterminator)
    const elBtnUndo = document.querySelector('.undo')
    elBtns.push(elBtnUndo)

    for (var i = 0; i < elBtns.length; i++) {
      elBtns[i].style.backgroundColor = 'aqua'
      elBtns[i].style.color = 'black'
    }
    elBtns[0].addEventListener(
      'mouseenter',
      () => (elBtns[0].style.backgroundColor = 'rgb(147, 66, 223)')
    )
    elBtns[0].addEventListener(
      'mouseleave',
      () => (elBtns[0].style.backgroundColor = 'aqua')
    )
    elBtns[1].addEventListener(
      'mouseenter',
      () => (elBtns[1].style.backgroundColor = 'rgb(147, 66, 223)')
    )
    elBtns[1].addEventListener(
      'mouseleave',
      () => (elBtns[1].style.backgroundColor = 'aqua')
    )
    elBtns[2].addEventListener(
      'mouseenter',
      () => (elBtns[2].style.backgroundColor = 'rgb(147, 66, 223)')
    )
    elBtns[2].addEventListener(
      'mouseleave',
      () => (elBtns[2].style.backgroundColor = 'aqua')
    )
    elBtns[3].addEventListener(
      'mouseenter',
      () => (elBtns[3].style.backgroundColor = 'rgb(147, 66, 223)')
    )
    elBtns[3].addEventListener(
      'mouseleave',
      () => (elBtns[3].style.backgroundColor = 'aqua')
    )
    elBtns[4].addEventListener(
      'mouseenter',
      () => (elBtns[4].style.backgroundColor = 'rgb(147, 66, 223)')
    )
    elBtns[4].addEventListener(
      'mouseleave',
      () => (elBtns[4].style.backgroundColor = 'aqua')
    )
    elBtns[5].addEventListener(
      'mouseenter',
      () => (elBtns[5].style.backgroundColor = 'rgb(147, 66, 223)')
    )
    elBtns[5].addEventListener(
      'mouseleave',
      () => (elBtns[5].style.backgroundColor = 'aqua')
    )
    const elHs = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
    for (var i = 0; i < elHs.length; i++) {
      elHs[i].style.color = 'rgb(212, 188, 255)'
      elHs[i].style.backgroundColor = ''
      elHs[i].style.boxShadow = 'none'
      elHs[i].style.boxShadow = 'none'
      elHs[i].style.boxShadow = 'none'
    }
    const elModal = document.querySelector('.modal-content')
    elModal.style.backgroundColor = 'white'
    elModal.style.color = 'crimson'
    elDarkBtn.style.backgroundColor = 'rgb(45, 45, 45)'
    elDarkBtn.style.color = 'antiquewhite'
    elDarkBtn.innerText = 'Switch to Dark mode'
    isDarkMode = false
  }
}

function onMegaHint(elMegaBtn) {
  if (gRemainingMegaHint === 0) {
    elMegaBtn.style.backgroundColor = 'grey'
    elMegaBtn.addEventListener(
      'mouseenter',
      () => (elMegaBtn.style.cursor = 'auto')
    )
    return
  }
  gIsMegaHint = true
  megaFirst = true
  megaSecond = false
  if (isDarkMode) {
    elMegaBtn.style.backgroundColor = 'rgb(45, 45, 45)'
    elMegaBtn.addEventListener(
      'mouseenter',
      () => (elMegaBtn.style.cursor = 'pointer')
    )
  } else {
    elMegaBtn.style.backgroundColor = 'aqua'
    elMegaBtn.addEventListener(
      'mouseenter',
      () => (elMegaBtn.style.cursor = 'pointer')
    )
    elMegaBtn.addEventListener(
      'mouseenter',
      () => (elMegaBtn.style.backgroundColor = 'rgb(147, 66, 223)')
    )
  }
}

function megaHint(firstI, firstJ, secondI, secondJ) {
  var counter = 0
  var currElCell
  const elCells = []
  var span
  for (var i = firstI; i <= secondI; i++) {
    for (var j = firstJ; j <= secondJ; j++) {
      currElCell = {
        type: 'cell',
        content: document.querySelector(`.cell-${i}-${j}`),
      }
      if (gBoard[i][j].content === MINE) {
        span = {
          type: 'span',
          content: document.querySelector(`.cell-${i}-${j} span`),
        }
        span.content.classList.remove('hide')
        elCells.push(span)
      } else {
        currElCell.content.innerText = countNeighborsMines(i, j, gBoard)
        elCells.push(currElCell)
      }
      setTimeout(() => {
        if (elCells[counter].type === 'span') {
          elCells[counter].content.classList.add('hide')
          counter++
        } else if (elCells[counter].type === 'cell') {
          elCells[counter].content.innerText = ''
          counter++
        }
      }, 2000)
    }
  }
  gRemainingMegaHint = 0
  gIsMegaHint = false
}

function mineExterminator() {
  if (gLevel.boardSize === 4) return
  var currRandomIdx
  var deletedCell
  var deletedI
  var deletedJ
  for (var i = 0; i < 3; i++) {
    currRandomIdx = getRandomIntInclusive(0, Mines.length)
    deletedCell = Mines[currRandomIdx]
    deletedI = deletedCell.randomI
    deletedJ = deletedCell.randomJ
    while (gBoard[deletedI][deletedJ].isMarked === true) {
      currRandomIdx = getRandomIntInclusive(0, Mines.length)
      deletedCell = Mines[currRandomIdx]
      deletedI = deletedCell.randomI
      deletedJ = deletedCell.randomJ
    }
    gBoard[deletedI][deletedJ].content = EMPTY
    Mines.splice(currRandomIdx, 1)
    gLevel.MINES--
  }
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[i].length; j++) {
      if (gBoard[i][j].isShown === true) {
        const elCell = document.querySelector(`.cell-${i}-${j}`)
        gBoard[i][j].content = countNeighborsMines(i, j, gBoard)
        if (gBoard[i][j].content === 0) elCell.innerText = ''
        else {
          elCell.innerText = countNeighborsMines(i, j, gBoard)
        }
      }
    }
  }
}
