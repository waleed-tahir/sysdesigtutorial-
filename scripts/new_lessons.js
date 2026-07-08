const NEW_LESSONS = [
{
id: 'pastebin', group: 'Interview prep (Deep dives)', title: 'Design Pastebin.com (or Bit.ly)', nav: 'Pastebin.com',
html: `
<p class="eyebrow">Interview prep · Deep dive</p>
<h1>Design Pastebin.com (or Bit.ly)</h1>
<p class="lede">A deep dive into system architecture from the Primer.</p>

<div class="eli5"><span class="tag">In plain English</span>
<p>You have a giant book of sticky notes (the database). Someone hands you a page of text. You write a random 7-letter word on a sticky note, stick it to the text, and give them the word. When they bring the word back, you find the matching sticky note and hand them the text.</p>
</div>

<div class="deep-divider">The full picture</div>
<div class="lesson">

<p><em>Note: This document links directly to relevant areas found in the <a href="https://github.com/donnemartin/system-design-primer#index-of-system-design-topics">system design topics</a> to avoid duplication.  Refer to the linked content for general talking points, tradeoffs, and alternatives.</em></p>
<p><strong>Design Bit.ly</strong> - is a similar question, except pastebin requires storing the paste contents instead of the original unshortened url.</p>
<h2>Step 1: Outline use cases and constraints</h2>
<blockquote>
<p>Gather requirements and scope the problem.
Ask questions to clarify use cases and constraints.
Discuss assumptions.</p>
</blockquote>
<p>Without an interviewer to address clarifying questions, we&#39;ll define some use cases and constraints.</p>
<h3>Use cases</h3>
<h4>We&#39;ll scope the problem to handle only the following use cases</h4>
<ul>
<li><strong>User</strong> enters a block of text and gets a randomly generated link<ul>
<li>Expiration<ul>
<li>Default setting does not expire</li>
<li>Can optionally set a timed expiration</li>
</ul>
</li>
</ul>
</li>
<li><strong>User</strong> enters a paste&#39;s url and views the contents</li>
<li><strong>User</strong> is anonymous</li>
<li><strong>Service</strong> tracks analytics of pages<ul>
<li>Monthly visit stats</li>
</ul>
</li>
<li><strong>Service</strong> deletes expired pastes</li>
<li><strong>Service</strong> has high availability</li>
</ul>
<h4>Out of scope</h4>
<ul>
<li><strong>User</strong> registers for an account<ul>
<li><strong>User</strong> verifies email</li>
</ul>
</li>
<li><strong>User</strong> logs into a registered account<ul>
<li><strong>User</strong> edits the document</li>
</ul>
</li>
<li><strong>User</strong> can set visibility</li>
<li><strong>User</strong> can set the shortlink</li>
</ul>
<h3>Constraints and assumptions</h3>
<h4>State assumptions</h4>
<ul>
<li>Traffic is not evenly distributed</li>
<li>Following a short link should be fast</li>
<li>Pastes are text only</li>
<li>Page view analytics do not need to be realtime</li>
<li>10 million users</li>
<li>10 million paste writes per month</li>
<li>100 million paste reads per month</li>
<li>10:1 read to write ratio</li>
</ul>
<h4>Calculate usage</h4>
<p><strong>Clarify with your interviewer if you should run back-of-the-envelope usage calculations.</strong></p>
<ul>
<li>Size per paste<ul>
<li>1 KB content per paste</li>
<li><code>shortlink</code> - 7 bytes</li>
<li><code>expiration_length_in_minutes</code> - 4 bytes</li>
<li><code>created_at</code> - 5 bytes</li>
<li><code>paste_path</code> - 255 bytes</li>
<li>total = ~1.27 KB</li>
</ul>
</li>
<li>12.7 GB of new paste content per month<ul>
<li>1.27 KB per paste * 10 million pastes per month</li>
<li>~450 GB of new paste content in 3 years</li>
<li>360 million shortlinks in 3 years</li>
<li>Assume most are new pastes instead of updates to existing ones</li>
</ul>
</li>
<li>4 paste writes per second on average</li>
<li>40 read requests per second on average</li>
</ul>
<p>Handy conversion guide:</p>
<ul>
<li>2.5 million seconds per month</li>
<li>1 request per second = 2.5 million requests per month</li>
<li>40 requests per second = 100 million requests per month</li>
<li>400 requests per second = 1 billion requests per month</li>
</ul>
<h2>Step 2: Create a high level design</h2>
<blockquote>
<p>Outline a high level design with all important components.</p>
</blockquote>
<p><img src="http://i.imgur.com/BKsBnmG.png" alt="Imgur"></p>
<h2>Step 3: Design core components</h2>
<blockquote>
<p>Dive into details for each core component.</p>
</blockquote>
<h3>Use case: User enters a block of text and gets a randomly generated link</h3>
<p>We could use a <a href="https://github.com/donnemartin/system-design-primer#relational-database-management-system-rdbms">relational database</a> as a large hash table, mapping the generated url to a file server and path containing the paste file.</p>
<p>Instead of managing a file server, we could use a managed <strong>Object Store</strong> such as Amazon S3 or a <a href="https://github.com/donnemartin/system-design-primer#document-store">NoSQL document store</a>.</p>
<p>An alternative to a relational database acting as a large hash table, we could use a <a href="https://github.com/donnemartin/system-design-primer#key-value-store">NoSQL key-value store</a>.  We should discuss the <a href="https://github.com/donnemartin/system-design-primer#sql-or-nosql">tradeoffs between choosing SQL or NoSQL</a>.  The following discussion uses the relational database approach.</p>
<ul>
<li>The <strong>Client</strong> sends a create paste request to the <strong>Web Server</strong>, running as a <a href="https://github.com/donnemartin/system-design-primer#reverse-proxy-web-server">reverse proxy</a></li>
<li>The <strong>Web Server</strong> forwards the request to the <strong>Write API</strong> server</li>
<li>The <strong>Write API</strong> server does the following:<ul>
<li>Generates a unique url<ul>
<li>Checks if the url is unique by looking at the <strong>SQL Database</strong> for a duplicate</li>
<li>If the url is not unique, it generates another url</li>
<li>If we supported a custom url, we could use the user-supplied (also check for a duplicate)</li>
</ul>
</li>
<li>Saves to the <strong>SQL Database</strong> <code>pastes</code> table</li>
<li>Saves the paste data to the <strong>Object Store</strong></li>
<li>Returns the url</li>
</ul>
</li>
</ul>
<p><strong>Clarify with your interviewer how much code you are expected to write</strong>.</p>
<p>The <code>pastes</code> table could have the following structure:</p>
<pre><code>shortlink char(7) NOT NULL
expiration_length_in_minutes int NOT NULL
created_at datetime NOT NULL
paste_path varchar(255) NOT NULL
PRIMARY KEY(shortlink)
</code></pre>
<p>Setting the primary key to be based on the <code>shortlink</code> column creates an <a href="https://github.com/donnemartin/system-design-primer#use-good-indices">index</a> that the database uses to enforce uniqueness. We&#39;ll create an additional index on <code>created_at</code> to speed up lookups (log-time instead of scanning the entire table) and to keep the data in memory.  Reading 1 MB sequentially from memory takes about 250 microseconds, while reading from SSD takes 4x and from disk takes 80x longer.<sup><a href=https://github.com/donnemartin/system-design-primer#latency-numbers-every-programmer-should-know>1</a></sup></p>
<p>To generate the unique url, we could:</p>
<ul>
<li>Take the <a href="https://en.wikipedia.org/wiki/MD5"><strong>MD5</strong></a> hash of the user&#39;s ip_address + timestamp<ul>
<li>MD5 is a widely used hashing function that produces a 128-bit hash value</li>
<li>MD5 is uniformly distributed</li>
<li>Alternatively, we could also take the MD5 hash of randomly-generated data</li>
</ul>
</li>
<li><a href="https://www.kerstner.at/2012/07/shortening-strings-using-base-62-encoding/"><strong>Base 62</strong></a> encode the MD5 hash<ul>
<li>Base 62 encodes to <code>[a-zA-Z0-9]</code> which works well for urls, eliminating the need for escaping special characters</li>
<li>There is only one hash result for the original input and Base 62 is deterministic (no randomness involved)</li>
<li>Base 64 is another popular encoding but provides issues for urls because of the additional <code>+</code> and <code>/</code> characters</li>
<li>The following <a href="http://stackoverflow.com/questions/742013/how-to-code-a-url-shortener">Base 62 pseudocode</a> runs in O(k) time where k is the number of digits = 7:</li>
</ul>
</li>
</ul>
<pre><code class="language-python">def base_encode(num, base=62):
    digits = []
    while num &gt; 0
      remainder = modulo(num, base)
      digits.push(remainder)
      num = divide(num, base)
    digits = digits.reverse
</code></pre>
<ul>
<li>Take the first 7 characters of the output, which results in 62^7 possible values and should be sufficient to handle our constraint of 360 million shortlinks in 3 years:</li>
</ul>
<pre><code class="language-python">url = base_encode(md5(ip_address+timestamp))[:URL_LENGTH]
</code></pre>
<p>We&#39;ll use a public <a href="https://github.com/donnemartin/system-design-primer#representational-state-transfer-rest"><strong>REST API</strong></a>:</p>
<pre><code>$ curl -X POST --data &#39;{ &quot;expiration_length_in_minutes&quot;: &quot;60&quot;, \
    &quot;paste_contents&quot;: &quot;Hello World!&quot; }&#39; https://pastebin.com/api/v1/paste
</code></pre>
<p>Response:</p>
<pre><code>{
    &quot;shortlink&quot;: &quot;foobar&quot;
}
</code></pre>
<p>For internal communications, we could use <a href="https://github.com/donnemartin/system-design-primer#remote-procedure-call-rpc">Remote Procedure Calls</a>.</p>
<h3>Use case: User enters a paste&#39;s url and views the contents</h3>
<ul>
<li>The <strong>Client</strong> sends a get paste request to the <strong>Web Server</strong></li>
<li>The <strong>Web Server</strong> forwards the request to the <strong>Read API</strong> server</li>
<li>The <strong>Read API</strong> server does the following:<ul>
<li>Checks the <strong>SQL Database</strong> for the generated url<ul>
<li>If the url is in the <strong>SQL Database</strong>, fetch the paste contents from the <strong>Object Store</strong></li>
<li>Else, return an error message for the user</li>
</ul>
</li>
</ul>
</li>
</ul>
<p>REST API:</p>
<pre><code>$ curl https://pastebin.com/api/v1/paste?shortlink=foobar
</code></pre>
<p>Response:</p>
<pre><code>{
    &quot;paste_contents&quot;: &quot;Hello World&quot;
    &quot;created_at&quot;: &quot;YYYY-MM-DD HH:MM:SS&quot;
    &quot;expiration_length_in_minutes&quot;: &quot;60&quot;
}
</code></pre>
<h3>Use case: Service tracks analytics of pages</h3>
<p>Since realtime analytics are not a requirement, we could simply <strong>MapReduce</strong> the <strong>Web Server</strong> logs to generate hit counts.</p>
<p><strong>Clarify with your interviewer how much code you are expected to write</strong>.</p>
<pre><code class="language-python">class HitCounts(MRJob):

    def extract_url(self, line):
        &quot;&quot;&quot;Extract the generated url from the log line.&quot;&quot;&quot;
        ...

    def extract_year_month(self, line):
        &quot;&quot;&quot;Return the year and month portions of the timestamp.&quot;&quot;&quot;
        ...

    def mapper(self, _, line):
        &quot;&quot;&quot;Parse each log line, extract and transform relevant lines.

        Emit key value pairs of the form:

        (2016-01, url0), 1
        (2016-01, url0), 1
        (2016-01, url1), 1
        &quot;&quot;&quot;
        url = self.extract_url(line)
        period = self.extract_year_month(line)
        yield (period, url), 1

    def reducer(self, key, values):
        &quot;&quot;&quot;Sum values for each key.

        (2016-01, url0), 2
        (2016-01, url1), 1
        &quot;&quot;&quot;
        yield key, sum(values)
</code></pre>
<h3>Use case: Service deletes expired pastes</h3>
<p>To delete expired pastes, we could just scan the <strong>SQL Database</strong> for all entries whose expiration timestamp are older than the current timestamp.  All expired entries would then be deleted (or  marked as expired) from the table.</p>
<h2>Step 4: Scale the design</h2>
<blockquote>
<p>Identify and address bottlenecks, given the constraints.</p>
</blockquote>
<p><img src="http://i.imgur.com/4edXG0T.png" alt="Imgur"></p>
<p><strong>Important: Do not simply jump right into the final design from the initial design!</strong></p>
<p>State you would do this iteratively: 1) <strong>Benchmark/Load Test</strong>, 2) <strong>Profile</strong> for bottlenecks 3) address bottlenecks while evaluating alternatives and trade-offs, and 4) repeat.  See <a href="../scaling_aws/README.md">Design a system that scales to millions of users on AWS</a> as a sample on how to iteratively scale the initial design.</p>
<p>It&#39;s important to discuss what bottlenecks you might encounter with the initial design and how you might address each of them.  For example, what issues are addressed by adding a <strong>Load Balancer</strong> with multiple <strong>Web Servers</strong>?  <strong>CDN</strong>?  <strong>Master-Slave Replicas</strong>?  What are the alternatives and <strong>Trade-Offs</strong> for each?</p>
<p>We&#39;ll introduce some components to complete the design and to address scalability issues.  Internal load balancers are not shown to reduce clutter.</p>
<p><em>To avoid repeating discussions</em>, refer to the following <a href="https://github.com/donnemartin/system-design-primer#index-of-system-design-topics">system design topics</a> for main talking points, tradeoffs, and alternatives:</p>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#domain-name-system">DNS</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#content-delivery-network">CDN</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#load-balancer">Load balancer</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#horizontal-scaling">Horizontal scaling</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#reverse-proxy-web-server">Web server (reverse proxy)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#application-layer">API server (application layer)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#cache">Cache</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#relational-database-management-system-rdbms">Relational database management system (RDBMS)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#fail-over">SQL write master-slave failover</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#master-slave-replication">Master-slave replication</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#consistency-patterns">Consistency patterns</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#availability-patterns">Availability patterns</a></li>
</ul>
<p>The <strong>Analytics Database</strong> could use a data warehousing solution such as Amazon Redshift or Google BigQuery.</p>
<p>An <strong>Object Store</strong> such as Amazon S3 can comfortably handle the constraint of 12.7 GB of new content per month.</p>
<p>To address the 40 <em>average</em> read requests per second (higher at peak), traffic for popular content should be handled by the <strong>Memory Cache</strong> instead of the database.  The <strong>Memory Cache</strong> is also useful for handling the unevenly distributed traffic and traffic spikes.  The <strong>SQL Read Replicas</strong> should be able to handle the cache misses, as long as the replicas are not bogged down with replicating writes.</p>
<p>4 <em>average</em> paste writes per second (with higher at peak) should be do-able for a single <strong>SQL Write Master-Slave</strong>.  Otherwise, we&#39;ll need to employ additional SQL scaling patterns:</p>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#federation">Federation</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sharding">Sharding</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#denormalization">Denormalization</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sql-tuning">SQL Tuning</a></li>
</ul>
<p>We should also consider moving some data to a <strong>NoSQL Database</strong>.</p>
<h2>Additional talking points</h2>
<blockquote>
<p>Additional topics to dive into, depending on the problem scope and time remaining.</p>
</blockquote>
<h4>NoSQL</h4>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#key-value-store">Key-value store</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#document-store">Document store</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#wide-column-store">Wide column store</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#graph-database">Graph database</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sql-or-nosql">SQL vs NoSQL</a></li>
</ul>
<h3>Caching</h3>
<ul>
<li>Where to cache<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#client-caching">Client caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#cdn-caching">CDN caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#web-server-caching">Web server caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#database-caching">Database caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#application-caching">Application caching</a></li>
</ul>
</li>
<li>What to cache<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#caching-at-the-database-query-level">Caching at the database query level</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#caching-at-the-object-level">Caching at the object level</a></li>
</ul>
</li>
<li>When to update the cache<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#cache-aside">Cache-aside</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#write-through">Write-through</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#write-behind-write-back">Write-behind (write-back)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#refresh-ahead">Refresh ahead</a></li>
</ul>
</li>
</ul>
<h3>Asynchronism and microservices</h3>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#message-queues">Message queues</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#task-queues">Task queues</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#back-pressure">Back pressure</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#microservices">Microservices</a></li>
</ul>
<h3>Communications</h3>
<ul>
<li>Discuss tradeoffs:<ul>
<li>External communication with clients - <a href="https://github.com/donnemartin/system-design-primer#representational-state-transfer-rest">HTTP APIs following REST</a></li>
<li>Internal communications - <a href="https://github.com/donnemartin/system-design-primer#remote-procedure-call-rpc">RPC</a></li>
</ul>
</li>
<li><a href="https://github.com/donnemartin/system-design-primer#service-discovery">Service discovery</a></li>
</ul>
<h3>Security</h3>
<p>Refer to the <a href="https://github.com/donnemartin/system-design-primer#security">security section</a>.</p>
<h3>Latency numbers</h3>
<p>See <a href="https://github.com/donnemartin/system-design-primer#latency-numbers-every-programmer-should-know">Latency numbers every programmer should know</a>.</p>
<h3>Ongoing</h3>
<ul>
<li>Continue benchmarking and monitoring your system to address bottlenecks as they come up</li>
<li>Scaling is an iterative process</li>
</ul>

</div>
`,
quiz:{q:'To generate a unique 7-character shortlink, which approach avoids database collision retries entirely?', opts:['Base62 encoding an MD5 hash of the user IP and timestamp', 'Using a random number generator', 'Encoding the auto-incrementing database ID using Base62', 'Using a UUID'], a:2, why:'Encoding an auto-incrementing ID directly to Base62 guarantees uniqueness without random collisions, saving database queries. Hashing IP+timestamp works but still has a theoretical collision chance.'}
},
{
id: 'twitter', group: 'Interview prep (Deep dives)', title: 'Design the Twitter timeline and search', nav: 'the',
html: `
<p class="eyebrow">Interview prep · Deep dive</p>
<h1>Design the Twitter timeline and search</h1>
<p class="lede">A deep dive into system architecture from the Primer.</p>

<div class="eli5"><span class="tag">In plain English</span>
<p>A town crier (Twitter) usually shouts news so everyone hears it. But if millions of people are shouting at once, the crier just gives you a custom newspaper every morning. When someone you follow shouts, the crier slips a copy into your newspaper stack (fanout-on-write). But if a massive celebrity shouts, copying their shout 50 million times takes too long, so the crier just leaves one copy on a bulletin board and tells you to look at it when you open your paper (fanout-on-load).</p>
</div>

<div class="deep-divider">The full picture</div>
<div class="lesson">

<p><em>Note: This document links directly to relevant areas found in the <a href="https://github.com/donnemartin/system-design-primer#index-of-system-design-topics">system design topics</a> to avoid duplication.  Refer to the linked content for general talking points, tradeoffs, and alternatives.</em></p>
<p><strong>Design the Facebook feed</strong> and <strong>Design Facebook search</strong> are similar questions.</p>
<h2>Step 1: Outline use cases and constraints</h2>
<blockquote>
<p>Gather requirements and scope the problem.
Ask questions to clarify use cases and constraints.
Discuss assumptions.</p>
</blockquote>
<p>Without an interviewer to address clarifying questions, we&#39;ll define some use cases and constraints.</p>
<h3>Use cases</h3>
<h4>We&#39;ll scope the problem to handle only the following use cases</h4>
<ul>
<li><strong>User</strong> posts a tweet<ul>
<li><strong>Service</strong> pushes tweets to followers, sending push notifications and emails</li>
</ul>
</li>
<li><strong>User</strong> views the user timeline (activity from the user)</li>
<li><strong>User</strong> views the home timeline (activity from people the user is following)</li>
<li><strong>User</strong> searches keywords</li>
<li><strong>Service</strong> has high availability</li>
</ul>
<h4>Out of scope</h4>
<ul>
<li><strong>Service</strong> pushes tweets to the Twitter Firehose and other streams</li>
<li><strong>Service</strong> strips out tweets based on users&#39; visibility settings<ul>
<li>Hide @reply if the user is not also following the person being replied to</li>
<li>Respect &#39;hide retweets&#39; setting</li>
</ul>
</li>
<li>Analytics</li>
</ul>
<h3>Constraints and assumptions</h3>
<h4>State assumptions</h4>
<p>General</p>
<ul>
<li>Traffic is not evenly distributed</li>
<li>Posting a tweet should be fast<ul>
<li>Fanning out a tweet to all of your followers should be fast, unless you have millions of followers</li>
</ul>
</li>
<li>100 million active users</li>
<li>500 million tweets per day or 15 billion tweets per month<ul>
<li>Each tweet averages a fanout of 10 deliveries</li>
<li>5 billion total tweets delivered on fanout per day</li>
<li>150 billion tweets delivered on fanout per month</li>
</ul>
</li>
<li>250 billion read requests per month</li>
<li>10 billion searches per month</li>
</ul>
<p>Timeline</p>
<ul>
<li>Viewing the timeline should be fast</li>
<li>Twitter is more read heavy than write heavy<ul>
<li>Optimize for fast reads of tweets</li>
</ul>
</li>
<li>Ingesting tweets is write heavy</li>
</ul>
<p>Search</p>
<ul>
<li>Searching should be fast</li>
<li>Search is read-heavy</li>
</ul>
<h4>Calculate usage</h4>
<p><strong>Clarify with your interviewer if you should run back-of-the-envelope usage calculations.</strong></p>
<ul>
<li>Size per tweet:<ul>
<li><code>tweet_id</code> - 8 bytes</li>
<li><code>user_id</code> - 32 bytes</li>
<li><code>text</code> - 140 bytes</li>
<li><code>media</code> - 10 KB average</li>
<li>Total: ~10 KB</li>
</ul>
</li>
<li>150 TB of new tweet content per month<ul>
<li>10 KB per tweet * 500 million tweets per day * 30 days per month</li>
<li>5.4 PB of new tweet content in 3 years</li>
</ul>
</li>
<li>100 thousand read requests per second<ul>
<li>250 billion read requests per month * (400 requests per second / 1 billion requests per month)</li>
</ul>
</li>
<li>6,000 tweets per second<ul>
<li>15 billion tweets per month * (400 requests per second / 1 billion requests per month)</li>
</ul>
</li>
<li>60 thousand tweets delivered on fanout per second<ul>
<li>150 billion tweets delivered on fanout per month * (400 requests per second / 1 billion requests per month)</li>
</ul>
</li>
<li>4,000 search requests per second<ul>
<li>10 billion searches per month * (400 requests per second / 1 billion requests per month)</li>
</ul>
</li>
</ul>
<p>Handy conversion guide:</p>
<ul>
<li>2.5 million seconds per month</li>
<li>1 request per second = 2.5 million requests per month</li>
<li>40 requests per second = 100 million requests per month</li>
<li>400 requests per second = 1 billion requests per month</li>
</ul>
<h2>Step 2: Create a high level design</h2>
<blockquote>
<p>Outline a high level design with all important components.</p>
</blockquote>
<p><img src="http://i.imgur.com/48tEA2j.png" alt="Imgur"></p>
<h2>Step 3: Design core components</h2>
<blockquote>
<p>Dive into details for each core component.</p>
</blockquote>
<h3>Use case: User posts a tweet</h3>
<p>We could store the user&#39;s own tweets to populate the user timeline (activity from the user) in a <a href="https://github.com/donnemartin/system-design-primer#relational-database-management-system-rdbms">relational database</a>.  We should discuss the <a href="https://github.com/donnemartin/system-design-primer#sql-or-nosql">use cases and tradeoffs between choosing SQL or NoSQL</a>.</p>
<p>Delivering tweets and building the home timeline (activity from people the user is following) is trickier.  Fanning out tweets to all followers (60 thousand tweets delivered on fanout per second) will overload a traditional <a href="https://github.com/donnemartin/system-design-primer#relational-database-management-system-rdbms">relational database</a>.  We&#39;ll probably want to choose a data store with fast writes such as a <strong>NoSQL database</strong> or <strong>Memory Cache</strong>.  Reading 1 MB sequentially from memory takes about 250 microseconds, while reading from SSD takes 4x and from disk takes 80x longer.<sup><a href=https://github.com/donnemartin/system-design-primer#latency-numbers-every-programmer-should-know>1</a></sup></p>
<p>We could store media such as photos or videos on an <strong>Object Store</strong>.</p>
<ul>
<li>The <strong>Client</strong> posts a tweet to the <strong>Web Server</strong>, running as a <a href="https://github.com/donnemartin/system-design-primer#reverse-proxy-web-server">reverse proxy</a></li>
<li>The <strong>Web Server</strong> forwards the request to the <strong>Write API</strong> server</li>
<li>The <strong>Write API</strong> stores the tweet in the user&#39;s timeline on a <strong>SQL database</strong></li>
<li>The <strong>Write API</strong> contacts the <strong>Fan Out Service</strong>, which does the following:<ul>
<li>Queries the <strong>User Graph Service</strong> to find the user&#39;s followers stored in the <strong>Memory Cache</strong></li>
<li>Stores the tweet in the <em>home timeline of the user&#39;s followers</em> in a <strong>Memory Cache</strong><ul>
<li>O(n) operation:  1,000 followers = 1,000 lookups and inserts</li>
</ul>
</li>
<li>Stores the tweet in the <strong>Search Index Service</strong> to enable fast searching</li>
<li>Stores media in the <strong>Object Store</strong></li>
<li>Uses the <strong>Notification Service</strong> to send out push notifications to followers:<ul>
<li>Uses a <strong>Queue</strong> (not pictured) to asynchronously send out notifications</li>
</ul>
</li>
</ul>
</li>
</ul>
<p><strong>Clarify with your interviewer how much code you are expected to write</strong>.</p>
<p>If our <strong>Memory Cache</strong> is Redis, we could use a native Redis list with the following structure:</p>
<pre><code>           tweet n+2                   tweet n+1                   tweet n
| 8 bytes   8 bytes  1 byte | 8 bytes   8 bytes  1 byte | 8 bytes   8 bytes  1 byte |
| tweet_id  user_id  meta   | tweet_id  user_id  meta   | tweet_id  user_id  meta   |
</code></pre>
<p>The new tweet would be placed in the <strong>Memory Cache</strong>, which populates the user&#39;s home timeline (activity from people the user is following).</p>
<p>We&#39;ll use a public <a href="https://github.com/donnemartin/system-design-primer#representational-state-transfer-rest"><strong>REST API</strong></a>:</p>
<pre><code>$ curl -X POST --data &#39;{ &quot;user_id&quot;: &quot;123&quot;, &quot;auth_token&quot;: &quot;ABC123&quot;, \
    &quot;status&quot;: &quot;hello world!&quot;, &quot;media_ids&quot;: &quot;ABC987&quot; }&#39; \
    https://twitter.com/api/v1/tweet
</code></pre>
<p>Response:</p>
<pre><code>{
    &quot;created_at&quot;: &quot;Wed Sep 05 00:37:15 +0000 2012&quot;,
    &quot;status&quot;: &quot;hello world!&quot;,
    &quot;tweet_id&quot;: &quot;987&quot;,
    &quot;user_id&quot;: &quot;123&quot;,
    ...
}
</code></pre>
<p>For internal communications, we could use <a href="https://github.com/donnemartin/system-design-primer#remote-procedure-call-rpc">Remote Procedure Calls</a>.</p>
<h3>Use case: User views the home timeline</h3>
<ul>
<li>The <strong>Client</strong> posts a home timeline request to the <strong>Web Server</strong></li>
<li>The <strong>Web Server</strong> forwards the request to the <strong>Read API</strong> server</li>
<li>The <strong>Read API</strong> server contacts the <strong>Timeline Service</strong>, which does the following:<ul>
<li>Gets the timeline data stored in the <strong>Memory Cache</strong>, containing tweet ids and user ids - O(1)</li>
<li>Queries the <strong>Tweet Info Service</strong> with a <a href="http://redis.io/commands/mget">multiget</a> to obtain additional info about the tweet ids - O(n)</li>
<li>Queries the <strong>User Info Service</strong> with a multiget to obtain additional info about the user ids - O(n)</li>
</ul>
</li>
</ul>
<p>REST API:</p>
<pre><code>$ curl https://twitter.com/api/v1/home_timeline?user_id=123
</code></pre>
<p>Response:</p>
<pre><code>{
    &quot;user_id&quot;: &quot;456&quot;,
    &quot;tweet_id&quot;: &quot;123&quot;,
    &quot;status&quot;: &quot;foo&quot;
},
{
    &quot;user_id&quot;: &quot;789&quot;,
    &quot;tweet_id&quot;: &quot;456&quot;,
    &quot;status&quot;: &quot;bar&quot;
},
{
    &quot;user_id&quot;: &quot;789&quot;,
    &quot;tweet_id&quot;: &quot;579&quot;,
    &quot;status&quot;: &quot;baz&quot;
},
</code></pre>
<h3>Use case: User views the user timeline</h3>
<ul>
<li>The <strong>Client</strong> posts a user timeline request to the <strong>Web Server</strong></li>
<li>The <strong>Web Server</strong> forwards the request to the <strong>Read API</strong> server</li>
<li>The <strong>Read API</strong> retrieves the user timeline from the <strong>SQL Database</strong></li>
</ul>
<p>The REST API would be similar to the home timeline, except all tweets would come from the user as opposed to the people the user is following.</p>
<h3>Use case: User searches keywords</h3>
<ul>
<li>The <strong>Client</strong> sends a search request to the <strong>Web Server</strong></li>
<li>The <strong>Web Server</strong> forwards the request to the <strong>Search API</strong> server</li>
<li>The <strong>Search API</strong> contacts the <strong>Search Service</strong>, which does the following:<ul>
<li>Parses/tokenizes the input query, determining what needs to be searched<ul>
<li>Removes markup</li>
<li>Breaks up the text into terms</li>
<li>Fixes typos</li>
<li>Normalizes capitalization</li>
<li>Converts the query to use boolean operations</li>
</ul>
</li>
<li>Queries the <strong>Search Cluster</strong> (ie <a href="https://lucene.apache.org/">Lucene</a>) for the results:<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#under-development">Scatter gathers</a> each server in the cluster to determine if there are any results for the query</li>
<li>Merges, ranks, sorts, and returns the results</li>
</ul>
</li>
</ul>
</li>
</ul>
<p>REST API:</p>
<pre><code>$ curl https://twitter.com/api/v1/search?query=hello+world
</code></pre>
<p>The response would be similar to that of the home timeline, except for tweets matching the given query.</p>
<h2>Step 4: Scale the design</h2>
<blockquote>
<p>Identify and address bottlenecks, given the constraints.</p>
</blockquote>
<p><img src="http://i.imgur.com/jrUBAF7.png" alt="Imgur"></p>
<p><strong>Important: Do not simply jump right into the final design from the initial design!</strong></p>
<p>State you would 1) <strong>Benchmark/Load Test</strong>, 2) <strong>Profile</strong> for bottlenecks 3) address bottlenecks while evaluating alternatives and trade-offs, and 4) repeat.  See <a href="../scaling_aws/README.md">Design a system that scales to millions of users on AWS</a> as a sample on how to iteratively scale the initial design.</p>
<p>It&#39;s important to discuss what bottlenecks you might encounter with the initial design and how you might address each of them.  For example, what issues are addressed by adding a <strong>Load Balancer</strong> with multiple <strong>Web Servers</strong>?  <strong>CDN</strong>?  <strong>Master-Slave Replicas</strong>?  What are the alternatives and <strong>Trade-Offs</strong> for each?</p>
<p>We&#39;ll introduce some components to complete the design and to address scalability issues.  Internal load balancers are not shown to reduce clutter.</p>
<p><em>To avoid repeating discussions</em>, refer to the following <a href="https://github.com/donnemartin/system-design-primer#index-of-system-design-topics">system design topics</a> for main talking points, tradeoffs, and alternatives:</p>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#domain-name-system">DNS</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#content-delivery-network">CDN</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#load-balancer">Load balancer</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#horizontal-scaling">Horizontal scaling</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#reverse-proxy-web-server">Web server (reverse proxy)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#application-layer">API server (application layer)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#cache">Cache</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#relational-database-management-system-rdbms">Relational database management system (RDBMS)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#fail-over">SQL write master-slave failover</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#master-slave-replication">Master-slave replication</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#consistency-patterns">Consistency patterns</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#availability-patterns">Availability patterns</a></li>
</ul>
<p>The <strong>Fanout Service</strong> is a potential bottleneck.  Twitter users with millions of followers could take several minutes to have their tweets go through the fanout process.  This could lead to race conditions with @replies to the tweet, which we could mitigate by re-ordering the tweets at serve time.</p>
<p>We could also avoid fanning out tweets from highly-followed users.  Instead, we could search to find tweets for highly-followed users, merge the search results with the user&#39;s home timeline results, then re-order the tweets at serve time.</p>
<p>Additional optimizations include:</p>
<ul>
<li>Keep only several hundred tweets for each home timeline in the <strong>Memory Cache</strong></li>
<li>Keep only active users&#39; home timeline info in the <strong>Memory Cache</strong><ul>
<li>If a user was not previously active in the past 30 days, we could rebuild the timeline from the <strong>SQL Database</strong><ul>
<li>Query the <strong>User Graph Service</strong> to determine who the user is following</li>
<li>Get the tweets from the <strong>SQL Database</strong> and add them to the <strong>Memory Cache</strong></li>
</ul>
</li>
</ul>
</li>
<li>Store only a month of tweets in the <strong>Tweet Info Service</strong></li>
<li>Store only active users in the <strong>User Info Service</strong></li>
<li>The <strong>Search Cluster</strong> would likely need to keep the tweets in memory to keep latency low</li>
</ul>
<p>We&#39;ll also want to address the bottleneck with the <strong>SQL Database</strong>.</p>
<p>Although the <strong>Memory Cache</strong> should reduce the load on the database, it is unlikely the <strong>SQL Read Replicas</strong> alone would be enough to handle the cache misses.  We&#39;ll probably need to employ additional SQL scaling patterns.</p>
<p>The high volume of writes would overwhelm a single <strong>SQL Write Master-Slave</strong>, also pointing to a need for additional scaling techniques.</p>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#federation">Federation</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sharding">Sharding</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#denormalization">Denormalization</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sql-tuning">SQL Tuning</a></li>
</ul>
<p>We should also consider moving some data to a <strong>NoSQL Database</strong>.</p>
<h2>Additional talking points</h2>
<blockquote>
<p>Additional topics to dive into, depending on the problem scope and time remaining.</p>
</blockquote>
<h4>NoSQL</h4>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#key-value-store">Key-value store</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#document-store">Document store</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#wide-column-store">Wide column store</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#graph-database">Graph database</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sql-or-nosql">SQL vs NoSQL</a></li>
</ul>
<h3>Caching</h3>
<ul>
<li>Where to cache<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#client-caching">Client caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#cdn-caching">CDN caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#web-server-caching">Web server caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#database-caching">Database caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#application-caching">Application caching</a></li>
</ul>
</li>
<li>What to cache<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#caching-at-the-database-query-level">Caching at the database query level</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#caching-at-the-object-level">Caching at the object level</a></li>
</ul>
</li>
<li>When to update the cache<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#cache-aside">Cache-aside</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#write-through">Write-through</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#write-behind-write-back">Write-behind (write-back)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#refresh-ahead">Refresh ahead</a></li>
</ul>
</li>
</ul>
<h3>Asynchronism and microservices</h3>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#message-queues">Message queues</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#task-queues">Task queues</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#back-pressure">Back pressure</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#microservices">Microservices</a></li>
</ul>
<h3>Communications</h3>
<ul>
<li>Discuss tradeoffs:<ul>
<li>External communication with clients - <a href="https://github.com/donnemartin/system-design-primer#representational-state-transfer-rest">HTTP APIs following REST</a></li>
<li>Internal communications - <a href="https://github.com/donnemartin/system-design-primer#remote-procedure-call-rpc">RPC</a></li>
</ul>
</li>
<li><a href="https://github.com/donnemartin/system-design-primer#service-discovery">Service discovery</a></li>
</ul>
<h3>Security</h3>
<p>Refer to the <a href="https://github.com/donnemartin/system-design-primer#security">security section</a>.</p>
<h3>Latency numbers</h3>
<p>See <a href="https://github.com/donnemartin/system-design-primer#latency-numbers-every-programmer-should-know">Latency numbers every programmer should know</a>.</p>
<h3>Ongoing</h3>
<ul>
<li>Continue benchmarking and monitoring your system to address bottlenecks as they come up</li>
<li>Scaling is an iterative process</li>
</ul>

</div>
`,
quiz:{q:'Fanning out a tweet (pushing it to followers timelines) is fast for most users. Why is it dangerous to fan out a tweet from a celebrity with 50 million followers?', opts:['It exceeds the 140 character limit', 'It creates 50 million database write operations instantly, crushing the database', 'It requires strong consistency', 'It breaks the CDN'], a:1, why:'Fanout-on-write copies the tweet to every followers timeline cache. 50 million writes for a single tweet will cause massive latency and load. That is why systems mix push for normal users and pull for celebrities.'}
},
{
id: 'web-crawler', group: 'Interview prep (Deep dives)', title: 'Design a web crawler', nav: 'a',
html: `
<p class="eyebrow">Interview prep · Deep dive</p>
<h1>Design a web crawler</h1>
<p class="lede">A deep dive into system architecture from the Primer.</p>

<div class="eli5"><span class="tag">In plain English</span>
<p>Imagine you want to map a giant labyrinth. You start in one room, write down all the doors, and put them on a "to visit" list (the queue). You walk through the first door, note the new doors, add them to the list, and cross the room off your "visited" list so you don't walk in circles. A web crawler is just this process automated at massive scale.</p>
</div>

<div class="deep-divider">The full picture</div>
<div class="lesson">

<p><em>Note: This document links directly to relevant areas found in the <a href="https://github.com/donnemartin/system-design-primer#index-of-system-design-topics">system design topics</a> to avoid duplication.  Refer to the linked content for general talking points, tradeoffs, and alternatives.</em></p>
<h2>Step 1: Outline use cases and constraints</h2>
<blockquote>
<p>Gather requirements and scope the problem.
Ask questions to clarify use cases and constraints.
Discuss assumptions.</p>
</blockquote>
<p>Without an interviewer to address clarifying questions, we&#39;ll define some use cases and constraints.</p>
<h3>Use cases</h3>
<h4>We&#39;ll scope the problem to handle only the following use cases</h4>
<ul>
<li><strong>Service</strong> crawls a list of urls:<ul>
<li>Generates reverse index of words to pages containing the search terms</li>
<li>Generates titles and snippets for pages<ul>
<li>Title and snippets are static, they do not change based on search query</li>
</ul>
</li>
</ul>
</li>
<li><strong>User</strong> inputs a search term and sees a list of relevant pages with titles and snippets  the crawler generated<ul>
<li>Only sketch high level components and interactions for this use case, no need to go into depth</li>
</ul>
</li>
<li><strong>Service</strong> has high availability</li>
</ul>
<h4>Out of scope</h4>
<ul>
<li>Search analytics</li>
<li>Personalized search results</li>
<li>Page rank</li>
</ul>
<h3>Constraints and assumptions</h3>
<h4>State assumptions</h4>
<ul>
<li>Traffic is not evenly distributed<ul>
<li>Some searches are very popular, while others are only executed once</li>
</ul>
</li>
<li>Support only anonymous users</li>
<li>Generating search results should be fast</li>
<li>The web crawler should not get stuck in an infinite loop<ul>
<li>We get stuck in an infinite loop if the graph contains a cycle</li>
</ul>
</li>
<li>1 billion links to crawl<ul>
<li>Pages need to be crawled regularly to ensure freshness</li>
<li>Average refresh rate of about once per week, more frequent for popular sites<ul>
<li>4 billion links crawled each month</li>
</ul>
</li>
<li>Average stored size per web page: 500 KB<ul>
<li>For simplicity, count changes the same as new pages</li>
</ul>
</li>
</ul>
</li>
<li>100 billion searches per month</li>
</ul>
<p>Exercise the use of more traditional systems - don&#39;t use existing systems such as <a href="http://lucene.apache.org/solr/">solr</a> or <a href="http://nutch.apache.org/">nutch</a>.</p>
<h4>Calculate usage</h4>
<p><strong>Clarify with your interviewer if you should run back-of-the-envelope usage calculations.</strong></p>
<ul>
<li>2 PB of stored page content per month<ul>
<li>500 KB per page * 4 billion links crawled per month</li>
<li>72 PB of stored page content in 3 years</li>
</ul>
</li>
<li>1,600 write requests per second</li>
<li>40,000 search requests per second</li>
</ul>
<p>Handy conversion guide:</p>
<ul>
<li>2.5 million seconds per month</li>
<li>1 request per second = 2.5 million requests per month</li>
<li>40 requests per second = 100 million requests per month</li>
<li>400 requests per second = 1 billion requests per month</li>
</ul>
<h2>Step 2: Create a high level design</h2>
<blockquote>
<p>Outline a high level design with all important components.</p>
</blockquote>
<p><img src="http://i.imgur.com/xjdAAUv.png" alt="Imgur"></p>
<h2>Step 3: Design core components</h2>
<blockquote>
<p>Dive into details for each core component.</p>
</blockquote>
<h3>Use case: Service crawls a list of urls</h3>
<p>We&#39;ll assume we have an initial list of <code>links_to_crawl</code> ranked initially based on overall site popularity.  If this is not a reasonable assumption, we can seed the crawler with popular sites that link to outside content such as <a href="https://www.yahoo.com/">Yahoo</a>, <a href="http://www.dmoz.org/">DMOZ</a>, etc.</p>
<p>We&#39;ll use a table <code>crawled_links</code> to store processed links and their page signatures.</p>
<p>We could store <code>links_to_crawl</code> and <code>crawled_links</code> in a key-value <strong>NoSQL Database</strong>.  For the ranked links in <code>links_to_crawl</code>, we could use <a href="https://redis.io/">Redis</a> with sorted sets to maintain a ranking of page links.  We should discuss the <a href="https://github.com/donnemartin/system-design-primer#sql-or-nosql">use cases and tradeoffs between choosing SQL or NoSQL</a>.</p>
<ul>
<li>The <strong>Crawler Service</strong> processes each page link by doing the following in a loop:<ul>
<li>Takes the top ranked page link to crawl<ul>
<li>Checks <code>crawled_links</code> in the <strong>NoSQL Database</strong> for an entry with a similar page signature<ul>
<li>If we have a similar page, reduces the priority of the page link<ul>
<li>This prevents us from getting into a cycle</li>
<li>Continue</li>
</ul>
</li>
<li>Else, crawls the link<ul>
<li>Adds a job to the <strong>Reverse Index Service</strong> queue to generate a <a href="https://en.wikipedia.org/wiki/Search_engine_indexing">reverse index</a></li>
<li>Adds a job to the <strong>Document Service</strong> queue to generate a static title and snippet</li>
<li>Generates the page signature</li>
<li>Removes the link from <code>links_to_crawl</code> in the <strong>NoSQL Database</strong></li>
<li>Inserts the page link and signature to <code>crawled_links</code> in the <strong>NoSQL Database</strong></li>
</ul>
</li>
</ul>
</li>
</ul>
</li>
</ul>
</li>
</ul>
<p><strong>Clarify with your interviewer how much code you are expected to write</strong>.</p>
<p><code>PagesDataStore</code> is an abstraction within the <strong>Crawler Service</strong> that uses the <strong>NoSQL Database</strong>:</p>
<pre><code class="language-python">class PagesDataStore(object):

    def __init__(self, db);
        self.db = db
        ...

    def add_link_to_crawl(self, url):
        &quot;&quot;&quot;Add the given link to \`links_to_crawl\`.&quot;&quot;&quot;
        ...

    def remove_link_to_crawl(self, url):
        &quot;&quot;&quot;Remove the given link from \`links_to_crawl\`.&quot;&quot;&quot;
        ...

    def reduce_priority_link_to_crawl(self, url)
        &quot;&quot;&quot;Reduce the priority of a link in \`links_to_crawl\` to avoid cycles.&quot;&quot;&quot;
        ...

    def extract_max_priority_page(self):
        &quot;&quot;&quot;Return the highest priority link in \`links_to_crawl\`.&quot;&quot;&quot;
        ...

    def insert_crawled_link(self, url, signature):
        &quot;&quot;&quot;Add the given link to \`crawled_links\`.&quot;&quot;&quot;
        ...

    def crawled_similar(self, signature):
        &quot;&quot;&quot;Determine if we&#39;ve already crawled a page matching the given signature&quot;&quot;&quot;
        ...
</code></pre>
<p><code>Page</code> is an abstraction within the <strong>Crawler Service</strong> that encapsulates a page, its contents, child urls, and signature:</p>
<pre><code class="language-python">class Page(object):

    def __init__(self, url, contents, child_urls, signature):
        self.url = url
        self.contents = contents
        self.child_urls = child_urls
        self.signature = signature
</code></pre>
<p><code>Crawler</code> is the main class within <strong>Crawler Service</strong>, composed of <code>Page</code> and <code>PagesDataStore</code>.</p>
<pre><code class="language-python">class Crawler(object):

    def __init__(self, data_store, reverse_index_queue, doc_index_queue):
        self.data_store = data_store
        self.reverse_index_queue = reverse_index_queue
        self.doc_index_queue = doc_index_queue

    def create_signature(self, page):
        &quot;&quot;&quot;Create signature based on url and contents.&quot;&quot;&quot;
        ...

    def crawl_page(self, page):
        for url in page.child_urls:
            self.data_store.add_link_to_crawl(url)
        page.signature = self.create_signature(page)
        self.data_store.remove_link_to_crawl(page.url)
        self.data_store.insert_crawled_link(page.url, page.signature)

    def crawl(self):
        while True:
            page = self.data_store.extract_max_priority_page()
            if page is None:
                break
            if self.data_store.crawled_similar(page.signature):
                self.data_store.reduce_priority_link_to_crawl(page.url)
            else:
                self.crawl_page(page)
</code></pre>
<h3>Handling duplicates</h3>
<p>We need to be careful the web crawler doesn&#39;t get stuck in an infinite loop, which happens when the graph contains a cycle.</p>
<p><strong>Clarify with your interviewer how much code you are expected to write</strong>.</p>
<p>We&#39;ll want to remove duplicate urls:</p>
<ul>
<li>For smaller lists we could use something like <code>sort | unique</code></li>
<li>With 1 billion links to crawl, we could use <strong>MapReduce</strong> to output only entries that have a frequency of 1</li>
</ul>
<pre><code class="language-python">class RemoveDuplicateUrls(MRJob):

    def mapper(self, _, line):
        yield line, 1

    def reducer(self, key, values):
        total = sum(values)
        if total == 1:
            yield key, total
</code></pre>
<p>Detecting duplicate content is more complex.  We could generate a signature based on the contents of the page and compare those two signatures for similarity.  Some potential algorithms are <a href="https://en.wikipedia.org/wiki/Jaccard_index">Jaccard index</a> and <a href="https://en.wikipedia.org/wiki/Cosine_similarity">cosine similarity</a>.</p>
<h3>Determining when to update the crawl results</h3>
<p>Pages need to be crawled regularly to ensure freshness.  Crawl results could have a <code>timestamp</code> field that indicates the last time a page was crawled.  After a default time period, say one week, all pages should be refreshed.  Frequently updated or more popular sites could be refreshed in shorter intervals.</p>
<p>Although we won&#39;t dive into details on analytics, we could do some data mining to determine the mean time before a particular page is updated, and use that statistic to determine how often to re-crawl the page.</p>
<p>We might also choose to support a <code>Robots.txt</code> file that gives webmasters control of crawl frequency.</p>
<h3>Use case: User inputs a search term and sees a list of relevant pages with titles and snippets</h3>
<ul>
<li>The <strong>Client</strong> sends a request to the <strong>Web Server</strong>, running as a <a href="https://github.com/donnemartin/system-design-primer#reverse-proxy-web-server">reverse proxy</a></li>
<li>The <strong>Web Server</strong> forwards the request to the <strong>Query API</strong> server</li>
<li>The <strong>Query API</strong> server does the following:<ul>
<li>Parses the query<ul>
<li>Removes markup</li>
<li>Breaks up the text into terms</li>
<li>Fixes typos</li>
<li>Normalizes capitalization</li>
<li>Converts the query to use boolean operations</li>
</ul>
</li>
<li>Uses the <strong>Reverse Index Service</strong> to find documents matching the query<ul>
<li>The <strong>Reverse Index Service</strong> ranks the matching results and returns the top ones</li>
</ul>
</li>
<li>Uses the <strong>Document Service</strong> to return titles and snippets</li>
</ul>
</li>
</ul>
<p>We&#39;ll use a public <a href="https://github.com/donnemartin/system-design-primer#representational-state-transfer-rest"><strong>REST API</strong></a>:</p>
<pre><code>$ curl https://search.com/api/v1/search?query=hello+world
</code></pre>
<p>Response:</p>
<pre><code>{
    &quot;title&quot;: &quot;foo&#39;s title&quot;,
    &quot;snippet&quot;: &quot;foo&#39;s snippet&quot;,
    &quot;link&quot;: &quot;https://foo.com&quot;,
},
{
    &quot;title&quot;: &quot;bar&#39;s title&quot;,
    &quot;snippet&quot;: &quot;bar&#39;s snippet&quot;,
    &quot;link&quot;: &quot;https://bar.com&quot;,
},
{
    &quot;title&quot;: &quot;baz&#39;s title&quot;,
    &quot;snippet&quot;: &quot;baz&#39;s snippet&quot;,
    &quot;link&quot;: &quot;https://baz.com&quot;,
},
</code></pre>
<p>For internal communications, we could use <a href="https://github.com/donnemartin/system-design-primer#remote-procedure-call-rpc">Remote Procedure Calls</a>.</p>
<h2>Step 4: Scale the design</h2>
<blockquote>
<p>Identify and address bottlenecks, given the constraints.</p>
</blockquote>
<p><img src="http://i.imgur.com/bWxPtQA.png" alt="Imgur"></p>
<p><strong>Important: Do not simply jump right into the final design from the initial design!</strong></p>
<p>State you would 1) <strong>Benchmark/Load Test</strong>, 2) <strong>Profile</strong> for bottlenecks 3) address bottlenecks while evaluating alternatives and trade-offs, and 4) repeat.  See <a href="../scaling_aws/README.md">Design a system that scales to millions of users on AWS</a> as a sample on how to iteratively scale the initial design.</p>
<p>It&#39;s important to discuss what bottlenecks you might encounter with the initial design and how you might address each of them.  For example, what issues are addressed by adding a <strong>Load Balancer</strong> with multiple <strong>Web Servers</strong>?  <strong>CDN</strong>?  <strong>Master-Slave Replicas</strong>?  What are the alternatives and <strong>Trade-Offs</strong> for each?</p>
<p>We&#39;ll introduce some components to complete the design and to address scalability issues.  Internal load balancers are not shown to reduce clutter.</p>
<p><em>To avoid repeating discussions</em>, refer to the following <a href="https://github.com/donnemartin/system-design-primer#index-of-system-design-topics">system design topics</a> for main talking points, tradeoffs, and alternatives:</p>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#domain-name-system">DNS</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#load-balancer">Load balancer</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#horizontal-scaling">Horizontal scaling</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#reverse-proxy-web-server">Web server (reverse proxy)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#application-layer">API server (application layer)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#cache">Cache</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#nosql">NoSQL</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#consistency-patterns">Consistency patterns</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#availability-patterns">Availability patterns</a></li>
</ul>
<p>Some searches are very popular, while others are only executed once.  Popular queries can be served from a <strong>Memory Cache</strong> such as Redis or Memcached to reduce response times and to avoid overloading the <strong>Reverse Index Service</strong> and <strong>Document Service</strong>.  The <strong>Memory Cache</strong> is also useful for handling the unevenly distributed traffic and traffic spikes.  Reading 1 MB sequentially from memory takes about 250 microseconds, while reading from SSD takes 4x and from disk takes 80x longer.<sup><a href=https://github.com/donnemartin/system-design-primer#latency-numbers-every-programmer-should-know>1</a></sup></p>
<p>Below are a few other optimizations to the <strong>Crawling Service</strong>:</p>
<ul>
<li>To handle the data size and request load, the <strong>Reverse Index Service</strong> and <strong>Document Service</strong> will likely need to make heavy use sharding and federation.</li>
<li>DNS lookup can be a bottleneck, the <strong>Crawler Service</strong> can keep its own DNS lookup that is refreshed periodically</li>
<li>The <strong>Crawler Service</strong> can improve performance and reduce memory usage by keeping many open connections at a time, referred to as <a href="https://en.wikipedia.org/wiki/Connection_pool">connection pooling</a><ul>
<li>Switching to <a href="https://github.com/donnemartin/system-design-primer#user-datagram-protocol-udp">UDP</a> could also boost performance</li>
</ul>
</li>
<li>Web crawling is bandwidth intensive, ensure there is enough bandwidth to sustain high throughput</li>
</ul>
<h2>Additional talking points</h2>
<blockquote>
<p>Additional topics to dive into, depending on the problem scope and time remaining.</p>
</blockquote>
<h3>SQL scaling patterns</h3>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#master-slave-replication">Read replicas</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#federation">Federation</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sharding">Sharding</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#denormalization">Denormalization</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sql-tuning">SQL Tuning</a></li>
</ul>
<h4>NoSQL</h4>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#key-value-store">Key-value store</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#document-store">Document store</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#wide-column-store">Wide column store</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#graph-database">Graph database</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sql-or-nosql">SQL vs NoSQL</a></li>
</ul>
<h3>Caching</h3>
<ul>
<li>Where to cache<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#client-caching">Client caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#cdn-caching">CDN caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#web-server-caching">Web server caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#database-caching">Database caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#application-caching">Application caching</a></li>
</ul>
</li>
<li>What to cache<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#caching-at-the-database-query-level">Caching at the database query level</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#caching-at-the-object-level">Caching at the object level</a></li>
</ul>
</li>
<li>When to update the cache<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#cache-aside">Cache-aside</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#write-through">Write-through</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#write-behind-write-back">Write-behind (write-back)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#refresh-ahead">Refresh ahead</a></li>
</ul>
</li>
</ul>
<h3>Asynchronism and microservices</h3>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#message-queues">Message queues</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#task-queues">Task queues</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#back-pressure">Back pressure</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#microservices">Microservices</a></li>
</ul>
<h3>Communications</h3>
<ul>
<li>Discuss tradeoffs:<ul>
<li>External communication with clients - <a href="https://github.com/donnemartin/system-design-primer#representational-state-transfer-rest">HTTP APIs following REST</a></li>
<li>Internal communications - <a href="https://github.com/donnemartin/system-design-primer#remote-procedure-call-rpc">RPC</a></li>
</ul>
</li>
<li><a href="https://github.com/donnemartin/system-design-primer#service-discovery">Service discovery</a></li>
</ul>
<h3>Security</h3>
<p>Refer to the <a href="https://github.com/donnemartin/system-design-primer#security">security section</a>.</p>
<h3>Latency numbers</h3>
<p>See <a href="https://github.com/donnemartin/system-design-primer#latency-numbers-every-programmer-should-know">Latency numbers every programmer should know</a>.</p>
<h3>Ongoing</h3>
<ul>
<li>Continue benchmarking and monitoring your system to address bottlenecks as they come up</li>
<li>Scaling is an iterative process</li>
</ul>

</div>
`,
quiz:{q:'A crawler must maintain a "visited" list to avoid infinite loops. What data structure is typically used to store billions of visited URLs efficiently?', opts:['A distributed hash table or Bloom filter', 'A relational database table with foreign keys', 'An array stored in memory', 'A JSON file'], a:0, why:'A Bloom filter is incredibly space-efficient for checking if an item exists in a massive dataset. Even if it occasionally gives a false positive, it saves terabytes of RAM compared to storing full URLs.'}
},
{
id: 'mint', group: 'Interview prep (Deep dives)', title: 'Design Mint.com', nav: 'Mint.com',
html: `
<p class="eyebrow">Interview prep · Deep dive</p>
<h1>Design Mint.com</h1>
<p class="lede">A deep dive into system architecture from the Primer.</p>

<div class="eli5"><span class="tag">In plain English</span>
<p>You hire an accountant. Every night, they log into your 10 different bank accounts, download the transactions, categorize them, and put them in a master spreadsheet. When you wake up, you don't have to check 10 banks; you just look at the spreadsheet. Mint is the accountant, using batch jobs to sync data so your dashboard is instantly ready to read.</p>
</div>

<div class="deep-divider">The full picture</div>
<div class="lesson">

<p><em>Note: This document links directly to relevant areas found in the <a href="https://github.com/donnemartin/system-design-primer#index-of-system-design-topics">system design topics</a> to avoid duplication.  Refer to the linked content for general talking points, tradeoffs, and alternatives.</em></p>
<h2>Step 1: Outline use cases and constraints</h2>
<blockquote>
<p>Gather requirements and scope the problem.
Ask questions to clarify use cases and constraints.
Discuss assumptions.</p>
</blockquote>
<p>Without an interviewer to address clarifying questions, we&#39;ll define some use cases and constraints.</p>
<h3>Use cases</h3>
<h4>We&#39;ll scope the problem to handle only the following use cases</h4>
<ul>
<li><strong>User</strong> connects to a financial account</li>
<li><strong>Service</strong> extracts transactions from the account<ul>
<li>Updates daily</li>
<li>Categorizes transactions<ul>
<li>Allows manual category override by the user</li>
<li>No automatic re-categorization</li>
</ul>
</li>
<li>Analyzes monthly spending, by category</li>
</ul>
</li>
<li><strong>Service</strong> recommends a budget<ul>
<li>Allows users to manually set a budget</li>
<li>Sends notifications when approaching or exceeding budget</li>
</ul>
</li>
<li><strong>Service</strong> has high availability</li>
</ul>
<h4>Out of scope</h4>
<ul>
<li><strong>Service</strong> performs additional logging and analytics</li>
</ul>
<h3>Constraints and assumptions</h3>
<h4>State assumptions</h4>
<ul>
<li>Traffic is not evenly distributed</li>
<li>Automatic daily update of accounts applies only to users active in the past 30 days</li>
<li>Adding or removing financial accounts is relatively rare</li>
<li>Budget notifications don&#39;t need to be instant</li>
<li>10 million users<ul>
<li>10 budget categories per user = 100 million budget items</li>
<li>Example categories:<ul>
<li>Housing = $1,000</li>
<li>Food = $200</li>
<li>Gas = $100</li>
</ul>
</li>
<li>Sellers are used to determine transaction category<ul>
<li>50,000 sellers</li>
</ul>
</li>
</ul>
</li>
<li>30 million financial accounts</li>
<li>5 billion transactions per month</li>
<li>500 million read requests per month</li>
<li>10:1 write to read ratio<ul>
<li>Write-heavy, users make transactions daily, but few visit the site daily</li>
</ul>
</li>
</ul>
<h4>Calculate usage</h4>
<p><strong>Clarify with your interviewer if you should run back-of-the-envelope usage calculations.</strong></p>
<ul>
<li>Size per transaction:<ul>
<li><code>user_id</code> - 8 bytes</li>
<li><code>created_at</code> - 5 bytes</li>
<li><code>seller</code> - 32 bytes</li>
<li><code>amount</code> - 5 bytes</li>
<li>Total: ~50 bytes</li>
</ul>
</li>
<li>250 GB of new transaction content per month<ul>
<li>50 bytes per transaction * 5 billion transactions per month</li>
<li>9 TB of new transaction content in 3 years</li>
<li>Assume most are new transactions instead of updates to existing ones</li>
</ul>
</li>
<li>2,000 transactions per second on average</li>
<li>200 read requests per second on average</li>
</ul>
<p>Handy conversion guide:</p>
<ul>
<li>2.5 million seconds per month</li>
<li>1 request per second = 2.5 million requests per month</li>
<li>40 requests per second = 100 million requests per month</li>
<li>400 requests per second = 1 billion requests per month</li>
</ul>
<h2>Step 2: Create a high level design</h2>
<blockquote>
<p>Outline a high level design with all important components.</p>
</blockquote>
<p><img src="http://i.imgur.com/E8klrBh.png" alt="Imgur"></p>
<h2>Step 3: Design core components</h2>
<blockquote>
<p>Dive into details for each core component.</p>
</blockquote>
<h3>Use case: User connects to a financial account</h3>
<p>We could store info on the 10 million users in a <a href="https://github.com/donnemartin/system-design-primer#relational-database-management-system-rdbms">relational database</a>.  We should discuss the <a href="https://github.com/donnemartin/system-design-primer#sql-or-nosql">use cases and tradeoffs between choosing SQL or NoSQL</a>.</p>
<ul>
<li>The <strong>Client</strong> sends a request to the <strong>Web Server</strong>, running as a <a href="https://github.com/donnemartin/system-design-primer#reverse-proxy-web-server">reverse proxy</a></li>
<li>The <strong>Web Server</strong> forwards the request to the <strong>Accounts API</strong> server</li>
<li>The <strong>Accounts API</strong> server updates the <strong>SQL Database</strong> <code>accounts</code> table with the newly entered account info</li>
</ul>
<p><strong>Clarify with your interviewer how much code you are expected to write</strong>.</p>
<p>The <code>accounts</code> table could have the following structure:</p>
<pre><code>id int NOT NULL AUTO_INCREMENT
created_at datetime NOT NULL
last_update datetime NOT NULL
account_url varchar(255) NOT NULL
account_login varchar(32) NOT NULL
account_password_hash char(64) NOT NULL
user_id int NOT NULL
PRIMARY KEY(id)
FOREIGN KEY(user_id) REFERENCES users(id)
</code></pre>
<p>We&#39;ll create an <a href="https://github.com/donnemartin/system-design-primer#use-good-indices">index</a> on <code>id</code>, <code>user_id </code>, and <code>created_at</code> to speed up lookups (log-time instead of scanning the entire table) and to keep the data in memory.  Reading 1 MB sequentially from memory takes about 250 microseconds, while reading from SSD takes 4x and from disk takes 80x longer.<sup><a href=https://github.com/donnemartin/system-design-primer#latency-numbers-every-programmer-should-know>1</a></sup></p>
<p>We&#39;ll use a public <a href="https://github.com/donnemartin/system-design-primer#representational-state-transfer-rest"><strong>REST API</strong></a>:</p>
<pre><code>$ curl -X POST --data &#39;{ &quot;user_id&quot;: &quot;foo&quot;, &quot;account_url&quot;: &quot;bar&quot;, \
    &quot;account_login&quot;: &quot;baz&quot;, &quot;account_password&quot;: &quot;qux&quot; }&#39; \
    https://mint.com/api/v1/account
</code></pre>
<p>For internal communications, we could use <a href="https://github.com/donnemartin/system-design-primer#remote-procedure-call-rpc">Remote Procedure Calls</a>.</p>
<p>Next, the service extracts transactions from the account.</p>
<h3>Use case: Service extracts transactions from the account</h3>
<p>We&#39;ll want to extract information from an account in these cases:</p>
<ul>
<li>The user first links the account</li>
<li>The user manually refreshes the account</li>
<li>Automatically each day for users who have been active in the past 30 days</li>
</ul>
<p>Data flow:</p>
<ul>
<li>The <strong>Client</strong> sends a request to the <strong>Web Server</strong></li>
<li>The <strong>Web Server</strong> forwards the request to the <strong>Accounts API</strong> server</li>
<li>The <strong>Accounts API</strong> server places a job on a <strong>Queue</strong> such as <a href="https://aws.amazon.com/sqs/">Amazon SQS</a> or <a href="https://www.rabbitmq.com/">RabbitMQ</a><ul>
<li>Extracting transactions could take awhile, we&#39;d probably want to do this <a href="https://github.com/donnemartin/system-design-primer#asynchronism">asynchronously with a queue</a>, although this introduces additional complexity</li>
</ul>
</li>
<li>The <strong>Transaction Extraction Service</strong> does the following:<ul>
<li>Pulls from the <strong>Queue</strong> and extracts transactions for the given account from the financial institution, storing the results as raw log files in the <strong>Object Store</strong></li>
<li>Uses the <strong>Category Service</strong> to categorize each transaction</li>
<li>Uses the <strong>Budget Service</strong> to calculate aggregate monthly spending by category<ul>
<li>The <strong>Budget Service</strong> uses the <strong>Notification Service</strong> to let users know if they are nearing or have exceeded their budget</li>
</ul>
</li>
<li>Updates the <strong>SQL Database</strong> <code>transactions</code> table with categorized transactions</li>
<li>Updates the <strong>SQL Database</strong> <code>monthly_spending</code> table with aggregate monthly spending by category</li>
<li>Notifies the user the transactions have completed through the <strong>Notification Service</strong>:<ul>
<li>Uses a <strong>Queue</strong> (not pictured) to asynchronously send out notifications</li>
</ul>
</li>
</ul>
</li>
</ul>
<p>The <code>transactions</code> table could have the following structure:</p>
<pre><code>id int NOT NULL AUTO_INCREMENT
created_at datetime NOT NULL
seller varchar(32) NOT NULL
amount decimal NOT NULL
user_id int NOT NULL
PRIMARY KEY(id)
FOREIGN KEY(user_id) REFERENCES users(id)
</code></pre>
<p>We&#39;ll create an <a href="https://github.com/donnemartin/system-design-primer#use-good-indices">index</a> on <code>id</code>, <code>user_id </code>, and <code>created_at</code>.</p>
<p>The <code>monthly_spending</code> table could have the following structure:</p>
<pre><code>id int NOT NULL AUTO_INCREMENT
month_year date NOT NULL
category varchar(32)
amount decimal NOT NULL
user_id int NOT NULL
PRIMARY KEY(id)
FOREIGN KEY(user_id) REFERENCES users(id)
</code></pre>
<p>We&#39;ll create an <a href="https://github.com/donnemartin/system-design-primer#use-good-indices">index</a> on <code>id</code> and <code>user_id </code>.</p>
<h4>Category service</h4>
<p>For the <strong>Category Service</strong>, we can seed a seller-to-category dictionary with the most popular sellers.  If we estimate 50,000 sellers and estimate each entry to take less than 255 bytes, the dictionary would only take about 12 MB of memory.</p>
<p><strong>Clarify with your interviewer how much code you are expected to write</strong>.</p>
<pre><code class="language-python">class DefaultCategories(Enum):

    HOUSING = 0
    FOOD = 1
    GAS = 2
    SHOPPING = 3
    ...

seller_category_map = {}
seller_category_map[&#39;Exxon&#39;] = DefaultCategories.GAS
seller_category_map[&#39;Target&#39;] = DefaultCategories.SHOPPING
...
</code></pre>
<p>For sellers not initially seeded in the map, we could use a crowdsourcing effort by evaluating the manual category overrides our users provide.  We could use a heap to quickly lookup the top manual override per seller in O(1) time.</p>
<pre><code class="language-python">class Categorizer(object):

    def __init__(self, seller_category_map, seller_category_crowd_overrides_map):
        self.seller_category_map = seller_category_map
        self.seller_category_crowd_overrides_map = \
            seller_category_crowd_overrides_map

    def categorize(self, transaction):
        if transaction.seller in self.seller_category_map:
            return self.seller_category_map[transaction.seller]
        elif transaction.seller in self.seller_category_crowd_overrides_map:
            self.seller_category_map[transaction.seller] = \
                self.seller_category_crowd_overrides_map[transaction.seller].peek_min()
            return self.seller_category_map[transaction.seller]
        return None
</code></pre>
<p>Transaction implementation:</p>
<pre><code class="language-python">class Transaction(object):

    def __init__(self, created_at, seller, amount):
        self.created_at = created_at
        self.seller = seller
        self.amount = amount
</code></pre>
<h3>Use case: Service recommends a budget</h3>
<p>To start, we could use a generic budget template that allocates category amounts based on income tiers.  Using this approach, we would not have to store the 100 million budget items identified in the constraints, only those that the user overrides.  If a user overrides a budget category, which we could store the override in the <code>TABLE budget_overrides</code>.</p>
<pre><code class="language-python">class Budget(object):

    def __init__(self, income):
        self.income = income
        self.categories_to_budget_map = self.create_budget_template()

    def create_budget_template(self):
        return {
            DefaultCategories.HOUSING: self.income * .4,
            DefaultCategories.FOOD: self.income * .2,
            DefaultCategories.GAS: self.income * .1,
            DefaultCategories.SHOPPING: self.income * .2,
            ...
        }

    def override_category_budget(self, category, amount):
        self.categories_to_budget_map[category] = amount
</code></pre>
<p>For the <strong>Budget Service</strong>, we can potentially run SQL queries on the <code>transactions</code> table to generate the <code>monthly_spending</code> aggregate table.  The <code>monthly_spending</code> table would likely have much fewer rows than the total 5 billion transactions, since users typically have many transactions per month.</p>
<p>As an alternative, we can run <strong>MapReduce</strong> jobs on the raw transaction files to:</p>
<ul>
<li>Categorize each transaction</li>
<li>Generate aggregate monthly spending by category</li>
</ul>
<p>Running analyses on the transaction files could significantly reduce the load on the database.</p>
<p>We could call the <strong>Budget Service</strong> to re-run the analysis if the user updates a category.</p>
<p><strong>Clarify with your interviewer how much code you are expected to write</strong>.</p>
<p>Sample log file format, tab delimited:</p>
<pre><code>user_id   timestamp   seller  amount
</code></pre>
<p><strong>MapReduce</strong> implementation:</p>
<pre><code class="language-python">class SpendingByCategory(MRJob):

    def __init__(self, categorizer):
        self.categorizer = categorizer
        self.current_year_month = calc_current_year_month()
        ...

    def calc_current_year_month(self):
        &quot;&quot;&quot;Return the current year and month.&quot;&quot;&quot;
        ...

    def extract_year_month(self, timestamp):
        &quot;&quot;&quot;Return the year and month portions of the timestamp.&quot;&quot;&quot;
        ...

    def handle_budget_notifications(self, key, total):
        &quot;&quot;&quot;Call notification API if nearing or exceeded budget.&quot;&quot;&quot;
        ...

    def mapper(self, _, line):
        &quot;&quot;&quot;Parse each log line, extract and transform relevant lines.

        Argument line will be of the form:

        user_id   timestamp   seller  amount

        Using the categorizer to convert seller to category,
        emit key value pairs of the form:

        (user_id, 2016-01, shopping), 25
        (user_id, 2016-01, shopping), 100
        (user_id, 2016-01, gas), 50
        &quot;&quot;&quot;
        user_id, timestamp, seller, amount = line.split(&#39;\t&#39;)
        category = self.categorizer.categorize(seller)
        period = self.extract_year_month(timestamp)
        if period == self.current_year_month:
            yield (user_id, period, category), amount

    def reducer(self, key, value):
        &quot;&quot;&quot;Sum values for each key.

        (user_id, 2016-01, shopping), 125
        (user_id, 2016-01, gas), 50
        &quot;&quot;&quot;
        total = sum(values)
        yield key, sum(values)
</code></pre>
<h2>Step 4: Scale the design</h2>
<blockquote>
<p>Identify and address bottlenecks, given the constraints.</p>
</blockquote>
<p><img src="http://i.imgur.com/V5q57vU.png" alt="Imgur"></p>
<p><strong>Important: Do not simply jump right into the final design from the initial design!</strong></p>
<p>State you would 1) <strong>Benchmark/Load Test</strong>, 2) <strong>Profile</strong> for bottlenecks 3) address bottlenecks while evaluating alternatives and trade-offs, and 4) repeat.  See <a href="../scaling_aws/README.md">Design a system that scales to millions of users on AWS</a> as a sample on how to iteratively scale the initial design.</p>
<p>It&#39;s important to discuss what bottlenecks you might encounter with the initial design and how you might address each of them.  For example, what issues are addressed by adding a <strong>Load Balancer</strong> with multiple <strong>Web Servers</strong>?  <strong>CDN</strong>?  <strong>Master-Slave Replicas</strong>?  What are the alternatives and <strong>Trade-Offs</strong> for each?</p>
<p>We&#39;ll introduce some components to complete the design and to address scalability issues.  Internal load balancers are not shown to reduce clutter.</p>
<p><em>To avoid repeating discussions</em>, refer to the following <a href="https://github.com/donnemartin/system-design-primer#index-of-system-design-topics">system design topics</a> for main talking points, tradeoffs, and alternatives:</p>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#domain-name-system">DNS</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#content-delivery-network">CDN</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#load-balancer">Load balancer</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#horizontal-scaling">Horizontal scaling</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#reverse-proxy-web-server">Web server (reverse proxy)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#application-layer">API server (application layer)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#cache">Cache</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#relational-database-management-system-rdbms">Relational database management system (RDBMS)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#fail-over">SQL write master-slave failover</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#master-slave-replication">Master-slave replication</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#asynchronism">Asynchronism</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#consistency-patterns">Consistency patterns</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#availability-patterns">Availability patterns</a></li>
</ul>
<p>We&#39;ll add an additional use case: <strong>User</strong> accesses summaries and transactions.</p>
<p>User sessions, aggregate stats by category, and recent transactions could be placed in a <strong>Memory Cache</strong> such as Redis or Memcached.</p>
<ul>
<li>The <strong>Client</strong> sends a read request to the <strong>Web Server</strong></li>
<li>The <strong>Web Server</strong> forwards the request to the <strong>Read API</strong> server<ul>
<li>Static content can be served from the <strong>Object Store</strong> such as S3, which is cached on the <strong>CDN</strong></li>
</ul>
</li>
<li>The <strong>Read API</strong> server does the following:<ul>
<li>Checks the <strong>Memory Cache</strong> for the content<ul>
<li>If the url is in the <strong>Memory Cache</strong>, returns the cached contents</li>
<li>Else<ul>
<li>If the url is in the <strong>SQL Database</strong>, fetches the contents<ul>
<li>Updates the <strong>Memory Cache</strong> with the contents</li>
</ul>
</li>
</ul>
</li>
</ul>
</li>
</ul>
</li>
</ul>
<p>Refer to <a href="https://github.com/donnemartin/system-design-primer#when-to-update-the-cache">When to update the cache</a> for tradeoffs and alternatives.  The approach above describes <a href="https://github.com/donnemartin/system-design-primer#cache-aside">cache-aside</a>.</p>
<p>Instead of keeping the <code>monthly_spending</code> aggregate table in the <strong>SQL Database</strong>, we could create a separate <strong>Analytics Database</strong> using a data warehousing solution such as Amazon Redshift or Google BigQuery.</p>
<p>We might only want to store a month of <code>transactions</code> data in the database, while storing the rest in a data warehouse or in an <strong>Object Store</strong>.  An <strong>Object Store</strong> such as Amazon S3 can comfortably handle the constraint of 250 GB of new content per month.</p>
<p>To address the 200 <em>average</em> read requests per second (higher at peak), traffic for popular content should be handled by the <strong>Memory Cache</strong> instead of the database.  The <strong>Memory Cache</strong> is also useful for handling the unevenly distributed traffic and traffic spikes.  The <strong>SQL Read Replicas</strong> should be able to handle the cache misses, as long as the replicas are not bogged down with replicating writes.</p>
<p>2,000 <em>average</em> transaction writes per second (higher at peak) might be tough for a single <strong>SQL Write Master-Slave</strong>.  We might need to employ additional SQL scaling patterns:</p>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#federation">Federation</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sharding">Sharding</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#denormalization">Denormalization</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sql-tuning">SQL Tuning</a></li>
</ul>
<p>We should also consider moving some data to a <strong>NoSQL Database</strong>.</p>
<h2>Additional talking points</h2>
<blockquote>
<p>Additional topics to dive into, depending on the problem scope and time remaining.</p>
</blockquote>
<h4>NoSQL</h4>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#key-value-store">Key-value store</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#document-store">Document store</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#wide-column-store">Wide column store</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#graph-database">Graph database</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sql-or-nosql">SQL vs NoSQL</a></li>
</ul>
<h3>Caching</h3>
<ul>
<li>Where to cache<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#client-caching">Client caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#cdn-caching">CDN caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#web-server-caching">Web server caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#database-caching">Database caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#application-caching">Application caching</a></li>
</ul>
</li>
<li>What to cache<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#caching-at-the-database-query-level">Caching at the database query level</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#caching-at-the-object-level">Caching at the object level</a></li>
</ul>
</li>
<li>When to update the cache<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#cache-aside">Cache-aside</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#write-through">Write-through</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#write-behind-write-back">Write-behind (write-back)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#refresh-ahead">Refresh ahead</a></li>
</ul>
</li>
</ul>
<h3>Asynchronism and microservices</h3>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#message-queues">Message queues</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#task-queues">Task queues</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#back-pressure">Back pressure</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#microservices">Microservices</a></li>
</ul>
<h3>Communications</h3>
<ul>
<li>Discuss tradeoffs:<ul>
<li>External communication with clients - <a href="https://github.com/donnemartin/system-design-primer#representational-state-transfer-rest">HTTP APIs following REST</a></li>
<li>Internal communications - <a href="https://github.com/donnemartin/system-design-primer#remote-procedure-call-rpc">RPC</a></li>
</ul>
</li>
<li><a href="https://github.com/donnemartin/system-design-primer#service-discovery">Service discovery</a></li>
</ul>
<h3>Security</h3>
<p>Refer to the <a href="https://github.com/donnemartin/system-design-primer#security">security section</a>.</p>
<h3>Latency numbers</h3>
<p>See <a href="https://github.com/donnemartin/system-design-primer#latency-numbers-every-programmer-should-know">Latency numbers every programmer should know</a>.</p>
<h3>Ongoing</h3>
<ul>
<li>Continue benchmarking and monitoring your system to address bottlenecks as they come up</li>
<li>Scaling is an iterative process</li>
</ul>

</div>
`,
quiz:{q:'Since syncing bank data is slow and prone to timeouts, how should the architecture handle user data updates?', opts:['Fetch data synchronously while the user looks at a loading spinner', 'Use asynchronous background workers and task queues to fetch data, then notify the user', 'Store all bank data in a CDN', 'Use a Write-Through cache'], a:1, why:'Third-party API calls are unpredictable. Moving them to a background worker queue prevents the web server from blocking and ensures retries if the bank API is down.'}
},
{
id: 'social-graph', group: 'Interview prep (Deep dives)', title: 'Design the data structures for a social network', nav: 'the',
html: `
<p class="eyebrow">Interview prep · Deep dive</p>
<h1>Design the data structures for a social network</h1>
<p class="lede">A deep dive into system architecture from the Primer.</p>

<div class="eli5"><span class="tag">In plain English</span>
<p>Think of a map of airline flights. The cities are the users (Nodes), and the flights connecting them are their friendships (Edges). Finding "friends of friends" means looking for all cities you can reach with exactly two flights. A Graph Database is designed specifically to trace these paths efficiently, unlike a traditional spreadsheet where finding paths is a nightmare.</p>
</div>

<div class="deep-divider">The full picture</div>
<div class="lesson">

<p><em>Note: This document links directly to relevant areas found in the <a href="https://github.com/donnemartin/system-design-primer#index-of-system-design-topics">system design topics</a> to avoid duplication.  Refer to the linked content for general talking points, tradeoffs, and alternatives.</em></p>
<h2>Step 1: Outline use cases and constraints</h2>
<blockquote>
<p>Gather requirements and scope the problem.
Ask questions to clarify use cases and constraints.
Discuss assumptions.</p>
</blockquote>
<p>Without an interviewer to address clarifying questions, we&#39;ll define some use cases and constraints.</p>
<h3>Use cases</h3>
<h4>We&#39;ll scope the problem to handle only the following use cases</h4>
<ul>
<li><strong>User</strong> searches for someone and sees the shortest path to the searched person</li>
<li><strong>Service</strong> has high availability</li>
</ul>
<h3>Constraints and assumptions</h3>
<h4>State assumptions</h4>
<ul>
<li>Traffic is not evenly distributed<ul>
<li>Some searches are more popular than others, while others are only executed once</li>
</ul>
</li>
<li>Graph data won&#39;t fit on a single machine</li>
<li>Graph edges are unweighted</li>
<li>100 million users</li>
<li>50 friends per user average</li>
<li>1 billion friend searches per month</li>
</ul>
<p>Exercise the use of more traditional systems - don&#39;t use graph-specific solutions such as <a href="http://graphql.org/">GraphQL</a> or a graph database like <a href="https://neo4j.com/">Neo4j</a></p>
<h4>Calculate usage</h4>
<p><strong>Clarify with your interviewer if you should run back-of-the-envelope usage calculations.</strong></p>
<ul>
<li>5 billion friend relationships<ul>
<li>100 million users * 50 friends per user average</li>
</ul>
</li>
<li>400 search requests per second</li>
</ul>
<p>Handy conversion guide:</p>
<ul>
<li>2.5 million seconds per month</li>
<li>1 request per second = 2.5 million requests per month</li>
<li>40 requests per second = 100 million requests per month</li>
<li>400 requests per second = 1 billion requests per month</li>
</ul>
<h2>Step 2: Create a high level design</h2>
<blockquote>
<p>Outline a high level design with all important components.</p>
</blockquote>
<p><img src="http://i.imgur.com/wxXyq2J.png" alt="Imgur"></p>
<h2>Step 3: Design core components</h2>
<blockquote>
<p>Dive into details for each core component.</p>
</blockquote>
<h3>Use case: User searches for someone and sees the shortest path to the searched person</h3>
<p><strong>Clarify with your interviewer how much code you are expected to write</strong>.</p>
<p>Without the constraint of millions of users (vertices) and billions of friend relationships (edges), we could solve this unweighted shortest path task with a general BFS approach:</p>
<pre><code class="language-python">class Graph(Graph):

    def shortest_path(self, source, dest):
        if source is None or dest is None:
            return None
        if source is dest:
            return [source.key]
        prev_node_keys = self._shortest_path(source, dest)
        if prev_node_keys is None:
            return None
        else:
            path_ids = [dest.key]
            prev_node_key = prev_node_keys[dest.key]
            while prev_node_key is not None:
                path_ids.append(prev_node_key)
                prev_node_key = prev_node_keys[prev_node_key]
            return path_ids[::-1]

    def _shortest_path(self, source, dest):
        queue = deque()
        queue.append(source)
        prev_node_keys = {source.key: None}
        source.visit_state = State.visited
        while queue:
            node = queue.popleft()
            if node is dest:
                return prev_node_keys
            prev_node = node
            for adj_node in node.adj_nodes.values():
                if adj_node.visit_state == State.unvisited:
                    queue.append(adj_node)
                    prev_node_keys[adj_node.key] = prev_node.key
                    adj_node.visit_state = State.visited
        return None
</code></pre>
<p>We won&#39;t be able to fit all users on the same machine, we&#39;ll need to <a href="https://github.com/donnemartin/system-design-primer#sharding">shard</a> users across <strong>Person Servers</strong> and access them with a <strong>Lookup Service</strong>.</p>
<ul>
<li>The <strong>Client</strong> sends a request to the <strong>Web Server</strong>, running as a <a href="https://github.com/donnemartin/system-design-primer#reverse-proxy-web-server">reverse proxy</a></li>
<li>The <strong>Web Server</strong> forwards the request to the <strong>Search API</strong> server</li>
<li>The <strong>Search API</strong> server forwards the request to the <strong>User Graph Service</strong></li>
<li>The <strong>User Graph Service</strong> does the following:<ul>
<li>Uses the <strong>Lookup Service</strong> to find the <strong>Person Server</strong> where the current user&#39;s info is stored</li>
<li>Finds the appropriate <strong>Person Server</strong> to retrieve the current user&#39;s list of <code>friend_ids</code></li>
<li>Runs a BFS search using the current user as the <code>source</code> and the current user&#39;s <code>friend_ids</code> as the ids for each <code>adjacent_node</code></li>
<li>To get the <code>adjacent_node</code> from a given id:<ul>
<li>The <strong>User Graph Service</strong> will <em>again</em> need to communicate with the <strong>Lookup Service</strong> to determine which <strong>Person Server</strong> stores the<code>adjacent_node</code> matching the given id (potential for optimization)</li>
</ul>
</li>
</ul>
</li>
</ul>
<p><strong>Clarify with your interviewer how much code you should be writing</strong>.</p>
<p><strong>Note</strong>: Error handling is excluded below for simplicity.  Ask if you should code proper error handing.</p>
<p><strong>Lookup Service</strong> implementation:</p>
<pre><code class="language-python">class LookupService(object):

    def __init__(self):
        self.lookup = self._init_lookup()  # key: person_id, value: person_server

    def _init_lookup(self):
        ...

    def lookup_person_server(self, person_id):
        return self.lookup[person_id]
</code></pre>
<p><strong>Person Server</strong> implementation:</p>
<pre><code class="language-python">class PersonServer(object):

    def __init__(self):
        self.people = {}  # key: person_id, value: person

    def add_person(self, person):
        ...

    def people(self, ids):
        results = []
        for id in ids:
            if id in self.people:
                results.append(self.people[id])
        return results
</code></pre>
<p><strong>Person</strong> implementation:</p>
<pre><code class="language-python">class Person(object):

    def __init__(self, id, name, friend_ids):
        self.id = id
        self.name = name
        self.friend_ids = friend_ids
</code></pre>
<p><strong>User Graph Service</strong> implementation:</p>
<pre><code class="language-python">class UserGraphService(object):

    def __init__(self, lookup_service):
        self.lookup_service = lookup_service

    def person(self, person_id):
        person_server = self.lookup_service.lookup_person_server(person_id)
        return person_server.people([person_id])

    def shortest_path(self, source_key, dest_key):
        if source_key is None or dest_key is None:
            return None
        if source_key is dest_key:
            return [source_key]
        prev_node_keys = self._shortest_path(source_key, dest_key)
        if prev_node_keys is None:
            return None
        else:
            # Iterate through the path_ids backwards, starting at dest_key
            path_ids = [dest_key]
            prev_node_key = prev_node_keys[dest_key]
            while prev_node_key is not None:
                path_ids.append(prev_node_key)
                prev_node_key = prev_node_keys[prev_node_key]
            # Reverse the list since we iterated backwards
            return path_ids[::-1]

    def _shortest_path(self, source_key, dest_key, path):
        # Use the id to get the Person
        source = self.person(source_key)
        # Update our bfs queue
        queue = deque()
        queue.append(source)
        # prev_node_keys keeps track of each hop from
        # the source_key to the dest_key
        prev_node_keys = {source_key: None}
        # We&#39;ll use visited_ids to keep track of which nodes we&#39;ve
        # visited, which can be different from a typical bfs where
        # this can be stored in the node itself
        visited_ids = set()
        visited_ids.add(source.id)
        while queue:
            node = queue.popleft()
            if node.key is dest_key:
                return prev_node_keys
            prev_node = node
            for friend_id in node.friend_ids:
                if friend_id not in visited_ids:
                    friend_node = self.person(friend_id)
                    queue.append(friend_node)
                    prev_node_keys[friend_id] = prev_node.key
                    visited_ids.add(friend_id)
        return None
</code></pre>
<p>We&#39;ll use a public <a href="https://github.com/donnemartin/system-design-primer#representational-state-transfer-rest"><strong>REST API</strong></a>:</p>
<pre><code>$ curl https://social.com/api/v1/friend_search?person_id=1234
</code></pre>
<p>Response:</p>
<pre><code>{
    &quot;person_id&quot;: &quot;100&quot;,
    &quot;name&quot;: &quot;foo&quot;,
    &quot;link&quot;: &quot;https://social.com/foo&quot;,
},
{
    &quot;person_id&quot;: &quot;53&quot;,
    &quot;name&quot;: &quot;bar&quot;,
    &quot;link&quot;: &quot;https://social.com/bar&quot;,
},
{
    &quot;person_id&quot;: &quot;1234&quot;,
    &quot;name&quot;: &quot;baz&quot;,
    &quot;link&quot;: &quot;https://social.com/baz&quot;,
},
</code></pre>
<p>For internal communications, we could use <a href="https://github.com/donnemartin/system-design-primer#remote-procedure-call-rpc">Remote Procedure Calls</a>.</p>
<h2>Step 4: Scale the design</h2>
<blockquote>
<p>Identify and address bottlenecks, given the constraints.</p>
</blockquote>
<p><img src="http://i.imgur.com/cdCv5g7.png" alt="Imgur"></p>
<p><strong>Important: Do not simply jump right into the final design from the initial design!</strong></p>
<p>State you would 1) <strong>Benchmark/Load Test</strong>, 2) <strong>Profile</strong> for bottlenecks 3) address bottlenecks while evaluating alternatives and trade-offs, and 4) repeat.  See <a href="../scaling_aws/README.md">Design a system that scales to millions of users on AWS</a> as a sample on how to iteratively scale the initial design.</p>
<p>It&#39;s important to discuss what bottlenecks you might encounter with the initial design and how you might address each of them.  For example, what issues are addressed by adding a <strong>Load Balancer</strong> with multiple <strong>Web Servers</strong>?  <strong>CDN</strong>?  <strong>Master-Slave Replicas</strong>?  What are the alternatives and <strong>Trade-Offs</strong> for each?</p>
<p>We&#39;ll introduce some components to complete the design and to address scalability issues.  Internal load balancers are not shown to reduce clutter.</p>
<p><em>To avoid repeating discussions</em>, refer to the following <a href="https://github.com/donnemartin/system-design-primer#index-of-system-design-topics">system design topics</a> for main talking points, tradeoffs, and alternatives:</p>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#domain-name-system">DNS</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#load-balancer">Load balancer</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#horizontal-scaling">Horizontal scaling</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#reverse-proxy-web-server">Web server (reverse proxy)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#application-layer">API server (application layer)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#cache">Cache</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#consistency-patterns">Consistency patterns</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#availability-patterns">Availability patterns</a></li>
</ul>
<p>To address the constraint of 400 <em>average</em> read requests per second (higher at peak), person data can be served from a <strong>Memory Cache</strong> such as Redis or Memcached to reduce response times and to reduce traffic to downstream services.  This could be especially useful for people who do multiple searches in succession and for people who are well-connected.  Reading 1 MB sequentially from memory takes about 250 microseconds, while reading from SSD takes 4x and from disk takes 80x longer.<sup><a href=https://github.com/donnemartin/system-design-primer#latency-numbers-every-programmer-should-know>1</a></sup></p>
<p>Below are further optimizations:</p>
<ul>
<li>Store complete or partial BFS traversals to speed up subsequent lookups in the <strong>Memory Cache</strong></li>
<li>Batch compute offline then store complete or partial BFS traversals to speed up subsequent lookups in a <strong>NoSQL Database</strong></li>
<li>Reduce machine jumps by batching together friend lookups hosted on the same <strong>Person Server</strong><ul>
<li><a href="https://github.com/donnemartin/system-design-primer#sharding">Shard</a> <strong>Person Servers</strong> by location to further improve this, as friends generally live closer to each other</li>
</ul>
</li>
<li>Do two BFS searches at the same time, one starting from the source, and one from the destination, then merge the two paths</li>
<li>Start the BFS search from people with large numbers of friends, as they are more likely to reduce the number of <a href="https://en.wikipedia.org/wiki/Six_degrees_of_separation">degrees of separation</a> between the current user and the search target</li>
<li>Set a limit based on time or number of hops before asking the user if they want to continue searching, as searching could take a considerable amount of time in some cases</li>
<li>Use a <strong>Graph Database</strong> such as <a href="https://neo4j.com/">Neo4j</a> or a graph-specific query language such as <a href="http://graphql.org/">GraphQL</a> (if there were no constraint preventing the use of <strong>Graph Databases</strong>)</li>
</ul>
<h2>Additional talking points</h2>
<blockquote>
<p>Additional topics to dive into, depending on the problem scope and time remaining.</p>
</blockquote>
<h3>SQL scaling patterns</h3>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#master-slave-replication">Read replicas</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#federation">Federation</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sharding">Sharding</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#denormalization">Denormalization</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sql-tuning">SQL Tuning</a></li>
</ul>
<h4>NoSQL</h4>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#key-value-store">Key-value store</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#document-store">Document store</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#wide-column-store">Wide column store</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#graph-database">Graph database</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sql-or-nosql">SQL vs NoSQL</a></li>
</ul>
<h3>Caching</h3>
<ul>
<li>Where to cache<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#client-caching">Client caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#cdn-caching">CDN caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#web-server-caching">Web server caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#database-caching">Database caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#application-caching">Application caching</a></li>
</ul>
</li>
<li>What to cache<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#caching-at-the-database-query-level">Caching at the database query level</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#caching-at-the-object-level">Caching at the object level</a></li>
</ul>
</li>
<li>When to update the cache<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#cache-aside">Cache-aside</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#write-through">Write-through</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#write-behind-write-back">Write-behind (write-back)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#refresh-ahead">Refresh ahead</a></li>
</ul>
</li>
</ul>
<h3>Asynchronism and microservices</h3>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#message-queues">Message queues</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#task-queues">Task queues</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#back-pressure">Back pressure</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#microservices">Microservices</a></li>
</ul>
<h3>Communications</h3>
<ul>
<li>Discuss tradeoffs:<ul>
<li>External communication with clients - <a href="https://github.com/donnemartin/system-design-primer#representational-state-transfer-rest">HTTP APIs following REST</a></li>
<li>Internal communications - <a href="https://github.com/donnemartin/system-design-primer#remote-procedure-call-rpc">RPC</a></li>
</ul>
</li>
<li><a href="https://github.com/donnemartin/system-design-primer#service-discovery">Service discovery</a></li>
</ul>
<h3>Security</h3>
<p>Refer to the <a href="https://github.com/donnemartin/system-design-primer#security">security section</a>.</p>
<h3>Latency numbers</h3>
<p>See <a href="https://github.com/donnemartin/system-design-primer#latency-numbers-every-programmer-should-know">Latency numbers every programmer should know</a>.</p>
<h3>Ongoing</h3>
<ul>
<li>Continue benchmarking and monitoring your system to address bottlenecks as they come up</li>
<li>Scaling is an iterative process</li>
</ul>

</div>
`,
quiz:{q:'What is the primary advantage of using a Graph Database over a Relational Database for a social network?', opts:['Graph databases are always faster at simple key lookups', 'They are strictly ACID compliant', 'They traverse deep relationships (like "friends of friends of friends") much faster without complex JOINs', 'They automatically cache images'], a:2, why:'Relational DBs require expensive JOIN operations for every degree of separation. Graph DBs store relationships as first-class citizens, making deep traversal operations vastly faster.'}
},
{
id: 'query-cache', group: 'Interview prep (Deep dives)', title: 'Design a key-value store for a search engine', nav: 'a',
html: `
<p class="eyebrow">Interview prep · Deep dive</p>
<h1>Design a key-value store for a search engine</h1>
<p class="lede">A deep dive into system architecture from the Primer.</p>

<div class="eli5"><span class="tag">In plain English</span>
<p>You run a busy library help desk. People constantly ask for the same books (search queries). Instead of walking to the shelves (database) every time, you keep the 100 most requested books right on your desk. A query cache is just that desk: storing the most common database results in fast memory so you don't have to do the heavy lifting twice.</p>
</div>

<div class="deep-divider">The full picture</div>
<div class="lesson">

<p><em>Note: This document links directly to relevant areas found in the <a href="https://github.com/donnemartin/system-design-primer#index-of-system-design-topics">system design topics</a> to avoid duplication.  Refer to the linked content for general talking points, tradeoffs, and alternatives.</em></p>
<h2>Step 1: Outline use cases and constraints</h2>
<blockquote>
<p>Gather requirements and scope the problem.
Ask questions to clarify use cases and constraints.
Discuss assumptions.</p>
</blockquote>
<p>Without an interviewer to address clarifying questions, we&#39;ll define some use cases and constraints.</p>
<h3>Use cases</h3>
<h4>We&#39;ll scope the problem to handle only the following use cases</h4>
<ul>
<li><strong>User</strong> sends a search request resulting in a cache hit</li>
<li><strong>User</strong> sends a search request resulting in a cache miss</li>
<li><strong>Service</strong> has high availability</li>
</ul>
<h3>Constraints and assumptions</h3>
<h4>State assumptions</h4>
<ul>
<li>Traffic is not evenly distributed<ul>
<li>Popular queries should almost always be in the cache</li>
<li>Need to determine how to expire/refresh</li>
</ul>
</li>
<li>Serving from cache requires fast lookups</li>
<li>Low latency between machines</li>
<li>Limited memory in cache<ul>
<li>Need to determine what to keep/remove</li>
<li>Need to cache millions of queries</li>
</ul>
</li>
<li>10 million users</li>
<li>10 billion queries per month</li>
</ul>
<h4>Calculate usage</h4>
<p><strong>Clarify with your interviewer if you should run back-of-the-envelope usage calculations.</strong></p>
<ul>
<li>Cache stores ordered list of key: query, value: results<ul>
<li><code>query</code> - 50 bytes</li>
<li><code>title</code> - 20 bytes</li>
<li><code>snippet</code> - 200 bytes</li>
<li>Total: 270 bytes</li>
</ul>
</li>
<li>2.7 TB of cache data per month if all 10 billion queries are unique and all are stored<ul>
<li>270 bytes per search * 10 billion searches per month</li>
<li>Assumptions state limited memory, need to determine how to expire contents</li>
</ul>
</li>
<li>4,000 requests per second</li>
</ul>
<p>Handy conversion guide:</p>
<ul>
<li>2.5 million seconds per month</li>
<li>1 request per second = 2.5 million requests per month</li>
<li>40 requests per second = 100 million requests per month</li>
<li>400 requests per second = 1 billion requests per month</li>
</ul>
<h2>Step 2: Create a high level design</h2>
<blockquote>
<p>Outline a high level design with all important components.</p>
</blockquote>
<p><img src="http://i.imgur.com/KqZ3dSx.png" alt="Imgur"></p>
<h2>Step 3: Design core components</h2>
<blockquote>
<p>Dive into details for each core component.</p>
</blockquote>
<h3>Use case: User sends a request resulting in a cache hit</h3>
<p>Popular queries can be served from a <strong>Memory Cache</strong> such as Redis or Memcached to reduce read latency and to avoid overloading the <strong>Reverse Index Service</strong> and <strong>Document Service</strong>.  Reading 1 MB sequentially from memory takes about 250 microseconds, while reading from SSD takes 4x and from disk takes 80x longer.<sup><a href=https://github.com/donnemartin/system-design-primer#latency-numbers-every-programmer-should-know>1</a></sup></p>
<p>Since the cache has limited capacity, we&#39;ll use a least recently used (LRU) approach to expire older entries.</p>
<ul>
<li>The <strong>Client</strong> sends a request to the <strong>Web Server</strong>, running as a <a href="https://github.com/donnemartin/system-design-primer#reverse-proxy-web-server">reverse proxy</a></li>
<li>The <strong>Web Server</strong> forwards the request to the <strong>Query API</strong> server</li>
<li>The <strong>Query API</strong> server does the following:<ul>
<li>Parses the query<ul>
<li>Removes markup</li>
<li>Breaks up the text into terms</li>
<li>Fixes typos</li>
<li>Normalizes capitalization</li>
<li>Converts the query to use boolean operations</li>
</ul>
</li>
<li>Checks the <strong>Memory Cache</strong> for the content matching the query<ul>
<li>If there&#39;s a hit in the <strong>Memory Cache</strong>, the <strong>Memory Cache</strong> does the following:<ul>
<li>Updates the cached entry&#39;s position to the front of the LRU list</li>
<li>Returns the cached contents</li>
</ul>
</li>
<li>Else, the <strong>Query API</strong> does the following:<ul>
<li>Uses the <strong>Reverse Index Service</strong> to find documents matching the query<ul>
<li>The <strong>Reverse Index Service</strong> ranks the matching results and returns the top ones</li>
</ul>
</li>
<li>Uses the <strong>Document Service</strong> to return titles and snippets</li>
<li>Updates the <strong>Memory Cache</strong> with the contents, placing the entry at the front of the LRU list</li>
</ul>
</li>
</ul>
</li>
</ul>
</li>
</ul>
<h4>Cache implementation</h4>
<p>The cache can use a doubly-linked list: new items will be added to the head while items to expire will be removed from the tail.  We&#39;ll use a hash table for fast lookups to each linked list node.</p>
<p><strong>Clarify with your interviewer how much code you are expected to write</strong>.</p>
<p><strong>Query API Server</strong> implementation:</p>
<pre><code class="language-python">class QueryApi(object):

    def __init__(self, memory_cache, reverse_index_service):
        self.memory_cache = memory_cache
        self.reverse_index_service = reverse_index_service

    def parse_query(self, query):
        &quot;&quot;&quot;Remove markup, break text into terms, deal with typos,
        normalize capitalization, convert to use boolean operations.
        &quot;&quot;&quot;
        ...

    def process_query(self, query):
        query = self.parse_query(query)
        results = self.memory_cache.get(query)
        if results is None:
            results = self.reverse_index_service.process_search(query)
            self.memory_cache.set(query, results)
        return results
</code></pre>
<p><strong>Node</strong> implementation:</p>
<pre><code class="language-python">class Node(object):

    def __init__(self, query, results):
        self.query = query
        self.results = results
</code></pre>
<p><strong>LinkedList</strong> implementation:</p>
<pre><code class="language-python">class LinkedList(object):

    def __init__(self):
        self.head = None
        self.tail = None

    def move_to_front(self, node):
        ...

    def append_to_front(self, node):
        ...

    def remove_from_tail(self):
        ...
</code></pre>
<p><strong>Cache</strong> implementation:</p>
<pre><code class="language-python">class Cache(object):

    def __init__(self, MAX_SIZE):
        self.MAX_SIZE = MAX_SIZE
        self.size = 0
        self.lookup = {}  # key: query, value: node
        self.linked_list = LinkedList()

    def get(self, query)
        &quot;&quot;&quot;Get the stored query result from the cache.

        Accessing a node updates its position to the front of the LRU list.
        &quot;&quot;&quot;
        node = self.lookup[query]
        if node is None:
            return None
        self.linked_list.move_to_front(node)
        return node.results

    def set(self, results, query):
        &quot;&quot;&quot;Set the result for the given query key in the cache.

        When updating an entry, updates its position to the front of the LRU list.
        If the entry is new and the cache is at capacity, removes the oldest entry
        before the new entry is added.
        &quot;&quot;&quot;
        node = self.lookup[query]
        if node is not None:
            # Key exists in cache, update the value
            node.results = results
            self.linked_list.move_to_front(node)
        else:
            # Key does not exist in cache
            if self.size == self.MAX_SIZE:
                # Remove the oldest entry from the linked list and lookup
                self.lookup.pop(self.linked_list.tail.query, None)
                self.linked_list.remove_from_tail()
            else:
                self.size += 1
            # Add the new key and value
            new_node = Node(query, results)
            self.linked_list.append_to_front(new_node)
            self.lookup[query] = new_node
</code></pre>
<h4>When to update the cache</h4>
<p>The cache should be updated when:</p>
<ul>
<li>The page contents change</li>
<li>The page is removed or a new page is added</li>
<li>The page rank changes</li>
</ul>
<p>The most straightforward way to handle these cases is to simply set a max time that a cached entry can stay in the cache before it is updated, usually referred to as time to live (TTL).</p>
<p>Refer to <a href="https://github.com/donnemartin/system-design-primer#when-to-update-the-cache">When to update the cache</a> for tradeoffs and alternatives.  The approach above describes <a href="https://github.com/donnemartin/system-design-primer#cache-aside">cache-aside</a>.</p>
<h2>Step 4: Scale the design</h2>
<blockquote>
<p>Identify and address bottlenecks, given the constraints.</p>
</blockquote>
<p><img src="http://i.imgur.com/4j99mhe.png" alt="Imgur"></p>
<p><strong>Important: Do not simply jump right into the final design from the initial design!</strong></p>
<p>State you would 1) <strong>Benchmark/Load Test</strong>, 2) <strong>Profile</strong> for bottlenecks 3) address bottlenecks while evaluating alternatives and trade-offs, and 4) repeat.  See <a href="../scaling_aws/README.md">Design a system that scales to millions of users on AWS</a> as a sample on how to iteratively scale the initial design.</p>
<p>It&#39;s important to discuss what bottlenecks you might encounter with the initial design and how you might address each of them.  For example, what issues are addressed by adding a <strong>Load Balancer</strong> with multiple <strong>Web Servers</strong>?  <strong>CDN</strong>?  <strong>Master-Slave Replicas</strong>?  What are the alternatives and <strong>Trade-Offs</strong> for each?</p>
<p>We&#39;ll introduce some components to complete the design and to address scalability issues.  Internal load balancers are not shown to reduce clutter.</p>
<p><em>To avoid repeating discussions</em>, refer to the following <a href="https://github.com/donnemartin/system-design-primer#index-of-system-design-topics">system design topics</a> for main talking points, tradeoffs, and alternatives:</p>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#domain-name-system">DNS</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#load-balancer">Load balancer</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#horizontal-scaling">Horizontal scaling</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#reverse-proxy-web-server">Web server (reverse proxy)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#application-layer">API server (application layer)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#cache">Cache</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#consistency-patterns">Consistency patterns</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#availability-patterns">Availability patterns</a></li>
</ul>
<h3>Expanding the Memory Cache to many machines</h3>
<p>To handle the heavy request load and the large amount of memory needed, we&#39;ll scale horizontally.  We have three main options on how to store the data on our <strong>Memory Cache</strong> cluster:</p>
<ul>
<li><strong>Each machine in the cache cluster has its own cache</strong> - Simple, although it will likely result in a low cache hit rate.</li>
<li><strong>Each machine in the cache cluster has a copy of the cache</strong> - Simple, although it is an inefficient use of memory.</li>
<li><strong>The cache is <a href="https://github.com/donnemartin/system-design-primer#sharding">sharded</a> across all machines in the cache cluster</strong> - More complex, although it is likely the best option.  We could use hashing to determine which machine could have the cached results of a query using <code>machine = hash(query)</code>.  We&#39;ll likely want to use <a href="https://github.com/donnemartin/system-design-primer#under-development">consistent hashing</a>.</li>
</ul>
<h2>Additional talking points</h2>
<blockquote>
<p>Additional topics to dive into, depending on the problem scope and time remaining.</p>
</blockquote>
<h3>SQL scaling patterns</h3>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#master-slave-replication">Read replicas</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#federation">Federation</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sharding">Sharding</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#denormalization">Denormalization</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sql-tuning">SQL Tuning</a></li>
</ul>
<h4>NoSQL</h4>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#key-value-store">Key-value store</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#document-store">Document store</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#wide-column-store">Wide column store</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#graph-database">Graph database</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sql-or-nosql">SQL vs NoSQL</a></li>
</ul>
<h3>Caching</h3>
<ul>
<li>Where to cache<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#client-caching">Client caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#cdn-caching">CDN caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#web-server-caching">Web server caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#database-caching">Database caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#application-caching">Application caching</a></li>
</ul>
</li>
<li>What to cache<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#caching-at-the-database-query-level">Caching at the database query level</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#caching-at-the-object-level">Caching at the object level</a></li>
</ul>
</li>
<li>When to update the cache<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#cache-aside">Cache-aside</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#write-through">Write-through</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#write-behind-write-back">Write-behind (write-back)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#refresh-ahead">Refresh ahead</a></li>
</ul>
</li>
</ul>
<h3>Asynchronism and microservices</h3>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#message-queues">Message queues</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#task-queues">Task queues</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#back-pressure">Back pressure</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#microservices">Microservices</a></li>
</ul>
<h3>Communications</h3>
<ul>
<li>Discuss tradeoffs:<ul>
<li>External communication with clients - <a href="https://github.com/donnemartin/system-design-primer#representational-state-transfer-rest">HTTP APIs following REST</a></li>
<li>Internal communications - <a href="https://github.com/donnemartin/system-design-primer#remote-procedure-call-rpc">RPC</a></li>
</ul>
</li>
<li><a href="https://github.com/donnemartin/system-design-primer#service-discovery">Service discovery</a></li>
</ul>
<h3>Security</h3>
<p>Refer to the <a href="https://github.com/donnemartin/system-design-primer#security">security section</a>.</p>
<h3>Latency numbers</h3>
<p>See <a href="https://github.com/donnemartin/system-design-primer#latency-numbers-every-programmer-should-know">Latency numbers every programmer should know</a>.</p>
<h3>Ongoing</h3>
<ul>
<li>Continue benchmarking and monitoring your system to address bottlenecks as they come up</li>
<li>Scaling is an iterative process</li>
</ul>

</div>
`,
quiz:{q:'When designing a query cache, which eviction policy is most commonly used to make room for new queries when the cache is full?', opts:['First-In-First-Out (FIFO)', 'Least Recently Used (LRU)', 'Random Replacement', 'Last-In-First-Out (LIFO)'], a:1, why:'LRU naturally keeps popular, frequently-requested items in the cache while dropping items that havent been searched for in a while, matching human search patterns perfectly.'}
},
{
id: 'sales-rank', group: 'Interview prep (Deep dives)', title: 'Design Amazon\'s sales ranking by category feature', nav: 'Amazon's',
html: `
<p class="eyebrow">Interview prep · Deep dive</p>
<h1>Design Amazon's sales ranking by category feature</h1>
<p class="lede">A deep dive into system architecture from the Primer.</p>

<div class="eli5"><span class="tag">In plain English</span>
<p>During an election, you don't count every single vote in the country instantly on one giant whiteboard. Each town counts its votes (local aggregators), sends the totals to the state (regional aggregators), which sends them to the capital. Amazon sales rank works similarly: purchases are batched and aggregated in steps using MapReduce, rather than updating a global leaderboard for every single transaction.</p>
</div>

<div class="deep-divider">The full picture</div>
<div class="lesson">

<p><em>Note: This document links directly to relevant areas found in the <a href="https://github.com/donnemartin/system-design-primer#index-of-system-design-topics">system design topics</a> to avoid duplication.  Refer to the linked content for general talking points, tradeoffs, and alternatives.</em></p>
<h2>Step 1: Outline use cases and constraints</h2>
<blockquote>
<p>Gather requirements and scope the problem.
Ask questions to clarify use cases and constraints.
Discuss assumptions.</p>
</blockquote>
<p>Without an interviewer to address clarifying questions, we&#39;ll define some use cases and constraints.</p>
<h3>Use cases</h3>
<h4>We&#39;ll scope the problem to handle only the following use case</h4>
<ul>
<li><strong>Service</strong> calculates the past week&#39;s most popular products by category</li>
<li><strong>User</strong> views the past week&#39;s most popular products by category</li>
<li><strong>Service</strong> has high availability</li>
</ul>
<h4>Out of scope</h4>
<ul>
<li>The general e-commerce site<ul>
<li>Design components only for calculating sales rank</li>
</ul>
</li>
</ul>
<h3>Constraints and assumptions</h3>
<h4>State assumptions</h4>
<ul>
<li>Traffic is not evenly distributed</li>
<li>Items can be in multiple categories</li>
<li>Items cannot change categories</li>
<li>There are no subcategories ie <code>foo/bar/baz</code></li>
<li>Results must be updated hourly<ul>
<li>More popular products might need to be updated more frequently</li>
</ul>
</li>
<li>10 million products</li>
<li>1000 categories</li>
<li>1 billion transactions per month</li>
<li>100 billion read requests per month</li>
<li>100:1 read to write ratio</li>
</ul>
<h4>Calculate usage</h4>
<p><strong>Clarify with your interviewer if you should run back-of-the-envelope usage calculations.</strong></p>
<ul>
<li>Size per transaction:<ul>
<li><code>created_at</code> - 5 bytes</li>
<li><code>product_id</code> - 8 bytes</li>
<li><code>category_id</code> - 4 bytes</li>
<li><code>seller_id</code> - 8 bytes</li>
<li><code>buyer_id</code> - 8 bytes</li>
<li><code>quantity</code> - 4 bytes</li>
<li><code>total_price</code> - 5 bytes</li>
<li>Total: ~40 bytes</li>
</ul>
</li>
<li>40 GB of new transaction content per month<ul>
<li>40 bytes per transaction * 1 billion transactions per month</li>
<li>1.44 TB of new transaction content in 3 years</li>
<li>Assume most are new transactions instead of updates to existing ones</li>
</ul>
</li>
<li>400 transactions per second on average</li>
<li>40,000 read requests per second on average</li>
</ul>
<p>Handy conversion guide:</p>
<ul>
<li>2.5 million seconds per month</li>
<li>1 request per second = 2.5 million requests per month</li>
<li>40 requests per second = 100 million requests per month</li>
<li>400 requests per second = 1 billion requests per month</li>
</ul>
<h2>Step 2: Create a high level design</h2>
<blockquote>
<p>Outline a high level design with all important components.</p>
</blockquote>
<p><img src="http://i.imgur.com/vwMa1Qu.png" alt="Imgur"></p>
<h2>Step 3: Design core components</h2>
<blockquote>
<p>Dive into details for each core component.</p>
</blockquote>
<h3>Use case: Service calculates the past week&#39;s most popular products by category</h3>
<p>We could store the raw <strong>Sales API</strong> server log files on a managed <strong>Object Store</strong> such as Amazon S3, rather than managing our own distributed file system.</p>
<p><strong>Clarify with your interviewer how much code you are expected to write</strong>.</p>
<p>We&#39;ll assume this is a sample log entry, tab delimited:</p>
<pre><code>timestamp   product_id  category_id    qty     total_price   seller_id    buyer_id
t1          product1    category1      2       20.00         1            1
t2          product1    category2      2       20.00         2            2
t2          product1    category2      1       10.00         2            3
t3          product2    category1      3        7.00         3            4
t4          product3    category2      7        2.00         4            5
t5          product4    category1      1        5.00         5            6
...
</code></pre>
<p>The <strong>Sales Rank Service</strong> could use <strong>MapReduce</strong>, using the <strong>Sales API</strong> server log files as input and writing the results to an aggregate table <code>sales_rank</code> in a <strong>SQL Database</strong>.  We should discuss the <a href="https://github.com/donnemartin/system-design-primer#sql-or-nosql">use cases and tradeoffs between choosing SQL or NoSQL</a>.</p>
<p>We&#39;ll use a multi-step <strong>MapReduce</strong>:</p>
<ul>
<li><strong>Step 1</strong> - Transform the data to <code>(category, product_id), sum(quantity)</code></li>
<li><strong>Step 2</strong> - Perform a distributed sort</li>
</ul>
<pre><code class="language-python">class SalesRanker(MRJob):

    def within_past_week(self, timestamp):
        &quot;&quot;&quot;Return True if timestamp is within past week, False otherwise.&quot;&quot;&quot;
        ...

    def mapper(self, _ line):
        &quot;&quot;&quot;Parse each log line, extract and transform relevant lines.

        Emit key value pairs of the form:

        (category1, product1), 2
        (category2, product1), 2
        (category2, product1), 1
        (category1, product2), 3
        (category2, product3), 7
        (category1, product4), 1
        &quot;&quot;&quot;
        timestamp, product_id, category_id, quantity, total_price, seller_id, \
            buyer_id = line.split(&#39;\t&#39;)
        if self.within_past_week(timestamp):
            yield (category_id, product_id), quantity

    def reducer(self, key, value):
        &quot;&quot;&quot;Sum values for each key.

        (category1, product1), 2
        (category2, product1), 3
        (category1, product2), 3
        (category2, product3), 7
        (category1, product4), 1
        &quot;&quot;&quot;
        yield key, sum(values)

    def mapper_sort(self, key, value):
        &quot;&quot;&quot;Construct key to ensure proper sorting.

        Transform key and value to the form:

        (category1, 2), product1
        (category2, 3), product1
        (category1, 3), product2
        (category2, 7), product3
        (category1, 1), product4

        The shuffle/sort step of MapReduce will then do a
        distributed sort on the keys, resulting in:

        (category1, 1), product4
        (category1, 2), product1
        (category1, 3), product2
        (category2, 3), product1
        (category2, 7), product3
        &quot;&quot;&quot;
        category_id, product_id = key
        quantity = value
        yield (category_id, quantity), product_id

    def reducer_identity(self, key, value):
        yield key, value

    def steps(self):
        &quot;&quot;&quot;Run the map and reduce steps.&quot;&quot;&quot;
        return [
            self.mr(mapper=self.mapper,
                    reducer=self.reducer),
            self.mr(mapper=self.mapper_sort,
                    reducer=self.reducer_identity),
        ]
</code></pre>
<p>The result would be the following sorted list, which we could insert into the <code>sales_rank</code> table:</p>
<pre><code>(category1, 1), product4
(category1, 2), product1
(category1, 3), product2
(category2, 3), product1
(category2, 7), product3
</code></pre>
<p>The <code>sales_rank</code> table could have the following structure:</p>
<pre><code>id int NOT NULL AUTO_INCREMENT
category_id int NOT NULL
total_sold int NOT NULL
product_id int NOT NULL
PRIMARY KEY(id)
FOREIGN KEY(category_id) REFERENCES Categories(id)
FOREIGN KEY(product_id) REFERENCES Products(id)
</code></pre>
<p>We&#39;ll create an <a href="https://github.com/donnemartin/system-design-primer#use-good-indices">index</a> on <code>id </code>, <code>category_id</code>, and <code>product_id</code> to speed up lookups (log-time instead of scanning the entire table) and to keep the data in memory.  Reading 1 MB sequentially from memory takes about 250 microseconds, while reading from SSD takes 4x and from disk takes 80x longer.<sup><a href=https://github.com/donnemartin/system-design-primer#latency-numbers-every-programmer-should-know>1</a></sup></p>
<h3>Use case: User views the past week&#39;s most popular products by category</h3>
<ul>
<li>The <strong>Client</strong> sends a request to the <strong>Web Server</strong>, running as a <a href="https://github.com/donnemartin/system-design-primer#reverse-proxy-web-server">reverse proxy</a></li>
<li>The <strong>Web Server</strong> forwards the request to the <strong>Read API</strong> server</li>
<li>The <strong>Read API</strong> server reads from the <strong>SQL Database</strong> <code>sales_rank</code> table</li>
</ul>
<p>We&#39;ll use a public <a href="https://github.com/donnemartin/system-design-primer#representational-state-transfer-rest"><strong>REST API</strong></a>:</p>
<pre><code>$ curl https://amazon.com/api/v1/popular?category_id=1234
</code></pre>
<p>Response:</p>
<pre><code>{
    &quot;id&quot;: &quot;100&quot;,
    &quot;category_id&quot;: &quot;1234&quot;,
    &quot;total_sold&quot;: &quot;100000&quot;,
    &quot;product_id&quot;: &quot;50&quot;,
},
{
    &quot;id&quot;: &quot;53&quot;,
    &quot;category_id&quot;: &quot;1234&quot;,
    &quot;total_sold&quot;: &quot;90000&quot;,
    &quot;product_id&quot;: &quot;200&quot;,
},
{
    &quot;id&quot;: &quot;75&quot;,
    &quot;category_id&quot;: &quot;1234&quot;,
    &quot;total_sold&quot;: &quot;80000&quot;,
    &quot;product_id&quot;: &quot;3&quot;,
},
</code></pre>
<p>For internal communications, we could use <a href="https://github.com/donnemartin/system-design-primer#remote-procedure-call-rpc">Remote Procedure Calls</a>.</p>
<h2>Step 4: Scale the design</h2>
<blockquote>
<p>Identify and address bottlenecks, given the constraints.</p>
</blockquote>
<p><img src="http://i.imgur.com/MzExP06.png" alt="Imgur"></p>
<p><strong>Important: Do not simply jump right into the final design from the initial design!</strong></p>
<p>State you would 1) <strong>Benchmark/Load Test</strong>, 2) <strong>Profile</strong> for bottlenecks 3) address bottlenecks while evaluating alternatives and trade-offs, and 4) repeat.  See <a href="../scaling_aws/README.md">Design a system that scales to millions of users on AWS</a> as a sample on how to iteratively scale the initial design.</p>
<p>It&#39;s important to discuss what bottlenecks you might encounter with the initial design and how you might address each of them.  For example, what issues are addressed by adding a <strong>Load Balancer</strong> with multiple <strong>Web Servers</strong>?  <strong>CDN</strong>?  <strong>Master-Slave Replicas</strong>?  What are the alternatives and <strong>Trade-Offs</strong> for each?</p>
<p>We&#39;ll introduce some components to complete the design and to address scalability issues.  Internal load balancers are not shown to reduce clutter.</p>
<p><em>To avoid repeating discussions</em>, refer to the following <a href="https://github.com/donnemartin/system-design-primer#index-of-system-design-topics">system design topics</a> for main talking points, tradeoffs, and alternatives:</p>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#domain-name-system">DNS</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#content-delivery-network">CDN</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#load-balancer">Load balancer</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#horizontal-scaling">Horizontal scaling</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#reverse-proxy-web-server">Web server (reverse proxy)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#application-layer">API server (application layer)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#cache">Cache</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#relational-database-management-system-rdbms">Relational database management system (RDBMS)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#fail-over">SQL write master-slave failover</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#master-slave-replication">Master-slave replication</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#consistency-patterns">Consistency patterns</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#availability-patterns">Availability patterns</a></li>
</ul>
<p>The <strong>Analytics Database</strong> could use a data warehousing solution such as Amazon Redshift or Google BigQuery.</p>
<p>We might only want to store a limited time period of data in the database, while storing the rest in a data warehouse or in an <strong>Object Store</strong>.  An <strong>Object Store</strong> such as Amazon S3 can comfortably handle the constraint of 40 GB of new content per month.</p>
<p>To address the 40,000 <em>average</em> read requests per second (higher at peak), traffic for popular content (and their sales rank) should be handled by the <strong>Memory Cache</strong> instead of the database.  The <strong>Memory Cache</strong> is also useful for handling the unevenly distributed traffic and traffic spikes.  With the large volume of reads, the <strong>SQL Read Replicas</strong> might not be able to handle the cache misses.  We&#39;ll probably need to employ additional SQL scaling patterns.</p>
<p>400 <em>average</em> writes per second (higher at peak) might be tough for a single <strong>SQL Write Master-Slave</strong>, also pointing to a need for additional scaling techniques.</p>
<p>SQL scaling patterns include:</p>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#federation">Federation</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sharding">Sharding</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#denormalization">Denormalization</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sql-tuning">SQL Tuning</a></li>
</ul>
<p>We should also consider moving some data to a <strong>NoSQL Database</strong>.</p>
<h2>Additional talking points</h2>
<blockquote>
<p>Additional topics to dive into, depending on the problem scope and time remaining.</p>
</blockquote>
<h4>NoSQL</h4>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#key-value-store">Key-value store</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#document-store">Document store</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#wide-column-store">Wide column store</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#graph-database">Graph database</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sql-or-nosql">SQL vs NoSQL</a></li>
</ul>
<h3>Caching</h3>
<ul>
<li>Where to cache<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#client-caching">Client caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#cdn-caching">CDN caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#web-server-caching">Web server caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#database-caching">Database caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#application-caching">Application caching</a></li>
</ul>
</li>
<li>What to cache<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#caching-at-the-database-query-level">Caching at the database query level</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#caching-at-the-object-level">Caching at the object level</a></li>
</ul>
</li>
<li>When to update the cache<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#cache-aside">Cache-aside</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#write-through">Write-through</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#write-behind-write-back">Write-behind (write-back)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#refresh-ahead">Refresh ahead</a></li>
</ul>
</li>
</ul>
<h3>Asynchronism and microservices</h3>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#message-queues">Message queues</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#task-queues">Task queues</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#back-pressure">Back pressure</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#microservices">Microservices</a></li>
</ul>
<h3>Communications</h3>
<ul>
<li>Discuss tradeoffs:<ul>
<li>External communication with clients - <a href="https://github.com/donnemartin/system-design-primer#representational-state-transfer-rest">HTTP APIs following REST</a></li>
<li>Internal communications - <a href="https://github.com/donnemartin/system-design-primer#remote-procedure-call-rpc">RPC</a></li>
</ul>
</li>
<li><a href="https://github.com/donnemartin/system-design-primer#service-discovery">Service discovery</a></li>
</ul>
<h3>Security</h3>
<p>Refer to the <a href="https://github.com/donnemartin/system-design-primer#security">security section</a>.</p>
<h3>Latency numbers</h3>
<p>See <a href="https://github.com/donnemartin/system-design-primer#latency-numbers-every-programmer-should-know">Latency numbers every programmer should know</a>.</p>
<h3>Ongoing</h3>
<ul>
<li>Continue benchmarking and monitoring your system to address bottlenecks as they come up</li>
<li>Scaling is an iterative process</li>
</ul>

</div>
`,
quiz:{q:'Updating a global "Sales Rank" for millions of items in real-time on every purchase would crush a database. How is this typically solved?', opts:['Using a Graph Database', 'Using strong consistency for every transaction', 'Batch processing logs asynchronously using MapReduce/Spark to update rankings periodically', 'Storing rankings in a CDN'], a:2, why:'Real-time exactness is usually not required for rankings. By batch processing logs asynchronously, the system can handle massive write volume without blocking user checkouts.'}
},
{
id: 'scaling-aws', group: 'Interview prep (Deep dives)', title: 'Design a system that scales to millions of users on AWS', nav: 'a',
html: `
<p class="eyebrow">Interview prep · Deep dive</p>
<h1>Design a system that scales to millions of users on AWS</h1>
<p class="lede">A deep dive into system architecture from the Primer.</p>

<div class="eli5"><span class="tag">In plain English</span>
<p>Imagine building a city from scratch. You start with a single general store (one server). As people move in, you separate the bank from the store (split DB and Web). Then you clone the store 10 times and add a traffic cop (Load Balancer). You build a warehouse for quick pickups (Cache). Eventually, you divide the city into specialized districts (Microservices) so one fire doesn't burn the whole place down. This is the journey from 1 to millions of users.</p>
</div>

<div class="deep-divider">The full picture</div>
<div class="lesson">

<p><em>Note: This document links directly to relevant areas found in the <a href="https://github.com/donnemartin/system-design-primer#index-of-system-design-topics">system design topics</a> to avoid duplication.  Refer to the linked content for general talking points, tradeoffs, and alternatives.</em></p>
<h2>Step 1: Outline use cases and constraints</h2>
<blockquote>
<p>Gather requirements and scope the problem.
Ask questions to clarify use cases and constraints.
Discuss assumptions.</p>
</blockquote>
<p>Without an interviewer to address clarifying questions, we&#39;ll define some use cases and constraints.</p>
<h3>Use cases</h3>
<p>Solving this problem takes an iterative approach of: 1) <strong>Benchmark/Load Test</strong>, 2) <strong>Profile</strong> for bottlenecks 3) address bottlenecks while evaluating alternatives and trade-offs, and 4) repeat, which is good pattern for evolving basic designs to scalable designs.</p>
<p>Unless you have a background in AWS or are applying for a position that requires AWS knowledge, AWS-specific details are not a requirement.  However, <strong>much of the principles discussed in this exercise can apply more generally outside of the AWS ecosystem.</strong></p>
<h4>We&#39;ll scope the problem to handle only the following use cases</h4>
<ul>
<li><strong>User</strong> makes a read or write request<ul>
<li><strong>Service</strong> does processing, stores user data, then returns the results</li>
</ul>
</li>
<li><strong>Service</strong> needs to evolve from serving a small amount of users to millions of users<ul>
<li>Discuss general scaling patterns as we evolve an architecture to handle a large number of users and requests</li>
</ul>
</li>
<li><strong>Service</strong> has high availability</li>
</ul>
<h3>Constraints and assumptions</h3>
<h4>State assumptions</h4>
<ul>
<li>Traffic is not evenly distributed</li>
<li>Need for relational data</li>
<li>Scale from 1 user to tens of millions of users<ul>
<li>Denote increase of users as:<ul>
<li>Users+</li>
<li>Users++</li>
<li>Users+++</li>
<li>...</li>
</ul>
</li>
<li>10 million users</li>
<li>1 billion writes per month</li>
<li>100 billion reads per month</li>
<li>100:1 read to write ratio</li>
<li>1 KB content per write</li>
</ul>
</li>
</ul>
<h4>Calculate usage</h4>
<p><strong>Clarify with your interviewer if you should run back-of-the-envelope usage calculations.</strong></p>
<ul>
<li>1 TB of new content per month<ul>
<li>1 KB per write * 1 billion writes per month</li>
<li>36 TB of new content in 3 years</li>
<li>Assume most writes are from new content instead of updates to existing ones</li>
</ul>
</li>
<li>400 writes per second on average</li>
<li>40,000 reads per second on average</li>
</ul>
<p>Handy conversion guide:</p>
<ul>
<li>2.5 million seconds per month</li>
<li>1 request per second = 2.5 million requests per month</li>
<li>40 requests per second = 100 million requests per month</li>
<li>400 requests per second = 1 billion requests per month</li>
</ul>
<h2>Step 2: Create a high level design</h2>
<blockquote>
<p>Outline a high level design with all important components.</p>
</blockquote>
<p><img src="http://i.imgur.com/B8LDKD7.png" alt="Imgur"></p>
<h2>Step 3: Design core components</h2>
<blockquote>
<p>Dive into details for each core component.</p>
</blockquote>
<h3>Use case: User makes a read or write request</h3>
<h4>Goals</h4>
<ul>
<li>With only 1-2 users, you only need a basic setup<ul>
<li>Single box for simplicity</li>
<li>Vertical scaling when needed</li>
<li>Monitor to determine bottlenecks</li>
</ul>
</li>
</ul>
<h4>Start with a single box</h4>
<ul>
<li><strong>Web server</strong> on EC2<ul>
<li>Storage for user data</li>
<li><a href="https://github.com/donnemartin/system-design-primer#relational-database-management-system-rdbms"><strong>MySQL Database</strong></a></li>
</ul>
</li>
</ul>
<p>Use <strong>Vertical Scaling</strong>:</p>
<ul>
<li>Simply choose a bigger box</li>
<li>Keep an eye on metrics to determine how to scale up<ul>
<li>Use basic monitoring to determine bottlenecks: CPU, memory, IO, network, etc</li>
<li>CloudWatch, top, nagios, statsd, graphite, etc</li>
</ul>
</li>
<li>Scaling vertically can get very expensive</li>
<li>No redundancy/failover</li>
</ul>
<p><em>Trade-offs, alternatives, and additional details:</em></p>
<ul>
<li>The alternative to <strong>Vertical Scaling</strong> is <a href="https://github.com/donnemartin/system-design-primer#horizontal-scaling"><strong>Horizontal scaling</strong></a></li>
</ul>
<h4>Start with SQL, consider NoSQL</h4>
<p>The constraints assume there is a need for relational data.  We can start off using a <strong>MySQL Database</strong> on the single box.</p>
<p><em>Trade-offs, alternatives, and additional details:</em></p>
<ul>
<li>See the <a href="https://github.com/donnemartin/system-design-primer#relational-database-management-system-rdbms">Relational database management system (RDBMS)</a> section</li>
<li>Discuss reasons to use <a href="https://github.com/donnemartin/system-design-primer#sql-or-nosql">SQL or NoSQL</a></li>
</ul>
<h4>Assign a public static IP</h4>
<ul>
<li>Elastic IPs provide a public endpoint whose IP doesn&#39;t change on reboot</li>
<li>Helps with failover, just point the domain to a new IP</li>
</ul>
<h4>Use a DNS</h4>
<p>Add a <strong>DNS</strong> such as Route 53 to map the domain to the instance&#39;s public IP.</p>
<p><em>Trade-offs, alternatives, and additional details:</em></p>
<ul>
<li>See the <a href="https://github.com/donnemartin/system-design-primer#domain-name-system">Domain name system</a> section</li>
</ul>
<h4>Secure the web server</h4>
<ul>
<li>Open up only necessary ports<ul>
<li>Allow the web server to respond to incoming requests from:<ul>
<li>80 for HTTP</li>
<li>443 for HTTPS</li>
<li>22 for SSH to only whitelisted IPs</li>
</ul>
</li>
<li>Prevent the web server from initiating outbound connections</li>
</ul>
</li>
</ul>
<p><em>Trade-offs, alternatives, and additional details:</em></p>
<ul>
<li>See the <a href="https://github.com/donnemartin/system-design-primer#security">Security</a> section</li>
</ul>
<h2>Step 4: Scale the design</h2>
<blockquote>
<p>Identify and address bottlenecks, given the constraints.</p>
</blockquote>
<h3>Users+</h3>
<p><img src="http://i.imgur.com/rrfjMXB.png" alt="Imgur"></p>
<h4>Assumptions</h4>
<p>Our user count is starting to pick up and the load is increasing on our single box.  Our <strong>Benchmarks/Load Tests</strong> and <strong>Profiling</strong> are pointing to the <strong>MySQL Database</strong> taking up more and more memory and CPU resources, while the user content is filling up disk space.</p>
<p>We&#39;ve been able to address these issues with <strong>Vertical Scaling</strong> so far.  Unfortunately, this has become quite expensive and it doesn&#39;t allow for independent scaling of the <strong>MySQL Database</strong> and <strong>Web Server</strong>.</p>
<h4>Goals</h4>
<ul>
<li>Lighten load on the single box and allow for independent scaling<ul>
<li>Store static content separately in an <strong>Object Store</strong></li>
<li>Move the <strong>MySQL Database</strong> to a separate box</li>
</ul>
</li>
<li>Disadvantages<ul>
<li>These changes would increase complexity and would require changes to the <strong>Web Server</strong> to point to the <strong>Object Store</strong> and the <strong>MySQL Database</strong></li>
<li>Additional security measures must be taken to secure the new components</li>
<li>AWS costs could also increase, but should be weighed with the costs of managing similar systems on your own</li>
</ul>
</li>
</ul>
<h4>Store static content separately</h4>
<ul>
<li>Consider using a managed <strong>Object Store</strong> like S3 to store static content<ul>
<li>Highly scalable and reliable</li>
<li>Server side encryption</li>
</ul>
</li>
<li>Move static content to S3<ul>
<li>User files</li>
<li>JS</li>
<li>CSS</li>
<li>Images</li>
<li>Videos</li>
</ul>
</li>
</ul>
<h4>Move the MySQL database to a separate box</h4>
<ul>
<li>Consider using a service like RDS to manage the <strong>MySQL Database</strong><ul>
<li>Simple to administer, scale</li>
<li>Multiple availability zones</li>
<li>Encryption at rest</li>
</ul>
</li>
</ul>
<h4>Secure the system</h4>
<ul>
<li>Encrypt data in transit and at rest</li>
<li>Use a Virtual Private Cloud<ul>
<li>Create a public subnet for the single <strong>Web Server</strong> so it can send and receive traffic from the internet</li>
<li>Create a private subnet for everything else, preventing outside access</li>
<li>Only open ports from whitelisted IPs for each component</li>
</ul>
</li>
<li>These same patterns should be implemented for new components in the remainder of the exercise</li>
</ul>
<p><em>Trade-offs, alternatives, and additional details:</em></p>
<ul>
<li>See the <a href="https://github.com/donnemartin/system-design-primer#security">Security</a> section</li>
</ul>
<h3>Users++</h3>
<p><img src="http://i.imgur.com/raoFTXM.png" alt="Imgur"></p>
<h4>Assumptions</h4>
<p>Our <strong>Benchmarks/Load Tests</strong> and <strong>Profiling</strong> show that our single <strong>Web Server</strong> bottlenecks during peak hours, resulting in slow responses and in some cases, downtime.  As the service matures, we&#39;d also like to move towards higher availability and redundancy.</p>
<h4>Goals</h4>
<ul>
<li>The following goals attempt to address the scaling issues with the <strong>Web Server</strong><ul>
<li>Based on the <strong>Benchmarks/Load Tests</strong> and <strong>Profiling</strong>, you might only need to implement one or two of these techniques</li>
</ul>
</li>
<li>Use <a href="https://github.com/donnemartin/system-design-primer#horizontal-scaling"><strong>Horizontal Scaling</strong></a> to handle increasing loads and to address single points of failure<ul>
<li>Add a <a href="https://github.com/donnemartin/system-design-primer#load-balancer"><strong>Load Balancer</strong></a> such as Amazon&#39;s ELB or HAProxy<ul>
<li>ELB is highly available</li>
<li>If you are configuring your own <strong>Load Balancer</strong>, setting up multiple servers in <a href="https://github.com/donnemartin/system-design-primer#active-active">active-active</a> or <a href="https://github.com/donnemartin/system-design-primer#active-passive">active-passive</a> in multiple availability zones will improve availability</li>
<li>Terminate SSL on the <strong>Load Balancer</strong> to reduce computational load on backend servers and to simplify certificate administration</li>
</ul>
</li>
<li>Use multiple <strong>Web Servers</strong> spread out over multiple availability zones</li>
<li>Use multiple <strong>MySQL</strong> instances in <a href="https://github.com/donnemartin/system-design-primer#master-slave-replication"><strong>Master-Slave Failover</strong></a> mode across multiple availability zones to improve redundancy</li>
</ul>
</li>
<li>Separate out the <strong>Web Servers</strong> from the <a href="https://github.com/donnemartin/system-design-primer#application-layer"><strong>Application Servers</strong></a><ul>
<li>Scale and configure both layers independently</li>
<li><strong>Web Servers</strong> can run as a <a href="https://github.com/donnemartin/system-design-primer#reverse-proxy-web-server"><strong>Reverse Proxy</strong></a></li>
<li>For example, you can add <strong>Application Servers</strong> handling <strong>Read APIs</strong> while others handle <strong>Write APIs</strong></li>
</ul>
</li>
<li>Move static (and some dynamic) content to a <a href="https://github.com/donnemartin/system-design-primer#content-delivery-network"><strong>Content Delivery Network (CDN)</strong></a> such as CloudFront to reduce load and latency</li>
</ul>
<p><em>Trade-offs, alternatives, and additional details:</em></p>
<ul>
<li>See the linked content above for details</li>
</ul>
<h3>Users+++</h3>
<p><img src="http://i.imgur.com/OZCxJr0.png" alt="Imgur"></p>
<p><strong>Note:</strong> <strong>Internal Load Balancers</strong> not shown to reduce clutter</p>
<h4>Assumptions</h4>
<p>Our <strong>Benchmarks/Load Tests</strong> and <strong>Profiling</strong> show that we are read-heavy (100:1 with writes) and our database is suffering from poor performance from the high read requests.</p>
<h4>Goals</h4>
<ul>
<li>The following goals attempt to address the scaling issues with the <strong>MySQL Database</strong><ul>
<li>Based on the <strong>Benchmarks/Load Tests</strong> and <strong>Profiling</strong>, you might only need to implement one or two of these techniques</li>
</ul>
</li>
<li>Move the following data to a <a href="https://github.com/donnemartin/system-design-primer#cache"><strong>Memory Cache</strong></a> such as Elasticache to reduce load and latency:<ul>
<li>Frequently accessed content from <strong>MySQL</strong><ul>
<li>First, try to configure the <strong>MySQL Database</strong> cache to see if that is sufficient to relieve the bottleneck before implementing a <strong>Memory Cache</strong></li>
</ul>
</li>
<li>Session data from the <strong>Web Servers</strong><ul>
<li>The <strong>Web Servers</strong> become stateless, allowing for <strong>Autoscaling</strong></li>
</ul>
</li>
<li>Reading 1 MB sequentially from memory takes about 250 microseconds, while reading from SSD takes 4x and from disk takes 80x longer.<sup><a href=https://github.com/donnemartin/system-design-primer#latency-numbers-every-programmer-should-know>1</a></sup></li>
</ul>
</li>
<li>Add <a href="https://github.com/donnemartin/system-design-primer#master-slave-replication"><strong>MySQL Read Replicas</strong></a> to reduce load on the write master</li>
<li>Add more <strong>Web Servers</strong> and <strong>Application Servers</strong> to improve responsiveness</li>
</ul>
<p><em>Trade-offs, alternatives, and additional details:</em></p>
<ul>
<li>See the linked content above for details</li>
</ul>
<h4>Add MySQL read replicas</h4>
<ul>
<li>In addition to adding and scaling a <strong>Memory Cache</strong>, <strong>MySQL Read Replicas</strong> can also help relieve load on the <strong>MySQL Write Master</strong></li>
<li>Add logic to <strong>Web Server</strong> to separate out writes and reads</li>
<li>Add <strong>Load Balancers</strong> in front of <strong>MySQL Read Replicas</strong> (not pictured to reduce clutter)</li>
<li>Most services are read-heavy vs write-heavy</li>
</ul>
<p><em>Trade-offs, alternatives, and additional details:</em></p>
<ul>
<li>See the <a href="https://github.com/donnemartin/system-design-primer#relational-database-management-system-rdbms">Relational database management system (RDBMS)</a> section</li>
</ul>
<h3>Users++++</h3>
<p><img src="http://i.imgur.com/3X8nmdL.png" alt="Imgur"></p>
<h4>Assumptions</h4>
<p>Our <strong>Benchmarks/Load Tests</strong> and <strong>Profiling</strong> show that our traffic spikes during regular business hours in the U.S. and drop significantly when users leave the office.  We think we can cut costs by automatically spinning up and down servers based on actual load.  We&#39;re a small shop so we&#39;d like to automate as much of the DevOps as possible for <strong>Autoscaling</strong> and for the general operations.</p>
<h4>Goals</h4>
<ul>
<li>Add <strong>Autoscaling</strong> to provision capacity as needed<ul>
<li>Keep up with traffic spikes</li>
<li>Reduce costs by powering down unused instances</li>
</ul>
</li>
<li>Automate DevOps<ul>
<li>Chef, Puppet, Ansible, etc</li>
</ul>
</li>
<li>Continue monitoring metrics to address bottlenecks<ul>
<li><strong>Host level</strong> - Review a single EC2 instance</li>
<li><strong>Aggregate level</strong> - Review load balancer stats</li>
<li><strong>Log analysis</strong> - CloudWatch, CloudTrail, Loggly, Splunk, Sumo</li>
<li><strong>External site performance</strong> - Pingdom or New Relic</li>
<li><strong>Handle notifications and incidents</strong> - PagerDuty</li>
<li><strong>Error Reporting</strong> - Sentry</li>
</ul>
</li>
</ul>
<h4>Add autoscaling</h4>
<ul>
<li>Consider a managed service such as AWS <strong>Autoscaling</strong><ul>
<li>Create one group for each <strong>Web Server</strong> and one for each <strong>Application Server</strong> type, place each group in multiple availability zones</li>
<li>Set a min and max number of instances</li>
<li>Trigger to scale up and down through CloudWatch<ul>
<li>Simple time of day metric for predictable loads or</li>
<li>Metrics over a time period:<ul>
<li>CPU load</li>
<li>Latency</li>
<li>Network traffic</li>
<li>Custom metric</li>
</ul>
</li>
</ul>
</li>
<li>Disadvantages<ul>
<li>Autoscaling can introduce complexity</li>
<li>It could take some time before a system appropriately scales up to meet increased demand, or to scale down when demand drops</li>
</ul>
</li>
</ul>
</li>
</ul>
<h3>Users+++++</h3>
<p><img src="http://i.imgur.com/jj3A5N8.png" alt="Imgur"></p>
<p><strong>Note:</strong> <strong>Autoscaling</strong> groups not shown to reduce clutter</p>
<h4>Assumptions</h4>
<p>As the service continues to grow towards the figures outlined in the constraints, we iteratively run <strong>Benchmarks/Load Tests</strong> and <strong>Profiling</strong> to uncover and address new bottlenecks.</p>
<h4>Goals</h4>
<p>We&#39;ll continue to address scaling issues due to the problem&#39;s constraints:</p>
<ul>
<li>If our <strong>MySQL Database</strong> starts to grow too large, we might consider only storing a limited time period of data in the database, while storing the rest in a data warehouse such as Redshift<ul>
<li>A data warehouse such as Redshift can comfortably handle the constraint of 1 TB of new content per month</li>
</ul>
</li>
<li>With 40,000 average read requests per second, read traffic for popular content can be addressed by scaling the <strong>Memory Cache</strong>, which is also useful for handling the unevenly distributed traffic and traffic spikes<ul>
<li>The <strong>SQL Read Replicas</strong> might have trouble handling the cache misses, we&#39;ll probably need to employ additional SQL scaling patterns</li>
</ul>
</li>
<li>400 average writes per second (with presumably significantly higher peaks) might be tough for a single <strong>SQL Write Master-Slave</strong>, also pointing to a need for additional scaling techniques</li>
</ul>
<p>SQL scaling patterns include:</p>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#federation">Federation</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sharding">Sharding</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#denormalization">Denormalization</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sql-tuning">SQL Tuning</a></li>
</ul>
<p>To further address the high read and write requests, we should also consider moving appropriate data to a <a href="https://github.com/donnemartin/system-design-primer#nosql"><strong>NoSQL Database</strong></a> such as DynamoDB.</p>
<p>We can further separate out our <a href="https://github.com/donnemartin/system-design-primer#application-layer"><strong>Application Servers</strong></a> to allow for independent scaling.  Batch processes or computations that do not need to be done in real-time can be done <a href="https://github.com/donnemartin/system-design-primer#asynchronism"><strong>Asynchronously</strong></a> with <strong>Queues</strong> and <strong>Workers</strong>:</p>
<ul>
<li>For example, in a photo service, the photo upload and the thumbnail creation can be separated:<ul>
<li><strong>Client</strong> uploads photo</li>
<li><strong>Application Server</strong> puts a job in a <strong>Queue</strong> such as SQS</li>
<li>The <strong>Worker Service</strong> on EC2 or Lambda pulls work off the <strong>Queue</strong> then:<ul>
<li>Creates a thumbnail</li>
<li>Updates a <strong>Database</strong></li>
<li>Stores the thumbnail in the <strong>Object Store</strong></li>
</ul>
</li>
</ul>
</li>
</ul>
<p><em>Trade-offs, alternatives, and additional details:</em></p>
<ul>
<li>See the linked content above for details</li>
</ul>
<h2>Additional talking points</h2>
<blockquote>
<p>Additional topics to dive into, depending on the problem scope and time remaining.</p>
</blockquote>
<h3>SQL scaling patterns</h3>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#master-slave-replication">Read replicas</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#federation">Federation</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sharding">Sharding</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#denormalization">Denormalization</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sql-tuning">SQL Tuning</a></li>
</ul>
<h4>NoSQL</h4>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#key-value-store">Key-value store</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#document-store">Document store</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#wide-column-store">Wide column store</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#graph-database">Graph database</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#sql-or-nosql">SQL vs NoSQL</a></li>
</ul>
<h3>Caching</h3>
<ul>
<li>Where to cache<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#client-caching">Client caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#cdn-caching">CDN caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#web-server-caching">Web server caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#database-caching">Database caching</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#application-caching">Application caching</a></li>
</ul>
</li>
<li>What to cache<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#caching-at-the-database-query-level">Caching at the database query level</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#caching-at-the-object-level">Caching at the object level</a></li>
</ul>
</li>
<li>When to update the cache<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#cache-aside">Cache-aside</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#write-through">Write-through</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#write-behind-write-back">Write-behind (write-back)</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#refresh-ahead">Refresh ahead</a></li>
</ul>
</li>
</ul>
<h3>Asynchronism and microservices</h3>
<ul>
<li><a href="https://github.com/donnemartin/system-design-primer#message-queues">Message queues</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#task-queues">Task queues</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#back-pressure">Back pressure</a></li>
<li><a href="https://github.com/donnemartin/system-design-primer#microservices">Microservices</a></li>
</ul>
<h3>Communications</h3>
<ul>
<li>Discuss tradeoffs:<ul>
<li>External communication with clients - <a href="https://github.com/donnemartin/system-design-primer#representational-state-transfer-rest">HTTP APIs following REST</a></li>
<li>Internal communications - <a href="https://github.com/donnemartin/system-design-primer#remote-procedure-call-rpc">RPC</a></li>
</ul>
</li>
<li><a href="https://github.com/donnemartin/system-design-primer#service-discovery">Service discovery</a></li>
</ul>
<h3>Security</h3>
<p>Refer to the <a href="https://github.com/donnemartin/system-design-primer#security">security section</a>.</p>
<h3>Latency numbers</h3>
<p>See <a href="https://github.com/donnemartin/system-design-primer#latency-numbers-every-programmer-should-know">Latency numbers every programmer should know</a>.</p>
<h3>Ongoing</h3>
<ul>
<li>Continue benchmarking and monitoring your system to address bottlenecks as they come up</li>
<li>Scaling is an iterative process</li>
</ul>

</div>
`,
quiz:{q:'As a system scales from 1 server to a horizontally scaled architecture, what must happen to the web servers?', opts:['They must become stateless, storing session data in a shared cache or database', 'They must use Strong Consistency', 'They must switch to a Graph Database', 'They must handle their own DNS routing'], a:0, why:'If a load balancer can send a user to any web server, no single server can hold local session state (like a logged-in cookie). The state must be extracted to a shared data store so all servers see it.'}
},
];
