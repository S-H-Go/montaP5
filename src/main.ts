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

const startScreen = document.getElementById('start-screen')
const form = document.getElementById('render-form') as HTMLFormElement | null
const seedInput = document.getElementById('seed-input') as HTMLInputElement | null
const widthInput = document.getElementById('width-input') as HTMLInputElement | null
const heightInput = document.getElementById('height-input') as HTMLInputElement | null
const randomSeedButton = document.getElementById('random-seed-button') as HTMLButtonElement | null
const startButton = document.getElementById('start-button') as HTMLButtonElement | null
const rerenderButton = document.getElementById('rerender-button') as HTMLButtonElement | null
const sketchPanel = document.getElementById('sketch-panel')
const sketchRoot = document.getElementById('sketch')
const currentMeta = document.getElementById('current-meta')

if (!form || !seedInput || !widthInput || !heightInput || !randomSeedButton || !startButton || !rerenderButton || !sketchRoot || !sketchPanel || !currentMeta)
  throw new Error('Missing UI elements')

let started = false

function clampDimension(value: number) {
  return Math.min(2400, Math.max(240, Math.round(value)))
}

function randomSeed() {
  return Math.floor(Math.random() * 999999999)
}

function syncMeta() {
  currentMeta.innerHTML = `
    <span class="meta-chip">seed ${settings.seed}</span>
    <span class="meta-separator">/</span>
    <span class="meta-chip">canvas ${settings.swidth} × ${settings.sheight}</span>
  `
}

function showStillImage(dataUrl: string, width: number, height: number) {
  sketchRoot.innerHTML = ''

  const image = document.createElement('img')
  image.src = dataUrl
  image.alt = `Rendered artwork, seed ${settings.seed}, ${width} by ${height}`
  image.className = 'sketch-still'
  image.width = width
  image.height = height

  sketchRoot.appendChild(image)
}

async function renderWithCurrentSettings() {
  startButton.disabled = true
  startButton.textContent = '渲染中...'
  rerenderButton.disabled = true
  sketchRoot.innerHTML = ''

  const { instance, canvas } = await createP5App(sketchRoot)
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))

  const targetCanvas = canvas ?? (sketchRoot.querySelector('canvas') as HTMLCanvasElement | null)

  if (!targetCanvas)
    throw new Error('Missing rendered canvas')

  const dataUrl = targetCanvas.toDataURL('image/png')
  const { width, height } = targetCanvas

  instance.remove()
  showStillImage(dataUrl, width, height)

  syncMeta()
  sketchPanel.style.display = 'grid'
  startScreen?.setAttribute('data-started', 'true')
  started = true
  startButton.disabled = false
  startButton.textContent = '开始渲染'
  rerenderButton.disabled = false
}

randomSeedButton.addEventListener('click', () => {
  seedInput.value = String(randomSeed())
})

form.addEventListener('submit', async (event) => {
  event.preventDefault()

  const seed = Number.parseInt(seedInput.value || '0', 10)
  const width = clampDimension(Number.parseInt(widthInput.value || '500', 10))
  const height = clampDimension(Number.parseInt(heightInput.value || '500', 10))

  updateSettings({
    seed: Number.isFinite(seed) ? Math.max(0, seed) : randomSeed(),
    nwidth: width,
    nheight: height,
    swidth: width,
    sheight: height,
  })

  widthInput.value = String(width)
  heightInput.value = String(height)
  seedInput.value = String(settings.seed)

  try {
    await renderWithCurrentSettings()
  }
  catch (error) {
    startButton.disabled = false
    startButton.textContent = started ? '重新渲染' : '开始渲染'
    rerenderButton.disabled = false
    console.error(error)
  }
})

rerenderButton.addEventListener('click', () => {
  seedInput.value = String(randomSeed())
  form.requestSubmit()
})
