CREATE TABLE audit_logs (
  id                        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id           BIGINT UNSIGNED NULL,

  actor_type                ENUM(
                              'USER',
                              'PLATFORM_ADMIN',
                              'SYSTEM'
                            ) NOT NULL,

  actor_user_id             BIGINT UNSIGNED NULL,
  actor_platform_admin_id   BIGINT UNSIGNED NULL,

  action                    VARCHAR(100) NOT NULL,
  entity_type               VARCHAR(50) NOT NULL,
  entity_id                 BIGINT UNSIGNED NULL,

  metadata                  JSON NULL,

  request_id                VARCHAR(64) NULL,
  ip_address                VARCHAR(45) NULL,

  created_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY idx_audit_org_created
    (organization_id, created_at),

  KEY idx_audit_org_entity
    (organization_id, entity_type, entity_id),

  KEY idx_audit_org_actor
    (organization_id, actor_user_id),

  KEY idx_audit_org_action
    (organization_id, action),

  CONSTRAINT fk_audit_org
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id),

  CONSTRAINT fk_audit_actor_user
    FOREIGN KEY (organization_id, actor_user_id)
    REFERENCES users (organization_id, id),

  CONSTRAINT fk_audit_platform
    FOREIGN KEY (actor_platform_admin_id)
    REFERENCES platform_admins (id),

  CONSTRAINT chk_audit_actor
    CHECK (
      (
        actor_type = 'USER'
        AND actor_user_id IS NOT NULL
        AND actor_platform_admin_id IS NULL
      )
      OR
      (
        actor_type = 'PLATFORM_ADMIN'
        AND actor_user_id IS NULL
        AND actor_platform_admin_id IS NOT NULL
      )
      OR
      (
        actor_type = 'SYSTEM'
        AND actor_user_id IS NULL
        AND actor_platform_admin_id IS NULL
      )
    )

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;