// Copyright 2026 Hall Boys, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { AppEnv } from "../types/acumatica";
import { AcumaticaClient, AcumaticaApiError, unwrapFields } from "../lib/acumatica-client";
import { getConfig } from "../lib/config";
import { formatBatchTicketMarkdown, type BatchRecord } from "./batch-ticket-format";

export { formatBatchTicketMarkdown, type BatchRecord } from "./batch-ticket-format";

/**
 * Generates a structured Batch Ticket traveler document from PMS batch data.
 */
export async function handleGenerateBatchTicket(
  env: AppEnv,
  acumaticaUsername: string,
  args: {
    batchNbr: string;
    batchType?: string;
  }
): Promise<unknown> {
  const batchNbr = args.batchNbr.trim();
  const batchType = (args.batchType ?? "MX").trim();

  if (!batchNbr) {
    return { error: "batchNbr is required to generate a batch ticket." };
  }

  const endpointName = await getConfig(env.store, "endpoint_name", env.ACUMATICA_ENDPOINT_NAME ?? "EWPMEndPoint");
  const endpointVersion = await getConfig(env.store, "endpoint_version", env.ACUMATICA_ENDPOINT_VERSION ?? "25.200.002");
  const acumaticaUrl = env.ACUMATICA_URL ?? "";

  const client = new AcumaticaClient(env, acumaticaUsername);

  let batchData: BatchRecord | null = null;

  // 1. First attempt: Query Contract REST API for EWPMBatch with materials & process steps expanded
  try {
    const path = `entity/${endpointName}/${endpointVersion}/EWPMBatch/${encodeURIComponent(batchType)}/${encodeURIComponent(batchNbr)}?$expand=BatchMaterials,BatchProcessSteps`;
    const response = await client.get<BatchRecord>("acumatica_generate_batch_ticket", path);
    batchData = unwrapFields(response) as BatchRecord;
  } catch (err) {
    // If 404 or entity not configured in REST endpoint yet, attempt fallback to Generic Inquiry
    if (err instanceof AcumaticaApiError && err.statusCode === 404) {
      try {
        const filter = `BatchOrderType eq '${batchType}' and BatchOrdCD eq '${batchNbr}'`;
        const odataRes = await client.getOData<{ value: BatchRecord[] }>(
          "acumatica_generate_batch_ticket",
          `EWPM-BatchEntry?$filter=${encodeURIComponent(filter)}`
        );
        if (odataRes?.value && odataRes.value.length > 0) {
          batchData = odataRes.value[0];
        }
      } catch {
        // Fallback also failed or GI not exposed
      }
    }
    if (!batchData) {
      throw err;
    }
  }

  if (!batchData) {
    return { error: `Batch order '${batchType}-${batchNbr}' was not found in Acumatica PMS.` };
  }

  const { markdown, reportUrl } = formatBatchTicketMarkdown(batchData, acumaticaUrl, batchNbr, batchType);

  return {
    batchTicketMarkdown: markdown,
    batchData,
    reportUrl,
  };
}
