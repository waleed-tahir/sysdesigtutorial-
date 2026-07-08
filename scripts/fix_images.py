import re

with open('blueprints-complete.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace all http://i.imgur.com/XYZ.png with https://raw.githubusercontent.com/donnemartin/system-design-primer/master/images/XYZ.png
# This fixes broken hotlinking, mixed-content warnings, and dead links.
def replace_imgur(match):
    image_id = match.group(1)
    return f"https://raw.githubusercontent.com/donnemartin/system-design-primer/master/images/{image_id}"

new_html = re.sub(r'http://i\.imgur\.com/([^\"\'\s\>]+)', replace_imgur, html)

with open('blueprints-complete.html', 'w', encoding='utf-8') as f:
    f.write(new_html)

print("Replaced all imgur links with raw github images.")
