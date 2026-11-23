// import morphdom from 'morphdom'

const [element] = once<HTMLDivElement>('my-once-id', 'div')

once.remove('my-once-id', 'div')

console.log(element)

console.log(useFoo())

console.log(Drupal.t('trololol'))

Alpine.store('darkMode', <{
  on: boolean,
}>{
  on: false,

  toggle() {
    this.on = ! this.on
  }
})

const message = new Drupal.Message
message.add('hi')

message.clear()

// Drupal.Progress

// requestIdleCallback(() => {
  Alpine.start()
// })

// if (import.meta.hot) {
//   import.meta.hot.on('morphdom', async () => {
//     const newHTML = await fetch(location.href).then((res) => res.text())
//     const parser = new DOMParser()
//     const newDoc = parser.parseFromString(newHTML, 'text/html')
//     import('morphdom').then(({ default: morphdom }) => {
//       morphdom(document.body, newDoc.body)
//       const tailwind = document.querySelector('link[href*="tailwind"]')
//       if (tailwind && tailwind instanceof HTMLLinkElement) {
//         tailwind.href = tailwind.href
//       }
//       Drupal.attachBehaviors(document.body, {})
//     })
//   })
// }

// Drupal.behaviors.ReadingProgress = {
//   attach(context) {
//     const foo = once('progress', '.reading-progress', context)
//     this.foo = 'asd'
//     console.log(this)
//     foo.forEach((progress) => {

//     })
//   },
// }


export {}
