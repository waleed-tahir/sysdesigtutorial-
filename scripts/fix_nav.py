import re

with open('blueprints-complete.html', 'r', encoding='utf-8') as f:
    html = f.read()

replacements = {
    r"id:\s*'twitter',\s*group:\s*'Interview prep \(Deep dives\)',\s*title:\s*'Design the Twitter timeline and search',\s*nav:\s*'the',": "id: 'twitter', group: 'Interview prep (Deep dives)', title: 'Design the Twitter timeline and search', nav: 'Twitter timeline',",
    r"id:\s*'web-crawler',\s*group:\s*'Interview prep \(Deep dives\)',\s*title:\s*'Design a web crawler',\s*nav:\s*'a',": "id: 'web-crawler', group: 'Interview prep (Deep dives)', title: 'Design a web crawler', nav: 'Web crawler',",
    r"id:\s*'social-graph',\s*group:\s*'Interview prep \(Deep dives\)',\s*title:\s*'Design the data structures for a social network',\s*nav:\s*'the',": "id: 'social-graph', group: 'Interview prep (Deep dives)', title: 'Design the data structures for a social network', nav: 'Social network',",
    r"id:\s*'query-cache',\s*group:\s*'Interview prep \(Deep dives\)',\s*title:\s*'Design a key-value store for a search engine',\s*nav:\s*'a',": "id: 'query-cache', group: 'Interview prep (Deep dives)', title: 'Design a key-value store for a search engine', nav: 'Key-value store',",
    r"id:\s*'sales-rank',\s*group:\s*'Interview prep \(Deep dives\)',\s*title:\s*'Design Amazon\\'s sales ranking by category feature',\s*nav:\s*'Amazon\\'s',": "id: 'sales-rank', group: 'Interview prep (Deep dives)', title: 'Design Amazon\\'s sales ranking by category feature', nav: 'Amazon Sales Rank',",
    r"id:\s*'sales-rank',\s*group:\s*'Interview prep \(Deep dives\)',\s*title:\s*'Design Amazon\\'s sales ranking by category feature',\s*nav:\s*\"Amazon\\'s\",": "id: 'sales-rank', group: 'Interview prep (Deep dives)', title: 'Design Amazon\\'s sales ranking by category feature', nav: 'Amazon Sales Rank',",
    r"id:\s*'scaling-aws',\s*group:\s*'Interview prep \(Deep dives\)',\s*title:\s*'Design a system that scales to millions of users on AWS',\s*nav:\s*'a',": "id: 'scaling-aws', group: 'Interview prep (Deep dives)', title: 'Design a system that scales to millions of users on AWS', nav: 'AWS scale',"
}

# The sales-rank title might have double quotes around nav now, because I fixed it with fix_syntax.py to: nav: "Amazon's"
# Wait, my fix_syntax.py also changed title to double quotes if it had unescaped quotes!
# Let's just use regex for the id and replace the nav.

for old_id, new_nav in [
    ('twitter', 'Twitter timeline'),
    ('web-crawler', 'Web crawler'),
    ('social-graph', 'Social network'),
    ('query-cache', 'Key-value store'),
    ('sales-rank', 'Amazon Sales Rank'),
    ('scaling-aws', 'AWS scale')
]:
    pattern = r"(id:\s*'" + old_id + r"'.*?nav:\s*)(['\"].*?['\"])(,)"
    def replacer(match):
        return match.group(1) + f"'{new_nav}'" + match.group(3)
    html = re.sub(pattern, replacer, html)

with open('blueprints-complete.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Fixed navigation headings.")
