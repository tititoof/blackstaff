#!/usr/bin/env node
// ═══════════════════════════════════════════════
// json-to-yaml.js — Convertit les patterns JSON → YAML
// Usage : node json-to-yaml.js [dossier/]
//         node json-to-yaml.js ./patterns/
// Par défaut : convertit le dossier courant
// ═══════════════════════════════════════════════
const fs   = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const dir = process.argv[2] || '.';

if (!fs.existsSync(dir)) {
  console.error(`❌ Dossier introuvable : ${dir}`);
  process.exit(1);
}

// ── Représenteur YAML pour strings multi-lignes ─
const SCHEMA = yaml.DEFAULT_SCHEMA;

function stringifyYaml(data) {
  return yaml.dump(data, {
    lineWidth:    120,
    indent:       2,
    noRefs:       true,
    sortKeys:     false,
    styles:       { '!!str': 'literal' },
    // Forcer les strings avec \n en block literal
    replacer: null,
  });
}

// Décoder les \n échappés
function fixEscapes(obj) {
  if (typeof obj === 'string') {
    return obj.replace(/\\n/g, '\n').replace(/\\t/g, '  ');
  }
  if (Array.isArray(obj))  return obj.map(fixEscapes);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fixEscapes(v)]));
  }
  return obj;
}

// Dumper custom pour block literals
class CustomDumper extends yaml.Dumper {}

function strRepr(dumper, value) {
  if (value.includes('\n')) {
    return new yaml.ScalarToken(value, { style: yaml.LITERAL });
  }
  // Échapper les caractères spéciaux YAML
  if (/[:{}\[\]#&*!|>'"%@`]/.test(value) || /^[-?]/.test(value)) {
    return dumper.represent_scalar('tag:yaml.org,2002:str', value, "'");
  }
  return dumper.represent_scalar('tag:yaml.org,2002:str', value);
}

const files = fs.readdirSync(dir)
  .filter(f => f.endsWith('-pattern.json') && !f.includes('improved') && !f.includes('backup'));

if (files.length === 0) {
  console.log('Aucun fichier *-pattern.json trouvé dans', dir);
  process.exit(0);
}

let ok = 0, errors = 0;
files.forEach(f => {
  const src = path.join(dir, f);
  const dst = src.replace('.json', '.yaml');
  try {
    const raw  = fs.readFileSync(src, 'utf8');
    const data = fixEscapes(JSON.parse(raw));
    const key  = f.replace('-pattern.json', '');

    const header = [
      `# Pattern Blackstaff — ${key}`,
      `# Éditer librement les templates (bloc | multi-lignes)`,
      `# Après édition : node yaml-to-json.js ${dir}`,
      '---',
      ''
    ].join('\n');

    // yaml.dump avec style literal pour les strings multi-lignes
    const yamlStr = yaml.dump(data, {
      lineWidth:         120,
      indent:            2,
      noRefs:            true,
      sortKeys:          false,
      forceQuotes:       false,
    });

    fs.writeFileSync(dst, header + yamlStr, 'utf8');
    const size = fs.statSync(dst).size;
    console.log(`  ✅ ${key.padEnd(22)} → ${path.basename(dst)} (${Math.round(size/1024)}Ko)`);
    ok++;
  } catch(e) {
    console.error(`  ❌ ${f}: ${e.message}`);
    errors++;
  }
});

console.log(`\n${ok}/${files.length} convertis`);
if (errors > 0) process.exit(1);