CREATE TABLE ticket_internal_notes (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id   BIGINT UNSIGNED NOT NULL,

  ticket_id         BIGINT UNSIGNED NOT NULL,
  author_id         BIGINT UNSIGNED NOT NULL,

  content           TEXT NOT NULL,

  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY idx_internal_notes_org_ticket
    (organization_id, ticket_id, created_at),

  KEY idx_internal_notes_org_author
    (organization_id, author_id),

  CONSTRAINT fk_internal_notes_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id),

  CONSTRAINT fk_internal_notes_ticket
    FOREIGN KEY (organization_id, ticket_id)
    REFERENCES tickets (organization_id, id),

  CONSTRAINT fk_internal_notes_author
    FOREIGN KEY (organization_id, author_id)
    REFERENCES users (organization_id, id)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;