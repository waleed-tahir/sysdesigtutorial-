import re

readme = open('system-design-primer/README.md', 'r', encoding='utf-8').read()

# Match standard markdown images ![alt](url)
markdown_images = re.findall(r'!\[.*?\]\((.*?)\)', readme)

# Match HTML images <img src="url">
html_images = re.findall(r'<img.*?src=[\"\'](.*?)[\"\']', readme, re.IGNORECASE)

print(f"Found {len(markdown_images)} markdown images.")
for m in set(markdown_images):
    print("MD:", m)

print(f"Found {len(html_images)} html images.")
for m in set(html_images):
    print("HTML:", m)
