
    {
        id: 'service-mesh',
        group: 'Advanced (Beyond Primer)',
        title: 'Service Mesh & API Gateways',
        nav: 'Service Mesh',
        html: `
<p class="eyebrow">Advanced (Beyond Primer) &middot; Lesson service-mesh</p>
<h1>Service Mesh & API Gateways</h1>
<p class="lede">Moving routing, security, and observability out of the application using sidecar proxies.</p>

<div class="eli5"><span class="tag">In plain English</span>
<p>Instead of every house (microservice) hiring its own security guard and map-reader, the city provides a standard guard and map to every house by default.</p>
</div>

<div class="deep-divider">The full picture</div>
<div class="lesson">

<h3>The Problem with Microservices</h3>
<p>As systems decompose into hundreds of microservices, each service needs to handle retries, timeouts, circuit breaking, mTLS encryption, and distributed tracing. If developers write this logic into the application code, it leads to massive code duplication and language-specific library fragmentation.</p>

<h3>The Service Mesh (Sidecar Pattern)</h3>
<p>A service mesh (like Istio or Linkerd) solves this by deploying a lightweight proxy (like Envoy) alongside every microservice instance. The application only talks to localhost. The proxy intercepts all traffic, applies routing rules, encrypts it, and forwards it to the destination proxy.</p>
<ul>
<li><strong>Control Plane:</strong> Manages policies, TLS certificates, and configurations.</li>
<li><strong>Data Plane:</strong> The actual proxies that route the traffic.</li>
</ul>

<h3>API Gateways</h3>
<p>While a service mesh handles <em>internal</em> service-to-service (East-West) traffic, an API Gateway handles <em>external</em> client-to-service (North-South) traffic. It performs rate limiting, authentication, and request routing before traffic ever enters the mesh.</p>

</div>
`,
        quiz: { q: 'Which component of a Service Mesh is responsible for actually routing the packets?', opts: ['Control Plane', 'API Gateway', 'Data Plane', 'Service Registry'], a: 2, why: 'The Data Plane consists of the sidecar proxies that physically intercept and route the packets, while the Control Plane just provides the configuration rules.' }
    },

    {
        id: 'distributed-tx',
        group: 'Advanced (Beyond Primer)',
        title: 'Distributed Transactions',
        nav: 'Distributed Transactions',
        html: `
<p class="eyebrow">Advanced (Beyond Primer) &middot; Lesson distributed-tx</p>
<h1>Distributed Transactions</h1>
<p class="lede">How to handle payments across microservices without distributed locks.</p>

<div class="eli5"><span class="tag">In plain English</span>
<p>Instead of freezing everyone's bank account until a transfer is perfectly complete, we just keep a ledger of promises. If a promise breaks, we write a refund entry to cancel it out.</p>
</div>

<div class="deep-divider">The full picture</div>
<div class="lesson">

<h3>Two-Phase Commit (2PC)</h3>
<p>In traditional databases, 2PC is used to ensure atomic commits across multiple nodes. A coordinator asks all nodes to prepare (Phase 1), and if all agree, tells them to commit (Phase 2). This is highly consistent but creates severe bottlenecks because nodes hold locks for the duration of the network calls. It scales poorly in distributed microservices.</p>

<h3>The Saga Pattern</h3>
<p>In microservices, we use the Saga pattern. A Saga is a sequence of local transactions. Each local transaction updates the database and publishes an event or message to trigger the next local transaction in the saga.</p>
<p>If a local transaction fails (e.g., inventory is out of stock after payment was taken), the saga executes a series of <strong>compensating transactions</strong> to undo the preceding steps (e.g., refund the payment).</p>
<ul>
<li><strong>Choreography:</strong> Services listen to each other's events directly. Good for simple workflows.</li>
<li><strong>Orchestration:</strong> A central orchestrator service tells other services what to do. Good for complex workflows with many steps.</li>
</ul>

</div>
`,
        quiz: { q: 'In the Saga pattern, what happens if step 3 of a 5-step transaction fails?', opts: ['The database rolls back automatically via 2PC', 'Compensating transactions are fired to undo steps 1 and 2', 'The system holds locks indefinitely', 'The orchestrator forces step 3 to succeed'], a: 1, why: 'Sagas rely on compensating transactions (like a refund) to logically undo previous steps, since database locks are not held across microservices.' }
    },

    {
        id: 'vector-db',
        group: 'Advanced (Beyond Primer)',
        title: 'Vector Databases',
        nav: 'Vector Databases',
        html: `
<p class="eyebrow">Advanced (Beyond Primer) &middot; Lesson vector-db</p>
<h1>Vector Databases</h1>
<p class="lede">The backbone of modern AI/LLM applications and semantic search at scale.</p>

<div class="eli5"><span class="tag">In plain English</span>
<p>Instead of finding exact word matches in a dictionary, we map words into a 3D galaxy. Words with similar meanings cluster together, so we just look for the closest stars.</p>
</div>

<div class="deep-divider">The full picture</div>
<div class="lesson">

<h3>Embeddings</h3>
<p>Machine learning models (like OpenAI's text-embedding-ada-002) convert unstructured data (text, images, audio) into dense arrays of numbers called <em>embeddings</em> or vectors. These vectors capture the semantic meaning of the data. Two sentences that mean the same thing will have vectors that point in roughly the same direction in high-dimensional space.</p>

<h3>The Role of Vector Databases</h3>
<p>Traditional relational databases (B-trees) are useless for finding "similar" arrays of floats. Vector databases (like Pinecone, Milvus, Qdrant) are purpose-built to store and query these embeddings at scale.</p>
<p>They use algorithms like <strong>Approximate Nearest Neighbor (ANN)</strong> and <strong>Hierarchical Navigable Small World (HNSW)</strong> graphs to rapidly find vectors in the database that are closest (using Cosine Similarity or Euclidean Distance) to a given query vector, without scanning the entire database.</p>

</div>
`,
        quiz: { q: 'What algorithmic structure do most modern Vector Databases use for rapid similarity search?', opts: ['B-Tree Indexing', 'Hierarchical Navigable Small World (HNSW)', 'Bloom Filters', 'Merkle Trees'], a: 1, why: 'HNSW is a graph-based algorithm that provides extremely fast Approximate Nearest Neighbor (ANN) search, making it the standard for vector databases.' }
    },

    {
        id: 'distributed-consensus',
        group: 'Advanced (Beyond Primer)',
        title: 'Distributed Consensus',
        nav: 'Consensus (Raft/Paxos)',
        html: `
<p class="eyebrow">Advanced (Beyond Primer) &middot; Lesson distributed-consensus</p>
<h1>Distributed Consensus</h1>
<p class="lede">How nodes elect leaders and prevent split-brain using Raft and Paxos.</p>

<div class="eli5"><span class="tag">In plain English</span>
<p>In a room of 5 people, nobody can make a rule unless at least 3 people vote for it. If the room is split in half by a wall, neither side has 3 people, so no bad rules are made.</p>
</div>

<div class="deep-divider">The full picture</div>
<div class="lesson">

<h3>The Problem of Consensus</h3>
<p>In a distributed cluster (like Zookeeper or etcd), nodes must agree on a single state or "truth" even in the face of network partitions and node failures. If a network splits in half, we must prevent <em>split-brain</em>, where both halves elect a leader and accept conflicting writes.</p>

<h3>Quorum</h3>
<p>Consensus algorithms rely on a <em>quorum</em> (a strict majority). In a 5-node cluster, 3 nodes are required to form a quorum. If a partition occurs (3 nodes vs 2 nodes), only the side with 3 nodes can elect a leader and accept writes. The 2-node side halts, ensuring strong consistency.</p>

<h3>Paxos vs. Raft</h3>
<ul>
<li><strong>Paxos:</strong> The original mathematical consensus protocol, notoriously difficult to understand and implement correctly.</li>
<li><strong>Raft:</strong> Designed specifically to be understandable. It decomposes consensus into Leader Election, Log Replication, and Safety. It is the backbone of etcd (Kubernetes) and Consul.</li>
</ul>

</div>
`,
        quiz: { q: 'In a 5-node Raft cluster, what happens if a network partition separates 2 nodes from the other 3?', opts: ['Both sides elect a leader', 'The 2-node side stops accepting writes', 'The cluster completely shuts down', 'Data becomes corrupted'], a: 1, why: 'Because a quorum of 3 is required, the 2-node side cannot elect a leader or accept writes, preventing split-brain.' }
    },

    {
        id: 'crdts',
        group: 'Advanced (Beyond Primer)',
        title: 'CRDTs & Real-time Collaboration',
        nav: 'CRDTs',
        html: `
<p class="eyebrow">Advanced (Beyond Primer) &middot; Lesson crdts</p>
<h1>CRDTs & Real-time Collaboration</h1>
<p class="lede">Conflict-free Replicated Data Types for lockless simultaneous editing.</p>

<div class="eli5"><span class="tag">In plain English</span>
<p>Instead of waiting in line to write on a whiteboard, everyone has their own whiteboard. Whenever you draw something, you shout out what you drew, and everyone automatically merges it perfectly without erasing each other's work.</p>
</div>

<div class="deep-divider">The full picture</div>
<div class="lesson">

<h3>Operational Transformation (OT)</h3>
<p>Historically, collaborative tools like Google Docs used OT. It requires a central server to resolve conflicts when two users edit the same text simultaneously. The server acts as a single source of truth, transforming operations so they apply correctly.</p>

<h3>Conflict-free Replicated Data Types (CRDTs)</h3>
<p>CRDTs are data structures that can be replicated across multiple computers and updated independently without coordination. When these replicas sync over the network, they mathematically guarantee convergence to the same exact state, regardless of the order the updates are received.</p>
<p>This completely eliminates the need for central conflict resolution or locks, enabling powerful offline-first editing and peer-to-peer collaboration (used heavily by Figma and modern text editors).</p>

</div>
`,
        quiz: { q: 'What is the primary advantage of CRDTs over Operational Transformation (OT)?', opts: ['CRDTs require less memory', 'CRDTs guarantee mathematical convergence without needing a central coordinating server', 'CRDTs are easier to implement', 'CRDTs use 2-Phase Commit'], a: 1, why: 'CRDTs are designed to merge conflicting updates from multiple peers deterministically, without relying on a central server to transform the operations.' }
    },
