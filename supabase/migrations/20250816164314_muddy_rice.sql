/*
  # إنشاء جدول تحليل البيانات والتفاعلات

  1. جداول جديدة
    - `user_interactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, optional - للمستخدمين المسجلين)
      - `session_id` (text, required - لتتبع الجلسات)
      - `interaction_type` (text, required - نوع التفاعل)
      - `content` (text, required - محتوى التفاعل)
      - `metadata` (jsonb, optional - بيانات إضافية)
      - `created_at` (timestamp)

  2. الأمان
    - تفعيل RLS على جدول `user_interactions`
    - سياسة للمستخدمين المصرح لهم لقراءة بياناتهم
    - سياسة للضيوف لإدراج البيانات
*/

-- إنشاء جدول تفاعلات المستخدمين
CREATE TABLE IF NOT EXISTS user_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  interaction_type text NOT NULL CHECK (interaction_type IN ('message_sent', 'itinerary_generated', 'itinerary_edited', 'feedback_given', 'conversation_deleted')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- سياسة للمستخدمين المسجلين لقراءة بياناتهم
CREATE POLICY "Users can read own interactions"
  ON user_interactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- سياسة للمستخدمين المسجلين لإدراج بياناتهم
CREATE POLICY "Users can insert own interactions"
  ON user_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- سياسة للضيوف لإدراج البيانات
CREATE POLICY "Guests can insert interactions"
  ON user_interactions
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

-- سياسة للضيوف لقراءة بياناتهم
CREATE POLICY "Guests can read own session interactions"
  ON user_interactions
  FOR SELECT
  TO anon
  USING (
    user_id IS NULL 
    AND session_id = ((current_setting('request.headers'::text))::json ->> 'x-session-id'::text)
  );

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_session_id ON user_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON user_interactions(created_at);

-- إنشاء جدول إحصائيات مجمعة (اختياري للأداء)
CREATE TABLE IF NOT EXISTS analytics_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- تفعيل RLS على جدول الإحصائيات
ALTER TABLE analytics_summary ENABLE ROW LEVEL SECURITY;

-- سياسة للمشرفين فقط لقراءة الإحصائيات المجمعة
CREATE POLICY "Only admins can read analytics summary"
  ON analytics_summary
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.email LIKE '%@admin.%'
    )
  );