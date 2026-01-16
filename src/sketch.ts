import P5 from 'p5'
import SimplexNoise from 'simplex-noise'
import setttings from './settings'

let seed: number

const nwidth = setttings.nwidth
const nheight = setttings.nheight
const swidth = setttings.swidth
const sheight = setttings.sheight
let scale = 1

const exportImage = false
// let colors = ['#284E34', '#BCA978', '#896F3D', '#38271D', '#BF0624']
let noi: P5.Shader
let colors = ['#120F1F', '#1F3018', '#7B7D30', '#B08247', '#FAD47D']
function sketch(p: P5) {
  p.preload = () => {
    scale = nwidth / swidth
    seed = p.int(p.random(setttings.seed))
    seed = p.int(999999)// TODO remove
    noi = p.loadShader('/noiseShadowVert.glsl', '/noiseShadowFrag.glsl')
  }
  p.setup = () => {
    p.createCanvas(p.int(swidth * scale), p.int(sheight * scale), p.WEBGL)
    p.translate(-p.width / 2, -p.height / 2)
    // p.pixelDensity(2)
    p.smooth()

    generate()

    if (exportImage)
      saveImage()
    //
    //
  }

  p.keyPressed = () => {
    if (p.key === 's') { saveImage() }
    else {
      seed = p.int(p.random(setttings.seed))
      p.loop()
      // TODO 不知道为什么需要转换坐标系
      p.translate(-p.width / 2, -p.height / 2)
      generate()
    }
  }

  class Point {
    x: number; y: number; s: number
    constructor(x: number, y: number, s: number) {
      this.x = x; this.y = y; this.s = s
    }

    compareTo(o: Point) {
      const n = o
      const dif = ((this.y + this.s * 0.5) - (n.y + n.s * 0.5))
      if (dif < 0)
        return -1
      else if (dif > 0)
        return 1
      return 0
    }
  }

  function generate() {
    //
    p.randomSeed(seed)
    p.noiseSeed(seed)

    p.background(p.color('#B4CBFD'))

    const mountains = 20

    const detH = p.random(0.0012, 0.002) * 0.8
    const amp = p.height * 0.9

    const detCol = p.random(0.001, 0.004) * 0.7
    const detSiz = p.random(0.01)
    const detZon = p.random(0.004, 0.008) * 0.7

    const hpx = p.random(-0.2, 1.2) * p.width
    const hpy = p.random(-0.5, -0.2) * p.height
    // console.log('dth:', detH, 'amp:', amp, 'detCol:', detCol, 'detSiz:', detSiz, 'detZon:', detZon, 'hpx:', hpx, 'hpy:', hpy)
    p.noStroke()
    for (let i = 0; i < mountains; i++) {
      let av = (i + 0) * 1.0 / mountains
      let v = (i + 1) * 1.0 / mountains
      av = p.pow(av, 4)
      v = p.pow(v, 4)

      const y = v * amp
      const hh = (v - av) * amp * 5

      noi.setUniform('displace', p.random(100))
      p.shader(noi)
      const backCol = p.lerpColor(p.color('#B4CBFD'), p.color('#120F1F'), v)
      // 渲染背景光照
      p.beginShape()
      backCol.setAlpha(24)
      p.fill(backCol)
      p.vertex(0, 0)
      p.vertex(p.width, 0)
      backCol.setAlpha(0)
      p.fill(backCol)
      p.vertex(p.width, amp)
      p.vertex(0, amp)
      p.endShape()
      p.resetShader()
      const three = []

      const aux = ['#120F1F', '#1F3018', '#7B7D30', '#B08247', '#FAD47D']
      colors = aux

      const grassCol = getColor(2 + i * 0.2)
      p.fill(p.lerpColor(grassCol, p.color(0), p.random(0.4, 1)))
      // fill('#B8BF1F')
      p.beginShape()
      p.vertex(0, p.height)
      for (let j = 0; j <= p.width; j++) {
        const simplex = new SimplexNoise(seed * 0.001); let noi = p.float(simplex.noise2D(j * detH * p.lerp(2, 0.8, av), y * detH) as unknown as string) * 0.5 + 0.5
        noi = p.pow(noi, 1.4)
        const yy = y - hh * noi
        p.vertex(j, yy)

        for (let l = 0; l < 8; l++) {
          const nx = j
          const vv = p.random(p.random(0.8, 1.4))
          const ny = p.lerp(yy, y, vv)
          let ns = hh * 0.7 * p.lerp(0.3, 1, v) * p.lerp(0.003, 0.1, p.noise(nx * detSiz, ny * detSiz)) //* p.random(0.004, 0.1)
          ns *= p.lerp(0.5, 1, vv)
          ns *= p.random(1, 2)

          ns *= p.pow(1 - p.constrain(p.noise(nx * detZon, ny * detZon, i * 200 * detZon) * 16 - 10, 0, 1), 8)
          if (ns <= 0)
            continue
          let add = true
          for (let k = 0; k < three.length; k++) {
            const other = three[k]
            if (p.dist(nx, ny, other.x, other.y) < (ns + other.s) * 0.4) {
              add = false
              break
            }
          }
          if (add)
            three.push(new Point(nx, ny, ns))
        }
      }

      p.vertex(p.width, p.height)
      p.endShape()

      const aux2 = ['#2B2400', '#684D07', '#820318', '#0F1B36'] // ['#2B2C01', '#886E0B', '#93040F', '#0F1B36'] //['#1D2469', '#B44021', '#F6EB00', '#01A14E']
      colors = aux2

      three.sort((a, b) => a.compareTo(b))
      p.noStroke()
      for (let k = 0; k < three.length; k++) {
        const t = three[k]
        const noi = p.noise(t.x * detCol * 0.6, t.y * detCol)
        const col = i + noi * colors.length * 3
        const s = t.s * p.random(1, 2)
        cir(t.x, t.y, s * p.random(0.8, 1.2), s, col)
      }
      p.noStroke()

      //
      p.blendMode(p.ADD)
      const dd = p.width * p.random(0.4, 1.8)
      p.beginShape()
      p.fill(180, 203, 253, p.random(100, 200) * 0.2)
      p.vertex(hpx, hpy)
      const a1 = p.random(p.PI)
      const a2 = a1 + p.PI * p.random(0.04, 0.12)
      p.fill(180, 203, 253, 0)
      p.vertex(hpx + p.cos(a1) * dd, hpy + p.sin(a1) * dd)
      p.vertex(hpx + p.cos(a2) * dd, hpy + p.sin(a2) * dd)
      p.endShape()
      p.blendMode(p.BLEND)

      // birds
      birds()

      //
      //
      p.blendMode(p.ADD)
      noi.setUniform('displace', p.random(100))
      p.shader(noi)
      p.beginShape()
      p.fill(180, 203, 253, 0)
      p.vertex(0, 0)
      p.vertex(p.width, 0)
      p.fill(180, 203, 253, p.random(80, 120) * (1 - v * 0.5) * 1.0)
      p.vertex(p.width, p.height)
      p.vertex(0, p.height)
      p.endShape()
      p.blendMode(p.BLEND)
    }
  }

  function cir(x: number, y: number, w: number, h: number, val: number) {
    p.noStroke()
    p.fill(p.lerpColor(p.lerpColor(p.color('#120F1F'), getColor(val), p.random(0.05, 0.25)), p.color(0), p.random(0.8, 0.9)))
    // fill(col);
    p.ellipse(x, y, w - 1, h - 1)

    const cc = p.int(p.PI * w * h * p.random(0.06, p.random(0.08, 0.1)) * 0.8)
    for (let i = 0; i < cc; i++) {
      const dd = p.sqrt(p.random(p.random(0.05, 0.8), 1) * p.random(0.9, 1)) * 0.5
      const va = p.random(1)
      const ang = p.lerp(p.random(p.TAU), p.lerp(p.PI, p.TAU, va), p.random(p.random(0.4), 1))
      p.strokeWeight(p.random(1, 1.8))
      p.stroke(getColor(val + p.random(2) * p.random(1) + va) as unknown as number, p.random(255))// TODO 这里可能有问题，关于颜色
      if (p.random(1) < 0.1 + va * 0.5)
        p.blendMode(p.ADD)
      else p.blendMode(p.BLEND)
      p.point(x + p.cos(ang) * dd * w, y + p.sin(ang) * dd * h)
    }
    p.blendMode(p.BLEND)

    const mh = h * p.random(0.6, 0.85)
    const gros = w * p.random(0.02, 0.04) * p.random(0.8, 1.2)
    const dx = gros * p.random(-1, 1) * p.random(0.8)
    p.noStroke()
    p.fill('#CFDADC')
    const px = x + gros * p.random(-1.5, 1.5) * p.random(1)
    const py = y - mh * p.random(0.3)
    const ax = x + dx
    const ay = y + mh
    p.triangle(px, py, ax + gros * 0.2, ay, ax + gros, ay)
    p.fill('#00497C')
    p.triangle(px, py, ax - gros, ay, ax + gros * 0.2, ay)

    const c = p.int(p.random(1, 4))
    const dd = p.dist(px, py, ax, ay)

    p.fill('#CFDADC')
    p.beginShape(p.TRIANGLES)
    const ddd = p.int(p.random(2))
    for (let i = 0; i < c; i++) {
      const v = p.random(0.2, 0.3) + i * 0.12
      const ox = p.lerp(px, ax, v)
      const oy = p.lerp(py, ay, v)
      const g = gros * v * 0.6
      const a = p.PI * 1.5 + p.random(p.random(0.2, 0.8), 1) * p.HALF_PI * (((i + ddd) % 2 === 0) ? -1 : 1)
      const d = dd * p.random(0.2, 0.4) * (0.5 + (1 - v) * 0.5) * 0.6
      p.vertex(ox + p.cos(a) * d, oy + p.sin(a) * d)
      p.vertex(ox + p.cos(a - p.HALF_PI) * g, oy + p.sin(a - p.HALF_PI) * g)
      p.vertex(ox + p.cos(a + p.HALF_PI) * g, oy + p.sin(a + p.HALF_PI) * g)
    }
    p.endShape()
  }

  function birds() {
    //
    //
    p.fill(0)
    const des = p.random(10000)
    const det = p.random(0.01)

    p.fill(0)
    for (let k = 0; k < 100; k++) {
      const x = p.random(p.width)
      const vy = p.random(1)
      const y = p.height * vy

      if (p.noise(des + x * det, des + y * det) < 0.6)
        continue
      const r = p.random(3, 5) * p.random(0.5, p.lerp(1, 3, vy))
      const ang = p.random(-0.3, 0.3)
      const hdx = p.cos(ang + 0) * r
      const hdy = p.sin(ang + 0) * r
      const vdx = p.cos(ang + p.HALF_PI) * r
      const vdy = p.sin(ang + p.HALF_PI) * r
      const dy = p.random(-0.2, 0.2)
      p.beginShape()
      p.vertex(x - hdx, y - hdy)
      p.vertex(x - hdx * 0.5, y - hdy * 0.5)
      p.vertex(x + vdx * (0.15 + dy), y + vdy * (0.15 + dy))
      p.vertex(x + hdx * 0.5, y + hdy * 0.5)
      p.vertex(x + hdx, y + hdy)
      p.vertex(x + hdx * 0.5 + vdx * 0.05, y + hdy * 0.5 + vdy * 0.05)
      p.vertex(x + vdx * (0.3 + dy), y + vdy * (0.3 + dy))
      p.vertex(x - hdx * 0.5 + vdx * 0.05, y - hdy * 0.5 + vdy * 0.05)
      // p.vertex(x, y - 10)
      p.endShape(p.CLOSE)
    }
  }

  function saveImage() {
    const timestamp = `${p.year() + p.nf(p.month(), 2) + p.nf(p.day(), 2)}-${p.nf(p.hour(), 2)}${p.nf(p.minute(), 2)}${p.nf(p.second(), 2)}`
    p.saveCanvas(`${timestamp}-${seed}`, 'png')
  }
  //
  //
  //
  // function rcol() {
  //   return colors[p.floor(p.random(colors.length))]
  // }
  function getColor(vv?: number) {
    if (vv === undefined)
      return getColor(p.random(colors.length))
    let v = p.abs(vv)
    v = v % (colors.length)
    const c1 = p.color(colors[p.int(v % colors.length)])
    const c2 = p.color(colors[p.int((v + 1) % colors.length)])
    return p.lerpColor(c1, c2, p.pow(v % 1, 1.2))
  }
}

const p5 = new P5(sketch, document.getElementById('sketch')!)
export default p5
