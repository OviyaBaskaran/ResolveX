CREATE TABLE roles (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id  BIGINT UNSIGNED NOT NULL,
  code             ENUM(
                     'CUSTOMER',
                     'SUPPORT_AGENT',
                     'MANAGER',
                     'ORGANIZATION_ADMIN'
                   ) NOT NULL,
  name             VARCHAR(100) NOT NULL,
  description      VARCHAR(255) NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_roles_org_code
    (organization_id, code),

  UNIQUE KEY uq_roles_org_id
    (organization_id, id),

  KEY idx_roles_organization
    (organization_id),

  CONSTRAINT fk_roles_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;