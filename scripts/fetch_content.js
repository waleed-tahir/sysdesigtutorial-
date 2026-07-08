const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');
const marked = require('marked');

const baseUrl = "https://raw.githubusercontent.com/donnemartin/system-design-primer/master/solutions/system_design/";

const topics = [
  { id: 'pastebin', path: 'pastebin/README.md', title: 'Design Pastebin.com (or Bit.ly)' },
  { id: 'twitter', path: 'twitter/README.md', title: 'Design the Twitter timeline and search' },
  { id: 'web-crawler', path: 'web_crawler/README.md', title: 'Design a web crawler' },
  { id: 'mint', path: 'mint/README.md', title: 'Design Mint.com' },
  { id: 'social-graph', path: 'social_graph/README.md', title: 'Design the data structures for a social network' },
  { id: 'query-cache', path: 'query_cache/README.md', title: 'Design a key-value store for a search engine' },
  { id: 'sales-rank', path: 'sales_rank/README.md', title: "Design Amazon's sales ranking by category feature" },
  { id: 'scaling-aws', path: 'scaling_aws/README.md', title: "Design a system that scales to millions of users on AWS" }
];

function download(url) {
  return new Promise((resolve, reject) => {
    let data = '';
    https.get(url, (res) => {
      if (res.statusCode >= 300) {
        if (res.headers.location) {
          return download(res.headers.location).then(resolve).catch(reject);
        }
        reject(new Error(`Failed with status ${res.statusCode}`));
        return;
      }
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  let output = 'const NEW_LESSONS = [\n';
  
  for (const topic of topics) {
    console.log(`Downloading ${topic.id}...`);
    let markdown = await download(baseUrl + topic.path);
    
    // Convert to HTML
    let html = marked.parse(markdown);
    
    // Clean up HTML (escape backticks, etc)
    html = html.replace(/`/g, '\\`').replace(/\\$/g, '\\\\$');
    // Remove the Title h1 from markdown if it exists (so we don't double up)
    html = html.replace(/<h1[^>]*>.*?<\/h1>/i, '');
    
    output += `{
id: '${topic.id}', group: 'Interview prep (Deep dives)', title: '${topic.title.replace(/'/g, "\\'")}', nav: '${topic.nav || topic.title.split(' ')[1]}',
html: \`
<p class="eyebrow">Interview prep · Deep dive</p>
<h1>${topic.title}</h1>
<p class="lede">A deep dive into system architecture from the Primer.</p>

<div class="eli5"><span class="tag">In plain English</span>
<p>This is a placeholder for the plain English analogy. TO BE FILLED.</p>
</div>

<div class="deep-divider">The full picture</div>
<div class="lesson">
${html}
</div>
\`,
quiz:{q:'Placeholder question?', opts:['A', 'B', 'C', 'D'], a:0, why:'Placeholder answer.'}
},
`;
  }
  
  output += '];\n';
  fs.writeFileSync('new_lessons.js', output);
  console.log('Done! Generated new_lessons.js');
}

run().catch(console.error);
