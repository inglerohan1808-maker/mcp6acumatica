// Copyright 2026 Hall Boys, Inc.
// SPDX-License-Identifier: Apache-2.0

export interface BatchMaterialRow {
  LineNbr?: { value?: number } | number;
  InventoryID?: { value?: string } | string;
  Description?: { value?: string } | string;
  BatchQty?: { value?: number } | number;
  UOM?: { value?: string } | string;
  ProcessStepCD?: { value?: string } | string;
  LotSerialNbr?: { value?: string } | string;
  [key: string]: unknown;
}

export interface BatchProcessStepRow {
  ProcessStepCD?: { value?: string } | string;
  Description?: { value?: string } | string;
  WorkCenterID?: { value?: string } | string;
  MachineID?: { value?: string } | string;
  SetupTime?: { value?: number | string } | number | string;
  RunTime?: { value?: number | string } | number | string;
  Instructions?: { value?: string } | string;
  [key: string]: unknown;
}

export interface BatchRecord {
  BatchOrdCD?: { value?: string } | string;
  BatchOrderType?: { value?: string } | string;
  StatusID?: { value?: string } | string;
  FormulaID?: { value?: string } | string;
  RevisionNo?: { value?: string } | string;
  InventoryID?: { value?: string } | string;
  Descr?: { value?: string } | string;
  PlanQty?: { value?: number } | number;
  ActualQty?: { value?: number } | number;
  BaseUnit?: { value?: string } | string;
  StartDate?: { value?: string } | string;
  EndDate?: { value?: string } | string;
  SiteID?: { value?: string } | string;
  BatchMaterials?: BatchMaterialRow[];
  BatchProcessSteps?: BatchProcessStepRow[];
  [key: string]: unknown;
}

export function getVal<T>(field: unknown): T | undefined {
  if (field === null || field === undefined) return undefined;
  if (typeof field === "object" && "value" in (field as Record<string, unknown>)) {
    return (field as { value?: T }).value;
  }
  return field as T;
}

/**
 * Pure formatter for Batch Ticket Markdown traveler document.
 * Separated from network I/O for unit-testability under Node strip-types runner.
 */
