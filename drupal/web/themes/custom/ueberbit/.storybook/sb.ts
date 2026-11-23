// @ts-ignore
import.meta.glob([
  '../(templates|css|js)/**/*.(ts|tsx|css|js|jsx)',
  '!**/*.stories.*',
  '!**/_*.*',
  '!../css/tailwind.css'
], { eager: true} )

// document.querySelectorAll('.form-item').forEach((item, idx) => {
//   const label = item.querySelector('label')
//   const input = item.querySelector('input, select, textarea')
//   const id = `${input?.tagName}-${idx}`

//   label?.setAttribute('for', id)
//   input?.setAttribute('id', id)
// })
