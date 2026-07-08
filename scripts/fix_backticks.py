import re

with open('blueprints-complete.html', 'r', encoding='utf-8') as f:
    html = f.read()

# I want to find instances where the html string is missing its closing backtick before the quiz property.
# Wait, let's just make sure EVERY `quiz:` property is preceded by `\n` or `, ` etc, and we need to fix specifically the ones that look like:
# ```
# </ul>
# quiz:{q:
# ```
# Instead of:
# ```
# </ul>`,
# quiz:{q:
# ```

# Actually, the problem is my regex `(.*?)(?=\n\s*quiz:\s*\{)` consumed the backtick and comma because they were right before the `\nquiz:`.
# So `converted_html` was injected, and it doesn't end with a backtick and comma.

# Let's find all occurrences of `html: \`(.*?)\n\s*quiz: \{` where the `(.*?)\n` doesn't end with `` `, ``.
# Actually, an easier fix is to just replace `\nquiz:` with ``\n`,\nquiz:`` ONLY if the preceding character is not a comma!
# Wait, what if the preceding character is `}`, because `html: `...`` was the last property? (Not in this file, quiz is last).
# Let's just find `([^\`,])\n(\s*)quiz:\s*\{` and replace with `\1\`,\n\2quiz:{`

# Let's test the regex.
pattern = re.compile(r'([^\`,\s])\s*\n(\s*)quiz:\s*\{')
new_html, count = pattern.subn(r'\1`,\n\2quiz:{', html)

with open('blueprints-complete.html', 'w', encoding='utf-8') as f:
    f.write(new_html)

print(f"Fixed {count} missing backticks.")
