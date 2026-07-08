import os
import re
import glob
from bs4 import BeautifulSoup
from readability import Document

html_path = 'blueprints-complete.html'
offline_dir = 'offline_links'

with open(html_path, 'r', encoding='utf-8') as f:
    full_html = f.read()

files = glob.glob(os.path.join(offline_dir, '*.html'))

new_lessons_js = ""

print(f"Extracting knowledge from {len(files)} files...")

for file in files:
    filename = os.path.basename(file)
    url_hash = filename.replace('.html', '')
    lesson_id = f"ext-{url_hash}"
    
    with open(file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        
    try:
        doc = Document(content)
        title = doc.title()
        summary_html = doc.summary()
        
        # Clean up the summary HTML using BeautifulSoup
        soup = BeautifulSoup(summary_html, 'html.parser')
        
        # Remove empty tags, scripts, styles
        for tag in soup(['script', 'style', 'iframe', 'object', 'embed', 'form', 'nav', 'footer', 'header', 'aside']):
            tag.decompose()
            
        # Extract text but keep basic formatting like p, h1-h6, ul, ol, li, strong, em, code, pre
        # Actually, since it's an offline guide, rendering the clean HTML directly is better than pure text.
        # But we must escape backticks ` and dollar signs ${
        clean_html = str(soup)
        
        # In case readability failed and returned nothing
        if len(soup.text.strip()) < 50:
            clean_html = "<p><i>Content could not be automatically extracted from this page.</i></p>"
            
    except Exception as e:
        print(f"Failed to extract {filename}: {e}")
        title = "External Resource"
        clean_html = "<p><i>Content could not be automatically extracted from this page.</i></p>"

    # Format title safely
    nav_title = title[:30] + '...' if len(title) > 30 else title
    safe_title = title.replace("'", "\\'").replace("\n", " ").replace('`', '')
    safe_nav = nav_title.replace("'", "\\'").replace("\n", " ")
    
    # Escape backticks and slash for template literals
    escaped_html = clean_html.replace('\\', '\\\\').replace('`', '\\`').replace('$', '&#36;').replace('</script>', '</scr"+"ipt>')
    
    final_html = f"""
<p class="eyebrow">External Knowledge Base</p>
<h1>{safe_title}</h1>
<div class="deep-divider">Extracted Article</div>
<div class="lesson">
{escaped_html}
</div>
"""
    
    new_lessons_js += f"""
{{
    id: '{lesson_id}',
    group: 'External Resources',
    title: '{safe_title}',
    nav: '{safe_nav}',
    html: `{final_html}`
}},
"""

# Now, inject `new_lessons_js` into the LESSONS array in blueprints-complete.html
pattern = r"(\}?,?\n*)(\];\n+/\* ---------------- renderer ---------------- \*/)"
def replacer(match):
    prefix = match.group(1).rstrip()
    if prefix.endswith('}'):
        prefix += ','
    return prefix + '\n' + new_lessons_js + '\n' + match.group(2)

new_html, count = re.subn(pattern, replacer, full_html, flags=re.DOTALL)
if count == 0:
    print("FAILED to inject new lessons. Regex did not match.")

# Now, rewrite the external links inside the lessons
def replace_link(match):
    url_hash = match.group(1)
    text = match.group(2)
    return f'<a href="#" onclick="goExternal(\'ext-{url_hash}\'); return false;">{text}</a>'

new_html = re.sub(r'<a[^>]+href=[\"\']offline_links/([a-f0-9]+)\.html[\"\'][^>]*>(.*?)</a>', replace_link, new_html, flags=re.IGNORECASE)

# Now, update the Javascript Router logic.
# 1. Add `const historyStack = [];` and `goExternal(id)` and `goBack()`
router_injection = """
const historyStack = [];

function goExternal(id) {
  historyStack.push(currentId);
  renderLesson(id);
  document.getElementById('sidebar').classList.remove('open');
}

function goBack() {
  if (historyStack.length > 0) {
    const prevId = historyStack.pop();
    renderLesson(prevId);
  }
}
"""

# Insert right after `/* ---------------- renderer ---------------- */\nconst doneSet = new Set();\nlet currentId = LESSONS[0].id;\n`
router_pattern = r"(/\* ---------------- renderer ---------------- \*/\nconst doneSet = new Set\(\);\nlet currentId = LESSONS\[0\]\.id;\n)"
new_html = re.sub(router_pattern, r'\1' + router_injection, new_html)

# 2. Add Back Button to `renderLesson(id)`
old_str = "main.innerHTML = '<article class=\"lesson\">' + l.html + renderQuiz(l) +"
new_str = "main.innerHTML = '<article class=\"lesson\">' + (l.group === 'External Resources' ? '<button onclick=\"goBack()\" class=\"back-btn\">\\u2190 Back to Lesson</button>' : '') + l.html + renderQuiz(l) +"
new_html = new_html.replace(old_str, new_str)

# Add CSS for back button
css_injection = """
.back-btn {
  background: transparent; border: 1px solid var(--border); color: var(--text-muted);
  padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-bottom: 2rem;
  font-family: inherit; font-size: 0.9em; transition: all 0.2s;
}
.back-btn:hover { background: var(--bg-hover); color: var(--text); }
"""
new_html = re.sub(r'(</style>)', css_injection + r'\1', new_html)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(new_html)

print("Ingestion complete!")
