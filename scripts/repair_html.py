import re

with open('blueprints-complete.html', 'r', encoding='utf-8') as f:
    html = f.read()

crdts_anchor = "why: 'CRDTs are designed to merge conflicting updates from multiple peers deterministically, without relying on a central server to transform the operations.' }\n    },"

crdts_end = html.find(crdts_anchor)
if crdts_end != -1:
    crdts_end += len(crdts_anchor)
    rend_start = html.find('const doneSet = new Set();')
    new_html = html[:crdts_end] + '\n];\n\n/* ---------------- renderer ---------------- */\n' + html[rend_start:]
    
    with open('blueprints-complete.html', 'w', encoding='utf-8') as f:
        f.write(new_html)
    print("Repaired HTML!")
else:
    print("Could not find anchor")
