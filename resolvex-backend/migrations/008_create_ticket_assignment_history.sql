CREATE TABLE ticket_assignment_history (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id      BIGINT UNSIGNED NOT NULL,

  ticket_id            BIGINT UNSIGNED NOT NULL,
  changed_by           BIGINT UNSIGNED NOT NULL,

  previous_team_id     BIGINT UNSIGNED NULL,
  new_team_id          BIGINT UNSIGNED NULL,

  previous_assignee_id BIGINT UNSIGNED NULL,
  new_assignee_id      BIGINT UNSIGNED NULL,

  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY idx_assignment_history_org_ticket
    (organization_id, ticket_id, created_at),

  KEY idx_assignment_history_org_changed_by
    (organization_id, changed_by),

  CONSTRAINT fk_assignment_history_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id),

  CONSTRAINT fk_assignment_history_ticket
    FOREIGN KEY (organization_id, ticket_id)
    REFERENCES tickets (organization_id, id),

  CONSTRAINT fk_assignment_history_changed_by
    FOREIGN KEY (organization_id, changed_by)
    REFERENCES users (organization_id, id),

  CONSTRAINT fk_assignment_history_previous_team
    FOREIGN KEY (organization_id, previous_team_id)
    REFERENCES teams (organization_id, id),

  CONSTRAINT fk_assignment_history_new_team
    FOREIGN KEY (organization_id, new_team_id)
    REFERENCES teams (organization_id, id),

  CONSTRAINT fk_assignment_history_previous_assignee
    FOREIGN KEY (organization_id, previous_assignee_id)
    REFERENCES users (organization_id, id),

  CONSTRAINT fk_assignment_history_new_assignee
    FOREIGN KEY (organization_id, new_assignee_id)
    REFERENCES users (organization_id, id)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;