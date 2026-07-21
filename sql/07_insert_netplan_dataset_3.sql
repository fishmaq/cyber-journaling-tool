--TEAM
INSERT INTO config.team (name, color_code) VALUES ('Military T1','#6096ba');
INSERT INTO config.team (name, color_code) VALUES ('NetAG T1','#6096ba');
INSERT INTO config.team (name, color_code) VALUES ('Military T2','#588157');
INSERT INTO config.team (name, color_code) VALUES ('NetAG T2','#588157');

--NETPLAN GROUP
INSERT INTO data.netplan_group (id, team_id, name, priority, color_code)
VALUES (1, 1, 'MIL Firewall', 1, '#ef8354');
INSERT INTO data.netplan_group (id, team_id, name, priority, color_code)
VALUES (2, 1, 'MIL DMZ', 2, '#f4b183');
INSERT INTO data.netplan_group (id, team_id, name, priority, color_code)
VALUES (3, 1, 'MIL LAN', 3, '#f4b183');
INSERT INTO data.netplan_group (id, team_id, name, priority, color_code)
VALUES (4, 1, 'MIL INT', 4, '#fff2a8');
INSERT INTO data.netplan_group (id, team_id, name, priority, color_code)
VALUES (5, 2, 'NETAG Firewall', 1, '#ef8354');
INSERT INTO data.netplan_group (id, team_id, name, priority, color_code)
VALUES (6, 2, 'NETAG DMZ', 2, '#d9d9d9');
INSERT INTO data.netplan_group (id, team_id, name, priority, color_code)
VALUES (7, 2, 'NETAG LAN', 3, '#d9d9d9');
INSERT INTO data.netplan_group (id, team_id, name, priority, color_code)
VALUES (8, 2, 'NETAG INT', 4, '#d9ead3');
INSERT INTO data.netplan_group (id, team_id, name, priority, color_code)
VALUES (9, 3, 'MIL Firewall', 1, '#ef8354');
INSERT INTO data.netplan_group (id, team_id, name, priority, color_code)
VALUES (10, 3, 'MIL DMZ', 2, '#f4b183');
INSERT INTO data.netplan_group (id, team_id, name, priority, color_code)
VALUES (11, 3, 'MIL LAN', 3, '#f4b183');
INSERT INTO data.netplan_group (id, team_id, name, priority, color_code)
VALUES (12, 3, 'MIL INT', 4, '#fff2a8');
INSERT INTO data.netplan_group (id, team_id, name, priority, color_code)
VALUES (13, 4, 'NETAG Firewall', 1, '#ef8354');
INSERT INTO data.netplan_group (id, team_id, name, priority, color_code)
VALUES (14, 4, 'NETAG DMZ', 2, '#d9d9d9');
INSERT INTO data.netplan_group (id, team_id, name, priority, color_code)
VALUES (15, 4, 'NETAG LAN', 3, '#d9d9d9');
INSERT INTO data.netplan_group (id, team_id, name, priority, color_code)
VALUES (16, 4, 'NETAG INT', 4, '#d9ead3');

