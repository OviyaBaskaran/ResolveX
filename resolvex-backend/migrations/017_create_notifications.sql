CREATE TABLE notifications (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id     BIGINT UNSIGNED NOT NULL,

  recipient_user_id   BIGINT UNSIGNED NOT NULL,

  type                VARCHAR(100) NOT NULL,
  title               VARCHAR(255) NOT NULL,
  message             TEXT NULL,

  resource_type       VARCHAR(50) NULL,
  resource_id         BIGINT UNSIGNED NULL,

  is_read             BOOLEAN NOT NULL DEFAULT FALSE,
  read_at             DATETIME NULL,

  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY idx_notifications_org_recipient_read
    (organization_id, recipient_user_id, is_read, created_at),

  KEY idx_notifications_org_resource
    (organization_id, resource_type, resource_id),

  CONSTRAINT fk_notifications_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id),

  CONSTRAINT fk_notifications_recipient
    FOREIGN KEY (organization_id, recipient_user_id)
    REFERENCES users (organization_id, id)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;