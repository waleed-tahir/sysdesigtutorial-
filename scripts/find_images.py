import re

with open('blueprints-complete.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find all img src attributes
matches = re.findall(r'<img.*?src=[\"\'](.*?)[\"\']', html, re.IGNORECASE)

print(f"Found {len(matches)} images.")
for m in set(matches):
    print(m)
