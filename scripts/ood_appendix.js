const OOD_LESSONS = [
{
id: 'ood-call-center', group: 'Object-oriented design', title: 'Design a call center', nav: 'Call center',
html: `
<p class="eyebrow">Object-oriented design · Practice</p>
<h1>Design a call center</h1>
<p class="lede">A classic object-oriented design problem simulating a hierarchy of employees handling incoming calls.</p>

<div class="eli5"><span class="tag">In plain English</span>
<p>Imagine a triage tent at a hospital. A patient (the Call) walks in. They are first seen by a nurse (Operator). If the nurse can't handle it, they are sent to a doctor (Supervisor). If the doctor is stumped, they go to the chief of surgery (Director). We need to write code that perfectly represents this chain of escalation.</p>
</div>

<div class="deep-divider">The full picture</div>

<h2>Core Requirements</h2>
<ul>
  <li>There are three levels of employees: respondent (operator), manager (supervisor), and director.</li>
  <li>An incoming call must be allocated to a respondent who is free.</li>
  <li>If a respondent can't handle the call, they escalate it to a manager.</li>
  <li>If a manager can't handle it, they escalate to a director.</li>
</ul>

<h2>Object-Oriented Design (Classes)</h2>

<h3>1. <code>Employee</code> (Abstract Base Class)</h3>
<p>The shared properties of all employees.</p>
<pre><code class="language-python">class Employee(ABC):
    def __init__(self, employee_id, name):
        self.employee_id = employee_id
        self.name = name
        self.call = None

    def receive_call(self, call):
        self.call = call

    def complete_call(self):
        self.call.state = CallState.COMPLETE
        self.call = None

    def escalate_call(self):
        self.call.state = CallState.READY
        call = self.call
        self.call = None
        return call</code></pre>

<h3>2. <code>Operator</code>, <code>Supervisor</code>, <code>Director</code></h3>
<p>These classes inherit from <code>Employee</code> and define their specific ranks.</p>

<h3>3. <code>Call</code></h3>
<p>Represents the call itself, containing a caller, the employee assigned, and its state (Ready, In Progress, Complete).</p>

<h3>4. <code>CallCenter</code></h3>
<p>The central dispatcher. It holds queues or lists of available employees at each rank.</p>
<pre><code class="language-python">class CallCenter:
    def __init__(self, operators, supervisors, directors):
        self.operators = operators
        self.supervisors = supervisors
        self.directors = directors
        self.queued_calls = Queue()

    def dispatch_call(self, call):
        if self.operators:
            operator = self.operators.pop(0)
            operator.receive_call(call)
        elif self.supervisors:
            supervisor = self.supervisors.pop(0)
            supervisor.receive_call(call)
        elif self.directors:
            director = self.directors.pop(0)
            director.receive_call(call)
        else:
            self.queued_calls.put(call)</code></pre>

<div class="note"><b>Design pattern to remember:</b> This perfectly fits the <b>Chain of Responsibility</b> pattern. A request (Call) is passed along a chain of handlers (Employees) until one of them handles it.</div>
`,
quiz:{q:'If an operator cannot handle a call and escalates it, what must happen to the operator\'s state?', opts:['The operator remains attached to the call in case the supervisor needs help', 'The operator is immediately assigned a new incoming call from the queue', 'The operator quits', 'The operator is deleted from memory'], a:1, why:'Once a call is escalated and handed off, the original handler (operator) becomes free again and the CallCenter dispatcher should immediately pull the next waiting call from the queue and assign it to them.'}
},
{
id: 'ood-deck-of-cards', group: 'Object-oriented design', title: 'Design a deck of cards', nav: 'Deck of cards',
html: `
<p class="eyebrow">Object-oriented design · Practice</p>
<h1>Design a deck of cards</h1>
<p class="lede">A test of inheritance, abstraction, and modeling physical constraints in software.</p>

<div class="eli5"><span class="tag">In plain English</span>
<p>If you build a generic engine for a car, you can put it in a sedan or a truck. We need to build a generic Deck of Cards that doesn't know what game is being played, and then extend it specifically to play Blackjack.</p>
</div>

<div class="deep-divider">The full picture</div>

<h2>Core Requirements</h2>
<ul>
  <li>A standard deck of 52 cards (4 suits, 13 values).</li>
  <li>Must be able to shuffle and deal cards.</li>
  <li>Must support a Blackjack subclass where face cards equal 10 and Aces are 1 or 11.</li>
</ul>

<h2>Object-Oriented Design (Classes)</h2>

<h3>1. <code>Suit</code> (Enum)</h3>
<p>Clubs, Diamonds, Hearts, Spades.</p>

<h3>2. <code>Card</code> (Abstract Base Class)</h3>
<p>Holds the suit and face value. The actual game value (e.g., in Blackjack) is abstract.</p>
<pre><code class="language-python">class Card(ABC):
    def __init__(self, value, suit):
        self.value = value
        self.suit = suit
        self.is_available = True

    @abstractmethod
    def value(self):
        pass</code></pre>

<h3>3. <code>Deck</code></h3>
<p>Holds an array of <code>Card</code> objects. Manages the <code>deal_card</code> and <code>shuffle</code> logic.</p>

<h3>4. <code>Hand</code></h3>
<p>Holds an array of <code>Card</code> objects representing a player's hand, computing scores.</p>

<h3>5. <code>BlackJackCard</code> (Extends Card)</h3>
<p>Implements the specific scoring rules for Blackjack.</p>
<pre><code class="language-python">class BlackJackCard(Card):
    def value(self):
        if self.is_ace():
            return 1
        elif self.is_face_card():
            return 10
        else:
            return self.value</code></pre>

<div class="note"><b>The Trap:</b> Interviewers watch to see if you hardcode Blackjack rules directly into the base <code>Card</code> class. Doing so violates the Open/Closed Principle of SOLID design. Always keep the base generic.</div>
`,
quiz:{q:'Why should the point value of a card (e.g., King = 10) NOT be stored as a simple integer variable in the base Card class?', opts:['Because integers take too much memory', 'Because in different games (like Hearts vs Blackjack), the exact same King has a totally different point value', 'Because face cards dont have numbers on them', 'Because the deck class handles point values'], a:1, why:'The base class should only define the physical reality of the card (Suit and Face). The rules of the specific game dictate the point value, which is why it must be implemented in the game-specific subclasses.'}
},
{
id: 'appendix-powers', group: 'Appendix', title: 'Powers of two table', nav: 'Powers of two',
html: `
<p class="eyebrow">Appendix</p>
<h1>Powers of two table</h1>
<p class="lede">The reference table you need to memorize for back-of-the-envelope calculations.</p>

<div class="eli5"><span class="tag">In plain English</span>
<p>If someone asks "How many megabytes is 10 million bytes?", you shouldn't need a calculator. In computer science, everything scales in powers of 2. Memorizing these prefixes (Kilo, Mega, Giga) is like a carpenter knowing the difference between an inch and a yard.</p>
</div>

<div class="deep-divider">The full picture</div>

<h2>The Table</h2>
<p>In interviews, it is highly useful to know these approximations to quickly estimate data volume, bandwidth, and memory requirements.</p>

<table>
  <tr><th>Power</th><th>Exact Value</th><th>Approximate Value</th><th>Short Name</th></tr>
  <tr><td>2^10</td><td>1,024</td><td>1 Thousand</td><td>1 KB</td></tr>
  <tr><td>2^20</td><td>1,048,576</td><td>1 Million</td><td>1 MB</td></tr>
  <tr><td>2^30</td><td>1,073,741,824</td><td>1 Billion</td><td>1 GB</td></tr>
  <tr><td>2^40</td><td>1,099,511,627,776</td><td>1 Trillion</td><td>1 TB</td></tr>
  <tr><td>2^50</td><td>1,125,899,906,842,624</td><td>1 Quadrillion</td><td>1 PB</td></tr>
</table>

<h2>How to use this in an interview</h2>
<p>If a question says: <i>"We generate 400 tweets per second, and each tweet is 10 KB. How much storage do we need per month?"</i></p>

<ol>
  <li><strong>Seconds in a month:</strong> Memorize this: ~2.5 million seconds in a month.</li>
  <li><strong>Total tweets:</strong> 400 * 2.5 million = 1 billion tweets/month.</li>
  <li><strong>Total size:</strong> 1 billion * 10 KB = 10,000,000,000 KB.</li>
  <li><strong>Convert:</strong> 1 billion KB = 1 million MB = 1,000 GB = 1 TB/month.</li>
</ol>
<p>You just did a complex distributed systems capacity planning exercise in 15 seconds by knowing your prefixes.</p>
`,
quiz:{q:'A system receives 1 million requests per day, and each request writes a 1 KB record to the database. Approximately how much data is written per day?', opts:['1 GB', '1 MB', '1 TB', '10 GB'], a:0, why:'1 million = 2^20. 1 KB = 2^10 bytes. 1 million * 1 KB = 1 million KB, which is 1 Gigabyte (GB).'}
},
{
id: 'ood-chat-server', group: 'Object-oriented design', title: 'Design a chat server', nav: 'Chat server',
html: `
<p class="eyebrow">Object-oriented design · Practice</p>
<h1>Design a chat server</h1>
<p class="lede">A design problem testing bidirectional communication and relationship mapping.</p>

<div class="eli5"><span class="tag">In plain English</span>
<p>Imagine a post office where people don't mail letters to houses, they mail them to the postmaster, who instantly hands them to the recipient waiting in the lobby. The postmaster needs to know who is in the lobby (online status), who is friends with whom (contact lists), and hold onto letters if someone goes to the bathroom (offline messages).</p>
</div>

<div class="deep-divider">The full picture</div>

<h2>Core Requirements</h2>
<ul>
  <li>Users can send text messages to each other.</li>
  <li>Users have a contact list.</li>
  <li>Users have an online/offline status.</li>
  <li>Messages sent to offline users are delivered when they come online.</li>
</ul>

<h2>Object-Oriented Design (Classes)</h2>

<h3>1. <code>User</code></h3>
<p>Holds the user's ID, status, and an array of <code>User</code> objects representing contacts.</p>

<h3>2. <code>Message</code></h3>
<p>Holds the sender ID, receiver ID, timestamp, and the string content.</p>

<h3>3. <code>ChatServer</code></h3>
<p>The central controller. It maps User IDs to active connection sessions (e.g., WebSockets).</p>

<pre><code class="language-python">class ChatServer:
    def __init__(self):
        # Maps User ID to User object
        self.users = {}
        # Maps User ID to their active connection
        self.sessions = {}
        # Maps User ID to a queue of undelivered messages
        self.offline_messages = {}

    def send_message(self, message):
        receiver_id = message.receiver_id
        if receiver_id in self.sessions:
            # User is online, deliver instantly
            self.sessions[receiver_id].push(message)
        else:
            # User is offline, queue it
            self.offline_messages[receiver_id].append(message)</code></pre>

<div class="note"><b>Scalability trap:</b> In a real system, the ChatServer class cannot run on a single machine. To scale, you would use a Pub/Sub system (like Redis or Kafka) where users subscribe to their own channel, rather than keeping all sessions in one giant dictionary.</div>
`,
quiz:{q:'If user A sends a message to user B, why should the Message object store the User IDs rather than a direct reference to the User objects?', opts:['Because User objects are too large for network transmission', 'Because User IDs are encrypted', 'Because User objects are immutable', 'Because User IDs are faster to type'], a:0, why:'When transmitting data over a network or saving it to a database, passing massive object references creates circular dependencies and massive payloads. IDs act as foreign keys, keeping the message lightweight.'}
},
{
id: 'ood-circular-array', group: 'Object-oriented design', title: 'Design a circular array', nav: 'Circular array',
html: `
<p class="eyebrow">Object-oriented design · Practice</p>
<h1>Design a circular array</h1>
<p class="lede">A data structure that wraps around to the beginning when it reaches the end.</p>

<div class="eli5"><span class="tag">In plain English</span>
<p>Think of a clock face. When the hour hand passes 12, it doesn't go to 13; it wraps back around to 1. A circular array works exactly like this: it's a fixed-size list where the "next" item after the last slot is the first slot.</p>
</div>

<div class="deep-divider">The full picture</div>

<h2>Core Requirements</h2>
<ul>
  <li>Implement an array-like structure.</li>
  <li>Support iteration.</li>
  <li>When the array is rotated, it shouldn't physically move all elements in memory (O(1) rotation).</li>
</ul>

<h2>Object-Oriented Design</h2>

<p>Instead of physically shifting elements in memory (which takes O(n) time), we maintain a <code>head</code> pointer. Rotating the array simply moves the <code>head</code> pointer.</p>

<pre><code class="language-python">class CircularArray:
    def __init__(self, size):
        self.items = [None] * size
        self.head = 0

    def rotate(self, shiftRight):
        # Move the head pointer instead of shifting elements
        self.head = (self.head + shiftRight) % len(self.items)

    def get(self, index):
        if index < 0 or index >= len(self.items):
            raise IndexError("Out of bounds")
        
        # Calculate the actual index using modulo
        actual_index = (self.head + index) % len(self.items)
        return self.items[actual_index]</code></pre>

<div class="note"><b>Where is this used?</b> Circular arrays are the foundation of <b>Ring Buffers</b>, heavily used in networking and multimedia streaming to process continuous streams of data efficiently without constantly reallocating memory.</div>
`,
quiz:{q:'What is the time complexity of rotating the Circular Array using the head pointer method?', opts:['O(n)', 'O(log n)', 'O(1)', 'O(n^2)'], a:2, why:'Since we are just doing math on a single integer (the head pointer) rather than looping over the array to shift elements, the rotation happens instantly in O(1) time.'}
}
];
