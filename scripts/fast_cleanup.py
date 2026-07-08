import re
import os
import hashlib

html_path = 'blueprints-complete.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Clean up all [Offline] badges that were injected previously.
html = re.sub(r'\s*<a[^>]+href="offline_links/[^"]+"[^>]*>\[Offline\]</a>', '', html)

# 2. Fix the remaining pure hash links!
mapping = {
    'eventual-consistency': 'consistency',
    'cap-theorem': 'cap',
    'layer-7-load-balancing': 'lb',
    'layer-4-load-balancing': 'lb',
    'active-active': 'availability',
    'active-passive': 'availability',
    'disadvantages-replication': 'db-replication',
    'latency-numbers-every-programmer-should-know': 'lat-thru',
    'appendix': 'approach',
    'powers-of-two-table': 'approach',
    'system-design-interview-questions-with-solutions': 'approach',
    'index-of-system-design-topics': 'approach',
    'contributing': 'approach'
}

def replace_hash(match):
    full_tag = match.group(0)
    anchor = match.group(1).lower()
    lesson_id = mapping.get(anchor)
    if lesson_id:
        return re.sub(r'href=[\"\']#[^\"\']+[\"\']', f'href="#" onclick="go(\'{lesson_id}\'); return false;"', full_tag)
    return full_tag

html = re.sub(r'<a[^>]+href=[\"\']#([^\"\']+)[\"\'][^>]*>', replace_hash, html, flags=re.IGNORECASE)

# 3. For all external links, replace the href with the offline file IF IT EXISTS.
offline_dir = 'offline_links'

def replace_external(match):
    full_tag = match.group(0)
    url = match.group(1)
    
    if 'onclick=' in full_tag or url.endswith('.png') or url.endswith('.jpg') or 'imgur.com' in url or 'github.com/donnemartin' in url:
        return full_tag
        
    url_hash = hashlib.md5(url.encode('utf-8')).hexdigest()
    local_filename = f"{url_hash}.html"
    local_path = os.path.join(offline_dir, local_filename)
                
    if os.path.exists(local_path):
        return re.sub(r'href=[\"\']' + re.escape(url) + r'[\"\']', f'href="offline_links/{local_filename}" target="_blank"', full_tag)
        
    return full_tag

new_html = re.sub(r'<a[^>]+href=[\"\'](http[^\"\']+)[\"\'][^>]*>', replace_external, html, flags=re.IGNORECASE)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(new_html)

print("Finished fast cleanup and fixing links!")
