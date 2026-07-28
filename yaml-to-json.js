#!/usr/bin/env node
// ═══════════════════════════════════════════════
// Script de déploiement : convertit les YAML → JSON
// pour n8n qui n'a pas forcément js-yaml accessible
//
// Usage :
//   node yaml-to-json.js /path/to/patterns/
//
// Convertit tous les *.yaml en *.json dans le dossier
// Garde les *.yaml pour l'édition VS Code
// ═══════════════════════════════════════════════
const fs   = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const patternsDir = process.argv[2] || './patterns';

if (!fs.existsSync(patternsDir)) {
  console.error(`Dossier introuvable : ${patternsDir}`);
  process.exit(1);
}

const files = fs.readdirSync(patternsDir)
  .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

let ok = 0, errors = 0;
files.forEach(f => {
  try {
    const yamlPath = path.join(patternsDir, f);
    const jsonPath = yamlPath.replace(/\.ya?ml$/, '.json');
    const data     = yaml.load(fs.readFileSync(yamlPath, 'utf8'));
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    console.log(`✅ ${f} → ${path.basename(jsonPath)}`);
    ok++;
  } catch(e) {
    console.error(`❌ ${f} : ${e.message}`);
    errors++;
  }
});

console.log(`\nConvertis : ${ok} | Erreurs : ${errors}`);