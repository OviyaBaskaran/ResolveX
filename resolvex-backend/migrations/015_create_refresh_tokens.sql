CREATE TABLE refresh_tokens (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id       BIGINT UNSIGNED NOT NULL,

  user_id               BIGINT UNSIGNED NOT NULL,

  token_hash            CHAR(64) NOT NULL,

  expires_at            DATETIME NOT NULL,
  revoked_at            DATETIME NULL,

  replaced_by_token_id  BIGINT UNSIGNED NULL,

  user_agent             VARCHAR(500) NULL,
  ip_address             VARCHAR(45) NULL,

  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_refresh_tokens_hash
    (token_hash),

  KEY idx_refresh_tokens_org_user
    (organization_id, user_id),

  KEY idx_refresh_tokens_expires
    (expires_at),

  KEY idx_refresh_tokens_replaced_by
    (replaced_by_token_id),

  CONSTRAINT fk_refresh_tokens_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id),

  CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (organization_id, user_id)
    REFERENCES users (organization_id, id)
    ON DELETE CASCADE,

  CONSTRAINT fk_refresh_tokens_replaced_by
    FOREIGN KEY (replaced_by_token_id)
    REFERENCES refresh_tokens (id)
    ON DELETE SET NULL

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;