# Pattern — Prototype
# Catégorie : Patron de création
# Crée de nouveaux objets à partir d'objets existants sans dépendre de leur classe.
# Référence : https://refactoring.guru/fr/design-patterns/prototype

---

## Quand l'utiliser dans ce projet

- Cloner un formulaire avec des valeurs pré-remplies (duplication d'article)
- Créer des templates de payloads à partir d'un modèle existant
- Dupliquer une configuration de composant avec des variantes
- Cloner un état de store pour comparaison avant/après modification

---

## Template TypeScript — Nuxt 3

### utils/prototype/cloneable.ts

```typescript
// utils/prototype/cloneable.ts
// Interface Prototype — tout objet clonable l'implémente

export interface Cloneable<T> {
  clone(): T
}
```

### utils/prototype/articleTemplate.ts

```typescript
// utils/prototype/articleTemplate.ts
// Prototype — template d'article clonable
import type { Cloneable } from './cloneable'
import type { CreateArticlePayload } from '~/types/Article'

export class ArticleTemplate implements Cloneable<ArticleTemplate> {
  constructor(
    public title: string   = '',
    public content: string = '',
    public author_id: number = 0
  ) {}

  // Prototype — clone superficiel
  clone(): ArticleTemplate {
    return new ArticleTemplate(
      this.title,
      this.content,
      this.author_id
    )
  }

  // Clone avec surcharges partielles
  cloneWith(overrides: Partial<CreateArticlePayload>): ArticleTemplate {
    return new ArticleTemplate(
      overrides.title     ?? this.title,
      overrides.content   ?? this.content,
      overrides.author_id ?? this.author_id
    )
  }

  // Convertir en payload pour l'API
  toPayload(): CreateArticlePayload {
    return {
      title:     this.title,
      content:   this.content,
      author_id: this.author_id
    }
  }
}

// Templates pré-définis — prototypes réutilisables
export const ARTICLE_TEMPLATES = {
  blogPost: new ArticleTemplate(
    'Titre de l\'article',
    'Contenu de l\'article...',
    0
  ),

  tutorial: new ArticleTemplate(
    'Tutoriel : ',
    '## Introduction\n\n## Prérequis\n\n## Étapes\n\n## Conclusion',
    0
  )
} as const
```

### composables/useArticleDuplicate.ts

```typescript
// composables/useArticleDuplicate.ts
// Utilisation du Prototype pour dupliquer un article existant
import { ArticleTemplate } from '~/utils/prototype/articleTemplate'
import type { Article } from '~/types/Article'

export const useArticleDuplicate = () => {
  const { create } = useArticles()

  // Crée un prototype depuis un article existant
  const fromExisting = (article: Article): ArticleTemplate => {
    return new ArticleTemplate(
      `Copie de ${article.title}`,
      article.content,
      article.author_id
    )
  }

  // Duplique un article existant via son prototype
  const duplicate = async (article: Article) => {
    const template = fromExisting(article)
    return await create(template.toPayload())
  }

  return { fromExisting, duplicate }
}
```

### Exemple d'utilisation dans une page

```vue
<!-- pages/articles/[id].vue — section duplication -->
<script setup lang="ts">
import { ARTICLE_TEMPLATES } from '~/utils/prototype/articleTemplate'

const { fromExisting, duplicate } = useArticleDuplicate()
const { get } = useArticles()
const { form } = useArticleForm()

const route = useRoute()
const id    = Number(route.params.id)

const { data } = await useAsyncData(`article-${id}`, () => get(id))

// Initialiser le formulaire depuis un template prototype
const initFromTemplate = (templateKey: keyof typeof ARTICLE_TEMPLATES) => {
  const template = ARTICLE_TEMPLATES[templateKey].clone()
  Object.assign(form, template.toPayload())
}

// Dupliquer l'article courant
const onDuplicate = async () => {
  if (!data.value) return
  await duplicate(data.value)
  await navigateTo('/articles')
}
</script>
```

---

## Règles d'utilisation

- `clone()` crée toujours une copie indépendante — jamais de référence partagée
- `cloneWith()` permet des variations sans modifier le prototype original
- Les prototypes pré-définis sont des constantes immuables (`as const`)
- Utiliser le Prototype quand la création from scratch est coûteuse ou complexe
- Jamais de mutation du prototype original — toujours cloner avant de modifier