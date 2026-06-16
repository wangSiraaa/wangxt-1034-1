import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { Bell, LayoutDashboard, Users, Calendar, MapPin, Home, Settings, User, Sun, Sparkles } from 'lucide-react';
import { StatusBadge } from './ui';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUserId, users, notifications, setCurrentUser, markNotificationRead } = useAppStore();
  const currentUser = users.find(u => u.id === currentUserId);
  const unreadCount = notifications.filter(n => n.userId === currentUserId && !n.read).length;

  const roleNav = {
    club_leader: [
      { path: '/club/dashboard', label: '工作台', icon: LayoutDashboard },
      { path: '/club/courses', label: '我的课程', icon: Calendar },
      { path: '/club/courses/new', label: '提交新课程', icon: Settings },
    ],
    venue_admin: [
      { path: '/admin/dashboard', label: '工作台', icon: LayoutDashboard },
      { path: '/admin/approvals', label: '课程审核', icon: Users },
      { path: '/admin/venues', label: '场馆管理', icon: MapPin },
      { path: '/admin/scheduling', label: '排课中心', icon: Calendar },
      { path: '/admin/summer-camp', label: '暑期班管理', icon: Sun },
      { path: '/admin/blacklist', label: '黑名单', icon: Settings },
    ],
    resident: [
      { path: '/resident/dashboard', label: '首页', icon: Home },
      { path: '/resident/summer-courses', label: '暑期班', icon: Sparkles },
      { path: '/resident/courses', label: '课程列表', icon: Calendar },
      { path: '/resident/my', label: '我的报名', icon: Users },
      { path: '/resident/checkin', label: '签到中心', icon: Bell },
    ],
  };

  const navItems = currentUser ? roleNav[currentUser.role] : [];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">社区兴趣团课</h1>
          <p className="text-xs text-gray-500 mt-1">Community Class Platform</p>
        </div>

        <div className="p-4 border-b border-gray-200">
          <label className="block text-xs text-gray-500 mb-2">切换角色体验</label>
          <select
            value={currentUserId}
            onChange={(e) => {
              setCurrentUser(e.target.value);
              const user = users.find(u => u.id === e.target.value);
              if (user) {
                const redirects: Record<string, string> = {
                  club_leader: '/club/dashboard',
                  venue_admin: '/admin/dashboard',
                  resident: '/resident/dashboard',
                };
                navigate(redirects[user.role]);
              }
            }}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} - {{
                  club_leader: '社团负责人',
                  venue_admin: '场馆管理员',
                  resident: '居民',
                }[u.role]}
              </option>
            ))}
          </select>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User size={20} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{currentUser?.name}</p>
              <p className="text-xs text-gray-500">{{
                club_leader: '社团负责人',
                venue_admin: '场馆管理员',
                resident: '社区居民',
              }[currentUser?.role || 'resident']}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {navItems.find(n => location.pathname.startsWith(n.path))?.label || ''}
          </h2>
          <div className="relative">
            <button
              onClick={() => navigate('/resident/notifications')}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
