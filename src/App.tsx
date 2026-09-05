import { About } from './sections/About'
import { CaseStudy } from './sections/CaseStudy'
import { Contact } from './sections/Contact'
import { Different } from './sections/Different'
import { Faq } from './sections/Faq'
import { Footer } from './sections/Footer'
import { Header } from './sections/Header'
import { Hero } from './sections/Hero'
import { Packages } from './sections/Packages'
import { Process } from './sections/Process'

export default function App() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-30 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Hero />
        <Different />
        <Packages />
        <Process />
        <CaseStudy />
        <About />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
