CREATE TABLE users (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id      BIGINT UNSIGNED NOT NULL,
  role_id              BIGINT UNSIGNED NOT NULL,

  name                 VARCHAR(150) NOT NULL,
  email                VARCHAR(255) NOT NULL,
  password_hash        VARCHAR(255) NOT NULL,

  status               ENUM('ACTIVE', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,

  last_login_at        DATETIME NULL,
  disabled_at          DATETIME NULL,

  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                       ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_users_org_email
    (organization_id, email),

  UNIQUE KEY uq_users_org_id
    (organization_id, id),

  KEY idx_users_org_role
    (organization_id, role_id),

  KEY idx_users_org_status
    (organization_id, status),

  CONSTRAINT fk_users_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id),

  CONSTRAINT fk_users_role
    FOREIGN KEY (organization_id, role_id)
    REFERENCES roles (organization_id, id)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;