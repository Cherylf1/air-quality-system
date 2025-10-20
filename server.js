const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 数据库配置（请修改为你的MySQL信息）
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'fyy161200',
  database: 'air_quality_system'
};

// 登录接口
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 连接数据库
    const connection = await mysql.createConnection(dbConfig);
    
connection.on('error', (err) => {
  console.error('Database connection error:', err);
});
    
    // 查询用户
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    connection.end();

    // 验证用户存在性
    if (rows.length === 0) {
      return res.json({ success: false, message: 'Invalid username or password' });
    }

    // 验证密码
    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (isPasswordValid) {
      return res.json({ success: true, message: 'Login successful' });
    } else {
      return res.json({ success: false, message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 注册接口
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 连接数据库
    const connection = await mysql.createConnection(dbConfig);

    // 检查用户名是否已存在
    const [existingUsers] = await connection.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      connection.end();
      return res.json({ success: false, message: 'Username already exists' });
    }

    // 密码加密（10轮盐值）
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入新用户
    await connection.execute(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );

    connection.end();
    return res.json({ success: true, message: 'Registration successful' });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});