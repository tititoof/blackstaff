#!/usr/bin/env python3
# ═══════════════════════════════════════════════
# yaml-to-json.py — Convertit les patterns YAML → JSON
# Usage : python3 yaml-to-json.py [dossier]
#         python3 yaml-to-json.py ./nuxt3/patterns/
# ═══════════════════════════════════════════════
import json, yaml, os, sys

dir_path = sys.argv[1] if len(sys.argv) > 1 else '.'

if not os.path.isdir(dir_path):
    print(f'❌ Dossier introuvable : {dir_path}')
    sys.exit(1)

files = sorted([
    f for f in os.listdir(dir_path)
    if (f.endswith('.yaml') or f.endswith('.yml'))
    and 'improved' not in f and 'backup' not in f
])

if not files:
    print(f'Aucun fichier *-pattern.yaml trouvé dans {dir_path}')
    sys.exit(0)

ok, errors = 0, []

for fname in files:
    src = os.path.join(dir_path, fname)
    dst = src.replace('.yaml', '.json').replace('.yml', '.json')
    key = fname.replace('-pattern.yaml', '').replace('-pattern.yml', '')

    try:
        with open(src, encoding='utf-8') as f:
            data = yaml.safe_load(f)

        with open(dst, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        size = os.path.getsize(dst)
        print(f'  ✅ {key:<22} → {os.path.basename(dst)} ({size//1024}Ko)')
        ok += 1
    except Exception as e:
        print(f'  ❌ {fname}: {e}')
        errors.append(fname)

print(f'\n{ok}/{len(files)} convertis')
sys.exit(1 if errors else 0)