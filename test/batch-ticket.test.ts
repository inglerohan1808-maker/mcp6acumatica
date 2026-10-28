// Copyright 2026 Hall Boys, Inc.
// SPDX-License-Identifier: Apache-2.0

import { test } from "node:test";
import assert from "node:assert";
import { formatBatchTicketMarkdown, type BatchRecord } from "../src/tools/batch-ticket-format.ts";

test("formatBatchTicketMarkdown renders complete traveler sections with materials and steps", () => {
  const mockBatch: BatchRecord = {
    BatchOrdCD: "BAT000123",
    BatchOrderType: "MX",
    StatusID: "Released",
    FormulaID: "FOR000500",
    RevisionNo: "02",
    InventoryID: "PAINT-WHITE-01",
    Descr: "Premium Interior White Latex",
    PlanQty: 2500,
    ActualQty: 0,
    BaseUnit: "GAL",
    StartDate: "2026-10-28",
    EndDate: "2026-10-29",
    SiteID: "PLANT1",
    BatchMaterials: [
      {
        LineNbr: 1,
        InventoryID: "RAW-RESIN-01",
        Description: "Acrylic Latex Resin",
        BatchQty: 1200,
        UOM: "GAL",
        ProcessStepCD: "10",
        LotSerialNbr: "LOT-9921",
      },
      {
        LineNbr: 2,
        InventoryID: "RAW-TIO2-01",
        Description: "Titanium Dioxide Pigment Slurry",
        BatchQty: 800,
        UOM: "LBS",
        ProcessStepCD: "20",
        LotSerialNbr: "LOT-8832",
      },
    ],
    BatchProcessSteps: [
      {
        ProcessStepCD: "10",
        Description: "Charge Base Liquids & Resin",
        WorkCenterID: "MIX-WC1",
        MachineID: "TANK-04",
        SetupTime: 15,
        RunTime: 45,
      },
      {
        ProcessStepCD: "20",
        Description: "Disperse Pigment Slurry at High Speed",
        WorkCenterID: "DISP-WC2",
        MachineID: "COWLES-02",
        SetupTime: 10,
        RunTime: 60,
      },
    ],
  };

  const { markdown, reportUrl } = formatBatchTicketMarkdown(
    mockBatch,
    "https://erp.example.com/Acumatica",
    "BAT000123",
    "MX"
  );

  // Assertions for header
  assert.ok(markdown.includes("PROCESS MANUFACTURING BATCH TICKET TRAVELER"));
  assert.ok(markdown.includes("MX - **BAT000123**"));
  assert.ok(markdown.includes("PAINT-WHITE-01"));
  assert.ok(markdown.includes("FOR000500"));
  assert.ok(markdown.includes("PLANT1"));

  // Assertions for materials checklist
  assert.ok(markdown.includes("Materials & Dispensing Checklist"));
  assert.ok(markdown.includes("RAW-RESIN-01"));
  assert.ok(markdown.includes("LOT-9921"));
  assert.ok(markdown.includes("RAW-TIO2-01"));
  assert.ok(markdown.includes("LOT-8832"));

  // Assertions for routing steps
  assert.ok(markdown.includes("Manufacturing Process Steps & Routing"));
  assert.ok(markdown.includes("Charge Base Liquids & Resin"));
  assert.ok(markdown.includes("MIX-WC1"));
  assert.ok(markdown.includes("COWLES-02"));

  // Assertions for sign-off and report link
  assert.ok(markdown.includes("Quality & Batch Release Sign-Off"));
  assert.ok(markdown.includes("Open Official Batch Ticket Report in Acumatica"));
  assert.ok(reportUrl.includes("ID=EWPM6084.rpx"));
  assert.ok(reportUrl.includes("BatchNbr=BAT000123"));
});

test("formatBatchTicketMarkdown gracefully handles empty materials and process steps", () => {
  const emptyBatch: BatchRecord = {
    BatchOrdCD: "BAT000999",
    BatchOrderType: "FL",
    StatusID: "Planned",
  };

  const { markdown, reportUrl } = formatBatchTicketMarkdown(emptyBatch, "https://erp.example.com", "BAT000999", "FL");

  assert.ok(markdown.includes("FL - **BAT000999**"));
  assert.ok(markdown.includes("No material line items retrieved"));
  assert.ok(markdown.includes("No routing steps retrieved"));
  assert.ok(reportUrl.includes("BatchNbr=BAT000999"));
});
