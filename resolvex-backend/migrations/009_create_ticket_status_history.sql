CREATE TABLE ticket_status_history (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id   BIGINT UNSIGNED NOT NULL,

  ticket_id         BIGINT UNSIGNED NOT NULL,
  changed_by        BIGINT UNSIGNED NOT NULL,

  previous_status   ENUM(
                      'OPEN',
                      'ASSIGNED',
                      'IN_PROGRESS',
                      'WAITING_FOR_CUSTOMER',
                      'RESOLVED',
                      'CLOSED',
                      'REOPENED'
                    ) NULL,

  new_status        ENUM(
                      'OPEN',
                      'ASSIGNED',
                      'IN_PROGRESS',
                      'WAITING_FOR_CUSTOMER',
                      'RESOLVED',
                      'CLOSED',
                      'REOPENED'
                    ) NOT NULL,

  reason            VARCHAR(500) NULL,

  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY idx_status_history_org_ticket
    (organization_id, ticket_id, created_at),

  KEY idx_status_history_org_changed_by
    (organization_id, changed_by),

  CONSTRAINT fk_status_history_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id),

  CONSTRAINT fk_status_history_ticket
    FOREIGN KEY (organization_id, ticket_id)
    REFERENCES tickets (organization_id, id),

  CONSTRAINT fk_status_history_changed_by
    FOREIGN KEY (organization_id, changed_by)
    REFERENCES users (organization_id, id)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;