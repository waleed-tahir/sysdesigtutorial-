import re
html = open('blueprints-complete.html', 'r', encoding='utf-8').read()
matches = re.findall(r"title:\s*['\"](.*?)['\"]", html)
for i, m in enumerate(matches):
    print(f"{i+1}. {m}")
