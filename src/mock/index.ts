import Mock from 'mockjs'

// ============ 认证模块 (文档 §2) ============

Mock.mock('/api/v1/auth/login', 'post', () => {
  return {
    code: 200,
    message: 'success',
    data: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-token',
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-refresh-token',
      user: {
        id: 1,
        phone: '13800000000',
        email: 'admin@investment.com',
        userType: 'ADMIN',
        realName: '管理员',
        avatarUrl: null,
        status: 'active',
        isVerified: true,
      },
    },
  }
})

Mock.mock('/api/v1/auth/logout', 'post', () => {
  return { code: 200, message: 'success', data: null }
})

Mock.mock('/api/v1/auth/refresh', 'post', () => {
  return {
    code: 200,
    message: 'success',
    data: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-new-token',
      expiresAt: Date.now() + 7200000,
    },
  }
})

// ============ 管理员Dashboard (文档 §18.1) ============

Mock.mock('/api/v1/admin/dashboard', 'get', () => {
  return {
    code: 200,
    message: 'success',
    data: {
      totalUsers: 245,
      investorCount: 156,
      entrepreneurCount: 89,
      todayNewUsers: 5,
      totalProjects: 40,
      publishedTeaserCount: 25,
      pendingVerificationCount: 12,
      pendingApplicationCount: 8,
      totalViewCount: 5000,
      totalFavoriteCount: 200,
      activeUserCount: 45,
    },
  }
})

// ============ 用户管理 (文档 §18.2) ============

