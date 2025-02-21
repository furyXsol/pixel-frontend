import { Outlet } from "react-router-dom"
import Header from './header'
import Footer from './footer'
const Layout = () => {
  return (
    <main>
      <Header />
      <Outlet />
      <Footer />
    </main>
  )
}

export default Layout