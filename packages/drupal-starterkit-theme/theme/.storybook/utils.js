/**
 * Convert Tailwind Screen to Viewport Parameter.
 * @param {TailwindConfig} tailwind - Resolved TailwindCSS Config File.
 * @param {boolean} devices - Append Device List.
 * @returns Storybook Viewport Parameter.
 */
exports.getBreakpoints = function (tailwind, devices = false) {
  /**
   * Since mobile is the default, a phone (iPhone 12 Pro) setting is added.
   */
  const screens = {
    theme: { name: '-- Theme --' },
    xs: { name: 'xs', styles: { width: '390px', height: '100%' } },
  }

  /**
   * DeviceList from Chrome Devtools.
   */
  const deviceList = {
    devices: { name: '-- Devices --' },
    iphonese: { name: 'iPhone SE', styles: { width: '375px', height: '667px' } },
    iphonexr: { name: 'iPhone XR', styles: { width: '414px', height: '896px' } },
    iphone12pro: { name: 'Pixel 5', styles: { width: '393px', height: '851px' } },
    pixel5: { name: 'iPhone SE', styles: { width: '375px', height: '667px' } },
    galaxys8plus: { name: 'Samsung Galaxy S8+', styles: { width: '360px', height: '740px' } },
    galaxys20ultra: { name: 'Samsung Galaxy S20 Ultra', styles: { width: '412px', height: '915px' } },
    ipadair: { name: 'iPad Air', styles: { width: '820px', height: '1180px' } },
    ipadmini: { name: 'iPad Mini', styles: { width: '768px', height: '1024px' } },
    surfacepro7: { name: 'Surface Pro 7', styles: { width: '912px', height: '1368px' } },
    surfaceduo: { name: 'Surface Duo', styles: { width: '540px', height: '720px' } },
    galaxyfold: { name: 'Galaxy Fold', styles: { width: '280px', height: '653px' } },
    galaxya5171: { name: 'Samsung Galaxy A51/71', styles: { width: '412px', height: '914px' } },
    nesthub: { name: 'Nest Hub', styles: { width: '1024px', height: '600px' } },
    nesthubmax: { name: 'Nest Hub Max', styles: { width: '1280px', height: '800px' } },
  }

  Object.keys(tailwind.theme.screens).forEach((screen) => {
    screens[screen] = {
      name: screen,
      styles: {
        width: tailwind.theme.screens[screen],
        height: '100%',
      },
    }
  })

  return {
    ...screens,
    ...(devices && deviceList),
  }
}
