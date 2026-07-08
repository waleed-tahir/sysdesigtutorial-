import os
import re
import urllib.request
import shutil

html_path = 'blueprints-complete.html'
images_dir = 'images'

if not os.path.exists(images_dir):
    os.makedirs(images_dir)

with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Find all image sources
matches = set(re.findall(r'<img.*?src=[\"\'](.*?)[\"\']', html, re.IGNORECASE))

print(f"Found {len(matches)} unique image URLs.")

def download_image(url, local_path):
    try:
        # Add a user-agent to avoid 403s from some sites
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response, open(local_path, 'wb') as out_file:
            shutil.copyfileobj(response, out_file)
        return True
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return False

# We will replace URLs in the HTML string
for url in matches:
    # Get filename
    filename = url.split('/')[-1]
    
    # Clean filename of query params if any
    filename = filename.split('?')[0]
    
    local_path = os.path.join(images_dir, filename)
    local_src = f"images/{filename}"
    
    # If the image is from github raw or imgur, download it
    if url.startswith('http'):
        if not os.path.exists(local_path):
            print(f"Downloading {filename}...")
            success = download_image(url, local_path)
            if not success:
                # If download fails, maybe it exists in system-design-primer/images
                primer_img = os.path.join('system-design-primer', 'images', filename)
                if os.path.exists(primer_img):
                    print(f"Found {filename} locally in primer repo. Copying...")
                    shutil.copy(primer_img, local_path)
                    success = True
        else:
            success = True
            
        if success:
            # Replace the URL in HTML
            html = html.replace(url, local_src)
    else:
        # If it's already a local relative path, just make sure it's in images/
        # (Though we shouldn't have any right now, our script made them all https://raw...)
        pass

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("Finished downloading and relinking images.")
