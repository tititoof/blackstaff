
## Stack officielle

- Framework : Nuxt 3
- Langage : TypeScript strict (no any, strict mode activé)
- Architecture : Layer-based + Nitro proxy
- Package manager : pnpm
- Rendering : Hybrid (SSR + SSG selon la page)
- Auth : JWT via cookie httpOnly géré par Nitro

## Modules autorisés

- @nuxt/content
- @nuxtjs/i18n
- @nuxt/image
- @nuxtjs/seo
- @pinia/nuxt
- vuetify-nuxt-module
- @unocss/nuxt
- @vueuse/nuxt
- dayjs-nuxt
- nuxt-resend

## Interdictions strictes

- Axios → utiliser $fetch ou useFetch
- Vuex → utiliser Pinia uniquement
- Tailwind → utiliser UnoCSS
- Toute librairie UI supplémentaire
- Abstractions génériques sans justification
- @pinia-plugin-persistedstate → interdit (exposerait le token)
- Stocker le JWT dans Pinia, localStorage, sessionStorage → INTERDIT
- Appeler l'API Rails directement depuis le browser → INTERDIT
- Exposer railsApiBase dans runtimeConfig.public → INTERDIT