export function formatBatchTicketMarkdown(
  batchData: BatchRecord,
  acumaticaUrl: string = "",
  batchNbrFallback: string = "",
  batchTypeFallback: string = "MX"
): { markdown: string; reportUrl: string } {
  const nbr = getVal<string>(batchData.BatchOrdCD) ?? batchNbrFallback;
  const type = getVal<string>(batchData.BatchOrderType) ?? batchTypeFallback;
  const status = getVal<string>(batchData.StatusID) ?? "Open";
  const formula = getVal<string>(batchData.FormulaID) ?? "N/A";
  const rev = getVal<string>(batchData.RevisionNo) ?? "01";
  const item = getVal<string>(batchData.InventoryID) ?? "N/A";
  const descr = getVal<string>(batchData.Descr) ?? "";
  const planQty = getVal<number>(batchData.PlanQty) ?? 0;
  const actualQty = getVal<number>(batchData.ActualQty) ?? 0;
  const uom = getVal<string>(batchData.BaseUnit) ?? "LBS";
  const startDate = getVal<string>(batchData.StartDate) ?? "N/A";
  const endDate = getVal<string>(batchData.EndDate) ?? "N/A";
  const siteID = getVal<string>(batchData.SiteID) ?? "DEFAULT";

  const materials = Array.isArray(batchData.BatchMaterials) ? batchData.BatchMaterials : [];
  const steps = Array.isArray(batchData.BatchProcessSteps) ? batchData.BatchProcessSteps : [];

  const cleanBase = acumaticaUrl.replace(/\/+$/, "");
  const reportUrl = `${cleanBase}/Frames/ReportLauncher.aspx?ID=EWPM6084.rpx&BatchNbr=${encodeURIComponent(nbr)}&BatchOrderType=${encodeURIComponent(type)}`;

  let md = `# 📋 PROCESS MANUFACTURING BATCH TICKET TRAVELER\n\n`;
  md += `**Batch Order:** ${type} - **${nbr}**  \n`;
  md += `**Status:** ${status} | **Warehouse Site:** ${siteID}  \n`;
  md += `**Formula ID:** ${formula} *(Revision: ${rev})*  \n`;
  md += `**Finished Good Item:** ${item}${descr ? ` &mdash; *${descr}*` : ""}  \n`;
  md += `**Planned Quantity:** ${planQty.toLocaleString()} ${uom} | **Actual Quantity:** ${actualQty.toLocaleString()} ${uom}  \n`;
  md += `**Schedule:** Start: ${startDate} | Due / End: ${endDate}  \n\n`;
  md += `---\n\n`;

  // Section 1: Dispensing & Ingredients
  md += `### 🧪 1. Materials & Dispensing Checklist\n\n`;
  if (materials.length > 0) {
    md += `| Line | Component Item | Description | Required Qty | UOM | Step | Lot/Batch Nbr | Weighed By | Checked By |\n`;
    md += `|:---|:---|:---|:---|:---|:---|:---|:---|:---|\n`;
    for (const m of materials) {
      const line = getVal<number>(m.LineNbr) ?? "-";
      const mItem = getVal<string>(m.InventoryID) ?? "-";
      const mDesc = getVal<string>(m.Description) ?? "-";
      const mQty = getVal<number>(m.BatchQty) ?? 0;
      const mUOM = getVal<string>(m.UOM) ?? uom;
      const mStep = getVal<string>(m.ProcessStepCD) ?? "-";
      const mLot = getVal<string>(m.LotSerialNbr) ?? "Pending Allocation";
      md += `| ${line} | **${mItem}** | ${mDesc} | ${mQty.toLocaleString()} | ${mUOM} | ${mStep} | \`${mLot}\` | [ &nbsp; ] | [ &nbsp; ] |\n`;
    }
  } else {
    md += `*No material line items retrieved. Verify materials tab in batch entry or expand parameter.*\n`;
  }
  md += `\n---\n\n`;

  // Section 2: Process Steps & Routing
  md += `### ⚙️ 2. Manufacturing Process Steps & Routing\n\n`;
  if (steps.length > 0) {
    md += `| Step CD | Operation Description | Work Center | Machine | Setup (Min) | Run (Min) | Operator Sign-Off |\n`;
    md += `|:---|:---|:---|:---|:---|:---|:---|\n`;
    for (const s of steps) {
      const sCD = getVal<string>(s.ProcessStepCD) ?? "-";
      const sDesc = getVal<string>(s.Description) ?? "-";
      const sWc = getVal<string>(s.WorkCenterID) ?? "-";
      const sMach = getVal<string>(s.MachineID) ?? "-";
      const sSetup = getVal<number | string>(s.SetupTime) ?? 0;
      const sRun = getVal<number | string>(s.RunTime) ?? 0;
      md += `| **${sCD}** | ${sDesc} | ${sWc} | ${sMach} | ${sSetup} | ${sRun} | [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ] |\n`;
    }
  } else {
    md += `*No routing steps retrieved for this batch order.*\n`;
  }
  md += `\n---\n\n`;

  // Section 3: Quality & Release Sign-Off
  md += `### 🔍 3. Quality & Batch Release Sign-Off\n\n`;
  md += `- **Yield Inspection:** Planned: ${planQty.toLocaleString()} ${uom} | Actual Produced: _______ ${uom}  \n`;
  md += `- **QC Analyst Signature:** _____________________________ &nbsp;&nbsp; **Date:** ____________  \n`;
  md += `- **Production Supervisor:** _____________________________ &nbsp;&nbsp; **Date:** ____________  \n\n`;
  md += `🔗 [Open Official Batch Ticket Report in Acumatica](${reportUrl})\n`;

  return { markdown: md, reportUrl };
}
