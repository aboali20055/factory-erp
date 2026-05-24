-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ready_stock" (
    "id" SERIAL NOT NULL,
    "model_code" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "opening_balance" INTEGER NOT NULL DEFAULT 0,
    "cost_per_piece" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "location" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ready_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabric_entries" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "material_type" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "qty_in" DECIMAL(65,30) NOT NULL,
    "cost_per_kg" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fabric_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accessory_entries" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "item_name" TEXT NOT NULL,
    "qty_in" DECIMAL(65,30) NOT NULL,
    "qty_consumed" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cost" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accessory_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cutting_orders" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "cut_number" INTEGER NOT NULL,
    "cut_description" TEXT NOT NULL,
    "material_type" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "layers_count" INTEGER NOT NULL,
    "spread_length_m" DECIMAL(65,30) NOT NULL,
    "total_pieces" INTEGER NOT NULL,
    "kg_consumed" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cutting_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_productions" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "cutting_order_id" INTEGER NOT NULL,
    "model_code" TEXT NOT NULL,
    "model_description" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sizes" TEXT,
    "qty_from_cutting" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "wastage" INTEGER NOT NULL DEFAULT 0,
    "qty_received" INTEGER,
    "warehouse_entry_date" TIMESTAMP(3),
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "model_productions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" SERIAL NOT NULL,
    "order_number" TEXT NOT NULL,
    "row_number" INTEGER NOT NULL,
    "marketer_id" INTEGER,
    "marketer_name" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "client_mobile" TEXT,
    "invoice_value" DECIMAL(65,30) NOT NULL,
    "deposit_paid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "deposit_receiver_id" INTEGER,
    "remaining" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "shipping_number" TEXT,
    "shipping_collected" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "order_status" TEXT NOT NULL DEFAULT 'NOT_DISPATCHED',
    "delivery_method" TEXT,
    "warehouse_location" TEXT,
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" SERIAL NOT NULL,
    "sale_id" INTEGER NOT NULL,
    "ready_stock_id" INTEGER,
    "model_code" TEXT NOT NULL,
    "model_name" TEXT,
    "color" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(65,30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_items" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sale_id" INTEGER,
    "client_name" TEXT NOT NULL,
    "returned_by_id" INTEGER,
    "refund_paid_by_id" INTEGER,
    "model_code" TEXT NOT NULL,
    "model_color" TEXT NOT NULL,
    "model_qty" INTEGER NOT NULL,
    "refund_amount" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_records" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "operation_type" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_lines" (
    "id" SERIAL NOT NULL,
    "expense_record_id" INTEGER NOT NULL,
    "partner_id" INTEGER NOT NULL,
    "amount_in" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "amount_out" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "expense_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debts" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "creditor" TEXT NOT NULL,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "amount_paid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remaining" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_accounts" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "client_name" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "amount_paid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remaining" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_logs" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "received_by_id" INTEGER,
    "sale_id" INTEGER,
    "debt_id" INTEGER,
    "client_account_id" INTEGER,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "partners_name_key" ON "partners"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ready_stock_model_code_color_key" ON "ready_stock"("model_code", "color");

-- CreateIndex
CREATE INDEX "ready_stock_model_code_idx" ON "ready_stock"("model_code");

-- CreateIndex
CREATE INDEX "fabric_entries_material_type_color_idx" ON "fabric_entries"("material_type", "color");

-- CreateIndex
CREATE INDEX "accessory_entries_item_name_idx" ON "accessory_entries"("item_name");

-- CreateIndex
CREATE UNIQUE INDEX "cutting_orders_cut_number_key" ON "cutting_orders"("cut_number");

-- CreateIndex
CREATE INDEX "cutting_orders_cut_number_idx" ON "cutting_orders"("cut_number");

-- CreateIndex
CREATE INDEX "cutting_orders_material_type_color_idx" ON "cutting_orders"("material_type", "color");

-- CreateIndex
CREATE INDEX "model_productions_model_code_idx" ON "model_productions"("model_code");

-- CreateIndex
CREATE INDEX "model_productions_cutting_order_id_idx" ON "model_productions"("cutting_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_order_number_key" ON "sales"("order_number");

-- CreateIndex
CREATE INDEX "sales_order_number_idx" ON "sales"("order_number");

-- CreateIndex
CREATE INDEX "sales_order_status_idx" ON "sales"("order_status");

-- CreateIndex
CREATE INDEX "sales_marketer_name_idx" ON "sales"("marketer_name");

-- CreateIndex
CREATE INDEX "sale_items_sale_id_idx" ON "sale_items"("sale_id");

-- CreateIndex
CREATE INDEX "sale_items_model_code_idx" ON "sale_items"("model_code");

-- CreateIndex
CREATE INDEX "expense_records_date_idx" ON "expense_records"("date");

-- CreateIndex
CREATE INDEX "expense_records_operation_type_idx" ON "expense_records"("operation_type");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- AddForeignKey
ALTER TABLE "model_productions" ADD CONSTRAINT "model_productions_cutting_order_id_fkey" FOREIGN KEY ("cutting_order_id") REFERENCES "cutting_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_deposit_receiver_id_fkey" FOREIGN KEY ("deposit_receiver_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_ready_stock_id_fkey" FOREIGN KEY ("ready_stock_id") REFERENCES "ready_stock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_refund_paid_by_id_fkey" FOREIGN KEY ("refund_paid_by_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_lines" ADD CONSTRAINT "expense_lines_expense_record_id_fkey" FOREIGN KEY ("expense_record_id") REFERENCES "expense_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_lines" ADD CONSTRAINT "expense_lines_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_logs" ADD CONSTRAINT "payment_logs_received_by_id_fkey" FOREIGN KEY ("received_by_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_logs" ADD CONSTRAINT "payment_logs_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_logs" ADD CONSTRAINT "payment_logs_debt_id_fkey" FOREIGN KEY ("debt_id") REFERENCES "debts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_logs" ADD CONSTRAINT "payment_logs_client_account_id_fkey" FOREIGN KEY ("client_account_id") REFERENCES "client_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
