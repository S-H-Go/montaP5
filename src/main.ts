import { createP5App } from './sketch'
import { settings, updateSettings } from './settings'

const app = document.getElementById('app')

if (!app)
  throw new Error('Missing #app container')

app.innerHTML = `
  <main class="stage-shell">
    <aside id="start-screen" class="placard" aria-label="Render controls">
      <div class="placard__meta">
        <span class="placard__index">mmntt / study</span>
        <span class="placard__year">Processing → p5.js</span>
      </div>

      <div class="placard__header">
        <p class="placard__eyebrow">Generative landscape</p>
        <h1 class="placard__title">Monta</h1>
        <p class="placard__text">
          调整种子与画布尺寸，像在展签前拨动一次作品的生成条件。
        </p>
      </div>

      <dl class="placard__facts">
        <div>
          <dt>Mode</dt>
          <dd>Single render, public exhibition view</dd>
        </div>
        <div>
          <dt>Palette</dt>
          <dd>Dusk blue / moss green / ochre / ink</dd>
        </div>
      </dl>

      <form id="render-form" class="render-form">
        <label class="field field--seed">
          <span class="field__label">Edition / Seed</span>
          <div class="field__frame">
            <span class="field__prefix">No.</span>
            <input id="seed-input" name="seed" type="number" inputmode="numeric" min="0" step="1" value="${settings.seed}" />
          </div>
        </label>

        <div class="field field--size">
          <span class="field__label">Canvas size</span>
          <div class="size-pair" role="group" aria-label="Canvas size">
            <label class="field field--compact">
              <span class="field__mini">Width</span>
              <input id="width-input" name="width" type="number" inputmode="numeric" min="240" max="2400" step="10" value="${settings.swidth}" />
            </label>

            <span class="size-pair__divider" aria-hidden="true">×</span>

            <label class="field field--compact">
              <span class="field__mini">Height</span>
              <input id="height-input" name="height" type="number" inputmode="numeric" min="240" max="2400" step="10" value="${settings.sheight}" />
            </label>
          </div>
        </div>

        <div class="render-form__footer">
          <p class="render-form__note">使用作品本身的土黄、深靛、苔绿与暮空蓝作为界面基调。</p>
          <div class="render-form__actions">
            <button id="random-seed-button" class="ghost-button" type="button">随机种子</button>
            <button id="start-button" class="primary-button" type="submit">开始渲染</button>
          </div>
        </div>
      </form>
    </aside>

    <section id="sketch-panel" class="canvas-panel" style="display:none">
      <div class="canvas-panel__head">
        <div>
          <p class="canvas-panel__eyebrow">Exhibition note</p>
          <p id="current-meta" class="canvas-panel__meta"></p>
        </div>
        <button id="rerender-button" class="ghost-button" type="button">重新生成</button>
      </div>
      <div id="sketch" class="sketch-frame"></div>
    </section>
  </main>
`

const startScreen = document.getElementById('start-screen') as HTMLElement | null
const form = document.getElementById('render-form') as HTMLFormElement | null
const seedInput = document.getElementById('seed-input') as HTMLInputElement | null
const widthInput = document.getElementById('width-input') as HTMLInputElement | null
const heightInput = document.getElementById('height-input') as HTMLInputElement | null
const randomSeedButton = document.getElementById('random-seed-button') as HTMLButtonElement | null
const startButton = document.getElementById('start-button') as HTMLButtonElement | null
const rerenderButton = document.getElementById('rerender-button') as HTMLButtonElement | null
const sketchPanel = document.getElementById('sketch-panel') as HTMLElement | null
const sketchRoot = document.getElementById('sketch') as HTMLElement | null
const currentMeta = document.getElementById('current-meta') as HTMLElement | null

if (!form || !seedInput || !widthInput || !heightInput || !randomSeedButton || !startButton || !rerenderButton || !sketchRoot || !sketchPanel || !currentMeta)
  throw new Error('Missing UI elements')

const ui = {
  startScreen,
  form,
  seedInput,
  widthInput,
  heightInput,
  randomSeedButton,
  startButton,
  rerenderButton,
  sketchPanel,
  sketchRoot,
  currentMeta,
}

let started = false

function clampDimension(value: number) {
  return Math.min(2400, Math.max(240, Math.round(value)))
}

function randomSeed() {
  return Math.floor(Math.random() * 999999999)
}

function syncMeta() {
  ui.currentMeta.innerHTML = `
    <span class="meta-chip">seed ${settings.seed}</span>
    <span class="meta-separator">/</span>
    <span class="meta-chip">canvas ${settings.swidth} × ${settings.sheight}</span>
  `
}

function showStillImage(dataUrl: string, width: number, height: number) {
  ui.sketchRoot.innerHTML = ''

  const image = document.createElement('img')
  image.src = dataUrl
  image.alt = `Rendered artwork, seed ${settings.seed}, ${width} by ${height}`
  image.className = 'sketch-still'
  image.width = width
  image.height = height

  ui.sketchRoot.appendChild(image)
}

async function renderWithCurrentSettings() {
  ui.startButton.disabled = true
  ui.startButton.textContent = '渲染中...'
  ui.rerenderButton.disabled = true
  ui.sketchRoot.replaceChildren()

  const { instance, canvas } = await createP5App(ui.sketchRoot)
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  await new Promise(resolve => setTimeout(resolve, 50))

  const targetCanvas = canvas ?? (ui.sketchRoot.querySelector('canvas') as HTMLCanvasElement | null)

  if (!targetCanvas)
    throw new Error('Missing rendered canvas')

  let dataUrl: string
  try {
    dataUrl = targetCanvas.toDataURL('image/png')
  }
  catch (error) {
    instance.remove()
    throw new Error(`Canvas export failed: ${error instanceof Error ? error.message : String(error)}`)
  }
  const { width, height } = targetCanvas

  instance.remove()
  showStillImage(dataUrl, width, height)

  syncMeta()
  ui.sketchPanel.style.display = 'grid'
  ui.startScreen?.setAttribute('data-started', 'true')
  started = true
  ui.startButton.disabled = false
  ui.startButton.textContent = '开始渲染'
  ui.rerenderButton.disabled = false
}

ui.randomSeedButton.addEventListener('click', () => {
  ui.seedInput.value = String(randomSeed())
})

ui.form.addEventListener('submit', async (event) => {
  event.preventDefault()

  const seed = Number.parseInt(ui.seedInput.value || '0', 10)
  const width = clampDimension(Number.parseInt(ui.widthInput.value || '500', 10))
  const height = clampDimension(Number.parseInt(ui.heightInput.value || '500', 10))

  updateSettings({
    seed: Number.isFinite(seed) ? Math.max(0, seed) : randomSeed(),
    nwidth: width,
    nheight: height,
    swidth: width,
    sheight: height,
  })

  ui.widthInput.value = String(width)
  ui.heightInput.value = String(height)
  ui.seedInput.value = String(settings.seed)

  try {
    await renderWithCurrentSettings()
  }
  catch (error) {
    ui.startButton.disabled = false
    ui.startButton.textContent = started ? '重新渲染' : '开始渲染'
    ui.rerenderButton.disabled = false
    console.error(error)
  }
})

ui.rerenderButton.addEventListener('click', () => {
  ui.seedInput.value = String(randomSeed())
  ui.form.requestSubmit()
})
