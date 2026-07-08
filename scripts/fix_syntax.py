with open('blueprints-complete.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Fix Amazon's nav
html = html.replace("nav: 'Amazon's'", "nav: \"Amazon's\"")

# Fix title if it has unescaped quotes inside single quotes
html = html.replace("title: 'Design Amazon\\'s sales ranking by category feature'", "title: \"Design Amazon's sales ranking by category feature\"")

# Let's also check for any backticks that might have broken the template literals.
# Since we replaced markdown to HTML, let's see if the node command passes now.

with open('blueprints-complete.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Fixed syntax in HTML.")
