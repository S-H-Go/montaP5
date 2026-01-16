import p5 from './sketch'

p5.draw = function () {
  p5.noLoop()
}

// setTimeout(() => {
//   p5.draw = () => {
//     // p5.createCanvas(400, 400)
//     console.log(p5.frameCount)
//     p5.noLoop()
//     p5.background(0)
//   }
// }, 1000)
