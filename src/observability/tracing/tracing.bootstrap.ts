import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const traceExporter = new OTLPTraceExporter({
  url: process.env.OTLP_TRACE_URL || 'http://localhost:4318/v1/traces',
});

export const otelSDK = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'teachlink-backend',
  }),
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

export async function bootstrapTracing() {
  try {
    await otelSDK.start();
    console.log('OpenTelemetry SDK initialized successfully');
  } catch (error) {
    console.error('Error initializing OpenTelemetry SDK', error);
  }

  process.on('SIGTERM', () => {
    otelSDK.shutdown().then(
      () => console.log('OpenTelemetry SDK shut down successfully'),
      (err) => console.error('Error shutting down OpenTelemetry SDK', err)
    ).finally(() => process.exit(0));
  });
}
