import os
import re
import urllib.request
import hashlib
from html.parser import HTMLParser

html_path = 'blueprints-complete.html'
offline_dir = 'offline_links'

if not os.path.exists(offline_dir):
    os.makedirs(offline_dir)

with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Find all <a href="http..."> that are not images
# We need to replace them in the HTML, so let's find the full tag to insert [Offline Copy] after it.
# e.g., <a href="http://example.com">Link</a> -> <a href="http://example.com">Link</a> <a href="offline_links/hash.html" class="offline-badge">[Offline]</a>

# To avoid matching previously added offline badges, we do this carefully.
matches = set(re.findall(r'<a[^>]+href=[\"\'](http[^\'\"]+)[\"\'][^>]*>(.*?)</a>', html, re.IGNORECASE))

print(f"Found {len(matches)} external links.")

def fetch_content(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.read()
    except Exception as e:
        print(f"Failed to fetch {url}: {e}")
        return None

scraped = 0
for url, text in matches:
    # Skip if it's an image
    if url.endswith('.png') or url.endswith('.jpg') or url.endswith('.jpeg') or 'imgur.com' in url:
        continue
        
    # Create hash for filename
    url_hash = hashlib.md5(url.encode('utf-8')).hexdigest()
    local_filename = f"{url_hash}.html"
    local_path = os.path.join(offline_dir, local_filename)
    
    if not os.path.exists(local_path):
        print(f"Scraping {url}...")
        content = fetch_content(url)
        if content:
            with open(local_path, 'wb') as out_file:
                out_file.write(content)
            scraped += 1
        else:
            continue
    
    # Inject the offline badge
    original_tag = f'<a href="{url}">{text}</a>'
    # Wait, the tag might have other attributes like class, target.
    # We should use regex substitution for this specific URL.
    # Find: <a(.*?)href="URL"(.*?)>TEXT</a>
    # Replace: <a\1href="URL"\2>TEXT</a> <a href="offline_links/HASH.html" style="font-size: 0.8em; color: #888; text-decoration: none;">[Offline]</a>
    
    # Let's just do a simple replace since we have the URL
    # Find: `href="URL"`
    # Actually, the safest way is to find `<a[^>]+href="URL"[^>]*>.*?</a>` and append the badge.
    # Let's use a function for re.sub
    pattern = re.compile(r'(<a[^>]+href=[\"\']' + re.escape(url) + r'[\"\'][^>]*>.*?</a>)(?!\s*<a[^>]+>\[Offline\]</a>)')
    
    badge = f' <a href="offline_links/{local_filename}" target="_blank" style="font-size: 0.8em; color: var(--accent); text-decoration: none; border: 1px solid var(--border); padding: 2px 4px; border-radius: 4px; margin-left: 4px;">[Offline]</a>'
    
    html = pattern.sub(r'\1' + badge, html)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

print(f"Finished scraping {scraped} links.")
