import { Link } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
const Footer = () => {
  const { pathname } = useLocation()
  const isHome = pathname === '/' || pathname === '/staking'

  return (
    <footer className="fixed bottom-0 right-0 left-0 bg-[#1A1C1F] border-t border-t-[#444444] h-[50px] px-2">
      {isHome && <div className="flex justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/imgs/logo.png" alt="pixelpump-logo" width={30} height={30} />
        </Link>
        <div className="flex gap-x-[12px] items-center p-1">
          <button className="border-2 border-[#6e6e6e] w-[43px] h-[43px] flex items-center justify-center bg-transparent">
            <img src="/imgs/x-logo.webp" width={24} height={24} alt="x-logo" />
          </button>
          <button className="border-2 border-[#6e6e6e] w-[43px] h-[43px] flex items-center justify-center bg-transparent">
            <img src="/imgs/telegram.png" width={24} height={24} alt="telegram-logo" />
          </button>
        </div>
      </div>
      }
      {
        !isHome && <div className="flex justify-center">
          <h5 className="text-white text-[27px]">DAPP LAUNCH <span className="text-[#EDFF02]">SOON</span></h5>
        </div>
      }
    </footer>
  )
}

export default Footer