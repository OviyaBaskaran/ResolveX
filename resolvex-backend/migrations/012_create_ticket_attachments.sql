CREATE TABLE ticket_attachments (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id     BIGINT UNSIGNED NOT NULL,

  ticket_id           BIGINT UNSIGNED NOT NULL,
  uploaded_by         BIGINT UNSIGNED NOT NULL,

  original_filename   VARCHAR(255) NOT NULL,
  mime_type           VARCHAR(100) NOT NULL,
  file_size_bytes     BIGINT UNSIGNED NOT NULL,

  storage_provider    ENUM('S3') NOT NULL DEFAULT 'S3',
  storage_key         VARCHAR(500) NOT NULL,

  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_ticket_attachments_storage_key
    (storage_key),

  KEY idx_ticket_attachments_org_ticket
    (organization_id, ticket_id, created_at),

  KEY idx_ticket_attachments_org_uploaded_by
    (organization_id, uploaded_by),

  CONSTRAINT fk_ticket_attachments_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id),

  CONSTRAINT fk_ticket_attachments_ticket
    FOREIGN KEY (organization_id, ticket_id)
    REFERENCES tickets (organization_id, id),

  CONSTRAINT fk_ticket_attachments_uploaded_by
    FOREIGN KEY (organization_id, uploaded_by)
    REFERENCES users (organization_id, id),

  CONSTRAINT chk_ticket_attachments_file_size
    CHECK (file_size_bytes > 0)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;