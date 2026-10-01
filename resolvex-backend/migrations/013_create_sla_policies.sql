CREATE TABLE sla_policies (
  id                       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id          BIGINT UNSIGNED NOT NULL,

  priority                 ENUM(
                              'LOW',
                              'MEDIUM',
                              'HIGH',
                              'CRITICAL'
                            ) NOT NULL,

  response_time_minutes    INT UNSIGNED NOT NULL,
  resolution_time_minutes  INT UNSIGNED NOT NULL,

  is_active                BOOLEAN NOT NULL DEFAULT TRUE,

  created_by               BIGINT UNSIGNED NOT NULL,

  created_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                           ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_sla_policies_org_priority
    (organization_id, priority),

  UNIQUE KEY uq_sla_policies_org_id
    (organization_id, id),

  KEY idx_sla_policies_org_active
    (organization_id, is_active),

  CONSTRAINT fk_sla_policies_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id),

  CONSTRAINT fk_sla_policies_created_by
    FOREIGN KEY (organization_id, created_by)
    REFERENCES users (organization_id, id),

  CONSTRAINT chk_sla_response_time
    CHECK (response_time_minutes > 0),

  CONSTRAINT chk_sla_resolution_time
    CHECK (
      resolution_time_minutes >= response_time_minutes
    )

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;