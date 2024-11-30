import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ConsoleSpanExporter, SpanExporter } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { SERVICE_NAME, SERVICE_VERSION } from './config';

const telemetryEnabled = process.env.OTEL_ENABLED?.toLowerCase() === 'true';

let sdk: NodeSDK | undefined = undefined;

if (telemetryEnabled) {
  let exporter: SpanExporter;

  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT !== '') {
    exporter = new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    });
  } else {
    exporter = new ConsoleSpanExporter();
  }

  sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: SERVICE_NAME,
      [ATTR_SERVICE_VERSION]: SERVICE_VERSION,
    }),
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
}

export const otlpShutdown = async () => {
  await sdk?.shutdown();
};
