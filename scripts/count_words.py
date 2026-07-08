import os
import re

# 1. Count words in the original repo
# We will count words in the main README.md, and all README.md files in solutions/system_design and solutions/object_oriented_design
repo_path = 'system-design-primer'
target_files = [os.path.join(repo_path, 'README.md')]

solutions_sd = os.path.join(repo_path, 'solutions', 'system_design')
if os.path.exists(solutions_sd):
    for root, dirs, files in os.walk(solutions_sd):
        for file in files:
            if file == 'README.md':
                target_files.append(os.path.join(root, file))

# OOD questions are mostly ipynb files in the original repo, but let's see if there are readmes.
solutions_ood = os.path.join(repo_path, 'solutions', 'object_oriented_design')
if os.path.exists(solutions_ood):
    for root, dirs, files in os.walk(solutions_ood):
        for file in files:
            if file == 'README.md' or file.endswith('.ipynb'):
                target_files.append(os.path.join(root, file))

repo_word_count = 0
for filepath in target_files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            # Basic word count for markdown/ipynb
            # Strip code formatting if needed, but simple split is usually a good proxy
            words = content.split()
            repo_word_count += len(words)
    except Exception as e:
        print(f"Error reading {filepath}: {e}")

# 2. Count words in blueprints-complete.html
import bs4

with open('blueprints-complete.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# We only want the knowledge words, so we extract the javascript array LESSONS
# and parse the HTML inside it.
start = html_content.find('const LESSONS = [')
end = html_content.rfind('];\n\n/* ---------------- renderer ---------------- */')
if start == -1 or end == -1:
    # fallback
    end = html_content.rfind('];')

if start != -1 and end != -1:
    lessons_js = html_content[start:end+2]
    
    # Extract the html strings
    html_blocks = re.findall(r"html:\s*`(.*?)`", lessons_js, re.DOTALL)
    
    # Extract quizzes
    quiz_blocks = re.findall(r"quiz:\{(.*?)\}", lessons_js, re.DOTALL)
    
    # Extract ELI5
    eli5_blocks = re.findall(r"<div class=\"eli5\">(.*?)</div>", lessons_js, re.DOTALL)
    
    blueprints_word_count = 0
    
    for block in html_blocks:
        soup = bs4.BeautifulSoup(block, 'html.parser')
        text = soup.get_text(separator=' ')
        blueprints_word_count += len(text.split())
        
    for quiz in quiz_blocks:
        # Just strip quotes and count
        text = quiz.replace("'", " ").replace('"', " ")
        blueprints_word_count += len(text.split())
        
    # The eli5 blocks are actually inside the html blocks, so they are already counted!
    
else:
    # If regex failed, just parse the whole file minus scripts
    soup = bs4.BeautifulSoup(html_content, 'html.parser')
    for script in soup(["script", "style"]):
        script.extract()
    text = soup.get_text(separator=' ')
    blueprints_word_count = len(text.split())

print("--- Word Count Comparison ---")
print(f"Original System Design Primer Repo (English lessons & solutions): ~{repo_word_count:,} words")
print(f"Our Blueprints Curriculum (Knowledge content only): ~{blueprints_word_count:,} words")
