CREATE TABLE ticket_sla (
  id                       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id          BIGINT UNSIGNED NOT NULL,

  ticket_id                BIGINT UNSIGNED NOT NULL,
  sla_policy_id            BIGINT UNSIGNED NOT NULL,

  priority_snapshot        ENUM(
                              'LOW',
                              'MEDIUM',
                              'HIGH',
                              'CRITICAL'
                            ) NOT NULL,

  response_time_minutes    INT UNSIGNED NOT NULL,
  resolution_time_minutes  INT UNSIGNED NOT NULL,

  response_due_at          DATETIME NOT NULL,
  resolution_due_at        DATETIME NOT NULL,

  first_response_at        DATETIME NULL,
  resolution_completed_at  DATETIME NULL,

  is_paused                BOOLEAN NOT NULL DEFAULT FALSE,
  paused_at                DATETIME NULL,
  total_paused_seconds     BIGINT UNSIGNED NOT NULL DEFAULT 0,

  response_breached        BOOLEAN NOT NULL DEFAULT FALSE,
  resolution_breached      BOOLEAN NOT NULL DEFAULT FALSE,

  created_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                           ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_ticket_sla_ticket
    (ticket_id),

  KEY idx_ticket_sla_org_response_due
    (organization_id, response_due_at),

  KEY idx_ticket_sla_org_resolution_due
    (organization_id, resolution_due_at),

  KEY idx_ticket_sla_org_policy
    (organization_id, sla_policy_id),

  CONSTRAINT fk_ticket_sla_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id),

  CONSTRAINT fk_ticket_sla_ticket
    FOREIGN KEY (organization_id, ticket_id)
    REFERENCES tickets (organization_id, id),

  CONSTRAINT fk_ticket_sla_policy
    FOREIGN KEY (organization_id, sla_policy_id)
    REFERENCES sla_policies (organization_id, id),

  CONSTRAINT chk_ticket_sla_resolution_time
    CHECK (
      resolution_time_minutes >= response_time_minutes
    )

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;