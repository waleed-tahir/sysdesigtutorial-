import re

readme = open('system-design-primer/README.md', 'r', encoding='utf-8').read()

# 1. Parse README.md to find images and their headings
# We split by lines. If we see a header (## or ###), we remember it.
# If we see an image, we associate it with the current header.
current_header = ""
header_to_images = {}

for line in readme.split('\n'):
    header_match = re.match(r'^\s*#{2,4}\s+(.*)', line)
    if header_match:
        current_header = header_match.group(1).strip()
        continue
    
    # Check for HTML image
    img_match = re.search(r'<img.*?src=[\"\']images/(.*?)[\"\']', line, re.IGNORECASE)
    if img_match:
        img_id = img_match.group(1)
        if current_header not in header_to_images:
            header_to_images[current_header] = []
        header_to_images[current_header].append(img_id)

print("Found image mapping from README.md:")
for h, imgs in header_to_images.items():
    print(f"  {h}: {imgs}")

# 2. Inject into blueprints-complete.html
with open('blueprints-complete.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Manual mapping from Primer headings to Blueprints lesson IDs
# Primer Headings:
# Domain name system
# Content delivery network
# Load balancer
# Reverse proxy (web server)
# Application layer
# Database
# Cache
# Asynchronism
# Communication

mapping = {
    'Domain name system': 'dns',
    'Content delivery network': 'cdn',
    'Load balancer': 'load-balancer',
    'Reverse proxy (web server)': 'reverse-proxy',
    'Application layer': 'app-layer',
    'Database': 'rdbms', # RDBMS is the first db lesson
    'Cache': 'cache',
    'Asynchronism': 'asynchronism',
    'Communication': 'communication'
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
        
        # We find the lesson block in HTML
        # Look for: id: 'lesson_id', ...
        # And inject right after `<div class="deep-divider">The full picture</div>\n`
        # or after `<h2>...</h2>` inside that block.
        
        lesson_regex = r"(id:\s*['\"]" + lesson_id + r"['\"].*?class=\"deep-divider\">The full picture</div>\n)(.*?)(?=\n\s*</?(?:h2|h3|p)>)"
        
        def replacer(match):
            # match.group(1) is up to The full picture</div>\n
            # match.group(2) is any text immediately following it before the next paragraph/heading
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

print(f"\nSuccessfully injected diagrams into {injected_count} foundational lessons.")
