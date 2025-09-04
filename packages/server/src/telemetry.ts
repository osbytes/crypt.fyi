import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ConsoleSpanExporter, type SpanExporter } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { config } from './config.js';
import type { Attributes } from '@opentelemetry/api';
import { hostname } from 'node:os';

let sdk: NodeSDK | undefined = undefined;

if (config.otelEnabled) {
  let exporter: SpanExporter;

  if (config.otelExporterOtlpEndpoint) {
    exporter = new OTLPTraceExporter({
      url: config.otelExporterOtlpEndpoint,
      headers: config.otelExporterOtlpHeaders,
    });
  } else {
    exporter = new ConsoleSpanExporter();
  }

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: config.serviceName,
      [ATTR_SERVICE_VERSION]: config.serviceVersion,
    }),
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
}

export const otlpShutdown = async () => {
  await sdk?.shutdown();
};

export const BASE_OTEL_ATTRIBUTES = {
  hostname: hostname(),
  version: config.serviceVersion,
} satisfies Attributes;
