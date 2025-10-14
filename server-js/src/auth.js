// ระบบ JWT Authentication และ RBAC
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in the environment variables. Please create a .env file and set the JWT_SECRET value.");
  process.exit(1);
}

// สร้าง JWT token
export function signToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' })
}

// ตรวจสอบ JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (err) {
    return null
  }
}

// Middleware ตรวจสอบการล็อกอิน
export function authRequired(req, res, next) {
  const authHeader = req.headers.authorization
  // console.log('authHeader:', authHeader);
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' })
  }
  
  const token = authHeader.substring(7)
  // console.log('Received token:', token);
  const user = verifyToken(token)
  if (!user) {
    // console.log('Token verification failed');
    return res.status(401).json({ message: 'Invalid token' })
  }
  
  req.user = user
  next()
}

// กำหนดสิทธิ์เข้าถึงโมดูลต่างๆ ตาม role
const rolePermissions = {
  admin: ['dashboard', 'users', 'requests', 'manage_requests', 'forms_download', 'forms_submit', 'disbursements'],
  planner: ['dashboard', 'requests', 'manage_requests', 'forms_download', 'forms_submit', 'disbursements'],
  procurement: ['dashboard', 'manage_requests', 'forms_download', 'forms_submit'],
  board: ['dashboard', 'requests', 'forms_download']
}

// Middleware ตรวจสอบสิทธิ์เข้าถึงโมดูล
export function allowModules(...modules) {
  return (req, res, next) => {
    const userRole = req.user?.role
    if (!userRole) {
      return res.status(401).json({ message: 'User role not found' })
    }
    
    const userPermissions = rolePermissions[userRole] || []
    const hasPermission = modules.some(module => userPermissions.includes(module))
    
    if (!hasPermission) {
      return res.status(403).json({ message: 'Access denied' })
    }
    
    next()
  }
}