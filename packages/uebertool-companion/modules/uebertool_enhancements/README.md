# UEbertool Enhancements

Examples for common theming problems. Copy what you need into your theme, or
enable the module to get all of them.

## Functionality

- Inlines a local SVG site logo in the branding block (`site_logo_svg`).
- Adds width and height to SVG image fields (svg_image_field module).
- Sets the aspect ratio of remote videos and lazy loads YouTube iframes.
- Exposes the menu name, language and a cache buster on menu blocks
  (`menu_attributes`), the view title and the row view mode on views
  (`items_view_mode`), and the bundle label on nodes (`bundle_label`).

## Inline SVG logo

The logo is read from disk and printed as markup; it is never compiled as a
Twig template. Only local `.svg` files below the Drupal root are inlined; URLs
with a host and paths with `..` are rejected. Scripts, `foreignObject`, event
handlers, animations that set event handlers or links, and attributes
containing `javascript:` are removed. This is a safety net for logos uploaded
by users with "administer themes", not a full SVG sanitizer: only upload SVGs
you trust.

## Menu "cache-tag"

The value is the time the block's render cache entry was built. It changes when
the menu changes, but also on every other rebuild (cache clear, another active
trail). Use it as a cache buster, not as the menu's change date.
