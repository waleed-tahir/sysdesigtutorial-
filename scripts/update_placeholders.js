const fs = require('fs');

const data = {
  'pastebin': {
    eli5: '<p>You have a giant book of sticky notes (the database). Someone hands you a page of text. You write a random 7-letter word on a sticky note, stick it to the text, and give them the word. When they bring the word back, you find the matching sticky note and hand them the text.</p>',
    quiz: "{q:'To generate a unique 7-character shortlink, which approach avoids database collision retries entirely?', opts:['Base62 encoding an MD5 hash of the user IP and timestamp', 'Using a random number generator', 'Encoding the auto-incrementing database ID using Base62', 'Using a UUID'], a:2, why:'Encoding an auto-incrementing ID directly to Base62 guarantees uniqueness without random collisions, saving database queries. Hashing IP+timestamp works but still has a theoretical collision chance.'}"
  },
  'twitter': {
    eli5: '<p>A town crier (Twitter) usually shouts news so everyone hears it. But if millions of people are shouting at once, the crier just gives you a custom newspaper every morning. When someone you follow shouts, the crier slips a copy into your newspaper stack (fanout-on-write). But if a massive celebrity shouts, copying their shout 50 million times takes too long, so the crier just leaves one copy on a bulletin board and tells you to look at it when you open your paper (fanout-on-load).</p>',
    quiz: "{q:'Fanning out a tweet (pushing it to followers timelines) is fast for most users. Why is it dangerous to fan out a tweet from a celebrity with 50 million followers?', opts:['It exceeds the 140 character limit', 'It creates 50 million database write operations instantly, crushing the database', 'It requires strong consistency', 'It breaks the CDN'], a:1, why:'Fanout-on-write copies the tweet to every followers timeline cache. 50 million writes for a single tweet will cause massive latency and load. That is why systems mix push for normal users and pull for celebrities.'}"
  },
  'web-crawler': {
    eli5: '<p>Imagine you want to map a giant labyrinth. You start in one room, write down all the doors, and put them on a \"to visit\" list (the queue). You walk through the first door, note the new doors, add them to the list, and cross the room off your \"visited\" list so you don\\'t walk in circles. A web crawler is just this process automated at massive scale.</p>',
    quiz: "{q:'A crawler must maintain a \"visited\" list to avoid infinite loops. What data structure is typically used to store billions of visited URLs efficiently?', opts:['A distributed hash table or Bloom filter', 'A relational database table with foreign keys', 'An array stored in memory', 'A JSON file'], a:0, why:'A Bloom filter is incredibly space-efficient for checking if an item exists in a massive dataset. Even if it occasionally gives a false positive, it saves terabytes of RAM compared to storing full URLs.'}"
  },
  'mint': {
    eli5: '<p>You hire an accountant. Every night, they log into your 10 different bank accounts, download the transactions, categorize them, and put them in a master spreadsheet. When you wake up, you don\\'t have to check 10 banks; you just look at the spreadsheet. Mint is the accountant, using batch jobs to sync data so your dashboard is instantly ready to read.</p>',
    quiz: "{q:'Since syncing bank data is slow and prone to timeouts, how should the architecture handle user data updates?', opts:['Fetch data synchronously while the user looks at a loading spinner', 'Use asynchronous background workers and task queues to fetch data, then notify the user', 'Store all bank data in a CDN', 'Use a Write-Through cache'], a:1, why:'Third-party API calls are unpredictable. Moving them to a background worker queue prevents the web server from blocking and ensures retries if the bank API is down.'}"
  },
  'social-graph': {
    eli5: '<p>Think of a map of airline flights. The cities are the users (Nodes), and the flights connecting them are their friendships (Edges). Finding \"friends of friends\" means looking for all cities you can reach with exactly two flights. A Graph Database is designed specifically to trace these paths efficiently, unlike a traditional spreadsheet where finding paths is a nightmare.</p>',
    quiz: "{q:'What is the primary advantage of using a Graph Database over a Relational Database for a social network?', opts:['Graph databases are always faster at simple key lookups', 'They are strictly ACID compliant', 'They traverse deep relationships (like \"friends of friends of friends\") much faster without complex JOINs', 'They automatically cache images'], a:2, why:'Relational DBs require expensive JOIN operations for every degree of separation. Graph DBs store relationships as first-class citizens, making deep traversal operations vastly faster.'}"
  },
  'query-cache': {
    eli5: '<p>You run a busy library help desk. People constantly ask for the same books (search queries). Instead of walking to the shelves (database) every time, you keep the 100 most requested books right on your desk. A query cache is just that desk: storing the most common database results in fast memory so you don\\'t have to do the heavy lifting twice.</p>',
    quiz: "{q:'When designing a query cache, which eviction policy is most commonly used to make room for new queries when the cache is full?', opts:['First-In-First-Out (FIFO)', 'Least Recently Used (LRU)', 'Random Replacement', 'Last-In-First-Out (LIFO)'], a:1, why:'LRU naturally keeps popular, frequently-requested items in the cache while dropping items that havent been searched for in a while, matching human search patterns perfectly.'}"
  },
  'sales-rank': {
    eli5: '<p>During an election, you don\\'t count every single vote in the country instantly on one giant whiteboard. Each town counts its votes (local aggregators), sends the totals to the state (regional aggregators), which sends them to the capital. Amazon sales rank works similarly: purchases are batched and aggregated in steps using MapReduce, rather than updating a global leaderboard for every single transaction.</p>',
    quiz: "{q:'Updating a global \"Sales Rank\" for millions of items in real-time on every purchase would crush a database. How is this typically solved?', opts:['Using a Graph Database', 'Using strong consistency for every transaction', 'Batch processing logs asynchronously using MapReduce/Spark to update rankings periodically', 'Storing rankings in a CDN'], a:2, why:'Real-time exactness is usually not required for rankings. By batch processing logs asynchronously, the system can handle massive write volume without blocking user checkouts.'}"
  },
  'scaling-aws': {
    eli5: '<p>Imagine building a city from scratch. You start with a single general store (one server). As people move in, you separate the bank from the store (split DB and Web). Then you clone the store 10 times and add a traffic cop (Load Balancer). You build a warehouse for quick pickups (Cache). Eventually, you divide the city into specialized districts (Microservices) so one fire doesn\\'t burn the whole place down. This is the journey from 1 to millions of users.</p>',
    quiz: "{q:'As a system scales from 1 server to a horizontally scaled architecture, what must happen to the web servers?', opts:['They must become stateless, storing session data in a shared cache or database', 'They must use Strong Consistency', 'They must switch to a Graph Database', 'They must handle their own DNS routing'], a:0, why:'If a load balancer can send a user to any web server, no single server can hold local session state (like a logged-in cookie). The state must be extracted to a shared data store so all servers see it.'}"
  }
};

let content = fs.readFileSync('new_lessons.js', 'utf8');

for (const [id, details] of Object.entries(data)) {
  const targetEli5Block = '<div class="eli5"><span class="tag">In plain English</span>\\n' + details.eli5 + '\\n</div>';
  
  const searchPattern = new RegExp("(id: '" + id + "'.*?)<div class=\\"eli5\\">.*?<\\/div>(.*?)quiz:\\{.*?\\}\\n\\},", "s");
  
  content = content.replace(searchPattern, (match, p1, p2) => {
    return p1 + targetEli5Block + p2 + "quiz:" + details.quiz + "\\n},";
  });
}

fs.writeFileSync('new_lessons.js', content);
console.log('Placeholders updated.');
