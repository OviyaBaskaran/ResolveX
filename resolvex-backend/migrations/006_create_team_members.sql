CREATE TABLE team_members (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id  BIGINT UNSIGNED NOT NULL,

  team_id          BIGINT UNSIGNED NOT NULL,
  user_id          BIGINT UNSIGNED NOT NULL,

  added_by         BIGINT UNSIGNED NOT NULL,

  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_team_members_team_user
    (organization_id, team_id, user_id),

  KEY idx_team_members_org_user
    (organization_id, user_id),

  KEY idx_team_members_org_team
    (organization_id, team_id),

  KEY idx_team_members_org_added_by
    (organization_id, added_by),

  CONSTRAINT fk_team_members_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id),

  CONSTRAINT fk_team_members_team
    FOREIGN KEY (organization_id, team_id)
    REFERENCES teams (organization_id, id),

  CONSTRAINT fk_team_members_user
    FOREIGN KEY (organization_id, user_id)
    REFERENCES users (organization_id, id),

  CONSTRAINT fk_team_members_added_by
    FOREIGN KEY (organization_id, added_by)
    REFERENCES users (organization_id, id)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;