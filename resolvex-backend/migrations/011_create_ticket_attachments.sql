CREATE TABLE IF NOT EXISTS ticket_attachments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ticket_id BIGINT UNSIGNED NOT NULL,
    organization_id BIGINT UNSIGNED NOT NULL,
    uploaded_by BIGINT UNSIGNED NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(120) NOT NULL,
    file_size BIGINT UNSIGNED NOT NULL,
    url VARCHAR(500) NOT NULL,
    public_id VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_ticket_attachments_ticket_id (ticket_id),
    KEY idx_ticket_attachments_org_created_at (organization_id, created_at),

    CONSTRAINT fk_ticket_attachments_ticket
        FOREIGN KEY (ticket_id)
        REFERENCES tickets(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_ticket_attachments_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_ticket_attachments_user
        FOREIGN KEY (uploaded_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

ALTER TABLE ticket_attachments
    ADD COLUMN IF NOT EXISTS url VARCHAR(500) NULL AFTER file_size,
    ADD COLUMN IF NOT EXISTS public_id VARCHAR(500) NULL AFTER url;

ALTER TABLE ticket_attachments
    DROP COLUMN IF EXISTS storage_key;
