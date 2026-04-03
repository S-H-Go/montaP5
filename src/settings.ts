export type RenderSettings = {
  seed: number
  nwidth: number
  nheight: number
  swidth: number
  sheight: number
  scale: number
  exportImage: boolean
}

const temp = 500

export const settings: RenderSettings = {
  seed: 999999,
  nwidth: temp,
  nheight: temp,
  swidth: temp,
  sheight: temp,
  scale: 1,
  exportImage: false,
}

export function updateSettings(partial: Partial<RenderSettings>) {
  Object.assign(settings, partial)
}
