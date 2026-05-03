import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Demo users storage (in production, use database)
const demoUsers = [
  {
    id: '1',
    name: 'Satria Ady Chandra',
    email: 'kontenval.id@gmail.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-04-30',
    lastLogin: '2026-05-03'
  },
  {
    id: '2',
    name: 'Demo User',
    email: 'demo@example.com',
    role: 'MEMBER',
    status: 'ACTIVE',
    createdAt: '2026-05-01',
    lastLogin: '2026-05-02'
  }
]

// GET - List all users
export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if admin
  if (session.user?.email !== 'kontenval.id@gmail.com') {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  return NextResponse.json({
    success: true,
    users: demoUsers,
    meta: {
      total: demoUsers.length,
      admins: demoUsers.filter(u => u.role === 'ADMIN').length,
      members: demoUsers.filter(u => u.role === 'MEMBER').length
    }
  })
}

// POST - Create new user
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user?.email !== 'kontenval.id@gmail.com') {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { email, name, role } = body

    if (!email || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if email already exists
    if (demoUsers.some(u => u.email === email)) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }

    const newUser = {
      id: String(demoUsers.length + 1),
      name,
      email,
      role: role.toUpperCase(),
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Never'
    }

    demoUsers.push(newUser)

    return NextResponse.json({
      success: true,
      user: newUser
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// PUT - Update user role
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user?.email !== 'kontenval.id@gmail.com') {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { userId, role, status } = body

    const userIndex = demoUsers.findIndex(u => u.id === userId)
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent changing own role
    if (userId === '1' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Cannot change your own admin role' }, { status: 400 })
    }

    if (role) demoUsers[userIndex].role = role.toUpperCase()
    if (status) demoUsers[userIndex].status = status.toUpperCase()

    return NextResponse.json({
      success: true,
      user: demoUsers[userIndex]
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// DELETE - Remove user
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user?.email !== 'kontenval.id@gmail.com') {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('id')

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  // Prevent deleting self
  if (userId === '1') {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  const userIndex = demoUsers.findIndex(u => u.id === userId)
  if (userIndex === -1) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  demoUsers.splice(userIndex, 1)

  return NextResponse.json({
    success: true,
    message: 'User deleted'
  })
}