const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config(); 

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://user:password@task-app-db:5432/taskdb',
});

app.get('/api/tasks', async (req, res) => {
  try {
    // PostgreSQL からタスク情報を取得
    const result = await pool.query('SELECT * FROM tasks');
    res.status(200).json(result.rows);  // タスク情報を返す
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});

//タスクの追加
app.post('/api/tasks', (req, res) => {
  const { title, description } = req.body; // フロントエンドから送られるデータ

  const query = {
    text: 'INSERT INTO tasks(title, description) VALUES($1, $2) RETURNING *',
    values: [title, description],
  };

  pool
    .query(query)
    .then((result) => res.status(201).json(result.rows[0])) // 追加したタスクを返す
    .catch((err) => res.status(500).json({ error: err.message }));
});

//タスクの更新
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  const query = {
    text: 'UPDATE tasks SET title = $1, description = $2 WHERE id = $3 RETURNING *',
    values: [title, description, id],
  };

  pool
    .query(query)
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(result.rows[0]);
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

//タスクの削除
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