CREATE TABLE password_reset_tokens (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id   BIGINT UNSIGNED NOT NULL,

  user_id           BIGINT UNSIGNED NOT NULL,

  token_hash        CHAR(64) NOT NULL,

  expires_at        DATETIME NOT NULL,
  used_at           DATETIME NULL,

  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_password_reset_tokens_hash
    (token_hash),

  KEY idx_password_reset_tokens_org_user
    (organization_id, user_id),

  KEY idx_password_reset_tokens_expires
    (expires_at),

  CONSTRAINT fk_password_reset_tokens_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id),

  CONSTRAINT fk_password_reset_tokens_user
    FOREIGN KEY (organization_id, user_id)
    REFERENCES users (organization_id, id)
    ON DELETE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;