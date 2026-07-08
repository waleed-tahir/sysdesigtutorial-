import re
html = open('blueprints-complete.html', 'r', encoding='utf-8').read()
matches = re.findall(r"id:\s*['\"](.*?)['\"]", html)
print(matches[:25])
