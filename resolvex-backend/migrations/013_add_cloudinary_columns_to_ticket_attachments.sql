ALTER TABLE ticket_attachments
    ADD COLUMN url VARCHAR(500) NULL AFTER file_size,
    ADD COLUMN public_id VARCHAR(500) NULL AFTER url;
