import assert from "node:assert/strict";
import test from "node:test";
import { createTicketAttachmentSchema } from "./ticket-attachment.validation.js";
import { createTicketCommentSchema } from "./ticket-comment.validation.js";

test("ticket comments preserve the client-selected type", () => {
  const result = createTicketCommentSchema.parse({ body: "Please help", type: "INTERNAL" });
  assert.deepEqual(result, { body: "Please help", type: "INTERNAL" });
});

test("attachments larger than the upload limit are rejected", () => {
  const result = createTicketAttachmentSchema.safeParse({
    fileName: "large.pdf",
    mimeType: "application/pdf",
    fileSize: 50 * 1024 * 1024 + 1,
    url: "https://example.com/large.pdf",
    publicId: "resolvex/tickets/1/large"
  });
  assert.equal(result.success, false);
});
