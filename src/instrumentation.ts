import {opentelemetry} from "@elysia/opentelemetry";
import {BatchSpanProcessor} from "@opentelemetry/sdk-trace-node";
import {OTLPTraceExporter} from "@opentelemetry/exporter-trace-otlp-proto";

export const instrumentation = opentelemetry({
    serviceName: "chronos",
    spanProcessors: [
        new BatchSpanProcessor(
            new OTLPTraceExporter({
                url: "https://api.axiom.co/v1/traces",
                headers: {
                    Authorization: `Bearer ${process.env.AXIOM_API_KEY}`,
                    "X-Axiom-Dataset": process.env.AXIOM_DATASET || ""
                }
            })
        )
    ]
})