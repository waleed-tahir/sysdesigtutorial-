import re

with open('ood_appendix.js', 'r', encoding='utf-8') as f:
    ood_lessons = f.read()

# Strip "const OOD_LESSONS = [" and "];"
ood_lessons = re.sub(r'^const OOD_LESSONS = \[\n?', '', ood_lessons)
ood_lessons = re.sub(r'\];\n?$', '', ood_lessons)

with open('blueprints-complete.html', 'r', encoding='utf-8') as f:
    html = f.read()

pattern = r"(\},\n+)(\];\n+/\* ---------------- renderer ---------------- \*/)"

def replacer(match):
    # Make sure we add a comma if it's missing, though our ood_lessons probably ends with },
    return match.group(1) + ood_lessons + match.group(2)

new_html, count = re.subn(pattern, replacer, html, flags=re.DOTALL)

if count > 0:
    with open('blueprints-complete.html', 'w', encoding='utf-8') as f:
        f.write(new_html)
    print(f"Successfully injected OOD lessons! Replacements: {count}")
else:
    print("FAILED to inject. Regex did not match.")
