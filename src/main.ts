import { createP5App } from './sketch'

const app = document.getElementById('app')

if (!app)
  throw new Error('Missing #app container')

app.innerHTML = `
  <div id="start-screen">
    <button id="start-button" type="button">开始渲染</button>
  </div>
  <div id="sketch" style="display:none"></div>
`

const startScreen = document.getElementById('start-screen')
const startButton = document.getElementById('start-button') as HTMLButtonElement | null
const sketchRoot = document.getElementById('sketch')

if (!startButton || !sketchRoot)
  throw new Error('Missing start UI elements')

let started = false

startButton.addEventListener('click', async () => {
  if (started)
    return

  started = true
  startButton.disabled = true
  startButton.textContent = '渲染中...'

  try {
    await createP5App(sketchRoot)
    sketchRoot.style.display = 'block'
    startScreen?.remove()
  }
  catch (error) {
    started = false
    startButton.disabled = false
    startButton.textContent = '开始渲染'
    console.error(error)
  }
})
