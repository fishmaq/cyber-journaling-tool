-- This script initially inserts data for all tables in the "config" schema

-- OWNER
INSERT INTO config.owner (name) VALUES ('SOC Leiter (Security Operation Cell Leiter');
INSERT INTO config.owner (name) VALUES ('Service Owner');
INSERT INTO config.owner (name) VALUES ('Tech Lead');

-- CASE_STATE
INSERT INTO config.case_state (name) VALUES ('Triage');
INSERT INTO config.case_state (name) VALUES ('Event');
INSERT INTO config.case_state (name) VALUES ('Incident');
INSERT INTO config.case_state (name) VALUES ('Critical');
INSERT INTO config.case_state (name) VALUES ('Review');
INSERT INTO config.case_state (name) VALUES ('Closed');

-- SEVERITY_LEVEL
INSERT INTO config.severity_level (name, color_code) VALUES ('Low', '#f9c74f');
INSERT INTO config.severity_level (name, color_code) VALUES ('Medium', '#f3722c');
INSERT INTO config.severity_level (name, color_code) VALUES ('High', '#bc4749');
INSERT INTO config.severity_level (name, color_code) VALUES ('Critical', '#6f1d1b');

-- DEVICE HEALTH
INSERT INTO config.device_health (name, color_code) VALUES ('Device Offline (Healthy)', '#c0d197');
INSERT INTO config.device_health (name, color_code) VALUES ('Device Offline (Compromised)', '#b37273');
INSERT INTO config.device_health (name, color_code) VALUES ('Device Online (Healthy)', '#a7c957');
INSERT INTO config.device_health (name, color_code) VALUES ('Device Online (Compromised)', '#bc4749');

-- EVENT_TYPE
INSERT INTO config.event_type (name) VALUES ('Finding/Evidence');
INSERT INTO config.event_type (name) VALUES ('Action');
INSERT INTO config.event_type (name) VALUES ('Decision');
INSERT INTO config.event_type (name) VALUES ('Meeting');
INSERT INTO config.event_type (name) VALUES ('Join/Leave');
INSERT INTO config.event_type (name) VALUES ('Comms');
INSERT INTO config.event_type (name) VALUES ('Note');

--TEAM
INSERT INTO config.team (name, color_code) VALUES ('Attacker','#da627d');
INSERT INTO config.team (name, color_code) VALUES ('Defender','#6096ba');