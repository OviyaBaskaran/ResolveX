CREATE TABLE teams (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id  BIGINT UNSIGNED NOT NULL,

  name             VARCHAR(150) NOT NULL,
  description      VARCHAR(500) NULL,

  manager_id       BIGINT UNSIGNED NULL,

  status           ENUM('ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',

  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                   ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_teams_org_name
    (organization_id, name),

  UNIQUE KEY uq_teams_org_id
    (organization_id, id),

  KEY idx_teams_org_status
    (organization_id, status),

  KEY idx_teams_org_manager
    (organization_id, manager_id),

  CONSTRAINT fk_teams_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id),

  CONSTRAINT fk_teams_manager
    FOREIGN KEY (organization_id, manager_id)
    REFERENCES users (organization_id, id)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;