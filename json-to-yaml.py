#!/usr/bin/env python3
# ═══════════════════════════════════════════════
# json-to-yaml.py — Convertit les patterns JSON → YAML
# Usage : python3 json-to-yaml.py [dossier]
#         python3 json-to-yaml.py ./nuxt3/patterns/
# Dépendance : pip install pyyaml
# ═══════════════════════════════════════════════
import json, yaml, os, sys

dir_path = sys.argv[1] if len(sys.argv) > 1 else '.'

if not os.path.isdir(dir_path):
    print(f'❌ Dossier introuvable : {dir_path}')
    sys.exit(1)

# ── Représenteur pour strings multi-lignes ──────
class BlackstaffDumper(yaml.Dumper):
    pass

def str_representer(dumper, value):
    if '\n' in value:
        return dumper.represent_scalar('tag:yaml.org,2002:str', value, style='|')
    if any(c in value for c in ['{', '}', ':', '#', "'", '"']):
        return dumper.represent_scalar('tag:yaml.org,2002:str', value, style="'")
    return dumper.represent_scalar('tag:yaml.org,2002:str', value)

BlackstaffDumper.add_representer(str, str_representer)

# ── Décoder les \n échappés ─────────────────────
def fix_escapes(obj):
    if isinstance(obj, str):   return obj.replace('\\n', '\n').replace('\\t', '  ')
    if isinstance(obj, list):  return [fix_escapes(i) for i in obj]
    if isinstance(obj, dict):  return {k: fix_escapes(v) for k, v in obj.items()}
    return obj

files = sorted([
    f for f in os.listdir(dir_path)
    if f.endswith('.json') and 'improved' not in f and 'backup' not in f
])

if not files:
    print(f'Aucun fichier *.json trouvé dans {dir_path}')
    sys.exit(0)

ok, errors = 0, []

for fname in files:
    src = os.path.join(dir_path, fname)
    dst = src.replace('.json', '.yaml')
    key = fname.replace('.json', '')

    try:
        with open(src, encoding='utf-8') as f:
            data = fix_escapes(json.load(f))

        header  = f'# Pattern Blackstaff — {key}\n'
        header += f'# Éditer librement les templates (bloc | multi-lignes)\n'
        header += f'# Après édition : python3 yaml-to-json.py {dir_path}\n'
        header += '---\n'

        with open(dst, 'w', encoding='utf-8') as f:
            f.write(header)
            yaml.dump(data, f,
                      Dumper=BlackstaffDumper,
                      allow_unicode=True,
                      default_flow_style=False,
                      sort_keys=False,
                      indent=2,
                      width=120)

        size = os.path.getsize(dst)
        print(f'  ✅ {key:<22} → {os.path.basename(dst)} ({size//1024}Ko)')
        ok += 1
    except Exception as e:
        print(f'  ❌ {fname}: {e}')
        errors.append(fname)

print(f'\n{ok}/{len(files)} convertis')
sys.exit(1 if errors else 0)