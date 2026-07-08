import os
import re
import urllib.request

html_path = 'blueprints-complete.html'
images_dir = 'images'

with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Find all relative images
matches = set(re.findall(r'<img[^>]+src=[\"\']images/([^\"\']+)[\"\']', html, re.IGNORECASE))

missing = []
for filename in matches:
    local_path = os.path.join(images_dir, filename)
    if not os.path.exists(local_path):
        missing.append(filename)

print(f"Found {len(missing)} missing images.")

def download_image(url, local_path):
    try:
        # Use a real user-agent to bypass basic blocks
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'})
        with urllib.request.urlopen(req, timeout=10) as response, open(local_path, 'wb') as out_file:
            out_file.write(response.read())
        return True
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return False

for filename in missing:
    local_path = os.path.join(images_dir, filename)
    
    # Try imgur URL formats
    url1 = f"http://i.imgur.com/{filename}"
    url2 = f"https://i.imgur.com/{filename}"
    url3 = f"https://raw.githubusercontent.com/donnemartin/system-design-primer/master/images/{filename}"
    
    print(f"Downloading {filename}...")
    if download_image(url1, local_path):
        print(" Success via url1")
    elif download_image(url2, local_path):
        print(" Success via url2")
    elif download_image(url3, local_path):
        print(" Success via url3")
    else:
        print(f" completely failed to download {filename}")

print("Done fetching missing images.")
