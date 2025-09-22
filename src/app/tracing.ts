console.log('Setting up simple manual tracing...');

// Simple trace sender using fetch
export function createTrace(name: string, attributes: any = {}) {
  const traceId = generateId(32);
  const spanId = generateId(16);
  const timestamp = Date.now() * 1000000; // nanoseconds
  
  console.log(`Creating trace: ${name}`);
  
  return {
    end: () => {
      const trace = {
        resourceSpans: [{
          resource: {
            attributes: [{
              key: 'service.name',
              value: { stringValue: 'monitoring-frontend' }
            }]
          },
          scopeSpans: [{
            spans: [{
              traceId: traceId,
              spanId: spanId,
              name: name,
              kind: 1, // SPAN_KIND_INTERNAL
              startTimeUnixNano: timestamp.toString(),
              endTimeUnixNano: (timestamp + 10000000).toString(), // +10ms
              attributes: Object.keys(attributes).map(key => ({
                key: key,
                value: { stringValue: attributes[key].toString() }
              }))
            }]
          }]
        }]
      };

      // Send to collector
      fetch('http://localhost:4318/v1/traces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trace)
      })
      .then(() => console.log(`Trace sent: ${name}`))
      .catch(err => console.error('Failed to send trace:', err));
    }
  };
}

// Generate random hex ID
function generateId(length: number): string {
  return Array.from({length}, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

// Make it available globally
(window as any).createTrace = createTrace;

console.log('Manual tracing setup complete!');