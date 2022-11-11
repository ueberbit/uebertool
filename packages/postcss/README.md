# @ueberbit/postcss

## Plugins

### stripcolor
This plugin adds the `--strip-color` prefix. It strips away the color function off the current declaration.

Usage:
```css
:root {
  --my-color: hsl(357 72% 87%) --strip-color;
}
```
becomes:
```
:root {
  --my-color: 357 72% 87%;
}
```
This is essentially just for better readability in the editor, since colors without a color function is quite cryptic.

Usecases include theming with tailwind.
