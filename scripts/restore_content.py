import re
import markdown

readme_path = 'system-design-primer/README.md'
html_path = 'blueprints-complete.html'

with open(readme_path, 'r', encoding='utf-8') as f:
    readme = f.read()

def extract_section(header):
    pattern = r"^(#{2,4})\s+" + re.escape(header) + r"\n(.*)"
    match = re.search(pattern, readme, re.MULTILINE | re.DOTALL)
    if not match: return ""
    
    level = len(match.group(1))
    content = match.group(2)
    
    lines = content.split('\n')
    extracted = []
    for line in lines:
        header_match = re.match(r'^(#{2,4})\s+', line)
        if header_match:
            new_level = len(header_match.group(1))
            if "Source(s)" in line:
                break
            if new_level <= level:
                break
        extracted.append(line)
    
    return "\n".join(extracted).strip()

def md_to_html(md):
    html_content = markdown.markdown(md, extensions=['fenced_code', 'tables'])
    return html_content

mapping = {
    'perf-scale': 'Performance vs scalability',
    'lat-thru': 'Latency vs throughput',
    'cap': 'CAP theorem',
    'consistency': 'Consistency patterns',
    'availability': 'Availability patterns',
    'dns': 'Domain name system',
    'cdn': 'Content delivery network',
    'lb': 'Load balancer',
    'rproxy': 'Reverse proxy (web server)',
    'applayer': 'Application layer',
    'rdbms': 'Relational database management system (RDBMS)',
    'nosql': 'NoSQL',
    'sql-vs-nosql': 'SQL or NoSQL',
    'cache': 'Cache',
    'async': 'Asynchronism',
    'comm': 'Communication',
    'security': 'Security',
    'approach': 'How to approach a system design interview question',
    'bote': 'Back-of-the-envelope calculations',
    'db-replication': ['Master-slave replication', 'Master-master replication'],
    'db-federation': 'Federation',
    'db-sharding': 'Sharding',
    'cache-internals': ['When to update the cache']
}

with open(html_path, 'r', encoding='utf-8') as f:
    full_html = f.read()

injected = 0
for lesson_id, headers in mapping.items():
    if isinstance(headers, str):
        headers = [headers]
    
    combined_md = ""
    for h in headers:
        md = extract_section(h)
        if md:
            combined_md += f"\n<h2>{h}</h2>\n\n" + md
            
    if not combined_md.strip():
        print(f"Skipping {lesson_id}, no markdown found.")
        continue
        
    converted_html = md_to_html(combined_md)
    converted_html = converted_html.replace('`', '\\`').replace('$', '\\$')
    
    pattern = r"(id:\s*['\"]" + lesson_id + r"['\"].*?class=\"deep-divider\">The full picture</div>\n)(.*?)(?=\n\s*quiz:\s*\{)"
    
    def replacer(match):
        return match.group(1) + converted_html
        
    new_html, count = re.subn(pattern, replacer, full_html, count=1, flags=re.DOTALL)
    if count > 0:
        full_html = new_html
        injected += 1
        print(f"Restored content for {lesson_id}")
    else:
        print(f"Failed to find injection point for {lesson_id}")

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(full_html)

print(f"Restored {injected} lessons.")
