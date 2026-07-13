import json
en = json.load(open('en.json'))
ar = json.load(open('ar.json'))

def get_keys(obj, prefix=''):
    keys = set()
    for k, v in obj.items():
        full = f'{prefix}.{k}' if prefix else k
        if isinstance(v, dict):
            keys.update(get_keys(v, full))
        else:
            keys.add(full)
    return keys

en_keys = get_keys(en)
ar_keys = get_keys(ar)

missing_in_ar = en_keys - ar_keys
missing_in_en = ar_keys - en_keys

if missing_in_ar:
    print('MISSING IN AR:')
    for k in sorted(missing_in_ar):
        print(f'  {k}')
if missing_in_en:
    print('MISSING IN EN:')
    for k in sorted(missing_in_en):
        print(f'  {k}')
if not missing_in_ar and not missing_in_en:
    print('All keys match!')
