// import morphdom from 'morphdom'

// if (import.meta.hot) {
//   import.meta.hot.on('morphdom', async (data) => {
//     if (location.href.includes('/iframe.html')) return
//     const newHTML = await fetch(location.href).then((res) => res.text())
//     const parser = new DOMParser()
//     const newDoc = parser.parseFromString(newHTML, 'text/html')

//       const tailwind = document.querySelector('link[href*="tailwind"]')
//       if (tailwind && tailwind instanceof HTMLLinkElement) {
//         tailwind.href = tailwind.href
//       }
//       morphdom(document.body, newDoc.body)
//       Drupal.attachBehaviors(document.body, drupalSettings || {})
//   })
// }
