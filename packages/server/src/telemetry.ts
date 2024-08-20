import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import {
  ConsoleSpanExporter,
  SpanExporter,
} from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { Resource } from "@opentelemetry/resources";
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

const telemetryEnabled = process.env.OTEL_ENABLED?.toLowerCase() === "true";

let sdk: NodeSDK;

if (telemetryEnabled) {
  let exporter: SpanExporter;

  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT !== "") {
    exporter = new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    });
  } else {
    exporter = new ConsoleSpanExporter();
  }

  const sdk = new NodeSDK({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: process.env.SERVICE_NAME || "phemvault",
      [SEMRESATTRS_SERVICE_VERSION]: process.env.SERVICE_VERSION || "v1.0.0",
    }),
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
}

export const otlpShutdown = async () => {
  await sdk?.shutdown();
};
