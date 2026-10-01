CREATE TABLE ticket_comments (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id   BIGINT UNSIGNED NOT NULL,

  ticket_id         BIGINT UNSIGNED NOT NULL,
  author_id         BIGINT UNSIGNED NOT NULL,

  body              TEXT NOT NULL,

  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY idx_ticket_comments_org_ticket
    (organization_id, ticket_id, created_at),

  KEY idx_ticket_comments_org_author
    (organization_id, author_id),

  CONSTRAINT fk_ticket_comments_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id),

  CONSTRAINT fk_ticket_comments_ticket
    FOREIGN KEY (organization_id, ticket_id)
    REFERENCES tickets (organization_id, id),

  CONSTRAINT fk_ticket_comments_author
    FOREIGN KEY (organization_id, author_id)
    REFERENCES users (organization_id, id)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;