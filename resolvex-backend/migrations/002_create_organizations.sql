CREATE TABLE organizations (
  id                            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code                          VARCHAR(30)     NOT NULL,
  name                          VARCHAR(200)    NOT NULL,
  status                        ENUM('PENDING', 'ACTIVE', 'DISABLED') NOT NULL DEFAULT 'PENDING',
  timezone                      VARCHAR(64)     NOT NULL DEFAULT 'UTC',
  contact_email                 VARCHAR(255)    NULL,
  contact_phone                 VARCHAR(30)     NULL,
  last_ticket_number            BIGINT UNSIGNED NOT NULL DEFAULT 0,
  approved_by_platform_admin_id BIGINT UNSIGNED NULL,
  approved_at                   DATETIME        NULL,
  disabled_at                   DATETIME        NULL,
  created_at                    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_organizations_code (code),
  KEY idx_organizations_status (status),
  KEY idx_organizations_approved_by (approved_by_platform_admin_id),

  CONSTRAINT fk_organizations_approved_by
    FOREIGN KEY (approved_by_platform_admin_id)
    REFERENCES platform_admins (id)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;