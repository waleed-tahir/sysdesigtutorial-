import re

readme = open('system-design-primer/README.md', 'r', encoding='utf-8').read()

current_header = ""
header_to_images = {}

for line in readme.split('\n'):
    header_match = re.match(r'^\s*#{2,4}\s+(.*)', line)
    if header_match:
        current_header = header_match.group(1).strip()
        continue
    
    img_match = re.search(r'<img.*?src=[\"\']images/(.*?)[\"\']', line, re.IGNORECASE)
    if img_match:
        img_id = img_match.group(1)
        if current_header not in header_to_images:
            header_to_images[current_header] = []
        header_to_images[current_header].append(img_id)

with open('blueprints-complete.html', 'r', encoding='utf-8') as f:
    html = f.read()

mapping = {
    'CAP theorem': 'cap',
    'Master-slave replication': 'db-replication',
    'Federation': 'db-federation',
    'Sharding': 'db-sharding',
    'SQL or NoSQL': 'sql-vs-nosql',
}

injected_count = 0
for primer_h, lesson_id in mapping.items():
    if primer_h in header_to_images:
        images = header_to_images[primer_h]
        if not images: continue
        
        img_tags = []
        for img in images:
            url = f"https://raw.githubusercontent.com/donnemartin/system-design-primer/master/images/{img}"
            img_tags.append(f'<p><img src="{url}" alt="{primer_h} architecture diagram"></p>')
        
        injection_html = "\n".join(img_tags) + "\n"
        
        lesson_regex = r"(id:\s*['\"]" + lesson_id + r"['\"].*?class=\"deep-divider\">The full picture</div>\n)(.*?)(?=\n\s*</?(?:h2|h3|p)>)"
        
        def replacer(match):
            return match.group(1) + injection_html + match.group(2)
        
        new_html, count = re.subn(lesson_regex, replacer, html, count=1, flags=re.DOTALL)
        if count > 0:
            html = new_html
            injected_count += 1
            print(f"Injected {len(images)} images into lesson: {lesson_id}")
        else:
            print(f"Failed to inject into lesson: {lesson_id}")

with open('blueprints-complete.html', 'w', encoding='utf-8') as f:
    f.write(html)

print(f"\nSuccessfully injected additional diagrams into {injected_count} remaining lessons.")
