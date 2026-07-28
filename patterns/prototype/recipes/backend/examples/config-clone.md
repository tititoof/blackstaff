---
type: Example
title: Prototype — exemple Configuration complexe
tags: [prototype, config, rails, laravel, symfony]
---

# Application du pattern sur un objet de configuration

Cloner une configuration complexe (template de workflow, configuration
d'export, paramètres de rapport) pour créer une nouvelle configuration
pré-remplie à partir d'une existante.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Prototype}` | `ReportConfig` |
| `{Child}` | `ReportSection` |
| Attributs scalaires | `name`, `filters`, `columns`, `schedule` |
| Attributs exclus | `id`, `created_at`, `updated_at`, `last_run_at` |
| Overrides | `name: "#{name} (copie)"`, `last_run_at: nil` |

# Différence avec l'entité métier

Un objet de configuration n'est pas nécessairement une entité ActiveRecord
ou Doctrine — il peut être un **objet Ruby/PHP pur** (PORO / POPO) sans
table de base de données. Le Prototype s'applique identiquement :
l'objet se clone lui-même, les imbrications sont copiées en profondeur.

# Rails — configuration comme PORO (Plain Old Ruby Object)

```ruby
# app/models/report_config.rb
class ReportConfig
  include Cloneable

  attr_accessor :name, :filters, :columns, :sections, :schedule

  def initialize(name:, filters: {}, columns: [], sections: [], schedule: nil)
    @name     = name
    @filters  = filters
    @columns  = columns
    @sections = sections
    @schedule = schedule
  end

  def clone_prototype
    ReportConfig.new(
      name:     "#{@name} (copie)",
      filters:  @filters.deep_dup,          # deep_dup Rails pour les Hash imbriqués
      columns:  @columns.dup,               # tableau de scalaires → dup suffit
      sections: @sections.map(&:clone_prototype),  # objets → clone récursif
      schedule: @schedule&.clone_prototype,
    )
  end
end

# app/models/report_section.rb
class ReportSection
  include Cloneable
  attr_accessor :title, :query, :display_options

  def clone_prototype
    ReportSection.new.tap do |c|
      c.title           = @title
      c.query           = @query.deep_dup
      c.display_options = @display_options.deep_dup
    end
  end
end
```

# Laravel — configuration comme Value Object

```php
// app/ValueObjects/ReportConfig.php
final class ReportConfig implements Cloneable
{
    public function __construct(
        public readonly string $name,
        public readonly array  $filters,
        public readonly array  $columns,
        public readonly array  $sections,    // ReportSection[]
        public readonly ?string $schedule = null,
    ) {}

    public function clonePrototype(): static
    {
        return new static(
            name:     $this->name . ' (copie)',
            filters:  $this->filters,            // tableaux PHP = copie par valeur
            columns:  $this->columns,
            sections: array_map(
                fn(ReportSection $s) => $s->clonePrototype(),
                $this->sections
            ),
            schedule: $this->schedule,
        );
    }

    public static function fromArray(array $data): static
    {
        return new static(
            name:     $data['name'],
            filters:  $data['filters']  ?? [],
            columns:  $data['columns']  ?? [],
            sections: array_map([ReportSection::class, 'fromArray'], $data['sections'] ?? []),
            schedule: $data['schedule'] ?? null,
        );
    }
}
```

# Symfony — configuration comme DTO clonable

```php
// src/Dto/ReportConfigDto.php
class ReportConfigDto implements CloneableInterface
{
    public string $name = '';
    public array  $filters = [];
    public array  $columns = [];
    /** @var ReportSectionDto[] */
    public array  $sections = [];
    public ?string $schedule = null;

    public function clonePrototype(): static
    {
        $clone           = new static();
        $clone->name     = $this->name . ' (copie)';
        $clone->filters  = $this->filters;   // tableaux PHP = copie par valeur
        $clone->columns  = $this->columns;
        $clone->sections = array_map(
            fn(ReportSectionDto $s) => $s->clonePrototype(),
            $this->sections
        );
        $clone->schedule = $this->schedule;
        return $clone;
    }
}
```

# Différence de traitement des tableaux selon le langage

| Langage | Tableau de scalaires | Hash/objet imbriqué | Objets avec méthodes |
|---|---|---|---|
| Ruby | `.dup` | `.deep_dup` (Rails) | `clone_prototype` récursif |
| PHP | `$array` (copie par valeur) | `$array` (copie par valeur) | `clonePrototype()` récursif |
| TypeScript | `[...array]` ou `.slice()` | `{ ...obj }` ou `structuredClone` | `.clone()` récursif |

PHP est le plus simple : les tableaux sont des types valeur, copiés
automatiquement lors de l'assignation — aucun `deep_dup` nécessaire.

# Cas d'usage typique en API

```
GET  /api/report-configs          → liste des configs
POST /api/report-configs/{id}/clone → clone la config {id}
  Response 201: nouvelle config avec name "{name} (copie)"
```