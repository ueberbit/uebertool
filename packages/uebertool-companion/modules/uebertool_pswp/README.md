# UEbertool Photoswipe

Adds a "Photoswipe" third party setting to image formatters. The module only
prepares the markup; the theme loads and initialises Photoswipe itself and
attaches its library.

## Functionality

- Wraps every image in a link to the full size image (or the selected image
  style) with `data-pswp-width` and `data-pswp-height`.
- Adds the theme suggestions `field__pswp` and `field__pswp__FIELD_NAME` after
  the existing ones.

## Dimensions

The dimensions come from the image field item; the file is only read when the
item has none. With an image style they are calculated with
`ImageStyle::transformDimensions()`. If the style's output size is unknown, the
link falls back to the original image, because Photoswipe needs the size.
