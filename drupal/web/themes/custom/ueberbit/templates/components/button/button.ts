// import { defineCustomElement } from '~/vite/vue/ApiCustomElements'
// import { defineCustomElement } from 'vue'

// customElements.define('ue-button', defineCustomElement(await (await import('./button.ce.vue')).default))

// @ts-ignore
Drupal.behaviors.button = {
  // @ts-ignore
  async attach(context, settings) {

    console.log('button!');

    const { abc } = await import('./_button.chunk')

    console.log(abc())
  }
};

// Alpine.store('darkMode', <{
//   on: boolean,
// }>{
//   on: false,

//   toggle() {
//     this.on = ! this.on
//   }
// })

// requestIdleCallback(() => {
//   Alpine.start()
// })

// import('alpinejs').then(() => {
//   requestIdleCallback(() => {
//     Alpine.store('darkMode', <{
//       on: boolean,
//     }>{
//       on: false,

//       toggle() {
//         this.on = ! this.on
//       }
//     })
//     Alpine.start()
//   })
// })

export {}
