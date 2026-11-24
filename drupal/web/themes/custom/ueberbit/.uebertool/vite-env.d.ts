
/// <reference types="vite/client" />
/// <reference types="@ueberbit/vite-plugin-drupal/types/dom" />
/// <reference types="@ueberbit/vite-plugin-drupal/types/drupal" />
/// <reference types="@ueberbit/vite-plugin-drupal/types/once" />
/// <reference types="@ueberbit/vite-plugin-drupal/types/virtual" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<{}, {}, any>
  export default component
}