-- hosts and services for team 'mil1' (team_id 1)
INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (1, 1, 'Linux Firewall', 1, '10.1.242.11/24
10.1.0.1/24
10.1.2.1/24
10.1.4.1/24', '', '#acd8aa');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (1, 1, 'Linux Firewall', 'Perimeter firewall protecting the Military Domain and routing traffic between DMZ, Intranet, and LAN.', 'firewall.svg', true);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (2, 2, 'tips Webserver', 1, '10.1.2.80/24', '', '#acd8aa');
INSERT INTO data.service (id, host_id, name, description, port, icon_name, exposed)
VALUES (2, 2, 'tips Webserver', 'Public web server available in the Military DMZ.', 80, 'tips.svg', true);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (3, 2, 'INTRANET', 2, '10.1.2.2/24', '', '#acd8aa');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (3, 3, 'INTRANET', 'Military intranet application hosted in the DMZ.', 'linux.svg', true);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (4, 3, 'mil-ws-01', 1, '10.1.4.11', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (4, 4, 'mil-ws-01', 'Military Domain Linux workstation.', 'linux.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (5, 3, 'mil-ws-02', 2, '10.1.4.12', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (5, 5, 'mil-ws-02', 'Military Domain Linux workstation.', 'linux.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (6, 3, 'mil-ws-03', 3, '10.1.4.13', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (6, 6, 'mil-ws-03', 'Military Domain Linux workstation.', 'linux.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (7, 3, 'mil-ws-04', 4, '10.1.4.14', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (7, 7, 'mil-ws-04', 'Military Domain Linux workstation.', 'linux.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (8, 3, 'mil-ws-05', 5, '10.1.4.15', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (8, 8, 'mil-ws-05', 'Military Domain Linux workstation.', 'linux.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (9, 3, 'mil-ws-06', 6, '10.1.4.16', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (9, 9, 'mil-ws-06', 'Military Domain Linux workstation.', 'linux.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (10, 3, 'mil-ws-07', 7, '10.1.4.17', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (10, 10, 'mil-ws-07', 'Military Domain Linux workstation.', 'linux.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (11, 3, 'mil-ws-08', 8, '10.1.4.18', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (11, 11, 'mil-ws-08', 'Military Domain Linux workstation.', 'linux.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (12, 4, 'mil DC', 1, '10.1.0.2', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (12, 12, 'mil DC', 'Domain controller for the Military Intranet.', 'linux.svg', false);


-- hosts and services for team 'netag1' (team_id 2)
INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (13, 5, 'OPNS Firewall', 1, '10.1.242.21/24
10.1.1.1/24
10.1.3.1/24
10.1.5.1/24', '', '#acd8aa');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (13, 13, 'OPNS Firewall', 'Perimeter firewall protecting the NETAG Domain and routing traffic between DMZ, Intranet, and LAN.', 'firewall.svg', true);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (14, 6, 'Intranet', 1, '10.1.3.3', '', '#acd8aa');
INSERT INTO data.service (id, host_id, name, description, port, icon_name, exposed)
VALUES (14, 14, 'Intranet', 'NETAG intranet web application hosted in the DMZ.', 80, 'windows.svg', true);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (15, 6, 'Infranet', 2, '10.1.3.5', '', '#acd8aa');
INSERT INTO data.service (id, host_id, name, description, port, icon_name, exposed)
VALUES (15, 15, 'Infranet', 'NETAG infranet web application hosted in the DMZ.', 80, 'windows.svg', true);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (16, 7, 'netag-ws-01', 1, '10.1.5.2', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (16, 16, 'netag-ws-01', 'NETAG Domain Windows workstation.', 'windows.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (17, 7, 'netag-ws-02', 2, '10.1.5.3', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (17, 17, 'netag-ws-02', 'NETAG Domain Windows workstation.', 'windows.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (18, 7, 'netag-ws-03', 3, '10.1.5.4', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (18, 18, 'netag-ws-03', 'NETAG Domain Windows workstation.', 'windows.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (19, 7, 'netag-ws-04', 4, '10.1.5.5', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (19, 19, 'netag-ws-04', 'NETAG Domain Windows workstation.', 'windows.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (20, 7, 'netag-ws-05', 5, '10.1.5.6', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (20, 20, 'netag-ws-05', 'NETAG Domain Windows workstation.', 'windows.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (21, 7, 'netag-ws-06', 6, '10.1.5.7', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (21, 21, 'netag-ws-06', 'NETAG Domain Windows workstation.', 'windows.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (22, 8, 'netag DC', 1, '10.1.1.2', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (22, 22, 'netag DC', 'Domain controller for the NETAG Intranet.', 'windows.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (23, 8, 'netag FS', 2, '10.1.1.11', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (23, 23, 'netag FS', 'File server for the NETAG Intranet.', 'fileserver.svg', false);


-- hosts and services for team 'mil2' (team_id 3)
INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (24, 9, 'Linux Firewall', 1, '10.2.242.11/24
10.2.0.1/24
10.2.2.1/24
10.2.4.1/24', '', '#acd8aa');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (24, 24, 'Linux Firewall', 'Perimeter firewall protecting the Military Domain and routing traffic between DMZ, Intranet, and LAN.', 'firewall.svg', true);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (25, 10, 'tips Webserver', 1, '10.2.2.80/24', '', '#acd8aa');
INSERT INTO data.service (id, host_id, name, description, port, icon_name, exposed)
VALUES (25, 25, 'tips Webserver', 'Public web server available in the Military DMZ.', 80, 'tips.svg', true);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (26, 10, 'INTRANET', 2, '10.2.2.2/24', '', '#acd8aa');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (26, 26, 'INTRANET', 'Military intranet application hosted in the DMZ.', 'linux.svg', true);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (27, 11, 'mil-ws-01', 1, '10.2.4.11', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (27, 27, 'mil-ws-01', 'Military Domain Linux workstation.', 'linux.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (28, 11, 'mil-ws-02', 2, '10.2.4.12', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (28, 28, 'mil-ws-02', 'Military Domain Linux workstation.', 'linux.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (29, 11, 'mil-ws-03', 3, '10.2.4.13', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (29, 29, 'mil-ws-03', 'Military Domain Linux workstation.', 'linux.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (30, 11, 'mil-ws-04', 4, '10.2.4.14', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (30, 30, 'mil-ws-04', 'Military Domain Linux workstation.', 'linux.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (31, 11, 'mil-ws-05', 5, '10.2.4.15', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (31, 31, 'mil-ws-05', 'Military Domain Linux workstation.', 'linux.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (32, 11, 'mil-ws-06', 6, '10.2.4.16', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (32, 32, 'mil-ws-06', 'Military Domain Linux workstation.', 'linux.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (33, 11, 'mil-ws-07', 7, '10.2.4.17', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (33, 33, 'mil-ws-07', 'Military Domain Linux workstation.', 'linux.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (34, 11, 'mil-ws-08', 8, '10.2.4.18', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (34, 34, 'mil-ws-08', 'Military Domain Linux workstation.', 'linux.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (35, 12, 'mil DC', 1, '10.2.0.2', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (35, 35, 'mil DC', 'Domain controller for the Military Intranet.', 'linux.svg', false);


-- hosts and services for team 'netag2' (team_id 4)
INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (36, 13, 'OPNS Firewall', 1, '10.2.242.21/24
10.2.1.1/24
10.2.3.1/24
10.2.5.1/24', '', '#acd8aa');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (36, 36, 'OPNS Firewall', 'Perimeter firewall protecting the NETAG Domain and routing traffic between DMZ, Intranet, and LAN.', 'firewall.svg', true);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (37, 14, 'Intranet', 1, '10.2.3.3', '', '#acd8aa');
INSERT INTO data.service (id, host_id, name, description, port, icon_name, exposed)
VALUES (37, 37, 'Intranet', 'NETAG intranet web application hosted in the DMZ.', 80, 'windows.svg', true);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (38, 14, 'Infranet', 2, '10.2.3.5', '', '#acd8aa');
INSERT INTO data.service (id, host_id, name, description, port, icon_name, exposed)
VALUES (38, 38, 'Infranet', 'NETAG infranet web application hosted in the DMZ.', 80, 'windows.svg', true);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (39, 15, 'netag-ws-01', 1, '10.2.5.2', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (39, 39, 'netag-ws-01', 'NETAG Domain Windows workstation.', 'windows.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (40, 15, 'netag-ws-02', 2, '10.2.5.3', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (40, 40, 'netag-ws-02', 'NETAG Domain Windows workstation.', 'windows.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (41, 15, 'netag-ws-03', 3, '10.2.5.4', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (41, 41, 'netag-ws-03', 'NETAG Domain Windows workstation.', 'windows.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (42, 15, 'netag-ws-04', 4, '10.2.5.5', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (42, 42, 'netag-ws-04', 'NETAG Domain Windows workstation.', 'windows.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (43, 15, 'netag-ws-05', 5, '10.2.5.6', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (43, 43, 'netag-ws-05', 'NETAG Domain Windows workstation.', 'windows.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (44, 15, 'netag-ws-06', 6, '10.2.5.7', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (44, 44, 'netag-ws-06', 'NETAG Domain Windows workstation.', 'windows.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (45, 16, 'netag DC', 1, '10.2.1.2', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (45, 45, 'netag DC', 'Domain controller for the NETAG Intranet.', 'windows.svg', false);

INSERT INTO data.host (id, netplan_group_id, name, priority, ip_description, description, background_color_code)
VALUES (46, 16, 'netag FS', 2, '10.2.1.11', '', '#82c0cc');
INSERT INTO data.service (id, host_id, name, description, icon_name, exposed)
VALUES (46, 46, 'netag FS', 'File server for the NETAG Intranet.', 'fileserver.svg', false);