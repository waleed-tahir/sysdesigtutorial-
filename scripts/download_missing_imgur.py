import os
import urllib.request
import re

images_dir = 'images'
html_path = 'blueprints-complete.html'

with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# All image tags currently look like `<img src="images/XYZ.png">` because of the previous script
# Wait, if download failed, did it still replace?
# Let's check the previous script:
# `if success: html = html.replace(url, local_src)`
# So if it failed, the HTML STILL has `https://raw.githubusercontent.com/.../images/XYZ.png`

matches = set(re.findall(r'<img.*?src=[\"\'](.*?)[\"\']', html, re.IGNORECASE))

def download_image(url, local_path):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req) as response, open(local_path, 'wb') as out_file:
            out_file.write(response.read())
        return True
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return False

for url in matches:
    if url.startswith('http'):
        filename = url.split('/')[-1]
        local_path = os.path.join(images_dir, filename)
        
        # If it's a raw github URL and we failed earlier, it means it's an imgur image!
        if not os.path.exists(local_path):
            print(f"Attempting to download from imgur: {filename}")
            imgur_url = f"http://i.imgur.com/{filename}"
            success = download_image(imgur_url, local_path)
            
            if success:
                html = html.replace(url, f"images/{filename}")

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("Finished fixing missing imgur downloads.")
