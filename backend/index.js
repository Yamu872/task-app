const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// CORS設定：特定のオリジンを許可するように設定
const corsOptions = {
  origin: ['http://localhost:3001','http://localhost:3002','http://localhost:65376'], // フロントエンドのURLを指定
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // 許可するメソッド
  allowedHeaders: ['Content-Type', 'Authorization'], // 許可するヘッダー
};
app.use(cors(corsOptions));  // CORSミドルウェアを使用

app.use(express.json()); // JSONリクエストボディを解析

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://user:password@task-app-db:5432/taskdb',
});

// タスク一覧を取得
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, title, description, status, due_date, priority FROM tasks');
    res.status(200).json(result.rows);  // タスク情報を返す
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// タスク追加
app.post('/api/tasks', (req, res) => {
  const { title, description, status, due_date, priority } = req.body;  // due_date と priority を追加

  const query = {
    text: 'INSERT INTO tasks(title, description, status, due_date, priority) VALUES($1, $2, $3, $4, $5) RETURNING *',
    values: [title, description, status || 'pending', due_date, priority || 1], // default statusは 'pending', priorityは 1
  };

  pool
    .query(query)
    .then((result) => res.status(201).json(result.rows[0])) // 追加したタスクを返す
    .catch((err) => res.status(500).json({ error: err.message }));
});


// タスク更新
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, status, due_date, priority } = req.body;

  const query = {
    text: 'UPDATE tasks SET title = $1, description = $2, status = $3, due_date = $4, priority = $5 WHERE id = $6 RETURNING *',
    values: [title, description, status, due_date, priority, id],
  };

  pool
    .query(query)
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(result.rows[0]);
    })
    .catch((err) => {
      console.error('Error updating task:', err);
      res.status(500).json({ error: err.message });
    });
});


// タスク削除
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;

  const query = {
    text: 'DELETE FROM tasks WHERE id = $1 RETURNING *',
    values: [id],
  };

  pool
    .query(query)
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.status(204).send(); // 削除成功の場合、空のレスポンスを返す
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

// サーバーの起動
app.listen(5000, () => {
  console.log('Server running on port 5000');
});
