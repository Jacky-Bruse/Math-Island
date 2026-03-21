import { useNavigate } from 'react-router-dom'
import PageContainer from '../components/layout/PageContainer'
import BackButton from '../components/shared/BackButton'

const modules = [
  {
    key: 'add-subtract',
    title: '加减法',
    desc: '10 / 20 / 100 以内',
    path: '/arithmetic/add-subtract',
    className: 'bg-arithmetic-light border-arithmetic/20',
    icon: '🔢',
  },
  {
    key: 'multiplication',
    title: '乘法口诀',
    desc: '口诀表、跟读、理解、练习',
    path: '/arithmetic/multiplication',
    className: 'bg-[linear-gradient(135deg,#fff3e6,#ffe2d2)] border-[#f97316]/20',
    icon: '🍎',
  },
] as const

export default function ArithmeticSelectPage() {
  const navigate = useNavigate()

  return (
    <PageContainer>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <BackButton />
          <h1 className="text-2xl font-bold">算术岛</h1>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(255,248,240,0.88))] px-5 py-5 shadow-[0_20px_45px_rgba(249,115,22,0.08)] mb-5">
          <div className="text-sm font-semibold uppercase tracking-[0.28em] text-[#ea580c]/70">Math Orchard</div>
          <h2 className="mt-2 text-3xl font-black leading-tight text-text">今天想练哪一种算术？</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            加减法继续做题，乘法口诀则可以看整张口诀表、跟读节奏、理解每一句的意思。
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {modules.map(module => (
            <button
              key={module.key}
              onClick={() => navigate(module.path)}
              className={`w-full min-h-24 rounded-[1.75rem] border shadow-sm px-6 py-5 flex items-center justify-between active:scale-[0.98] transition-transform ${module.className}`}
            >
              <div className="flex items-center gap-4 text-left">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/75 text-3xl shadow-sm">
                  {module.icon}
                </div>
                <div>
                  <div className="text-xl font-bold text-text">{module.title}</div>
                  <div className="text-sm text-text-secondary">{module.desc}</div>
                </div>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