Mock.mock(/\/api\/v1\/admin\/users(\?.*)?$/, 'get', (options: any) => {
  const url = new URL('http://localhost' + options.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const size = parseInt(url.searchParams.get('size') || '10')
  const userType = url.searchParams.get('userType') || ''
  const status = url.searchParams.get('status') || ''
  const keyword = url.searchParams.get('keyword') || ''

  const allUsers = Mock.mock({
    'list|50': [
      {
        'id|+1': 1,
        'phone': /^1[3-9]\d{9}$/,
        'email': '@email',
        'userType|1': ['INVESTOR', 'ENTREPRENEUR'],
        'realName': '@cname',
        'avatarUrl': null,
        'status|1': ['active', 'pending', 'inactive', 'banned'],
        'isVerified|1': [true, false],
        'createdAt': '@datetime("yyyy-MM-dd HH:mm:ss")',
        'updatedAt': '@datetime("yyyy-MM-dd HH:mm:ss")',
        'lastLoginAt': '@datetime("yyyy-MM-dd HH:mm:ss")',
      },
    ],
  }).list

  let filtered = allUsers
  if (userType) filtered = filtered.filter((u: any) => u.userType === userType)
  if (status) filtered = filtered.filter((u: any) => u.status === status)
  if (keyword) filtered = filtered.filter((u: any) => (u.realName && u.realName.includes(keyword)) || u.phone.includes(keyword))

  const start = (page - 1) * size
  const paged = filtered.slice(start, start + size)

  // Spring Data 分页格式 (文档 §1.3)
  return {
    code: 200,
    message: 'success',
    data: {
      content: paged,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
      number: page - 1,
      size: size,
      first: page === 1,
      last: start + size >= filtered.length,
      numberOfElements: paged.length,
    },
  }
})

// 更新用户状态 (文档 §18.3)
Mock.mock(/\/api\/v1\/admin\/users\/\d+\/status/, 'put', () => {
  return { code: 200, message: '操作成功', data: null }
})

// 删除用户
Mock.mock(/\/api\/v1\/admin\/users\/\d+$/, 'delete', () => {
  return { code: 200, message: '删除成功', data: null }
})

// ============ 认证管理 (文档 §18.4-18.6) ============

Mock.mock(/\/api\/v1\/admin\/verifications(\?.*)?$/, 'get', (options: any) => {
  const url = new URL('http://localhost' + options.url)
  const status = url.searchParams.get('status') || 'pending'

  const pendingList = [
    {
      id: 1, userId: 2, verificationType: 'ENTREPRENEUR', realName: '李明',
      idCardNumber: null, idCardFrontUrl: '/uploads/id1.jpg', idCardBackUrl: '/uploads/id2.jpg',
      businessLicenseUrl: '/uploads/license1.jpg', businessCardUrl: '/uploads/card1.jpg',
      companyName: '智能供应链科技有限公司', position: 'CEO',
      contactPhone: '138****8888', contactEmail: 'liming@company.com',
      verificationStatus: 'pending', rejectReason: null, adminNotes: null,
      reviewedBy: null, reviewedAt: null, createdAt: '2026-04-09 14:30:00', updatedAt: '2026-04-09 14:30:00',
      documents: [
        { type: 'business_card', label: '名片', status: 'pending', url: '/uploads/card1.jpg' },
        { type: 'business_license', label: '营业执照', status: 'pending', url: '/uploads/license1.jpg' },
        { type: 'id_card', label: '实名认证', status: 'pending', url: '/uploads/id1.jpg' },
      ],
    },
    {
      id: 2, userId: 3, verificationType: 'INVESTOR', realName: '王总',
      idCardNumber: null, idCardFrontUrl: '/uploads/id3.jpg', idCardBackUrl: '/uploads/id4.jpg',
      businessLicenseUrl: '/uploads/license2.jpg', businessCardUrl: '/uploads/card2.jpg',
      companyName: '红杉资本', position: '合伙人',
      contactPhone: '139****9999', contactEmail: 'wang@sequoiacap.com',
      verificationStatus: 'pending', rejectReason: null, adminNotes: null,
      reviewedBy: null, reviewedAt: null, createdAt: '2026-04-08 10:15:00', updatedAt: '2026-04-08 10:15:00',
      documents: [
        { type: 'business_card', label: '名片', status: 'pending', url: '/uploads/card2.jpg' },
        { type: 'business_license', label: '营业执照', status: 'approved', url: '/uploads/license2.jpg' },
        { type: 'id_card', label: '实名认证', status: 'approved', url: '/uploads/id3.jpg' },
      ],
    },
  ]

  const approvedList = [
    {
      id: 3, userId: 4, verificationType: 'ENTREPRENEUR', realName: '张三',
      idCardNumber: null, idCardFrontUrl: '/uploads/id5.jpg', idCardBackUrl: '/uploads/id6.jpg',
      businessLicenseUrl: '/uploads/license3.jpg', businessCardUrl: '/uploads/card3.jpg',
      companyName: '创新科技有限公司', position: 'CTO',
      contactPhone: '137****7777', contactEmail: 'zhangsan@innovation.com',
      verificationStatus: 'approved', rejectReason: null, adminNotes: '材料齐全，审核通过',
      reviewedBy: 1, reviewedAt: '2026-04-07 16:45:00', createdAt: '2026-04-07 10:00:00', updatedAt: '2026-04-07 16:45:00',
      documents: [
        { type: 'business_card', label: '名片', status: 'approved', url: '/uploads/card3.jpg' },
        { type: 'business_license', label: '营业执照', status: 'approved', url: '/uploads/license3.jpg' },
        { type: 'id_card', label: '实名认证', status: 'approved', url: '/uploads/id5.jpg' },
      ],
    },
  ]

  const rejectedList = [
    {
      id: 4, userId: 5, verificationType: 'INVESTOR', realName: '赵总',
      idCardNumber: null, idCardFrontUrl: '/uploads/id7.jpg', idCardBackUrl: '/uploads/id8.jpg',
      businessLicenseUrl: '/uploads/license4.jpg', businessCardUrl: '/uploads/card4.jpg',
      companyName: '某投资机构', position: '投资总监',
      contactPhone: '136****6666', contactEmail: 'zhao@invest.com',
      verificationStatus: 'rejected', rejectReason: '营业执照模糊不清，请重新上传清晰的营业执照照片', adminNotes: null,
      reviewedBy: 1, reviewedAt: '2026-04-06 10:30:00', createdAt: '2026-04-06 08:00:00', updatedAt: '2026-04-06 10:30:00',
      documents: [
        { type: 'business_card', label: '名片', status: 'rejected', url: '/uploads/card4.jpg' },
        { type: 'business_license', label: '营业执照', status: 'rejected', url: '/uploads/license4.jpg' },
        { type: 'id_card', label: '实名认证', status: 'rejected', url: '/uploads/id7.jpg' },
      ],
    },
  ]

  let list = status === 'approved' ? approvedList : status === 'rejected' ? rejectedList : pendingList

  return {
    code: 200,
    message: 'success',
    data: {
      content: list,
      totalElements: list.length,
      totalPages: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
      numberOfElements: list.length,
    },
  }
})

// 审核认证 (文档 §18.6 - POST /review)
Mock.mock(/\/api\/v1\/admin\/verifications\/\d+\/review/, 'post', () => {
  return { code: 200, message: '操作成功', data: null }
})

// ============ 角色权限管理 ============

Mock.mock('/api/v1/admin/roles', 'get', () => {
  return {
    code: 200,
    message: 'success',
    data: [
      { id: 2, roleCode: 'investor', roleName: '投资人', description: '可以查看Teaser、申请获取BP、提问等功能', roleLevel: 1, isSystem: true, isEnabled: true, permissionsCount: 8, usersCount: 156 },
      { id: 3, roleCode: 'entrepreneur', roleName: '融资用户', description: '可以上传BP、管理Teaser、回复投资人问题', roleLevel: 1, isSystem: true, isEnabled: true, permissionsCount: 10, usersCount: 89 },
      { id: 5, roleCode: 'vip_investor', roleName: 'VIP投资人', description: '拥有更多权限，可以直接查看BP和联系方式', roleLevel: 2, isSystem: false, isEnabled: true, permissionsCount: 12, usersCount: 12 },
      { id: 1, roleCode: 'admin', roleName: '管理员', description: '拥有后台管理权限，可以管理用户和内容', roleLevel: 10, isSystem: true, isEnabled: true, permissionsCount: 23, usersCount: 5 },
      { id: 6, roleCode: 'disabled', roleName: '已禁用用户', description: '账号已被禁用，无法访问平台功能', roleLevel: 0, isSystem: false, isEnabled: true, permissionsCount: 0, usersCount: 3 },
    ],
  }
})

Mock.mock(/\/api\/v1\/admin\/roles\/\d+$/, 'get', (options: any) => {
  const id = parseInt(options.url.match(/\/api\/v1\/admin\/roles\/(\d+)/)[1])
  const rolePermissions: Record<number, any> = {
    2: {
      permissions: [
        { id: 10, permissionCode: 'teaser.view', permissionName: '查看Teaser列表', description: '查看Teaser列表和详情', module: 'teaser', permissionType: 'menu', isEnabled: true, sortOrder: 0 },
        { id: 13, permissionCode: 'application.view', permissionName: '搜索Teaser', description: '搜索Teaser', module: 'application', permissionType: 'menu', isEnabled: true, sortOrder: 0 },
        { id: 12, permissionCode: 'teaser.analyze', permissionName: 'AI投资分析', description: '使用AI进行投资分析', module: 'teaser', permissionType: 'menu', isEnabled: true, sortOrder: 0 },
        { id: 16, permissionCode: 'qa.view', permissionName: '查看公开问答', description: '查看公开问答', module: 'qa', permissionType: 'menu', isEnabled: true, sortOrder: 0 },
        { id: 17, permissionCode: 'qa.ask', permissionName: '向融资用户提问', description: '向融资方提问', module: 'qa', permissionType: 'menu', isEnabled: true, sortOrder: 0 },
        { id: 11, permissionCode: 'teaser.create', permissionName: '管理问题库', description: '生成项目Teaser', module: 'teaser', permissionType: 'menu', isEnabled: true, sortOrder: 0 },
        { id: 14, permissionCode: 'application.approve', permissionName: '申请获取BP', description: '审核通过申请', module: 'application', permissionType: 'menu', isEnabled: true, sortOrder: 0 },
        { id: 15, permissionCode: 'application.reject', permissionName: '申请联系企业', description: '拒绝申请', module: 'application', permissionType: 'menu', isEnabled: true, sortOrder: 0 },
        { id: 7, permissionCode: 'project.edit', permissionName: '直接查看完整BP', description: '编辑项目信息', module: 'project', permissionType: 'menu', isEnabled: false, sortOrder: 0 },
        { id: 3, permissionCode: 'user.delete', permissionName: '直接查看联系方式', description: '删除用户', module: 'user', permissionType: 'menu', isEnabled: false, sortOrder: 0 },
        { id: 19, permissionCode: 'admin.view', permissionName: '后台管理', description: '访问管理后台', module: 'admin', permissionType: 'menu', isEnabled: false, sortOrder: 0 },
        { id: 8, permissionCode: 'project.delete', permissionName: '删除内容', description: '删除项目', module: 'project', permissionType: 'menu', isEnabled: false, sortOrder: 0 },
      ],
      users: [
        { id: 3, realName: '王总', avatarUrl: null, userType: 'INVESTOR' },
        { id: 6, realName: '张总', avatarUrl: null, userType: 'INVESTOR' },
        { id: 7, realName: '刘经理', avatarUrl: null, userType: 'INVESTOR' },
        { id: 8, realName: '陈总', avatarUrl: null, userType: 'INVESTOR' },
        { id: 9, realName: '赵总', avatarUrl: null, userType: 'INVESTOR' },
        { id: 10, realName: '孙总', avatarUrl: null, userType: 'INVESTOR' },
        { id: 11, realName: '周总', avatarUrl: null, userType: 'INVESTOR' },
        { id: 12, realName: '吴总', avatarUrl: null, userType: 'INVESTOR' },
      ],
    },
  }
  return { code: 200, message: 'success', data: rolePermissions[id] || { permissions: [], users: [] } }
})

Mock.mock(/\/api\/v1\/admin\/roles\/\d+/, 'put', () => ({ code: 200, message: '保存成功', data: null }))
Mock.mock('/api/v1/admin/roles', 'post', () => ({ code: 200, message: '创建成功', data: null }))
Mock.mock(/\/api\/v1\/admin\/roles\/\d+/, 'delete', () => ({ code: 200, message: '删除成功', data: null }))

// ============ 数据统计（扩展接口） ============

Mock.mock(/\/api\/v1\/admin\/statistics(\?.*)?$/, 'get', () => {
  return {
    code: 200,
    message: 'success',
    data: {
      totalUsers: 245, activeUsers: 189, newUsers: 28, verifyRate: 95,
      totalUsersTrend: 12, activeUsersTrend: 8, newUsersTrend: 15, verifyRateTrend: 3,
      teaserCount: 156, bpRequestCount: 89, qaCount: 342, contactRequestCount: 56,
      teaserTrend: 20, bpRequestTrend: 25, qaTrend: 18, contactTrend: 10,
      avgReviewTime: 2.5, reviewPassRate: 95, pendingCount: 12, todayProcessed: 28,
      avgReviewTimeTrend: -15, reviewPassRateTrend: 2, todayProcessedTrend: 8,
      featureUsage: [
        { name: 'Teaser浏览', value: 2456, trend: 22 },
        { name: 'BP查看', value: 456, trend: 28 },
        { name: 'AI分析使用', value: 234, trend: 35 },
        { name: '问答互动', value: 342, trend: 18 },
      ],
      userTypeDistribution: [
        { type: '投资人', count: 156, percentage: 64 },
        { type: '融资用户', count: 89, percentage: 36 },
      ],
      userGrowthTrend: Array.from({ length: 30 }, (_, i) => ({
        date: `2026-04-${String(i + 1).padStart(2, '0')}`,
        value: Math.floor(Math.random() * 20) + 5,
        value2: Math.floor(Math.random() * 15) + 3,
      })),
      platformActivity: Array.from({ length: 30 }, (_, i) => ({
        date: `2026-04-${String(i + 1).padStart(2, '0')}`,
        value: Math.floor(Math.random() * 100) + 50,
        value2: Math.floor(Math.random() * 80) + 30,
      })),
    },
  }
})

console.log('[Mock] Mock数据已初始化 (API v1)')
