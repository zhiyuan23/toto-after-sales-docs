-- 投诉业务独立计时，不改变原工单状态。执行前确认已有顾客与工单表。
CREATE TABLE afs_complaint (
 id BIGINT NOT NULL PRIMARY KEY,
 order_id BIGINT NOT NULL,
 subject VARCHAR(200) NOT NULL,
 status VARCHAR(20) NOT NULL,
 content_ciphertext TEXT NOT NULL,
 actor_id BIGINT NOT NULL,
 request_id VARCHAR(64) NOT NULL,
 request_hash VARCHAR(128) NOT NULL,
 revision BIGINT NOT NULL DEFAULT 1,
 received_at DATETIME NOT NULL,
 created_at DATETIME NOT NULL,
 updated_at DATETIME NOT NULL,
 closed_at DATETIME NULL,
 CONSTRAINT fk_complaint_order FOREIGN KEY (order_id) REFERENCES afs_service_order(id),
 CONSTRAINT uq_complaint_request UNIQUE (order_id,request_id),
 CONSTRAINT ck_complaint_status CHECK (status IN ('OPEN','PROCESSING','FOLLOW_UP','CLOSED')),
 INDEX ix_complaint_received (received_at,id),
 INDEX ix_complaint_status (status,received_at)
);
CREATE TABLE afs_complaint_event (
 id BIGINT NOT NULL PRIMARY KEY,
 complaint_id BIGINT NOT NULL,
 action_code VARCHAR(30) NOT NULL,
 from_status VARCHAR(20) NOT NULL,
 to_status VARCHAR(20) NOT NULL,
 content_ciphertext TEXT NOT NULL,
 actor_id BIGINT NOT NULL,
 request_id VARCHAR(64) NOT NULL,
 request_hash VARCHAR(128) NOT NULL,
 created_at DATETIME NOT NULL,
 CONSTRAINT fk_complaint_event FOREIGN KEY (complaint_id) REFERENCES afs_complaint(id),
 CONSTRAINT uq_complaint_event_request UNIQUE (complaint_id,request_id),
 INDEX ix_complaint_event_time (complaint_id,created_at,id)
);
