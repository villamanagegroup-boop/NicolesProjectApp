// Small role pill used in sidebars to mark "Admin" vs "Member" next to a
// user's name. Single component so the two badges stay visually identical
// — only the color flips with the role.

const ADMIN_BG     = 'rgba(184,134,46,0.12)'
const ADMIN_FG     = '#B8862E'
const ADMIN_BORDER = 'rgba(184,134,46,0.3)'

const MEMBER_BG     = 'rgba(31,92,58,0.1)'
const MEMBER_FG     = '#1F5C3A'
const MEMBER_BORDER = 'rgba(31,92,58,0.2)'

export default function RoleBadge({ role }: { role: 'admin' | 'member' }) {
  const isAdmin = role === 'admin'
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      width: 'fit-content',
      fontSize: '9px',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      padding: '2px 7px',
      borderRadius: '999px',
      background: isAdmin ? ADMIN_BG : MEMBER_BG,
      color: isAdmin ? ADMIN_FG : MEMBER_FG,
      border: `1px solid ${isAdmin ? ADMIN_BORDER : MEMBER_BORDER}`,
      fontFamily: 'var(--font-body)',
      lineHeight: 1.2,
    }}>
      {isAdmin ? 'Admin' : 'Member'}
    </span>
  )
}
