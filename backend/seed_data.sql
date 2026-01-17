INSERT INTO "Branches" ("Id", "Name", "Address", "Phone", "CreatedAt", "UpdatedAt")
VALUES ('b33f3888-2c26-4447-9206-8d5926c046e7', 'Bun Bo Hue Xua', '123 Nguyen Trai, Q1', '0901234567', NOW(), NOW())
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "RestaurantTables" ("Id", "TableCode", "Name", "Status", "BranchId", "CreatedAt", "UpdatedAt")
VALUES ('d88e0193-018f-410c-9923-086392131234', 'T01', 'Bàn 01', 0, 'b33f3888-2c26-4447-9206-8d5926c046e7', NOW(), NOW())
ON CONFLICT ("Id") DO NOTHING;
