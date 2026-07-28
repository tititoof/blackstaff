---
type: Example
title: Builder — exemple Requête complexe (SQL, Elasticsearch)
tags: [builder, query, rails, laravel, symfony]
---

# Application du pattern sur une requête de recherche

Construit une requête de recherche complexe avec filtres, tri, pagination
et agrégations — dans deux représentations : SQL (via ORM) et Elasticsearch.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Domain}` | `Search` |
| `{Product}` | `Query` (SQL scope) / `EsQuery` (tableau Elasticsearch) |
| `{Builder}Interface` | `SearchQueryBuilderInterface` |
| `{ConcreteA}{Builder}` | `SqlSearchQueryBuilder` |
| `{ConcreteB}{Builder}` | `ElasticSearchQueryBuilder` |
| `{Director}` | `SearchQueryDirector` |
| `stepA` | `addFilters(filters)` |
| `stepB` | `addSort(field, direction)` |
| `stepC` | `addPagination(page, per_page)` |
| stepD | `addAggregations(aggs)` (optionnel) |

# Étapes de construction

```
addFilters(filters)            ← critères de recherche (where / must)
addSort(field, direction)      ← tri (order / sort)
addPagination(page, per_page)  ← pagination (limit/offset / from/size)
addAggregations(aggs)          ← agrégations Elasticsearch (optionnel)
```

# Rails — nommage concret

```
app/builders/searches/
├── search_query_builder_interface.rb
├── sql_search_query_builder.rb
│     # Construit un scope ActiveRecord chainé
│     @query = Model.all
│     def add_filters(filters)
│       filters.each { |k, v| @query = @query.where(k => v) }; self
│     def add_sort(field:, direction: :asc)
│       @query = @query.order(field => direction); self
│     def add_pagination(page:, per_page: 25)
│       @query = @query.page(page).per(per_page); self
│     def get_result → @query (ActiveRecord::Relation)
├── elastic_search_query_builder.rb
│     # Construit un hash de requête Elasticsearch DSL
│     @query = { query: { bool: { must: [] } }, sort: [], from: 0, size: 25 }
│     def add_filters(filters)
│       filters.each { |k, v| @query[:query][:bool][:must] << { match: { k => v } } }; self
│     def add_sort(field:, direction: :asc)
│       @query[:sort] << { field => { order: direction } }; self
│     def add_pagination(page:, per_page: 25)
│       @query.merge!(from: (page - 1) * per_page, size: per_page); self
│     def get_result → @query (Hash prêt pour le client ES)
└── search_query_director.rb
      def build_standard_search(builder, filters:, sort_field: :created_at)
        builder.reset
        builder.add_filters(filters)
        builder.add_sort(field: sort_field, direction: :desc)
        builder.add_pagination(page: 1)
      end

      def build_advanced_search(builder, filters:, page:, aggs: {})
        builder.reset
        builder.add_filters(filters)
        builder.add_sort(field: :relevance, direction: :desc)
        builder.add_pagination(page: page, per_page: 50)
        builder.add_aggregations(aggs) if builder.respond_to?(:add_aggregations)
      end
```

# Laravel — nommage concret

```
app/Builders/Searches/
├── Contracts/SearchQueryBuilderInterface.php
│     addFilters(array $filters): static
│     addSort(string $field, string $direction = 'asc'): static
│     addPagination(int $page, int $perPage = 25): static
├── SqlSearchQueryBuilder.php
│     # Construit un Builder Eloquent (Query Builder)
│     private Builder $query;
│     addFilters → $this->query->where(...)
│     addSort    → $this->query->orderBy(...)
│     addPagination → $this->query->paginate(...)
│     getResult(): LengthAwarePaginator
├── ElasticSearchQueryBuilder.php
│     # Construit un tableau DSL Elasticsearch
│     private array $query = ['query' => ['bool' => ['must' => []]]];
│     addFilters → push dans must
│     addSort    → push dans sort
│     addPagination → set from/size
│     getResult(): array
└── SearchQueryDirector.php
      public function buildStandardSearch(
          SearchQueryBuilderInterface $builder,
          array $filters,
          string $sortField = 'created_at'
      ): void {
          $builder->reset()
                  ->addFilters($filters)
                  ->addSort($sortField, 'desc')
                  ->addPagination(1);
      }
```

# Symfony — nommage concret

```
src/Builder/Search/
├── SearchQueryBuilderInterface.php
├── SqlSearchQueryBuilder.php
│     # Utilise QueryBuilder Doctrine
│     private QueryBuilder $qb;
│     addFilters  → $this->qb->andWhere(...)
│     addSort     → $this->qb->orderBy(...)
│     addPagination → $this->qb->setFirstResult(...)->setMaxResults(...)
│     getResult(): Query (Doctrine)
├── ElasticSearchQueryBuilder.php
│     # Utilise FOS\ElasticaBundle ou elasticsearch-php
│     getResult(): array (DSL Elasticsearch)
└── SearchQueryDirector.php

# config/services.yaml
# SearchQueryBuilderInterface: alias SqlSearchQueryBuilder (défaut)
```

# Pourquoi Builder ici

La requête se construit en **plusieurs étapes indépendantes et ordonnées**,
dont certaines sont optionnelles (agrégations). Le Director encapsule des
recettes de recherche réutilisables (`standard`, `advanced`) qui s'appliquent
identiquement à SQL et Elasticsearch — seule la traduction concrète change.

Sans Builder, chaque endpoint de recherche recomposerait sa propre requête
— duplication du code d'assemblage et perte de cohérence entre les deux
backends de recherche.