import re

with open('new_lessons.js', 'r', encoding='utf-8') as f:
    new_lessons = f.read()

# Strip "const NEW_LESSONS = [" from the top and "];" from the bottom
new_lessons = re.sub(r'^const NEW_LESSONS = \[\n?', '', new_lessons)
new_lessons = re.sub(r'\];\n?$', '', new_lessons)

with open('blueprints-complete.html', 'r', encoding='utf-8') as f:
    html = f.read()

# We need to insert `new_lessons` just before the `];` that closes the `LESSONS` array.
# Let's find the closing `];` that follows the 'scaling-journey' lesson.
pattern = r"(id:'scaling-journey'.*?\}\,)(\n\];)"

def replacer(match):
    return match.group(1) + "\n" + new_lessons + match.group(2)

new_html = re.sub(pattern, replacer, html, flags=re.DOTALL)

with open('blueprints-complete.html', 'w', encoding='utf-8') as f:
    f.write(new_html)

print("Injected new lessons into blueprints-complete.html")
