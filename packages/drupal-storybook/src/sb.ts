// @ts-ignore
import.meta.glob([
  '../(templates|css|js)/**/*.(ts|tsx|css|js|jsx)',
  '!**/*.stories.*',
  '!**/_*.*',
  '!../css/tailwind.css'
], { eager: true} )
