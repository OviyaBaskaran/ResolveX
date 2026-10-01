CREATE TABLE tickets (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id  BIGINT UNSIGNED NOT NULL,

  ticket_number    BIGINT UNSIGNED NOT NULL,

  subject          VARCHAR(255) NOT NULL,
  description      TEXT NOT NULL,

  priority         ENUM(
                     'LOW',
                     'MEDIUM',
                     'HIGH',
                     'CRITICAL'
                   ) NOT NULL DEFAULT 'MEDIUM',

  status           ENUM(
                     'OPEN',
                     'ASSIGNED',
                     'IN_PROGRESS',
                     'WAITING_FOR_CUSTOMER',
                     'RESOLVED',
                     'CLOSED',
                     'REOPENED'
                   ) NOT NULL DEFAULT 'OPEN',

  customer_id      BIGINT UNSIGNED NOT NULL,
  team_id          BIGINT UNSIGNED NULL,
  assignee_id      BIGINT UNSIGNED NULL,

  resolved_at      DATETIME NULL,
  closed_at        DATETIME NULL,

  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                   ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_tickets_org_number
    (organization_id, ticket_number),

  UNIQUE KEY uq_tickets_org_id
    (organization_id, id),

  KEY idx_tickets_org_customer
    (organization_id, customer_id),

  KEY idx_tickets_org_team
    (organization_id, team_id),

  KEY idx_tickets_org_assignee
    (organization_id, assignee_id),

  KEY idx_tickets_org_status
    (organization_id, status),

  KEY idx_tickets_org_priority
    (organization_id, priority),

  KEY idx_tickets_org_created
    (organization_id, created_at),

  CONSTRAINT fk_tickets_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id),

  CONSTRAINT fk_tickets_customer
    FOREIGN KEY (organization_id, customer_id)
    REFERENCES users (organization_id, id),

  CONSTRAINT fk_tickets_team
    FOREIGN KEY (organization_id, team_id)
    REFERENCES teams (organization_id, id),

  CONSTRAINT fk_tickets_assignee
    FOREIGN KEY (organization_id, assignee_id)
    REFERENCES users (organization_id, id)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;