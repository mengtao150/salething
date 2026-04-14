-- 在 Supabase SQL Editor 中执行此脚本来创建数据表

-- 创建 items 表
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT '其他',
  platform VARCHAR(50) NOT NULL,
  buy_price DECIMAL(10,2) NOT NULL,
  buy_time TIMESTAMP WITH TIME ZONE NOT NULL,
  expected_sell_price DECIMAL(10,2),
  shipping_fee DECIMAL(10,2),
  received BOOLEAN DEFAULT false,
  received_time TIMESTAMP WITH TIME ZONE,
  sold BOOLEAN DEFAULT false,
  actual_sell_price DECIMAL(10,2),
  sell_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE items
ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT '其他';

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_items_updated_at BEFORE UPDATE
  ON items FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全（可选，如果需要多用户）
-- ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 如果需要 RLS 策略（多用户场景），取消下面的注释
-- CREATE POLICY "所有人可以查看物品" ON items
--   FOR SELECT USING (true);
--
-- CREATE POLICY "所有人可以插入物品" ON items
--   FOR INSERT WITH CHECK (true);
--
-- CREATE POLICY "所有人可以更新物品" ON items
--   FOR UPDATE USING (true);
--
-- CREATE POLICY "所有人可以删除物品" ON items
--   FOR DELETE USING (true);
