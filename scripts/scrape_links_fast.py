import os
import re
import urllib.request
import hashlib
from concurrent.futures import ThreadPoolExecutor, as_completed

html_path = 'blueprints-complete.html'
offline_dir = 'offline_links'

if not os.path.exists(offline_dir):
    os.makedirs(offline_dir)

with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

matches = set(re.findall(r'<a[^>]+href=[\"\'](http[^\'\"]+)[\"\'][^>]*>(.*?)</a>', html, re.IGNORECASE))
print(f"Found {len(matches)} external links.")

urls_to_scrape = []
for url, text in matches:
    if url.endswith('.png') or url.endswith('.jpg') or url.endswith('.jpeg') or 'imgur.com' in url or 'github.com' in url:
        # Ignore images and raw github links (we already handled images)
        if not 'github.com/donnemartin' in url:
            urls_to_scrape.append((url, text))
        continue
    urls_to_scrape.append((url, text))

def fetch_content(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'})
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.read()
    except Exception as e:
        return None

def process_url(item):
    url, text = item
    url_hash = hashlib.md5(url.encode('utf-8')).hexdigest()
    local_filename = f"{url_hash}.html"
    local_path = os.path.join(offline_dir, local_filename)
    
    if os.path.exists(local_path):
        return url, text, local_filename, True

    content = fetch_content(url)
    if content:
        with open(local_path, 'wb') as out_file:
            out_file.write(content)
        return url, text, local_filename, True
    return url, text, local_filename, False

scraped = 0
failed = 0

print("Starting multithreaded scraping...")
with ThreadPoolExecutor(max_workers=20) as executor:
    futures = [executor.submit(process_url, item) for item in urls_to_scrape]
    for future in as_completed(futures):
        url, text, local_filename, success = future.result()
        if success:
            scraped += 1
            # We do string replacement after
        else:
            failed += 1

print(f"Scraping complete. Success: {scraped}, Failed/Timeout: {failed}")

# Now inject the badges for successful scrapes
for url, text in urls_to_scrape:
    url_hash = hashlib.md5(url.encode('utf-8')).hexdigest()
    local_filename = f"{url_hash}.html"
    local_path = os.path.join(offline_dir, local_filename)
    
    if os.path.exists(local_path):
        pattern = re.compile(r'(<a[^>]+href=[\"\']' + re.escape(url) + r'[\"\'][^>]*>.*?</a>)(?!\s*<a[^>]+>\[Offline\]</a>)')
        badge = f' <a href="offline_links/{local_filename}" target="_blank" style="font-size: 0.8em; color: var(--accent); text-decoration: none; border: 1px solid var(--border); padding: 2px 4px; border-radius: 4px; margin-left: 4px;">[Offline]</a>'
        html = pattern.sub(r'\1' + badge, html)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("Finished updating HTML with offline badges.")
