import re

with open('advanced_lessons.js', 'r', encoding='utf-8') as f:
    advanced = f.read()

with open('blueprints-complete.html', 'r', encoding='utf-8') as f:
    html = f.read()

pattern = r"(\}?,?\n*)(\];\n+/\* ---------------- renderer ---------------- \*/)"

def replacer(match):
    prefix = match.group(1).rstrip()
    if prefix.endswith('}'):
        prefix += ','
    return prefix + '\n' + advanced + '\n' + match.group(2)

new_html, count = re.subn(pattern, replacer, html, flags=re.DOTALL)

if count > 0:
    with open('blueprints-complete.html', 'w', encoding='utf-8') as f:
        f.write(new_html)
    print(f"Successfully injected Advanced Lessons! Replacements: {count}")
else:
    print("FAILED to inject. Regex did not match.")
