import re

html_path = 'blueprints-complete.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

matches = set(re.findall(r'<a[^>]+href=[\"\']#(.*?)[\"\'][^>]*>', html, re.IGNORECASE))
print("Found pure hash links:", matches)

mapping = {
    'domain-name-system': 'dns',
    'content-delivery-network': 'cdn',
    'load-balancer': 'lb',
    'reverse-proxy-web-server': 'rproxy',
    'application-layer': 'applayer',
    'database': 'rdbms',
    'relational-database-management-system-rdbms': 'rdbms',
    'nosql': 'nosql',
    'sql-or-nosql': 'sql-vs-nosql',
    'cache': 'cache',
    'asynchronism': 'async',
    'communication': 'comm',
    'security': 'security',
    'performance-vs-scalability': 'perf-scale',
    'latency-vs-throughput': 'lat-thru',
    'availability-vs-consistency': 'cap',
    'consistency-patterns': 'consistency',
    'availability-patterns': 'availability',
    'master-slave-replication': 'db-replication',
    'master-master-replication': 'db-replication',
    'federation': 'db-federation',
    'sharding': 'db-sharding',
    'denormalization': 'rdbms',
    'sql-tuning': 'rdbms',
    'key-value-store': 'nosql',
    'document-store': 'nosql',
    'wide-column-store': 'nosql',
    'graph-database': 'nosql',
    'client-caching': 'cache',
    'cdn-caching': 'cache',
    'web-server-caching': 'cache',
    'database-caching': 'cache',
    'application-caching': 'cache',
    'caching-at-the-database-query-level': 'cache',
    'caching-at-the-object-level': 'cache',
    'when-to-update-the-cache': 'cache-internals',
    'cache-aside': 'cache-internals',
    'write-through': 'cache-internals',
    'write-behind-write-back': 'cache-internals',
    'refresh-ahead': 'cache-internals',
    'message-queues': 'async',
    'task-queues': 'async',
    'back-pressure': 'async',
    'hypertext-transfer-protocol-http': 'comm',
    'transmission-control-protocol-tcp': 'comm',
    'user-datagram-protocol-udp': 'comm',
    'remote-procedure-call-rpc': 'comm',
    'representational-state-transfer-rest': 'comm',
    'rpc-and-rest-calls-comparison': 'comm',
    'use-cases-and-constraints': 'approach',
    'high-level-design': 'approach',
    'design-core-components': 'approach',
    'scale-the-design': 'approach',
    'source(s)-and-further-reading': None, # We don't map sources
}

def replacer(match):
    full_tag = match.group(0)
    anchor = match.group(1).lower()
    
    # Wait! If the anchor has spaces or encoded things, it's possible.
    if anchor == 'source(s)-and-further-reading':
        # Don't replace sources hash links (though they don't do anything, there's no "sources" lesson)
        return full_tag
        
    lesson_id = mapping.get(anchor)
    if lesson_id:
        new_tag = re.sub(r'href=[\"\']#[^\"\']+[\"\']', f'href="#" onclick="go(\'{lesson_id}\'); return false;"', full_tag)
        return new_tag
    else:
        print(f"Warning: Unknown pure hash anchor '{anchor}'")
        return full_tag

new_html = re.sub(r'<a[^>]+href=[\"\']#(.*?)[\"\'][^>]*>', replacer, html, flags=re.IGNORECASE)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(new_html)

print("Finished fixing pure hash links.")
